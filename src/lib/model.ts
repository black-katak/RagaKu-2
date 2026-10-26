/**
 * Shared domain model types for RagaKu (PRD F1, F3, F6).
 */
import type { ActivityLevel, Gender, Goal, BmiStandard } from './health';

export interface Profile {
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  dietNotes?: string;
  bmiStandard: BmiStandard;
}

/** PRD section 7 screening answers. */
export interface HealthScreening {
  isPregnant: boolean;
  hasChronicIllness: boolean;
  hasEatingDisorderHistory: boolean;
}

export function screeningBlocked(s: HealthScreening): boolean {
  return s.isPregnant || s.hasChronicIllness || s.hasEatingDisorderHistory;
}

/** A measurement snapshot, either from a photo (PRD F3) or entered manually. */
export interface MeasurementRecord {
  date: string; // ISO date
  waistCm?: number | null;
  hipCm?: number | null;
  armLengthCm?: number | null;
  shoulderWidthCm?: number | null;
  chestCm?: number | null;
  neckCm?: number | null; // user-entered, needed for US Navy body fat
  /** Asal angka: dari foto (model CV) atau diisi manual. Default 'photo' untuk record lama. */
  source?: 'photo' | 'manual';
}

/** A progress log entry (PRD F6). */
export interface ProgressEntry {
  date: string; // ISO date
  weightKg: number;
  waistCm?: number | null;
}

export const DEFAULT_PROFILE: Profile = {
  age: 27,
  gender: 'male',
  heightCm: 175,
  weightKg: 74,
  activityLevel: 'light',
  goal: 'lose',
  dietNotes: '',
  bmiStandard: 'asia_pacific',
};

export const DEFAULT_SCREENING: HealthScreening = {
  isPregnant: false,
  hasChronicIllness: false,
  hasEatingDisorderHistory: false,
};
