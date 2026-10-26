import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
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
import { Card } from '@/components/ui/card';
import { PillButton } from '@/components/ui/pill-button';
import { TextField } from '@/components/ui/text-field';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/components/auth-context';
import { AuthError } from '@/lib/auth';

function isValidEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
}

const STRENGTH_RULES: { key: string; label: string; test: (value: string) => boolean }[] = [
  { key: 'length', label: 'Min. 8 karakter', test: (value) => value.length >= 8 },
  {
    key: 'case',
    label: 'Huruf besar & kecil',
    test: (value) => /[a-z]/.test(value) && /[A-Z]/.test(value),
  },
  { key: 'digit', label: 'Ada angka', test: (value) => /\d/.test(value) },
];

export default function RegistrasiScreen() {
  const theme = useTheme();
  const { signUp } = useAuth();
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
  const strengthLabel =
    password.length === 0
      ? 'Belum Diisi'
      : passedRules.length >= 3
        ? 'Kuat'
        : passedRules.length >= 2
          ? 'Sedang'
          : 'Lemah';

  const handleSubmit = async () => {
    const nextNameError = name.trim().length >= 3 ? undefined : 'Masukkan nama lengkap';
    const nextEmailError = isValidEmail(email) ? undefined : 'Masukkan email yang valid';
    const nextPhoneError = phone.replace(/\D/g, '').length >= 8 ? undefined : 'Masukkan nomor WhatsApp yang valid';
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

            <View style={[styles.badge, { backgroundColor: '#FFF1E6' }]}>
              <Ionicons name="flash" size={12} color={theme.warning} />
              <ThemedText type="smallBold" style={[styles.badgeText, { color: theme.warning }]}>
                Uji Coba Gratis 7 Hari Termasuk
              </ThemedText>
            </View>

            <ThemedText type="subtitle" style={styles.heading}>
              BUAT AKUN RAGAKU
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.subheading}>
              Mulai personalisasi program latihan dan nutrisi berbasis AI telemetry presisi.
            </ThemedText>

            <Card style={styles.form}>
              <TextField
                label="Nama Lengkap"
                placeholder="Dimas Pratama"
                value={name}
                onChangeText={(value) => {
                  setName(value);
                  if (nameError) setNameError(undefined);
                }}
                errorText={nameError}
                returnKeyType="next"
              />

              <TextField
                label="Alamat Email Aktif"
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
                <View style={styles.phoneLabelRow}>
                  <ThemedText type="smallBold" style={styles.phoneLabel}>
                    Nomor WhatsApp
                  </ThemedText>
                  <View style={[styles.reminderBadge, { backgroundColor: '#FFF1E6' }]}>
                    <ThemedText type="smallBold" style={{ color: theme.warning, fontSize: 11 }}>
                      Reminder AI
                    </ThemedText>
                  </View>
                </View>
                <TextField
                  label=""
                  placeholder="812-3456-7890"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={(value) => {
                    setPhone(value);
                    if (phoneError) setPhoneError(undefined);
                  }}
                  errorText={phoneError}
                  returnKeyType="next"
                  containerStyle={styles.noLabelField}
                />
                <ThemedText type="small" themeColor="textMuted" style={styles.phoneHint}>
                  Digunakan untuk jadwal latihan cerdas & motivasi personal WhatsApp.
                </ThemedText>
              </View>

              <TextField
                label="Kata Sandi"
                placeholder="Buat kata sandi aman"
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
                <View style={styles.strengthHeaderRow}>
                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.strengthLabel}>
                    Kekuatan Sandi
                  </ThemedText>
                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.strengthLabel}>
                    {strengthLabel}
                  </ThemedText>
                </View>
                <View style={styles.rulesRow}>
                  {STRENGTH_RULES.map((rule) => {
                    const passed = rule.test(password);
                    return (
                      <View key={rule.key} style={styles.ruleItem}>
                        <Ionicons
                          name={passed ? 'checkmark-circle' : 'ellipse-outline'}
                          size={14}
                          color={passed ? theme.primary : theme.textMuted}
                        />
                        <ThemedText
                          type="small"
                          style={[
                            styles.ruleLabel,
                            { color: passed ? theme.primary : theme.textMuted },
                          ]}>
                          {rule.label}
                        </ThemedText>
                      </View>
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
                  Saya menyetujui Ketentuan Layanan & Kebijakan Privasi Data Kesehatan RagaKu.
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
                label="BUAT AKUN & MULAI EVALUASI"
                loading={loading}
                onPress={handleSubmit}
                style={styles.submitButton}
              />
            </Card>

            <View style={[styles.trustCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <View style={[styles.trustIcon, { backgroundColor: theme.backgroundSelected }]}>
                <Ionicons name="shield-checkmark" size={18} color={theme.primary} />
              </View>
              <View style={styles.trustCopy}>
                <ThemedText type="smallBold">Enkripsi Medis End-to-End</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Data biometrik Anda aman dan privat sesuai standar HIPAA.
                </ThemedText>
              </View>
            </View>

            <View style={styles.footerRow}>
              <ThemedText type="small" themeColor="textSecondary">
                Sudah memiliki akun?{' '}
              </ThemedText>
              <Pressable hitSlop={8} onPress={() => router.back()}>
                <ThemedText type="smallBold" themeColor="primary">
                  MASUK DI SINI
                </ThemedText>
              </Pressable>
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
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  form: {
    marginTop: Spacing.four,
    gap: Spacing.three,
  },
  phoneLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginLeft: 4,
  },
  phoneLabel: {
    fontSize: 13,
  },
  reminderBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  noLabelField: {
    gap: 0,
  },
  phoneHint: {
    marginTop: 6,
    marginLeft: 4,
    fontSize: 11,
  },
  strengthBox: {
    borderRadius: 12,
    padding: Spacing.three,
    gap: 10,
  },
  strengthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  strengthLabel: {
    fontSize: 11,
    letterSpacing: 0.3,
  },
  rulesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ruleLabel: {
    fontSize: 11,
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
  trustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
  },
  trustIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustCopy: {
    flex: 1,
    gap: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
});
