import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { iconSizes } from '@/constants/theme';
import { useTheme } from '@/lib/theme';
import { useInboxBadge } from '@/hooks/useInboxBadge';

type FeatherName = React.ComponentProps<typeof Feather>['name'];

function icon(name: FeatherName) {
  return function TabIcon({ color }: { color: ColorValue }) {
    return <Feather name={name} size={iconSizes.nav} color={color as string} />;
  };
}

/** Exactly five tabs. Settings is reached from Me, never from here. */
export default function TabsLayout() {
  const { colors } = useTheme();
  const inboxBadge = useInboxBadge();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ivory,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarBadgeStyle: { backgroundColor: colors.ivory, color: colors.onIvory, fontSize: 10, fontWeight: '600', minWidth: 16, height: 16, lineHeight: 16, borderRadius: 8 },
        sceneStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home') }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: icon('search') }} />
      <Tabs.Screen name="feed" options={{ title: 'Feed', tabBarIcon: icon('layers') }} />
      <Tabs.Screen
        name="inbox"
        options={{ title: 'Inbox', tabBarIcon: icon('inbox'), tabBarBadge: inboxBadge > 0 ? (inboxBadge > 99 ? '99+' : inboxBadge) : undefined }}
      />
      <Tabs.Screen name="me" options={{ title: 'Me', tabBarIcon: icon('user') }} />
    </Tabs>
  );
}
