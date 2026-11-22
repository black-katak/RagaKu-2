import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useOnboarding, type Equipment } from '@/components/onboarding/onboarding-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { OnboardingHeader } from '@/components/ui/onboarding-header';
import { PillButton } from '@/components/ui/pill-button';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Home Gym equipment sub-items map onto the existing flat Equipment[] model.
const HOME_GYM_EQUIPMENT: { value: Equipment; label: string }[] = [
  { value: 'dumbbell', label: 'Dumbbell Pasang' },
  { value: 'resistance-band', label: 'Resistance Band' },
  { value: 'pull-up-bar', label: 'Pull-up Bar Portable' },
  { value: 'kettlebell', label: 'Kettlebell' },
];

// Four visual categories (finding #4). Only 'home-gym' exposes a multi-select chip grid;
// the other three are single-select and set a sensible Equipment[] subset directly.
type Category = 'full-gym' | 'home-gym' | 'bodyweight' | 'kardio';

const CATEGORY_EQUIPMENT: Record<Category, Equipment[]> = {
  'full-gym': ['barbell'],
  'home-gym': ['dumbbell'],
  bodyweight: ['bodyweight'],
  kardio: ['bodyweight'],
};

const CATEGORY_LABELS: Record<Category, string> = {
  'full-gym': 'Gym lengkap',
  'home-gym': 'Alat rumahan',
  bodyweight: 'Tanpa alat',
  kardio: 'Kardio',
};

export default function EquipmentStep() {
  const theme = useTheme();
  const { data, update, toggleInList } = useOnboarding();

  // Derive the active visual category from the existing equipment[] data, since the
  // data model isn't extended: home-gym items win, else bodyweight, else full-gym (barbell).
  const homeGymItems = data.equipment.filter((item) =>
    HOME_GYM_EQUIPMENT.some((option) => option.value === item),
  );
  // bodyweight and kardio both map to equipment=['bodyweight'] (no new data-model field),
  // so track which one the user explicitly tapped purely for card highlighting.
  const [visualOverride, setVisualOverride] = useState<Category | null>(null);

  const activeCategory: Category = homeGymItems.length
    ? 'home-gym'
    : data.equipment.includes('barbell')
      ? 'full-gym'
      : visualOverride ?? 'bodyweight';

  const selectCategory = (category: Category) => {
    setVisualOverride(category === 'bodyweight' || category === 'kardio' ? category : null);
    update({ equipment: CATEGORY_EQUIPMENT[category] });
  };

  const statusLabel =
    activeCategory === 'home-gym'
      ? `Alat rumahan (${homeGymItems.length} alat)`
      : `${CATEGORY_LABELS[activeCategory]} (${data.equipment.length} alat)`;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <OnboardingHeader
            eyebrow="PERALATAN"
            step={3}
            totalSteps={4}
            title="ALAT YANG KAMU PUNYA"
            description="Program dipilih dari alat yang benar-benar tersedia."
          />

          {/* Category A: Full Gym (single-select) */}
          <Pressable onPress={() => selectCategory('full-gym')}>
            <Card selected={activeCategory === 'full-gym'} style={styles.categorySection}>
              <ThemedText type="subtitle" style={styles.categoryTitle}>
                Gym lengkap
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Barbell, dumbbell, mesin kabel, bench
              </ThemedText>
            </Card>
          </Pressable>

          {/* Category B: Alat Rumahan / Home Gym (single-select category + multi-select items) */}
          <Pressable onPress={() => selectCategory('home-gym')}>
            <Card selected={activeCategory === 'home-gym'} style={styles.categorySection}>
              <ThemedText type="subtitle" style={styles.categoryTitle}>
                Alat rumahan
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Centang yang kamu punya, atau tulis sendiri.
              </ThemedText>

              {activeCategory === 'home-gym' ? (
                <View style={styles.chipRow}>
                  {HOME_GYM_EQUIPMENT.map((option) => (
                    <Chip
                      key={option.value}
                      label={option.label}
                      selected={data.equipment.includes(option.value)}
                      onPress={() => toggleInList('equipment', option.value)}
                    />
                  ))}
                </View>
              ) : null}
            </Card>
          </Pressable>

          {/* Category C: Tanpa Alat / Bodyweight (single-select) */}
          <Pressable onPress={() => selectCategory('bodyweight')}>
            <Card selected={activeCategory === 'bodyweight'} style={styles.categorySection}>
              <ThemedText type="subtitle" style={styles.categoryTitle}>
                Tanpa alat
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Hanya badan sendiri dan matras
              </ThemedText>
            </Card>
          </Pressable>

          {/* Category D: Kardio (single-select, visual-only -> maps to bodyweight subset) */}
          <Pressable onPress={() => selectCategory('kardio')}>
            <Card selected={activeCategory === 'kardio'} style={styles.categorySection}>
              <ThemedText type="subtitle" style={styles.categoryTitle}>
                Kardio
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Treadmill, sepeda statis, tali skipping
              </ThemedText>
            </Card>
          </Pressable>

          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: theme.primary }]} />
            <ThemedText type="smallBold" themeColor="textSecondary">
              Terpilih: <ThemedText type="smallBold">{statusLabel}</ThemedText>
            </ThemedText>
          </View>

          <PillButton
            label="Lanjut"
            disabled={data.equipment.length === 0}
            onPress={() => router.push('/onboarding/activities')}
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
  categorySection: {
    gap: Spacing.two,
  },
  categoryTitle: {
    fontSize: 20,
    lineHeight: 24,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
