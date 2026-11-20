import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Disclaimer } from '@/components/disclaimer';
import { useProfile } from '@/components/profile-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { LineChart } from '@/components/ui/line-chart';
import { NumberStepper } from '@/components/ui/number-stepper';
import { PillButton } from '@/components/ui/pill-button';
import { StatTile } from '@/components/ui/stat-tile';
import { BottomTabInset, FontFamily, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ProgressEntry } from '@/lib/model';
import { storage } from '@/lib/storage';

export default function ProgressScreen() {
  const theme = useTheme();
  const { profile } = useProfile();

  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [weight, setWeight] = useState(profile.weightKg);
  const [waist, setWaist] = useState(80);
  const [showSavedBanner, setShowSavedBanner] = useState(false);
  const hideBannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setEntries(await storage.getProgress());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    return () => {
      if (hideBannerTimer.current) clearTimeout(hideBannerTimer.current);
    };
  }, []);

  const logEntry = async () => {
    const date = new Date().toISOString().slice(0, 10);
    const next = await storage.addProgress({ date, weightKg: weight, waistCm: waist });
    setEntries(next);
    setShowSavedBanner(true);
    if (hideBannerTimer.current) clearTimeout(hideBannerTimer.current);
    hideBannerTimer.current = setTimeout(() => setShowSavedBanner(false), 4000);
  };

  const weightSeries = entries.map((e) => e.weightKg);
  const waistSeries = entries.filter((e) => e.waistCm != null).map((e) => e.waistCm as number);
  const whtrSeries = entries
    .filter((e) => e.waistCm != null)
    .map((e) => Math.round(((e.waistCm as number) / profile.heightCm) * 1000) / 1000);

  const first = entries[0];
  const last = entries[entries.length - 1];
  const weightDelta = first && last ? +(last.weightKg - first.weightKg).toFixed(1) : 0;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: BottomTabInset + Spacing.six }]}
          showsVerticalScrollIndicator={false}>
          <View>
            <ThemedText style={styles.title}>PROGRES</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.subheading}>
              Catat berat dan lingkar pinggang. Tren muncul setelah ada catatan.
            </ThemedText>
          </View>

          {showSavedBanner ? (
            <View style={[styles.savedBanner, { backgroundColor: '#134E4A' }]}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
              <ThemedText type="small" style={styles.savedBannerText}>
                Catatan berat hari ini tersimpan. Tren mingguan muncul setelah tiga catatan.
              </ThemedText>
            </View>
          ) : null}

          <Card style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              CATAT HARI INI
            </ThemedText>
            <NumberStepper
              label="Berat badan"
              value={weight}
              unit="kg"
              min={30}
              max={250}
              step={0.1}
              onChange={setWeight}
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <NumberStepper
              label="Lingkar pinggang (opsional)"
              value={waist}
              unit="cm"
              min={40}
              max={200}
              step={0.5}
              onChange={setWaist}
            />
            <PillButton label="Simpan catatan" onPress={logEntry} />
          </Card>

          {entries.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Ionicons name="trending-up-outline" size={18} color={theme.textSecondary} />
              <View style={styles.emptyText}>
                <ThemedText type="smallBold">Belum ada catatan</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Simpan berat badanmu hari ini untuk mulai melihat tren mingguan.
                </ThemedText>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.statRow}>
                <StatTile
                  label="Berat terbaru"
                  value={`${last.weightKg}`}
                  unit="kg"
                  trend={weightDelta !== 0 ? `${weightDelta > 0 ? '↑' : '↓'} ${Math.abs(weightDelta)} kg` : undefined}
                  trendPositive={weightDelta <= 0}
                />
                <StatTile label="Catatan" value={`${entries.length}`} unit="entri" />
              </View>

              {weightSeries.length >= 2 ? (
                <Card style={styles.section}>
                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                    TREN BERAT BADAN
                  </ThemedText>
                  <LineChart data={weightSeries} height={140} />
                </Card>
              ) : null}

              {waistSeries.length >= 2 ? (
                <Card style={styles.section}>
                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                    TREN LINGKAR PINGGANG
                  </ThemedText>
                  <LineChart data={waistSeries} height={120} />
                </Card>
              ) : null}

              {whtrSeries.length >= 2 ? (
                <Card style={styles.section}>
                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                    TREN WHtR
                  </ThemedText>
                  <LineChart data={whtrSeries} targetValue={0.5} height={120} />
                  <ThemedText type="small" themeColor="textMuted">
                    Garis putus-putus = batas sehat 0,5.
                  </ThemedText>
                </Card>
              ) : null}
            </>
          )}


          <Disclaimer text="Grafik bersifat informatif. Perubahan berat drastis sebaiknya dibahas dengan tenaga kesehatan." />
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
    paddingTop: Spacing.two,
    gap: Spacing.three,
  },
  title: { fontFamily: FontFamily.headingExtraBold, fontSize: 36, lineHeight: 40 },
  subheading: { marginTop: Spacing.one },
  section: { gap: Spacing.three },
  sectionLabel: { letterSpacing: 0.4 },
  divider: { height: 1 },
  statRow: { flexDirection: 'row', gap: Spacing.two },
  emptyBox: {
    flexDirection: 'row',
    gap: 8,
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyText: { flex: 1, gap: 2 },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.three,
    borderRadius: 12,
  },
  savedBannerText: { flex: 1, color: '#FFFFFF' },
});
