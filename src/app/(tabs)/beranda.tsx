import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Disclaimer } from '@/components/disclaimer';
import { useProfile } from '@/components/profile-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { NumberStepper } from '@/components/ui/number-stepper';
import { PillButton } from '@/components/ui/pill-button';
import { Segmented } from '@/components/ui/segmented';
import { BottomTabInset, FontFamily, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  bmiCategory,
  calculateBmi,
  calculateCalories,
  idealWeightRange,
  type ActivityLevel,
  type BmiStandard,
  type Gender,
  type Goal,
} from '@/lib/health';

const ACTIVITY_LABELS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Jarang gerak' },
  { value: 'light', label: 'Ringan' },
  { value: 'active', label: 'Aktif' },
  { value: 'very_active', label: 'Sangat aktif' },
];

const GOAL_LABELS: { value: Goal; label: string }[] = [
  { value: 'lose', label: 'Turunkan berat' },
  { value: 'maintain', label: 'Jaga berat' },
  { value: 'gain', label: 'Naikkan berat' },
];

export default function BerandaScreen() {
  const theme = useTheme();
  const { profile, updateProfile } = useProfile();

  const bmi = useMemo(
    () => calculateBmi(profile.weightKg, profile.heightCm),
    [profile.weightKg, profile.heightCm],
  );
  const category = bmiCategory(bmi, profile.bmiStandard);
  const ideal = idealWeightRange(profile.heightCm, profile.bmiStandard);
  const calories = useMemo(
    () =>
      calculateCalories({
        age: profile.age,
        gender: profile.gender,
        heightCm: profile.heightCm,
        weightKg: profile.weightKg,
        activityLevel: profile.activityLevel,
        goal: profile.goal,
      }),
    [profile],
  );

  const bmiColor =
    category === 'Normal' ? theme.primary : category.includes('kurang') ? theme.accent : theme.warning;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: BottomTabInset + Spacing.six }]}
          showsVerticalScrollIndicator={false}>
          <View>
            <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
              RAGAKU
            </ThemedText>
            <ThemedText style={styles.title}>Kondisi Tubuhmu</ThemedText>
          </View>

          {/* F2: BMI result card */}
          <Card style={styles.bmiCard}>
            <View style={styles.rowBetween}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                INDEKS MASSA TUBUH (BMI)
              </ThemedText>
              <Segmented<BmiStandard>
                options={[
                  { label: 'Asia-Pasifik', value: 'asia_pacific' },
                  { label: 'WHO', value: 'who' },
                ]}
                value={profile.bmiStandard}
                onChange={(bmiStandard) => updateProfile({ bmiStandard })}
              />
            </View>
            <View style={styles.bmiValueRow}>
              <ThemedText style={[styles.bmiValue, { color: bmiColor }]}>{bmi.toFixed(1)}</ThemedText>
              <View style={[styles.categoryBadge, { backgroundColor: theme.backgroundSelected }]}>
                <ThemedText type="smallBold" style={{ color: bmiColor }}>
                  {category}
                </ThemedText>
              </View>
            </View>
            <View style={[styles.idealBox, { backgroundColor: theme.background }]}>
              <Ionicons name="resize-outline" size={16} color={theme.primary} />
              <ThemedText type="small" themeColor="textSecondary">
                Rentang berat ideal:{' '}
                <ThemedText type="smallBold" themeColor="primary">
                  {ideal.minKg}–{ideal.maxKg} kg
                </ThemedText>
              </ThemedText>
            </View>
            <ThemedText type="small" themeColor="textMuted">
              BMI = berat ÷ (tinggi dalam meter)². Standar{' '}
              {profile.bmiStandard === 'asia_pacific' ? 'Asia-Pasifik (normal 18,5–22,9)' : 'WHO (normal 18,5–24,9)'}.
            </ThemedText>
          </Card>

          {/* Calorie summary (computed locally for display; backend is authoritative for the plan) */}
          <Card style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              PERKIRAAN KEBUTUHAN HARIAN
            </ThemedText>
            <View style={styles.calorieRow}>
              <CalorieStat label="BMR" value={`${calories.bmr}`} unit="kkal" />
              <CalorieStat label="TDEE" value={`${calories.tdee}`} unit="kkal" />
              <CalorieStat label="Target" value={`${calories.targetCalories}`} unit="kkal" highlight />
            </View>
            {calories.floorApplied ? (
              <ThemedText type="small" themeColor="warning">
                Target dinaikkan ke batas aman {calories.safeFloor} kkal.
              </ThemedText>
            ) : null}
          </Card>

          {/* F1: Profile editor */}
          <Card style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              PROFIL
            </ThemedText>

            <ThemedText type="small" themeColor="textSecondary">
              Jenis kelamin
            </ThemedText>
            <Segmented<Gender>
              options={[
                { label: 'Pria', value: 'male' },
                { label: 'Wanita', value: 'female' },
              ]}
              value={profile.gender}
              onChange={(gender) => updateProfile({ gender })}
            />

            <View style={styles.ageRow}>
              <ThemedText type="default">Usia</ThemedText>
              <NumberStepper
                label=""
                value={profile.age}
                unit="th"
                min={18}
                max={80}
                onChange={(age) => updateProfile({ age })}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <NumberStepper
              label="Tinggi badan"
              value={profile.heightCm}
              unit="cm"
              min={120}
              max={220}
              onChange={(heightCm) => updateProfile({ heightCm })}
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <NumberStepper
              label="Berat badan"
              value={profile.weightKg}
              unit="kg"
              min={30}
              max={250}
              step={0.5}
              onChange={(weightKg) => updateProfile({ weightKg })}
            />
          </Card>

          <Card style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              TINGKAT AKTIVITAS
            </ThemedText>
            <View style={styles.chipRow}>
              {ACTIVITY_LABELS.map((a) => (
                <Chip
                  key={a.value}
                  label={a.label}
                  selected={profile.activityLevel === a.value}
                  onPress={() => updateProfile({ activityLevel: a.value })}
                />
              ))}
            </View>

            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              TUJUAN
            </ThemedText>
            <View style={styles.chipRow}>
              {GOAL_LABELS.map((g) => (
                <Chip
                  key={g.value}
                  label={g.label}
                  selected={profile.goal === g.value}
                  onPress={() => updateProfile({ goal: g.value })}
                />
              ))}
            </View>

            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              CATATAN POLA MAKAN (OPSIONAL)
            </ThemedText>
            <TextInput
              value={profile.dietNotes}
              onChangeText={(dietNotes) => updateProfile({ dietNotes: dietNotes.slice(0, 200) })}
              placeholder="Mis. vegetarian, alergi kacang, jadwal puasa..."
              placeholderTextColor={theme.textMuted}
              multiline
              style={[
                styles.notesInput,
                { borderColor: theme.border, color: theme.text, backgroundColor: theme.background },
              ]}
            />
            <ThemedText type="small" themeColor="textMuted">
              {(profile.dietNotes ?? '').length}/200
            </ThemedText>
          </Card>

          <PillButton label="Buat rencana hari ini →" onPress={() => router.push('/rencana')} />

          <Disclaimer />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function CalorieStat({
  label,
  value,
  unit,
  highlight,
}: {
  label: string;
  value: string;
  unit: string;
  highlight?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.calorieStat, { backgroundColor: highlight ? theme.backgroundSelected : theme.background }]}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.calorieLabel}>
        {label}
      </ThemedText>
      <ThemedText type="smallBold" style={{ color: highlight ? theme.primary : theme.text, fontSize: 18 }}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textMuted">
        {unit}
      </ThemedText>
    </View>
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
    paddingTop: Spacing.two,
    gap: Spacing.three,
  },
  eyebrow: { letterSpacing: 0.6, textTransform: 'uppercase' },
  title: { fontFamily: FontFamily.headingBold, fontSize: 28, lineHeight: 32 },
  bmiCard: { gap: Spacing.three },
  section: { gap: Spacing.three },
  sectionLabel: { letterSpacing: 0.4 },
  rowBetween: { gap: Spacing.two },
  bmiValueRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  bmiValue: { fontFamily: FontFamily.headingExtraBold, fontSize: 56, lineHeight: 60 },
  categoryBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  idealBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.two, borderRadius: 12 },
  calorieRow: { flexDirection: 'row', gap: Spacing.two },
  calorieStat: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: Spacing.three, borderRadius: 12 },
  calorieLabel: { fontSize: 11, letterSpacing: 0.3 },
  ageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  divider: { height: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
    minHeight: 72,
    textAlignVertical: 'top',
    fontSize: 14,
  },
});
