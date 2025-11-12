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
import { getRecipeCreator } from "../../lib/creators";
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

// creators storage key (inline to avoid extra import)
const FAV_CREATOR_KEY = "chefiq_favorite_creators";
const DEFAULT_CREATORS = [
  "@grill_guru",
  "@pizza_poppy",
  "@sous_sammy",
  "@veggie_vibes",
  "@sweet_tooth_sara",
  "@midnight_snacker",
];

const POINTS_KEY = "chefiq_creator_points"; // from create.tsx (25 pts per publish)
const RECIPES_PER_ENTRY = 5; // 5 recipes → 1 raffle entry

const CARD_WIDTH = Dimensions.get("window").width - 32;

// ---------- types / keys ----------
type InProgress = {
  id: string;
  stepIndex?: number;
  appliance?: string;
  mode?: string;
  updatedAt: number;
};

const KEY_NAME = "chefiq_user_name";
const KEY_FAVS = "chefiq_favorites";
const KEY_HIST = "chefiq_history";
const KEY_INPROGRESS = "chefiq_inprogress";

// ratings storage
type OneReview = { stars: number; text?: string; ts: number };
type ReviewBundle = { ratings: OneReview[]; avg: number; count: number };
const REVIEWS_KEY = "chefiq_reviews_v1";

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

// for inline rating (My Chef Rating row)
function renderStarsInline(avg: number) {
  const full = Math.floor(avg);
  const half = avg - full >= 0.25 && avg - full < 0.75;
  const out: JSX.Element[] = [];
  for (let i = 0; i < full; i++) out.push(<Ionicons key={`s${i}`} name="star" size={16} color={STAR} />);
  if (half) out.push(<Ionicons key="half" name="star-half" size={16} color={STAR} />);
  const remain = 5 - full - (half ? 1 : 0);
  for (let i = 0; i < remain; i++) out.push(<Ionicons key={`o${i}`} name="star-outline" size={16} color={STAR} />);
  return out;
}

// deterministic seeded rating 4.0–5.0 if no stored rating exists
function seededAvgForId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const r01 = (h % 1000) / 1000; // 0..1
  return parseFloat((4.0 + r01 * 1.0).toFixed(1)); // 4.0..5.0
}

export default function Home() {
  const [name, setName] = useState<string>("Chef");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [inProgress, setInProgress] = useState<InProgress | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [favoriteCreators, setFavoriteCreators] = useState<string[]>([]);

  // incentive / progress
  const [creatorPoints, setCreatorPoints] = useState<number>(0);
  const recipesThisPeriod = Math.floor((creatorPoints || 0) / 25); // 25 pts / publish

  // Fake "My Chef Rating" (demo)
  const myChefAvg = 4.6;
  const myChefCount = 37;

  // load persisted data
  useEffect(() => {
    (async () => {
      const n = await AsyncStorage.getItem(KEY_NAME);
      if (n) setName(n || "Chef");

      const favRaw = await AsyncStorage.getItem(KEY_FAVS);
      setFavorites(favRaw ? (JSON.parse(favRaw) as string[]) : []);

      const histRaw = await AsyncStorage.getItem(KEY_HIST);
      setHistory(histRaw ? (JSON.parse(histRaw) as string[]) : []);

      const ipRaw = await AsyncStorage.getItem(KEY_INPROGRESS);
      setInProgress(ipRaw ? (JSON.parse(ipRaw) as InProgress) : null);

      // ratings 4.0–5.0
      const revRaw = await AsyncStorage.getItem(REVIEWS_KEY);
      const bundle = revRaw ? (JSON.parse(revRaw) as Record<string, ReviewBundle>) : {};
      const avgMap: Record<string, number> = {};
      const baseIds = ["1", "2", "3", "4", ...Object.keys(RECIPE_LIBRARY)];
      baseIds.forEach((id) => {
        const storedAvg = bundle[id]?.avg;
        const seeded = seededAvgForId(id);
        const val = storedAvg != null ? Math.max(4, storedAvg) : seeded;
        avgMap[id] = parseFloat(val.toFixed(1));
      });
      setRatings(avgMap);

      // favorite creators seed / cleanup
      const favCreatorsRaw = await AsyncStorage.getItem(FAV_CREATOR_KEY);
      const loaded = favCreatorsRaw ? (JSON.parse(favCreatorsRaw) as string[]) : [];
      const hasBad =
        loaded.some((h) => /tomato.?mane/i.test(h)) ||
        loaded.some((h) => /fudge.?grey/i.test(h));
      if (!loaded.length || hasBad) {
        setFavoriteCreators(DEFAULT_CREATORS);
        await AsyncStorage.setItem(FAV_CREATOR_KEY, JSON.stringify(DEFAULT_CREATORS));
      } else {
        const normalized = loaded.map((h) => (h.startsWith("@") ? h : `@${h}`));
        setFavoriteCreators(normalized);
        await AsyncStorage.setItem(FAV_CREATOR_KEY, JSON.stringify(normalized));
      }

      // load creator points (25 per publish)
      const ptsRaw = await AsyncStorage.getItem(POINTS_KEY);
      const pts = ptsRaw ? Number(ptsRaw) || 0 : 0;
      setCreatorPoints(pts);
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

  const getAvg = (id?: string) => (id && ratings[id] ? ratings[id] : (id ? seededAvgForId(id) : 0));

  const RecipeCard = ({ item }: { item: RecipeFull }) => {
    const meta = getMeta(item);
    return (
      <Pressable
        onPress={() => router.push({ pathname: "/view-recipe", params: { id: item.id } })}
        style={[styles.card, { width: CARD_WIDTH * 0.8 }]}
      >
        <View style={{ position: "relative" }}>
          <FallbackImage
            source={LOCAL_IMAGES[item.id] ?? { uri: item.coverUri }}
            fallback={require("../../assets/placeholder-recipe.jpg")}
            style={{ width: "100%", height: 140 }}
          />
          {/* cook time bottom-left */}
          <View style={styles.pillWrapLeft}>
            <TimePill minutes={meta.total} />
          </View>
          {/* rating bottom-right with number */}
          <View style={styles.ratingBadge}>
            <View style={{ flexDirection: "row", gap: 1 }}>{renderStarsTiny(getAvg(item.id))}</View>
            <Text style={styles.ratingText}>{getAvg(item.id).toFixed(1)}</Text>
          </View>
        </View>
        <View style={{ padding: 12 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description}
          </Text>
          {/* creator handle */}
          <Text style={{ color: MUTED, fontSize: 12, marginTop: 6 }}>by @{getRecipeCreator(item)}</Text>
        </View>
      </Pressable>
    );
  };

  const FeaturedCard = ({ item }: { item: RecipeFull }) => {
    const meta = getMeta(item);
    return (
      <Pressable
        onPress={() => router.push({ pathname: "/view-recipe", params: { id: item.id } })}
        style={styles.card}
      >
        <View style={{ position: "relative" }}>
          <FallbackImage
            source={LOCAL_IMAGES[item.id] ?? { uri: item.coverUri }}
            fallback={require("../../assets/placeholder-recipe.jpg")}
            style={{ width: "100%", height: 200 }}
          />
          {/* cook time bottom-left */}
          <View style={styles.pillWrapLeft}>
            <TimePill minutes={meta.total} />
          </View>
          {/* rating bottom-right with number */}
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
  };

  const onPressCreator = (handle: string) => {
    const clean = handle.replace("@", "");
    router.push({
      pathname: "/creator",
      params: { handle: clean },
    });
  };

  // --- Incentive UI helpers
  const entriesSoFar = Math.floor(recipesThisPeriod / RECIPES_PER_ENTRY); // full entries
  const recipesTowardsNext = recipesThisPeriod % RECIPES_PER_ENTRY;
  const remaining = Math.max(0, RECIPES_PER_ENTRY - recipesTowardsNext);

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
        <Text style={styles.hi}>Hi, {name || "Chef"}</Text>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={MUTED} />
          <TextInput
            placeholder="What do you want to cook?"
            placeholderTextColor={MUTED}
            style={styles.searchInput}
          />
        </View>

        {/* ===== CREATOR INCENTIVE (above Continue Saved Recipe) ===== */}
        <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
          <View style={styles.incentiveCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Ionicons name="trophy-outline" size={18} color={ACCENT} />
              <Text style={{ color: TEXT, fontWeight: "800" }}>Create & Win</Text>
            </View>
            <Text style={{ color: TEXT }}>
              This month’s prize: <Text style={{ fontWeight: "800" }}>$100 Amazon Gift Card</Text>.
              Publish <Text style={{ fontWeight: "800" }}>5 recipes</Text> to be entered in the raffle.
            </Text>

            {/* Progress strip */}
            <View style={{ marginTop: 10 }}>
              <Text style={{ color: MUTED, marginBottom: 6 }}>
                Your progress: {recipesTowardsNext}/{RECIPES_PER_ENTRY} recipes • Entries: {entriesSoFar}
              </Text>
              <View style={styles.progressOuter}>
                <View
                  style={[
                    styles.progressInner,
                    { width: `${(recipesTowardsNext / RECIPES_PER_ENTRY) * 100}%` },
                  ]}
                />
              </View>
              <Text style={{ color: MUTED, marginTop: 6 }}>
                {remaining > 0 ? `${remaining} more for the next entry` : "You’ve earned an entry!"}
              </Text>
            </View>

            {/* CTA row */}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <Pressable
                onPress={() => router.push("/(tabs)/create")}
                style={[styles.ctaBtn, { backgroundColor: ACCENT }]}
              >
                <Ionicons name="add-circle" size={16} color="#111" />
                <Text style={{ color: "#111", fontWeight: "800" }}>Create Recipe</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  // lightweight "rules" info — can navigate to a static page later
                  alert("Rules: Publish 5 recipes this month to earn 1 raffle entry. Winner notified in-app.");
                }}
                style={[styles.ctaBtn, { backgroundColor: "#1f1f1f", borderWidth: 1, borderColor: BORDER }]}
              >
                <Ionicons name="information-circle-outline" size={16} color="#EDEDED" />
                <Text style={{ color: "#EDEDED", fontWeight: "700" }}>Rules</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* ===== My Chef Rating (under incentive) ===== */}
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <View style={styles.ratingRowCard}>
            <Text style={{ color: MUTED, fontWeight: "800", marginBottom: 6 }}>My Chef Rating</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ flexDirection: "row", gap: 2 }}>{renderStarsInline(myChefAvg)}</View>
              <Text style={{ color: TEXT, fontWeight: "800" }}>{myChefAvg.toFixed(1)}</Text>
              <Text style={{ color: MUTED }}>({myChefCount})</Text>
              <View style={{ flex: 1 }} />
              <Pressable onPress={() => router.push("/my-reviews")} style={styles.reviewsLink}>
                <Text style={{ color: ACCENT, fontWeight: "800" }}>Reviews</Text>
                <Ionicons name="chevron-forward" size={16} color={ACCENT} />
              </Pressable>
            </View>
          </View>
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
            {favoriteRecipes.slice(0, 10).map((item) => (
              <RecipeCard key={item.id} item={item} />
            ))}
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
            {historyRecipes.slice(0, 10).map((item) => (
              <RecipeCard key={item.id} item={item} />
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.emptyHint}>Your recent cooks will appear here.</Text>
        )}

        {/* Featured */}
        <Text style={[styles.sectionTitle, { paddingHorizontal: 16, marginTop: 18 }]}>Featured</Text>

        <View style={{ paddingHorizontal: 16, marginTop: 8, gap: 12 }}>
          {featured.map((item) => (
            <FeaturedCard key={item.id} item={item} />
          ))}
        </View>

        {/* Favorite Home Chefs */}
        <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
          <Text style={styles.sectionTitle}>Favorite Home Chefs</Text>
        </View>

        {favoriteCreators.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingVertical: 8 }}
          >
            {favoriteCreators.map((handle) => (
              <Pressable key={handle} onPress={() => onPressCreator(handle)} style={styles.chefCard}>
                <View style={styles.chefAvatar}>
                  <Text style={styles.chefAvatarText}>
                    {handle.replace("@", "").slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <Text numberOfLines={1} style={styles.chefName}>{handle}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.emptyHint}>
            No favorite chefs yet. Heart a creator inside a recipe to follow them.
          </Text>
        )}
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

  // Incentive card
  incentiveCard: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderWidth: 1,
    borderRadius: RADIUS,
    padding: 14,
  },
  progressOuter: {
    height: 8,
    backgroundColor: "#1f1f1f",
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BORDER,
  },
  progressInner: {
    height: 8,
    backgroundColor: ACCENT,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },

  // My Chef Rating row
  ratingRowCard: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderWidth: 1,
    borderRadius: RADIUS,
    padding: 12,
  },
  reviewsLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

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

  // time pill bottom-left
  pillWrapLeft: { position: "absolute", left: 10, bottom: 10 },

  // rating badge bottom-right
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

  /* Favorite Chefs strip */
  chefCard: {
    width: 120,
    alignItems: "center",
    backgroundColor: CARD,
    borderColor: BORDER,
    borderWidth: 1,
    borderRadius: RADIUS,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  chefAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  chefAvatarText: { color: "#EDEDED", fontWeight: "800", fontSize: 16 },
  chefName: { color: TEXT, fontWeight: "600", fontSize: 13, maxWidth: "100%" },
});
