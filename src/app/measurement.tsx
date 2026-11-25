import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useProfile } from '@/components/profile-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { PillButton } from '@/components/ui/pill-button';
import { StatTile } from '@/components/ui/stat-tile';
import { FontFamily, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, api, type MeasurementResponse } from '@/lib/api';
import { buildIndicators } from '@/lib/health';
import { storage } from '@/lib/storage';

type Phase = 'consent' | 'capture' | 'processing' | 'result';

export default function MeasurementScreen() {
  const theme = useTheme();
  const { profile } = useProfile();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [phase, setPhase] = useState<Phase>('consent');
  const [consented, setConsented] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingResult, setPendingResult] = useState<MeasurementResponse | null>(null);

  const processImage = async (uri: string) => {
    setPhase('processing');
    setError(null);
    try {
      const result = await api.measure(uri, profile.heightCm, profile.gender);
      setPendingResult(result);
      setPhase('result');
    } catch (e) {
      setPhase('capture');
      if (e instanceof ApiError) {
        // The message already says what happened: unreachable server (with the address and
        // reason), Gemini busy (503), timeout (504), unsupported or empty photo, ...
        setError(e.message);
      } else {
        setError('Terjadi kesalahan tak terduga.');
      }
    }
  };

  const capture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
    if (photo?.uri) await processImage(photo.uri);
  };

  const pickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      await processImage(result.assets[0].uri);
    }
  };

  // Gemini marks a photo "low" when it could not see the body well enough (loose clothes,
  // cropped legs, ...) or returned no waist value. Saving that would store a guess as a
  // measurement, so the review screen only lets a usable result through.
  const canSave = pendingResult != null && pendingResult.confidence !== 'low' && pendingResult.waist_cm != null;

  const saveResult = async () => {
    if (!pendingResult || !canSave) return;
    await storage.upsertMeasurement({
      date: new Date().toISOString().slice(0, 10),
      waistCm: pendingResult.waist_cm,
      hipCm: pendingResult.hip_cm,
      armLengthCm: pendingResult.arm_length_cm,
      shoulderWidthCm: pendingResult.shoulder_width_cm,
      chestCm: pendingResult.chest_cm,
      source: 'photo',
    });
    router.back();
  };

  const retake = () => {
    setPendingResult(null);
    setError(null);
    setPhase(permission?.granted ? 'capture' : 'consent');
  };

  // --- Result review (hasil_pengukuran.md: explicit "Simpan hasil" before save) ---
  if (phase === 'result' && pendingResult) {
    // ponytail: alur ini belum mengumpulkan lingkar leher (tidak ada input neck di
    // measurement.tsx), jadi indikator yang butuh neck (estimasi lemak tubuh) belum
    // bisa ditampilkan tanpa data palsu. WHtR dan WHR tidak butuh neck, aman dipakai.
    // Upgrade: tambah input leher di layar ini lalu isi neckCm asli ke buildIndicators.
    const indicators =
      pendingResult.waist_cm != null
        ? buildIndicators({
            heightCm: profile.heightCm,
            gender: profile.gender,
            waistCm: pendingResult.waist_cm,
            neckCm: 0,
            hipCm: pendingResult.hip_cm ?? null,
          })
        : null;

    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <ThemedText style={styles.title}>HASIL PENGUKURAN</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.subheading}>
              Taksiran AI dari satu foto, bukan pengukuran dengan meteran.
            </ThemedText>

            <View style={styles.statRow}>
              <StatTile label="Lingkar pinggang" value={fmt(pendingResult.waist_cm)} unit="cm" />
              <StatTile label="Lingkar pinggul" value={fmt(pendingResult.hip_cm)} unit="cm" />
            </View>
            <View style={styles.statRow}>
              <StatTile label="Lingkar dada" value={fmt(pendingResult.chest_cm)} unit="cm" />
              <StatTile label="Lebar bahu" value={fmt(pendingResult.shoulder_width_cm)} unit="cm" />
            </View>
            <View style={styles.statRow}>
              <StatTile label="Panjang lengan" value={fmt(pendingResult.arm_length_cm)} unit="cm" />
              <StatTile
                label="Rasio pinggang-tinggi"
                value={indicators ? indicators.whtr.toFixed(2) : '–'}
                unit="WHtR"
              />
            </View>

            {pendingResult.warnings.length > 0 ? (
              <View style={[styles.errorBox, { borderColor: theme.warning }]}>
                <Ionicons name="warning-outline" size={16} color={theme.warning} />
                <View style={styles.warningList}>
                  {pendingResult.warnings.map((w) => (
                    <ThemedText key={w} type="small" style={{ color: theme.warning }}>
                      {w}
                    </ThemedText>
                  ))}
                </View>
              </View>
            ) : null}

            {!canSave ? (
              <ThemedText type="small" style={styles.privacyNote}>
                Keyakinan hasil rendah, jadi belum bisa disimpan. Coba foto lagi: seluruh tubuh
                terlihat, pakaian pas badan, cahaya merata.
              </ThemedText>
            ) : null}

            <ThemedText type="small" style={styles.privacyNote}>
              Foto diproses oleh Google Gemini dan tidak disimpan di server RagaKu. Hanya angka di
              atas yang disimpan di perangkatmu.
            </ThemedText>

            <PillButton label="Simpan hasil" disabled={!canSave} onPress={saveResult} />
            <PillButton label="Ukur ulang" variant="outline" onPress={retake} />
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // --- Consent gate (PRD section 7: explicit consent before photo feature) ---
  if (phase === 'consent') {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Pressable onPress={() => router.back()} hitSlop={10} style={styles.closeRow}>
              <Ionicons name="close" size={24} color={theme.text} />
            </Pressable>

            <ThemedText style={styles.title}>UKUR DARI FOTO</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.subheading}>
              Tiga hal agar hasil akurat.
            </ThemedText>

            <Card style={styles.section}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                PANDUAN FOTO
              </ThemedText>
              <Guide icon="body-outline" text="Seluruh tubuh terlihat dari kepala sampai kaki, berdiri tegak menghadap depan." />
              <Guide icon="sunny-outline" text="Cahaya merata dan latar belakang polos." />
              <Guide icon="shirt-outline" text="Pakaian pas badan, bukan longgar." />
            </Card>

            <Card style={styles.section}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                PRIVASI
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Fotomu diteruskan lewat server RagaKu ke Google Gemini untuk ditaksir ukurannya.
                Server RagaKu tidak menyimpan foto. Hanya angka cm yang disimpan di perangkatmu.
              </ThemedText>
            </Card>

            <Pressable style={styles.consentRow} onPress={() => setConsented((v) => !v)}>
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
                Saya mengerti dan setuju fotoku dikirim ke Google Gemini untuk diproses.
              </ThemedText>
            </Pressable>

            {/* web_ukur_dari_foto.md: kamera/galeri butuh hardware HP, jadi web */}
            {/* tampilkan notice "lanjutkan di aplikasi ponsel" sebagai ganti tombol. */}
            {Platform.OS === 'web' ? (
              <>
                <View
                  style={[
                    styles.webNoticeBox,
                    { backgroundColor: theme.backgroundSelected, borderColor: theme.border },
                  ]}>
                  <ThemedText type="smallBold" style={styles.webNoticeTitle}>
                    Lanjutkan di aplikasi ponsel
                  </ThemedText>
                  <ThemedText type="small" style={styles.webNoticeText}>
                    Pengukuran memakai kamera, jadi langkah ini hanya tersedia di ponsel. Hasilnya
                    otomatis muncul di sini setelah tersimpan.
                  </ThemedText>
                </View>
                <Pressable onPress={() => router.back()} hitSlop={10} style={styles.cancelRow}>
                  <ThemedText type="smallBold">Tutup</ThemedText>
                </Pressable>
              </>
            ) : (
              <>
                <PillButton
                  label="Buka kamera"
                  disabled={!consented}
                  onPress={async () => {
                    if (!permission?.granted) {
                      const res = await requestPermission();
                      if (!res.granted) {
                        setError('Izin kamera diperlukan. Kamu masih bisa memilih foto dari galeri.');
                        setPhase('capture');
                        return;
                      }
                    }
                    setPhase('capture');
                  }}
                />
                <PillButton label="Pilih dari galeri" variant="outline" onPress={pickFromLibrary} />
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // --- Capture / processing ---
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.cameraWrap}>
          {permission?.granted ? (
            <CameraView ref={cameraRef} style={styles.camera} facing="back">
              <View style={styles.silhouetteOverlay} pointerEvents="none">
                <View style={[styles.silhouette, { borderColor: 'rgba(255,255,255,0.8)' }]} />
                <ThemedText type="small" style={styles.silhouetteHint}>
                  Berdiri tegak, seluruh badan masuk bingkai
                </ThemedText>
              </View>
            </CameraView>
          ) : (
            <View style={[styles.camera, styles.noCamera, { backgroundColor: theme.background }]}>
              <Ionicons name="image-outline" size={40} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.noCameraText}>
                Kamera tidak tersedia. Gunakan galeri.
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.controls}>
          {error ? (
            <View style={[styles.errorBox, { borderColor: theme.warning }]}>
              <Ionicons name="warning-outline" size={16} color={theme.warning} />
              <ThemedText type="small" style={{ color: theme.warning, flex: 1 }}>
                {error}
              </ThemedText>
            </View>
          ) : null}

          {phase === 'processing' ? (
            <PillButton label="Memproses foto…" loading onPress={() => {}} />
          ) : (
            <>
              {permission?.granted ? (
                <PillButton label="Ambil foto seluruh badan" onPress={capture} />
              ) : null}
              <PillButton label="Pilih dari galeri" variant="outline" onPress={pickFromLibrary} />
              <Pressable onPress={() => router.back()} hitSlop={10} style={styles.cancelRow}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Tutup
                </ThemedText>
              </Pressable>
            </>
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function Guide({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.guideRow}>
      <Ionicons name={icon} size={18} color={theme.primary} />
      <ThemedText type="small" themeColor="textSecondary" style={styles.guideText}>
        {text}
      </ThemedText>
    </View>
  );
}

function fmt(v?: number | null): string {
  return v != null ? `${v}` : '–';
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  closeRow: { alignSelf: 'flex-end' },
  title: { fontFamily: FontFamily.headingBold, fontSize: 28, lineHeight: 32 },
  subheading: { marginTop: -Spacing.two },
  section: { gap: Spacing.two },
  sectionLabel: { letterSpacing: 0.4 },
  guideRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  guideText: { flex: 1 },
  statRow: { flexDirection: 'row', gap: Spacing.three },
  privacyNote: { color: '#134E4A' },
  consentRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  consentText: { flex: 1 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraWrap: { flex: 1, margin: Spacing.three, borderRadius: 20, overflow: 'hidden' },
  camera: { flex: 1 },
  noCamera: { alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  noCameraText: { textAlign: 'center' },
  silhouetteOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three },
  silhouette: {
    width: '45%',
    height: '80%',
    borderWidth: 2,
    borderRadius: 120,
    borderStyle: 'dashed',
  },
  silhouetteHint: {
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    position: 'absolute',
    bottom: Spacing.four,
  },
  controls: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  warningList: { flex: 1, gap: 4 },
  errorBox: {
    flexDirection: 'row',
    gap: 8,
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
  },
  cancelRow: { alignItems: 'center', paddingVertical: Spacing.two },
  webNoticeBox: { gap: Spacing.one, padding: Spacing.three, borderRadius: 12, borderWidth: 1 },
  webNoticeTitle: { color: '#134E4A' },
  webNoticeText: { color: '#134E4A' },
});
