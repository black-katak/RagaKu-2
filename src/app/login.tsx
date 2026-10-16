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

import { useAuth } from '@/components/auth-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AuthHeader } from '@/components/ui/auth-header';
import { Card } from '@/components/ui/card';
import { PillButton } from '@/components/ui/pill-button';
import { TextField } from '@/components/ui/text-field';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AuthError } from '@/lib/auth';

function isValidEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
}

export default function LoginScreen() {
  const theme = useTheme();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const nextEmailError = isValidEmail(email) ? undefined : 'Masukkan email yang valid';
    const nextPasswordError = password.length >= 6 ? undefined : 'Kata sandi minimal 6 karakter';

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setFormError(undefined);

    if (nextEmailError || nextPasswordError) return;

    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/beranda');
    } catch (e) {
      setFormError(e instanceof AuthError ? e.message : 'Gagal masuk. Coba lagi.');
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
            <AuthHeader showBack={false} />

            <View
              style={[
                styles.badge,
                { backgroundColor: theme.backgroundSelected },
              ]}>
              <Ionicons name="flash" size={12} color={theme.primary} />
              <ThemedText type="smallBold" themeColor="primary" style={styles.badgeText}>
                AI WORKOUT ENGINE 2.4
              </ThemedText>
            </View>

            <ThemedText type="subtitle" style={styles.heading}>
              SELAMAT DATANG KEMBALI
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.subheading}>
              Lanjutkan progres transformasi dan program latihan AI harianmu.
            </ThemedText>

            <Card style={styles.form}>
              <TextField
                label="Email atau No. Handphone"
                placeholder="contoh: dimas.atlet@gmail.com"
                keyboardType="email-address"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (emailError) setEmailError(undefined);
                }}
                errorText={emailError}
                returnKeyType="next"
              />

              <TextField
                label="Kata Sandi"
                placeholder="Minimal 8 karakter"
                isPassword
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (passwordError) setPasswordError(undefined);
                }}
                errorText={passwordError}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />

              <View style={styles.optionsRow}>
                <Pressable
                  style={styles.rememberRow}
                  hitSlop={8}
                  onPress={() => setRememberMe((value) => !value)}>
                  <Ionicons
                    name={rememberMe ? 'checkbox' : 'square-outline'}
                    size={18}
                    color={rememberMe ? theme.primary : theme.textSecondary}
                  />
                  <ThemedText type="small" themeColor="textSecondary">
                    Ingat Saya
                  </ThemedText>
                </Pressable>

                <Pressable hitSlop={8} onPress={() => router.push('/lupa-password')}>
                  <ThemedText type="smallBold" themeColor="primary" style={styles.forgotText}>
                    LUPA KATA SANDI?
                  </ThemedText>
                </Pressable>
              </View>

              {formError ? (
                <ThemedText type="small" themeColor="warning">
                  {formError}
                </ThemedText>
              ) : null}

              <PillButton
                label="MASUK KE RAGAKU"
                loading={loading}
                onPress={handleLogin}
                style={styles.loginButton}
              />
            </Card>

            <View style={[styles.streakCard, { backgroundColor: theme.backgroundSelected }]}>
              <View style={[styles.streakIcon, { backgroundColor: theme.primary }]}>
                <Ionicons name="barbell" size={22} color="#FFFFFF" />
              </View>
              <View style={styles.streakCopy}>
                <ThemedText type="smallBold">Target Hari Ini Menunggumu</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                  Sesi Calisthenics & Core AI siap disinkronkan
                </ThemedText>
              </View>
              <View style={styles.streakValue}>
                <ThemedText type="subtitle" themeColor="primary" style={styles.streakNumber}>
                  14
                </ThemedText>
                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.streakLabel}>
                  HARI STREAK
                </ThemedText>
              </View>
            </View>

            <View style={styles.footerRow}>
              <ThemedText type="default" themeColor="textSecondary">
                Belum punya akun RagaKu?{' '}
              </ThemedText>
              <Pressable hitSlop={8} onPress={() => router.push('/registrasi')}>
                <ThemedText type="default" themeColor="primary" style={styles.footerLink}>
                  DAFTAR SEKARANG
                </ThemedText>
              </Pressable>
            </View>

            <View style={styles.trustRow}>
              <Ionicons name="shield-checkmark" size={12} color={theme.textMuted} />
              <ThemedText type="small" themeColor="textMuted" style={styles.trustText}>
                Terenkripsi SSL 256-bit • Standar Privasi Biometrik
              </ThemedText>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
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
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  forgotText: {
    fontSize: 11,
    letterSpacing: 0.4,
  },
  loginButton: {
    marginTop: Spacing.two,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: 16,
    padding: Spacing.three,
  },
  streakIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCopy: {
    flex: 1,
    gap: 2,
  },
  streakValue: {
    alignItems: 'flex-end',
  },
  streakNumber: {
    fontSize: 28,
    lineHeight: 30,
  },
  streakLabel: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.two,
    flexWrap: 'wrap',
  },
  footerLink: {
    fontWeight: '700',
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.two,
  },
  trustText: {
    fontSize: 11,
  },
});
