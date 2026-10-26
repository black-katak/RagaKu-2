/**
 * AuthProvider: menyimpan status sesi (login) dan memuatnya saat start.
 * Sumber kebenaran untuk apakah pengguna sudah masuk DAN apakah onboarding-nya selesai
 * (dipakai oleh guard navigasi di src/app/_layout.tsx).
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { auth, type Session } from '@/lib/auth';

interface AuthContextValue {
  session: Session | null;
  ready: boolean;
  /** Turunan dari session.onboardingCompleted; false bila belum login. */
  completed: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: { name: string; email: string; phone?: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const s = await auth.getSession();
      if (active) {
        setSession(s);
        setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      ready,
      completed: session?.onboardingCompleted ?? false,
      async signIn(email, password) {
        setSession(await auth.login({ email, password }));
      },
      async signUp(input) {
        setSession(await auth.register(input));
      },
      async signOut() {
        await auth.logout();
        setSession(null);
      },
      async completeOnboarding() {
        if (!session) return;
        setSession(await auth.markOnboardingComplete(session.userId));
      },
    }),
    [session, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
