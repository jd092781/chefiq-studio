// app/_layout.tsx
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";

// Keep the splash visible while we set up
void SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore if already prevented */
});

export default function RootLayout() {
  useEffect(() => {
    const t = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 1200); // adjust if you want longer/shorter
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <StatusBar style="light" backgroundColor="#060807" />
      <Slot />
           <Stack screenOptions={{ headerShown: false }}>
        {/* Route groups/screens registered here */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="view-recipe" options={{ headerShown: false }} />
        <Stack.Screen name="guided" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal", headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}
