import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/components/auth-context';
import { useTheme } from '@/hooks/use-theme';

export default function RootIndex() {
  const { session, ready } = useAuth();
  const theme = useTheme();

  // Tunggu sesi dimuat agar tidak salah mengarahkan (penyebab loop login sebelumnya).
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  return <Redirect href={session ? '/beranda' : '/login'} />;
}
