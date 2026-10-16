import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type Gender = 'pria' | 'wanita' | 'non-biner' | 'rahasia';

export type Injury =
  | 'tekanan-rendah'
  | 'tekanan-tinggi'
  | 'lutut'
  | 'punggung'
  | 'bahu'
  | 'asma'
  | 'tidak-ada';

export type Equipment =
  | 'bodyweight'
  | 'dumbbell'
  | 'resistance-band'
  | 'pull-up-bar'
  | 'kettlebell'
  | 'barbell';

export type Activity =
  | 'hiit'
  | 'calisthenics'
  | 'powerlifting'
  | 'yoga'
  | 'pilates'
  | 'cardio'
  | 'renang'
  | 'lari'
  | 'sepeda'
  | 'badminton'
  | 'basket'
  | 'futsal';

export type Goal =
  | 'turun-berat'
  | 'bentuk-otot'
  | 'ketahanan'
  | 'kelenturan'
  | 'rehabilitasi';

export type SessionDuration = 15 | 30 | 45 | 60;

export interface OnboardingData {
  gender: Gender | null;
  age: number;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  goals: Goal[];
  injuries: Injury[];
  gymMembership: boolean;
  equipment: Equipment[];
  activities: Activity[];
  daysPerWeek: number;
  sessionDuration: SessionDuration;
}

const defaultData: OnboardingData = {
  gender: null,
  age: 27,
  heightCm: 175,
  weightKg: 74,
  targetWeightKg: 68,
  goals: ['bentuk-otot'],
  injuries: [],
  gymMembership: false,
  equipment: ['bodyweight'],
  activities: [],
  daysPerWeek: 3,
  sessionDuration: 30,
};

interface OnboardingContextValue {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
  toggleInList: <K extends 'goals' | 'injuries' | 'equipment' | 'activities'>(
    key: K,
    value: OnboardingData[K][number],
  ) => void;
  reset: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(defaultData);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      data,
      update: (patch) => setData((prev) => ({ ...prev, ...patch })),
      toggleInList: (key, value) =>
        setData((prev) => {
          const list = prev[key] as unknown[];
          const exists = list.includes(value);
          const next = exists ? list.filter((item) => item !== value) : [...list, value];
          return { ...prev, [key]: next };
        }),
      reset: () => setData(defaultData),
    }),
    [data],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}

export function calculateBmi(weightKg: number, heightCm: number) {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function bmiCategory(bmi: number) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Rasio Otot-Tinggi';
}

export function estimateBmr(data: OnboardingData) {
  const genderOffset = data.gender === 'wanita' ? -161 : 5;
  return Math.round(10 * data.weightKg + 6.25 * data.heightCm - 5 * data.age + genderOffset);
}
