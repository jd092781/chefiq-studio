// app/creator/[handle].tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import FallbackImage from "../../components/FallbackImage";
import { listRecipesByCreator } from "../../lib/creators";
import { LOCAL_IMAGES } from "../../lib/local-images";
import { BORDER, CARD, MUTED, RADIUS, SURFACE, TEXT, type RecipeFull } from "../../lib/recipes";

function TimePill({ minutes }: { minutes: number }) {
  return (
    <View style={styles.pill}>
      <Ionicons name="time-outline" size={14} color="#EDEDED" />
      <Text style={styles.pillText}>{minutes} min</Text>
    </View>
  );
}

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
  };
}

export default function CreatorPage() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const clean = (handle || "").replace("@", "");
  const display = `@${clean}`;

  const recipes = useMemo(() => listRecipesByCreator(clean), [clean]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header row (kept comfortably below the top so it's not jammed) */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 }}>
          <Text style={styles.title}>{display}</Text>
          <Text style={{ color: MUTED }}>{recipes.length} recipe{recipes.length === 1 ? "" : "s"}</Text>
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: 8, gap: 12 }}>
          {recipes.map((item) => {
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
                    style={{ width: "100%", height: 180 }}
                  />
                  <View style={styles.pillWrapLeft}>
                    <TimePill minutes={meta.total} />
                  </View>
                </View>
                <View style={{ padding: 12 }}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text numberOfLines={2} style={{ color: MUTED, marginTop: 4 }}>
                    {item.description}
                  </Text>
                </View>
              </Pressable>
            );
          })}
          {recipes.length === 0 && (
            <Text style={{ color: MUTED, textAlign: "center", marginTop: 40 }}>
              No recipes yet for this creator.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: SURFACE },
  title: { color: TEXT, fontSize: 24, fontWeight: "800" },
  card: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderWidth: 1,
    borderRadius: RADIUS,
    overflow: "hidden",
  },
  cardTitle: { color: TEXT, fontSize: 16, fontWeight: "600" },

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
