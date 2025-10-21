import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import FallbackImage from "../../components/FallbackImage";
import { LOCAL_IMAGES } from "../../lib/local-images";

import {
  ACCENT,
  BORDER,
  CARD,
  MUTED,
  PRESETS,
  PRESET_RECIPES,
  RADIUS,
  RECIPE_LIBRARY,
  RecipeFull,
  SURFACE,
  TEXT,
} from "../../lib/recipes";

/** fallback meta similar to home */
function getMeta(recipe: RecipeFull | undefined) {
  const preset = (recipe as any)?.preset as string | undefined;
  const defaultsByPreset: Record<string, { active: number; total: number; diff: string }> = {
    poultry: { active: 35, total: 45, diff: "Easy" },
    meat: { active: 40, total: 55, diff: "Medium" },
    seafood: { active: 15, total: 25, diff: "Easy" },
    vegetarian: { active: 20, total: 30, diff: "Easy" },
    pork: { active: 30, total: 45, diff: "Medium" },
    grains: { active: 10, total: 20, diff: "Easy" },
    eggs: { active: 10, total: 15, diff: "Easy" },
    soups: { active: 20, total: 40, diff: "Easy" },
    stews: { active: 25, total: 60, diff: "Medium" },
    pasta: { active: 20, total: 30, diff: "Easy" },
    fruit: { active: 10, total: 15, diff: "Easy" },
    beef: { active: 25, total: 60, diff: "Medium" },
  };
  const d = defaultsByPreset[preset ?? "vegetarian"] ?? { active: 20, total: 30, diff: "Easy" };
  const meta = (recipe as any)?.meta ?? {};
  return {
    difficulty: meta.difficulty ?? d.diff,
    active: typeof meta.active === "number" ? meta.active : d.active,
    total: typeof meta.total === "number" ? meta.total : d.total,
    yieldText: meta.yield ?? "4 Servings",
  };
}

function TimePill({ minutes }: { minutes: number }) {
  return (
    <View style={styles.pill}>
      <Ionicons name="time-outline" size={14} color="#EDEDED" />
      <Text style={styles.pillText}>{minutes} min</Text>
    </View>
  );
}

export default function PresetScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const preset = PRESETS.find((p) => p.slug === slug);

  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const favRaw = await AsyncStorage.getItem("chefiq_favorites");
      setFavorites(favRaw ? (JSON.parse(favRaw) as string[]) : []);
      const histRaw = await AsyncStorage.getItem("chefiq_history");
      setHistory(histRaw ? (JSON.parse(histRaw) as string[]) : []);
    })();
  }, []);

  const recipes: RecipeFull[] = useMemo(() => {
    if (!slug) return [];
    if (slug === "favorites") return favorites.map((id) => RECIPE_LIBRARY[id]).filter(Boolean) as RecipeFull[];
    if (slug === "history") return history.map((id) => RECIPE_LIBRARY[id]).filter(Boolean) as RecipeFull[];
    const fromMap = PRESET_RECIPES[slug];
    if (fromMap?.length) return fromMap;
    return Object.values(RECIPE_LIBRARY).filter((r: any) => r.preset === slug) as RecipeFull[];
  }, [slug, favorites, history]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>{preset?.label ?? "Preset"}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.grid}>
          {recipes.length ? (
            recipes.map((item) => {
              const meta = getMeta(item);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => router.push({ pathname: "/view-recipe", params: { id: item.id } })}
                  style={styles.card}
                >
                  <View style={{ position: "relative" }}>
                    <FallbackImage
                      source={LOCAL_IMAGES[item.id] ?? { uri: item.coverUri }}
                      fallback={require("../../assets/placeholder-recipe.jpg")}
                      style={styles.cover}
                    />
                    <View style={styles.pillWrap}>
                      <TimePill minutes={meta.total} />
                    </View>
                  </View>

                  <View style={{ padding: 12 }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text numberOfLines={2} style={styles.cardDesc}>
                      {item.description}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          ) : (
            <Text style={styles.empty}>No recipes found for this preset.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: SURFACE },
  header: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: "800", color: ACCENT },
  grid: { paddingHorizontal: 16, gap: 14, marginTop: 10 },

  card: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderWidth: 1,
    borderRadius: RADIUS,
    overflow: "hidden",
  },
  cover: { width: "100%", height: 200 },
  cardTitle: { color: TEXT, fontSize: 17, fontWeight: "600" },
  cardDesc: { color: MUTED, marginTop: 4 },
  empty: { color: MUTED, textAlign: "center", marginTop: 50 },

  pillWrap: { position: "absolute", right: 10, bottom: 10 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  pillText: { color: "#EDEDED", fontWeight: "600" },
});
