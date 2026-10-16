import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AuthHeader } from '@/components/ui/auth-header';
import { PillButton } from '@/components/ui/pill-button';
import { Segmented } from '@/components/ui/segmented';
import { TextField } from '@/components/ui/text-field';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function isValidEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
}

type Channel = 'email' | 'whatsapp';

export default function LupaPasswordScreen() {
  const theme = useTheme();
  const [channel, setChannel] = useState<Channel>('email');
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    const nextError =
      channel === 'email'
        ? isValidEmail(identifier)
          ? undefined
          : 'Masukkan email yang valid'
        : identifier.replace(/\D/g, '').length >= 8
          ? undefined
          : 'Masukkan nomor WhatsApp yang valid';

    setError(nextError);
    if (nextError) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 700);
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <AuthHeader />

            <View style={styles.heroIconWrap}>
              <View style={[styles.heroIconOuter, { backgroundColor: theme.backgroundSelected }]}>
                <Ionicons name="lock-open" size={28} color={theme.primary} />
              </View>
              <View style={[styles.heroIconBadge, { backgroundColor: theme.primaryDark }]}>
                <Ionicons name="shield-checkmark" size={12} color="#FFFFFF" />
              </View>
            </View>

            <View style={[styles.badge, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="smallBold" themeColor="primary" style={styles.badgeText}>
                KEAMANAN AKUN RAGAKU
              </ThemedText>
            </View>

            <ThemedText type="subtitle" style={styles.heading}>
              ATUR ULANG KATA SANDI
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.subheading}>
              Masukkan alamat email atau nomor WhatsApp yang terdaftar. Kami akan mengirimkan
              tautan verifikasi untuk membuat kata sandi baru.
            </ThemedText>

            <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                PILIH JALUR PENGIRIMAN
              </ThemedText>

              <Segmented<Channel>
                options={[
                  { label: 'Email', value: 'email' },
                  { label: 'WhatsApp', value: 'whatsapp' },
                ]}
                value={channel}
                onChange={(value) => {
                  setChannel(value);
                  setError(undefined);
                  setIdentifier('');
                }}
              />

              <TextField
                label={channel === 'email' ? 'Email Terdaftar' : 'Nomor WhatsApp Terdaftar'}
                placeholder={channel === 'email' ? 'contoh: dimas.atlet@gmail.com' : '812-3456-7890'}
                keyboardType={channel === 'email' ? 'email-address' : 'phone-pad'}
                value={identifier}
                onChangeText={(value) => {
                  setIdentifier(value);
                  if (error) setError(undefined);
                }}
                errorText={error}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />

              <View style={styles.helpRow}>
                <Ionicons name="information-circle-outline" size={16} color={theme.primary} />
                <ThemedText type="small" themeColor="textSecondary" style={styles.helpText}>
                  Pastikan email aktif dan periksa folder spam atau promosi jika belum menerima
                  email dalam 2 menit.
                </ThemedText>
              </View>

              <PillButton
                label={sent ? 'TAUTAN TERKIRIM' : 'KIRIM TAUTAN PEMULIHAN'}
                loading={loading}
                disabled={sent}
                onPress={handleSubmit}
              />
            </View>

            <View style={[styles.supportCard, { backgroundColor: '#FFF1E6' }]}>
              <View style={styles.supportIcon}>
                <Ionicons name="headset" size={18} color={theme.warning} />
              </View>
              <View style={styles.supportCopy}>
                <ThemedText type="smallBold" style={{ color: theme.warning }}>
                  Butuh Bantuan Langsung?
                </ThemedText>
                <ThemedText type="small" themeColor="text" style={styles.supportBody}>
                  Tim Support RagaKu siap mendampingi 24/7 jika kehilangan akses nomor/email Anda.
                </ThemedText>
                <Pressable
                  hitSlop={8}
                  onPress={() => Linking.openURL('https://wa.me/6281234567890')}>
                  <ThemedText type="smallBold" style={[styles.supportLink, { color: theme.warning }]}>
                    Hubungi WhatsApp Care
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            <Pressable style={styles.footerRow} hitSlop={8} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={14} color={theme.textSecondary} />
              <ThemedText type="smallBold" themeColor="textSecondary">
                Kembali ke Halaman Masuk
              </ThemedText>
            </Pressable>

            <View style={styles.trustRow}>
              <Ionicons name="shield-outline" size={12} color={theme.textMuted} />
              <ThemedText type="small" themeColor="textMuted" style={styles.trustText}>
                Enkripsi 256-Bit • Telemetri & Akun Dilindungi
              </ThemedText>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  safeArea: { flex: 1, alignItems: 'center' },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  backRow: {
    alignSelf: 'flex-start',
  },
  heroIconWrap: {
    alignSelf: 'center',
    marginTop: Spacing.two,
  },
  heroIconOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    alignSelf: 'center',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: Spacing.two,
  },
  badgeText: {
    letterSpacing: 0.4,
    fontSize: 11,
  },
  heading: {
    marginTop: Spacing.three,
    textAlign: 'center',
  },
  subheading: {
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    marginTop: Spacing.four,
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 0.4,
  },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  helpText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  supportCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 16,
    padding: Spacing.three,
  },
  supportIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportCopy: {
    flex: 1,
    gap: 4,
  },
  supportBody: {
    lineHeight: 20,
  },
  supportLink: {
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.two,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 11,
  },
});
