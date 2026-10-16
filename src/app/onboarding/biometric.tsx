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

const GENDER_CARDS: { value: Gender; title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'pria', title: 'Pria', subtitle: 'Rasio Massa Otot +12%', icon: 'male' },
  { value: 'wanita', title: 'Wanita', subtitle: 'Zona Fat-Oxidation +18%', icon: 'female' },
];

const OTHER_GENDERS: { value: Gender; label: string }[] = [
  { value: 'non-biner', label: 'Non-biner' },
  { value: 'rahasia', label: 'Pilih tidak memberitahu' },
];

const GOAL_OPTIONS: { value: Goal; title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'turun-berat', title: 'Turunkan Berat Badan', subtitle: 'Fat Loss & Defisit Kalori', icon: 'flame' },
  { value: 'bentuk-otot', title: 'Naikkan Massa Otot', subtitle: 'Hypertrophy & Rekomposisi', icon: 'barbell' },
  { value: 'ketahanan', title: 'Naikkan Berat Badan', subtitle: 'Bulking Bersih & Surplus', icon: 'trending-up' },
];

export default function BiometricStep() {
  const theme = useTheme();
  const { data, update, toggleInList } = useOnboarding();

  // Figma shows a gender pre-selected (AKTIF badge) so CTA renders solid, not washed-out (finding #9)
  useEffect(() => {
    if (!data.gender) update({ gender: 'pria' });
  }, [data.gender, update]);

  const bmi = calculateBmi(data.targetWeightKg, data.heightCm);
  const deficit = (data.targetWeightKg - data.weightKg).toFixed(1);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <OnboardingHeader
            eyebrow="KALIBRASI BIOMETRIK"
            step={1}
            totalSteps={4}
            title="TENTUKAN TARGET & PROFIL FISIKMU"
            description="RagaKu AI mengkalkulasi baseline metabolisme dan volume latihan personal secara presisi."
          />

          <Card style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              JENIS KELAMIN BIOLOGIS
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
                      <ThemedText type="small" themeColor="textSecondary">
                        {option.subtitle}
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
            <View style={styles.rowBetween}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                USIA ATLETIK
              </ThemedText>
              <ThemedText type="small" themeColor="primary">
                PEAK PERFORMANCE
              </ThemedText>
            </View>
            <View style={styles.rowBetween}>
              <ThemedText type="title" style={styles.ageValue}>
                {data.age}
                <ThemedText type="default" themeColor="textSecondary">
                  {' '}
                  tahun
                </ThemedText>
              </ThemedText>
              <View style={styles.targetRegenBlock}>
                <ThemedText type="small" themeColor="textMuted" style={styles.targetRegenLabel}>
                  TARGET REGENERASI
                </ThemedText>
                <ThemedText type="smallBold" style={styles.targetRegenValue}>
                  20–35 Thn (Zone A)
                </ThemedText>
              </View>
            </View>
            <SliderTrack
              value={data.age}
              min={15}
              max={70}
              step={1}
              onChange={(age) => update({ age })}
              labels={['15 thn', '35 thn', '55 thn', '70+']}
            />
          </Card>

          <Card style={styles.section}>
            <View style={styles.stepperRow}>
              <NumberStepper
                label="Tinggi Badan"
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
                label="Berat Saat Ini"
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
                TARGET UTAMA KEBUGARAN
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Pilih Fokus
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
                          {option.title.toUpperCase()}
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
              label="Target Berat Akhir"
              value={data.targetWeightKg}
              unit="kg"
              min={30}
              max={200}
              onChange={(targetWeightKg) => update({ targetWeightKg })}
            />
            <View style={[styles.badgeInline, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="small" themeColor="primary">
                Defisit {deficit} kg
              </ThemedText>
            </View>
            <View style={[styles.bmiRow, { backgroundColor: theme.background }]}>
              <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
              <ThemedText type="small" themeColor="textSecondary">
                Kalkulasi BMI: {bmi.toFixed(1)} · {bmiCategory(bmi)}
              </ThemedText>
            </View>
          </Card>

          <View style={[styles.tipRow, { backgroundColor: theme.backgroundSelected }]}>
            <Ionicons name="flash" size={16} color={theme.primary} />
            <ThemedText type="small" themeColor="textSecondary" style={styles.tipText}>
              RagaKu menetapkan target mingguan moderat 0.5 kg/pekan untuk melindungi massa otot
              murni dan metabolisme tiroid.
            </ThemedText>
          </View>

          <PillButton
            label="LANJUT: CEK RIWAYAT FISIK →"
            disabled={!data.gender}
            onPress={() => router.push('/onboarding/health')}
          />
          <ThemedText type="small" themeColor="textSecondary" style={styles.footerNote}>
            Data biometrik terenkripsi aman & privat di RagaKu
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
  targetRegenBlock: {
    alignItems: 'flex-end',
    gap: 2,
  },
  targetRegenLabel: {
    fontSize: 10,
    letterSpacing: 0.3,
    textAlign: 'right',
  },
  targetRegenValue: {
    fontSize: 13,
    textAlign: 'right',
  },
  stepperRow: {},
  divider: {
    height: 1,
  },
  badgeInline: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  bmiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.two,
    borderRadius: 12,
  },
  tipRow: {
    flexDirection: 'row',
    gap: 8,
    padding: Spacing.three,
    borderRadius: 16,
  },
  tipText: {
    flex: 1,
  },
  footerNote: {
    textAlign: 'center',
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
