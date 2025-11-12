// app/view-recipe.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import FallbackImage from "../components/FallbackImage";
import {
  getRecipeCreator,
  isCreatorFavorited,
  toggleFavoriteCreator,
} from "../lib/creators";
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

/* ---------------- Helpers: meta / lookup ---------------- */
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

const findRecipeById = (id?: string): RecipeFull | undefined => {
  if (!id) return undefined;
  if (RECIPE_LIBRARY[id]) return RECIPE_LIBRARY[id];
  for (const arr of Object.values(PRESET_RECIPES)) {
    const r = arr.find((x) => x.id === id);
    if (r) return r;
  }
  return undefined;
};

/* ---------------- Ratings storage ---------------- */
type OneReview = { stars: number; text?: string; ts: number };
type ReviewBundle = { ratings: OneReview[]; avg: number; count: number };

const REVIEWS_KEY = "chefiq_reviews_v1";
async function readAllReviews(): Promise<Record<string, ReviewBundle>> {
  const raw = await AsyncStorage.getItem(REVIEWS_KEY);
  return raw ? JSON.parse(raw) : {};
}
async function saveAllReviews(obj: Record<string, ReviewBundle>) {
  await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(obj));
}
function computeAvg(list: OneReview[]) {
  if (!list.length) return 0;
  const sum = list.reduce((a, b) => a + b.stars, 0);
  return Math.round((sum / list.length) * 10) / 10;
}

// Use yellow to match preset cards
const STAR = "#FFD54A";
function renderStarsInline(avg: number) {
  const full = Math.floor(avg);
  const half = avg - full >= 0.25 && avg - full < 0.75;
  const out: JSX.Element[] = [];
  for (let i = 0; i < full; i++) out.push(<Ionicons key={`s${i}`} name="star" size={14} color={STAR} />);
  if (half) out.push(<Ionicons key="half" name="star-half" size={14} color={STAR} />);
  const remain = 5 - full - (half ? 1 : 0);
  for (let i = 0; i < remain; i++) out.push(<Ionicons key={`o${i}`} name="star-outline" size={14} color={STAR} />);
  return out;
}

/* ---------------- Component ---------------- */
export default function ViewRecipe() {
  const params = useLocalSearchParams<{ id?: string; recipe?: string }>();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isFav, setIsFav] = useState<boolean>(false);

  // creator follow
  const [creator, setCreator] = useState<string>("");
  const [creatorFaved, setCreatorFaved] = useState<boolean>(false);

  // reviews
  const [bundle, setBundle] = useState<ReviewBundle>({ ratings: [], avg: 0, count: 0 });
  const [myStars, setMyStars] = useState<number>(0);
  const [myText, setMyText] = useState<string>("");
  const charLimit = 150;

  // Build recipe either from id, or from encoded JSON passed in the route
  const recipe: RecipeFull | undefined = useMemo(() => {
    if (params.recipe) {
      try {
        const decoded = decodeURIComponent(String(params.recipe));
        const raw = JSON.parse(decoded);
        const normArray = (arr: any[] | undefined) =>
          (arr ?? []).map((x: any) => (typeof x === "string" ? x : x?.text ?? "")).filter(Boolean);
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
        // fall back
      }
    }
    return findRecipeById(params.id);
  }, [params.id, params.recipe]);

  const meta = getMeta(recipe);

  // Load favorites + history + creator + reviews
  useEffect(() => {
    (async () => {
      const favRaw = await AsyncStorage.getItem("chefiq_favorites");
      const favs = favRaw ? (JSON.parse(favRaw) as string[]) : [];
      setFavorites(favs);
      if (recipe?.id) setIsFav(favs.includes(recipe.id));

      if (recipe?.id) {
        const histRaw = await AsyncStorage.getItem("chefiq_history");
        const cur = histRaw ? (JSON.parse(histRaw) as string[]) : [];
        const next = [recipe.id, ...cur.filter((x) => x !== recipe.id)].slice(0, 30);
        await AsyncStorage.setItem("chefiq_history", JSON.stringify(next));
      }

      // creator
      if (recipe) {
        const u = getRecipeCreator(recipe);
        setCreator(u);
        try {
          setCreatorFaved(await isCreatorFavorited(u));
        } catch {
          setCreatorFaved(false);
        }
      }

      // reviews
      if (recipe?.id) {
        const all = await readAllReviews();
        const mine = all[recipe.id] ?? { ratings: [], avg: 0, count: 0 };
        // seed with a sample average 4.0–5.0 if none yet (kept as 5,4,4 → 4.3)
        if (!mine.count && (recipe as any)?.preset) {
          const seed: OneReview[] = [
            { stars: 5, ts: Date.now() - 86400000 },
            { stars: 4, ts: Date.now() - 43200000 },
            { stars: 4, ts: Date.now() - 21600000 },
          ];
          const seeded = { ratings: seed, avg: computeAvg(seed), count: seed.length };
          all[recipe.id] = seeded;
          await saveAllReviews(all);
          setBundle(seeded);
        } else {
          setBundle(mine);
        }
      }
    })();
  }, [recipe?.id]);

  if (!recipe) {
    return (
      <SafeAreaView style={[styles.screen, { alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: TEXT, fontSize: 18, marginBottom: 8 }}>Recipe not found</Text>
        <Pressable onPress={() => router.back()} style={[styles.button, { paddingHorizontal: 18, paddingVertical: 10 }]}>
          <Text style={styles.buttonText}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const localSrc = LOCAL_IMAGES[recipe.id];
  const miniOvenOK = !!recipe.applianceSupport?.minioven?.length;
  const cookerOK = !!recipe.applianceSupport?.cooker?.length;

  const toggleFavoriteRecipe = async () => {
    if (!recipe?.id) return;
    let next: string[];
    if (isFav) next = favorites.filter((x) => x !== recipe.id);
    else next = [recipe.id, ...favorites.filter((x) => x !== recipe.id)];
    setFavorites(next);
    setIsFav(!isFav);
    await AsyncStorage.setItem("chefiq_favorites", JSON.stringify(next));
  };

  // FIX: toggleFavoriteCreator returns a boolean (now-favorited)
  const toggleCreatorFollow = async () => {
    if (!creator) return;
    try {
      const nowFav = await toggleFavoriteCreator(creator);
      setCreatorFaved(nowFav);
    } catch {
      // no-op
    }
  };

  const submitReview = useCallback(async () => {
    if (!recipe?.id) return;
    if (myStars < 1) {
      Alert.alert("Pick a rating", "Please choose 1 to 5 stars.");
      return;
    }
    const all = await readAllReviews();
    const cur: ReviewBundle = all[recipe.id] ?? { ratings: [], avg: 0, count: 0 };
    const newEntry: OneReview = { stars: myStars, text: myText.trim() || undefined, ts: Date.now() };
    const updatedList = [newEntry, ...cur.ratings].slice(0, 50);
    const updated: ReviewBundle = { ratings: updatedList, avg: computeAvg(updatedList), count: updatedList.length };
    all[recipe.id] = updated;
    await saveAllReviews(all);
    setBundle(updated);
    setMyStars(0);
    setMyText("");
    Alert.alert("Thanks!", "Your review has been recorded.");
  }, [recipe?.id, myStars, myText]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        {/* Cover with hearts */}
        <View>
          <FallbackImage
            source={localSrc ?? (recipe.coverUri ? { uri: recipe.coverUri } : undefined)}
            fallback={require("../assets/placeholder-recipe.jpg")}
            style={styles.hero}
            resizeMode="cover"
          />
          {/* Recipe heart */}
          <Pressable style={styles.heart} onPress={toggleFavoriteRecipe}>
            <Ionicons name={isFav ? "heart" : "heart-outline"} size={22} color={isFav ? ACCENT : "#fff"} />
          </Pressable>
        </View>

        {/* Title + Creator row */}
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <Text style={styles.title}>{recipe.title}</Text>
          {!!recipe.description && <Text style={styles.description}>{recipe.description}</Text>}
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: MUTED }}>by @{creator}</Text>
            <Pressable
              onPress={toggleCreatorFollow}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: "rgba(0,0,0,0.45)",
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: BORDER,
              }}
            >
              <Ionicons
                name={creatorFaved ? "heart" : "heart-outline"}
                size={18}
                color={creatorFaved ? ACCENT : "#fff"}
              />
              <Text style={{ color: "#fff", fontWeight: "700" }}>
                {creatorFaved ? "Following" : "Follow Chef"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 4-spec grid */}
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

        {/* Availability banners */}
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          {!miniOvenOK && (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>Not available for iQ Mini Oven</Text>
            </View>
          )}
          {!cookerOK && (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>Not available for iQ Cooker</Text>
            </View>
          )}
        </View>

        {/* Ratings summary */}
        <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
          <View
            style={{
              backgroundColor: CARD,
              borderColor: BORDER,
              borderWidth: 1,
              borderRadius: RADIUS,
              paddingVertical: 10,
              paddingHorizontal: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ flexDirection: "row", gap: 2 }}>{renderStarsInline(bundle.avg)}</View>
              <Text style={{ color: TEXT, fontWeight: "700" }}>{bundle.avg ? bundle.avg.toFixed(1) : "—"}</Text>
              <Text style={{ color: MUTED }}>({bundle.count})</Text>
            </View>
            <Pressable onPress={() => { /* could scroll to form */ }}>
              <Text style={{ color: ACCENT, fontWeight: "800" }}>Leave a review</Text>
            </Pressable>
          </View>
        </View>

        {/* Ingredients */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ingredients</Text>
          {(recipe.ingredients ?? []).map((it, idx) => (
            <Text key={idx} style={styles.li}>• {it}</Text>
          ))}
        </View>

        {/* Steps (overview) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Steps (overview)</Text>
          {(recipe.steps ?? []).map((s, i) => (
            <Text key={i} style={styles.li}>{i + 1}. {s}</Text>
          ))}
        </View>

        {/* Guided button */}
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <Pressable
            onPress={() => {
              if (!miniOvenOK && !cookerOK) {
                Alert.alert("Heads up", "This recipe doesn't list supported appliances yet.");
              }
              router.push({ pathname: "/guided", params: { id: recipe.id } });
            }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Start Guided Cooking</Text>
          </Pressable>
        </View>

        {/* Review form */}
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.cardTitle}>Rate & Review</Text>

          {/* Star picker */}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8, marginBottom: 8 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setMyStars(n)}>
                <Ionicons
                  name={myStars >= n ? "star" : "star-outline"}
                  size={24}
                  color={myStars >= n ? ACCENT : MUTED}
                />
              </Pressable>
            ))}
          </View>

          {/* Text input */}
          <TextInput
            value={myText}
            onChangeText={(t) => {
              if (t.length <= charLimit) setMyText(t);
            }}
            placeholder="How did it turn out? Any tips for others?"
            placeholderTextColor={MUTED}
            style={{
              color: TEXT,
              backgroundColor: "#1B1B1B",
              borderColor: BORDER,
              borderWidth: 1,
              borderRadius: 12,
              padding: 10,
              minHeight: 80,
              textAlignVertical: "top",
            }}
            multiline
          />
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
            <Text style={{ color: MUTED }}>{charLimit - myText.length} chars left</Text>
            <Pressable
              onPress={submitReview}
              style={{
                backgroundColor: ACCENT,
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: "#111", fontWeight: "800" }}>Submit</Text>
            </Pressable>
          </View>
        </View>

        {/* Recent reviews */}
        {bundle.count > 0 && (
          <View style={[styles.card, { marginTop: 12 }]}>
            <Text style={styles.cardTitle}>Recent Reviews</Text>
            {bundle.ratings.slice(0, 5).map((r, i) => (
              <View
                key={i}
                style={{
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: BORDER,
                  paddingTop: i === 0 ? 0 : 10,
                  marginTop: i === 0 ? 0 : 10,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <View style={{ flexDirection: "row", gap: 2 }}>{renderStarsInline(r.stars)}</View>
                  <Text style={{ color: MUTED, fontSize: 12 }}>
                    {new Date(r.ts).toLocaleDateString()}
                  </Text>
                </View>
                {!!r.text && <Text style={{ color: TEXT }}>{r.text}</Text>}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------- Styles ---------------- */
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

  /* 4-spec grid */
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
  specLabel: { color: MUTED, fontWeight: "700", letterSpacing: 1, fontSize: 12, marginBottom: 6 },
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
