import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AuthHeaderProps = {
  /** Show back chevron on the left, wired to router.back(). Omit on entry screens. */
  showBack?: boolean;
};

/** Shared top bar for auth screens: back chevron + RagaKu logo lockup, per Figma header spec. */
export function AuthHeader({ showBack = true }: AuthHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {showBack ? (
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </Pressable>
      ) : (
        <View style={styles.backButton} />
      )}

      <View style={styles.logoRow}>
        <View style={[styles.logoMark, { backgroundColor: theme.primary }]}>
          <Ionicons name="pulse" size={16} color="#FFFFFF" />
        </View>
        <ThemedText type="smallBold" style={styles.logoWord}>
          RAGAKU
        </ThemedText>
        <ThemedText type="small" themeColor="primary" style={styles.logoSuper}>
          AI
        </ThemedText>
      </View>

      <View style={styles.backButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.two,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWord: {
    fontSize: 15,
    letterSpacing: 0.3,
  },
  logoSuper: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: -2,
    marginTop: -6,
  },
});
