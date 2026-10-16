import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';

type StatTileProps = {
  label: string;
  value: string;
  unit?: string;
  trend?: string;
  trendPositive?: boolean;
};

export function StatTile({ label, value, unit, trend, trendPositive = true }: StatTileProps) {
  const theme = useTheme();

  return (
    <Card style={styles.card}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
        {label.toUpperCase()}
      </ThemedText>
      <View style={styles.valueRow}>
        <ThemedText type="subtitle" style={styles.value}>
          {value}
        </ThemedText>
        {unit ? (
          <ThemedText type="smallBold" themeColor="textSecondary">
            {unit}
          </ThemedText>
        ) : null}
      </View>
      {trend ? (
        <ThemedText
          type="small"
          style={{ color: trendPositive ? theme.primary : theme.warning }}>
          {trend}
        </ThemedText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: 4,
  },
  label: {
    letterSpacing: 0.4,
    fontSize: 11,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: 26,
    lineHeight: 30,
  },
});
