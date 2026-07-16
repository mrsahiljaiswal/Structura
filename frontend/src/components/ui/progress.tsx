/**
 * Purpose: Progress indicators for Structura
 * Supports standard horizontal loading bars and radial circular progress meters.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

// Linear Horizontal Progress Component
interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => {
    const safeValue = Math.min(100, Math.max(0, value));

    return (
      <div
        ref={ref}
        className={cn("relative h-2 w-full overflow-hidden rounded-full bg-secondary/80", className)}
        {...props}
      >
        <div
          className="h-full w-full flex-1 bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 ease-out"
          style={{ transform: `translateX(-${100 - safeValue}%)` }}
        />
      </div>
    );
  }
);
Progress.displayName = "Progress";

// Circular Radial Progress Component
interface RadialProgressProps extends React.HTMLAttributes<SVGElement> {
  value?: number;
  size?: number;
  strokeWidth?: number;
}

const RadialProgress = React.forwardRef<SVGSVGElement, RadialProgressProps>(
  ({ className, value = 0, size = 48, strokeWidth = 4, ...props }, ref) => {
    const safeValue = Math.min(100, Math.max(0, value));
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (safeValue / 100) * circumference;

    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={cn("transform -rotate-90", className)}
        {...props}
      >
        {/* Underlay Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--secondary)"
          className="opacity-40"
          strokeWidth={strokeWidth}
        />
        {/* Indicator Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progress-gradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
        {/* Gradient Defs */}
        <defs>
          <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.60 0.22 280)" />
            <stop offset="100%" stopColor="oklch(0.50 0.22 310)" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
);
RadialProgress.displayName = "RadialProgress";

export { Progress, RadialProgress };
