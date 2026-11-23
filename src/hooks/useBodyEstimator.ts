/**
 * Height/weight estimation from a photo (Gemini, called through our backend).
 *
 * The Gemini key stays on the server (`backend/app/config.py`); this hook only
 * talks to `/api/v1/estimate-body` via `api.estimateBody`.
 *
 * `saveEstimateToProfile` writes to BOTH layers the app currently uses:
 *   - Firestore `users/{uid}.metrics` (canonical, via userService)
 *   - the local AsyncStorage-backed profile (via ProfileProvider's updateProfile)
 */
import { useCallback, useState } from 'react';

import { useProfile } from '@/components/profile-context';
import { MOCK_USER_ID } from '@/constants/mockUser';
import { api, type BodyEstimateResponse } from '@/lib/api';
import { updateUserBodyMetrics } from '@/services/userService';

export interface UseBodyEstimatorResult {
  estimate: BodyEstimateResponse | null;
  isAnalyzing: boolean;
  isSaving: boolean;
  error: string | null;
  analyzePhoto: (photoUri: string) => Promise<BodyEstimateResponse | null>;
  saveEstimateToProfile: (uid?: string) => Promise<void>;
  reset: () => void;
}

export function useBodyEstimator(): UseBodyEstimatorResult {
  const { updateProfile } = useProfile();

  const [estimate, setEstimate] = useState<BodyEstimateResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzePhoto = useCallback(
    async (photoUri: string): Promise<BodyEstimateResponse | null> => {
      setError(null);
      setIsAnalyzing(true);
      try {
        const result = await api.estimateBody(photoUri);
        setEstimate(result);
        return result;
      } catch (e) {
        setEstimate(null);
        setError(e instanceof Error ? e.message : 'Estimasi gagal.');
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [],
  );

  const saveEstimateToProfile = useCallback(
    async (uid: string = MOCK_USER_ID): Promise<void> => {
      setError(null);
      if (!estimate) {
        const message = 'Belum ada hasil estimasi untuk disimpan.';
        setError(message);
        throw new Error(message);
      }

      setIsSaving(true);
      try {
        await updateUserBodyMetrics(uid, estimate.heightCm, estimate.weightKg);
        // Keep the local profile in sync (persists to AsyncStorage too).
        updateProfile({
          heightCm: estimate.heightCm,
          weightKg: estimate.weightKg,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Gagal menyimpan estimasi.');
        throw e;
      } finally {
        setIsSaving(false);
      }
    },
    [estimate, updateProfile],
  );

  const reset = useCallback(() => {
    setEstimate(null);
    setError(null);
  }, []);

  return {
    estimate,
    isAnalyzing,
    isSaving,
    error,
    analyzePhoto,
    saveEstimateToProfile,
    reset,
  };
}
