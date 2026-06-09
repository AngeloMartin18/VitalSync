import { NextRequest, NextResponse } from "next/server";
import { addMeal, getTodaysMeals, getTodaysTotals, deleteMeal } from "@/lib/db";

export async function GET() {
  try {
    const totals = getTodaysTotals();
    return NextResponse.json(totals);
  } catch (error) {
    console.error("Get meals error:", error);
    return NextResponse.json(
      { error: "Failed to fetch meals" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.food_name || body.calories === undefined) {
      return NextResponse.json(
        { error: "food_name and calories are required" },
        { status: 400 }
      );
    }

    const meal = addMeal({
      food_name: body.food_name,
      brand_name: body.brand_name || undefined,
      serving_qty: body.serving_qty || 1,
      serving_unit: body.serving_unit || "serving",
      serving_weight_grams: body.serving_weight_grams || undefined,
      calories: body.calories,
      protein_g: body.protein_g || 0,
      carbs_g: body.carbs_g || 0,
      fat_g: body.fat_g || 0,
      fiber_g: body.fiber_g || 0,
      barcode: body.barcode || undefined,
      meal_type: body.meal_type || "snack",
      photo_url: body.photo_url || undefined,
    });

    return NextResponse.json(meal, { status: 201 });
  } catch (error) {
    console.error("Add meal error:", error);
    return NextResponse.json(
      { error: "Failed to add meal" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    const deleted = deleteMeal(Number(id));
    if (!deleted) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete meal error:", error);
    return NextResponse.json(
      { error: "Failed to delete meal" },
      { status: 500 }
    );
  }
}
