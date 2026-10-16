/**
 * Wire-to-store mappers.
 *
 * The FastAPI contract is snake_case (`src/lib/api.ts`, mirroring
 * `backend/app/schemas.py`); the Firestore document types are camelCase
 * (`src/types/database.ts`). These functions are the single conversion point
 * between the two, so a `PlanResponse` can be handed straight to
 * `saveWorkoutPlan` / a nutrition-plan write.
 *
 * Mapping notes:
 * - `PlanResponse.date` becomes `planDate` (both are ISO `YYYY-MM-DD`).
 * - `duration_min` -> `durationMin`, `protein_g` -> `proteinG`.
 * - `PlanResponse` carries only `target_calories` and `protein_g`, which is not
 *   enough to build a `CalorieTargetSnapshot` (that needs bmr/tdee/floor info
 *   from `/api/v1/health-summary`). Pass those calories in explicitly via
 *   `options.calories` when you want `targets` populated; otherwise `targets`
 *   is omitted.
 * - `source` is `'ai'` because these payloads come from the AI plan endpoint.
 */
import type {
  DailyPlan as WireDailyPlan,
  PlanExercise as WirePlanExercise,
  PlanMealItem as WirePlanMealItem,
  PlanMealSlot as WirePlanMealSlot,
  PlanResponse as WirePlanResponse,
} from './api';
import type { OnboardingData } from '@/components/onboarding/onboarding-context';
import type {
  ActivityLevel,
  BiologicalSex,
  CalorieGoal,
  CalorieTargetSnapshot,
  DailyPlanInput,
  FitnessGoals,
  HealthScreeningAnswers,
  NutritionPlanInput,
  OnboardingGender,
  PhysicalMetrics,
  PlanExercise,
  PlanMealItem,
  PlanMealSlot,
  UserProfileInput,
  WorkoutPlanInput,
} from '@/types/database';

/**
 * Calorie block as returned by `POST /api/v1/health-summary` (the `calories`
 * field of `HealthSummary` in `backend/app/schemas.py`). `api.healthSummary`
 * is currently typed `unknown`, so this is the shape to cast to.
 */
export interface WireCalorieTargets {
  bmr: number;
  tdee: number;
  target_calories: number;
  protein_g: number;
  floor_applied: boolean;
  safe_floor: number;
}

/** Extra context the wire payload does not carry. */
export interface PlanMapOptions {
  /**
   * Full calorie targets from `/api/v1/health-summary`. Required for
   * `targets` to be populated on the mapped plan.
   */
  calories?: WireCalorieTargets | null;
  /** Model identifier, e.g. the `OPENROUTER_MODEL` that produced the plan. */
  generatedBy?: string | null;
}

// --------------------------------------------------------------------------- //
// Leaf mappers
// --------------------------------------------------------------------------- //

export function toCalorieTargetSnapshot(
  wire: WireCalorieTargets,
): CalorieTargetSnapshot {
  return {
    bmr: wire.bmr,
    tdee: wire.tdee,
    targetCalories: wire.target_calories,
    proteinG: wire.protein_g,
    floorApplied: wire.floor_applied,
    safeFloor: wire.safe_floor,
  };
}

export function toPlanExercise(wire: WirePlanExercise): PlanExercise {
  return {
    name: wire.name,
    type: wire.type,
    durationMin: wire.duration_min,
    intensity: wire.intensity,
  };
}

export function toPlanMealItem(wire: WirePlanMealItem): PlanMealItem {
  return {
    name: wire.name,
    calories: wire.calories,
    proteinG: wire.protein_g,
  };
}

export function toPlanMealSlot(wire: WirePlanMealSlot): PlanMealSlot {
  return {
    slot: wire.slot,
    items: wire.items.map(toPlanMealItem),
  };
}

// --------------------------------------------------------------------------- //
// Plan mappers
// --------------------------------------------------------------------------- //

/**
 * Map a plan response to the workout half (summary + exercises + tips).
 * Ready to pass directly to `saveWorkoutPlan(uid, plan)`.
 */
export function toWorkoutPlanInput(
  response: WirePlanResponse,
  options?: PlanMapOptions,
): WorkoutPlanInput {
  const plan: WireDailyPlan = response.plan;
  return {
    planDate: response.date,
    summary: plan.summary,
    exercises: plan.exercises.map(toPlanExercise),
    tips: plan.tips ?? [],
    targets: options?.calories ? toCalorieTargetSnapshot(options.calories) : null,
    generatedBy: options?.generatedBy ?? null,
    source: 'ai',
  };
}

/** Map a plan response to the nutrition half (summary + meals + tips). */
export function toNutritionPlanInput(
  response: WirePlanResponse,
  options?: PlanMapOptions,
): NutritionPlanInput {
  const plan: WireDailyPlan = response.plan;
  return {
    planDate: response.date,
    summary: plan.summary,
    meals: plan.meals.map(toPlanMealSlot),
    tips: plan.tips ?? [],
    targets: options?.calories ? toCalorieTargetSnapshot(options.calories) : null,
    generatedBy: options?.generatedBy ?? null,
    source: 'ai',
  };
}

/** Map a plan response to the combined daily plan (exercises + meals). */
export function toDailyPlanInput(
  response: WirePlanResponse,
  options?: PlanMapOptions,
): DailyPlanInput {
  const plan: WireDailyPlan = response.plan;
  return {
    planDate: response.date,
    summary: plan.summary,
    exercises: plan.exercises.map(toPlanExercise),
    meals: plan.meals.map(toPlanMealSlot),
    tips: plan.tips ?? [],
    targets: options?.calories ? toCalorieTargetSnapshot(options.calories) : null,
    generatedBy: options?.generatedBy ?? null,
  };
}

// --------------------------------------------------------------------------- //
// Onboarding -> stored profile
// --------------------------------------------------------------------------- //
//
// The onboarding flow and the backend contract use DISJOINT vocabularies
// (`'pria' | 'wanita' | ...` vs `'male' | 'female'`; `'turun-berat' | ...` vs
// `'lose' | 'maintain' | 'gain'`). Nothing in the codebase mapped between them
// before, so every rule below is a NEW decision, marked INFERRED where the
// source data cannot answer the question.

/**
 * INFERRED. The health formulas (Mifflin-St Jeor, US Navy body fat) require a
 * binary sex, but onboarding also allows `'non-biner'` and `'rahasia'`.
 * Those fall back to `'male'`, which carries the HIGHER safe calorie floor
 * (1500 vs 1200 kcal in `src/lib/health.ts`) and so is the conservative choice
 * for an unknown value. Revisit if the product wants an explicit prompt.
 */
export function toBiologicalSex(gender: OnboardingGender | null): BiologicalSex {
  return gender === 'wanita' ? 'female' : 'male';
}

/**
 * INFERRED. Collapses the multi-select onboarding goals into the single
 * calorie goal the backend accepts. Precedence: an explicit weight-loss goal
 * wins, then the mass-gain goals, else maintain.
 *
 * `'ketahanan'` maps to `'gain'` because the onboarding UI labels it
 * "Naikkan Berat Badan / Bulking Bersih & Surplus"
 * (`src/app/onboarding/biometric.tsx`), not endurance in the cardio sense.
 */
export function toCalorieGoal(goals: OnboardingData['goals']): CalorieGoal {
  if (goals.includes('turun-berat')) return 'lose';
  if (goals.includes('bentuk-otot') || goals.includes('ketahanan')) return 'gain';
  return 'maintain';
}

/**
 * INFERRED. Onboarding collects `daysPerWeek` / `sessionDuration` but no
 * activity level, so the Mifflin multiplier bucket is derived from training
 * frequency.
 */
export function toActivityLevel(daysPerWeek: number): ActivityLevel {
  if (daysPerWeek <= 1) return 'sedentary';
  if (daysPerWeek <= 3) return 'light';
  if (daysPerWeek <= 5) return 'active';
  return 'very_active';
}

export function toPhysicalMetrics(data: OnboardingData): PhysicalMetrics {
  return {
    age: data.age,
    sex: toBiologicalSex(data.gender),
    heightCm: data.heightCm,
    weightKg: data.weightKg,
    targetWeightKg: data.targetWeightKg,
  };
}

export function toFitnessGoals(data: OnboardingData): FitnessGoals {
  return {
    goals: data.goals,
    calorieGoal: toCalorieGoal(data.goals),
    activityLevel: toActivityLevel(data.daysPerWeek),
    activities: data.activities,
    equipment: data.equipment,
    injuries: data.injuries,
    gymMembership: data.gymMembership,
    daysPerWeek: data.daysPerWeek,
    sessionDuration: data.sessionDuration,
  };
}

/**
 * Identity/account fields onboarding does not collect. Pass what the auth
 * session knows; blanks are stored as-is rather than invented.
 */
export interface ProfileIdentity {
  displayName?: string;
  email?: string;
  phone?: string | null;
}

/**
 * Build the Firestore profile payload from onboarding answers.
 *
 * Screening is deliberately NOT derived from `data.injuries`. Onboarding
 * offers `'tekanan-tinggi'` / `'asma'` as training constraints, but treating
 * them as `hasChronicIllness` would trip the PRD section 7 gate and make
 * `/api/v1/plan` return 409 for those users. Screening stays all-false until a
 * dedicated screening step exists; `rencana.tsx` already asks separately.
 */
export function toUserProfileInput(
  data: OnboardingData,
  identity?: ProfileIdentity,
): UserProfileInput {
  const screening: HealthScreeningAnswers = {
    isPregnant: false,
    hasChronicIllness: false,
    hasEatingDisorderHistory: false,
  };

  return {
    displayName: identity?.displayName ?? '',
    email: identity?.email ?? '',
    phone: identity?.phone ?? null,
    onboardingGender: data.gender,
    // PRD section 12 #1: Asia-Pacific is the product default.
    bmiStandard: 'asia_pacific',
    metrics: toPhysicalMetrics(data),
    goals: toFitnessGoals(data),
    screening,
    dietNotes: null,
    onboardingCompleted: true,
  };
}

/**
 * Split one plan response into both halves in a single pass, for the common
 * case of persisting the workout and nutrition documents together.
 */
export function toPlanInputs(
  response: WirePlanResponse,
  options?: PlanMapOptions,
): { workout: WorkoutPlanInput; nutrition: NutritionPlanInput } {
  return {
    workout: toWorkoutPlanInput(response, options),
    nutrition: toNutritionPlanInput(response, options),
  };
}
