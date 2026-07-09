import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext.js';
import LoginScreen from '../screens/LoginScreen.js';
import DiscoverScreen from '../screens/DiscoverScreen.js';
import MatchesScreen from '../screens/MatchesScreen.js';
import ProfileScreen from '../screens/ProfileScreen.js';
import ChatScreen from '../screens/ChatScreen.js';
import { colors, fonts } from '../theme.js';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.line,
    primary: colors.accent,
  },
};

const tabIcon = (name) => ({ color, size }) => (
  <Feather name={name} size={size - 4} color={color} />
);

function MemberTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.line,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.mono,
          fontSize: 9,
          letterSpacing: 1.5,
        },
      }}
    >
      <Tabs.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{ tabBarLabel: 'DISCOVER', tabBarIcon: tabIcon('compass') }}
      />
      <Tabs.Screen
        name="Matches"
        component={MatchesScreen}
        options={{ tabBarLabel: 'MATCHES', tabBarIcon: tabIcon('heart') }}
      />
      <Tabs.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'PROFILE', tabBarIcon: tabIcon('user') }}
      />
    </Tabs.Navigator>
  );
}

function Splash() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 36, color: colors.text }}>
        kbridge<Text style={{ fontStyle: 'italic', color: colors.accent }}>.</Text>
      </Text>
    </View>
  );
}

export default function RootNavigator() {
  const { session, booting } = useAuth();

  if (booting) return <Splash />;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <>
            <Stack.Screen name="Tabs" component={MemberTabs} />
            <Stack.Screen name="Chat" component={ChatScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
