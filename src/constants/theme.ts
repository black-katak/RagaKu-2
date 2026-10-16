/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0F172A',
    background: '#F8F9FF',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E6F5F3',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    border: '#E2E8F0',
    primary: '#0D9488',
    primaryDark: '#027A74',
    accent: '#06B6D4',
    warning: '#F97316',
  },
  dark: {
    text: '#F8FAFC',
    background: '#0B1120',
    backgroundElement: '#161D2E',
    backgroundSelected: '#1B2A2B',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    border: '#243044',
    primary: '#14B8A6',
    primaryDark: '#0D9488',
    accent: '#22D3EE',
    warning: '#FB923C',
  },
} as const;

/** Figma spec fonts: Barlow Condensed for headings/numbers, Plus Jakarta Sans for body/labels. */
export const FontFamily = {
  headingBold: 'BarlowCondensed_700Bold',
  headingExtraBold: 'BarlowCondensed_800ExtraBold',
  headingSemiBold: 'BarlowCondensed_600SemiBold',
  bodyRegular: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemiBold: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80, web: 96 }) ?? 0;
export const MaxContentWidth = 800;

export const CardRadius = 16;
export const PillRadius = 24;

/** Fixed dark surface for photo/video-style overlay cards, independent of light/dark theme. */
export const OverlaySurface = '#0F172A';

export const CardShadow = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  android: {
    elevation: 2,
  },
  default: {},
});
