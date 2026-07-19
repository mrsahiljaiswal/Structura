/**
 * Purpose: Greeting Streak Banner for Structura Main Dashboard
 * Displays Clerk user details, streak flames, and active learning goals.
 */

import React from "react";
import { Sparkles, Flame, Calendar, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { coursePersistence } from "@/lib/services/course-service";

interface WelcomeBannerProps {
  fullName?: string | null;
  streakCount?: number;
}

export function WelcomeBanner({ fullName, streakCount = 0 }: WelcomeBannerProps) {
  const firstName = fullName ? fullName.split(" ")[0] : "Learner";

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <Card className="p-8 border border-border bg-card shadow-xs relative overflow-hidden">
      {/* Visual decorative nodes */}
      <div className="absolute right-[-10%] top-[-20%] h-60 w-60 rounded-full bg-indigo-500/5 blur-[80px] pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
            <Sparkles className="h-4 w-4" />
            <span>Learning Dashboard</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            Transform your documents into structured learning paths. Select a course below or upload a new document to generate lessons.
          </p>
        </div>

        {/* Dynamic Streak Badge Card */}
        <div className="flex items-center gap-4 bg-secondary border border-border rounded-2xl p-4 shrink-0 shadow-xs">
          <div className="h-12 w-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Flame className="h-6 w-6 fill-current animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black text-foreground">
                {streakCount}
              </span>
              <span className="text-xs font-semibold text-muted-foreground uppercase">Days</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {streakCount > 0 ? "Keep your streak active today!" : "Start study to ignite your streak!"}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
