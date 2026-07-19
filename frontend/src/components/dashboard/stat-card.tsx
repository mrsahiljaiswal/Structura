/**
 * Purpose: Premium Stat Card Component for Structura Dashboard
 * Renders numerical indexes, change stats, and a mini SVG trendline.
 */

import React from "react";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  icon: LucideIcon;
  colorClass: string;
  chartData?: number[];
}

export function StatCard({
  label,
  value,
  change,
  icon: Icon,
  colorClass,
  chartData = [20, 40, 25, 50, 45, 60, 55],
}: StatCardProps) {
  // SVG Micro Line Chart Calculation
  const width = 120;
  const height = 40;
  const padding = 2;
  const points = chartData
    .map((val, idx) => {
      const x = padding + (idx / (chartData.length - 1)) * (width - padding * 2);
      const min = Math.min(...chartData);
      const max = Math.max(...chartData);
      const range = max - min || 1;
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <Card className="p-6 relative flex flex-col justify-between overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <p className="text-3xl font-bold text-foreground tracking-tight mt-1">
            {value}
          </p>
        </div>

        {/* Icon Block */}
        <div className="rounded-xl p-2.5 bg-accent border border-indigo-500/20 text-primary shadow-xs">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {/* Footer SVG Micro Line Chart & Change details */}
      <div className="flex items-end justify-between mt-6">
        <p className="text-xs text-muted-foreground font-medium select-none">
          {change}
        </p>

        {/* SVG Sparkline */}
        <svg width={width} height={height} className="overflow-visible opacity-80">
          <polyline
            fill="none"
            stroke="url(#sparkline-gradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
          <defs>
            <linearGradient id="sparkline-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="oklch(0.60 0.22 280)" />
              <stop offset="100%" stopColor="oklch(0.50 0.22 310)" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </Card>
  );
}
