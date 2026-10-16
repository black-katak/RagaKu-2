/**
 * RagaKu backend API client.
 *
 * Base URL comes from EXPO_PUBLIC_API_URL (set in app config / env). The
 * OpenRouter key is NEVER present in the app — the backend holds it
 * (PRD section 7). This client only talks to our own FastAPI backend.
 */
import { Platform } from 'react-native';

import type {
  ActivityLevel,
  BmiStandard,
  Gender,
  Goal,
} from './health';
import type { HealthScreening, Profile } from './model';

/**
 * Resolusi base URL backend.
 * Prioritas: EXPO_PUBLIC_API_URL (jika di-set) > default per-platform.
 *
 * Default:
 * - Android emulator: 10.0.2.2 adalah alias ke localhost komputer host.
 * - Web / iOS simulator: localhost (mesin yang sama).
 *
 * Untuk PERANGKAT FISIK, wajib set EXPO_PUBLIC_API_URL ke IP LAN komputer,
 * mis. EXPO_PUBLIC_API_URL=http://192.168.1.10:8000
 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv;
  if (Platform.OS === 'android') return 'http://10.0.2.2:8000';
  return 'http://localhost:8000';
}

export const API_BASE_URL = resolveBaseUrl();

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

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  let resp: Response;
  try {
    resp = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(`Tidak dapat terhubung ke server (${API_BASE_URL}).`, 0);
  }
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new ApiError(
      (data as { detail?: string }).detail ?? 'Permintaan gagal.',
      resp.status,
      (data as { error?: string }).error,
    );
  }
  return data as T;
}

export const api = {
  async healthSummary(profile: Profile, standard: BmiStandard) {
    return postJson<unknown>(
      `/api/v1/health-summary?standard=${standard}`,
      { profile: toWireProfile(profile), screening: {} },
    );
  },

  async plan(profile: Profile, screening: HealthScreening, preferences?: string) {
    return postJson<PlanResponse>('/api/v1/plan', {
      profile: toWireProfile(profile),
      screening: {
        is_pregnant: screening.isPregnant,
        has_chronic_illness: screening.hasChronicIllness,
        has_eating_disorder_history: screening.hasEatingDisorderHistory,
      },
      preferences: preferences || null,
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
    form.append('photo', {
      // React Native FormData file shape.
      uri: photoUri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);

    let resp: Response;
    try {
      resp = await fetch(`${API_BASE_URL}/api/v1/measure`, {
        method: 'POST',
        body: form,
      });
    } catch {
      throw new ApiError(`Tidak dapat terhubung ke server (${API_BASE_URL}).`, 0);
    }
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw new ApiError(
        (data as { detail?: string }).detail ?? 'Pengukuran gagal.',
        resp.status,
        (data as { error?: string }).error,
      );
    }
    return data as MeasurementResponse;
  },

  async deleteServerData() {
    try {
      await fetch(`${API_BASE_URL}/api/v1/data`, { method: 'DELETE' });
    } catch {
      // Server-side cache is best-effort; local wipe is authoritative.
    }
  },
};
