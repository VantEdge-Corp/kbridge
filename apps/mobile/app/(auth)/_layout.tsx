import { Stack } from 'expo-router';
import { useTheme } from '@/lib/theme';

export const unstable_settings = { initialRouteName: 'welcome' };

export default function AuthLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="apply" />
      <Stack.Screen name="status" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
