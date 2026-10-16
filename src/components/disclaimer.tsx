import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Medical disclaimer shown on every result screen (PRD section 7:
 * "Disclaimer di setiap layar hasil: aplikasi ini bukan saran medis").
 */
export function Disclaimer({ text }: { text?: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.box, { backgroundColor: theme.background, borderColor: theme.border }]}>
      <Ionicons name="information-circle-outline" size={16} color={theme.textSecondary} />
      <ThemedText type="small" themeColor="textSecondary" style={styles.text}>
        {text ??
          'Informasi ini bersifat edukatif dan merupakan estimasi untuk populasi, bukan diagnosis atau saran medis individual. Konsultasikan dengan tenaga kesehatan.'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    gap: 8,
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
  },
  text: {
    flex: 1,
  },
});
