import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Keep the root layout minimal. No navigation here.
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#0F0F0F" />
      <Slot />
    </SafeAreaProvider>
  );
}
