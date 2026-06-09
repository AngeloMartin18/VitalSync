"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";

interface FoodResult {
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

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

export default function TrackPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<FoodResult | null>(null);
  const [mealType, setMealType] = useState("snack");
  const [servingQty, setServingQty] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [scanning, setScanning] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) return;
    setSearching(true);
    setError("");
    try {
      const res = await fetch(`/api/food/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        setResults(await res.json());
      } else {
        setError("Search failed. Try a different query.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setSearching(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) search(query);
      else setResults([]);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, search]);

  const startScanning = async () => {
    try {
      setScanning(true);
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;
      const videoInputDevices = await reader.listVideoInputDevices();
      if (videoInputDevices.length === 0) {
        setError("No camera found.");
        setScanning(false);
        return;
      }
      const deviceId = videoInputDevices[0].deviceId;
      if (videoRef.current) {
        await reader.decodeFromVideoDevice(deviceId, videoRef.current, (result) => {
          if (result) {
            handleBarcode(result.getText());
          }
        });
      }
    } catch {
      setError("Could not access camera. Please allow camera permissions.");
      setScanning(false);
    }
  };

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    setScanning(false);
  };

  const handleBarcode = async (barcode: string) => {
    stopScanning();
    setBarcodeInput(barcode);
    setSearching(true);
    setError("");
    try {
      const res = await fetch(`/api/food/barcode?barcode=${barcode}`);
      if (res.ok) {
        const food = await res.json();
        setResults([food]);
        setSelected(food);
      } else {
        setError(`No food found for barcode ${barcode}`);
      }
    } catch {
      setError("Network error scanning barcode.");
    }
    setSearching(false);
  };

  const handleManualBarcode = () => {
    if (barcodeInput.trim()) {
      handleBarcode(barcodeInput.trim());
    }
  };

  const selectFood = (food: FoodResult) => {
    setSelected(food);
    setServingQty(food.serving_qty);
    setSaved(false);
  };

  const logMeal = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const multiplier = servingQty / selected.serving_qty;
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          food_name: selected.food_name,
          brand_name: selected.brand_name,
          serving_qty: servingQty,
          serving_unit: selected.serving_unit,
          serving_weight_grams: selected.serving_weight_grams
            ? Math.round(selected.serving_weight_grams * multiplier)
            : undefined,
          calories: Math.round(selected.calories * multiplier),
          protein_g: Math.round(selected.protein_g * multiplier * 10) / 10,
          carbs_g: Math.round(selected.carbs_g * multiplier * 10) / 10,
          fat_g: Math.round(selected.fat_g * multiplier * 10) / 10,
          fiber_g: Math.round(selected.fiber_g * multiplier * 10) / 10,
          barcode: barcodeInput || undefined,
          meal_type: mealType,
          photo_url: selected.photo_url,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => {
          setSelected(null);
          setSaved(false);
          setBarcodeInput("");
          setQuery("");
          setResults([]);
          setServingQty(1);
        }, 1500);
      } else {
        setError("Failed to log meal.");
      }
    } catch {
      setError("Network error logging meal.");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-16">
      {/* Hero */}
      <div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tightest">
          Track Food
        </h1>
      </div>

      {/* Search + Scan */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search foods..."
              className="w-full pl-0 pr-4 py-3 border-b border-erewhon-border bg-transparent text-sm tracking-tight placeholder:text-erewhon-medium focus:outline-none focus:border-erewhon-black transition-colors"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 border-2 border-erewhon-border border-t-erewhon-black rounded-full animate-spin" />
              </div>
            )}
          </div>

          <button
            onClick={scanning ? stopScanning : startScanning}
            className={`flex items-center gap-2 px-5 text-xs tracking-widest uppercase font-semibold transition-colors ${
              scanning
                ? "bg-red-600 text-white"
                : "border border-erewhon-black text-erewhon-black hover:bg-erewhon-black hover:text-white"
            }`}
          >
            {scanning ? "Stop" : "Scan"}
          </button>
        </div>

        {/* Manual barcode */}
        <div className="flex gap-3">
          <input
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder="Or enter barcode..."
            className="flex-1 px-0 py-2 border-b border-erewhon-border bg-transparent text-sm tracking-tight placeholder:text-erewhon-medium focus:outline-none focus:border-erewhon-black transition-colors"
            onKeyDown={(e) => e.key === "Enter" && handleManualBarcode()}
          />
          <button
            onClick={handleManualBarcode}
            disabled={!barcodeInput.trim()}
            className="px-4 py-2 border border-erewhon-black text-erewhon-black text-xs tracking-widest uppercase font-semibold hover:bg-erewhon-black hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Lookup
          </button>
        </div>

        {/* Camera */}
        {scanning && (
          <div className="overflow-hidden bg-erewhon-black">
            <video ref={videoRef} className="w-full max-h-64" />
          </div>
        )}

        {error && (
          <p className="text-xs tracking-wide text-red-600 bg-red-50 px-4 py-2">
            {error}
          </p>
        )}
      </div>

      {/* Search Results */}
      {results.length > 0 && !selected && (
        <div>
          <p className="text-[10px] tracking-widest uppercase text-erewhon-medium mb-4">
            {results.length} Results
          </p>
          <div className="divide-y divide-erewhon-border border-t border-erewhon-border">
            {results.map((food, i) => (
              <button
                key={i}
                onClick={() => selectFood(food)}
                className="w-full text-left py-4 flex items-center justify-between hover:bg-erewhon-offwhite transition-colors"
              >
                <div>
                  <p className="text-sm font-medium tracking-tight">{food.food_name}</p>
                  <p className="text-xs text-erewhon-medium mt-0.5">
                    {food.brand_name ? `${food.brand_name} · ` : ""}
                    {food.serving_qty} {food.serving_unit}
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums tracking-tight">
                  {Math.round(food.calories)} kcal
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Food Detail */}
      {selected && (
        <div className="space-y-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tightest">{selected.food_name}</h2>
              {selected.brand_name && (
                <p className="text-sm text-erewhon-medium mt-1 tracking-wide">{selected.brand_name}</p>
              )}
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-erewhon-medium hover:text-erewhon-black transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Serving size */}
          <div>
            <p className="text-[10px] tracking-widest uppercase text-erewhon-medium mb-2">
              Servings
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setServingQty((q) => Math.max(0.25, q - 0.25))}
                className="w-9 h-9 border border-erewhon-border flex items-center justify-center text-sm hover:border-erewhon-black hover:bg-erewhon-offwhite transition-colors"
              >
                &minus;
              </button>
              <input
                type="number"
                value={servingQty}
                onChange={(e) => setServingQty(Number(e.target.value) || 0)}
                step="0.25"
                min="0.25"
                className="w-16 text-center py-2 bg-transparent border-b border-erewhon-border font-semibold text-sm tabular-nums focus:outline-none focus:border-erewhon-black transition-colors"
              />
              <button
                onClick={() => setServingQty((q) => q + 0.25)}
                className="w-9 h-9 border border-erewhon-border flex items-center justify-center text-sm hover:border-erewhon-black hover:bg-erewhon-offwhite transition-colors"
              >
                +
              </button>
              <span className="text-xs text-erewhon-medium tracking-wide uppercase">
                {selected.serving_unit}
              </span>
            </div>
          </div>

          {/* Meal type */}
          <div>
            <p className="text-[10px] tracking-widest uppercase text-erewhon-medium mb-2">
              Meal type
            </p>
            <div className="flex gap-1">
              {MEAL_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setMealType(type)}
                  className={`px-4 py-2 text-xs tracking-widest uppercase transition-colors ${
                    mealType === type
                      ? "bg-erewhon-black text-erewhon-white font-semibold"
                      : "border border-erewhon-border text-erewhon-medium hover:border-erewhon-black hover:text-erewhon-black"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Nutrition */}
          <div className="grid grid-cols-4 gap-4">
            <NutrientBlock
              label="Calories"
              value={Math.round(selected.calories * (servingQty / selected.serving_qty))}
              unit="kcal"
            />
            <NutrientBlock
              label="Protein"
              value={Math.round(selected.protein_g * (servingQty / selected.serving_qty) * 10) / 10}
              unit="g"
            />
            <NutrientBlock
              label="Carbs"
              value={Math.round(selected.carbs_g * (servingQty / selected.serving_qty) * 10) / 10}
              unit="g"
            />
            <NutrientBlock
              label="Fat"
              value={Math.round(selected.fat_g * (servingQty / selected.serving_qty) * 10) / 10}
              unit="g"
            />
          </div>

          {/* Log */}
          <button
            onClick={logMeal}
            disabled={saving || saved}
            className={`w-full py-4 text-xs tracking-widest uppercase font-bold transition-colors ${
              saved
                ? "bg-green-600 text-white"
                : "bg-erewhon-black text-erewhon-white hover:bg-erewhon-accent"
            } disabled:opacity-50`}
          >
            {saved ? "Logged" : saving ? "Logging…" : `Log ${mealType}`}
          </button>
        </div>
      )}
    </div>
  );
}

function NutrientBlock({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="border border-erewhon-border p-4 text-center">
      <p className="text-2xl font-bold tabular-nums tracking-tightest">{value}</p>
      <p className="text-[10px] text-erewhon-medium tracking-wide uppercase mt-1">{unit}</p>
      <p className="text-[9px] text-erewhon-medium tracking-widest uppercase mt-0.5">
        {label}
      </p>
    </div>
  );
}
