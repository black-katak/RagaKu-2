/**
 * Firestore document types for RagaKu.
 *
 * Source of truth for the option sets lives in the existing code; this module
 * re-exports those unions (type-only imports, erased at compile time) rather
 * than redeclaring them, so the two layers cannot silently drift:
 *
 * - Backend-aligned domain vocabulary: `src/lib/health.ts` + `src/lib/model.ts`
 *   (mirrors `backend/app/schemas.py`).
 * - Onboarding vocabulary (Indonesian): `src/components/onboarding/onboarding-context.tsx`.
 *
 * NOTE: the codebase currently has TWO disjoint vocabularies for gender and
 * goal — `'male' | 'female'` / `'lose' | 'maintain' | 'gain'` on the backend
 * contract, and `'pria' | 'wanita' | ...` / `'turun-berat' | ...` in
 * onboarding. Both are preserved below under distinct names; mapping between
 * them is deliberately NOT invented here.
 *
 * Convention: `*Input` types are what callers pass in when creating or
 * updating (no server-managed fields). `*Document` types are what is stored in
 * and read back from Firestore (includes ids and `Timestamp` audit fields).
 */
import type { Timestamp } from 'firebase/firestore';

import type {
  Activity,
  Equipment,
  Gender as OnboardingGender,
  Goal as FitnessGoal,
  Injury,
  SessionDuration,
} from '@/components/onboarding/onboarding-context';
import type {
  ActivityLevel,
  BmiStandard,
  Gender as BiologicalSex,
  Goal as CalorieGoal,
} from '@/lib/health';

// --------------------------------------------------------------------------- //
// Shared enums / unions (re-exported from their source of truth)
// --------------------------------------------------------------------------- //
export type {
  Activity,
  ActivityLevel,
  BiologicalSex,
  BmiStandard,
  CalorieGoal,
  Equipment,
  FitnessGoal,
  Injury,
  OnboardingGender,
  SessionDuration,
};

/** Exercise intensity as emitted and validated by the AI plan contract. */
export type PlanIntensity = 'ringan' | 'sedang' | 'tinggi';

/** Confidence band returned by the photo measurement service. */
export type MeasurementConfidence = 'low' | 'medium' | 'high';

/** Per-set difficulty feedback collected during an active workout session. */
export type SetFeedback = 'ringan' | 'pas' | 'berat';

/** Consistent timestamp type for every stored document. */
export type StoredTimestamp = Timestamp;

// --------------------------------------------------------------------------- //
// Physical metrics
// --------------------------------------------------------------------------- //

/**
 * Body metrics used by the health formulas (BMI, Mifflin-St Jeor, WHtR/WHR,
 * US Navy body fat). Circumference fields are optional because they only exist
 * after a measurement run or manual entry.
 */
export interface PhysicalMetrics {
  age: number;
  sex: BiologicalSex;
  heightCm: number;
  weightKg: number;
  targetWeightKg?: number | null;
  waistCm?: number | null;
  hipCm?: number | null;
  neckCm?: number | null;
  chestCm?: number | null;
  armLengthCm?: number | null;
  shoulderWidthCm?: number | null;
}

/** PRD section 7 screening gate. Any `true` flag blocks AI plan generation. */
export interface HealthScreeningAnswers {
  isPregnant: boolean;
  hasChronicIllness: boolean;
  hasEatingDisorderHistory: boolean;
}

// --------------------------------------------------------------------------- //
// Fitness goals / training preferences
// --------------------------------------------------------------------------- //

/**
 * Training intent and constraints, as collected by the onboarding flow.
 * `calorieGoal` is the backend-contract projection used for calorie targets;
 * `goals` is the richer onboarding selection.
 */
export interface FitnessGoals {
  goals: FitnessGoal[];
  calorieGoal: CalorieGoal;
  activityLevel: ActivityLevel;
  activities: Activity[];
  equipment: Equipment[];
  injuries: Injury[];
  gymMembership: boolean;
  daysPerWeek: number;
  sessionDuration: SessionDuration;
}

// --------------------------------------------------------------------------- //
// User profile: users/{uid}
// --------------------------------------------------------------------------- //

/** Fields a caller supplies when creating or updating a profile. */
export interface UserProfileInput {
  displayName: string;
  email: string;
  phone?: string | null;
  onboardingGender?: OnboardingGender | null;
  bmiStandard: BmiStandard;
  metrics: PhysicalMetrics;
  goals: FitnessGoals;
  screening: HealthScreeningAnswers;
  dietNotes?: string | null;
  onboardingCompleted?: boolean;
}

/** A profile as stored at `users/{uid}`. */
export interface UserProfileDocument extends UserProfileInput {
  uid: string;
  onboardingCompleted: boolean;
  createdAt: StoredTimestamp;
  updatedAt: StoredTimestamp;
}

/** Partial profile update; server-managed fields cannot be set by callers. */
export type UserProfileUpdate = Partial<
  Omit<UserProfileInput, 'metrics' | 'goals' | 'screening'>
> & {
  metrics?: Partial<PhysicalMetrics>;
  goals?: Partial<FitnessGoals>;
  screening?: Partial<HealthScreeningAnswers>;
};

// --------------------------------------------------------------------------- //
// AI plan building blocks (match the validated backend contract)
// --------------------------------------------------------------------------- //

export interface PlanExercise {
  name: string;
  /** Free-text category, e.g. "kardio", "kekuatan". */
  type: string;
  durationMin: number;
  intensity: PlanIntensity;
  /** Present only for set-based prescriptions. */
  sets?: number | null;
  reps?: number | null;
}

export interface PlanMealItem {
  name: string;
  calories: number;
  proteinG: number;
}

export interface PlanMealSlot {
  /** e.g. "Sarapan", "Makan Siang". */
  slot: string;
  items: PlanMealItem[];
}

/** Deterministic calorie targets computed by the backend, never by the model. */
export interface CalorieTargetSnapshot {
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinG: number;
  floorApplied: boolean;
  safeFloor: number;
}

// --------------------------------------------------------------------------- //
// Workout plan: users/{uid}/workoutPlans/{planId}
// --------------------------------------------------------------------------- //

export interface WorkoutPlanInput {
  /** ISO date (YYYY-MM-DD) the plan applies to. */
  planDate: string;
  summary: string;
  exercises: PlanExercise[];
  tips?: string[];
  /** Calorie targets in force when the plan was generated. */
  targets?: CalorieTargetSnapshot | null;
  /** Model identifier, e.g. the OPENROUTER_MODEL in use. */
  generatedBy?: string | null;
  source?: 'ai' | 'manual';
}

export interface WorkoutPlanDocument extends WorkoutPlanInput {
  id: string;
  uid: string;
  tips: string[];
  source: 'ai' | 'manual';
  completed: boolean;
  createdAt: StoredTimestamp;
  updatedAt: StoredTimestamp;
}

// --------------------------------------------------------------------------- //
// Nutrition plan (same per-user subcollection pattern)
// --------------------------------------------------------------------------- //

export interface NutritionPlanInput {
  planDate: string;
  summary: string;
  meals: PlanMealSlot[];
  tips?: string[];
  targets?: CalorieTargetSnapshot | null;
  generatedBy?: string | null;
  source?: 'ai' | 'manual';
}

export interface NutritionPlanDocument extends NutritionPlanInput {
  id: string;
  uid: string;
  tips: string[];
  source: 'ai' | 'manual';
  createdAt: StoredTimestamp;
  updatedAt: StoredTimestamp;
}

/**
 * Combined daily plan as returned by the AI endpoint (workout + nutrition in
 * one payload), before it is split into the two subcollections.
 */
export interface DailyPlanInput {
  planDate: string;
  summary: string;
  exercises: PlanExercise[];
  meals: PlanMealSlot[];
  tips?: string[];
  targets?: CalorieTargetSnapshot | null;
  generatedBy?: string | null;
}

// --------------------------------------------------------------------------- //
// Measurement + progress history (per-user subcollections)
// --------------------------------------------------------------------------- //

export interface MeasurementInput {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  waistCm?: number | null;
  hipCm?: number | null;
  armLengthCm?: number | null;
  shoulderWidthCm?: number | null;
  chestCm?: number | null;
  neckCm?: number | null;
  confidence?: MeasurementConfidence;
  warnings?: string[];
}

export interface MeasurementDocument extends MeasurementInput {
  id: string;
  uid: string;
  confidence: MeasurementConfidence;
  warnings: string[];
  createdAt: StoredTimestamp;
}

export interface ProgressEntryInput {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  weightKg: number;
  waistCm?: number | null;
}

export interface ProgressEntryDocument extends ProgressEntryInput {
  id: string;
  uid: string;
  createdAt: StoredTimestamp;
}

// --------------------------------------------------------------------------- //
// Collection path helpers
// --------------------------------------------------------------------------- //

export const COLLECTIONS = {
  users: 'users',
  workoutPlans: 'workoutPlans',
  nutritionPlans: 'nutritionPlans',
  measurements: 'measurements',
  progress: 'progress',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
