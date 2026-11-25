/**
 * "Isi tinggi & berat dari foto" card for the Profil screen.
 *
 * Flow: consent -> pick/take photo -> backend `/api/v1/estimate-body` (Gemini)
 * -> show the estimate -> user explicitly applies it.
 *
 * Applying only calls `onApply`; the Profil screen decides what to do with the
 * numbers (it fills the form, and the user still presses "Simpan perubahan").
 * The estimate is only a guess, so it is never applied automatically, and a
 * low-confidence or out-of-range result cannot be applied at all.
 */
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { PillButton } from '@/components/ui/pill-button';
import { Spacing } from '@/constants/theme';
import { useBodyEstimator } from '@/hooks/useBodyEstimator';
import { useTheme } from '@/hooks/use-theme';

// Same bounds as the height/weight steppers on the Profil screen.
const HEIGHT_RANGE = { min: 120, max: 220 };
const WEIGHT_RANGE = { min: 30, max: 250 };

const CONFIDENCE_LABEL = { low: 'rendah', medium: 'sedang', high: 'tinggi' } as const;

type BodyEstimateCardProps = {
  /** Called with the estimate when the user taps "Pakai di profil". */
  onApply: (heightCm: number, weightKg: number) => void;
};

export function BodyEstimateCard({ onApply }: BodyEstimateCardProps) {
  const theme = useTheme();
  const { estimate, isAnalyzing, error, analyzePhoto, reset } = useBodyEstimator();

  const [consented, setConsented] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [pickerError, setPickerError] = useState<string | null>(null);

  const isWeb = Platform.OS === 'web';

  const inRange =
    estimate !== null &&
    estimate.heightCm >= HEIGHT_RANGE.min &&
    estimate.heightCm <= HEIGHT_RANGE.max &&
    estimate.weightKg >= WEIGHT_RANGE.min &&
    estimate.weightKg <= WEIGHT_RANGE.max;
  const canApply = estimate !== null && estimate.confidence !== 'low' && inRange;

  const handlePick = async (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets[0]?.uri) return;
    await analyzePhoto(result.assets[0].uri);
  };

  const pickFromLibrary = async () => {
    setNotice(null);
    setPickerError(null);
    try {
      await handlePick(
        await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 }),
      );
    } catch {
      setPickerError('Galeri tidak dapat dibuka. Coba lagi.');
    }
  };

  const takePhoto = async () => {
    setNotice(null);
    setPickerError(null);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setPickerError('Izin kamera diperlukan. Kamu masih bisa memilih foto dari galeri.');
        return;
      }
      await handlePick(await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 }));
    } catch {
      setPickerError('Kamera tidak dapat dibuka. Coba pilih dari galeri.');
    }
  };

  const apply = () => {
    if (!estimate || !canApply) return;
    onApply(estimate.heightCm, estimate.weightKg);
    setNotice('Angka sudah diisi ke data diri. Tekan "Simpan perubahan" untuk menyimpannya.');
    reset();
  };

  const discard = () => {
    reset();
    setNotice(null);
  };

  const shownError = pickerError ?? (estimate ? null : error);

  return (
    <Card style={styles.card}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
        ISI TINGGI DAN BERAT DARI FOTO
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Foto seluruh badan dari depan, tegak, pencahayaan merata, pakaian pas badan. Hasilnya
        taksiran, bukan pengukuran.
      </ThemedText>
      <ThemedText type="small" themeColor="textMuted">
        Foto dikirim ke server RagaKu, diteruskan ke layanan AI Google Gemini untuk ditaksir, dan
        tidak disimpan di server RagaKu.
      </ThemedText>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: consented }}
        onPress={() => setConsented((v) => !v)}
        style={styles.consentRow}>
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: consented ? theme.primary : 'transparent',
              borderColor: consented ? theme.primary : theme.border,
            },
          ]}>
          {consented ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
        </View>
        <ThemedText type="small" style={styles.consentText}>
          Saya mengerti dan setuju fotoku diproses seperti di atas.
        </ThemedText>
      </Pressable>

      {!isWeb ? (
        <PillButton
          label={isAnalyzing ? 'Menganalisis foto…' : 'Ambil foto'}
          loading={isAnalyzing}
          disabled={!consented || isAnalyzing}
          onPress={takePhoto}
        />
      ) : null}
      <PillButton
        label={isWeb ? (isAnalyzing ? 'Menganalisis foto…' : 'Pilih foto') : 'Pilih dari galeri'}
        variant={isWeb ? 'primary' : 'outline'}
        loading={isWeb && isAnalyzing}
        disabled={!consented || isAnalyzing}
        onPress={pickFromLibrary}
      />

      {shownError ? (
        <View style={[styles.box, { borderColor: theme.warning }]}>
          <Ionicons name="warning-outline" size={16} color={theme.warning} />
          <ThemedText type="small" style={[styles.boxText, { color: theme.warning }]}>
            {shownError}
          </ThemedText>
        </View>
      ) : null}

      {estimate ? (
        <View style={[styles.result, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
            TAKSIRAN
          </ThemedText>
          <ThemedText type="default">
            Tinggi {Math.round(estimate.heightCm)} cm · Berat {estimate.weightKg.toFixed(1)} kg
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Tingkat keyakinan: {CONFIDENCE_LABEL[estimate.confidence]}
          </ThemedText>
          {estimate.warnings.map((w) => (
            <ThemedText key={w} type="small" style={{ color: theme.warning }}>
              • {w}
            </ThemedText>
          ))}
          {estimate.confidence === 'low' ? (
            <ThemedText type="small" style={{ color: theme.warning }}>
              Keyakinan rendah, jadi tidak bisa dipakai. Coba foto lain, atau ubah angkanya manual
              di atas.
            </ThemedText>
          ) : !inRange ? (
            <ThemedText type="small" style={{ color: theme.warning }}>
              Hasil di luar rentang yang didukung (tinggi {HEIGHT_RANGE.min}–{HEIGHT_RANGE.max} cm,
              berat {WEIGHT_RANGE.min}–{WEIGHT_RANGE.max} kg). Ubah angkanya manual di atas.
            </ThemedText>
          ) : null}
          <PillButton label="Pakai di profil" disabled={!canApply} onPress={apply} />
          <PillButton label="Buang" variant="outline" onPress={discard} />
        </View>
      ) : null}

      {notice ? (
        <View style={[styles.box, { borderColor: theme.primary }]}>
          <Ionicons name="checkmark-circle-outline" size={16} color={theme.primary} />
          <ThemedText type="small" style={[styles.boxText, { color: theme.primary }]}>
            {notice}
          </ThemedText>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three },
  label: { letterSpacing: 0.4 },
  consentRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consentText: { flex: 1 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.two,
  },
  boxText: { flex: 1 },
  result: { gap: Spacing.two, padding: Spacing.three, borderRadius: 12 },
});
