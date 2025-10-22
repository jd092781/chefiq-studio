// app/_layout.tsx
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";

// keep splash until our first paint
try { SplashScreen.preventAutoHideAsync(); } catch {}

export default function RootLayout() {
  useEffect(() => {
    const t = setTimeout(() => {
      try { SplashScreen.hideAsync(); } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <StatusBar style="light" backgroundColor="#0F0F0F" />
      <Stack
        initialRouteName="(tabs)"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0F0F0F" },
        }}
      >
        {/* Tabs shell */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Stand-alone routes */}
        <Stack.Screen name="view-recipe" options={{ headerShown: false }} />
        <Stack.Screen name="guided" options={{ headerShown: false }} />
        <Stack.Screen name="presets/[slug]" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal", headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}
