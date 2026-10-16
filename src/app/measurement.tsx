import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useProfile } from '@/components/profile-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { PillButton } from '@/components/ui/pill-button';
import { FontFamily, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, api } from '@/lib/api';
import { storage } from '@/lib/storage';

type Phase = 'consent' | 'capture' | 'processing';

export default function MeasurementScreen() {
  const theme = useTheme();
  const { profile } = useProfile();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [phase, setPhase] = useState<Phase>('consent');
  const [consented, setConsented] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processImage = async (uri: string) => {
    setPhase('processing');
    setError(null);
    try {
      const result = await api.measure(uri, profile.heightCm, profile.gender);
      await storage.addMeasurement({
        date: new Date().toISOString().slice(0, 10),
        waistCm: result.waist_cm,
        hipCm: result.hip_cm,
        armLengthCm: result.arm_length_cm,
        shoulderWidthCm: result.shoulder_width_cm,
        chestCm: result.chest_cm,
      });
      router.back();
    } catch (e) {
      setPhase('capture');
      if (e instanceof ApiError) {
        if (e.status === 0) setError('Tidak dapat terhubung ke server pengukuran.');
        else if (e.status === 503) setError('Layanan pengukuran belum aktif di server.');
        else if (e.status === 504) setError('Proses melebihi batas waktu. Coba foto lagi.');
        else setError(e.message);
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
      mediaTypes: 'images',
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      await processImage(result.assets[0].uri);
    }
  };

  // --- Consent gate (PRD section 7: explicit consent before photo feature) ---
  if (phase === 'consent') {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Pressable onPress={() => router.back()} hitSlop={10} style={styles.closeRow}>
              <Ionicons name="close" size={24} color={theme.text} />
            </Pressable>

            <ThemedText style={styles.title}>Pengukuran dari Foto</ThemedText>

            <Card style={styles.section}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                PANDUAN FOTO
              </ThemedText>
              <Guide icon="body-outline" text="Seluruh tubuh terlihat dari kepala sampai kaki, pose tegak menghadap depan." />
              <Guide icon="sunny-outline" text="Pencahayaan merata, latar belakang polos." />
              <Guide icon="shirt-outline" text="Pakaian pas badan (bukan longgar) agar estimasi lebih akurat." />
            </Card>

            <Card style={styles.section}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                PRIVASI
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Foto tubuh bersifat sensitif. Foto dikirim melalui koneksi aman (HTTPS), diproses
                untuk menghitung ukuran, lalu dihapus dari server. Hanya angka ukuran (cm) yang
                disimpan di perangkatmu.
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
                Saya mengerti dan setuju fotoku diproses lalu dihapus dari server.
              </ThemedText>
            </Pressable>

            <PillButton
              label="Lanjut ke kamera"
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
                  Posisikan seluruh tubuh di dalam panduan
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
                <PillButton label="Ambil foto" onPress={capture} />
              ) : null}
              <PillButton label="Pilih dari galeri" variant="outline" onPress={pickFromLibrary} />
              <Pressable onPress={() => router.back()} hitSlop={10} style={styles.cancelRow}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Batal
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
  section: { gap: Spacing.two },
  sectionLabel: { letterSpacing: 0.4 },
  guideRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  guideText: { flex: 1 },
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
  errorBox: {
    flexDirection: 'row',
    gap: 8,
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
  },
  cancelRow: { alignItems: 'center', paddingVertical: Spacing.two },
});
