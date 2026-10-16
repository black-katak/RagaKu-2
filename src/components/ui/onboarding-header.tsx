import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type OnboardingHeaderProps = {
  eyebrow: string;
  step: number;
  totalSteps: number;
  title: string;
  description?: string;
  onBack?: () => void;
};

export function OnboardingHeader({
  eyebrow,
  step,
  totalSteps,
  title,
  description,
  onBack,
}: OnboardingHeaderProps) {
  const theme = useTheme();
  const percent = Math.round((step / totalSteps) * 100);

  return (
    <View style={styles.wrapper}>
      <View style={styles.topRow}>
        <Pressable
          onPress={onBack ?? (() => router.back())}
          hitSlop={10}
          style={[styles.iconButton, { borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={18} color={theme.text} />
        </Pressable>

        {/* RagaKu brand lockup, reused from auth-header pattern (finding #1) */}
        <View style={styles.logoRow}>
          <View style={[styles.logoMark, { backgroundColor: theme.primary }]}>
            <Ionicons name="pulse" size={14} color="#FFFFFF" />
          </View>
          <ThemedText type="smallBold" style={styles.logoWord}>
            RAGAKU
          </ThemedText>
          <ThemedText type="small" themeColor="primary" style={styles.logoSuper}>
            AI
          </ThemedText>
        </View>

        <View style={[styles.stepBadge, { backgroundColor: theme.backgroundSelected }]}>
          <View style={[styles.dot, { backgroundColor: theme.primary }]} />
          <ThemedText type="small" themeColor="primary" style={styles.stepBadgeText}>
            STEP AKTIF
          </ThemedText>
        </View>
      </View>

      <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
        {eyebrow}
      </ThemedText>

      <View style={styles.progressRow}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          LANGKAH {step} DARI {totalSteps}
        </ThemedText>
        <ThemedText type="smallBold" themeColor="primary">
          {percent}% Selesai
        </ThemedText>
      </View>

      <View style={[styles.track, { backgroundColor: theme.border }]}>
        <View
          style={[styles.fill, { backgroundColor: theme.primary, width: `${percent}%` }]}
        />
      </View>

      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>
      {description ? (
        <ThemedText type="default" themeColor="textSecondary" style={styles.description}>
          {description}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.two,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  logoMark: {
    width: 22,
    height: 22,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWord: {
    fontSize: 13,
    letterSpacing: 0.3,
  },
  logoSuper: {
    fontSize: 9,
    fontWeight: '700',
    marginLeft: -2,
    marginTop: -5,
  },
  eyebrow: {
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stepBadgeText: {
    fontSize: 10,
    letterSpacing: 0.4,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  title: {
    marginTop: Spacing.three,
    fontSize: 24,
    lineHeight: 30,
  },
  description: {
    marginTop: 4,
  },
});
