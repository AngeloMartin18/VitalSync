"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Meal {
  id: number;
  food_name: string;
  brand_name?: string;
  meal_type: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  logged_at: string;
}

interface Totals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  meals: Meal[];
}

interface Goals {
  calorie_target: number;
  protein_target_g: number;
  carbs_target_g: number;
  fat_target_g: number;
}

export default function DashboardPage() {
  const [totals, setTotals] = useState<Totals | null>(null);
  const [goals, setGoals] = useState<Goals | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    const [mealsRes, goalsRes] = await Promise.all([
      fetch("/api/meals"),
      fetch("/api/plan?goals=true"),
    ]);
    if (mealsRes.ok) setTotals(await mealsRes.json());
    if (goalsRes.ok) setGoals(await goalsRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: number) => {
    setDeleting(id);
    await fetch(`/api/meals?id=${id}`, { method: "DELETE" });
    setDeleting(null);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-erewhon-black border-t-transparent" />
      </div>
    );
  }

  const calPct = goals ? (totals?.calories || 0) / goals.calorie_target * 100 : 0;

  return (
    <div className="space-y-16">
      {/* Hero Header */}
      <div className="space-y-3">
        <p className="text-xs tracking-widest uppercase text-erewhon-medium">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tightest">
          Today
        </h1>
      </div>

      {/* Stats Grid — gallery layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        <StatBlock
          label="CALORIES"
          current={totals?.calories || 0}
          target={goals?.calorie_target || 2000}
          unit="kcal"
          over={calPct > 100}
        />
        <StatBlock
          label="PROTEIN"
          current={totals?.protein || 0}
          target={goals?.protein_target_g || 150}
          unit="g"
          over={false}
        />
        <StatBlock
          label="CARBS"
          current={totals?.carbs || 0}
          target={goals?.carbs_target_g || 250}
          unit="g"
          over={false}
        />
        <StatBlock
          label="FAT"
          current={totals?.fat || 0}
          target={goals?.fat_target_g || 65}
          unit="g"
          over={false}
        />
      </div>

      {/* Meals Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xs tracking-widest uppercase text-erewhon-medium">
            Today&apos;s Meals
          </h2>
          <Link
            href="/track"
            className="text-xs tracking-widest uppercase font-semibold text-erewhon-black hover:text-erewhon-medium transition-colors"
          >
            + Add Food &rarr;
          </Link>
        </div>

        {(!totals?.meals || totals.meals.length === 0) ? (
          <div className="border border-erewhon-border py-20 px-8 text-center">
            <p className="text-erewhon-medium text-sm tracking-wide font-light mb-6">
              No meals logged yet
            </p>
            <Link
              href="/track"
              className="inline-block px-8 py-3 bg-erewhon-black text-erewhon-white text-xs tracking-widest uppercase font-semibold hover:bg-erewhon-accent transition-colors"
            >
              Log Your First Meal
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-erewhon-border border-t border-erewhon-border">
            {totals.meals.map((meal) => (
              <div
                key={meal.id}
                className="flex items-center justify-between py-5 hover:bg-erewhon-offwhite transition-colors group px-2 -mx-2"
              >
                <div className="flex items-center gap-5 min-w-0">
                  <span className="text-[10px] tracking-widest uppercase text-erewhon-medium w-16 flex-shrink-0">
                    {meal.meal_type}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium tracking-tight truncate">
                      {meal.food_name}
                    </p>
                    {meal.brand_name && (
                      <p className="text-xs text-erewhon-medium mt-0.5">
                        {meal.brand_name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums tracking-tight">
                      {Math.round(meal.calories)}
                    </p>
                    <p className="text-[10px] text-erewhon-medium tracking-wide uppercase">
                      kcal
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(meal.id)}
                    disabled={deleting === meal.id}
                    className="text-erewhon-medium hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all p-1"
                    title="Remove"
                  >
                    {deleting === meal.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatBlock({
  label,
  current,
  target,
  unit,
  over,
}: {
  label: string;
  current: number;
  target: number;
  unit: string;
  over: boolean;
}) {
  const pct = Math.min((current / target) * 100, 100);

  return (
    <div className="space-y-2">
      <p className="text-[10px] tracking-widest uppercase text-erewhon-medium">
        {label}
      </p>
      <div>
        <span className={`text-3xl md:text-4xl font-bold tracking-tightest tabular-nums ${over ? "text-red-600" : "text-erewhon-black"}`}>
          {Math.round(current)}
        </span>
      </div>
      {/* Minimal progress bar */}
      <div className="h-[2px] bg-erewhon-border">
        <div
          className={`h-full transition-all duration-700 ${over ? "bg-red-600" : "bg-erewhon-black"}`}
          style={{ width: `${over ? 100 : pct}%` }}
        />
      </div>
      <p className="text-[10px] tracking-wide text-erewhon-medium">
        of {Math.round(target)} {unit}
      </p>
    </div>
  );
}
