const NUTRITIONIX_APP_ID = process.env.NUTRITIONIX_APP_ID || "";
const NUTRITIONIX_APP_KEY = process.env.NUTRITIONIX_APP_KEY || "";
const NUTRITIONIX_BASE = "https://trackapi.nutritionix.com/v2";

interface NutritionixFood {
  food_name: string;
  brand_name?: string;
  serving_qty: number;
  serving_unit: string;
  serving_weight_grams?: number;
  nf_calories: number;
  nf_protein: number;
  nf_total_carbohydrate: number;
  nf_total_fat: number;
  nf_dietary_fiber: number;
  photo?: {
    thumb: string;
    highres: string;
  };
}

interface NutritionixSearchResponse {
  common: NutritionixFood[];
  branded: NutritionixFood[];
}

export interface FoodResult {
  food_name: string;
  brand_name?: string;
  serving_qty: number;
  serving_unit: string;
  serving_weight_grams?: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  photo_url?: string;
}

function headers(): Record<string, string> {
  return {
    "x-app-id": NUTRITIONIX_APP_ID,
    "x-app-key": NUTRITIONIX_APP_KEY,
    "Content-Type": "application/json",
  };
}

function mapFood(f: NutritionixFood): FoodResult {
  return {
    food_name: f.food_name,
    brand_name: f.brand_name,
    serving_qty: f.serving_qty,
    serving_unit: f.serving_unit,
    serving_weight_grams: f.serving_weight_grams,
    calories: f.nf_calories || 0,
    protein_g: f.nf_protein || 0,
    carbs_g: f.nf_total_carbohydrate || 0,
    fat_g: f.nf_total_fat || 0,
    fiber_g: f.nf_dietary_fiber || 0,
    photo_url: f.photo?.thumb,
  };
}

export function isDemoMode(): boolean {
  return !NUTRITIONIX_APP_ID || !NUTRITIONIX_APP_KEY;
}

export async function searchFood(query: string): Promise<FoodResult[]> {
  if (isDemoMode()) {
    return getFallbackFoods(query);
  }

  const res = await fetch(`${NUTRITIONIX_BASE}/search/instant?query=${encodeURIComponent(query)}`, {
    headers: headers(),
  });

  if (!res.ok) {
    throw new Error(`Nutritionix API error: ${res.status} ${res.statusText}`);
  }

  const data: NutritionixSearchResponse = await res.json();
  return [...data.common, ...data.branded].slice(0, 20).map(mapFood);
}

export async function lookupBarcode(barcode: string): Promise<FoodResult | null> {
  if (isDemoMode()) {
    return getFallbackBarcode(barcode);
  }

  const res = await fetch(`${NUTRITIONIX_BASE}/search/item?upc=${barcode}`, {
    headers: headers(),
  });

  if (!res.ok) {
    throw new Error(`Nutritionix API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (!data.foods || data.foods.length === 0) return null;

  return mapFood(data.foods[0]);
}

// --- Fallback data when no API key is configured (demo mode) ---

const FALLBACK_FOODS: FoodResult[] = [
  {
    food_name: "Chicken Breast (Grilled)",
    brand_name: "Generic",
    serving_qty: 100,
    serving_unit: "g",
    serving_weight_grams: 100,
    calories: 165,
    protein_g: 31,
    carbs_g: 0,
    fat_g: 3.6,
    fiber_g: 0,
  },
  {
    food_name: "White Rice (Cooked)",
    brand_name: "Generic",
    serving_qty: 1,
    serving_unit: "cup",
    serving_weight_grams: 158,
    calories: 205,
    protein_g: 4.3,
    carbs_g: 44.5,
    fat_g: 0.4,
    fiber_g: 0.6,
  },
  {
    food_name: "Broccoli (Steamed)",
    brand_name: "Generic",
    serving_qty: 100,
    serving_unit: "g",
    serving_weight_grams: 100,
    calories: 35,
    protein_g: 2.4,
    carbs_g: 7.2,
    fat_g: 0.4,
    fiber_g: 3.3,
  },
  {
    food_name: "Salmon (Atlantic, Cooked)",
    brand_name: "Generic",
    serving_qty: 100,
    serving_unit: "g",
    serving_weight_grams: 100,
    calories: 208,
    protein_g: 20.4,
    carbs_g: 0,
    fat_g: 13.4,
    fiber_g: 0,
  },
  {
    food_name: "Banana",
    brand_name: "Generic",
    serving_qty: 1,
    serving_unit: "medium",
    serving_weight_grams: 118,
    calories: 105,
    protein_g: 1.3,
    carbs_g: 27,
    fat_g: 0.4,
    fiber_g: 3.1,
  },
  {
    food_name: "Eggs (Large, Scrambled)",
    brand_name: "Generic",
    serving_qty: 2,
    serving_unit: "egg",
    serving_weight_grams: 100,
    calories: 182,
    protein_g: 12,
    carbs_g: 1.6,
    fat_g: 13,
    fiber_g: 0,
  },
  {
    food_name: "Greek Yogurt (Plain, Nonfat)",
    brand_name: "Generic",
    serving_qty: 1,
    serving_unit: "cup",
    serving_weight_grams: 245,
    calories: 130,
    protein_g: 23,
    carbs_g: 9,
    fat_g: 0.7,
    fiber_g: 0,
  },
  {
    food_name: "Oatmeal (Cooked)",
    brand_name: "Generic",
    serving_qty: 1,
    serving_unit: "cup",
    serving_weight_grams: 234,
    calories: 166,
    protein_g: 5.9,
    carbs_g: 28,
    fat_g: 3.6,
    fiber_g: 4,
  },
  {
    food_name: "Avocado",
    brand_name: "Generic",
    serving_qty: 0.5,
    serving_unit: "avocado",
    serving_weight_grams: 68,
    calories: 114,
    protein_g: 1.3,
    carbs_g: 6,
    fat_g: 10.5,
    fiber_g: 4.6,
  },
  {
    food_name: "Protein Bar (Chocolate)",
    brand_name: "Quest",
    serving_qty: 1,
    serving_unit: "bar",
    serving_weight_grams: 60,
    calories: 190,
    protein_g: 21,
    carbs_g: 22,
    fat_g: 8,
    fiber_g: 14,
  },
  {
    food_name: "Almonds (Raw)",
    brand_name: "Generic",
    serving_qty: 28,
    serving_unit: "g",
    serving_weight_grams: 28,
    calories: 164,
    protein_g: 6,
    carbs_g: 6.1,
    fat_g: 14.2,
    fiber_g: 3.5,
  },
  {
    food_name: "Whole Wheat Bread",
    brand_name: "Generic",
    serving_qty: 1,
    serving_unit: "slice",
    serving_weight_grams: 28,
    calories: 69,
    protein_g: 3.6,
    carbs_g: 11.6,
    fat_g: 1.1,
    fiber_g: 1.9,
  },
];

function getFallbackFoods(query: string): FoodResult[] {
  const q = query.toLowerCase();
  return FALLBACK_FOODS.filter(
    (f) =>
      f.food_name.toLowerCase().includes(q) ||
      (f.brand_name && f.brand_name.toLowerCase().includes(q))
  );
}

function getFallbackBarcode(barcode: string): FoodResult | null {
  return FALLBACK_FOODS[barcode.length % FALLBACK_FOODS.length] || null;
}
