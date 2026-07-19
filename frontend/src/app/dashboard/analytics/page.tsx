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

  // Calculate total study time dynamically based on word counts of completed lessons
  let totalStudyTimeSec = 0;
  courses.forEach((course) => {
    course.chapters.forEach((chapter) => {
      chapter.lessons.forEach((lesson) => {
        if (coursePersistence.isLessonCompleted(lesson.id)) {
          const wordCount = lesson.content ? lesson.content.split(/\s+/).length : 0;
          const readingMinutes = Math.max(1, Math.round(wordCount / 200));
          totalStudyTimeSec += readingMinutes * 60;
        }
      });
    });
  });
  const totalStudyTimeHr = parseFloat((totalStudyTimeSec / 3600).toFixed(1));
  const streak = coursePersistence.getStreak();

  const breadcrumbs = [
    { label: "Analytics", href: "/dashboard/analytics" },
  ];

  // Fetch actual per-day study minutes from localStorage
  const byDay = coursePersistence.getStudyTimeByDay();
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
    const seconds = byDay[day] || 0;
    const minutes = Math.round(seconds / 60);
    return {
      day,
      minutes,
      active: minutes > 0,
    };
  });

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
          <Card className="p-6 border border-border bg-card shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Total Hours Studied
                </p>
                <p className="text-3xl font-black text-foreground mt-2">{totalStudyTimeHr} hrs</p>
              </div>
              <div className="rounded-xl p-2.5 bg-accent border border-indigo-500/20 text-primary">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="border-t border-border/40 pt-4 mt-6 flex justify-between items-center text-xs text-muted-foreground font-semibold">
              <span>Goal: 20 hrs</span>
              <span className="text-primary font-bold">
                {Math.round((totalStudyTimeHr / 20) * 100)}% achieved
              </span>
            </div>
          </Card>

          {/* Card 2: Lesson Completions */}
          <Card className="p-6 border border-border bg-card shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Lessons Completed
                </p>
                <p className="text-3xl font-black text-foreground mt-2">{completedLessonsCount}</p>
              </div>
              <div className="rounded-xl p-2.5 bg-accent border border-indigo-500/20 text-primary">
                <Award className="h-5 w-5" />
              </div>
            </div>
            <div className="border-t border-border/40 pt-4 mt-6 flex justify-between items-center text-xs text-muted-foreground font-semibold">
              <span>Total Active Courses</span>
              <span className="text-foreground font-bold">{totalCourses}</span>
            </div>
          </Card>

          {/* Card 3: Study Streak flame */}
          <Card className="p-6 border border-border bg-card shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Current Streak
                </p>
                <p className="text-3xl font-black text-foreground mt-2">{streak.count} Days</p>
              </div>
              <div className="rounded-xl p-2.5 bg-accent border border-indigo-500/20 text-primary">
                <Trophy className="h-5 w-5" />
              </div>
            </div>
            <div className="border-t border-border/40 pt-4 mt-6 flex justify-between items-center text-xs text-muted-foreground font-semibold">
              <span>Last active study day</span>
              <span className="text-foreground font-semibold">{streak.lastDate || "Not started"}</span>
            </div>
          </Card>
        </div>

        {/* Weekly heatmap chart */}
        <Card className="border border-border bg-card shadow-xs">
          <CardHeader className="flex flex-row items-start gap-4 border-b border-border/40 pb-4 mb-4">
            <div className="rounded-lg p-2.5 bg-accent border border-indigo-500/20 text-primary">
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
                        ? "bg-accent border-primary text-primary font-bold shadow-xs scale-102"
                        : "bg-secondary border-border text-muted-foreground"
                    }`}
                  >
                    {wd.minutes > 0 ? `${wd.minutes}m` : "—"}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
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
