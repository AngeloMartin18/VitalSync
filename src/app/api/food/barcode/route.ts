import { NextRequest, NextResponse } from "next/server";
import { lookupBarcode } from "@/lib/nutritionix";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get("barcode");

  if (!barcode) {
    return NextResponse.json(
      { error: "Query parameter 'barcode' is required" },
      { status: 400 }
    );
  }

  try {
    const result = await lookupBarcode(barcode);
    if (!result) {
      return NextResponse.json(
        { error: "No food found for this barcode" },
        { status: 404 }
      );
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("Barcode lookup error:", error);
    return NextResponse.json(
      { error: "Failed to lookup barcode" },
      { status: 500 }
    );
  }
}
