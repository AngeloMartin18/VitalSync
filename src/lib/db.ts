import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "vitalsync.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      food_name TEXT NOT NULL,
      brand_name TEXT,
      serving_qty REAL DEFAULT 1,
      serving_unit TEXT DEFAULT 'serving',
      serving_weight_grams REAL,
      calories REAL NOT NULL DEFAULT 0,
      protein_g REAL DEFAULT 0,
      carbs_g REAL DEFAULT 0,
      fat_g REAL DEFAULT 0,
      fiber_g REAL DEFAULT 0,
      barcode TEXT,
      meal_type TEXT NOT NULL DEFAULT 'snack',
      photo_url TEXT,
      logged_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS daily_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      calorie_target REAL NOT NULL DEFAULT 2000,
      protein_target_g REAL DEFAULT 150,
      carbs_target_g REAL DEFAULT 250,
      fat_target_g REAL DEFAULT 65,
      set_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS weekly_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_start TEXT NOT NULL,
      plan_data TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);
}

// --- Meal CRUD ---

export interface Meal {
  id?: number;
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
  barcode?: string;
  meal_type: string;
  photo_url?: string;
  logged_at?: string;
}

export function addMeal(meal: Meal): Meal {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO meals (food_name, brand_name, serving_qty, serving_unit, serving_weight_grams,
      calories, protein_g, carbs_g, fat_g, fiber_g, barcode, meal_type, photo_url)
    VALUES (@food_name, @brand_name, @serving_qty, @serving_unit, @serving_weight_grams,
      @calories, @protein_g, @carbs_g, @fat_g, @fiber_g, @barcode, @meal_type, @photo_url)
  `);
  const result = stmt.run(meal);
  return { ...meal, id: Number(result.lastInsertRowid) };
}

export function getMealsByDate(date: string): Meal[] {
  const database = getDb();
  const stmt = database.prepare(
    "SELECT * FROM meals WHERE date(logged_at) = date(?) ORDER BY logged_at DESC"
  );
  return stmt.all(date) as Meal[];
}

export function getTodaysMeals(): Meal[] {
  return getMealsByDate(new Date().toISOString().split("T")[0]);
}

export function deleteMeal(id: number): boolean {
  const database = getDb();
  const result = database.prepare("DELETE FROM meals WHERE id = ?").run(id);
  return result.changes > 0;
}

// --- Daily Goals ---

export interface DailyGoals {
  id?: number;
  calorie_target: number;
  protein_target_g: number;
  carbs_target_g: number;
  fat_target_g: number;
}

export function getDailyGoals(): DailyGoals {
  const database = getDb();
  const row = database
    .prepare("SELECT * FROM daily_goals ORDER BY id DESC LIMIT 1")
    .get() as DailyGoals | undefined;
  return (
    row || {
      calorie_target: 2000,
      protein_target_g: 150,
      carbs_target_g: 250,
      fat_target_g: 65,
    }
  );
}

export function setDailyGoals(goals: DailyGoals): DailyGoals {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO daily_goals (calorie_target, protein_target_g, carbs_target_g, fat_target_g)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(
    goals.calorie_target,
    goals.protein_target_g,
    goals.carbs_target_g,
    goals.fat_target_g
  );
  return { ...goals, id: Number(result.lastInsertRowid) };
}

// --- Daily Totals ---

export function getTodaysTotals(): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  meals: Meal[];
} {
  const meals = getTodaysMeals();
  return {
    calories: meals.reduce((sum, m) => sum + m.calories, 0),
    protein: meals.reduce((sum, m) => sum + m.protein_g, 0),
    carbs: meals.reduce((sum, m) => sum + m.carbs_g, 0),
    fat: meals.reduce((sum, m) => sum + m.fat_g, 0),
    fiber: meals.reduce((sum, m) => sum + m.fiber_g, 0),
    meals,
  };
}

// --- Weekly Plans ---

export interface WeeklyPlan {
  id?: number;
  week_start: string;
  plan_data: {
    diet: DayPlan[];
    exercise: DayPlan[];
  };
}

export interface DayPlan {
  day: string;
  items: string[];
}

export function saveWeeklyPlan(
  week_start: string,
  plan_data: WeeklyPlan["plan_data"]
): WeeklyPlan {
  const database = getDb();
  const existing = database
    .prepare("SELECT id FROM weekly_plans WHERE week_start = ?")
    .get(week_start) as { id: number } | undefined;

  if (existing) {
    database
      .prepare("UPDATE weekly_plans SET plan_data = ? WHERE id = ?")
      .run(JSON.stringify(plan_data), existing.id);
    return { id: existing.id, week_start, plan_data };
  }

  const stmt = database.prepare(
    "INSERT INTO weekly_plans (week_start, plan_data) VALUES (?, ?)"
  );
  const result = stmt.run(week_start, JSON.stringify(plan_data));
  return { id: Number(result.lastInsertRowid), week_start, plan_data };
}

export function getWeeklyPlan(
  week_start: string
): WeeklyPlan | undefined {
  const database = getDb();
  const row = database
    .prepare("SELECT * FROM weekly_plans WHERE week_start = ?")
    .get(week_start) as { id: number; week_start: string; plan_data: string } | undefined;

  if (!row) return undefined;
  return {
    id: row.id,
    week_start: row.week_start,
    plan_data: JSON.parse(row.plan_data),
  };
}
