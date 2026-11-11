import { db, pool, foodCatalogTable } from "@workspace/db";
import { logger } from "../lib/logger";

const recipes = [
  {
    id: "mahshi", title: "Mahshi warak enab", subtitle: "Grape leaves, slow-cooked with love",
    description: "Tender grape leaves wrapped around a fragrant rice and herb filling, simmered gently with lemon. A comforting Egyptian family favourite.",
    image: "/images/food-hub/mahshi.jpg", minutes: 80, servings: 4, category: "Comfort", vegetarian: true,
    calories: 420, difficulty: "Medium",
    ingredients: [
      { name: "Grape leaves", quantity: 250, unit: "g" },
      { name: "Rice", quantity: 200, unit: "g" },
      { name: "Tomatoes", quantity: 3, unit: "pcs" },
      { name: "Onion", quantity: 1, unit: "pc" },
      { name: "Parsley", quantity: 30, unit: "g" },
      { name: "Dill", quantity: 20, unit: "g" },
      { name: "Vegetable stock", quantity: 500, unit: "ml" },
      { name: "Olive oil", quantity: 3, unit: "tbsp" },
      { name: "Lemon", quantity: 1, unit: "pc" },
    ],
    steps: [
      { text: "Rinse the rice. Rinse brined grape leaves, or briefly blanch fresh leaves until flexible. Drain and remove tough stems.", timerSeconds: 120 },
      { text: "Finely chop the onion, tomatoes, parsley and dill. Mix with the uncooked rice and olive oil. Season to taste.", timerSeconds: 0 },
      { text: "Place a leaf vein-side up. Add a small teaspoon of filling near the stem, leaving space for the rice to expand.", timerSeconds: 0 },
      { text: "Fold the sides inward and roll away from you. Do not roll too tightly. Line a heavy pot with spare leaves and arrange rolls seam-side down.", timerSeconds: 0 },
      { text: "Add hot vegetable stock to just cover the rolls, adding water if needed. Place a heatproof plate on top, bring to a gentle simmer, cover and cook on low for 45–55 minutes. Add hot water if the pot becomes dry.", timerSeconds: 2700 },
      { text: "Check that the rice is fully tender; cook longer if needed. Rest off the heat for 10 minutes, then finish with lemon. Refrigerate leftovers within 2 hours.", timerSeconds: 600 },
    ],
  },
  {
    id: "molokhia", title: "Molokhia with chicken", subtitle: "A silky green classic, the home way",
    description: "Finely chopped molokhia in fragrant broth, finished with garlic and coriander and served with roasted chicken.",
    image: "/images/food-hub/molokhia.jpg", minutes: 55, servings: 4, category: "Comfort", vegetarian: false,
    calories: 510, difficulty: "Easy",
    ingredients: [
      { name: "Chicken thighs", quantity: 800, unit: "g" },
      { name: "Molokhia", quantity: 400, unit: "g" },
      { name: "Chicken stock", quantity: 750, unit: "ml" },
      { name: "Garlic", quantity: 4, unit: "cloves" },
      { name: "Ground coriander", quantity: 2, unit: "tsp" },
      { name: "Butter", quantity: 2, unit: "tbsp" },
      { name: "Rice", quantity: 250, unit: "g" },
    ],
    steps: [
      { text: "Heat the oven to 200°C. Season the chicken and place it in a roasting dish. Wash hands and utensils after handling raw chicken.", timerSeconds: 0 },
      { text: "Roast chicken for about 35–45 minutes. Use a food thermometer to confirm the thickest part reaches at least 74°C; time alone is not a safety check.", timerSeconds: 2100 },
      { text: "Meanwhile, cook the rice according to its package instructions. Gently heat the chicken stock in a separate saucepan.", timerSeconds: 900 },
      { text: "Stir finely chopped molokhia into the hot stock. Cook gently until fully heated, following package directions if using frozen molokhia.", timerSeconds: 300 },
      { text: "In a small pan, melt butter, add minced garlic and coriander, and cook until fragrant and lightly golden. Stir into the molokhia.", timerSeconds: 60 },
      { text: "Serve hot with the cooked chicken and rice. Refrigerate leftovers within 2 hours, keeping cooked food separate from raw chicken.", timerSeconds: 0 },
    ],
  },
  {
    id: "koshari", title: "Koshari", subtitle: "Lentils, pasta & crisp onions",
    description: "Egypt's beloved rice, lentil and pasta bowl, layered with spiced tomato sauce, chickpeas and golden onions.",
    image: "/images/food-hub/koshari.jpg", minutes: 45, servings: 4, category: "Everyday", vegetarian: true,
    calories: 560, difficulty: "Easy",
    ingredients: [
      { name: "Rice", quantity: 200, unit: "g" },
      { name: "Brown lentils", quantity: 200, unit: "g" },
      { name: "Pasta", quantity: 150, unit: "g" },
      { name: "Cooked chickpeas", quantity: 200, unit: "g" },
      { name: "Tomatoes", quantity: 400, unit: "g" },
      { name: "Onion", quantity: 2, unit: "pcs" },
      { name: "Garlic", quantity: 3, unit: "cloves" },
      { name: "Olive oil", quantity: 4, unit: "tbsp" },
    ],
    steps: [
      { text: "Rinse the lentils. Simmer in plenty of water until tender but not falling apart, about 20–25 minutes. Drain.", timerSeconds: 1200 },
      { text: "Cook the rice in a separate pot according to package directions. Boil the pasta until just tender and drain.", timerSeconds: 900 },
      { text: "Slice onions thinly and fry carefully in oil over medium heat until golden. Drain on kitchen paper, taking care around hot oil.", timerSeconds: 600 },
      { text: "Gently fry minced garlic in a little oil, add chopped tomatoes and season to taste. Simmer until thick, adding water if needed.", timerSeconds: 600 },
      { text: "Warm the cooked chickpeas. Layer rice, lentils and pasta in bowls, then add tomato sauce, chickpeas and crispy onions.", timerSeconds: 0 },
      { text: "Serve immediately. Refrigerate cooked rice and other leftovers promptly, within 2 hours; reheat until steaming hot.", timerSeconds: 0 },
    ],
  },
];

const cooks = [
  { id: "om-ahmed", name: "Om Ahmed", area: "Giza, Egypt", bio: "Sample profile: a patient home cook sharing mahshi, molokhia and everyday Egyptian family meals. This is an illustrative instructor, not a verified bookable provider.", languages: ["Arabic"], dishes: ["mahshi", "molokhia"], hourlyRate: 250, currency: "EGP", sample: true },
  { id: "hanan", name: "Hanan", area: "Alexandria, Egypt", bio: "Sample profile: learn Egyptian comfort food, kitchen preparation and the small techniques that make a home-cooked meal special.", languages: ["Arabic", "English"], dishes: ["molokhia", "koshari"], hourlyRate: 300, currency: "EGP", sample: true },
  { id: "samira", name: "Samira", area: "Cairo, Egypt", bio: "Sample profile: simple vegetarian Egyptian favourites for busy families. Real instructor onboarding has not opened yet.", languages: ["Arabic", "English"], dishes: ["koshari", "mahshi"], hourlyRate: 200, currency: "EGP", sample: true },
];
const courses = [
  { id: "newlywed-kitchen", title: "The newlywed kitchen", teacher: "Food Hub curriculum preview", image: "/images/food-hub/molokhia.jpg", description: "A sample syllabus for building confidence with everyday Egyptian family meals. Video lessons are not available yet.", price: 499, lessons: ["A calmer kitchen: tools and preparation", "Building a flavourful stock", "Rice that comes out right", "Molokhia, step by step", "Planning a family meal"], sample: true },
  { id: "mahshi-masterclass", title: "Mahshi, made with love", teacher: "Food Hub curriculum preview", image: "/images/food-hub/mahshi.jpg", description: "A sample course outline about preparing leaves, seasoning rice and rolling with confidence. No paid access or hosted video is active.", price: 299, lessons: ["Choosing and preparing grape leaves", "Mixing a fragrant filling", "The folding and rolling technique", "Simmering and serving"], sample: true },
  { id: "everyday-egypt", title: "Everyday Egyptian favourites", teacher: "Food Hub curriculum preview", image: "/images/food-hub/koshari.jpg", description: "A curriculum preview of comforting home dishes and flexible family meal planning.", price: 399, lessons: ["Pantry foundations", "A comforting koshari bowl", "Using leftovers safely", "A week of family dinners"], sample: true },
];
const vouchers = [
  { code: "FIRSTCOOK", title: "Your first lesson", description: "Illustrative offer: 20% off a future lesson. Not redeemable until payments and real providers are connected.", percent: 20 },
  { code: "LEARN15", title: "Make time to learn", description: "Illustrative offer: 15% off a future course. No purchases can be made yet.", percent: 15 },
];

async function seed() {
  for (const [kind, records] of [["recipe", recipes], ["cook", cooks], ["course", courses], ["voucher", vouchers]] as const) {
    for (const data of records) {
      const id = "id" in data ? data.id : data.code;
      await db.insert(foodCatalogTable).values({ id: `${kind}:${id}`, kind, data })
        .onConflictDoNothing();
    }
  }
  logger.info("Food Hub sample catalog seeded; services remain unavailable.");
}

seed().catch((err) => { logger.error({ err }, "Food Hub seeding failed"); process.exitCode = 1; }).finally(() => pool.end());
