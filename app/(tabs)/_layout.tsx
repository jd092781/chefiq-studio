import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";


const colors = {
  surface: "#0F0F0F",
  border: "#2A2A2A",
  accent: "#4dd08c",
  muted: "#9CA3AF",
};



export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        tabBarHideOnKeyboard: true,
      }}
    >
      {/* 🏠 Home */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size ?? 22}
              color={color}
            />
          ),
        }}
      />

      {/* 📚 My Recipes (renamed from Drafts) */}
      <Tabs.Screen
        name="my-recipes"
        options={{
          title: "My Recipes",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "book" : "book-outline"}
              size={size ?? 22}
              color={color}
            />
          ),
        }}
      />

      {/* ✏️ Create */}
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "create" : "create-outline"}
              size={size ?? 22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
