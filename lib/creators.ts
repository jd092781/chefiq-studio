// lib/creators.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RECIPE_LIBRARY, type RecipeFull } from "./recipes";

/** Storage key for the user's favorited creators */
export const CREATOR_FAV_KEY = "chefiq_favorite_creators";

/**
 * Manual recipe-to-creator map for featured or demo recipes.
 * Each ID here is assigned to a specific creator so that creator pages
 * always have content in the app.
 */
const RECIPE_CREATOR_MAP: Record<string, string> = {
  "1": "grill_guru",
  "2": "grill_guru",
  "3": "sweet_tooth_sara",
  "4": "pizza_poppy",
  "5": "veggie_vibes",
  "6": "midnight_snacker",
  "7": "sous_sammy",
};

/**
 * The full set of known demo creators.
 */
const KNOWN_CREATORS = [
  "grill_guru",
  "pizza_poppy",
  "sous_sammy",
  "veggie_vibes",
  "sweet_tooth_sara",
  "midnight_snacker",
];

/** Small deterministic hash to pick a fallback creator */
function hashPick<T>(arr: T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}

/** Return the handle (without '@') that "created" a recipe */
export function getRecipeCreator(
  recipe: Pick<RecipeFull, "id" | "preset"> | { id: string; preset?: string }
): string {
  if (!recipe?.id) return "grill_guru";
  const mapped = RECIPE_CREATOR_MAP[recipe.id];
  if (mapped) return mapped;
  // If not explicitly mapped, pick a stable pseudo-random creator
  return hashPick(KNOWN_CREATORS, recipe.id);
}

/** List all recipes belonging to a creator */
export function listRecipesByCreator(handle: string): RecipeFull[] {
  const clean = (handle || "").replace("@", "");
  const out: RecipeFull[] = [];
  for (const r of Object.values(RECIPE_LIBRARY)) {
    const who = getRecipeCreator(r);
    if (who === clean) out.push(r);
  }
  return out;
}

/** Get all favorite creators (saved by the user) */
export async function getFavoriteCreators(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(CREATOR_FAV_KEY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

/** Check if a creator is favorited */
export async function isCreatorFavorited(handle: string): Promise<boolean> {
  const clean = handle.replace("@", "");
  const list = await getFavoriteCreators();
  return list.some((h) => h.replace("@", "") === clean);
}

/**
 * Toggle a favorite creator. Returns the new boolean (true = now favorited)
 */
export async function toggleFavoriteCreator(handle: string): Promise<boolean> {
  const clean = handle.replace("@", "");
  const display = `@${clean}`;
  const raw = await AsyncStorage.getItem(CREATOR_FAV_KEY);
  const list: string[] = raw ? JSON.parse(raw) : [];
  const idx = list.findIndex((h) => h.replace("@", "") === clean);
  if (idx >= 0) {
    list.splice(idx, 1);
    await AsyncStorage.setItem(CREATOR_FAV_KEY, JSON.stringify(list));
    return false;
  } else {
    list.unshift(display);
    await AsyncStorage.setItem(CREATOR_FAV_KEY, JSON.stringify(list));
    return true;
  }
}

/** Return the default seed list of creators that appear under “Favorite Home Chefs” */
export function getSeedCreators(): string[] {
  return [
    "@grill_guru",
    "@pizza_poppy",
    "@sous_sammy",
    "@veggie_vibes",
    "@sweet_tooth_sara",
    "@midnight_snacker",
  ];
}
