import { Ionicons } from '@expo/vector-icons';
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
  'full-gym': 'Full Gym',
  'home-gym': 'Alat Rumahan',
  bodyweight: 'Tanpa Alat',
  kardio: 'Kardio Gear',
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
      ? `Alat Rumahan (${homeGymItems.length} peralatan)`
      : `${CATEGORY_LABELS[activeCategory]} (${data.equipment.length} peralatan)`;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <OnboardingHeader
            eyebrow="PERSONALISASI FASILITAS"
            step={3}
            totalSteps={4}
            title="PERALATAN APA YANG KAMU MILIKI?"
            description="RagaKu menyesuaikan program latihan harian dengan fasilitas yang kamu punya hari ini."
          />

          {/* Category A: Full Gym Commercial (single-select) */}
          <Pressable onPress={() => selectCategory('full-gym')}>
            <Card selected={activeCategory === 'full-gym'} style={styles.categorySection}>
              <View style={styles.categoryHeaderRow}>
                <ThemedText type="subtitle" style={styles.categoryTitle}>
                  FULL GYM COMMERCIAL
                </ThemedText>
                <View style={[styles.categoryBadge, { backgroundColor: theme.background }]}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.categoryBadgeText}>
                    AKSES LENGKAP
                  </ThemedText>
                </View>
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                Barbell, Dumbbell, Cable Machine, Bench & Smith Machine
              </ThemedText>
              <ThemedText type="smallBold" themeColor="primary" style={styles.linkText}>
                Sesuaikan Alat Gym Tersedia
              </ThemedText>
            </Card>
          </Pressable>

          {/* Category B: Alat Rumahan / Home Gym (single-select category + multi-select items) */}
          <Pressable onPress={() => selectCategory('home-gym')}>
            <Card selected={activeCategory === 'home-gym'} style={styles.categorySection}>
              <View style={styles.categoryHeaderRow}>
                <ThemedText type="subtitle" style={styles.categoryTitle}>
                  ALAT RUMAHAN (HOME GYM)
                </ThemedText>
                <View style={[styles.categoryBadge, { backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText type="small" themeColor="primary" style={styles.categoryBadgeText}>
                    AKTIF
                  </ThemedText>
                </View>
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                Pilih alat yang benar-benar kamu sediakan di rumah:
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
                  <ThemedText type="smallBold" themeColor="primary" style={styles.linkText}>
                    + Tambah Alat Lain
                  </ThemedText>
                </View>
              ) : null}
            </Card>
          </Pressable>

          {/* Category C: Tanpa Alat / Bodyweight (single-select) */}
          <Pressable onPress={() => selectCategory('bodyweight')}>
            <Card selected={activeCategory === 'bodyweight'} style={styles.categorySection}>
              <View style={styles.categoryHeaderRow}>
                <ThemedText type="subtitle" style={styles.categoryTitle}>
                  TANPA ALAT (BODYWEIGHT)
                </ThemedText>
                <View style={[styles.categoryBadge, { backgroundColor: theme.background }]}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.categoryBadgeText}>
                    BEBAS LOKASI
                  </ThemedText>
                </View>
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                Hanya butuh matras latihan, latihan di mana saja & kapan saja
              </ThemedText>
            </Card>
          </Pressable>

          {/* Category D: Kardio Gear (single-select, visual-only -> maps to bodyweight subset) */}
          <Pressable onPress={() => selectCategory('kardio')}>
            <Card selected={activeCategory === 'kardio'} style={styles.categorySection}>
              <View style={styles.categoryHeaderRow}>
                <ThemedText type="subtitle" style={styles.categoryTitle}>
                  KARDIO GEAR
                </ThemedText>
                <View style={[styles.categoryBadge, { backgroundColor: theme.background }]}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.categoryBadgeText}>
                    STAMINA
                  </ThemedText>
                </View>
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                Treadmill, Sepeda Statis, Skipping Rope untuk denyut optimal
              </ThemedText>
            </Card>
          </Pressable>

          <View style={[styles.recommendationBox, { backgroundColor: theme.backgroundSelected }]}>
            <Ionicons name="sparkles" size={16} color={theme.primary} />
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold" themeColor="primary" style={styles.recommendationLabel}>
                REKOMENDASI ADAPTIF
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.recommendationText}>
                AI RagaKu otomatis mengeliminasi gerakan yang membutuhkan mesin jika memilih alat
                rumahan.
              </ThemedText>
            </View>
          </View>
          {/* skipped: gym-photo thumbnail near REKOMENDASI ADAPTIF — no image asset exists in project */}

          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: theme.primary }]} />
            <ThemedText type="smallBold" themeColor="textSecondary">
              STATUS SELEKSI: <ThemedText type="smallBold">{statusLabel}</ThemedText>
            </ThemedText>
          </View>

          <PillButton
            label="LANJUT: OLAHRAGA FAVORIT →"
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
  categorySection: {
    gap: Spacing.two,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 20,
    lineHeight: 24,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  categoryBadgeText: {
    fontSize: 10,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  linkText: {
    fontSize: 11,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    alignItems: 'center',
  },
  recommendationBox: {
    flexDirection: 'row',
    gap: 8,
    padding: Spacing.three,
    borderRadius: 16,
  },
  recommendationText: {
    flex: 1,
  },
  recommendationLabel: {
    marginBottom: 2,
    letterSpacing: 0.3,
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
