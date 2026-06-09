import { NextRequest, NextResponse } from "next/server";
import { searchFood } from "@/lib/nutritionix";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: "Query parameter 'q' must be at least 2 characters" },
      { status: 400 }
    );
  }

  try {
    const results = await searchFood(query);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Food search error:", error);
    return NextResponse.json(
      { error: "Failed to search for foods" },
      { status: 500 }
    );
  }
}
