import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import { iconSizes } from '@/constants/theme';
import { InboxSummaryProvider, useInboxSummary } from '@/lib/inboxSummary';
import { useTheme } from '@/lib/theme';

function icon(name: IconName) {
  return function TabIcon({ color }: { color: ColorValue }) {
    return <Icon name={name} size={iconSizes.nav} color={color as string} />;
  };
}

export default function TabsLayout() {
  return (
    <InboxSummaryProvider>
      <FiveTabs />
    </InboxSummaryProvider>
  );
}

/** Exactly five tabs, with the web sidebar's icons. Settings is reached from Me, never from here. */
function FiveTabs() {
  const { colors } = useTheme();
  const { badge } = useInboxSummary();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.foreground,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: 1 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarBadgeStyle: { backgroundColor: colors.primary, color: colors.primaryForeground, fontSize: 10, fontWeight: '600', minWidth: 16, height: 16, lineHeight: 16, borderRadius: 8 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('house') }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: icon('compass') }} />
      <Tabs.Screen name="feed" options={{ title: 'Feed', tabBarIcon: icon('newspaper') }} />
      <Tabs.Screen
        name="inbox"
        options={{ title: 'Inbox', tabBarIcon: icon('inbox'), tabBarBadge: badge > 0 ? (badge > 99 ? '99+' : badge) : undefined }}
      />
      <Tabs.Screen name="me" options={{ title: 'Me', tabBarIcon: icon('user') }} />
    </Tabs>
  );
}
