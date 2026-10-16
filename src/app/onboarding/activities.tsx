import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/components/auth-context';
import {
  useOnboarding,
  type Activity,
  type SessionDuration,
} from '@/components/onboarding/onboarding-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { OnboardingHeader } from '@/components/ui/onboarding-header';
import { PillButton } from '@/components/ui/pill-button';
import { Segmented } from '@/components/ui/segmented';
import { SelectGridCard } from '@/components/ui/select-items';
import { SliderTrack } from '@/components/ui/slider-track';
import { MOCK_USER_ID } from '@/constants/mockUser';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { toUserProfileInput } from '@/lib/mappers';
import { saveUserProfile } from '@/services/userService';

const SPORT_OPTIONS: {
  value: Activity;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}[] = [
  { value: 'renang', title: 'Renang', subtitle: 'Bahu & mobilitas tulang belakang', badge: 'KARDIO LOW-IMPACT', icon: 'swim' },
  { value: 'lari', title: 'Lari & Jogging', subtitle: 'Kardiovaskular & ketahanan kaki', badge: 'VO2 MAX BOOSTER', icon: 'run-fast' },
  { value: 'badminton', title: 'Badminton', subtitle: 'Reaktivitas & eksplosivitas', badge: 'REFLEKS & AGILITY', icon: 'badminton' },
  { value: 'basket', title: 'Bola Basket', subtitle: 'Lompatan vertikal & footwork', badge: 'AGILITY & HIIT', icon: 'basketball' },
  { value: 'sepeda', title: 'Sepeda', subtitle: 'Daya tahan kuadrisep & stamina', badge: 'ENDURANCE', icon: 'bike' },
  { value: 'futsal', title: 'Futsal', subtitle: 'Sprint interval anaerobik', badge: 'INTENSITAS TINGGI', icon: 'soccer' },
];

const STYLE_OPTIONS: { value: Activity; label: string }[] = [
  { value: 'hiit', label: 'HIIT' },
  { value: 'calisthenics', label: 'Calisthenics' },
  { value: 'powerlifting', label: 'Powerlifting' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'pilates', label: 'Pilates' },
  { value: 'cardio', label: 'Cardio' },
];

const DURATION_OPTIONS: { label: string; value: SessionDuration }[] = [
  { label: '15m', value: 15 },
  { label: '30m', value: 30 },
  { label: '45m', value: 45 },
  { label: '60m+', value: 60 },
];

export default function ActivitiesStep() {
  const theme = useTheme();
  const { data, update, toggleInList } = useOnboarding();
  const { session } = useAuth();

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>();

  const selectedSports = data.activities.filter((activity) =>
    SPORT_OPTIONS.some((option) => option.value === activity),
  );

  /**
   * Final onboarding submit: persist the collected profile to
   * `users/{MOCK_USER_ID}` BEFORE entering the main tab layout. A write
   * failure keeps the user on this screen with a visible error rather than
   * silently dropping their answers.
   */
  const handleSubmit = async () => {
    setSaving(true);
    setSaveError(undefined);
    try {
      await saveUserProfile(
        MOCK_USER_ID,
        toUserProfileInput(data, {
          displayName: session?.name,
          email: session?.email,
        }),
      );
      router.replace('/beranda');
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : 'Gagal menyimpan profil. Coba lagi.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <OnboardingHeader
            eyebrow="TAHAP TERAKHIR"
            step={4}
            totalSteps={4}
            title="AKTIVITAS & OLAHRAGA FAVORIT"
            description="Pilih minimal 2 aktivitas yang kamu nikmati untuk variasi jadwal kardio dan recovery mingguan."
          />

          <View style={[styles.algoIntroBox, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="smallBold" themeColor="primary" style={styles.algoIntroLabel}>
              ALGORITMA PERSONALISASI
            </ThemedText>
            <ThemedText type="smallBold" style={styles.algoIntroTitle}>
              ADAPTIF SESUAI PREFERENSI
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Mencegah kebosanan & cedera sendi repetitif.
            </ThemedText>
          </View>

          <View style={styles.grid}>
            {SPORT_OPTIONS.map((option) => (
              <SelectGridCard
                key={option.value}
                title={option.title}
                subtitle={option.subtitle}
                badge={option.badge}
                selected={data.activities.includes(option.value)}
                onPress={() => toggleInList('activities', option.value)}
                icon={
                  <MaterialCommunityIcons
                    name={option.icon}
                    size={26}
                    color={data.activities.includes(option.value) ? theme.primary : theme.textSecondary}
                  />
                }
              />
            ))}
          </View>

          <Card style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              GAYA LATIHAN FAVORIT (OPSIONAL)
            </ThemedText>
            <View style={styles.chipRow}>
              {STYLE_OPTIONS.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  selected={data.activities.includes(option.value)}
                  onPress={() => toggleInList('activities', option.value)}
                />
              ))}
            </View>
          </Card>

          <Card style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              JADWAL LATIHAN
            </ThemedText>

            <View style={styles.rowBetween}>
              <ThemedText type="default">Hari per Minggu</ThemedText>
              <ThemedText type="subtitle" themeColor="primary" style={styles.daysValue}>
                {data.daysPerWeek}
              </ThemedText>
            </View>
            <SliderTrack
              value={data.daysPerWeek}
              min={1}
              max={7}
              step={1}
              onChange={(daysPerWeek) => update({ daysPerWeek })}
              labels={['1', '2', '3', '4', '5', '6', '7']}
            />

            <ThemedText type="default" style={styles.durationLabel}>
              Durasi per Sesi
            </ThemedText>
            <Segmented
              options={DURATION_OPTIONS}
              value={data.sessionDuration}
              onChange={(sessionDuration) => update({ sessionDuration })}
            />
          </Card>

          <View style={[styles.algoBox, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="small" themeColor="primary" style={styles.algoLabel}>
              INTEGRASI KALENDER RAGAKU AI
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Aktivitas favorit akan disisipkan otomatis sebagai sesi aktif pada hari istirahat gym
              angkat beban.
            </ThemedText>
          </View>

          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: theme.primary }]} />
            <ThemedText type="smallBold" themeColor="textSecondary" style={{ flex: 1 }}>
              {selectedSports.length} OLAHRAGA DIPILIH
            </ThemedText>
            {selectedSports.length > 0 ? (
              <ThemedText type="smallBold" themeColor="textSecondary">
                {selectedSports
                  .map((activity) => SPORT_OPTIONS.find((o) => o.value === activity)?.title)
                  .filter(Boolean)
                  .join(' & ')
                  .toUpperCase()}
              </ThemedText>
            ) : null}
          </View>

          {saveError ? (
            <ThemedText type="small" themeColor="warning" style={styles.footerNote}>
              {saveError}
            </ThemedText>
          ) : null}

          <PillButton
            label="BUAT PROGRAM RAGAKU AI PERSONAL SAYA →"
            disabled={selectedSports.length < 2 || saving}
            loading={saving}
            onPress={handleSubmit}
          />
          <ThemedText type="small" themeColor="textSecondary" style={styles.footerNote}>
            ENKRIPSI BIOMETRIK & KEBUGARAN TERJAMIN
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, alignItems: 'center' },
  scrollContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  section: {
    gap: Spacing.three,
  },
  sectionLabel: {
    letterSpacing: 0.4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  daysValue: {
    fontSize: 22,
  },
  durationLabel: {
    marginTop: Spacing.two,
  },
  algoBox: {
    padding: Spacing.three,
    borderRadius: 16,
    gap: 4,
  },
  algoLabel: {
    letterSpacing: 0.4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  algoIntroBox: {
    padding: Spacing.three,
    borderRadius: 16,
    gap: 2,
  },
  algoIntroLabel: {
    letterSpacing: 0.4,
    fontSize: 10,
  },
  algoIntroTitle: {
    fontSize: 16,
  },
  footerNote: {
    textAlign: 'center',
  },
});
