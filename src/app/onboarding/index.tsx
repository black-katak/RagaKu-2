import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PillButton } from '@/components/ui/pill-button';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const STATS = [
  { value: '99.4%', label: 'AKURASI AI' },
  { value: '120K+', label: 'ATLET URBAN' },
  { value: 'REALTIME', label: 'BIOMETRIK' },
];

export default function OnboardingIntroScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Header row: brand lockup + ONBOARDING GOAL title + step pill (finding #2) */}
          <View style={styles.headerRow}>
            <View style={styles.logoRow}>
              <View style={[styles.logoMark, { backgroundColor: theme.primary }]}>
                <Ionicons name="pulse" size={14} color="#FFFFFF" />
              </View>
              <ThemedText type="smallBold" style={styles.logoWord}>
                RAGAKU
              </ThemedText>
              <ThemedText type="small" themeColor="primary" style={styles.logoSuper}>
                AI
              </ThemedText>
            </View>
            <ThemedText type="subtitle" style={styles.headerTitle}>
              ONBOARDING GOAL
            </ThemedText>
            <View style={[styles.stepBadge, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.stepBadgeText}>
                STEP ACTIVE
              </ThemedText>
            </View>
          </View>

          <View style={[styles.badge, { borderColor: theme.primary }]}>
            <ThemedText type="smallBold" themeColor="primary" style={styles.badgeText}>
              POWERED BY AI ADAPTIVE BIOMETRICS
            </ThemedText>
          </View>

          <ThemedText type="title" style={styles.heading}>
            EVOLUSI PERFORMA TANPA BATAS
          </ThemedText>

          <ThemedText type="default" themeColor="textSecondary" style={styles.subheading}>
            AI Workout Plan Personal untuk Gaya Hidup Urban Aktif.
          </ThemedText>

          {/* Stat tiles as individual small bordered Cards, not one solid hero card (finding #3) */}
          <View style={styles.statsRow}>
            {STATS.map((stat) => (
              <View
                key={stat.label}
                style={[
                  styles.statCard,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}>
                <ThemedText type="subtitle" themeColor="primary" style={styles.statValue}>
                  {stat.value}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
                  {stat.label}
                </ThemedText>
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <PillButton
              label="MULAI PERJALANAN KEBUGARAN →"
              onPress={() => router.push('/onboarding/biometric')}
            />

            <Pressable
              hitSlop={8}
              style={styles.loginRow}
              onPress={() => router.replace('/login')}>
              <ThemedText type="default" themeColor="textSecondary">
                Sudah punya akun?{' '}
              </ThemedText>
              <ThemedText type="default" themeColor="primary" style={styles.loginLink}>
                Masuk
              </ThemedText>
            </Pressable>

            <View style={styles.trustRow}>
              <Ionicons name="lock-closed" size={12} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary">
                ENKRIPSI DATA BIOMETRIK · ISO 27001 AI
              </ThemedText>
            </View>
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
    alignItems: 'center',
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  logoMark: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWord: {
    fontSize: 14,
    letterSpacing: 0.3,
  },
  logoSuper: {
    fontSize: 9,
    fontWeight: '700',
    marginLeft: -2,
    marginTop: -5,
  },
  headerTitle: {
    fontSize: 16,
    lineHeight: 20,
  },
  stepBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  stepBadgeText: {
    fontSize: 10,
    letterSpacing: 0.4,
  },
  badge: {
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    letterSpacing: 0.4,
    fontSize: 11,
  },
  heading: {
    fontSize: 34,
    lineHeight: 40,
    textAlign: 'center',
  },
  subheading: {
    marginTop: 2,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 18,
    lineHeight: 22,
  },
  statLabel: {
    fontSize: 9,
    letterSpacing: 0.3,
    textAlign: 'center',
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
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
});
