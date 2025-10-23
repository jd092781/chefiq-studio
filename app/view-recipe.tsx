import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import FallbackImage from "../components/FallbackImage";
import { LOCAL_IMAGES } from "../lib/local-images";

import {
  ACCENT,
  BORDER,
  CARD,
  MUTED,
  PRESET_RECIPES,
  RADIUS,
  RECIPE_LIBRARY,
  RecipeFull,
  SURFACE,
  TEXT,
} from "../lib/recipes";

function getMeta(recipe: RecipeFull | undefined) {
  const preset = (recipe as any)?.preset as string | undefined;
  const defaultsByPreset: Record<
    string,
    { active: number; total: number; diff: string }
  > = {
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
  const d = defaultsByPreset[preset ?? "vegetarian"] ?? {
    active: 20,
    total: 30,
    diff: "Easy",
  };
  const meta = (recipe as any)?.meta ?? {};
  return {
    difficulty: meta.difficulty ?? d.diff,
    active: typeof meta.active === "number" ? meta.active : d.active,
    total: typeof meta.total === "number" ? meta.total : d.total,
    yieldText: meta.yield ?? "4 Servings",
  };
}

const findRecipeById = (id?: string): RecipeFull | undefined => {
  if (!id) return undefined;
  if (RECIPE_LIBRARY[id]) return RECIPE_LIBRARY[id];
  for (const arr of Object.values(PRESET_RECIPES)) {
    const r = arr.find((x) => x.id === id);
    if (r) return r;
  }
  return undefined;
};

export default function ViewRecipe() {
  const params = useLocalSearchParams<{ id?: string; recipe?: string }>();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isFav, setIsFav] = useState<boolean>(false);

  const recipe: RecipeFull | undefined = useMemo(() => {
    if (params.recipe) {
      try {
        const decoded = decodeURIComponent(String(params.recipe));
        const raw = JSON.parse(decoded);

        const normArray = (arr: any[] | undefined) =>
          (arr ?? [])
            .map((x: any) => (typeof x === "string" ? x : x?.text ?? ""))
            .filter(Boolean);

        const r: RecipeFull = {
          id: raw.id ?? String(Date.now()),
          title: raw.title ?? "Untitled",
          description: raw.description ?? "",
          coverUri: raw.coverUri,
          ingredients: normArray(raw.ingredients),
          steps: normArray(raw.steps),
          meta: raw.meta ?? undefined,
          preset: raw.preset ?? undefined,
          applianceSupport: raw.applianceSupport ?? undefined,
        };
        return r;
      } catch {
        // fallback
      }
    }
    return findRecipeById(params.id);
  }, [params.id, params.recipe]);

  const meta = getMeta(recipe);

  useEffect(() => {
    (async () => {
      const favRaw = await AsyncStorage.getItem("chefiq_favorites");
      const favs = favRaw ? (JSON.parse(favRaw) as string[]) : [];
      setFavorites(favs);
      if (recipe?.id) setIsFav(favs.includes(recipe.id));

      if (recipe?.id) {
        const histRaw = await AsyncStorage.getItem("chefiq_history");
        const cur = histRaw ? (JSON.parse(histRaw) as string[]) : [];
        const next = [recipe.id, ...cur.filter((x) => x !== recipe.id)].slice(
          0,
          30
        );
        await AsyncStorage.setItem("chefiq_history", JSON.stringify(next));
      }
    })();
  }, [recipe?.id]);

  if (!recipe) {
    return (
      <SafeAreaView
        style={[styles.screen, { alignItems: "center", justifyContent: "center" }]}
      >
        <Text style={{ color: TEXT, fontSize: 18, marginBottom: 8 }}>
          Recipe not found
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={[styles.button, { paddingHorizontal: 18, paddingVertical: 10 }]}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const localSrc = LOCAL_IMAGES[recipe.id];
  const miniOvenOK = !!recipe.applianceSupport?.minioven?.length;
  const cookerOK = !!recipe.applianceSupport?.cooker?.length;

  const toggleFavorite = async () => {
    if (!recipe?.id) return;
    let next: string[];
    if (isFav) next = favorites.filter((x) => x !== recipe.id);
    else next = [recipe.id, ...favorites.filter((x) => x !== recipe.id)];
    setFavorites(next);
    setIsFav(!isFav);
    await AsyncStorage.setItem("chefiq_favorites", JSON.stringify(next));
  };

  return (
    // ✅ include bottom edge so content can scroll past the tab bar safely
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <ScrollView
        style={{ flex: 1 }}
        // ✅ remove flexGrow and give generous bottom padding to ensure scroll
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        // ✅ make scrolling/bounce reliable across iOS/Android
        bounces
        alwaysBounceVertical
        overScrollMode="always"
      >
        {/* Cover with heart */}
        <View>
          <FallbackImage
            source={localSrc ?? (recipe.coverUri ? { uri: recipe.coverUri } : undefined)}
            fallback={require("../assets/placeholder-recipe.jpg")}
            style={styles.hero}
            resizeMode="cover"
          />
          <Pressable style={styles.heart} onPress={toggleFavorite}>
            <Ionicons
              name={isFav ? "heart" : "heart-outline"}
              size={22}
              color={isFav ? ACCENT : "#fff"}
            />
          </Pressable>
        </View>

        {/* Title */}
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <Text style={styles.title}>{recipe.title}</Text>
          {!!recipe.description && (
            <Text style={styles.description}>{recipe.description}</Text>
          )}
        </View>

        {/* Meta grid */}
        <View style={styles.specRow}>
          <View style={styles.specCard}>
            <Text style={styles.specLabel}>DIFFICULTY</Text>
            <Text style={styles.specValue}>{meta.difficulty}</Text>
          </View>
          <View style={styles.specCard}>
            <Text style={styles.specLabel}>ACTIVE TIME</Text>
            <Text style={styles.specValue}>{meta.active} Min</Text>
          </View>
          <View style={styles.specCard}>
            <Text style={styles.specLabel}>TOTAL TIME</Text>
            <Text style={styles.specValue}>{meta.total} Min</Text>
          </View>
          <View style={styles.specCard}>
            <Text style={styles.specLabel}>YIELD</Text>
            <Text style={styles.specValue}>{meta.yieldText}</Text>
          </View>
        </View>

        {/* Availability */}
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          {!miniOvenOK && (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>
                Not available for iQ Mini Oven
              </Text>
            </View>
          )}
          {!cookerOK && (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>
                Not available for iQ Cooker
              </Text>
            </View>
          )}
        </View>

        {/* Ingredients */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ingredients</Text>
          {(recipe.ingredients ?? []).map((it, idx) => (
            <Text key={idx} style={styles.li}>
              • {it}
            </Text>
          ))}
        </View>

        {/* Steps */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Steps (overview)</Text>
          {(recipe.steps ?? []).map((s, i) => (
            <Text key={i} style={styles.li}>
              {i + 1}. {s}
            </Text>
          ))}
        </View>

        {/* Guided button */}
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <Pressable
            onPress={() => {
              if (!miniOvenOK && !cookerOK) {
                Alert.alert(
                  "Heads up",
                  "This recipe doesn't list supported appliances yet."
                );
              }
              router.push({ pathname: "/guided", params: { id: recipe.id } });
            }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Start Guided Cooking</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: SURFACE },
  hero: { width: "100%", height: 260, backgroundColor: CARD },
  heart: {
    position: "absolute",
    right: 14,
    bottom: 14,
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: 10,
    borderRadius: 999,
    borderColor: BORDER,
    borderWidth: 1,
  },
  title: { color: TEXT, fontSize: 24, fontWeight: "700", marginBottom: 6 },
  description: { color: MUTED, fontSize: 14 },

  specRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 14,
    flexWrap: "wrap",
  },
  specCard: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderWidth: 1,
    borderRadius: RADIUS,
    paddingVertical: 16,
    paddingHorizontal: 14,
    width: "48%",
  },
  specLabel: {
    color: MUTED,
    fontWeight: "700",
    letterSpacing: 1,
    fontSize: 12,
    marginBottom: 6,
  },
  specValue: { color: TEXT, fontWeight: "700", fontSize: 18 },

  banner: {
    backgroundColor: "#2A2A2A",
    borderColor: BORDER,
    borderWidth: 1,
    borderRadius: RADIUS,
    padding: 10,
    marginTop: 6,
  },
  bannerText: { color: "#E6E6E6" },

  card: {
    backgroundColor: CARD,
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
  },
  cardTitle: { color: TEXT, fontSize: 16, fontWeight: "600", marginBottom: 8 },
  li: { color: TEXT, opacity: 0.9, marginBottom: 6 },

  button: {
    backgroundColor: ACCENT,
    borderRadius: RADIUS,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  buttonText: { color: "#0A0A0A", fontWeight: "700", fontSize: 16 },
});

<SafeAreaView style={{ flex: 1 }} edges={["top"]}>
  <ScrollView
    style={{ flex: 1 }}
    contentContainerStyle={{ paddingBottom: 28 }}
    showsVerticalScrollIndicator
    keyboardShouldPersistTaps="handled"
  >
    {/* ... */}
  </ScrollView>
</SafeAreaView>
