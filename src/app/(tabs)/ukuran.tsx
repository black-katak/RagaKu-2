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

// Default angka manual yang wajar untuk dewasa, dipakai hanya saat belum ada record sama sekali.
const MANUAL_DEFAULTS = { waistCm: 80, hipCm: 95, neckCm: 38, chestCm: 90, shoulderWidthCm: 44 };

export default function UkuranScreen() {
  const theme = useTheme();
  const { profile } = useProfile();
  const [latest, setLatest] = useState<MeasurementRecord | null>(null);

  // Form ukuran manual — di-seed dari record terakhir (foto ATAU manual) kalau ada,
  // supaya mengedit tidak mulai dari nol setiap kali.
  const [waistCm, setWaistCm] = useState(MANUAL_DEFAULTS.waistCm);
  const [hipCm, setHipCm] = useState(MANUAL_DEFAULTS.hipCm);
  const [neckCm, setNeckCm] = useState(MANUAL_DEFAULTS.neckCm);
  const [chestCm, setChestCm] = useState(MANUAL_DEFAULTS.chestCm);
  const [shoulderWidthCm, setShoulderWidthCm] = useState(MANUAL_DEFAULTS.shoulderWidthCm);

  const load = useCallback(async () => {
    const list = await storage.getMeasurements();
    const record = list.length ? list[list.length - 1] : null;
    setLatest(record);
    if (record) {
      setWaistCm(record.waistCm ?? MANUAL_DEFAULTS.waistCm);
      setHipCm(record.hipCm ?? MANUAL_DEFAULTS.hipCm);
      setNeckCm(record.neckCm ?? MANUAL_DEFAULTS.neckCm);
      setChestCm(record.chestCm ?? MANUAL_DEFAULTS.chestCm);
      setShoulderWidthCm(record.shoulderWidthCm ?? MANUAL_DEFAULTS.shoulderWidthCm);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const saveManual = async () => {
    const date = new Date().toISOString().slice(0, 10);
    const next = await storage.upsertMeasurement({
      date,
      waistCm,
      hipCm,
      neckCm,
      chestCm,
      shoulderWidthCm,
      // Pengukuran manual tidak menghasilkan panjang lengan — hanya model CV yang bisa.
      armLengthCm: latest?.date === date ? latest.armLengthCm : null,
      source: 'manual',
    });
    setLatest(next[next.length - 1]);
  };

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

  const resultTitle = latest
    ? latest.source === 'manual'
      ? `UKURAN MANUAL (${latest.date})`
      : `HASIL ESTIMASI FOTO (${latest.date})`
    : null;

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

          {/* Jalur manual — selalu bisa dipakai, tidak butuh kamera atau backend CV aktif. */}
          <Card style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              ISI UKURAN MANUAL
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Ukur dengan meteran kain lalu masukkan angkanya di sini. Lingkar pinggang wajib
              diisi; lainnya opsional dan menambah indikator di bawah.
            </ThemedText>
            <NumberStepper label="Lingkar pinggang" value={waistCm} unit="cm" min={40} max={200} step={0.5} onChange={setWaistCm} />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <NumberStepper label="Lingkar pinggul" value={hipCm} unit="cm" min={40} max={200} step={0.5} onChange={setHipCm} />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <NumberStepper label="Lingkar leher" value={neckCm} unit="cm" min={20} max={60} step={0.5} onChange={setNeckCm} />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <NumberStepper label="Lingkar dada" value={chestCm} unit="cm" min={50} max={200} step={0.5} onChange={setChestCm} />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <NumberStepper label="Lebar bahu" value={shoulderWidthCm} unit="cm" min={25} max={80} step={0.5} onChange={setShoulderWidthCm} />
            <PillButton label="Simpan ukuran" onPress={saveManual} />
          </Card>

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
              variant="outline"
              onPress={() => router.push('/measurement')}
            />
          </Card>

          {latest ? (
            <Card style={styles.section}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                {resultTitle}
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
                Isi ukuran manual atau lakukan pengukuran foto untuk melihat WHtR, WHR, dan
                estimasi lemak tubuh.
              </ThemedText>
            </View>
          )}

          <Disclaimer text="Semua ukuran dan indikator adalah estimasi — baik dari foto maupun input manual. Bukan diagnosis medis." />
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
  divider: { height: 1 },
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
