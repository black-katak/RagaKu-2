import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Disclaimer } from '@/components/disclaimer';
import { useProfile } from '@/components/profile-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { PillButton } from '@/components/ui/pill-button';
import { BottomTabInset, FontFamily, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, api, type PlanResponse } from '@/lib/api';
import { screeningBlocked } from '@/lib/model';

const INTENSITY_COLOR: Record<string, 'primary' | 'accent' | 'warning'> = {
  ringan: 'accent',
  sedang: 'primary',
  tinggi: 'warning',
};

type ScreeningKey = 'isPregnant' | 'hasChronicIllness' | 'hasEatingDisorderHistory';

const SCREENING_QUESTIONS: { key: ScreeningKey; label: string }[] = [
  { key: 'isPregnant', label: 'Sedang hamil' },
  { key: 'hasChronicIllness', label: 'Memiliki penyakit kronis' },
  { key: 'hasEatingDisorderHistory', label: 'Pernah mengalami gangguan makan' },
];

export default function RencanaScreen() {
  const theme = useTheme();
  const { profile, screening, updateScreening } = useProfile();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanResponse | null>(null);

  const blocked = screeningBlocked(screening);

  const generate = async () => {
    setError(null);
    setLoading(true);
    setPlan(null);
    try {
      const result = await api.plan(profile, screening);
      setPlan(result);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 429) {
          setError('Model sedang sibuk (rate limit). Coba lagi sebentar lagi.');
        } else if (e.code === 'screening_blocked') {
          setError(e.message);
        } else if (e.status === 0) {
          setError('Tidak dapat terhubung ke server. Periksa koneksi atau alamat API.');
        } else {
          setError(e.message);
        }
      } else {
        setError('Terjadi kesalahan tak terduga.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: BottomTabInset + Spacing.six }]}
          showsVerticalScrollIndicator={false}>
          <View>
            <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
              RENCANA HARIAN
            </ThemedText>
            <ThemedText style={styles.title}>Olahraga & Makan</ThemedText>
          </View>

          {/* Section 7: health screening gate */}
          <Card style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              PENYARINGAN KESEHATAN
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Demi keamanan, centang jika salah satu kondisi berikut berlaku. Jika ada yang dicentang,
              rencana otomatis tidak dibuat.
            </ThemedText>
            {SCREENING_QUESTIONS.map((q) => {
              const checked = screening[q.key];
              return (
                <Checkbox
                  key={q.key}
                  label={q.label}
                  checked={checked}
                  onToggle={() => updateScreening({ [q.key]: !checked } as never)}
                />
              );
            })}
          </Card>

          {blocked ? (
            <View style={[styles.blockBox, { backgroundColor: '#FFF7ED', borderColor: theme.warning }]}>
              <Ionicons name="medkit-outline" size={18} color={theme.warning} />
              <ThemedText type="small" style={{ color: theme.warning, flex: 1 }}>
                Berdasarkan jawaban penyaringan, rencana otomatis tidak dibuat. Silakan konsultasi
                dengan tenaga kesehatan sebelum memulai program.
              </ThemedText>
            </View>
          ) : (
            <PillButton
              label={plan ? 'Buat ulang rencana' : 'Buat rencana hari ini'}
              loading={loading}
              onPress={generate}
            />
          )}

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: theme.background, borderColor: theme.warning }]}>
              <Ionicons name="warning-outline" size={16} color={theme.warning} />
              <ThemedText type="small" style={{ color: theme.warning, flex: 1 }}>
                {error}
              </ThemedText>
            </View>
          ) : null}

          {plan ? <PlanView plan={plan} /> : null}

          <Disclaimer text="Rencana ini dihasilkan AI berdasarkan target kalori yang dihitung aplikasi. Bukan saran medis atau gizi profesional." />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function PlanView({ plan }: { plan: PlanResponse }) {
  const theme = useTheme();
  return (
    <>
      <Card style={styles.section}>
        <View style={styles.rowBetween}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            TARGET HARI INI
          </ThemedText>
          {plan.cached ? (
            <View style={[styles.cachedBadge, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="small" themeColor="primary">
                dari cache
              </ThemedText>
            </View>
          ) : null}
        </View>
        <View style={styles.targetRow}>
          <ThemedText type="smallBold" style={styles.targetValue}>
            {plan.target_calories} <ThemedText type="small" themeColor="textSecondary">kkal</ThemedText>
          </ThemedText>
          <ThemedText type="smallBold" style={styles.targetValue}>
            {plan.protein_g} <ThemedText type="small" themeColor="textSecondary">g protein</ThemedText>
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {plan.plan.summary}
        </ThemedText>
      </Card>

      {/* Exercises */}
      <Card style={styles.section}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
          OLAHRAGA
        </ThemedText>
        {plan.plan.exercises.map((ex, i) => (
          <View key={`${ex.name}-${i}`} style={[styles.exerciseRow, { borderColor: theme.border }]}>
            <View style={[styles.exIndex, { backgroundColor: theme.background }]}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                {String(i + 1).padStart(2, '0')}
              </ThemedText>
            </View>
            <View style={styles.exText}>
              <ThemedText type="smallBold">{ex.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {ex.type} · {ex.duration_min} menit
              </ThemedText>
            </View>
            <View style={[styles.intensityBadge, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="small" themeColor={INTENSITY_COLOR[ex.intensity] ?? 'primary'}>
                {ex.intensity}
              </ThemedText>
            </View>
          </View>
        ))}
      </Card>

      {/* Meals */}
      <Card style={styles.section}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
          MENU MAKAN
        </ThemedText>
        {plan.plan.meals.map((slot, si) => (
          <View key={`${slot.slot}-${si}`} style={styles.mealSlot}>
            <ThemedText type="smallBold" themeColor="primary">
              {slot.slot}
            </ThemedText>
            {slot.items.map((item, ii) => (
              <View key={`${item.name}-${ii}`} style={styles.mealItemRow}>
                <ThemedText type="small" style={styles.mealName}>
                  {item.name}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {item.calories} kkal · {item.protein_g} g
                </ThemedText>
              </View>
            ))}
          </View>
        ))}
      </Card>

      {plan.plan.tips.length > 0 ? (
        <Card style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            TIPS
          </ThemedText>
          {plan.plan.tips.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Ionicons name="bulb-outline" size={16} color={theme.primary} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.tipText}>
                {tip}
              </ThemedText>
            </View>
          ))}
        </Card>
      ) : null}
    </>
  );
}

function Checkbox({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.checkboxRow} onTouchEnd={onToggle}>
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: checked ? theme.warning : 'transparent',
            borderColor: checked ? theme.warning : theme.border,
          },
        ]}>
        {checked ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
      </View>
      <ThemedText type="small">{label}</ThemedText>
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
  section: { gap: Spacing.three },
  sectionLabel: { letterSpacing: 0.4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockBox: {
    flexDirection: 'row',
    gap: 8,
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
  },
  errorBox: {
    flexDirection: 'row',
    gap: 8,
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
  },
  cachedBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  targetRow: { flexDirection: 'row', gap: Spacing.four },
  targetValue: { fontFamily: FontFamily.headingBold, fontSize: 24 },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderTopWidth: 1,
    paddingTop: Spacing.two,
  },
  exIndex: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exText: { flex: 1, gap: 2 },
  intensityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  mealSlot: { gap: 4 },
  mealItemRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  mealName: { flex: 1 },
  tipRow: { flexDirection: 'row', gap: 8 },
  tipText: { flex: 1 },
});
