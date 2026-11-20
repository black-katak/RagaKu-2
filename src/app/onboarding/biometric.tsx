import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useOnboarding, calculateBmi, bmiCategory, type Gender, type Goal } from '@/components/onboarding/onboarding-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { NumberStepper } from '@/components/ui/number-stepper';
import { OnboardingHeader } from '@/components/ui/onboarding-header';
import { PillButton } from '@/components/ui/pill-button';
import { SliderTrack } from '@/components/ui/slider-track';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const GENDER_CARDS: { value: Gender; title: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'pria', title: 'Pria', icon: 'male' },
  { value: 'wanita', title: 'Wanita', icon: 'female' },
];

const OTHER_GENDERS: { value: Gender; label: string }[] = [
  { value: 'non-biner', label: 'Non-biner' },
  { value: 'rahasia', label: 'Tidak ingin menyebut' },
];

const GOAL_OPTIONS: { value: Goal; title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'turun-berat', title: 'Turunkan berat badan', subtitle: 'Defisit kalori terukur', icon: 'flame' },
  { value: 'bentuk-otot', title: 'Naikkan massa otot', subtitle: 'Latihan beban dan rekomposisi', icon: 'barbell' },
  { value: 'ketahanan', title: 'Naikkan berat badan', subtitle: 'Surplus kalori bersih', icon: 'trending-up' },
];

export default function BiometricStep() {
  const theme = useTheme();
  const { data, update, toggleInList } = useOnboarding();

  // Figma shows a gender pre-selected (AKTIF badge) so CTA renders solid, not washed-out (finding #9)
  useEffect(() => {
    if (!data.gender) update({ gender: 'pria' });
  }, [data.gender, update]);

  const bmi = calculateBmi(data.targetWeightKg, data.heightCm);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <OnboardingHeader
            eyebrow="DATA DIRI"
            step={1}
            totalSteps={4}
            title="DATA DIRIMU"
            description="Dipakai untuk menghitung kebutuhan kalori dan target latihan."
          />

          <Card style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              Jenis kelamin
            </ThemedText>
            <View style={styles.genderRow}>
              {GENDER_CARDS.map((option) => {
                const selected = data.gender === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={styles.genderFlex}
                    onPress={() => update({ gender: option.value })}>
                    <Card selected={selected} style={styles.genderCard}>
                      {selected ? (
                        <View style={[styles.activeBadge, { backgroundColor: theme.primary }]}>
                          <ThemedText type="small" style={styles.activeBadgeText}>
                            AKTIF
                          </ThemedText>
                        </View>
                      ) : null}
                      <Ionicons
                        name={option.icon}
                        size={28}
                        color={selected ? theme.primary : theme.textSecondary}
                      />
                      <ThemedText type="smallBold" style={styles.genderTitle}>
                        {option.title}
                      </ThemedText>
                    </Card>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.chipRow}>
              {OTHER_GENDERS.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  selected={data.gender === option.value}
                  onPress={() => update({ gender: option.value })}
                />
              ))}
            </View>
          </Card>

          <Card style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              Usia
            </ThemedText>
            <ThemedText type="title" style={styles.ageValue}>
              {data.age}
              <ThemedText type="default" themeColor="textSecondary">
                {' '}
                th
              </ThemedText>
            </ThemedText>
            <SliderTrack
              value={data.age}
              min={18}
              max={80}
              step={1}
              onChange={(age) => update({ age })}
              labels={['18 th', '80 th']}
            />
          </Card>

          <Card style={styles.section}>
            <View style={styles.stepperRow}>
              <NumberStepper
                label="Tinggi badan"
                value={data.heightCm}
                unit="cm"
                min={120}
                max={220}
                onChange={(heightCm) => update({ heightCm })}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.stepperRow}>
              <NumberStepper
                label="Berat saat ini"
                value={data.weightKg}
                unit="kg"
                min={30}
                max={200}
                onChange={(weightKg) => update({ weightKg })}
              />
            </View>
          </Card>

          <Card style={styles.section}>
            <View style={styles.rowBetween}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                Target utama
              </ThemedText>
            </View>
            <View style={styles.listGap}>
              {GOAL_OPTIONS.map((option) => {
                const selected = data.goals.includes(option.value);
                return (
                  <Pressable key={option.value} onPress={() => toggleInList('goals', option.value)}>
                    <Card selected={selected} style={styles.goalRow}>
                      <View
                        style={[
                          styles.goalIconBox,
                          { backgroundColor: selected ? theme.backgroundSelected : theme.background },
                        ]}>
                        <Ionicons
                          name={option.icon}
                          size={20}
                          color={selected ? theme.primary : theme.textSecondary}
                        />
                      </View>
                      <View style={styles.goalTextBlock}>
                        <ThemedText type="smallBold" style={styles.goalTitle}>
                          {option.title}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {option.subtitle}
                        </ThemedText>
                      </View>
                      {selected ? (
                        <View style={[styles.checkCircle, { backgroundColor: theme.primary }]}>
                          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                        </View>
                      ) : (
                        <View style={[styles.checkCircleEmpty, { borderColor: theme.border }]} />
                      )}
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          <Card style={styles.section}>
            <NumberStepper
              label="Target berat akhir"
              value={data.targetWeightKg}
              unit="kg"
              min={30}
              max={200}
              onChange={(targetWeightKg) => update({ targetWeightKg })}
            />
            <View style={[styles.bmiRow, { backgroundColor: theme.background }]}>
              <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
              <ThemedText type="small" themeColor="textSecondary">
                BMI di target ini: {bmi.toFixed(1)} ({bmiCategory(bmi)}, standar Asia-Pasifik).
                Dihitung dari tinggi dan target berat di atas.
              </ThemedText>
            </View>
          </Card>

          <PillButton
            label="Lanjut"
            disabled={!data.gender}
            onPress={() => router.push('/onboarding/health')}
          />
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
  section: {
    gap: Spacing.three,
  },
  sectionLabel: {
    letterSpacing: 0.4,
  },
  genderRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  genderFlex: {
    flex: 1,
  },
  genderCard: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.four,
  },
  genderTitle: {
    fontSize: 16,
    marginTop: 4,
  },
  activeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    letterSpacing: 0.3,
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
  ageValue: {
    fontSize: 40,
    lineHeight: 44,
  },
  stepperRow: {},
  divider: {
    height: 1,
  },
  bmiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.two,
    borderRadius: 12,
  },
  listGap: {
    gap: Spacing.two,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  goalIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTextBlock: {
    flex: 1,
    gap: 2,
  },
  goalTitle: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleEmpty: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
  },
});
