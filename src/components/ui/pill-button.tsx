import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type PillButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: 'primary' | 'outline';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PillButton({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...rest
}: PillButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        isPrimary
          ? { backgroundColor: theme.primary }
          : { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.primary },
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#FFFFFF' : theme.primary} />
      ) : (
        <ThemedText
          type="default"
          style={isPrimary ? styles.labelPrimary : [styles.labelOutline, { color: theme.primary }]}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  labelPrimary: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  labelOutline: {
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  },
});
