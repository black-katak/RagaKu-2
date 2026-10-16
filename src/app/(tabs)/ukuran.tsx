import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Disclaimer } from '@/components/disclaimer';
import { useProfile } from '@/components/profile-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { NumberStepper } from '@/components/ui/number-stepper';
import { PillButton } from '@/components/ui/pill-button';
import { StatTile } from '@/components/ui/stat-tile';
import { BottomTabInset, FontFamily, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { buildIndicators } from '@/lib/health';
import type { MeasurementRecord } from '@/lib/model';
import { storage } from '@/lib/storage';

export default function UkuranScreen() {
  const theme = useTheme();
  const { profile } = useProfile();
  const [latest, setLatest] = useState<MeasurementRecord | null>(null);
  const [neckCm, setNeckCm] = useState(38);

  const load = useCallback(async () => {
    const list = await storage.getMeasurements();
    setLatest(list.length ? list[list.length - 1] : null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const indicators = useMemo(() => {
    if (!latest?.waistCm) return null;
    return buildIndicators({
      heightCm: profile.heightCm,
      gender: profile.gender,
      waistCm: latest.waistCm,
      neckCm: latest.neckCm ?? neckCm,
      hipCm: latest.hipCm ?? null,
    });
  }, [latest, profile.heightCm, profile.gender, neckCm]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: BottomTabInset + Spacing.six }]}
          showsVerticalScrollIndicator={false}>
          <View>
            <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
              PENGUKURAN TUBUH
            </ThemedText>
            <ThemedText style={styles.title}>Ukuran & Indikator</ThemedText>
          </View>

          <Card style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              PENGUKURAN DARI FOTO
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Ambil satu foto seluruh tubuh dari depan. Foto dikirim melalui koneksi aman,
              diproses, lalu dihapus dari server. Hanya angka ukuran yang disimpan.
            </ThemedText>
            <PillButton
              label={latest ? 'Ukur ulang dari foto' : 'Mulai pengukuran foto'}
              onPress={() => router.push('/measurement')}
            />
          </Card>

          {latest ? (
            <Card style={styles.section}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                HASIL ESTIMASI ({latest.date})
              </ThemedText>
              <View style={styles.statRow}>
                <StatTile label="Pinggang" value={fmt(latest.waistCm)} unit="cm" />
                <StatTile label="Pinggul" value={fmt(latest.hipCm)} unit="cm" />
              </View>
              <View style={styles.statRow}>
                <StatTile label="Lengan" value={fmt(latest.armLengthCm)} unit="cm" />
                <StatTile label="Bahu" value={fmt(latest.shoulderWidthCm)} unit="cm" />
              </View>
            </Card>
          ) : null}

          {/* Neck entry needed for US Navy body fat */}
          <Card style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              LINGKAR LEHER (UNTUK ESTIMASI LEMAK)
            </ThemedText>
            <NumberStepper
              label="Lingkar leher"
              value={latest?.neckCm ?? neckCm}
              unit="cm"
              min={20}
              max={60}
              step={0.5}
              onChange={setNeckCm}
            />
          </Card>

          {/* F4: advanced indicators */}
          {indicators ? (
            <Card style={styles.section}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                INDIKATOR LANJUTAN
              </ThemedText>

              <IndicatorRow
                label="WHtR (pinggang ÷ tinggi)"
                value={indicators.whtr.toFixed(2)}
                sub={indicators.whtrRisk}
                subColor={indicators.whtr < 0.5 ? theme.primary : theme.warning}
              />
              {indicators.whr != null ? (
                <IndicatorRow label="WHR (pinggang ÷ pinggul)" value={indicators.whr.toFixed(2)} />
              ) : null}
              {indicators.bodyFatPercent != null ? (
                <IndicatorRow
                  label="Estimasi lemak tubuh (US Navy)"
                  value={`${indicators.bodyFatPercent}%`}
                  sub="estimasi"
                />
              ) : null}
            </Card>
          ) : (
            <View style={[styles.infoBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Ionicons name="information-circle-outline" size={16} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.infoText}>
                Lakukan pengukuran foto untuk melihat WHtR, WHR, dan estimasi lemak tubuh.
              </ThemedText>
            </View>
          )}

          <Disclaimer text="Semua ukuran dan indikator adalah estimasi, dipengaruhi kualitas foto. Bukan diagnosis medis." />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function fmt(v?: number | null): string {
  return v != null ? `${v}` : '–';
}

function IndicatorRow({
  label,
  value,
  sub,
  subColor,
}: {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.indicatorRow, { borderColor: theme.border }]}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.indicatorLabel}>
        {label}
      </ThemedText>
      <View style={styles.indicatorValueBlock}>
        <ThemedText type="smallBold" style={styles.indicatorValue}>
          {value}
        </ThemedText>
        {sub ? (
          <ThemedText type="small" style={{ color: subColor ?? theme.textSecondary }}>
            {sub}
          </ThemedText>
        ) : null}
      </View>
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
  statRow: { flexDirection: 'row', gap: Spacing.two },
  infoBox: {
    flexDirection: 'row',
    gap: 8,
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: { flex: 1 },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  indicatorLabel: { flex: 1 },
  indicatorValueBlock: { alignItems: 'flex-end' },
  indicatorValue: { fontSize: 18 },
});
