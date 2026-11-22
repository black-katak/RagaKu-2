import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/components/auth-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PillButton } from '@/components/ui/pill-button';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function OnboardingIntroScreen() {
  const { signOut } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <ThemedText type="title" style={styles.heading}>
              LATIHAN YANG MENYESUAIKAN TUBUHMU
            </ThemedText>

            <ThemedText type="default" themeColor="textSecondary" style={styles.subheading}>
              Jawab empat langkah singkat. Program latihan disusun dari data tubuh, alat, dan
              waktu yang kamu punya.
            </ThemedText>
          </View>

          <View style={styles.footer}>
            <PillButton label="Mulai atur profil" onPress={() => router.push('/onboarding/biometric')} />

            {/* Sampai di sini user SUDAH login (dari registrasi.tsx), jadi /login diblokir
                guard navigasi. "Masuk ke akun lain" berarti keluar dulu dari akun ini. */}
            <Pressable hitSlop={8} style={styles.loginRow} onPress={() => signOut()}>
              <ThemedText type="default" themeColor="textSecondary">
                Salah akun?{' '}
              </ThemedText>
              <ThemedText type="default" themeColor="primary" style={styles.loginLink}>
                Keluar
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
    justifyContent: 'space-between',
    gap: Spacing.four,
  },
  content: {
    gap: Spacing.three,
  },
  heading: {
    fontSize: 34,
    lineHeight: 40,
  },
  subheading: {
    marginTop: 2,
  },
  footer: {
    gap: Spacing.three,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginLink: {
    fontWeight: '700',
  },
});
