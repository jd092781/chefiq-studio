import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const colors = {
  surface: "#0F0F0F",
  border: "#2A2A2A",
  accent: "#4dd08c",
  muted: "#9CA3AF",
};

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  // Extra tall bar for Android mobile browsers that overlay UI at the bottom
  const barHeight = 72 + Math.max(insets.bottom, 16);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelPosition: "below-icon",
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: "700",
          marginTop: 2,
        },
        tabBarIconStyle: { marginTop: 2 },
        tabBarItemStyle: { paddingVertical: 2 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: barHeight,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 18),
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-recipes"
        options={{
          title: "My Recipes",
          tabBarLabel: "My Recipes",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "book" : "book-outline"} size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarLabel: "Create",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "create" : "create-outline"} size={size ?? 24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
