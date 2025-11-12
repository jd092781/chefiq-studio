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
import { getRecipeCreator } from "../../lib/creators";
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

/** ratings key & helpers */
type OneReview = { stars: number; text?: string; ts: number };
type ReviewBundle = { ratings: OneReview[]; avg: number; count: number };
const REVIEWS_KEY = "chefiq_reviews_v1";

const STAR = "#FFD54A";

function renderStarsTiny(avg: number) {
  const full = Math.floor(avg);
  const half = avg - full >= 0.25 && avg - full < 0.75;
  const nodes: JSX.Element[] = [];
  for (let i = 0; i < full; i++) nodes.push(<Ionicons key={`f${i}`} name="star" size={12} color={STAR} />);
  if (half) nodes.push(<Ionicons key="h" name="star-half" size={12} color={STAR} />);
  const remain = 5 - full - (half ? 1 : 0);
  for (let i = 0; i < remain; i++) nodes.push(<Ionicons key={`o${i}`} name="star-outline" size={12} color={STAR} />);
  return nodes;
}

// deterministic 4.0–5.0 with some perfect 5.0s sprinkled in
function seededAvgForId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const r01 = (h % 1000) / 1000; // 0..1
  if (h % 9 === 0) return 5.0; // sprinkle perfect 5.0s
  const val = 4.0 + r01 * 1.0; // 4.0..5.0
  return Math.round(val * 10) / 10;
}

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
  const [ratings, setRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const favRaw = await AsyncStorage.getItem("chefiq_favorites");
      setFavorites(favRaw ? (JSON.parse(favRaw) as string[]) : []);
      const histRaw = await AsyncStorage.getItem("chefiq_history");
      setHistory(histRaw ? (JSON.parse(histRaw) as string[]) : []);

      // ratings: clamp stored to >=4.0, seed missing 4.0–5.0
      const revRaw = await AsyncStorage.getItem(REVIEWS_KEY);
      const bundle = revRaw ? (JSON.parse(revRaw) as Record<string, ReviewBundle>) : {};
      const avgMap: Record<string, number> = {};
      const idsHere = (PRESET_RECIPES[slug!] ?? [])
        .map((r) => r.id)
        .concat(Object.values(RECIPE_LIBRARY).filter((r: any) => r.preset === slug).map((r) => r.id));
      let changed = false;

      for (const id of idsHere) {
        const stored = bundle[id]?.avg;
        const seeded = seededAvgForId(id);
        let finalAvg: number;

        if (typeof stored === "number") {
          finalAvg = stored < 4.0 ? seeded : stored;
          if (stored < 4.0) {
            if (!bundle[id]) bundle[id] = { ratings: [], avg: finalAvg, count: 0 };
            else bundle[id].avg = finalAvg;
            changed = true;
          }
        } else {
          finalAvg = seeded;
          if (!bundle[id]) bundle[id] = { ratings: [], avg: finalAvg, count: 0 };
          else bundle[id].avg = finalAvg;
          changed = true;
        }

        avgMap[id] = parseFloat(finalAvg.toFixed(1));
      }

      setRatings(avgMap);
      if (changed) {
        await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(bundle));
      }
    })();
  }, [slug]);

  const recipes: RecipeFull[] = useMemo(() => {
    if (!slug) return [];
    if (slug === "favorites") return favorites.map((id) => RECIPE_LIBRARY[id]).filter(Boolean) as RecipeFull[];
    if (slug === "history") return history.map((id) => RECIPE_LIBRARY[id]).filter(Boolean) as RecipeFull[];
    const fromMap = PRESET_RECIPES[slug];
    if (fromMap?.length) return fromMap;
    return Object.values(RECIPE_LIBRARY).filter((r: any) => r.preset === slug) as RecipeFull[];
  }, [slug, favorites, history]);

  const getAvg = (id?: string) => (id && ratings[id] ? ratings[id] : (id ? seededAvgForId(id) : 0));

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
                    {/* cook time left */}
                    <View style={styles.pillWrapLeft}>
                      <TimePill minutes={meta.total} />
                    </View>
                    {/* rating right */}
                    <View style={styles.ratingBadge}>
                      <View style={{ flexDirection: "row", gap: 1 }}>{renderStarsTiny(getAvg(item.id))}</View>
                      <Text style={styles.ratingText}>{getAvg(item.id).toFixed(1)}</Text>
                    </View>
                  </View>

                  <View style={{ padding: 12 }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text numberOfLines={2} style={styles.cardDesc}>
                      {item.description}
                    </Text>
                    <Text style={{ color: MUTED, fontSize: 12, marginTop: 6 }}>by @{getRecipeCreator(item)}</Text>
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
  pillWrapLeft: { position: "absolute", left: 10, bottom: 10 },

  ratingBadge: {
    position: "absolute",
    right: 10,
    bottom: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingText: { color: "#EDEDED", fontSize: 12, fontWeight: "700" },
});
