/**
 * Local persistence for RagaKu (PRD section 8: data stored on device).
 * Uses AsyncStorage. All data can be wiped via clearAll (PRD section 7:
 * "Pengguna dapat menghapus seluruh data").
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { HealthScreening, MeasurementRecord, Profile, ProgressEntry } from './model';

const KEYS = {
  profile: 'ragaku.profile',
  screening: 'ragaku.screening',
  measurements: 'ragaku.measurements',
  progress: 'ragaku.progress',
} as const;

async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  // Profile ----------------------------------------------------------------
  getProfile: () => readJson<Profile>(KEYS.profile),
  setProfile: (p: Profile) => writeJson(KEYS.profile, p),

  // Screening --------------------------------------------------------------
  getScreening: () => readJson<HealthScreening>(KEYS.screening),
  setScreening: (s: HealthScreening) => writeJson(KEYS.screening, s),

  // Measurements -----------------------------------------------------------
  async getMeasurements(): Promise<MeasurementRecord[]> {
    return (await readJson<MeasurementRecord[]>(KEYS.measurements)) ?? [];
  },
  async addMeasurement(m: MeasurementRecord): Promise<MeasurementRecord[]> {
    const list = await this.getMeasurements();
    const next = [...list, m];
    await writeJson(KEYS.measurements, next);
    return next;
  },
  /**
   * Simpan ukuran, menimpa record di tanggal yang sama (sama seperti addProgress) —
   * supaya mengedit ukuran manual hari ini tidak menumpuk record baru setiap kali disimpan.
   */
  async upsertMeasurement(m: MeasurementRecord): Promise<MeasurementRecord[]> {
    const list = await this.getMeasurements();
    const filtered = list.filter((entry) => entry.date !== m.date);
    const next = [...filtered, m].sort((a, b) => a.date.localeCompare(b.date));
    await writeJson(KEYS.measurements, next);
    return next;
  },

  // Progress ---------------------------------------------------------------
  async getProgress(): Promise<ProgressEntry[]> {
    return (await readJson<ProgressEntry[]>(KEYS.progress)) ?? [];
  },
  async addProgress(entry: ProgressEntry): Promise<ProgressEntry[]> {
    const list = await this.getProgress();
    // Replace same-date entry if present.
    const filtered = list.filter((e) => e.date !== entry.date);
    const next = [...filtered, entry].sort((a, b) => a.date.localeCompare(b.date));
    await writeJson(KEYS.progress, next);
    return next;
  },

  // Delete everything (PRD section 7) --------------------------------------
  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  },
};
