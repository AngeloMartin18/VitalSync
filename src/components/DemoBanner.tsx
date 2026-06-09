"use client";

import { useState, useEffect } from "react";

export default function DemoBanner() {
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    fetch("/api/demo")
      .then((res) => res.json())
      .then((data) => setIsDemo(data.demo === true))
      .catch(() => setIsDemo(true));
  }, []);

  if (!isDemo) return null;

  return (
    <div className="bg-erewhon-black text-erewhon-white px-4 py-2.5 text-center">
      <p className="text-xs tracking-wide font-light">
        Demo mode — limited food database.{" "}
        <a
          href="https://developer.nutritionix.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 font-medium hover:text-erewhon-light transition-colors"
        >
          Get Nutritionix API keys
        </a>{" "}
        and add to <code className="bg-white/20 px-1.5 py-0.5 text-[10px] font-mono tracking-normal">.env.local</code>
      </p>
    </div>
  );
}
