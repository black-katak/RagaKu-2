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

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="beranda" href="/beranda" asChild>
            <TabButton icon="monitor_heart">Beranda</TabButton>
          </TabTrigger>
          <TabTrigger name="rencana" href="/rencana" asChild>
            <TabButton icon="assignment">Rencana</TabButton>
          </TabTrigger>
          <TabTrigger name="ukuran" href="/ukuran" asChild>
            <TabButton icon="straighten">Ukuran</TabButton>
          </TabTrigger>
          <TabTrigger name="progress" href="/progress" asChild>
            <TabButton icon="show_chart">Progres</TabButton>
          </TabTrigger>
          <TabTrigger name="profil" href="/profil" asChild>
            <TabButton icon="account_circle">Profil</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
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
      <ThemedText type="small" themeColor={isFocused ? 'primary' : 'textSecondary'}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        <ThemedText type="smallBold" style={styles.brandText}>
          RagaKu
        </ThemedText>

        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
  },
  brandText: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  tabItem: {
    alignItems: 'center',
    gap: 2,
  },
});
