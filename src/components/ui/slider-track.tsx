import { useMemo, useState } from 'react';
import { PanResponder, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type SliderTrackProps = {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  labels?: string[];
};

const THUMB_SIZE = 22;

export function SliderTrack({ value, min, max, step = 1, onChange, labels }: SliderTrackProps) {
  const theme = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);

  const percent = Math.min(1, Math.max(0, (value - min) / (max - min)));

  const onLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  const panResponder = useMemo(() => {
    const updateFromPosition = (locationX: number) => {
      if (trackWidth <= 0) return;
      const ratio = Math.min(1, Math.max(0, locationX / trackWidth));
      const rawValue = min + ratio * (max - min);
      const stepped = Math.round(rawValue / step) * step;
      onChange(Math.min(max, Math.max(min, stepped)));
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => updateFromPosition(event.nativeEvent.locationX),
      onPanResponderMove: (event) => updateFromPosition(event.nativeEvent.locationX),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max, step, trackWidth]);

  return (
    <View style={styles.wrapper}>
      <View
        style={[styles.track, { backgroundColor: theme.border }]}
        onLayout={onLayout}
        hitSlop={12}
        {...panResponder.panHandlers}>
        <View
          style={[styles.fill, { backgroundColor: theme.primary, width: `${percent * 100}%` }]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              backgroundColor: '#FFFFFF',
              borderColor: theme.primary,
              left: Math.max(0, percent * trackWidth - THUMB_SIZE / 2),
            },
          ]}
        />
      </View>

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
  wrapper: {
    gap: 8,
  },
  track: {
    height: 8,
    borderRadius: 4,
    justifyContent: 'center',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 3,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
