/**
 * RagaKu health domain layer (frontend).
 *
 * Mirrors the backend formulas so BMI and ideal-weight work fully offline
 * (PRD section 8: "Aplikasi tetap dapat menghitung BMI tanpa koneksi internet").
 * Calorie targets are also computed here for display, but the AUTHORITATIVE
 * calorie target used for the AI plan always comes from the backend.
 *
 * Formula sources: PRD appendix 13.
 */

export type Gender = 'male' | 'female';
export type BmiStandard = 'who' | 'asia_pacific';
export type ActivityLevel = 'sedentary' | 'light' | 'active' | 'very_active';
export type Goal = 'lose' | 'maintain' | 'gain';

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  active: 1.55,
  very_active: 1.725,
};

/** Normal-BMI band endpoints per standard (PRD F2). */
export const NORMAL_BMI_BANDS: Record<BmiStandard, [number, number]> = {
  who: [18.5, 24.9],
  asia_pacific: [18.5, 22.9],
};

/** Safe calorie floors (PRD section 7). */
export const SAFE_CALORIE_FLOOR: Record<Gender, number> = {
  male: 1500,
  female: 1200,
};

const GOAL_DELTA: Record<Goal, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

export function calculateBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function bmiCategory(bmi: number, standard: BmiStandard): string {
  if (standard === 'asia_pacific') {
    if (bmi < 18.5) return 'Berat badan kurang';
    if (bmi < 23.0) return 'Normal';
    if (bmi < 25.0) return 'Berisiko (pra-obesitas)';
    if (bmi < 30.0) return 'Obesitas I';
    return 'Obesitas II';
  }
  if (bmi < 18.5) return 'Berat badan kurang';
  if (bmi < 25.0) return 'Normal';
  if (bmi < 30.0) return 'Berat badan berlebih';
  return 'Obesitas';
}

export interface IdealWeightRange {
  minKg: number;
  maxKg: number;
}

export function idealWeightRange(heightCm: number, standard: BmiStandard): IdealWeightRange {
  const [low, high] = NORMAL_BMI_BANDS[standard];
  const heightM = heightCm / 100;
  return {
    minKg: Math.round(low * heightM * heightM * 10) / 10,
    maxKg: Math.round(high * heightM * heightM * 10) / 10,
  };
}

export interface MifflinInput {
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
}

/** BMR per Mifflin-St Jeor (PRD appendix 13). */
export function mifflinStJeorBmr({ age, gender, heightCm, weightKg }: MifflinInput): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return base + (gender === 'male' ? 5 : -161);
}

export interface CalorieTargets {
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinG: number;
  floorApplied: boolean;
  safeFloor: number;
}

export function calculateCalories(
  input: MifflinInput & { activityLevel: ActivityLevel; goal: Goal },
): CalorieTargets {
  const bmr = mifflinStJeorBmr(input);
  const tdee = bmr * ACTIVITY_FACTORS[input.activityLevel];
  const rawTarget = tdee + GOAL_DELTA[input.goal];
  const floor = SAFE_CALORIE_FLOOR[input.gender];
  const floorApplied = rawTarget < floor;
  const target = Math.max(rawTarget, floor);
  const proteinPerKg = input.goal === 'gain' ? 1.6 : 1.4;
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories: Math.round(target),
    proteinG: Math.round(proteinPerKg * input.weightKg),
    floorApplied,
    safeFloor: floor,
  };
}

// --------------------------------------------------------------------------- //
// Advanced indicators (PRD F4)
// --------------------------------------------------------------------------- //
export function whtrRiskLabel(whtr: number): string {
  if (whtr < 0.4) return 'Perhatian (terlalu kurus)';
  if (whtr < 0.5) return 'Sehat';
  if (whtr < 0.6) return 'Risiko meningkat';
  return 'Risiko tinggi';
}

export interface IndicatorInput {
  heightCm: number;
  gender: Gender;
  waistCm: number;
  neckCm: number;
  hipCm?: number | null;
}

export interface IndicatorResult {
  whtr: number;
  whtrRisk: string;
  whr: number | null;
  bodyFatPercent: number | null;
}

/** US Navy body-fat estimate (PRD appendix 13), units cm. */
export function usNavyBodyFat(input: IndicatorInput): number | null {
  const { gender, waistCm, neckCm, hipCm, heightCm } = input;
  let value: number;
  if (gender === 'male') {
    if (waistCm - neckCm <= 0) return null;
    value = 86.01 * Math.log10(waistCm - neckCm) - 70.041 * Math.log10(heightCm) + 36.76;
  } else {
    if (hipCm == null) return null;
    if (waistCm + hipCm - neckCm <= 0) return null;
    value =
      163.205 * Math.log10(waistCm + hipCm - neckCm) - 97.684 * Math.log10(heightCm) - 78.387;
  }
  if (!Number.isFinite(value)) return null;
  return Math.round(Math.max(0, Math.min(value, 75)) * 10) / 10;
}

export function buildIndicators(input: IndicatorInput): IndicatorResult {
  const whtr = input.waistCm / input.heightCm;
  const whr = input.hipCm ? Math.round((input.waistCm / input.hipCm) * 100) / 100 : null;
  return {
    whtr: Math.round(whtr * 1000) / 1000,
    whtrRisk: whtrRiskLabel(whtr),
    whr,
    bodyFatPercent: usNavyBodyFat(input),
  };
}
