// app/creator.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import FallbackImage from "../components/FallbackImage";
import { getRecipeCreator } from "../lib/creators";
import { LOCAL_IMAGES } from "../lib/local-images";
import {
    ACCENT,
    BORDER,
    CARD,
    MUTED,
    RADIUS,
    RECIPE_LIBRARY,
    RecipeFull,
    SURFACE,
    TEXT,
} from "../lib/recipes";

const CARD_WIDTH = Dimensions.get("window").width - 32;

function TimePill({ minutes }: { minutes: number }) {
  return (
    <View style={styles.pill}>
      <Ionicons name="time-outline" size={14} color="#EDEDED" />
      <Text style={styles.pillText}>{minutes} min</Text>
    </View>
  );
}

/** Simple meta helper (same pattern as home) */
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

export default function CreatorScreen() {
  const params = useLocalSearchParams<{ handle?: string }>();
  const handle = (params.handle || "").toString(); // e.g. "grill_guru"

  const recipes: RecipeFull[] = useMemo(() => {
    if (!handle) return [];
    return Object.values(RECIPE_LIBRARY).filter((r) => getRecipeCreator(r) === handle);
  }, [handle]);

  const displayHandle = handle ? `@${handle}` : "Unknown chef";

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="chevron-back" size={22} color={ACCENT} />
          </Pressable>
          <Text style={styles.headerTitle}>Home Chef</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Creator card */}
        <View style={styles.creatorCard}>
          <View style={styles.creatorAvatar}>
            <Text style={styles.creatorAvatarText}>
              {handle ? handle.slice(0, 2).toUpperCase() : "HC"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.creatorHandle}>{displayHandle}</Text>
            <Text style={styles.creatorSub}>
              {recipes.length ? `${recipes.length} shared recipes` : "New home chef"}
            </Text>
          </View>
        </View>

        {/* Recipes list */}
        <Text style={styles.sectionTitle}>Recipes by this chef</Text>

        {recipes.length === 0 ? (
          <Text style={styles.emptyHint}>
            This chef hasn&apos;t published any recipes yet.
          </Text>
        ) : (
          <View style={{ paddingHorizontal: 16, marginTop: 8, gap: 12 }}>
            {recipes.map((item) => {
              const meta = getMeta(item);
              const localSrc = LOCAL_IMAGES[item.id] ?? { uri: item.coverUri };
              return (
                <Pressable
                  key={item.id}
                  onPress={() => router.push({ pathname: "/view-recipe", params: { id: item.id } })}
                  style={styles.card}
                >
                  <View style={{ position: "relative" }}>
                    <FallbackImage
                      source={localSrc}
                      fallback={require("../assets/placeholder-recipe.jpg")}
                      style={{ width: "100%", height: 180 }}
                    />
                    <View style={styles.pillWrapLeft}>
                      <TimePill minutes={meta.total} />
                    </View>
                  </View>
                  <View style={{ padding: 12 }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {!!item.description && (
                      <Text numberOfLines={2} style={styles.cardDesc}>
                        {item.description}
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: SURFACE },

  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { color: TEXT, fontSize: 18, fontWeight: "700" },

  creatorCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: CARD,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  creatorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  creatorAvatarText: { color: "#EDEDED", fontWeight: "800", fontSize: 18 },
  creatorHandle: { color: TEXT, fontWeight: "700", fontSize: 18 },
  creatorSub: { color: MUTED, marginTop: 2 },

  sectionTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: 16,
    marginTop: 16,
  },
  emptyHint: { color: MUTED, paddingHorizontal: 16, marginTop: 6 },

  card: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderWidth: 1,
    borderRadius: RADIUS,
    overflow: "hidden",
  },
  cardTitle: { color: TEXT, fontSize: 16, fontWeight: "600" },
  cardDesc: { color: MUTED, marginTop: 6 },

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
});
