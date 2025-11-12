// lib/user-recipes.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RecipeFull } from "./recipes";

const USER_RECIPES_KEY = "chefiq_user_recipes_v1";
const SEED_FLAG = "chefiq_seed_sample_creators_v1";

export type UserRecipe = RecipeFull & {
  creatorHandle?: string; // e.g., "@pizza_poppy"
  createdAt?: number;
  avgRating?: number;
  ratingsCount?: number;
};

export async function upsertUserRecipe(r: UserRecipe) {
  const raw = await AsyncStorage.getItem(USER_RECIPES_KEY);
  const list: UserRecipe[] = raw ? JSON.parse(raw) : [];
  const idx = list.findIndex((x) => x.id === r.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...r };
  else list.unshift(r);
  await AsyncStorage.setItem(USER_RECIPES_KEY, JSON.stringify(list));
}

export async function getUserRecipesByCreator(handle: string): Promise<UserRecipe[]> {
  const raw = await AsyncStorage.getItem(USER_RECIPES_KEY);
  const list: UserRecipe[] = raw ? JSON.parse(raw) : [];
  return list.filter((r) => (r.creatorHandle || "").toLowerCase() === handle.toLowerCase());
}

export async function ensureSampleCreatorsSeeded() {
  const seeded = await AsyncStorage.getItem(SEED_FLAG);
  if (seeded) return;

  // Seed 1: Vegan Mediterranean Pizza — @pizza_poppy
  await upsertUserRecipe({
    id: "ux_pizza_veg_med",
    title: "Vegan Mediterranean Pizza",
    description: "Crispy crust with hummus base, olives, tomatoes, and arugula.",
    coverUri: undefined, // user can add later
    ingredients: [
      "1 pizza dough (12-inch)",
      "1/2 cup hummus",
      "1/3 cup kalamata olives, sliced",
      "1/2 cup cherry tomatoes, halved",
      "1/4 red onion, thinly sliced",
      "Arugula, handful",
      "Olive oil, salt, pepper",
    ],
    steps: [
      "Preheat Mini Oven to 475°F with stone/steel if available.",
      "Stretch dough, spread hummus thinly.",
      "Top with olives, tomatoes, red onion; drizzle olive oil.",
      "Bake 8–12 min until edges are blistered.",
      "Top with arugula, season, slice and serve.",
    ],
    preset: "vegetarian",
    applianceSupport: { minioven: ["Bake"], cooker: [] },
    meta: { total: 18, active: 10, difficulty: "Easy", yield: "2–3 Servings" },
    createdAt: Date.now(),
    avgRating: 4.6,
    ratingsCount: 24,
    creatorHandle: "@pizza_poppy",
  });

  // Seed 2: Smoky Maple Wings — @grillmaster_g
  await upsertUserRecipe({
    id: "ux_wings_maple_smoke",
    title: "Smoky Maple Wings",
    description: "Sweet heat with a crispy finish—perfect game-day snack.",
    coverUri: undefined,
    ingredients: [
      "2 lb chicken wings",
      "2 tbsp maple syrup",
      "1 tbsp smoked paprika",
      "1 tsp garlic powder",
      "1 tsp salt",
      "Black pepper",
    ],
    steps: [
      "Pat wings dry; toss with spices and salt.",
      "Air Fry 390°F for 18–22 min, turning once.",
      "Toss with warm maple syrup; air fry 2 more min.",
    ],
    preset: "poultry",
    applianceSupport: { minioven: ["Air Fry"], cooker: [] },
    meta: { total: 28, active: 10, difficulty: "Easy", yield: "4 Servings" },
    createdAt: Date.now(),
    avgRating: 4.7,
    ratingsCount: 31,
    creatorHandle: "@grillmaster_g",
  });

  await AsyncStorage.setItem(SEED_FLAG, "1");
}
