import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type NumberStepperProps = {
  label: string;
  value: number;
  unit: string;
  step?: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
};

export function NumberStepper({
  label,
  value,
  unit,
  step = 1,
  min = 0,
  max = 999,
  onChange,
}: NumberStepperProps) {
  const theme = useTheme();

  const decrement = () => onChange(Math.max(min, +(value - step).toFixed(1)));
  const increment = () => onChange(Math.min(max, +(value + step).toFixed(1)));

  return (
    <View style={styles.row}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
        {label.toUpperCase()}
      </ThemedText>

      <View style={styles.controlRow}>
        <Pressable
          onPress={decrement}
          style={[styles.circleButton, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <Ionicons name="remove" size={20} color={theme.text} />
        </Pressable>

        <View style={styles.valueBlock}>
          <ThemedText type="title" style={styles.value}>
            {value}
          </ThemedText>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.unit}>
            {unit}
          </ThemedText>
        </View>

        <Pressable
          onPress={increment}
          style={[styles.circleButton, { backgroundColor: theme.primary }]}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: Spacing.two,
  },
  label: {
    letterSpacing: 0.6,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: 40,
    lineHeight: 44,
  },
  unit: {
    fontSize: 16,
  },
});
