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

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,                     // ✅ make sure labels render
        tabBarLabelPosition: "below-icon",
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "700" },
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingTop: 6,
          // ✅ keep labels/icons from being cut off on phones with gesture nav
          paddingBottom: Math.max(10, insets.bottom + 6),
          height: Math.max(64, 56 + insets.bottom),
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={size ?? 22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="my-recipes"
        options={{
          title: "My Recipes",
          tabBarLabel: "My Recipes",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "book" : "book-outline"} size={size ?? 22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarLabel: "Create",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "create" : "create-outline"} size={size ?? 22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
