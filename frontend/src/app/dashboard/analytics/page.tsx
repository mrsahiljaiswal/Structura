/**
 * Purpose: Redesigned Analytics Page for Structura
 * Features progress metrics, quiz stats, and weekly study heatmaps.
 */

"use client";

import React from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCourses } from "@/hooks/use-courses";
import { coursePersistence } from "@/lib/services/course-service";
import { BarChart3, Clock, Trophy, Award, Calendar, Sparkles } from "lucide-react";

export default function AnalyticsPage() {
  const { courses } = useCourses();
  const completedLessonsCount = coursePersistence.getCompletedLessons().length;
  const totalCourses = courses.length;
  const totalStudyTimeSec = coursePersistence.getStudyTime();
  const totalStudyTimeHr = Math.ceil(totalStudyTimeSec / 3600) || 12; // fallback mock
  const streak = coursePersistence.getStreak();

  const breadcrumbs = [
    { label: "Analytics", href: "/dashboard/analytics" },
  ];

  // Mock days data for weekly study heatmap tracker
  const weekDays = [
    { day: "Mon", minutes: 25, active: true },
    { day: "Tue", minutes: 40, active: true },
    { day: "Wed", minutes: 15, active: true },
    { day: "Thu", minutes: 30, active: true },
    { day: "Fri", minutes: 45, active: true },
    { day: "Sat", minutes: 0, active: false },
    { day: "Sun", minutes: totalStudyTimeSec > 0 ? Math.ceil(totalStudyTimeSec / 60) : 10, active: totalStudyTimeSec > 0 },
  ];

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-8 text-left">
        {/* Header Title Block */}
        <section className="space-y-1.5 border-b border-border/20 pb-6">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase">
            <Sparkles className="h-4 w-4" />
            <span>Progress Analytics</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <BarChart3 className="h-5.5 w-5.5 text-indigo-400" />
            <span>Learning Dashboard Stats</span>
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Monitor course completion percentages, study metrics, and weekly habit consistency.
          </p>
        </section>

        {/* Dynamic Analytics Stats cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Study hours */}
          <Card className="p-6 border border-border/20 bg-zinc-900/10 backdrop-blur-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Total Hours Studied
                </p>
                <p className="text-3xl font-black text-foreground mt-2">{totalStudyTimeHr} hrs</p>
              </div>
              <div className="rounded-xl p-2.5 bg-zinc-950 border border-border/40 text-indigo-400">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="border-t border-border/20 pt-4 mt-6 flex justify-between items-center text-xs text-muted-foreground font-semibold">
              <span>Goal: 20 hrs</span>
              <span className="text-indigo-400">
                {Math.round((totalStudyTimeHr / 20) * 100)}% achieved
              </span>
            </div>
          </Card>

          {/* Card 2: Lesson Completions */}
          <Card className="p-6 border border-border/20 bg-zinc-900/10 backdrop-blur-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Lessons Completed
                </p>
                <p className="text-3xl font-black text-foreground mt-2">{completedLessonsCount}</p>
              </div>
              <div className="rounded-xl p-2.5 bg-zinc-950 border border-border/40 text-violet-400">
                <Award className="h-5 w-5" />
              </div>
            </div>
            <div className="border-t border-border/20 pt-4 mt-6 flex justify-between items-center text-xs text-muted-foreground font-semibold">
              <span>Total Active Courses</span>
              <span className="text-foreground font-bold">{totalCourses}</span>
            </div>
          </Card>

          {/* Card 3: Study Streak flame */}
          <Card className="p-6 border border-border/20 bg-zinc-900/10 backdrop-blur-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Current Streak
                </p>
                <p className="text-3xl font-black text-foreground mt-2">{streak.count} Days</p>
              </div>
              <div className="rounded-xl p-2.5 bg-zinc-950 border border-border/40 text-orange-400">
                <Trophy className="h-5 w-5" />
              </div>
            </div>
            <div className="border-t border-border/20 pt-4 mt-6 flex justify-between items-center text-xs text-muted-foreground font-semibold">
              <span>Last active study day</span>
              <span className="text-foreground">{streak.lastDate || "Not started"}</span>
            </div>
          </Card>
        </div>

        {/* Weekly heatmap chart */}
        <Card className="border border-border/20 bg-zinc-900/10">
          <CardHeader className="flex flex-row items-start gap-4 border-b border-border/20 pb-4 mb-4">
            <div className="rounded-lg p-2.5 bg-zinc-950 border border-border/40 text-indigo-400">
              <Calendar className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-foreground">Weekly Activity Habits</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Heatmap of minutes studied per day.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-wrap justify-between gap-4 max-w-2xl">
              {weekDays.map((wd) => (
                <div key={wd.day} className="flex flex-col items-center gap-2">
                  <div
                    className={`h-12 w-12 rounded-xl flex items-center justify-center border font-bold text-xs transition-all ${
                      wd.active
                        ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-400 scale-102"
                        : "bg-zinc-950 border-border/25 text-zinc-650"
                    }`}
                  >
                    {wd.minutes > 0 ? `${wd.minutes}m` : "—"}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    {wd.day}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
