import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type ProgressBarProps = {
  percent: number;
  height?: number;
  color?: string;
  trackColor?: string;
};

export function ProgressBar({ percent, height = 6, color, trackColor }: ProgressBarProps) {
  const theme = useTheme();
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: height / 2, backgroundColor: trackColor ?? theme.border },
      ]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clamped}%`,
            borderRadius: height / 2,
            backgroundColor: color ?? theme.primary,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
