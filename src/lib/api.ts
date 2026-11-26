/**
 * RagaKu backend API client.
 *
 * Base URL comes from EXPO_PUBLIC_API_URL (set in app config / env). The
 * OpenRouter key is NEVER present in the app — the backend holds it
 * (PRD section 7). This client only talks to our own FastAPI backend.
 */
import Constants from 'expo-constants';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import type {
  ActivityLevel,
  BmiStandard,
  Gender,
  Goal,
} from './health';
import type { HealthScreening, Profile } from './model';

/**
 * Saat development di perangkat fisik, Expo Go memuat bundle dari komputer ini, jadi
 * alamat Metro-nya sudah diketahui (mis. "192.168.1.10:8081"). metro.config.js meneruskan
 * `/ragaku-api/*` dari Metro ke backend di komputer yang sama, sehingga HP cukup menjangkau
 * port Metro (yang sudah terbuka) dan firewall tidak perlu diubah. Tidak dipakai kalau
 * alamatnya localhost/loopback (emulator) atau bukan IP LAN (mode tunnel).
 */
function devServerProxyUrl(): string | null {
  // Proxy ini hanya ada selama dev server (Metro) berjalan; build rilis tidak punya hostUri.
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];
  if (!hostUri || !host || !/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith('127.')) {
    return null;
  }
  return `http://${hostUri}/ragaku-api`;
}

/**
 * Resolusi base URL backend.
 * Prioritas: EXPO_PUBLIC_API_URL (jika di-set) > proxy lewat Metro di komputer yang
 * menjalankan Expo (perangkat fisik, otomatis) > default per-platform.
 *
 * Default:
 * - Android emulator: 10.0.2.2 adalah alias ke localhost komputer host.
 * - Web / iOS simulator: localhost (mesin yang sama).
 *
 * Kalau backend berjalan di komputer lain, set EXPO_PUBLIC_API_URL,
 * mis. EXPO_PUBLIC_API_URL=http://192.168.1.10:8000
 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv;
  if (Platform.OS !== 'web') {
    const viaMetro = devServerProxyUrl();
    if (viaMetro) return viaMetro;
  }
  if (Platform.OS === 'android') return 'http://10.0.2.2:8000';
  return 'http://localhost:8000';
}

export const API_BASE_URL = resolveBaseUrl();

// The server gives each Gemini model 20 seconds and tries two, so a real answer or a clean
// "busy" error arrives well within this. It only stops the UI from spinning forever.
const PHOTO_TIMEOUT_MS = 60_000;

// --- wire types (snake_case to match the FastAPI contract) ----------------
interface WireProfile {
  age: number;
  gender: Gender;
  height_cm: number;
  weight_kg: number;
  activity_level: ActivityLevel;
  goal: Goal;
  diet_notes?: string | null;
}

function toWireProfile(p: Profile): WireProfile {
  return {
    age: p.age,
    gender: p.gender,
    height_cm: p.heightCm,
    weight_kg: p.weightKg,
    activity_level: p.activityLevel,
    goal: p.goal,
    diet_notes: p.dietNotes || null,
  };
}

export interface PlanExercise {
  name: string;
  type: string;
  duration_min: number;
  intensity: 'ringan' | 'sedang' | 'tinggi';
}

export interface PlanMealItem {
  name: string;
  calories: number;
  protein_g: number;
}

export interface PlanMealSlot {
  slot: string;
  items: PlanMealItem[];
}

export interface DailyPlan {
  summary: string;
  exercises: PlanExercise[];
  meals: PlanMealSlot[];
  tips: string[];
}

export interface PlanResponse {
  date: string;
  target_calories: number;
  protein_g: number;
  plan: DailyPlan;
  cached: boolean;
}

export interface MeasurementResponse {
  waist_cm: number | null;
  hip_cm: number | null;
  arm_length_cm: number | null;
  shoulder_width_cm: number | null;
  chest_cm: number | null;
  confidence: 'low' | 'medium' | 'high';
  warnings: string[];
  note: string;
}

export interface BodyEstimateResponse {
  heightCm: number;
  weightKg: number;
  confidence: 'low' | 'medium' | 'high';
  warnings: string[];
}

/** snake_case wire shape of `BodyEstimateResult` in backend/app/schemas.py. */
interface WireBodyEstimate {
  height_cm: number;
  weight_kg: number;
  confidence: 'low' | 'medium' | 'high';
  warnings?: string[];
}

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * A failed `fetch` covers several different problems (server unreachable, blocked
 * cleartext traffic, an unreadable photo file, ...). Keep the underlying reason
 * (e.g. "Network request failed") in the message so it can be diagnosed on a device.
 */
function connectionError(cause: unknown): ApiError {
  const reason = cause instanceof Error && cause.message ? ` Penyebab: ${cause.message}.` : '';
  return new ApiError(`Tidak dapat terhubung ke server (${API_BASE_URL}).${reason}`, 0);
}

/** FastAPI `detail` is a string for our own errors but a list of {msg} for 422 validation errors. */
function readDetail(data: unknown, fallback: string): string {
  const detail = (data as { detail?: unknown } | null)?.detail;
  if (typeof detail === 'string' && detail) return detail;
  if (Array.isArray(detail)) {
    const msgs = detail
      .map((item) => (item as { msg?: unknown } | null)?.msg)
      .filter((m): m is string => typeof m === 'string' && m.length > 0);
    if (msgs.length > 0) return msgs.join('; ');
  }
  return fallback;
}

/** Picks the MIME type from the photo's extension; the backend only accepts JPEG, PNG or WebP. */
function photoMime(uri: string): { type: string; ext: string } {
  const clean = uri.split('?')[0].toLowerCase();
  if (clean.endsWith('.png')) return { type: 'image/png', ext: '.png' };
  if (clean.endsWith('.webp')) return { type: 'image/webp', ext: '.webp' };
  return { type: 'image/jpeg', ext: '.jpg' };
}

/**
 * Attach the photo as the `photo` form field.
 *
 * Web: the browser only understands real Blobs, so a `{ uri, ... }` descriptor
 * would be sent as the text "[object Object]" and the server would reject it (422).
 *
 * Native: since SDK 52 the global `fetch` on Android/iOS is `expo/fetch`, which does
 * NOT support React Native's `{ uri, name, type }` file descriptor ("Unsupported
 * FormDataPart implementation"). It needs a Blob-like part that exposes `bytes()`;
 * expo-file-system's `File` provides that (see the Expo docs for `expo/fetch`).
 * The part is wrapped so that the filename and MIME type are always set explicitly.
 */
async function appendPhoto(form: FormData, photoUri: string): Promise<void> {
  if (Platform.OS === 'web') {
    let blob: Blob;
    try {
      blob = await (await fetch(photoUri)).blob();
    } catch {
      throw new ApiError('Foto tidak dapat dibaca. Coba ambil atau pilih foto lagi.', 400);
    }
    form.append('photo', blob, 'photo.jpg');
    return;
  }
  const { type, ext } = photoMime(photoUri);
  const file = new File(photoUri);
  form.append('photo', {
    name: `photo${ext}`,
    type,
    bytes: () => file.bytes(),
  } as unknown as Blob);
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  let resp: Response;
  try {
    resp = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw connectionError(e);
  }
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new ApiError(
      readDetail(data, 'Permintaan gagal.'),
      resp.status,
      (data as { error?: string }).error,
    );
  }
  return data as T;
}

/** POST a multipart form with a photo, giving up after `PHOTO_TIMEOUT_MS`. */
async function postPhoto<T>(path: string, form: FormData, failureMessage: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PHOTO_TIMEOUT_MS);
  let resp: Response;
  try {
    resp = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    });
  } catch (e) {
    // Browsers throw an AbortError, but `expo/fetch` on Android/iOS throws a plain
    // FetchError ("Fetch request has been canceled"). Our own timer is the only thing
    // that aborts this request, so the signal state is the reliable check.
    if (controller.signal.aborted) {
      // The server answers within ~40 s even when Gemini is busy (it replies 503), so 60 s of
      // silence almost always means the request never got through (wrong Wi-Fi, firewall).
      throw new ApiError(
        `Server tidak menjawab dalam ${PHOTO_TIMEOUT_MS / 1000} detik (${API_BASE_URL}). ` +
          'Pastikan HP dan PC di Wi-Fi yang sama dan firewall tidak memblokir port 8000, lalu coba lagi.',
        504,
      );
    }
    throw connectionError(e);
  } finally {
    clearTimeout(timer);
  }
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new ApiError(
      readDetail(data, failureMessage),
      resp.status,
      (data as { error?: string }).error,
    );
  }
  return data as T;
}

export interface PlanMeasurementWire {
  waist_cm?: number | null;
  hip_cm?: number | null;
  chest_cm?: number | null;
  shoulder_width_cm?: number | null;
  arm_length_cm?: number | null;
  neck_cm?: number | null;
  body_fat_percent?: number | null;
  whtr?: number | null;
  whr?: number | null;
  source?: string | null;
}

export interface PlanFitnessPreferencesWire {
  target_weight_kg?: number | null;
  fitness_goals?: string[];
  injuries?: string[];
  equipment?: string[];
  preferred_activities?: string[];
  days_per_week?: number | null;
  session_duration_min?: number | null;
  gym_membership?: boolean | null;
}

export interface PlanOptions {
  measurements?: PlanMeasurementWire | null;
  fitnessPreferences?: PlanFitnessPreferencesWire | null;
  preferences?: string | null;
}

export const api = {
  async healthSummary(profile: Profile, standard: BmiStandard) {
    return postJson<unknown>(
      `/api/v1/health-summary?standard=${standard}`,
      { profile: toWireProfile(profile), screening: {} },
    );
  },

  async plan(
    profile: Profile,
    screening: HealthScreening,
    options?: PlanOptions | string,
  ): Promise<PlanResponse> {
    const isString = typeof options === 'string';
    const prefs = isString ? options : options?.preferences;
    const measurements = !isString ? options?.measurements : undefined;
    const fitnessPreferences = !isString ? options?.fitnessPreferences : undefined;

    return postJson<PlanResponse>('/api/v1/plan', {
      profile: toWireProfile(profile),
      screening: {
        is_pregnant: screening.isPregnant,
        has_chronic_illness: screening.hasChronicIllness,
        has_eating_disorder_history: screening.hasEatingDisorderHistory,
      },
      measurements: measurements || null,
      fitness_preferences: fitnessPreferences || null,
      preferences: prefs || null,
    });
  },

  async measure(
    photoUri: string,
    heightCm: number,
    gender: Gender,
  ): Promise<MeasurementResponse> {
    const form = new FormData();
    form.append('height_cm', String(heightCm));
    form.append('gender', gender);
    await appendPhoto(form, photoUri);
    return postPhoto<MeasurementResponse>('/api/v1/measure', form, 'Pengukuran gagal.');
  },

  async estimateBody(photoUri: string): Promise<BodyEstimateResponse> {
    const form = new FormData();
    await appendPhoto(form, photoUri);
    const wire = await postPhoto<WireBodyEstimate>('/api/v1/estimate-body', form, 'Estimasi gagal.');
    return {
      heightCm: wire.height_cm,
      weightKg: wire.weight_kg,
      confidence: wire.confidence,
      warnings: wire.warnings ?? [],
    };
  },

  async deleteServerData() {
    try {
      await fetch(`${API_BASE_URL}/api/v1/data`, { method: 'DELETE' });
    } catch {
      // Server-side cache is best-effort; local wipe is authoritative.
    }
  },
};
