import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, useColorScheme, View, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

// Web nav = top bar (logo left, links right), per Figma "RagaKu v2 — Web" frames.
// Native app keeps the bottom NativeTabs bar (see app-tabs.tsx) — this file is .web-only.
export default function AppTabs() {
  return (
    <Tabs>
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="beranda" href="/beranda" asChild>
            <TabButton icon="monitor_heart">Beranda</TabButton>
          </TabTrigger>
          <TabTrigger name="rencana" href="/rencana" asChild>
            <TabButton icon="assignment">Rencana</TabButton>
          </TabTrigger>
          <TabTrigger name="progress" href="/progress" asChild>
            <TabButton icon="show_chart">Progres</TabButton>
          </TabTrigger>
          <TabTrigger name="profil" href="/profil" asChild>
            <TabButton icon="account_circle">Profil</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
      <TabSlot style={{ flex: 1 }} />
    </Tabs>
  );
}

type IconKey = 'monitor_heart' | 'assignment' | 'straighten' | 'show_chart' | 'account_circle';

const iconMap: Record<IconKey, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  monitor_heart: 'heart-pulse',
  assignment: 'clipboard-list-outline',
  straighten: 'tape-measure',
  show_chart: 'chart-line',
  account_circle: 'account-circle-outline',
};

export function TabButton({
  children,
  isFocused,
  icon,
  ...props
}: TabTriggerSlotProps & { icon: IconKey }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabItem, pressed && styles.pressed]}>
      <MaterialCommunityIcons
        name={iconMap[icon]}
        size={18}
        color={isFocused ? colors.primary : colors.textSecondary}
      />
      <ThemedText
        type={isFocused ? 'smallBold' : 'small'}
        themeColor={isFocused ? 'primary' : 'textSecondary'}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

// Top bar per web spec: logo left, nav links right, thin bottom border, full width.
export function CustomTabList(props: TabListProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <ThemedView type="backgroundElement" style={[styles.bar, { borderBottomColor: colors.border }]}>
      <View style={styles.inner}>
        <View style={styles.logoRow}>
          <View style={[styles.logoMark, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="pulse" size={16} color="#FFFFFF" />
          </View>
          <ThemedText type="smallBold" style={styles.logoWord}>
            RAGAKU
          </ThemedText>
          <ThemedText type="small" themeColor="primary" style={styles.logoSuper}>
            AI
          </ThemedText>
        </View>

        <View {...props} style={styles.links}>
          {props.children}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth + Spacing.four * 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWord: {
    fontSize: 15,
    letterSpacing: 0.3,
  },
  logoSuper: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: -2,
    marginTop: -6,
  },
  links: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.five,
  },
  pressed: {
    opacity: 0.7,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.two,
  },
});
