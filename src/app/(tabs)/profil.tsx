import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/components/auth-context';
import { useProfile } from '@/components/profile-context';
import { Disclaimer } from '@/components/disclaimer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PillButton } from '@/components/ui/pill-button';
import { StatTile } from '@/components/ui/stat-tile';
import { BottomTabInset, FontFamily, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';
import type { ActivityLevel, Goal } from '@/lib/health';
import { storage } from '@/lib/storage';

const GOAL_LABELS: Record<Goal, string> = {
  lose: 'Turunkan berat',
  maintain: 'Jaga berat',
  gain: 'Naikkan berat',
};

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Jarang gerak',
  light: 'Ringan',
  active: 'Aktif',
  very_active: 'Sangat aktif',
};

export default function ProfilScreen() {
  const theme = useTheme();
  const { session, signOut } = useAuth();
  const { profile, clearAll } = useProfile();

  const [signOutVisible, setSignOutVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: BottomTabInset + Spacing.six }]}
          showsVerticalScrollIndicator={false}>
          <View>
            <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
              AKUN
            </ThemedText>
            <ThemedText style={styles.title}>Profil</ThemedText>
          </View>

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

          <Card style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              RINGKASAN PROFIL
            </ThemedText>
            <View style={styles.statRow}>
              <StatTile label="Tinggi" value={`${profile.heightCm}`} unit="cm" />
              <StatTile label="Berat" value={`${profile.weightKg}`} unit="kg" />
            </View>
            <View style={styles.statRow}>
              <StatTile label="Usia" value={`${profile.age}`} unit="th" />
              <StatTile label="Target" value={GOAL_LABELS[profile.goal]} />
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              Level aktivitas: {ACTIVITY_LABELS[profile.activityLevel]}. Ubah data ini di tab
              Beranda.
            </ThemedText>
          </Card>

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

          <Disclaimer text="Data profil dan progres disimpan di perangkat ini. Menghapus semua data tidak dapat dibatalkan." />
        </ScrollView>
      </SafeAreaView>

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
        title="Hapus semua data?"
        message="Semua profil, ukuran, progres, dan akun akan dihapus dari perangkat ini. Tindakan ini tidak dapat dibatalkan."
        confirmLabel={deleting ? 'Menghapus…' : 'Hapus'}
        destructive
        onConfirm={handleDeleteAll}
        onCancel={() => setDeleteVisible(false)}
      />
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
  eyebrow: { letterSpacing: 0.6, textTransform: 'uppercase' },
  title: { fontFamily: FontFamily.headingBold, fontSize: 28, lineHeight: 32 },
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
  statRow: { flexDirection: 'row', gap: Spacing.two },
});
