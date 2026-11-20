import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { PillButton } from '@/components/ui/pill-button';
import { CardRadius, FontFamily, MaxContentWidth, OverlaySurface, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const TOTAL_SETS = 4;
const SET_SECONDS = 45;

const STEPS = [
  {
    title: 'Posisi Awal',
    detail: 'Berdiri tegak dengan kaki selebar bahu, genggam dumbbell dengan telapak tangan menghadap satu sama lain (neutral grip).',
  },
  {
    title: 'Gerakan Kontraksi',
    detail: 'Angkat beban dengan menekuk siku tanpa mengayunkan pinggul, hembuskan napas di puncak kontraksi.',
  },
  {
    title: 'Fase Eksentrik',
    detail: 'Turunkan beban secara perlahan (tempo 3 detik) sambil menarik napas dalam.',
  },
];

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function ActiveSessionScreen() {
  const theme = useTheme();
  const [currentSet, setCurrentSet] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(SET_SECONDS);
  const [playing, setPlaying] = useState(true);
  const [feedback, setFeedback] = useState<'ringan' | 'pas' | 'berat' | null>(null);

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setSecondsLeft((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [playing]);

  const elapsed = SET_SECONDS - secondsLeft;
  const percent = (elapsed / SET_SECONDS) * 100;

  const handleFinishSet = () => {
    if (currentSet >= TOTAL_SETS) {
      router.replace('/progress');
      return;
    }
    setCurrentSet((value) => value + 1);
    setSecondsLeft(SET_SECONDS);
    setPlaying(true);
    setFeedback(null);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              style={[styles.iconButton, { borderColor: theme.border }]}>
              <Ionicons name="chevron-back" size={18} color={theme.text} />
            </Pressable>
            <View style={[styles.ragakuBadge, { borderColor: theme.primary }]}>
              <Ionicons name="flash" size={12} color={theme.primary} />
              <ThemedText type="smallBold" themeColor="primary" style={styles.ragakuBadgeText}>
                RAGAKU
              </ThemedText>
            </View>
            <View style={styles.topCenter}>
              <ThemedText style={styles.sessionTitle}>ACTIVE{'\n'}SESSION</ThemedText>
            </View>
            <View style={[styles.stepPill, { backgroundColor: theme.background }]}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.stepPillText}>
                STEP{'\n'}ACTIVE
              </ThemedText>
            </View>
            <View style={[styles.avatarCircle, { backgroundColor: theme.primary }]}>
              <Ionicons name="person" size={16} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.statusRow}>
            <View style={[styles.statusPill, { borderColor: theme.primary }]}>
              <ThemedText type="smallBold" themeColor="primary" style={styles.eyebrow}>
                BICEPS · BRACHIALIS
              </ThemedText>
            </View>
            <View style={[styles.visionBadge, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="small" themeColor="primary" style={styles.visionBadgeText}>
                VISION ENGINE 2.4
              </ThemedText>
            </View>
          </View>

          <View style={[styles.playerCard, { backgroundColor: OverlaySurface }]}>
            <View style={styles.playerTopRow}>
              <View style={[styles.setBadge, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                <View style={[styles.liveDot, { backgroundColor: theme.primary }]} />
                <ThemedText type="small" style={styles.setBadgeText}>
                  SET {currentSet} SEDANG BERJALAN
                </ThemedText>
              </View>
              <View style={[styles.timeBadge, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                <ThemedText type="smallBold" style={styles.timeBadgeText}>
                  {formatTime(elapsed)} / SET {currentSet}
                </ThemedText>
              </View>
            </View>

            <Pressable
              onPress={() => setPlaying((value) => !value)}
              style={[styles.playButton, { backgroundColor: theme.primary }]}
              hitSlop={12}>
              <Ionicons name={playing ? 'pause' : 'play'} size={30} color="#FFFFFF" />
            </Pressable>

            <View style={styles.playerFooter}>
              <ProgressBar percent={percent} color={theme.primary} trackColor="rgba(255,255,255,0.2)" />
              <View style={styles.playerControlsRow}>
                <Ionicons name="volume-medium-outline" size={16} color="rgba(255,255,255,0.7)" />
                <ThemedText type="small" style={styles.timerSmallText}>
                  {formatTime(secondsLeft)}
                </ThemedText>
                <View style={styles.playerControlsRight}>
                  <View style={[styles.speedPill, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                    <ThemedText type="small" style={styles.speedText}>
                      1.0X
                    </ThemedText>
                  </View>
                  <Ionicons name="scan-outline" size={16} color="rgba(255,255,255,0.7)" />
                </View>
              </View>
            </View>
          </View>

          <Card style={styles.section}>
            <View style={styles.rowBetween}>
              <View style={styles.trackerTitleRow}>
                <Ionicons name="videocam-outline" size={16} color={theme.primary} />
                <ThemedText style={styles.sectionTitle}>SMART CAMERA TRACKER</ThemedText>
              </View>
              <View style={[styles.activeTag, { backgroundColor: theme.backgroundSelected }]}>
                <ThemedText type="small" themeColor="primary">
                  AKTIF
                </ThemedText>
              </View>
            </View>

            <View style={[styles.angleRow, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <View style={styles.angleCol}>
                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.angleLabel}>
                  SUDUT SIKU{'\n'}OPTIMAL
                </ThemedText>
                <ThemedText style={styles.angleValue}>85° – 90°</ThemedText>
              </View>
              <View style={styles.angleColRight}>
                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.angleLabel}>
                  DEVIASI TERKINI
                </ThemedText>
                <View style={[styles.optimalBadge, { backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText type="smallBold" themeColor="primaryDark" style={styles.optimalBadgeText}>
                    Optimal (88°)
                  </ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.metricRow}>
              <Metric label="TARGET" value={`${TOTAL_SETS}`} unit="Set" />
              <Metric label="VOLUME" value="12" unit="Reps" />
              <Metric label="BEBAN" value="8" unit="Kg" />
              <Metric label="JEDA" value="60" unit="Detik" />
            </View>
          </Card>

          <View style={styles.feedbackRow}>
            {(
              [
                { key: 'ringan', label: 'Terlalu Ringan' },
                { key: 'pas', label: 'Pas' },
                { key: 'berat', label: 'Terlalu Berat' },
              ] as const
            ).map((option) => (
              <Pressable
                key={option.key}
                onPress={() => setFeedback(option.key)}
                style={[
                  styles.feedbackChip,
                  {
                    backgroundColor: feedback === option.key ? theme.primary : theme.backgroundElement,
                    borderColor: feedback === option.key ? theme.primary : theme.border,
                  },
                ]}>
                <ThemedText
                  type="small"
                  style={{ color: feedback === option.key ? '#FFFFFF' : theme.text }}>
                  {option.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <View style={styles.instructionHeaderRow}>
            <Ionicons name="reader-outline" size={16} color={theme.text} />
            <ThemedText style={styles.sectionTitle}>INSTRUKSI TAHAP DEMI TAHAP</ThemedText>
          </View>
          <View style={styles.stepsList}>
            {STEPS.map((step, index) => (
              <View key={step.title} style={styles.stepRow}>
                <View
                  style={[
                    styles.stepIndex,
                    index === 0
                      ? { backgroundColor: theme.primary }
                      : { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.border },
                  ]}>
                  <ThemedText
                    type="smallBold"
                    style={index === 0 ? styles.stepIndexTextActive : { color: theme.textSecondary }}>
                    {index + 1}
                  </ThemedText>
                </View>
                <View style={styles.stepTextBlock}>
                  <ThemedText type="smallBold" style={styles.stepTitle}>
                    {step.title.toUpperCase()}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {step.detail}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.tipBox, { backgroundColor: '#FFF7ED', borderColor: theme.warning }]}>
            <Ionicons name="shield-checkmark" size={16} color={theme.warning} />
            <View style={styles.tipTextBlock}>
              <View style={styles.tipTitleRow}>
                <ThemedText type="smallBold" themeColor="warning" style={styles.tipTitle}>
                  RAGAKU AI PRO TIP
                </ThemedText>
                <View style={[styles.tipBadge, { borderColor: theme.warning }]}>
                  <ThemedText type="small" themeColor="warning" style={styles.tipBadgeText}>
                    PROTEKSI SENDI
                  </ThemedText>
                </View>
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                Catatan Khusus: Jaga bahu tetap rileks untuk menghindari ketegangan berlebih pada
                leher dan maksimalkan aktivasi brachioradialis.
              </ThemedText>
            </View>
          </View>

          <PillButton
            label={
              currentSet >= TOTAL_SETS
                ? 'SELESAIKAN LATIHAN →'
                : `SELESAIKAN SET ${currentSet} & MULAI ISTIRAHAT →`
            }
            onPress={handleFinishSet}
          />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.metricItem}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.metricLabel}>
        {label}
      </ThemedText>
      <ThemedText style={styles.metricValue}>{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.metricUnit}>
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
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ragakuBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  ragakuBadgeText: {
    fontSize: 11,
    letterSpacing: 0.3,
  },
  topCenter: {
    flex: 1,
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  eyebrow: {
    letterSpacing: 0.6,
    fontSize: 11,
  },
  sessionTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 20,
    lineHeight: 22,
    textAlign: 'center',
  },
  stepPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  stepPillText: {
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
  },
  avatarCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  visionBadgeText: {
    fontSize: 11,
  },
  playerCard: {
    borderRadius: CardRadius + 4,
    padding: Spacing.three,
    gap: Spacing.three,
    alignItems: 'center',
  },
  playerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  setBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  setBadgeText: {
    color: '#5EEAD4',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  timeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  timeBadgeText: {
    color: '#F1F5F9',
    fontSize: 12,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.four,
  },
  playerFooter: {
    width: '100%',
    gap: 8,
  },
  playerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerControlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  timerSmallText: {
    color: '#CBD5E1',
    fontSize: 11,
  },
  speedPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  speedText: {
    color: '#5EEAD4',
    fontSize: 11,
  },
  section: {
    gap: Spacing.three,
  },
  sectionTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 20,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  angleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
  },
  angleCol: {
    gap: 2,
  },
  angleColRight: {
    gap: 4,
    alignItems: 'flex-end',
  },
  angleLabel: {
    fontSize: 11,
    letterSpacing: 0.3,
  },
  angleValue: {
    fontFamily: FontFamily.headingBold,
    fontSize: 20,
  },
  optimalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  optimalBadgeText: {
    fontSize: 11,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    gap: 2,
  },
  metricLabel: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  metricValue: {
    fontFamily: FontFamily.headingExtraBold,
    fontSize: 26,
  },
  metricUnit: {
    fontSize: 11,
  },
  feedbackRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  feedbackChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  instructionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepsList: {
    gap: Spacing.three,
  },
  stepRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  stepIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndexTextActive: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  stepTextBlock: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  tipBox: {
    flexDirection: 'row',
    gap: 8,
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
  },
  tipTextBlock: {
    flex: 1,
    gap: 4,
  },
  tipTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  tipTitle: {
    fontSize: 12,
  },
  tipBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  tipBadgeText: {
    fontSize: 10,
  },
});
