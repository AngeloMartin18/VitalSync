"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

interface DailyGoals {
  calorie_target: number;
  protein_target_g: number;
  carbs_target_g: number;
  fat_target_g: number;
}

interface DayPlan {
  day: string;
  items: string[];
}

interface PlanData {
  diet: DayPlan[];
  exercise: DayPlan[];
}

interface WeeklyPlan {
  week_start: string;
  plan_data: PlanData;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const LIFESTYLE_PRESETS = [
  { label: "Sedentary", desc: "Desk job, little exercise", multiplier: 1.2 },
  { label: "Lightly Active", desc: "Light exercise 1-3 days/week", multiplier: 1.375 },
  { label: "Moderately Active", desc: "Moderate exercise 3-5 days/week", multiplier: 1.55 },
  { label: "Very Active", desc: "Hard exercise 6-7 days/week", multiplier: 1.725 },
];

const EXERCISE_OPTIONS = [
  "30 min brisk walking",
  "30 min jogging",
  "45 min cycling",
  "30 min swimming",
  "45 min weight training",
  "30 min HIIT",
  "1 hour yoga",
  "Rest day",
];

const DIET_TEMPLATES: Record<string, string[]> = {
  breakfast: [
    "Oatmeal with banana and almonds",
    "Greek yogurt with berries and granola",
    "Scrambled eggs with whole wheat toast",
    "Protein smoothie with spinach and fruit",
    "Avocado toast with poached eggs",
  ],
  lunch: [
    "Grilled chicken salad with quinoa",
    "Tuna wrap with mixed greens",
    "Turkey and avocado sandwich",
    "Lentil soup with whole grain bread",
    "Salmon poke bowl",
  ],
  dinner: [
    "Baked salmon with roasted vegetables",
    "Chicken stir-fry with brown rice",
    "Lean beef steak with sweet potato",
    "Grilled tofu with steamed broccoli",
    "Shrimp pasta with marinara sauce",
  ],
  snack: ["Apple with peanut butter", "Protein bar", "Mixed nuts", "Cottage cheese with fruit", "Hummus with carrots"],
};

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
}

export default function PlanPage() {
  const weekStart = useMemo(() => getWeekStart(), []);
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [goals, setGoals] = useState<DailyGoals>({
    calorie_target: 2000,
    protein_target_g: 150,
    carbs_target_g: 250,
    fat_target_g: 65,
  });
  const [lifestyle, setLifestyle] = useState("moderately active");
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(170);
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState("male");
  const [goalType, setGoalType] = useState("maintain");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingDiet, setEditingDiet] = useState<number | null>(null);
  const [editingExercise, setEditingExercise] = useState<number | null>(null);
  const [dietInputs, setDietInputs] = useState<Record<number, string>>({});
  const [exerciseInputs, setExerciseInputs] = useState<Record<number, string>>({});

  const loadPlanWrapped = useCallback(async () => {
    setLoading(true);
    const [planRes, goalsRes] = await Promise.all([
      fetch(`/api/plan?week_start=${weekStart}`),
      fetch("/api/plan?goals=true"),
    ]);
    if (planRes.ok) {
      const data = await planRes.json();
      if (data.plan_data) setPlan(data);
    }
    if (goalsRes.ok) {
      const g = await goalsRes.json();
      if (g) setGoals(g);
    }
    setLoading(false);
  }, [weekStart]);

  useEffect(() => {
    loadPlanWrapped();
  }, [loadPlanWrapped]);

  const calculateGoals = async () => {
    let bmr: number;
    if (gender === "male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    const preset = LIFESTYLE_PRESETS.find((p) =>
      p.label.toLowerCase().includes(lifestyle)
    );
    const tdee = bmr * (preset?.multiplier || 1.55);

    let calorieTarget: number;
    switch (goalType) {
      case "lose":
        calorieTarget = tdee - 500;
        break;
      case "gain":
        calorieTarget = tdee + 500;
        break;
      default:
        calorieTarget = tdee;
    }

    const updated: DailyGoals = {
      calorie_target: Math.round(calorieTarget),
      protein_target_g: Math.round((calorieTarget * 0.3) / 4),
      carbs_target_g: Math.round((calorieTarget * 0.45) / 4),
      fat_target_g: Math.round((calorieTarget * 0.25) / 9),
    };
    setGoals(updated);

    await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goals: updated }),
    });
  };

  const generatePlan = async () => {
    setGenerating(true);
    const perMealCal = Math.round(goals.calorie_target / 4);

    const diet: DayPlan[] = DAYS.map((day) => ({
      day,
      items: [
        `${DIET_TEMPLATES.breakfast[Math.floor(Math.random() * DIET_TEMPLATES.breakfast.length)]} (~${perMealCal} kcal)`,
        `${DIET_TEMPLATES.lunch[Math.floor(Math.random() * DIET_TEMPLATES.lunch.length)]} (~${perMealCal} kcal)`,
        `${DIET_TEMPLATES.dinner[Math.floor(Math.random() * DIET_TEMPLATES.dinner.length)]} (~${perMealCal} kcal)`,
        `${DIET_TEMPLATES.snack[Math.floor(Math.random() * DIET_TEMPLATES.snack.length)]} (~${Math.round(perMealCal * 0.5)} kcal)`,
      ],
    }));

    const exercise: DayPlan[] = DAYS.map((day, i) => ({
      day,
      items: [
        i === 6
          ? "Rest day"
          : EXERCISE_OPTIONS[Math.floor(Math.random() * (EXERCISE_OPTIONS.length - 1))],
      ],
    }));

    const planData: PlanData = { diet, exercise };

    setSaving(true);
    const res = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ week_start: weekStart, plan_data: planData }),
    });
    if (res.ok) {
      const savedPlan = await res.json();
      setPlan(savedPlan);
    }
    setSaving(false);
    setGenerating(false);
  };

  const toggleDietItem = (dayIdx: number, itemIdx: number) => {
    if (!plan) return;
    const newPlan = { ...plan, plan_data: { ...plan.plan_data } };
    newPlan.plan_data.diet = [...plan.plan_data.diet];
    const day = { ...newPlan.plan_data.diet[dayIdx] };
    day.items = day.items.filter((_, i) => i !== itemIdx);
    newPlan.plan_data.diet[dayIdx] = day;
    setPlan(newPlan);
  };

  const toggleExerciseItem = (dayIdx: number, itemIdx: number) => {
    if (!plan) return;
    const newPlan = { ...plan, plan_data: { ...plan.plan_data } };
    newPlan.plan_data.exercise = [...plan.plan_data.exercise];
    const day = { ...newPlan.plan_data.exercise[dayIdx] };
    day.items = day.items.filter((_, i) => i !== itemIdx);
    newPlan.plan_data.exercise[dayIdx] = day;
    setPlan(newPlan);
  };

  const saveChanges = async () => {
    if (!plan) return;
    setSaving(true);
    const res = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ week_start: plan.week_start, plan_data: plan.plan_data }),
    });
    if (res.ok) {
      const savedPlan = await res.json();
      setPlan(savedPlan);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-erewhon-black border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Hero */}
      <div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tightest">
          Weekly Plan
        </h1>
      </div>

      {/* Calculator */}
      <section className="space-y-8">
        <h2 className="text-xs tracking-widest uppercase text-erewhon-medium">
          Personalize Your Goals
        </h2>

        {/* Input Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <InputField label="Age" value={age} onChange={(v) => setAge(Number(v))} type="number" />
          <InputField label="Weight (kg)" value={weight} onChange={(v) => setWeight(Number(v))} type="number" />
          <InputField label="Height (cm)" value={height} onChange={(v) => setHeight(Number(v))} type="number" />
          <div>
            <label className="block text-[10px] tracking-widest uppercase text-erewhon-medium mb-1.5">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full py-2 bg-transparent border-b border-erewhon-border text-sm tracking-tight focus:outline-none focus:border-erewhon-black transition-colors"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        {/* Pills */}
        <div className="space-y-4">
          <div>
            <p className="text-[10px] tracking-widest uppercase text-erewhon-medium mb-2">
              Lifestyle
            </p>
            <div className="flex flex-wrap gap-1">
              {LIFESTYLE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  title={p.desc}
                  onClick={() => setLifestyle(p.label.toLowerCase())}
                  className={`px-4 py-2 text-xs tracking-widest uppercase transition-colors ${
                    lifestyle === p.label.toLowerCase()
                      ? "bg-erewhon-black text-erewhon-white font-semibold"
                      : "border border-erewhon-border text-erewhon-medium hover:border-erewhon-black hover:text-erewhon-black"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] tracking-widest uppercase text-erewhon-medium mb-2">
              Goal
            </p>
            <div className="flex flex-wrap gap-1">
              {[
                { key: "lose", label: "Lose Weight" },
                { key: "maintain", label: "Maintain" },
                { key: "gain", label: "Gain Muscle" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setGoalType(key)}
                  className={`px-4 py-2 text-xs tracking-widest uppercase transition-colors ${
                    goalType === key
                      ? "bg-erewhon-black text-erewhon-white font-semibold"
                      : "border border-erewhon-border text-erewhon-medium hover:border-erewhon-black hover:text-erewhon-black"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={calculateGoals}
          className="px-8 py-3 border border-erewhon-black text-erewhon-black text-xs tracking-widest uppercase font-semibold hover:bg-erewhon-black hover:text-white transition-colors"
        >
          Calculate My Goals
        </button>

        {/* Goal Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GoalCard label="Daily Calories" value={goals.calorie_target} unit="kcal" />
          <GoalCard label="Protein" value={goals.protein_target_g} unit="g" />
          <GoalCard label="Carbs" value={goals.carbs_target_g} unit="g" />
          <GoalCard label="Fat" value={goals.fat_target_g} unit="g" />
        </div>

        {/* Generate */}
        <button
          onClick={generatePlan}
          disabled={generating}
          className="w-full py-4 bg-erewhon-black text-erewhon-white text-xs tracking-widest uppercase font-bold hover:bg-erewhon-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {generating ? "Generating…" : plan ? "Regenerate Weekly Plan" : "Generate Weekly Plan"}
        </button>
      </section>

      {/* The Plan */}
      {plan && (
        <section className="space-y-12">
          {/* Diet */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs tracking-widest uppercase text-erewhon-medium">
                Diet Plan
              </h2>
              <span className="text-[10px] tracking-wide text-erewhon-medium">
                ~{goals.calorie_target} kcal/day
              </span>
            </div>
            <div className="divide-y divide-erewhon-border border-t border-erewhon-border">
              {plan.plan_data.diet.map((day, di) => (
                <details key={day.day} className="group">
                  <summary className="py-4 cursor-pointer hover:bg-erewhon-offwhite transition-colors list-none flex items-center justify-between px-1">
                    <span className="text-sm font-medium tracking-tight">{day.day}</span>
                    <span className="text-[10px] tracking-wide text-erewhon-medium">
                      {day.items.length} meals
                    </span>
                  </summary>
                  <div className="pb-4 space-y-1">
                    {day.items.map((item, ii) => (
                      <div
                        key={ii}
                        className="flex items-center justify-between py-2 px-3 hover:bg-erewhon-offwhite transition-colors group/item"
                      >
                        <span className="text-sm tracking-tight font-light">{item}</span>
                        <button
                          onClick={() => toggleDietItem(di, ii)}
                          className="opacity-0 group-hover/item:opacity-100 text-erewhon-medium hover:text-red-600 transition-all ml-4 flex-shrink-0"
                          title="Remove"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {editingDiet === di ? (
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          placeholder="Add meal…"
                          value={dietInputs[di] || ""}
                          onChange={(e) => setDietInputs((s) => ({ ...s, [di]: e.target.value }))}
                          className="flex-1 py-1.5 bg-transparent border-b border-erewhon-border text-sm tracking-tight placeholder:text-erewhon-medium focus:outline-none focus:border-erewhon-black transition-colors"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && dietInputs[di]?.trim()) {
                              const newPlan = { ...plan, plan_data: { ...plan.plan_data } };
                              newPlan.plan_data.diet = [...plan.plan_data.diet];
                              newPlan.plan_data.diet[di] = {
                                ...newPlan.plan_data.diet[di],
                                items: [...newPlan.plan_data.diet[di].items, dietInputs[di].trim()],
                              };
                              setPlan(newPlan);
                              setDietInputs((s) => ({ ...s, [di]: "" }));
                            }
                          }}
                        />
                        <button
                          onClick={() => setEditingDiet(null)}
                          className="text-xs tracking-widest uppercase text-erewhon-medium hover:text-erewhon-black transition-colors"
                        >
                          Done
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingDiet(di)}
                        className="text-[10px] tracking-widest uppercase text-erewhon-medium hover:text-erewhon-black transition-colors mt-1"
                      >
                        + Add item
                      </button>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* Exercise */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs tracking-widest uppercase text-erewhon-medium">
                Exercise Plan
              </h2>
            </div>
            <div className="divide-y divide-erewhon-border border-t border-erewhon-border">
              {plan.plan_data.exercise.map((day, di) => (
                <details key={day.day} className="group">
                  <summary className="py-4 cursor-pointer hover:bg-erewhon-offwhite transition-colors list-none flex items-center justify-between px-1">
                    <span className="text-sm font-medium tracking-tight">{day.day}</span>
                    <span className="text-[10px] tracking-wide text-erewhon-medium">
                      {day.items.length} activities
                    </span>
                  </summary>
                  <div className="pb-4 space-y-1">
                    {day.items.map((item, ii) => (
                      <div
                        key={ii}
                        className="flex items-center justify-between py-2 px-3 hover:bg-erewhon-offwhite transition-colors group/item"
                      >
                        <span className="text-sm tracking-tight font-light">{item}</span>
                        <button
                          onClick={() => toggleExerciseItem(di, ii)}
                          className="opacity-0 group-hover/item:opacity-100 text-erewhon-medium hover:text-red-600 transition-all ml-4 flex-shrink-0"
                          title="Remove"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {editingExercise === di ? (
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          placeholder="Add activity…"
                          value={exerciseInputs[di] || ""}
                          onChange={(e) => setExerciseInputs((s) => ({ ...s, [di]: e.target.value }))}
                          className="flex-1 py-1.5 bg-transparent border-b border-erewhon-border text-sm tracking-tight placeholder:text-erewhon-medium focus:outline-none focus:border-erewhon-black transition-colors"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && exerciseInputs[di]?.trim()) {
                              const newPlan = { ...plan, plan_data: { ...plan.plan_data } };
                              newPlan.plan_data.exercise = [...plan.plan_data.exercise];
                              newPlan.plan_data.exercise[di] = {
                                ...newPlan.plan_data.exercise[di],
                                items: [...newPlan.plan_data.exercise[di].items, exerciseInputs[di].trim()],
                              };
                              setPlan(newPlan);
                              setExerciseInputs((s) => ({ ...s, [di]: "" }));
                            }
                          }}
                        />
                        <button
                          onClick={() => setEditingExercise(null)}
                          className="text-xs tracking-widest uppercase text-erewhon-medium hover:text-erewhon-black transition-colors"
                        >
                          Done
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingExercise(di)}
                        className="text-[10px] tracking-widest uppercase text-erewhon-medium hover:text-erewhon-black transition-colors mt-1"
                      >
                        + Add activity
                      </button>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button
              onClick={saveChanges}
              disabled={saving}
              className="px-8 py-3 bg-erewhon-black text-erewhon-white text-xs tracking-widest uppercase font-bold hover:bg-erewhon-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] tracking-widest uppercase text-erewhon-medium mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full py-2 bg-transparent border-b border-erewhon-border text-sm tracking-tight tabular-nums focus:outline-none focus:border-erewhon-black transition-colors"
      />
    </div>
  );
}

function GoalCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="border border-erewhon-border p-5 text-center">
      <p className="text-3xl font-bold tabular-nums tracking-tightest">
        {Math.round(value)}
      </p>
      <p className="text-[10px] text-erewhon-medium tracking-wide uppercase mt-1">
        {unit}
      </p>
      <p className="text-[9px] text-erewhon-medium tracking-widest uppercase mt-1">
        {label}
      </p>
    </div>
  );
}
