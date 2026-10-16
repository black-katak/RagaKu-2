import { useEffect, useState } from 'react';

/**
 * RagaKu design system is light-mode only per PRD ("Visual Vibe: Clean Light Mode").
 * Web preview ignores device/browser dark-mode preference to match native behavior.
 */
export function useColorScheme(): 'light' | 'dark' {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return 'light';
}
