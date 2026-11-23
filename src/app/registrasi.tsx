import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AuthHeader } from '@/components/ui/auth-header';
import { Card } from '@/components/ui/card';
import { PillButton } from '@/components/ui/pill-button';
import { TextField } from '@/components/ui/text-field';
import { FontFamily, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/components/auth-context';
import { AuthError } from '@/lib/auth';

function isValidEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
}

const STRENGTH_RULES: { key: string; label: string; test: (value: string) => boolean }[] = [
  { key: 'length', label: 'Minimal 8 karakter', test: (value) => value.length >= 8 },
  {
    key: 'case',
    label: 'Huruf besar dan kecil',
    test: (value) => /[a-z]/.test(value) && /[A-Z]/.test(value),
  },
  { key: 'digit', label: 'Ada angka', test: (value) => /\d/.test(value) },
];

// Breakpoint above which auth screens split into a brand panel (left) +
// form card (right), per Figma "RagaKu v2 — Web". Below it (incl. narrow
// web / all mobile) the single-column layout stays exactly as-is.
const WEB_WIDE_BREAKPOINT = 880;
const BRAND_HEADING = 'MULAI DARI DATA DIRIMU';
const BRAND_TAGLINE =
  'Program latihan personal yang menyesuaikan kondisi tubuh, alat, dan waktu yang kamu punya.';

export default function RegistrasiScreen() {
  const theme = useTheme();
  const { signUp } = useAuth();
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === 'web' && width >= WEB_WIDE_BREAKPOINT;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);

  const [nameError, setNameError] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [agreeError, setAgreeError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const passedRules = STRENGTH_RULES.filter((rule) => rule.test(password));

  const handleSubmit = async () => {
    const nextNameError = name.trim().length >= 3 ? undefined : 'Masukkan nama lengkap';
    const nextEmailError = isValidEmail(email) ? undefined : 'Masukkan email yang valid';
    const nextPhoneError =
      phone.trim().length === 0 || phone.replace(/\D/g, '').length >= 8
        ? undefined
        : 'Masukkan nomor WhatsApp yang valid';
    const nextPasswordError = passedRules.length >= 3 ? undefined : 'Kata sandi belum memenuhi semua syarat';
    const nextAgreeError = agreed ? undefined : 'Anda harus menyetujui ketentuan';

    setNameError(nextNameError);
    setEmailError(nextEmailError);
    setPhoneError(nextPhoneError);
    setPasswordError(nextPasswordError);
    setAgreeError(nextAgreeError);
    setFormError(undefined);

    if (nextNameError || nextEmailError || nextPhoneError || nextPasswordError || nextAgreeError) return;

    setLoading(true);
    try {
      await signUp({ name, email, phone, password });
      // Tidak perlu navigasi manual: Stack.Protected di root layout otomatis
      // mengarahkan ke /onboarding setelah sesi berubah (lihat src/app/_layout.tsx).
    } catch (e) {
      setFormError(e instanceof AuthError ? e.message : 'Gagal membuat akun. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <>
      <ThemedText type="subtitle" style={styles.heading}>
        BUAT AKUN
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.subheading}>
        Isi data dasar. Program latihan disesuaikan di langkah berikutnya.
      </ThemedText>

      <Card style={styles.form}>
        <TextField
          label="Nama Lengkap"
          placeholder="Nama lengkap"
          value={name}
          onChangeText={(value) => {
            setName(value);
            if (nameError) setNameError(undefined);
          }}
          errorText={nameError}
          returnKeyType="next"
        />

        <TextField
          label="Email"
          placeholder="nama@email.com"
          keyboardType="email-address"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            if (emailError) setEmailError(undefined);
          }}
          errorText={emailError}
          returnKeyType="next"
        />

        <View>
          <TextField
            label="Nomor WhatsApp (opsional)"
            placeholder="0812 xxxx xxxx"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(value) => {
              setPhone(value);
              if (phoneError) setPhoneError(undefined);
            }}
            errorText={phoneError}
            returnKeyType="next"
          />
          <ThemedText type="small" themeColor="textMuted" style={styles.phoneHint}>
            Dipakai untuk pengingat jadwal latihan.
          </ThemedText>
        </View>

        <TextField
          label="Kata Sandi"
          placeholder="Buat kata sandi"
          isPassword
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            if (passwordError) setPasswordError(undefined);
          }}
          errorText={passwordError}
          returnKeyType="done"
        />

        <View style={[styles.strengthBox, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold" style={[styles.strengthLabel, { color: theme.primaryDark }]}>
            Syarat kata sandi
          </ThemedText>
          <View style={styles.rulesList}>
            {STRENGTH_RULES.map((rule) => {
              const passed = rule.test(password);
              if (passed) return null;
              return (
                <ThemedText
                  key={rule.key}
                  type="small"
                  style={[styles.ruleLabel, { color: theme.primaryDark }]}>
                  Belum terpenuhi: {rule.label}
                </ThemedText>
              );
            })}
          </View>
        </View>

        <Pressable
          style={styles.termsRow}
          hitSlop={8}
          onPress={() => {
            setAgreed((value) => !value);
            if (agreeError) setAgreeError(undefined);
          }}>
          <Ionicons
            name={agreed ? 'checkbox' : 'square-outline'}
            size={20}
            color={agreed ? theme.primary : theme.textSecondary}
          />
          <ThemedText type="small" themeColor="textSecondary" style={styles.termsText}>
            Saya menyetujui Ketentuan Layanan dan Kebijakan Privasi Data Kesehatan.
          </ThemedText>
        </Pressable>
        {agreeError ? (
          <ThemedText type="small" themeColor="warning">
            {agreeError}
          </ThemedText>
        ) : null}

        {formError ? (
          <ThemedText type="small" themeColor="warning">
            {formError}
          </ThemedText>
        ) : null}

        <PillButton
          label="Buat akun & mulai evaluasi"
          loading={loading}
          onPress={handleSubmit}
          style={styles.submitButton}
        />
      </Card>

      <View style={styles.footerRow}>
        <ThemedText type="small" themeColor="textSecondary">
          Sudah punya akun?{' '}
        </ThemedText>
        <Pressable hitSlop={8} onPress={() => router.back()}>
          <ThemedText type="smallBold" themeColor="primary">
            Masuk di sini
          </ThemedText>
        </Pressable>
      </View>
    </>
  );

  if (isWideWeb) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeAreaWide} edges={['top']}>
          <View style={styles.webRow}>
            <View style={[styles.brandPanel, { backgroundColor: theme.primaryDark }]}>
              <View style={styles.brandLogoRow}>
                <View style={styles.brandLogoMark}>
                  <Ionicons name="pulse" size={18} color="#FFFFFF" />
                </View>
                <ThemedText style={styles.brandLogoWord}>RAGAKU</ThemedText>
                <ThemedText style={styles.brandLogoSuper}>AI</ThemedText>
              </View>
              <ThemedText style={styles.brandHeading}>{BRAND_HEADING}</ThemedText>
              <ThemedText style={styles.brandTagline}>{BRAND_TAGLINE}</ThemedText>
            </View>

            <ScrollView
              style={styles.formColumn}
              contentContainerStyle={styles.webFormContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {formContent}
            </ScrollView>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

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
            {formContent}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  // Jangan tambah alignItems: 'center' di sini -- baca catatan MaxContentWidth di constants/theme.ts.
  safeArea: { flex: 1 },
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
  heading: {
    marginTop: Spacing.three,
    textAlign: 'center',
  },
  subheading: {
    marginTop: 4,
    textAlign: 'center',
  },
  form: {
    marginTop: Spacing.four,
    gap: Spacing.three,
  },
  phoneHint: {
    marginTop: 6,
    marginLeft: 4,
    fontSize: 11,
  },
  strengthBox: {
    borderRadius: 12,
    padding: Spacing.three,
    gap: 6,
  },
  strengthLabel: {
    fontSize: 13,
  },
  rulesList: {
    gap: 4,
  },
  ruleLabel: {
    fontSize: 13,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  termsText: {
    flex: 1,
    lineHeight: 20,
  },
  submitButton: {
    marginTop: Spacing.two,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },

  // Web ≥880px: brand panel (left) + form card (right), per Figma "RagaKu v2 — Web".
  safeAreaWide: {
    flex: 1,
  },
  webRow: {
    flex: 1,
    flexDirection: 'row',
  },
  brandPanel: {
    flex: 1,
    maxWidth: 560,
    justifyContent: 'center',
    gap: Spacing.four,
    paddingHorizontal: Spacing.six,
    paddingVertical: Spacing.six,
  },
  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogoMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoWord: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: FontFamily.bodyBold,
    letterSpacing: 0.4,
  },
  brandLogoSuper: {
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
    color: 'rgba(255,255,255,0.85)',
    marginLeft: -2,
    marginTop: -8,
  },
  brandHeading: {
    fontFamily: FontFamily.headingExtraBold,
    fontSize: 34,
    lineHeight: 38,
    color: '#FFFFFF',
  },
  brandTagline: {
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 380,
    color: 'rgba(255,255,255,0.85)',
  },
  formColumn: {
    flex: 1,
  },
  webFormContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
    gap: Spacing.three,
  },
});
