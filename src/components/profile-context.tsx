/**
 * ProfileProvider: single source of truth for the user's profile + screening,
 * backed by AsyncStorage (PRD F1, section 8). Loads once on mount and persists
 * on every change.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  DEFAULT_PROFILE,
  DEFAULT_SCREENING,
  type HealthScreening,
  type Profile,
} from '@/lib/model';
import { storage } from '@/lib/storage';

interface ProfileContextValue {
  profile: Profile;
  screening: HealthScreening;
  loaded: boolean;
  updateProfile: (patch: Partial<Profile>) => void;
  updateScreening: (patch: Partial<HealthScreening>) => void;
  clearAll: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [screening, setScreening] = useState<HealthScreening>(DEFAULT_SCREENING);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const [p, s] = await Promise.all([storage.getProfile(), storage.getScreening()]);
      if (!active) return;
      if (p) setProfile({ ...DEFAULT_PROFILE, ...p });
      if (s) setScreening({ ...DEFAULT_SCREENING, ...s });
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const updateProfile = (patch: Partial<Profile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      void storage.setProfile(next);
      return next;
    });
  };

  const updateScreening = (patch: Partial<HealthScreening>) => {
    setScreening((prev) => {
      const next = { ...prev, ...patch };
      void storage.setScreening(next);
      return next;
    });
  };

  const clearAll = async () => {
    await storage.clearAll();
    setProfile(DEFAULT_PROFILE);
    setScreening(DEFAULT_SCREENING);
  };

  const value = useMemo<ProfileContextValue>(
    () => ({ profile, screening, loaded, updateProfile, updateScreening, clearAll }),
    [profile, screening, loaded],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
