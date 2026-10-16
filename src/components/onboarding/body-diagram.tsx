import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Rect } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export type BodyZone = 'bahu' | 'punggung' | 'lutut';

type BodyDiagramProps = {
  activeZones: BodyZone[];
  onToggleZone: (zone: BodyZone) => void;
};

const VIEW_WIDTH = 160;
const VIEW_HEIGHT = 320;

export function BodyDiagram({ activeZones, onToggleZone }: BodyDiagramProps) {
  const theme = useTheme();

  const isActive = (zone: BodyZone) => activeZones.includes(zone);
  const zoneColor = (zone: BodyZone) => (isActive(zone) ? theme.warning : theme.textSecondary);

  return (
    <View style={styles.wrapper}>
      <Svg width={VIEW_WIDTH} height={VIEW_HEIGHT} viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}>
        {/* head */}
        <Circle cx={80} cy={28} r={20} fill={theme.border} />
        {/* torso */}
        <Rect x={52} y={50} width={56} height={90} rx={20} fill={theme.border} />
        {/* shoulders marker */}
        <Circle cx={52} cy={62} r={12} fill="none" stroke={zoneColor('bahu')} strokeWidth={3} />
        <Circle cx={108} cy={62} r={12} fill="none" stroke={zoneColor('bahu')} strokeWidth={3} />
        {/* lower back marker */}
        <Ellipse cx={80} cy={132} rx={22} ry={14} fill="none" stroke={zoneColor('punggung')} strokeWidth={3} />
        {/* arms */}
        <Rect x={30} y={55} width={18} height={80} rx={9} fill={theme.border} />
        <Rect x={112} y={55} width={18} height={80} rx={9} fill={theme.border} />
        {/* legs */}
        <Rect x={56} y={140} width={20} height={110} rx={10} fill={theme.border} />
        <Rect x={84} y={140} width={20} height={110} rx={10} fill={theme.border} />
        {/* knees marker */}
        <Circle cx={66} cy={220} r={14} fill="none" stroke={zoneColor('lutut')} strokeWidth={3} />
        <Circle cx={94} cy={220} r={14} fill="none" stroke={zoneColor('lutut')} strokeWidth={3} />
      </Svg>

      <Pressable
        onPress={() => onToggleZone('bahu')}
        style={[styles.hotspot, { top: 44, left: 22 }]}
        hitSlop={8}>
        <ThemedText type="small" style={{ color: zoneColor('bahu') }}>
          Bahu
        </ThemedText>
      </Pressable>

      <Pressable
        onPress={() => onToggleZone('punggung')}
        style={[styles.hotspot, { top: 118, left: 108 }]}
        hitSlop={8}>
        <ThemedText type="small" style={{ color: zoneColor('punggung') }}>
          Punggung
        </ThemedText>
      </Pressable>

      <Pressable
        onPress={() => onToggleZone('lutut')}
        style={[styles.hotspot, { top: 208, left: 4 }]}
        hitSlop={8}>
        <ThemedText type="small" style={{ color: zoneColor('lutut') }}>
          Lutut
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT,
  },
  hotspot: {
    position: 'absolute',
  },
});
