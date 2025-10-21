// app/local-images.ts
// Map recipe IDs -> local image require() so Metro resolves from inside /app

export const LOCAL_IMAGES: Record<string, any> = {
  // Canonical featured ids
  "1": require("../assets/recipe-images/beef/brisket.jpeg"),
  "2": require("../assets/recipe-images/seafood/coconut-shrimp.jpg"),
  "3": require("../assets/recipe-images/pork/classic-pulled-pork.jpg"),
  "4": require("../assets/recipe-images/vegetarian/vegan-mediterranean-pizza.jpg"),

  // Poultry
  "poultry-1": require("../assets/recipe-images/poultry/herbed-roast-chicken.jpg"),
  "poultry-2": require("../assets/recipe-images/poultry/air-fried-chicken-wings.jpg"),
  "poultry-3": require("../assets/recipe-images/poultry/instant-chicken-stock.jpg"),

  // Meat
  // (add if you add photos)
  "meat-1": require("../assets/recipe-images/meat/juicy-meatloaf.jpg"),
  "meat-2": require("../assets/recipe-images/meat/lamb-chops.jpg"),
  "meat-3": require("../assets/recipe-images/meat/pressure-cooker-pot-roast.jpg"),

  // Seafood
  "seafood-1": require("../assets/recipe-images/seafood/coconut-shrimp.jpg"),
  "seafood-2": require("../assets/recipe-images/seafood/roasted-salmon-fillet.jpg"),
  "seafood-3": require("../assets/recipe-images/seafood/garlic-butter-scallops.jpg"),

  // Vegetarian
  "vegetarian-1": require("../assets/recipe-images/vegetarian/vegan-mediterranean-pizza.jpg"),
  "vegetarian-2": require("../assets/recipe-images/vegetarian/roasted-veggie-sheetpan.jpg"),
  "vegetarian-3": require("../assets/recipe-images/vegetarian/stuffed-bell-peppers.webp"),

  // Pork (no local images in your screenshot)
  "pork-1": require("../assets/recipe-images/pork/classic-pulled-pork.jpg"),
  "pork-2": require("../assets/recipe-images/pork/crispy-pork-belly-bites.jpg"),
  "pork-3": require("../assets/recipe-images/pork/pressure-cooker-carnitas.jpg"),

  // Beef
  "beef-1": require("../assets/recipe-images/beef/brisket.jpeg"),
  "beef-2": require("../assets/recipe-images/beef/steakhouse-ribeye.jpg"),
  "beef-3": require("../assets/recipe-images/beef/beef-broccoli-stir-fry.jpg"),

  // Grains
  "grains-1": require("../assets/recipe-images/grains/perfect-quinoa.jpg"),
  "grains-2": require("../assets/recipe-images/grains/baked-brown-rice.png"),
  "grains-3": require("../assets/recipe-images/grains/jasmine-rice.jpg"),

  // Eggs
  "eggs-1": require("../assets/recipe-images/eggs/egg-bites.jpg"),
  "eggs-2": require("../assets/recipe-images/eggs/soft-boiled-eggs.webp"),
  "eggs-3": require("../assets/recipe-images/eggs/skillet-frittata.jpeg"),

  // Stews
  "stews-1": require("../assets/recipe-images/stews/classic-beef-stew.jpg"),
  "stews-2": require("../assets/recipe-images/stews/chicken-chili-verde.jpg"),
  "stews-3": require("../assets/recipe-images/stews/vegan-lentil-stew.jpg"),

  // Pasta
  "pasta-1": require("../assets/recipe-images/pasta/baked-ziti.jpg"),
  "pasta-2": require("../assets/recipe-images/pasta/pc-mac-and-cheese.jpg"),
  "pasta-3": require("../assets/recipe-images/pasta/sheet-pan-lasagna.jpg"),

  // Soups
  "soups-1": require("../assets/recipe-images/soups/tomato-basil-soup.jpg"),
  "soups-2": require("../assets/recipe-images/soups/chicken-noodle-soup.jpg"),
  "soups-3": require("../assets/recipe-images/soups/butternut-squash-soup.jpg"),

  // Fruit
  "fruit-1": require("../assets/recipe-images/fruit/air-fried-cinnamon-apples.jpg"),
  "fruit-2": require("../assets/recipe-images/fruit/roasted-grapes-yogurt.jpg"),
  "fruit-3": require("../assets/recipe-images/fruit/spiced-poached-pears.jpg"),

};
