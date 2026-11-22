import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/components/auth-context';
import { useProfile } from '@/components/profile-context';
import { Disclaimer } from '@/components/disclaimer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { NumberStepper } from '@/components/ui/number-stepper';
import { PillButton } from '@/components/ui/pill-button';
import { Segmented } from '@/components/ui/segmented';
import { BottomTabInset, FontFamily, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';
import type { Gender } from '@/lib/health';
import type { MeasurementRecord } from '@/lib/model';
import { storage } from '@/lib/storage';

const DEFAULT_NECK_CM = 38;

// Breakpoint above which the web layout splits into 2 columns (left:
// identitas + data diri, right: ukuran tubuh + akun). Below it (incl.
// narrow web / all mobile) everything stacks in a single column -- unchanged.
const WEB_WIDE_BREAKPOINT = 880;
const WEB_WIDE_MAX_WIDTH = 1040;

export default function ProfilScreen() {
  const theme = useTheme();
  const { session, signOut } = useAuth();
  const { profile, updateProfile, clearAll } = useProfile();
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === 'web' && width >= WEB_WIDE_BREAKPOINT;

  const [signOutVisible, setSignOutVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // DATA DIRI — diedit lokal, baru ditulis ke profile context saat "Simpan perubahan"
  // (spec profil.md menuntut tombol simpan terpisah + banner konfirmasi).
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [age, setAge] = useState(profile.age);
  const [heightCm, setHeightCm] = useState(profile.heightCm);
  const [weightKg, setWeightKg] = useState(profile.weightKg);
  const [saved, setSaved] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setGender(profile.gender);
    setAge(profile.age);
    setHeightCm(profile.heightCm);
    setWeightKg(profile.weightKg);
  }, [profile.gender, profile.age, profile.heightCm, profile.weightKg]);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const dismissBanner = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setSaved(false);
  };

  const handleSaveProfile = () => {
    updateProfile({ gender, age, heightCm, weightKg });
    setSaved(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setSaved(false), 4000);
  };

  // UKURAN TUBUH — lingkar leher dipakai untuk estimasi lemak tubuh (US Navy),
  // disimpan di record pengukuran yang sama dipakai tab Ukuran (lihat ukuran.tsx).
  const [latestMeasurement, setLatestMeasurement] = useState<MeasurementRecord | null>(null);
  const [neckCm, setNeckCm] = useState(DEFAULT_NECK_CM);

  const loadMeasurement = useCallback(async () => {
    const list = await storage.getMeasurements();
    const record = list.length ? list[list.length - 1] : null;
    setLatestMeasurement(record);
    setNeckCm(record?.neckCm ?? DEFAULT_NECK_CM);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadMeasurement();
    }, [loadMeasurement]),
  );

  const handleNeckChange = async (value: number) => {
    setNeckCm(value);
    const date = new Date().toISOString().slice(0, 10);
    const base = latestMeasurement?.date === date ? latestMeasurement : latestMeasurement ?? {};
    const next = await storage.upsertMeasurement({
      ...base,
      date,
      neckCm: value,
      source: 'manual',
    });
    setLatestMeasurement(next[next.length - 1]);
  };

  const handleSignOut = async () => {
    setSignOutVisible(false);
    await signOut();
    // Tidak perlu navigasi manual: Stack.Protected di root layout otomatis
    // mengarahkan ke /login setelah sesi berubah (lihat src/app/_layout.tsx).
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      await clearAll();
      await storage.clearAll();
      await api.deleteServerData();
      await auth.clearAll(); // buang akun + sesi tersimpan (PRD §7: hak hapus data)
      await signOut();
      // Tidak perlu navigasi manual: Stack.Protected di root layout otomatis
      // mengarahkan ke /login setelah sesi berubah (lihat src/app/_layout.tsx).
    } finally {
      setDeleting(false);
      setDeleteVisible(false);
    }
  };

  const header = (
    <View>
      <ThemedText style={styles.title}>PROFIL</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Ubah data dirimu. Perhitungan kalori ikut menyesuaikan.
      </ThemedText>
    </View>
  );

  const banner = saved ? (
    <View style={[styles.banner, { backgroundColor: theme.backgroundSelected }]}>
      <ThemedText type="small" themeColor="primaryDark">
        Perubahan profil tersimpan. Target kalori sudah dihitung ulang.
      </ThemedText>
    </View>
  ) : null;

  // Left column (web): identitas akun + data diri yang bisa diedit.
  const identityColumn = (
    <>
      <Card style={styles.identityCard}>
        <Ionicons name="person-circle" size={56} color={theme.primary} />
        <View style={styles.identityCopy}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {session?.name ?? '—'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {session?.email ?? '—'}
          </ThemedText>
        </View>
      </Card>

      {/* DATA DIRI */}
      <Card style={styles.section}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
          DATA DIRI
        </ThemedText>

        <Segmented<Gender>
          options={[
            { label: 'Pria', value: 'male' },
            { label: 'Wanita', value: 'female' },
          ]}
          value={gender}
          onChange={(value) => {
            dismissBanner();
            setGender(value);
          }}
        />

        <NumberStepper
          label="Usia"
          value={age}
          unit="th"
          min={18}
          max={80}
          onChange={(value) => {
            dismissBanner();
            setAge(value);
          }}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <NumberStepper
          label="Tinggi badan"
          value={heightCm}
          unit="cm"
          min={120}
          max={220}
          onChange={(value) => {
            dismissBanner();
            setHeightCm(value);
          }}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <NumberStepper
          label="Berat saat ini"
          value={weightKg}
          unit="kg"
          min={30}
          max={250}
          step={0.5}
          onChange={(value) => {
            dismissBanner();
            setWeightKg(value);
          }}
        />

        <PillButton label="Simpan perubahan" onPress={handleSaveProfile} />
      </Card>
    </>
  );

  // Right column (web): ukuran tubuh + pengaturan akun.
  const measurementColumn = (
    <>
      <Card style={styles.section}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
          UKURAN TUBUH
        </ThemedText>

        <NumberStepper
          label="Lingkar leher"
          value={neckCm}
          unit="cm"
          min={20}
          max={60}
          step={0.5}
          onChange={handleNeckChange}
        />
        <ThemedText type="small" themeColor="textSecondary">
          Dipakai untuk estimasi lemak tubuh.
        </ThemedText>

        <PillButton
          label="Ukur dari foto"
          variant="outline"
          onPress={() => router.push('/measurement')}
        />
        <ThemedText type="small" themeColor="primaryDark">
          Foto dikirim lewat koneksi aman, diproses, lalu dihapus dari server. Hanya angka ukuran
          yang disimpan.
        </ThemedText>

        <ThemedText
          type="smallBold"
          themeColor="primary"
          onPress={() => router.push('/ukuran')}>
          Lihat ukuran manual & indikator lanjutan (WHtR, WHR, lemak tubuh) →
        </ThemedText>
      </Card>

      <Card style={styles.section}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
          AKUN
        </ThemedText>
        <PillButton
          label="Keluar dari akun"
          variant="outline"
          onPress={() => setSignOutVisible(true)}
        />
        <PillButton
          label="Hapus semua data saya"
          variant="outline"
          onPress={() => setDeleteVisible(true)}
        />
      </Card>
    </>
  );

  const dialogs = (
    <>
      <ConfirmDialog
        visible={signOutVisible}
        title="Keluar dari akun?"
        message="Data latihan dan profil tetap tersimpan di perangkat ini."
        confirmLabel="Keluar"
        onConfirm={handleSignOut}
        onCancel={() => setSignOutVisible(false)}
      />
      <ConfirmDialog
        visible={deleteVisible}
        title="HAPUS SEMUA DATA?"
        message="Profil, catatan berat, ukuran tubuh, dan hasil pengukuran foto akan dihapus permanen dari perangkat ini. Data yang sudah dihapus tidak bisa dikembalikan."
        confirmLabel={deleting ? 'Menghapus…' : 'Hapus semua data'}
        destructive
        onConfirm={handleDeleteAll}
        onCancel={() => setDeleteVisible(false)}
      />
    </>
  );

  if (isWideWeb) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <ScrollView
            contentContainerStyle={[styles.wideScrollContent, { paddingBottom: BottomTabInset + Spacing.six }]}
            showsVerticalScrollIndicator={false}>
            {header}
            {banner}
            <View style={styles.webRow}>
              <View style={styles.webColumn}>{identityColumn}</View>
              <View style={styles.webColumn}>{measurementColumn}</View>
            </View>
            <Disclaimer text="Data profil dan progres disimpan di perangkat ini. Menghapus semua data tidak dapat dibatalkan." />
          </ScrollView>
        </SafeAreaView>
        {dialogs}
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: BottomTabInset + Spacing.six }]}
          showsVerticalScrollIndicator={false}>
          {header}
          {banner}
          {identityColumn}
          {measurementColumn}
          <Disclaimer text="Data profil dan progres disimpan di perangkat ini. Menghapus semua data tidak dapat dibatalkan." />
        </ScrollView>
      </SafeAreaView>
      {dialogs}
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
    paddingTop: Spacing.two,
    gap: Spacing.three,
  },
  // Web wide (>=880px): 2 kolom berdampingan, lebar maksimum lebih besar.
  wideScrollContent: {
    width: '100%',
    maxWidth: WEB_WIDE_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.three,
  },
  webRow: { flexDirection: 'row', gap: Spacing.four, alignItems: 'flex-start' },
  webColumn: { flex: 1, gap: Spacing.three },
  title: { fontFamily: FontFamily.headingExtraBold, fontSize: 36, lineHeight: 40 },
  banner: { padding: Spacing.three, borderRadius: 12 },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  identityCopy: {
    flex: 1,
    gap: 2,
  },
  section: { gap: Spacing.three },
  sectionLabel: { letterSpacing: 0.4 },
  divider: { height: 1 },
});
