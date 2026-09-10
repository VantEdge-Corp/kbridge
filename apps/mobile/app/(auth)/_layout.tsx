import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export const unstable_settings = { initialRouteName: 'welcome' };

export default function AuthLayout() {
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
