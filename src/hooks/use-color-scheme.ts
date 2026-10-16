/**
 * RagaKu design system is light-mode only per PRD ("Visual Vibe: Clean Light Mode").
 * See app.json userInterfaceStyle for native build behavior.
 */
export function useColorScheme(): 'light' | 'dark' {
  return 'light';
}
