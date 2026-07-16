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
}

export function WelcomeBanner({ fullName }: WelcomeBannerProps) {
  const firstName = fullName ? fullName.split(" ")[0] : "Learner";
  const streak = coursePersistence.getStreak();

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <Card className="p-8 border-none bg-gradient-to-br from-indigo-900/20 via-violet-900/10 to-zinc-950/50 relative overflow-hidden">
      {/* Visual decorative nodes */}
      <div className="absolute right-[-10%] top-[-20%] h-60 w-60 rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none" />
      <div className="absolute left-[-10%] bottom-[-20%] h-40 w-40 rounded-full bg-violet-500/5 blur-[80px] pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase">
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
        <div className="flex items-center gap-4 bg-zinc-900/40 border border-border/40 backdrop-blur-md rounded-2xl p-4 shrink-0 shadow-lg shadow-indigo-500/[0.01]">
          <div className="h-12 w-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Flame className="h-6 w-6 fill-current animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black text-foreground">
                {streak.count}
              </span>
              <span className="text-xs font-semibold text-muted-foreground uppercase">Days</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {streak.count > 0 ? "Keep your streak active today!" : "Start study to ignite your streak!"}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
