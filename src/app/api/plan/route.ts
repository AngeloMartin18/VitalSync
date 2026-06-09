import { NextRequest, NextResponse } from "next/server";
import { saveWeeklyPlan, getWeeklyPlan, getDailyGoals, setDailyGoals } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const weekStart = searchParams.get("week_start");
  const goals = searchParams.get("goals");

  try {
    if (goals === "true") {
      return NextResponse.json(getDailyGoals());
    }

    if (weekStart) {
      const plan = getWeeklyPlan(weekStart);
      return NextResponse.json(plan || { week_start: weekStart, plan_data: null });
    }

    return NextResponse.json({ week_start: null, plan_data: null });
  } catch (error) {
    console.error("Plan fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch plan" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.goals) {
      const goals = setDailyGoals(body.goals);
      return NextResponse.json(goals, { status: 201 });
    }

    if (!body.week_start || !body.plan_data) {
      return NextResponse.json(
        { error: "week_start and plan_data are required" },
        { status: 400 }
      );
    }

    const plan = saveWeeklyPlan(body.week_start, body.plan_data);
    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Plan save error:", error);
    return NextResponse.json(
      { error: "Failed to save plan" },
      { status: 500 }
    );
  }
}
