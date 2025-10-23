import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
  const [name] = useState("Chef");
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

  const featured: RecipeFull[] = useMemo(
    () =>
      [RECIPE_LIBRARY["4"], RECIPE_LIBRARY["2"], RECIPE_LIBRARY["3"], RECIPE_LIBRARY["1"]].filter(
        Boolean
      ) as RecipeFull[],
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

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <FallbackImage
            source={require("../../assets/studio-logo.png")}
            style={{ width: 150, height: 28 }}
            resizeMode="contain"
          />
          <Pressable hitSlop={10}>
            <Ionicons name="notifications-outline" size={22} color={ACCENT} />
          </Pressable>
        </View>

        {/* Greeting */}
        <Text style={styles.hi}>Hi, {name}</Text>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={MUTED} />
          <TextInput
            placeholder="What do you want to cook?"
            placeholderTextColor={MUTED}
            style={styles.searchInput}
          />
        </View>

        {/* Presets */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Presets</Text>
          <Link href="/presets/all" asChild prefetch>
            <Pressable>
              <Text style={styles.link}>View All</Text>
            </Pressable>
          </Link>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
        >
          {PRESETS.filter((p) => !["all", "favorites", "history"].includes(p.slug)).map((item) => {
            const color = PRESET_COLORS[item.slug] ?? ACCENT;
            return (
              <Link
                key={item.slug}
                href={{ pathname: `/presets/${item.slug}` }}
                asChild
                prefetch
              >
                <Pressable style={styles.presetCircle}>
                  <View style={styles.iconCircle}>
                    {item.iconLib === "mci" ? (
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={24}
                        color={color}
                      />
                    ) : (
                      <Ionicons name={item.icon as any} size={24} color={color} />
                    )}
                  </View>
                  <Text style={styles.presetLabel}>{item.label}</Text>
                </Pressable>
              </Link>
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
                <Link
                  key={item.id}
                  href={{ pathname: "/view-recipe", params: { id: item.id } }}
                  asChild
                  prefetch
                >
                  <Pressable style={[styles.card, { width: CARD_WIDTH * 0.8 }]}>
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
                </Link>
              );
            })}
          </ScrollView>
        ) : (
          <Text style={styles.emptyHint}>
            No favorites yet. Tap the heart on a recipe to save it.
          </Text>
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
                <Link
                  key={item.id}
                  href={{ pathname: "/view-recipe", params: { id: item.id } }}
                  asChild
                  prefetch
                >
                  <Pressable style={[styles.card, { width: CARD_WIDTH * 0.8 }]}>
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
                </Link>
              );
            })}
          </ScrollView>
        ) : (
          <Text style={styles.emptyHint}>Your recent cooks will appear here.</Text>
        )}

        {/* Featured */}
        <Text
          style={[styles.sectionTitle, { paddingHorizontal: 16, marginTop: 18 }]}
        >
          Featured
        </Text>

        <View style={{ paddingHorizontal: 16, marginTop: 8, gap: 12 }}>
          {featured.map((item) => {
            const meta = getMeta(item);
            return (
              <Link
                key={item.id}
                href={{ pathname: "/view-recipe", params: { id: item.id } }}
                asChild
                prefetch
              >
                <Pressable style={styles.card}>
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
              </Link>
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
});
