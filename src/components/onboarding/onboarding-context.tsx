import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/components/auth-context';
import { useProfile } from '@/components/profile-context';
import type { ActivityLevel, Goal as ProfileGoal } from '@/lib/health';
import type { Profile } from '@/lib/model';

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

/**
 * Petakan jawaban onboarding ke Profile yang dipersistensi (dibaca beranda.tsx/rencana.tsx).
 * Tipe Gender/Goal onboarding tidak sama dengan health.ts, jadi perlu konversi eksplisit.
 */
export function toProfilePatch(data: OnboardingData): Partial<Profile> {
  // health.ts (rumus Mifflin-St Jeor & US Navy) hanya punya 2 varian gender; 'non-biner'
  // dan 'rahasia' dipetakan ke 'male' sebagai default netral-rumus, bukan asumsi identitas.
  const gender: Profile['gender'] = data.gender === 'wanita' ? 'female' : 'male';

  let goal: ProfileGoal = 'maintain';
  if (data.goals.includes('turun-berat')) goal = 'lose';
  else if (data.goals.includes('bentuk-otot')) goal = 'gain';

  let activityLevel: ActivityLevel = 'light';
  if (data.daysPerWeek <= 1) activityLevel = 'sedentary';
  else if (data.daysPerWeek <= 3) activityLevel = 'light';
  else if (data.daysPerWeek <= 5) activityLevel = 'active';
  else activityLevel = 'very_active';

  return {
    gender,
    age: data.age,
    heightCm: data.heightCm,
    weightKg: data.weightKg,
    goal,
    activityLevel,
  };
}

interface OnboardingContextValue {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
  toggleInList: <K extends 'goals' | 'injuries' | 'equipment' | 'activities'>(
    key: K,
    value: OnboardingData[K][number],
  ) => void;
  reset: () => void;
  /** Tulis jawaban onboarding ke Profile lalu tandai akun yang login sebagai selesai onboarding. */
  complete: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(defaultData);
  const { session, completeOnboarding } = useAuth();
  const { updateProfile } = useProfile();

  // Begitu akun yang login berganti (logout, hapus-semua-data, atau akun lain), bersihkan
  // draft onboarding supaya akun berikutnya di perangkat ini tidak melihat jawaban akun
  // sebelumnya. Disesuaikan selama render (pola React resmi untuk "reset state saat sebuah
  // nilai berubah"), bukan di useEffect, supaya tidak ada render ekstra yang tidak perlu.
  const sessionId = session?.userId ?? null;
  const [trackedSessionId, setTrackedSessionId] = useState(sessionId);
  if (sessionId !== trackedSessionId) {
    setTrackedSessionId(sessionId);
    setData(defaultData);
  }

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
      complete: async () => {
        updateProfile(toProfilePatch(data));
        await completeOnboarding();
      },
    }),
    [data, updateProfile, completeOnboarding],
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
