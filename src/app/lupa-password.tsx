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
import { PillButton } from '@/components/ui/pill-button';
import { TextField } from '@/components/ui/text-field';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function isValidEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
}

export default function LupaPasswordScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    const nextError = isValidEmail(email) ? undefined : 'Masukkan email yang valid';

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

            <ThemedText type="subtitle" style={styles.heading}>
              ATUR ULANG KATA SANDI
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.subheading}>
              Masukkan email yang terdaftar. Kami kirim tautan untuk membuat kata sandi baru.
            </ThemedText>

            <View style={styles.form}>
              <TextField
                label="Email"
                placeholder="nama@email.com"
                keyboardType="email-address"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (error) setError(undefined);
                }}
                errorText={error}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />

              <ThemedText type="small" themeColor="textSecondary" style={styles.hintText}>
                Tautan hanya dikirim ke email yang sudah terdaftar.
              </ThemedText>

              <PillButton
                label={sent ? 'Tautan terkirim' : 'Kirim tautan'}
                loading={loading}
                disabled={sent}
                onPress={handleSubmit}
                style={styles.submitButton}
              />
            </View>

            <Pressable style={styles.footerRow} hitSlop={8} onPress={() => router.back()}>
              <ThemedText type="smallBold" themeColor="primary">
                Kembali ke halaman masuk
              </ThemedText>
            </Pressable>
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
  hintText: {
    marginLeft: 4,
    fontSize: 13,
  },
  submitButton: {
    marginTop: Spacing.two,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
});
