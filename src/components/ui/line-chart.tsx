import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type LineChartProps = {
  data: number[];
  labels?: string[];
  targetValue?: number;
  height?: number;
};

const VIRTUAL_WIDTH = 300;

export function LineChart({ data, labels, targetValue, height = 140 }: LineChartProps) {
  const theme = useTheme();

  const values = targetValue != null ? [...data, targetValue] : data;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const paddingY = height * 0.15;
  const usableHeight = height - paddingY * 2;

  const toXY = (index: number, value: number) => {
    const x = data.length > 1 ? (index / (data.length - 1)) * VIRTUAL_WIDTH : VIRTUAL_WIDTH / 2;
    const y = height - paddingY - ((value - min) / range) * usableHeight;
    return { x, y };
  };

  const points = data.map((value, index) => toXY(index, value));
  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x},${point.y}`)
    .join(' ');

  const targetY =
    targetValue != null ? height - paddingY - ((targetValue - min) / range) * usableHeight : null;

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 ${VIRTUAL_WIDTH} ${height}`} preserveAspectRatio="none">
        {targetY != null ? (
          <Line
            x1={0}
            y1={targetY}
            x2={VIRTUAL_WIDTH}
            y2={targetY}
            stroke={theme.warning}
            strokeWidth={1.5}
            strokeDasharray="6,6"
          />
        ) : null}

        <Path d={linePath} stroke={theme.primary} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((point, index) => (
          <Circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={4.5}
            fill="#FFFFFF"
            stroke={theme.primary}
            strokeWidth={2.5}
          />
        ))}
      </Svg>

      {labels && labels.length > 0 ? (
        <View style={styles.labelRow}>
          {labels.map((label) => (
            <ThemedText key={label} type="small" themeColor="textSecondary">
              {label}
            </ThemedText>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});
