import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SPORT_OPTIONS: {
  value: Activity;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}[] = [
  { value: 'renang', title: 'Renang', subtitle: 'Kardio low-impact, bahu dan tulang belakang', icon: 'swim' },
  { value: 'lari', title: 'Lari dan jogging', subtitle: 'Daya tahan jantung dan kaki', icon: 'run-fast' },
  { value: 'badminton', title: 'Badminton', subtitle: 'Refleks dan eksplosivitas', icon: 'badminton' },
  { value: 'basket', title: 'Bola basket', subtitle: 'Lompatan dan footwork', icon: 'basketball' },
  { value: 'sepeda', title: 'Sepeda', subtitle: 'Daya tahan paha dan stamina', icon: 'bike' },
  { value: 'futsal', title: 'Futsal', subtitle: 'Sprint interval', icon: 'soccer' },
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
  const { data, update, toggleInList, complete } = useOnboarding();

  const selectedSports = data.activities.filter((activity) =>
    SPORT_OPTIONS.some((option) => option.value === activity),
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <OnboardingHeader
            eyebrow="LANGKAH TERAKHIR"
            step={4}
            totalSteps={4}
            title="OLAHRAGA FAVORIT"
            description="Pilih minimal 2 aktivitas untuk variasi kardio dan pemulihan mingguan."
          />

          <View style={styles.grid}>
            {SPORT_OPTIONS.map((option) => (
              <SelectGridCard
                key={option.value}
                title={option.title}
                subtitle={option.subtitle}
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
              Gaya latihan (opsional)
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
              Hari per minggu
            </ThemedText>

            <View style={styles.rowBetween}>
              <ThemedText type="default">Hari per minggu</ThemedText>
              <ThemedText type="subtitle" themeColor="primary" style={styles.daysValue}>
                {data.daysPerWeek} hari
              </ThemedText>
            </View>
            <SliderTrack
              value={data.daysPerWeek}
              min={1}
              max={7}
              step={1}
              onChange={(daysPerWeek) => update({ daysPerWeek })}
              labels={['1 hari', '7 hari']}
            />

            <ThemedText type="default" style={styles.durationLabel}>
              Durasi per sesi
            </ThemedText>
            <Segmented
              options={DURATION_OPTIONS}
              value={data.sessionDuration}
              onChange={(sessionDuration) => update({ sessionDuration })}
            />
          </Card>

          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: theme.primary }]} />
            <ThemedText type="smallBold" themeColor="textSecondary" style={{ flex: 1 }}>
              {selectedSports.length} olahraga dipilih
            </ThemedText>
          </View>

          <PillButton
            label="Buat program"
            disabled={selectedSports.length < 2}
            onPress={() => complete()}
          />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Jangan tambah alignItems: 'center' di sini -- baca catatan MaxContentWidth di constants/theme.ts.
  safeArea: { flex: 1 },
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
});
