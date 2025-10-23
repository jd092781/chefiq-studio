// app/(tabs)/home.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  RADIUS,
  RECIPE_LIBRARY,
  RecipeFull,
  SURFACE,
  TEXT,
} from "../../lib/recipes";

const CARD_WIDTH = Dimensions.get("window").width - 32;

// ---------- types / keys ----------
type InProgress = {
  id: string;
  stepIndex?: number;
  appliance?: string; // "minioven" | "cooker"
  mode?: string; // e.g., "air_fry"
  updatedAt: number;
};

const KEY_NAME = "chefiq_user_name";
const KEY_FAVS = "chefiq_favorites";
const KEY_HIST = "chefiq_history";
const KEY_INPROGRESS = "chefiq_inprogress";

/** Icon colors (icons only; circle stays neutral) */
const PRESET_COLORS: Record<string, string> = {
  poultry: "#FF914D",
  pork: "#FF9BAA",
  grains: "#FFD84D",
  eggs: "#FFFFFF",
  beef: "#FF665A",
  seafood: "#6BD4FF",
  vegetarian: "#7AE58B",
  pasta: "#FFC04D",
  soups: "#FFB86B",
  stews: "#C98A57",
  fruit: "#FF79C6",
  meat: "#FF7A7A",
};

/** Fallback time/difficulty if a recipe lacks meta */
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

export default function Home() {
  const [name, setName] = useState<string>("Jeff");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [inProgress, setInProgress] = useState<InProgress | null>(null);

  // load persisted data
  useEffect(() => {
    (async () => {
      const n = await AsyncStorage.getItem(KEY_NAME);
      if (n) setName(n);

      const favRaw = await AsyncStorage.getItem(KEY_FAVS);
      setFavorites(favRaw ? (JSON.parse(favRaw) as string[]) : []);

      const histRaw = await AsyncStorage.getItem(KEY_HIST);
      setHistory(histRaw ? (JSON.parse(histRaw) as string[]) : []);

      const ipRaw = await AsyncStorage.getItem(KEY_INPROGRESS);
      setInProgress(ipRaw ? (JSON.parse(ipRaw) as InProgress) : null);
    })();
  }, []);

  const clearInProgress = useCallback(async () => {
    await AsyncStorage.removeItem(KEY_INPROGRESS);
    setInProgress(null);
  }, []);

  const featured: RecipeFull[] = useMemo(
    () => [RECIPE_LIBRARY["1"], RECIPE_LIBRARY["2"], RECIPE_LIBRARY["3"], RECIPE_LIBRARY["4"]],
    []
  );

  const favoriteRecipes: RecipeFull[] = useMemo(
    () => favorites.map((id) => RECIPE_LIBRARY[id]).filter(Boolean) as RecipeFull[],
    [favorites]
  );

  const historyRecipes: RecipeFull[] = useMemo(
    () => history.map((id) => RECIPE_LIBRARY[id]).filter(Boolean) as RecipeFull[],
    [history]
  );

  const inProgRecipe = inProgress ? (RECIPE_LIBRARY[inProgress.id] as RecipeFull | undefined) : undefined;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={styles.headerRow}>
          <FallbackImage
            source={require("../../assets/studio-logo.png")}
            style={{ width: 150, height: 28 }}
            resizeMode="contain"
          />
          <Pressable onPress={() => router.push("/modal")}>
            <Ionicons name="notifications-outline" size={22} color={ACCENT} />
          </Pressable>
        </View>

        {/* Greeting */}
        <Text style={styles.hi}>Hi, Chef</Text>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={MUTED} />
          <TextInput
            placeholder="What do you want to cook?"
            placeholderTextColor={MUTED}
            style={styles.searchInput}
          />
        </View>

        {/* ---- Continue Saved Recipe ---- */}
        {inProgRecipe && (
          <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/guided",
                  params: {
                    id: inProgRecipe.id,
                    step: String(inProgress?.stepIndex ?? 0),
                    appliance: inProgress?.appliance ?? "",
                    mode: inProgress?.mode ?? "",
                  },
                })
              }
              style={[styles.card, { overflow: "hidden" }]}
            >
              <View style={{ position: "relative" }}>
                <FallbackImage
                  source={LOCAL_IMAGES[inProgRecipe.id] ?? { uri: inProgRecipe.coverUri }}
                  fallback={require("../../assets/placeholder-recipe.jpg")}
                  style={{ width: "100%", height: 140 }}
                />
                <View style={styles.continueBadge}>
                  <Ionicons name="play-circle" size={16} color="#fff" />
                  <Text style={styles.continueText}>Continue Saved Recipe</Text>
                </View>
                {!!inProgress?.stepIndex && (
                  <View style={[styles.pill, { position: "absolute", right: 10, bottom: 10 }]}>
                    <Ionicons name="list-outline" size={14} color="#EDEDED" />
                    <Text style={styles.pillText}>Step {inProgress.stepIndex + 1}</Text>
                  </View>
                )}
              </View>
              <View style={{ padding: 12, gap: 2 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {inProgRecipe.title}
                </Text>
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {inProgRecipe.description}
                </Text>
                <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                  <Pressable onPress={clearInProgress} style={styles.clearBtn}>
                    <Text style={{ color: "#ddd", fontWeight: "600" }}>Clear</Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          </View>
        )}

        {/* Presets */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Presets</Text>
          <Pressable onPress={() => router.push("/presets/all")}>
            <Text style={styles.link}>View All</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
        >
          {PRESETS.filter((p) => !["all", "favorites", "history"].includes(p.slug)).map((item) => {
            const color = PRESET_COLORS[item.slug] ?? ACCENT;
            return (
              <Pressable
                key={item.slug}
                onPress={() => router.push(`/presets/${item.slug}`)}
                style={styles.presetCircle}
              >
                <View style={styles.iconCircle}>
                  {item.iconLib === "mci" ? (
                    <MaterialCommunityIcons name={item.icon as any} size={24} color={color} />
                  ) : (
                    <Ionicons name={item.icon as any} size={24} color={color} />
                  )}
                </View>
                <Text style={styles.presetLabel}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Favorites */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Favorites</Text>
        </View>

        {favoriteRecipes.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          >
            {favoriteRecipes.slice(0, 10).map((item) => {
              const meta = getMeta(item);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => router.push({ pathname: "/view-recipe", params: { id: item.id } })}
                  style={[styles.card, { width: CARD_WIDTH * 0.8 }]}
                >
                  <View style={{ position: "relative" }}>
                    <FallbackImage
                      source={LOCAL_IMAGES[item.id] ?? { uri: item.coverUri }}
                      fallback={require("../../assets/placeholder-recipe.jpg")}
                      style={{ width: "100%", height: 140 }}
                    />
                    <View style={styles.pillWrap}>
                      <TimePill minutes={meta.total} />
                    </View>
                  </View>
                  <View style={{ padding: 12 }}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <Text style={styles.emptyHint}>No favorites yet. Tap the heart on a recipe to save it.</Text>
        )}

        {/* History */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cook History</Text>
        </View>

        {historyRecipes.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          >
            {historyRecipes.slice(0, 10).map((item) => {
              const meta = getMeta(item);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => router.push({ pathname: "/view-recipe", params: { id: item.id } })}
                  style={[styles.card, { width: CARD_WIDTH * 0.8 }]}
                >
                  <View style={{ position: "relative" }}>
                    <FallbackImage
                      source={LOCAL_IMAGES[item.id] ?? { uri: item.coverUri }}
                      fallback={require("../../assets/placeholder-recipe.jpg")}
                      style={{ width: "100%", height: 140 }}
                    />
                    <View style={styles.pillWrap}>
                      <TimePill minutes={meta.total} />
                    </View>
                  </View>
                  <View style={{ padding: 12 }}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <Text style={styles.emptyHint}>Your recent cooks will appear here.</Text>
        )}

        {/* Featured */}
        <Text style={[styles.sectionTitle, { paddingHorizontal: 16, marginTop: 18 }]}>Featured</Text>

        <View style={{ paddingHorizontal: 16, marginTop: 8, gap: 12 }}>
          {featured.map((item) => {
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
                    style={{ width: "100%", height: 200 }}
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
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: SURFACE },
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hi: { color: TEXT, fontSize: 26, fontWeight: "800", paddingHorizontal: 16, marginTop: 8 },
  searchBox: {
    marginTop: 10,
    marginHorizontal: 16,
    backgroundColor: CARD,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: { color: TEXT, flex: 1, fontSize: 15 },
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { color: TEXT, fontSize: 20, fontWeight: "700" },
  link: { color: ACCENT, fontWeight: "600" },

  presetCircle: { alignItems: "center", gap: 8 },
  iconCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  presetLabel: { color: TEXT, fontWeight: "600", fontSize: 13 },

  card: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderWidth: 1,
    borderRadius: RADIUS,
    overflow: "hidden",
  },
  cardTitle: { color: TEXT, fontSize: 16, fontWeight: "600" },
  cardDesc: { color: MUTED, marginTop: 6 },
  emptyHint: { color: MUTED, paddingHorizontal: 16, marginBottom: 6 },

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

  continueBadge: {
    position: "absolute",
    left: 10,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  continueText: { color: "#fff", fontWeight: "700" },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#1f1f1f",
    borderWidth: 1,
    borderColor: BORDER,
  },
});
