import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { CardRadius, CardShadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  selected?: boolean;
  padded?: boolean;
};

export function Card({ children, style, selected, padded = true }: CardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.base,
        CardShadow,
        {
          backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
          borderColor: selected ? theme.primary : theme.border,
        },
        padded && styles.padded,
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: CardRadius,
    borderWidth: 1,
  },
  padded: {
    padding: Spacing.three,
  },
});
