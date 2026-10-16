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
  { value: 'lutut', label: 'Pemulihan Meniskus Lutut' },
  { value: 'punggung', label: 'Nyeri Punggung Bawah' },
  { value: 'bahu', label: 'Bahu Kaku' },
  { value: 'tekanan-rendah', label: 'Tekanan Darah Rendah' },
  { value: 'tekanan-tinggi', label: 'Tekanan Darah Tinggi' },
  { value: 'asma', label: 'Asma' },
  { value: 'tidak-ada', label: 'Tidak Ada Cedera / Kondisi Fit' },
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
            eyebrow="ONBOARDING ASSESSMENT"
            step={2}
            totalSteps={4}
            title="RIWAYAT CEDERA & KESEHATAN"
            description="Tandai area tubuh yang perlu dihindari atau dipulihkan agar RagaKu AI memodifikasi gerakan latihan secara aman."
          />

          <Card style={styles.section}>
            <View style={[styles.scanBadge, { backgroundColor: theme.backgroundSelected }]}>
              <Ionicons name="body" size={14} color={theme.primary} />
              <ThemedText type="smallBold" themeColor="primary">
                BIOMETRIC SCAN ACTIVE
              </ThemedText>
            </View>

            <Segmented
              options={[
                { label: 'DEPAN', value: 'depan' },
                { label: 'BELAKANG', value: 'belakang' },
              ]}
              value={bodyView}
              onChange={setBodyView}
            />

            <BodyDiagram activeZones={activeZones} onToggleZone={toggleZone} />

            <ThemedText type="small" themeColor="textSecondary" style={styles.scanHint}>
              Ketuk titik persendian atau pilih tag kondisi di bawah
            </ThemedText>
          </Card>

          <Card style={styles.section}>
            <View style={styles.rowBetween}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                KONDISI CEPAT
              </ThemedText>
              <ThemedText type="smallBold" themeColor="primary">
                {activeInjuries.length} TERPILIH
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
                KONDISI / RIWAYAT LAINNYA (KUSTOM)
              </ThemedText>
              <ThemedText
                type="smallBold"
                themeColor="primary"
                style={styles.addNoteLink}
                onPress={() => setShowNoteInput((prev) => !prev)}>
                + TAMBAH CATATAN KHUSUS
              </ThemedText>
            </View>

            {showNoteInput ? (
              <View style={styles.noteBlock}>
                <TextInput
                  value={noteDraft}
                  onChangeText={setNoteDraft}
                  placeholder="Contoh: Pasca operasi hernia / jahitan di bagian perut 6 bulan lalu, saraf kejepit ringan..."
                  placeholderTextColor={theme.textMuted}
                  multiline
                  numberOfLines={3}
                  style={[
                    styles.noteInput,
                    { borderColor: theme.border, color: theme.text, backgroundColor: theme.background },
                  ]}
                />
                <PillButton
                  label="SIMPAN"
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
            <View style={[styles.protectionBox, { backgroundColor: '#FFF7ED', borderColor: theme.warning }]}>
              <View style={styles.protectionHeader}>
                <Ionicons name="shield-checkmark" size={16} color={theme.warning} />
                <ThemedText type="smallBold" style={{ color: theme.warning, flex: 1 }}>
                  RAGAKU AI PROTECTION PROTOCOL AKTIF
                </ThemedText>
                <View style={[styles.safeBadge, { backgroundColor: '#FFEDD5' }]}>
                  <ThemedText type="small" style={{ color: theme.warning, fontSize: 10 }}>
                    PEMBERITAHUAN AMAN
                  </ThemedText>
                </View>
              </View>
              {activeInjuries.map((injury) => (
                <ThemedText key={injury} type="small" themeColor="textSecondary" style={styles.protectionText}>
                  • {PROTECTION_NOTES[injury]}
                </ThemedText>
              ))}
            </View>
          ) : null}

          <PillButton
            label="SIMPAN & LANJUT PILIH ALAT →"
            onPress={() => router.push('/onboarding/equipment')}
          />
          <ThemedText
            type="smallBold"
            themeColor="textSecondary"
            style={styles.skipLink}
            onPress={() => router.push('/onboarding/equipment')}>
            LEWATI LANGKAH INI
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
  scanBadge: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
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
  safeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
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
