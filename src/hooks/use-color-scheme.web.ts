/**
 * RagaKu design system is light-mode only per PRD ("Visual Vibe: Clean Light Mode").
 * Web preview ignores device/browser dark-mode preference to match native behavior.
 */
export function useColorScheme(): 'light' | 'dark' {
  return 'light';
}
