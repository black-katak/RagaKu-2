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

import { useAuth } from '@/components/auth-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AuthHeader } from '@/components/ui/auth-header';
import { Card } from '@/components/ui/card';
import { PillButton } from '@/components/ui/pill-button';
import { TextField } from '@/components/ui/text-field';
import { FontFamily, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AuthError } from '@/lib/auth';

function isValidEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
}

// Breakpoint above which auth screens split into a brand panel (left) +
// form card (right), per Figma "RagaKu v2 — Web". Below it (incl. narrow
// web / all mobile) the single-column layout stays exactly as-is.
const WEB_WIDE_BREAKPOINT = 880;
const BRAND_HEADING = 'LATIHAN YANG MENYESUAIKAN TUBUHMU';
const BRAND_TAGLINE =
  'Program latihan personal yang menyesuaikan kondisi tubuh, alat, dan waktu yang kamu punya.';

export default function LoginScreen() {
  const theme = useTheme();
  const { signIn } = useAuth();
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === 'web' && width >= WEB_WIDE_BREAKPOINT;
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
      // Tidak perlu navigasi manual: Stack.Protected di root layout otomatis
      // mengarahkan setelah sesi berubah (lihat src/app/_layout.tsx).
    } catch (e) {
      setFormError(e instanceof AuthError ? e.message : 'Gagal masuk. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <>
      <ThemedText type="subtitle" style={styles.heading}>
        SELAMAT DATANG
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.subheading}>
        Masuk untuk membuka program latihanmu.
      </ThemedText>

      <Card style={styles.form}>
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
              Ingat saya
            </ThemedText>
          </Pressable>

          <Pressable hitSlop={8} onPress={() => router.push('/lupa-password')}>
            <ThemedText type="smallBold" themeColor="primary" style={styles.forgotText}>
              Lupa kata sandi?
            </ThemedText>
          </Pressable>
        </View>

        {formError ? (
          <ThemedText type="small" themeColor="warning">
            {formError}
          </ThemedText>
        ) : null}

        <PillButton
          label="Masuk"
          loading={loading}
          onPress={handleLogin}
          style={styles.loginButton}
        />
      </Card>

      <View style={styles.footerRow}>
        <ThemedText type="default" themeColor="textSecondary">
          Belum punya akun?{' '}
        </ThemedText>
        <Pressable hitSlop={8} onPress={() => router.push('/registrasi')}>
          <ThemedText type="default" themeColor="primary" style={styles.footerLink}>
            Daftar
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
            <AuthHeader showBack={false} />
            {formContent}
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
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.two,
    flexWrap: 'wrap',
  },
  footerLink: {
    fontWeight: '700',
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
