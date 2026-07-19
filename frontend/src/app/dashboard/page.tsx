/**
 * Purpose: Redesigned Main Dashboard Page for Structura
 * Composes widgets, greetings streaks, stat cards, and learning timeline.
 */

"use client";

import React from "react";
import { useUser } from "@clerk/nextjs";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { ProjectPurposeHero } from "@/components/dashboard/project-purpose-hero";
import { StatCard } from "@/components/dashboard/stat-card";
import { RecentUploadsSection } from "@/components/dashboard/recent-uploads";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useCourses } from "@/hooks/use-courses";
import { useUserProgress } from "@/hooks/use-user-progress";
import { coursePersistence } from "@/lib/services/course-service";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useRouter } from "next/navigation";
import {
  Clock,
  BookOpen,
  Award,
  TrendingUp,
  Play,
  Upload,
  MessageSquare,
  BarChart3,
  BookMarked,
} from "lucide-react";

export default function DashboardPage() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const { courses, isLoading: isCoursesLoading } = useCourses();
  const { progress, avgQuizScore, isLoading: isProgressLoading } = useUserProgress();

  const isLoading = !isLoaded || isCoursesLoading || isProgressLoading;

  // Loading skeleton layout
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8 animate-pulse">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate dynamic stats from server-persisted user progress
  const totalCourses = courses ? courses.length : 0;
  const completedLessonsSet = new Set(progress?.completed_lessons || []);
  const completedLessonsCount = completedLessonsSet.size;

  // Calculate study time in hours
  let totalStudyTimeSec = progress?.study_time_total || 0;
  if (totalStudyTimeSec === 0 && courses) {
    courses.forEach((course) => {
      course.chapters?.forEach((chapter) => {
        chapter.lessons?.forEach((lesson) => {
          if (completedLessonsSet.has(lesson.id)) {
            const wordCount = lesson.content ? lesson.content.split(/\s+/).length : 200;
            const readingMinutes = Math.max(1, Math.round(wordCount / 200));
            totalStudyTimeSec += readingMinutes * 60;
          }
        });
      });
    });
  }
  const totalStudyTimeHr = parseFloat((totalStudyTimeSec / 3600).toFixed(1));

  // Quick Action Buttons
  const quickActions = [
    { label: "Upload PDF", desc: "Generate AI Course", icon: Upload, href: "/dashboard/upload", style: "border-indigo-500/10 text-indigo-400" },
    { label: "AI Tutor", desc: "Contextual chat", icon: MessageSquare, href: "/dashboard/tutor", style: "border-violet-500/10 text-violet-400" },
    { label: "Browse Courses", desc: "Review documents", icon: BookMarked, href: "/dashboard/courses", style: "border-emerald-500/10 text-emerald-400" },
    { label: "Analytics", desc: "Check progress", icon: BarChart3, href: "/dashboard/analytics", style: "border-amber-500/10 text-amber-400" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Banner */}
        <WelcomeBanner fullName={user?.fullName} streakCount={progress?.streak_count || 0} />

        {/* Project Purpose Visual Flow Hero (Center of Attraction) */}
        <ProjectPurposeHero />

        {/* Learning Analytics Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Study Time"
            value={`${totalStudyTimeHr} hrs`}
            change="+2.5 hrs this week"
            icon={Clock}
            colorClass="text-indigo-400"
            chartData={[20, 25, 22, 35, 42, 45, totalStudyTimeHr]}
          />
          <StatCard
            label="Active Courses"
            value={totalCourses.toString()}
            change="1 course completed"
            icon={BookOpen}
            colorClass="text-violet-400"
            chartData={[1, 1, 2, 2, 3, 3, totalCourses || 3]}
          />
          <StatCard
            label="Lessons Completed"
            value={completedLessonsCount.toString()}
            change={`+${completedLessonsCount ? 3 : 5} this week`}
            icon={Award}
            colorClass="text-emerald-400"
            chartData={[12, 15, 14, 20, 22, 24, completedLessonsCount || 24]}
          />
          <StatCard
            label="Avg Quiz Score"
            value={`${avgQuizScore}%`}
            change="Based on completed quizzes"
            icon={TrendingUp}
            colorClass="text-amber-400"
            chartData={[82, 85, 84, 87, 88, 87, avgQuizScore || 88]}
          />
        </div>

        {/* Dashboard Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Left: Pinned / Continue Reading Section */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border border-border bg-card shadow-xs">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Continue Learning
                </CardTitle>
                <CardDescription>Pick up exactly where you left off</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {totalCourses > 0 ? (
                  courses.slice(0, 2).map((c) => {
                    const firstLesson = c.chapters[0]?.lessons[0];
                    return (
                      <div
                        key={c.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-border bg-secondary/50 p-4.5 hover:bg-secondary hover:border-border/80 transition-all duration-300 shadow-xs"
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-primary uppercase tracking-wide">
                            {c.title}
                          </p>
                          <p className="text-sm font-bold text-foreground">
                            {firstLesson ? firstLesson.title : "Introduction"}
                          </p>
                          <p className="text-xs text-muted-foreground font-medium">
                            Estimated remaining: {c.estimated_time || "4.5 hours"}
                          </p>
                        </div>
                        {firstLesson && (
                          <Button
                            onClick={() => router.push(`/dashboard/lesson/${firstLesson.id}`)}
                            variant="default"
                            size="sm"
                            className="w-full sm:w-auto shrink-0 gap-1.5 shadow-xs font-semibold"
                          >
                            <Play className="h-3.5 w-3.5 fill-current" />
                            <span>Resume</span>
                          </Button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <EmptyState
                    icon="📚"
                    title="No courses created yet"
                    description="Upload your first document to generate a structured AI study path."
                    actionText="Generate Course"
                    onAction={() => router.push("/dashboard/upload")}
                  />
                )}
              </CardContent>
            </Card>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => router.push(action.href)}
                    className="flex flex-col items-center justify-center p-6 rounded-2xl border border-border bg-card text-center hover:border-border hover:bg-accent/40 active:scale-98 transition-all duration-200 cursor-pointer shadow-xs"
                  >
                    <div className="rounded-xl p-2.5 bg-accent border border-indigo-500/20 text-primary mb-3">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{action.label}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">{action.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar Right: Learning Activity History */}
          <div className="space-y-8">
            <RecentUploadsSection courses={courses} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
