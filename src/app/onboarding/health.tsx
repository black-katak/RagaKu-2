import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BodyDiagram, type BodyZone } from '@/components/onboarding/body-diagram';
import { useOnboarding, type Injury } from '@/components/onboarding/onboarding-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { OnboardingHeader } from '@/components/ui/onboarding-header';
import { PillButton } from '@/components/ui/pill-button';
import { Segmented } from '@/components/ui/segmented';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const ZONE_TO_INJURY: Record<BodyZone, Injury> = {
  bahu: 'bahu',
  punggung: 'punggung',
  lutut: 'lutut',
};

const QUICK_CONDITIONS: { value: Injury; label: string }[] = [
  { value: 'lutut', label: 'Pemulihan meniskus lutut' },
  { value: 'punggung', label: 'Nyeri punggung bawah' },
  { value: 'bahu', label: 'Bahu kaku' },
  { value: 'tekanan-rendah', label: 'Tekanan darah rendah' },
  { value: 'tekanan-tinggi', label: 'Tekanan darah tinggi' },
  { value: 'asma', label: 'Asma' },
  { value: 'tidak-ada', label: 'Tidak ada cedera' },
];

const PROTECTION_NOTES: Partial<Record<Injury, string>> = {
  lutut: 'Kecualikan Box Jumps & Deep Lunges, gunakan Glute Bridges & Straight Leg Isometric.',
  punggung: 'Kecualikan gerakan fleksi tulang belakang berlebih dan deadlift beban berat.',
  bahu: 'Kecualikan overhead press berat dan gerakan rotasi ekstrem pada bahu.',
  'tekanan-tinggi':
    'Kecualikan posisi kepala lebih rendah dari jantung dalam waktu lama & latihan isometric berlebih.',
  'tekanan-rendah': 'Tambahkan transisi gerakan bertahap untuk menghindari pusing mendadak.',
  asma: 'Sesuaikan intensitas kardio dan sediakan jeda istirahat lebih panjang.',
};

export default function HealthStep() {
  const theme = useTheme();
  const { data, toggleInList } = useOnboarding();

  // Local-only UI state (finding #5/#6): data model is not extended, these never persist across nav.
  const [bodyView, setBodyView] = useState<'depan' | 'belakang'>('depan');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [savedNotes, setSavedNotes] = useState<string[]>([]);

  const toggleInjury = (value: Injury) => {
    if (value === 'tidak-ada') {
      toggleInList('injuries', 'tidak-ada');
      return;
    }
    toggleInList('injuries', value);
  };

  const toggleZone = (zone: BodyZone) => toggleInjury(ZONE_TO_INJURY[zone]);

  const activeInjuries = data.injuries.filter((item) => item !== 'tidak-ada');
  const activeZones = (Object.keys(ZONE_TO_INJURY) as BodyZone[]).filter((zone) =>
    data.injuries.includes(ZONE_TO_INJURY[zone]),
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <OnboardingHeader
            eyebrow="RIWAYAT KESEHATAN"
            step={2}
            totalSteps={4}
            title="AREA BERMASALAH"
            description="Ketuk bagian tubuh yang cedera atau perlu dihindari. Gerakan latihan disesuaikan."
          />

          <Card style={styles.section}>
            <Segmented
              options={[
                { label: 'Depan', value: 'depan' },
                { label: 'Belakang', value: 'belakang' },
              ]}
              value={bodyView}
              onChange={setBodyView}
            />

            <BodyDiagram activeZones={activeZones} onToggleZone={toggleZone} />

            <ThemedText type="small" themeColor="textSecondary" style={styles.scanHint}>
              {bodyView === 'depan'
                ? 'Bahu kiri dipilih. Sisi mengikuti tubuhmu, bukan layar. Ketuk lagi untuk membatalkan.'
                : 'Tampak belakang. Sisi mengikuti tubuhmu, bukan layar. Pilih area punggung atau bahu.'}
            </ThemedText>
          </Card>

          <Card style={styles.section}>
            <View style={styles.rowBetween}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                Kondisi cepat
              </ThemedText>
            </View>
            <View style={styles.chipRow}>
              {QUICK_CONDITIONS.map((condition) => (
                <Chip
                  key={condition.value}
                  label={condition.label}
                  selected={data.injuries.includes(condition.value)}
                  onPress={() => toggleInjury(condition.value)}
                />
              ))}
            </View>
          </Card>

          <Card style={styles.section}>
            <View style={styles.rowBetween}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                Riwayat lain (opsional)
              </ThemedText>
              <ThemedText
                type="smallBold"
                themeColor="primary"
                style={styles.addNoteLink}
                onPress={() => setShowNoteInput((prev) => !prev)}>
                + Tambah catatan
              </ThemedText>
            </View>

            {showNoteInput ? (
              <View style={styles.noteBlock}>
                <TextInput
                  value={noteDraft}
                  onChangeText={setNoteDraft}
                  placeholder="Tulis kondisi lain di sini"
                  placeholderTextColor={theme.textMuted}
                  multiline
                  numberOfLines={3}
                  style={[
                    styles.noteInput,
                    { borderColor: theme.border, color: theme.text, backgroundColor: theme.background },
                  ]}
                />
                <PillButton
                  label="Simpan"
                  style={styles.saveButton}
                  onPress={() => {
                    if (!noteDraft.trim()) return;
                    setSavedNotes((prev) => [...prev, noteDraft.trim()]);
                    setNoteDraft('');
                    setShowNoteInput(false);
                  }}
                />
              </View>
            ) : null}

            {savedNotes.length > 0 ? (
              <View style={styles.noteTagsBlock}>
                <ThemedText type="small" themeColor="textMuted">
                  Tag Aktif:
                </ThemedText>
                <View style={styles.chipRow}>
                  {savedNotes.map((note, index) => (
                    <Chip key={`${note}-${index}`} label={note} selected />
                  ))}
                </View>
              </View>
            ) : null}
          </Card>

          {activeInjuries.length > 0 ? (
            <View style={[styles.protectionBox, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
              <View style={styles.protectionHeader}>
                <Ionicons name="information-circle" size={16} color={theme.primary} />
                <ThemedText type="smallBold" themeColor="primary">
                  Catatan latihan
                </ThemedText>
              </View>
              {activeInjuries.map((injury) => (
                <ThemedText key={injury} type="small" themeColor="textSecondary" style={styles.protectionText}>
                  • {PROTECTION_NOTES[injury]}
                </ThemedText>
              ))}
            </View>
          ) : null}

          <PillButton
            label="Simpan & lanjut"
            onPress={() => router.push('/onboarding/equipment')}
          />
          <ThemedText
            type="smallBold"
            themeColor="textSecondary"
            style={styles.skipLink}
            onPress={() => router.push('/onboarding/equipment')}>
            Lewati langkah ini
          </ThemedText>
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
  section: {
    gap: Spacing.three,
  },
  sectionLabel: {
    letterSpacing: 0.4,
  },
  scanHint: {
    textAlign: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  protectionBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.three,
    gap: 6,
  },
  protectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  protectionText: {
    lineHeight: 18,
  },
  skipLink: {
    textAlign: 'center',
  },
  addNoteLink: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  noteBlock: {
    gap: Spacing.two,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  saveButton: {
    height: 40,
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
  },
  noteTagsBlock: {
    gap: 6,
  },
});
