/**
 * Purpose: Premium Dynamic Thumbnail Component for Structura Courses
 * Renders a unique Vercel/Linear-like geometric SVG background based on course titles.
 */

import React from "react";
import { cn } from "@/lib/utils";

interface CourseThumbnailProps {
  title: string;
  className?: string;
}

export function CourseThumbnail({ title, className }: CourseThumbnailProps) {
  // Generate a deterministic gradient and geometric pattern based on title string
  const getHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const hash = getHash(title);
  const colorIndex = hash % 5;
  const initial = title.substring(0, 1).toUpperCase();

  // Premium color gradient combos
  const gradients = [
    "from-indigo-600/20 to-violet-600/20 text-indigo-400 border-indigo-500/10",
    "from-emerald-600/20 to-teal-600/20 text-emerald-400 border-emerald-500/10",
    "from-rose-600/20 to-orange-600/20 text-rose-400 border-rose-500/10",
    "from-cyan-600/20 to-blue-600/20 text-cyan-400 border-cyan-500/10",
    "from-amber-600/20 to-red-600/20 text-amber-400 border-amber-500/10",
  ];

  // Unique geometric pattern grids
  const patternType = hash % 3;

  return (
    <div
      className={cn(
        "relative aspect-video w-full rounded-t-xl bg-zinc-950 border-b overflow-hidden flex items-center justify-center bg-gradient-to-br select-none",
        gradients[colorIndex],
        className
      )}
    >
      {/* Geometric SVG Overlays */}
      <svg className="absolute inset-0 w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg">
        {patternType === 0 && (
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
        )}
        {patternType === 1 && (
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="15" cy="15" r="2" fill="currentColor" />
            </pattern>
          </defs>
        )}
        {patternType === 2 && (
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 0 40 L 40 0 M 0 0 L 40 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
        )}
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Radial glow focus */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-zinc-950/80 pointer-events-none" />

      {/* Large Initial */}
      <span className="relative z-10 font-black text-4xl tracking-widest bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 drop-shadow-md">
        {initial}
      </span>
    </div>
  );
}
