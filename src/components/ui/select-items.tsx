import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CardRadius, CardShadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SelectGridCardProps = {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  selected?: boolean;
  badge?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function SelectGridCard({
  title,
  subtitle,
  icon,
  selected,
  badge,
  onPress,
  style,
}: SelectGridCardProps) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} style={[styles.gridFlex, style]}>
      <View
        style={[
          styles.gridCard,
          CardShadow,
          {
            backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
            borderColor: selected ? theme.primary : theme.border,
          },
        ]}>
        <View style={styles.gridTopRow}>
          {badge ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.gridBadge}>
              {badge}
            </ThemedText>
          ) : (
            <View />
          )}
          {selected ? (
            <View style={[styles.checkCircle, { backgroundColor: theme.primary }]}>
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            </View>
          ) : (
            <View style={[styles.checkCircleEmpty, { borderColor: theme.border }]} />
          )}
        </View>

        <View style={styles.gridIconWrap}>{icon}</View>

        <ThemedText type="smallBold" style={styles.gridTitle}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.gridSubtitle}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

type SelectRowItemProps = {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  selected?: boolean;
  badge?: string;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function SelectRowItem({
  title,
  subtitle,
  icon,
  selected,
  badge,
  disabled,
  onPress,
  style,
}: SelectRowItemProps) {
  const theme = useTheme();

  return (
    <Pressable onPress={disabled ? undefined : onPress} disabled={disabled} style={style}>
      <View
        style={[
          styles.row,
          CardShadow,
          {
            backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
            borderColor: selected ? theme.primary : theme.border,
            opacity: disabled ? 0.5 : 1,
          },
        ]}>
        <View
          style={[
            styles.rowIconBox,
            { backgroundColor: selected ? theme.primary : theme.background },
          ]}>
          {icon}
        </View>

        <View style={styles.rowTextBlock}>
          <View style={styles.rowTitleLine}>
            <ThemedText type="smallBold" style={styles.rowTitle}>
              {title}
            </ThemedText>
            {badge ? (
              <View style={[styles.rowBadge, { backgroundColor: theme.background }]}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.rowBadgeText}>
                  {badge}
                </ThemedText>
              </View>
            ) : null}
          </View>
          {subtitle ? (
            <ThemedText type="small" themeColor="textSecondary">
              {subtitle}
            </ThemedText>
          ) : null}
        </View>

        {selected ? (
          <View style={[styles.checkCircle, { backgroundColor: theme.primary }]}>
            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
          </View>
        ) : (
          <View style={[styles.checkCircleEmpty, { borderColor: theme.border }]} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gridFlex: {
    flexBasis: '46%',
    flexGrow: 1,
  },
  gridCard: {
    borderRadius: CardRadius,
    borderWidth: 1.5,
    padding: Spacing.three,
    gap: 6,
  },
  gridTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridBadge: {
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  gridIconWrap: {
    marginTop: 4,
    marginBottom: 2,
  },
  gridTitle: {
    fontSize: 15,
  },
  gridSubtitle: {
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1.5,
    borderRadius: CardRadius,
    padding: Spacing.three,
  },
  rowIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextBlock: {
    flex: 1,
    gap: 2,
  },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  rowTitle: {
    fontSize: 15,
  },
  rowBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  rowBadgeText: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleEmpty: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
  },
});
