"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/track", label: "Track" },
  { href: "/plan", label: "Plan" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-erewhon-white/95 backdrop-blur-sm border-b border-erewhon-border">
      <div className="max-w-6xl mx-auto px-6 md:px-12 flex items-center justify-between h-16">
        {/* Logo — monospaced Erewhon-inspired */}
        <Link
          href="/"
          className="group flex items-center gap-1"
        >
          <span className="text-lg font-bold tracking-tightest text-erewhon-black">
            VITAL
          </span>
          <span className="text-lg font-light tracking-wider text-erewhon-medium">
            SYNC
          </span>
        </Link>

        {/* Nav links — uppercase, minimal */}
        <div className="flex items-center gap-6">
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`text-xs tracking-widest uppercase transition-colors duration-200 relative py-1 ${
                  active
                    ? "text-erewhon-black font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-erewhon-black"
                    : "text-erewhon-medium hover:text-erewhon-black"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
