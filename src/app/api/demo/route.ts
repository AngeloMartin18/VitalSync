import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/nutritionix";

export async function GET() {
  return NextResponse.json({ demo: isDemoMode() });
}
