import {
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
  BarlowCondensed_800ExtraBold,
  useFonts as useBarlowFonts,
} from '@expo-google-fonts/barlow-condensed';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts as useJakartaFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/components/auth-context';
import { OnboardingProvider } from '@/components/onboarding/onboarding-context';
import { ProfileProvider } from '@/components/profile-context';
import { useTheme } from '@/hooks/use-theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [barlowLoaded] = useBarlowFonts({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    BarlowCondensed_800ExtraBold,
  });
  const [jakartaLoaded] = useJakartaFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });
  const fontsLoaded = barlowLoaded && jakartaLoaded;

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <ProfileProvider>
          <OnboardingProvider>
            <AnimatedSplashOverlay />
            <RootNavigator />
          </OnboardingProvider>
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

/**
 * Guard navigasi (PRD §7 + perbaikan alur): tiga grup Stack.Protected yang saling
 * eksklusif berdasarkan sesi + status onboarding. `index` tidak masuk grup apa pun —
 * ia selalu tersedia sebagai fallback yang dituju navigator saat sebuah grup berubah
 * guard-nya jadi false (lihat StackRouter.getStateForRouteNamesChange), lalu `index`
 * sendiri memutuskan <Redirect> yang benar (src/app/index.tsx).
 *
 * `active-session.tsx`, `workout.tsx`, `exercise.tsx`, `vip.tsx` sengaja TIDAK
 * didaftarkan di grup mana pun (tech debt yang sudah ada, bukan bagian perubahan ini).
 *
 * PENTING: <Stack> baru dipasang setelah `ready` (sesi selesai dimuat). Memasang Stack
 * lebih awal dengan semua guard bernilai false (karena `ready` masih false) membuat
 * expo-router me-resolve URL deep-link awal (mis. reload langsung di /ukuran) TERHADAP
 * keadaan "belum siap" itu — targetnya hilang, dan begitu `ready` jadi true, navigator
 * sudah kadung menetap di `index` lalu <Redirect> ke /beranda, bukan ke URL yang diminta.
 * Menunda pemasangan Stack sampai `ready` membuat deep-link di-resolve sekali saja,
 * terhadap status auth yang sudah benar.
 */
function RootNavigator() {
  const { session, ready, completed } = useAuth();
  const theme = useTheme();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  const signedIn = !!session;

  return (
    <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />

      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="login" />
        <Stack.Screen name="registrasi" />
        <Stack.Screen name="lupa-password" />
      </Stack.Protected>

      <Stack.Protected guard={signedIn && !completed}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>

      <Stack.Protected guard={signedIn && completed}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="measurement" options={{ presentation: 'fullScreenModal' }} />
      </Stack.Protected>
    </Stack>
  );
}
