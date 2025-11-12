// lib/recipes.ts
export const ACCENT  = "#4dd08c";
export const SURFACE = "#0F0F0F";
export const CARD    = "#171717";
export const TEXT    = "#FFFFFF";
export const MUTED   = "#9BA3AF";
export const BORDER  = "#262626";
export const RADIUS  = 14;

export const FAVORITES_KEY  = "chefiq_favorites";
export const HISTORY_KEY    = "chefiq_history";
export const INPROGRESS_KEY = "chefiq_inprogress";

export type RecipeLite = { id: string; title: string; image: string };

export type RecipeFull = {
  id: string;
  title: string;
  description: string;
  coverUri: string;       // remote image
  // coverLocal?: number; // moved to app/local-images.ts mapping
  ingredients: string[];
  steps: string[];
  lastUpdated: number;
  applianceSupport?: {
    minioven?: string[];
    cooker?: string[];
  };
};

const id = (slug: string, n: number) => `${slug}-${n}`;
const ing = (...items: string[]) => items;
const stp = (...items: string[]) => items;

export const APPLIANCES = [
  { key: "minioven" as const, label: "iQ Mini Oven", icon: "toaster-oven" },
  { key: "cooker"   as const, label: "iQ Cooker",    icon: "pot-steam-outline" },
];

export const RECIPE_LIBRARY: Record<string, RecipeFull> = {
  "1": {
    id: "1",
    title: "Traditional Smoked Brisket",
    description: "Low-and-slow style brisket with a classic bark.",
    coverUri:
      "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?q=80&w=1200&auto=format&fit=crop",
    ingredients: ing("Brisket", "Salt", "Pepper", "Smoke/wood"),
    steps: stp(
      "Season brisket generously.",
      "Roast/low oven 250–275°F until probe tender (4–8 hr).",
      "Rest 30–60 min; slice against grain."
    ),
    lastUpdated: Date.now(),
    applianceSupport: { minioven: ["Roast", "Reheat"] },
  },
  "2": {
    id: "2",
    title: "Air Fryer Coconut Shrimp",
    description: "Crispy coconut-crusted shrimp (no deep fry).",
    coverUri:
      "https://www.foodandwine.com/thmb/JtxOJ8Omqgbfdd1Iv6Ff0ofh2n4=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/air-fryer-coconut-shrimp-FT-RECIPE1121-23a5029b0ed349ada2b4529b955f57ca.jpg",
    ingredients: ing("Shrimp", "Eggs", "Panko", "Shredded coconut", "Salt"),
    steps: stp(
      "Bread shrimp (flour → egg → panko+coconut).",
      "Air Fry 390°F 6–8 min until golden.",
      "Serve with sweet chili sauce."
    ),
    lastUpdated: Date.now(),
    applianceSupport: { minioven: ["Air Fry"] },
  },
  "3": {
    id: "3",
    title: "Classic Pulled Pork",
    description: "Tender, shreddable pork shoulder with BBQ finish.",
    coverUri:
      "https://images.unsplash.com/photo-1544025164-76bc3997d9ea?q=80&w=1200&auto=format&fit=crop",
    ingredients: ing("Pork shoulder", "Dry rub", "Stock"),
    steps: stp(
      "Rub pork; pressure cook 60–75 min; natural release.",
      "Shred; toss with juices; finish under Broil 2–4 min (optional)."
    ),
    lastUpdated: Date.now(),
    applianceSupport: { cooker: ["Pressure Cook", "Keep Warm"], minioven: ["Broil", "Reheat"] },
  },
  "4": {
    id: "4",
    title: "Vegan Mediterranean Pizza",
    description:
      "Crispy crust topped with tomatoes, olives, artichokes, red onion and a lemon-herb finish.",
    coverUri:
      "https://nutriciously.com/wp-content/uploads/Vegan-Mediterranean-Pizza-16-768x1154.jpg",
    ingredients: ing(
      "Pizza dough","Tomato sauce","Artichokes","Olives","Red onion","Cherry tomatoes","Olive oil","Oregano"
    ),
    steps: stp(
      "Preheat Mini Oven Bake 475–500°F (stone if available).",
      "Stretch dough; top with sauce and vegetables.",
      "Bake 8–12 min until crust is golden; finish with olive oil + oregano."
    ),
    lastUpdated: Date.now(),
    applianceSupport: { minioven: ["Bake", "Roast", "Reheat"] },
  },
};

export const PRESETS = [
  { slug: "poultry",     label: "Poultry",     icon: "egg-outline",           iconLib: "mci" },
  { slug: "meat",        label: "Meat",        icon: "food-steak",            iconLib: "mci" },
  { slug: "seafood",     label: "Seafood",     icon: "fish",                  iconLib: "mci" },
  { slug: "vegetarian",  label: "Vegetarian",  icon: "sprout",                iconLib: "mci" },
  { slug: "pork",        label: "Pork",        icon: "pig-variant-outline",   iconLib: "mci" },
  { slug: "beef",        label: "Beef",        icon: "cow",                   iconLib: "mci" },
  { slug: "grains",      label: "Grains",      icon: "grain",                 iconLib: "mci" },
  { slug: "eggs",        label: "Eggs",        icon: "egg-easter",            iconLib: "mci" },
  { slug: "stews",       label: "Stews",       icon: "pot-mix",               iconLib: "mci" },
  { slug: "pasta",       label: "Pasta",       icon: "noodles",               iconLib: "mci" },
  { slug: "soups",       label: "Soups",       icon: "bowl-mix-outline",      iconLib: "mci" },
  { slug: "fruit",       label: "Fruit",       icon: "fruit-grapes-outline",  iconLib: "mci" },
  { slug: "all",         label: "All",         icon: "view-grid-outline",     iconLib: "mci" },
  { slug: "favorites",   label: "Favorites",   icon: "heart-outline",         iconLib: "ion" },
  { slug: "history",     label: "Cook History",icon: "time-outline",          iconLib: "ion" },
] as const;

export const PRESET_RECIPES: Record<string, RecipeFull[]> = {
  poultry: [
    {
      id: id("poultry", 1),
      title: "Herbed Roast Chicken",
      description: "Crispy-skinned whole chicken with lemon & herbs.",
      coverUri: "https://images.unsplash.com/photo-1604908176997-4316c77b0a2a?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("Whole chicken","Olive oil","Salt","Pepper","Thyme","Lemon"),
      steps: stp("Preheat 400°F.","Rub and roast 55–70 min.","Rest 10 min; carve."),
      lastUpdated: Date.now(),
      applianceSupport: { minioven: ["Roast","Bake"] },
    },
    {
      id: id("poultry", 2),
      title: "Air-Fried Chicken Wings",
      description: "Crispy, juicy wings—no deep fryer.",
      coverUri: "https://images.unsplash.com/photo-1604908554049-698b4dd3b9a7?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("Wings","Baking powder","Seasoning"),
      steps: stp("Air Fry 390°F 22–28 min; flip halfway."),
      lastUpdated: Date.now(),
      applianceSupport: { minioven: ["Air Fry","Bake"] },
    },
    {
      id: id("poultry", 3),
      title: "Instant Chicken Stock",
      description: "Pressure-cooked rich chicken stock.",
      coverUri: "https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("Chicken bones","Veg","Water"),
      steps: stp("Pressure cook 35–45 min; strain."),
      lastUpdated: Date.now(),
      applianceSupport: { cooker: ["Pressure Cook","Keep Warm"] },
    },
  ],

  meat: [
    {
      id: id("meat", 1),
      title: "Juicy Meatloaf",
      description: "Classic meatloaf with ketchup glaze.",
      coverUri: "https://images.unsplash.com/photo-1601050690597-9d9a4b2dc6e8?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("Beef","Breadcrumbs","Egg","Onion"),
      steps: stp("Mix and bake 375°F 1 hr; glaze last 10 min."),
      lastUpdated: Date.now(),
      applianceSupport: { minioven: ["Bake","Roast"] },
    },
    {
      id: id("meat", 2),
      title: "Lamb Chops (Air Fry)",
      description: "Garlic-herb marinated chops.",
      coverUri: "https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("Lamb chops","Garlic","Rosemary"),
      steps: stp("Air Fry 400°F 8–12 min."),
      lastUpdated: Date.now(),
      applianceSupport: { minioven: ["Air Fry","Broil"] },
    },
    {
      id: id("meat", 3),
      title: "Pressure Cooker Pot Roast",
      description: "Fork-tender chuck roast with veggies.",
      coverUri: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("Beef roast","Onion","Carrot","Stock"),
      steps: stp("Pressure Cook 50–65 min; natural release."),
      lastUpdated: Date.now(),
      applianceSupport: { cooker: ["Pressure Cook","Keep Warm"] },
    },
  ],

  seafood: [
    { ...RECIPE_LIBRARY["2"] },
    {
      id: id("seafood", 2),
      title: "Roasted Salmon Fillet",
      description: "Flaky salmon with lemon & dill.",
      coverUri: "https://images.unsplash.com/photo-1519705122083-016e1f1f7f44?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("Salmon","Olive oil","Lemon","Dill"),
      steps: stp("Roast 400°F 10–14 min."),
      lastUpdated: Date.now(),
      applianceSupport: { minioven: ["Roast","Bake"] },
    },
    {
      id: id("seafood", 3),
      title: "Garlic Butter Scallops",
      description: "Seared scallops, fast & luxurious.",
      coverUri: "https://images.unsplash.com/photo-1604908553645-1a9d3bd112fb?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("Scallops","Butter","Garlic"),
      steps: stp("Sear/Sauté 1–2 min per side; butter finish."),
      lastUpdated: Date.now(),
      applianceSupport: { cooker: ["Sear/Sauté"] },
    },
  ],

  vegetarian: [
    { ...RECIPE_LIBRARY["4"] },
    {
      id: id("vegetarian", 2),
      title: "Roasted Veggie Sheet Pan",
      description: "Seasonal vegetables caramelized.",
      coverUri: "https://images.unsplash.com/photo-1604908553487-470cf3fa1909?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("Mixed vegetables","Olive oil","Salt"),
      steps: stp("Roast 425°F 20–25 min."),
      lastUpdated: Date.now(),
      applianceSupport: { minioven: ["Roast","Bake"] },
    },
    {
      id: id("vegetarian", 3),
      title: "Stuffed Bell Peppers",
      description: "Rice, beans & veggies baked in peppers.",
      coverUri: "https://images.unsplash.com/photo-1617093727343-374e0d35d7a1?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("Bell peppers","Rice","Beans","Tomato"),
      steps: stp("Bake 375°F 25–35 min."),
      lastUpdated: Date.now(),
      applianceSupport: { minioven: ["Bake","Roast"] },
    },
  ],

  pork: [
    RECIPE_LIBRARY["3"],
    {
      id: id("pork", 2),
      title: "Crispy Pork Belly Bites",
      description: "Air-fried, shatteringly crisp pork belly cubes.",
      coverUri: "https://images.unsplash.com/photo-1544025164-76bc3997d9ea?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("Pork belly","Salt","Five-spice (opt)"),
      steps: stp("Score & salt; Air Fry 380°F 25–35 min; Broil 1–3 min."),
      lastUpdated: Date.now(),
      applianceSupport: { minioven: ["Air Fry","Broil","Reheat"] },
    },
    {
      id: id("pork", 3),
      title: "Pressure Cooker Carnitas",
      description: "Juicy pork, crisped after pressure cooking.",
      coverUri: "https://images.unsplash.com/photo-1601924579537-370d0b4a5a3e?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("Pork shoulder","Orange","Spices","Onion"),
      steps: stp("Pressure Cook 40–55 min; shred; crisp under Broil 2–4 min."),
      lastUpdated: Date.now(),
      applianceSupport: { cooker: ["Pressure Cook"], minioven: ["Broil","Reheat"] },
    },
  ],

  beef: [
    { ...RECIPE_LIBRARY["1"] },
    {
      id: id("beef", 2),
      title: "Steakhouse Ribeye (Broil)",
      description: "Quick broiled ribeye with garlic butter.",
      coverUri: "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("Ribeye","Salt","Pepper","Butter","Garlic"),
      steps: stp("Broil high 4–6 min/side; rest; butter finish."),
      lastUpdated: Date.now(),
      applianceSupport: { minioven: ["Broil","Air Fry","Reheat"] },
    },
    {
      id: id("beef", 3),
      title: "Beef & Broccoli Stir-Fry",
      description: "Classic takeout at home in minutes.",
      coverUri: "https://images.unsplash.com/photo-1625944529998-6b4b34b60df6?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("Beef slices","Broccoli","Soy sauce","Garlic"),
      steps: stp("Sear/Sauté beef; add broccoli & sauce; toss 3–5 min."),
      lastUpdated: Date.now(),
      applianceSupport: { cooker: ["Sear/Sauté"] },
    },
  ],

  grains: [
    {
      id: id("grains", 1),
      title: "Perfect Quinoa",
      description: "Fluffy, separate grains.",
      coverUri: "https://images.unsplash.com/photo-1625944529998-6b4b34b60df6?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("Quinoa","Water","Salt"),
      steps: stp("Pressure Cook 1 min; natural release 10."),
      lastUpdated: Date.now(),
      applianceSupport: { cooker: ["Pressure Cook","Keep Warm"] },
    },
    {
      id: id("grains", 2),
      title: "Baked Brown Rice",
      description: "Oven-baked, always tender.",
      coverUri: "https://images.unsplash.com/photo-1514511542233-4c2b1b8c78f4?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("Brown rice","Water","Salt","Butter (opt)"),
      steps: stp("Bake 375°F 60–70 min covered; rest 10."),
      lastUpdated: Date.now(),
      applianceSupport: { minioven: ["Bake","Reheat"] },
    },
    {
      id: id("grains", 3),
      title: "Jasmine Rice (PC)",
      description: "Fail-proof, fragrant jasmine.",
      coverUri: "https://images.unsplash.com/photo-1514511542233-4c2b1b8c78f4?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("Jasmine rice","Water","Salt"),
      steps: stp("Pressure Cook 3 min; natural release 10."),
      lastUpdated: Date.now(),
      applianceSupport: { cooker: ["Pressure Cook","Keep Warm"] },
    },
  ],

  eggs: [
    {
      id: id("eggs", 1),
      title: "Egg Bites",
      description: "Copycat sous-vide style, no fuss.",
      coverUri: "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("Eggs","Cheese","Cream","Veg/meat bits"),
      steps: stp("Blend; pour in cups; Air Fry 300°F 12–16 min."),
      lastUpdated: Date.now(),
      applianceSupport: { minioven: ["Air Fry","Bake"] },
    },
    {
      id: id("eggs", 2),
      title: "Soft-Boiled Eggs",
      description: "Jammy yolks every time.",
      coverUri: "https://images.unsplash.com/photo-1528838064739-37f1f0861b36?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("Eggs","Water","Ice"),
      steps: stp("Steam 6–7 min; ice bath 2–3."),
      lastUpdated: Date.now(),
      applianceSupport: { cooker: ["Steam"] },
    },
    {
      id: id("eggs", 3),
      title: "Skillet Frittata",
      description: "Veggie-packed, sliceable brunch.",
      coverUri: "https://images.unsplash.com/photo-1586053226626-1c7b9f6a4f96?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("Eggs","Milk","Veg","Cheese"),
      steps: stp("Sear/Sauté fillings; add eggs; Bake 350°F 12–18 min."),
      lastUpdated: Date.now(),
      applianceSupport: { cooker: ["Sear/Sauté"], minioven: ["Bake"] },
    },
  ],

  stews: [
    {
      id: id("stews", 1),
      title: "Classic Beef Stew",
      description: "Rich gravy, tender beef & veg.",
      coverUri: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("Chuck","Potatoes","Carrots","Stock"),
      steps: stp("Sear; Pressure Cook 25–35 min; natural release."),
      lastUpdated: Date.now(),
      applianceSupport: { cooker: ["Sear/Sauté","Pressure Cook","Keep Warm"] },
    },
    {
      id: id("stews", 2),
      title: "Chicken Chili Verde",
      description: "Bright tomatillo & green chili stew.",
      coverUri: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("Chicken","Tomatillos","Chiles","Onion"),
      steps: stp("Sauté; Pressure Cook 12–15 min; shred."),
      lastUpdated: Date.now(),
      applianceSupport: { cooker: ["Sear/Sauté","Pressure Cook"] },
    },
    {
      id: id("stews", 3),
      title: "Vegan Lentil Stew",
      description: "Hearty, smoky, plant-based.",
      coverUri: "https://images.unsplash.com/photo-1523986371872-9d3ba2e2a389?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("Lentils","Tomatoes","Veg stock","Smoked paprika"),
      steps: stp("Sauté aromatics; Pressure Cook 8–12 min."),
      lastUpdated: Date.now(),
      applianceSupport: { cooker: ["Sear/Sauté","Pressure Cook"], minioven: ["Reheat"] },
    },
  ],

  pasta: [
    {
      id: id("pasta", 1),
      title: "Baked Ziti",
      description: "Cheesy, bubbly comfort.",
      coverUri: "https://images.unsplash.com/photo-1603133872878-684f208fb86a?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("Ziti","Marinara","Ricotta","Mozzarella"),
      steps: stp("Assemble; Bake 375°F 20–30 min; broil to brown."),
      lastUpdated: Date.now(),
      applianceSupport: { minioven: ["Bake","Broil","Reheat"] },
    },
    {
      id: id("pasta", 2),
      title: "PC Mac & Cheese",
      description: "Ultra-creamy, 1-pot.",
      coverUri: "https://images.unsplash.com/photo-1546549039-4d9fe3d1c87c?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("Pasta","Water","Evap milk","Cheese"),
      steps: stp("Pressure Cook 4–5 min; stir in dairy & cheese."),
      lastUpdated: Date.now(),
      applianceSupport: { cooker: ["Pressure Cook","Keep Warm"] },
    },
    {
      id: id("pasta", 3),
      title: "Sheet-Pan Lasagna",
      description: "Fast, crispy-edged lasagna.",
      coverUri: "https://images.unsplash.com/photo-1603133872878-684f208fb86a?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("No-boil sheets","Sauce","Cheese"),
      steps: stp("Layer thin; Bake 400°F 20–25 min; broil edges."),
      lastUpdated: Date.now(),
      applianceSupport: { minioven: ["Bake","Broil"] },
    },
  ],

  soups: [
    {
      id: id("soups", 1),
      title: "Tomato Basil Soup",
      description: "Silky, bright tomato soup.",
      coverUri: "https://images.unsplash.com/photo-1546549039-4d9fe3d1c87c?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("Tomatoes","Onion","Garlic","Basil","Stock"),
      steps: stp("Sauté; Pressure Cook 5–8 min; blend."),
      lastUpdated: Date.now(),
      applianceSupport: { cooker: ["Sear/Sauté","Pressure Cook","Keep Warm"] },
    },
    {
      id: id("soups", 2),
      title: "Chicken Noodle Soup",
      description: "Comfort in a bowl.",
      coverUri: "https://images.unsplash.com/photo-1523986371872-9d3ba2e2a389?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("Chicken","Noodles","Veg","Stock"),
      steps: stp("Pressure Cook 8–12 min; add noodles; simmer."),
      lastUpdated: Date.now(),
      applianceSupport: { cooker: ["Pressure Cook","Keep Warm"] },
    },
    {
      id: id("soups", 3),
      title: "Butternut Squash Soup",
      description: "Sweet, creamy, fall favorite.",
      coverUri: "https://images.unsplash.com/photo-1523986371872-9d3ba2e2a389?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("Butternut","Onion","Stock","Cream (opt)"),
      steps: stp("Pressure Cook 8–10 min; blend smooth."),
      lastUpdated: Date.now(),
      applianceSupport: { cooker: ["Pressure Cook","Keep Warm"] },
    },
  ],

  fruit: [
    {
      id: id("fruit", 1),
      title: "Air-Fried Cinnamon Apples",
      description: "Warm, tender, lightly crisped.",
      coverUri: "https://images.unsplash.com/photo-1505575967455-40e256f73376?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("Apples","Cinnamon","Brown sugar","Butter"),
      steps: stp("Toss; Air Fry 370°F 10–14 min; shake once."),
      lastUpdated: Date.now(),
      applianceSupport: { minioven: ["Air Fry","Bake"] },
    },
    {
      id: id("fruit", 2),
      title: "Roasted Grapes & Yogurt",
      description: "Juicy, jammy grapes over cool yogurt.",
      coverUri: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("Grapes","Olive oil","Honey","Yogurt"),
      steps: stp("Roast 400°F 8–12 min; spoon over yogurt."),
      lastUpdated: Date.now(),
      applianceSupport: { minioven: ["Roast"] },
    },
    {
      id: id("fruit", 3),
      title: "Spiced Poached Pears",
      description: "Fragrant and tender.",
      coverUri: "https://images.unsplash.com/photo-1514511542233-4c2b1b8c78f4?q=80&w=1200&auto=format&fit=crop",
      ingredients: ing("Pears","Water","Sugar","Cinnamon","Vanilla"),
      steps: stp("Slow Cook 1.5–2 hr until tender."),
      lastUpdated: Date.now(),
      applianceSupport: { cooker: ["Slow Cook","Keep Warm"] },
    },
  ],
};


// ---------- Recipe meta (time, difficulty, yield) ----------
export type RecipeMeta = {
  difficulty?: "Easy" | "Medium" | "Hard";
  active?: number; // minutes of hands-on time
  total?: number;  // minutes wall-clock time
  yield?: string;  // e.g., "4 Servings", "8 Slices", "6 cups"
};

/**
 * Accurate meta for the recipes currently in your library.
 * Keys match your recipe IDs (featured "1".."4") and your preset IDs
 * like "poultry-1", "beef-2", "vegetarian-3", etc.
 */
export const META_BY_ID: Record<string, RecipeMeta> = {
  // ---- Featured (ids "1".."4") ----
  "1": { difficulty: "Medium", active: 15, total: 35, yield: "2 Servings" },           // Steakhouse Ribeye
  "2": { difficulty: "Easy",   active: 15, total: 25, yield: "4 Servings" },           // Coconut Shrimp (AF)
  "3": { difficulty: "Medium", active: 20, total: 240, yield: "8 Servings" },          // Classic Pulled Pork
  "4": { difficulty: "Easy",   active: 20, total: 30,  yield: "8 Slices" },            // Vegan Mediterranean Pizza

  // ---- Poultry ----
  "poultry-1": { difficulty: "Medium", active: 25, total: 70,  yield: "4 Servings" },  // Herbed Roast Chicken
  "poultry-2": { difficulty: "Easy",   active: 15, total: 35,  yield: "4 Servings" },  // Air-Fried Chicken Wings
  "poultry-3": { difficulty: "Easy",   active: 15, total: 120, yield: "8 cups" },      // Instant Chicken Stock

  // ---- Seafood ----
  "seafood-1": { difficulty: "Easy",   active: 15, total: 25, yield: "4 Servings" },   // Coconut Shrimp
  "seafood-2": { difficulty: "Easy",   active: 10, total: 20, yield: "4 Servings" },   // Roasted Salmon Fillet
  "seafood-3": { difficulty: "Medium", active: 10, total: 20, yield: "4 Servings" },   // Garlic Butter Scallops

  // ---- Vegetarian ----
  "vegetarian-1": { difficulty: "Easy",   active: 20, total: 30, yield: "8 Slices" },  // Vegan Med Pizza
  "vegetarian-2": { difficulty: "Easy",   active: 15, total: 35, yield: "4 Servings" },// Roasted Veg Sheetpan
  "vegetarian-3": { difficulty: "Medium", active: 25, total: 55, yield: "4 Servings" },// Stuffed Bell Peppers

  // ---- Pork ----
  "pork-1": { difficulty: "Medium", active: 20, total: 240, yield: "8 Servings" },     // Classic Pulled Pork
  "pork-2": { difficulty: "Medium", active: 20, total: 120, yield: "6 Servings" },     // Crispy Pork Belly Bites
  "pork-3": { difficulty: "Medium", active: 20, total: 65,  yield: "6 Servings" },     // PC Carnitas

  // ---- Beef ----
  "beef-1": { difficulty: "Hard",   active: 30, total: 360, yield: "12 Servings" },    // Traditional Smoked Brisket
  "beef-2": { difficulty: "Medium", active: 15, total: 35,  yield: "2 Servings" },     // Steakhouse Ribeye
  "beef-3": { difficulty: "Easy",   active: 20, total: 30,  yield: "4 Servings" },     // Beef & Broccoli Stir-Fry

  // ---- Grains ----
  "grains-1": { difficulty: "Easy", active: 5,  total: 20,  yield: "4 cups" },         // Perfect Quinoa
  "grains-2": { difficulty: "Easy", active: 5,  total: 75,  yield: "6 cups" },         // Baked Brown Rice
  "grains-3": { difficulty: "Easy", active: 5,  total: 25,  yield: "4 cups" },         // Jasmine Rice

  // ---- Eggs ----
  "eggs-1": { difficulty: "Easy", active: 15, total: 45, yield: "12 Bites" },          // Egg Bites
  "eggs-2": { difficulty: "Easy", active: 5,  total: 12, yield: "6 Eggs" },            // Soft-Boiled Eggs
  "eggs-3": { difficulty: "Easy", active: 10, total: 25, yield: "4 Servings" },        // Skillet Frittata

  // ---- Soups ----
  "soups-1": { difficulty: "Easy", active: 15, total: 35, yield: "4 Servings" },       // Tomato Basil Soup
  "soups-2": { difficulty: "Easy", active: 25, total: 55, yield: "6 Servings" },       // Chicken Noodle Soup
  "soups-3": { difficulty: "Easy", active: 20, total: 50, yield: "6 Servings" },       // Butternut Squash Soup

  // ---- Stews ----
  "stews-1": { difficulty: "Medium", active: 25, total: 120, yield: "6 Servings" },    // Classic Beef Stew
  "stews-2": { difficulty: "Medium", active: 25, total: 60,  yield: "6 Servings" },    // Chicken Chili Verde
  "stews-3": { difficulty: "Easy",   active: 15, total: 45,  yield: "6 Servings" },    // Vegan Lentil Stew

  // ---- Pasta ----
  "pasta-1": { difficulty: "Easy",   active: 20, total: 60, yield: "8 Servings" },     // Baked Ziti
  "pasta-2": { difficulty: "Easy",   active: 10, total: 25, yield: "6 Servings" },     // PC Mac & Cheese
  "pasta-3": { difficulty: "Medium", active: 30, total: 75, yield: "8 Servings" },     // Sheet-Pan Lasagna

  // ---- Fruit ----
  "fruit-1": { difficulty: "Easy", active: 10, total: 20, yield: "4 Servings" },       // AF Cinnamon Apples
  "fruit-2": { difficulty: "Easy", active: 10, total: 20, yield: "4 Servings" },       // Roasted Grapes + Yogurt
  "fruit-3": { difficulty: "Easy", active: 15, total: 40, yield: "4 Servings" },       // Spiced Poached Pears
};

/**
 * Merge META_BY_ID into RECIPE_LIBRARY so UI can read recipe.meta consistently.
 * (If a recipe already has meta, we keep its fields and only fill missing ones.)
 */
Object.keys(META_BY_ID).forEach((id) => {
  const r = (RECIPE_LIBRARY as any)[id];
  if (r) {
    r.meta = { ...(r.meta ?? {}), ...META_BY_ID[id] };
  }
});

