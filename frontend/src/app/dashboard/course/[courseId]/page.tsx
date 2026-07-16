/**
 * Purpose: Redesigned Course Overview Page for Structura
 * Features expandable chapter panels, details statistics, and progress hooks.
 */

"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { CourseProgress } from "@/components/courses/course-progress";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { coursePersistence } from "@/lib/services/course-service";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock,
  Award,
  BookMarked,
  ArrowLeft,
  Pin,
  Heart,
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  position: number;
}

interface Chapter {
  id: number;
  title: string;
  position: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description?: string;
  difficulty?: string;
  estimated_time?: string;
  chapters: Chapter[];
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;

  // Track expanded chapters in state
  const [expandedChapters, setExpandedChapters] = useState<Record<number, boolean>>({ 1: true });
  const [isPinned, setIsPinned] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Fetch course using React Query
  const { data: course, isLoading, isError, error } = useQuery<Course>({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const res = await api.get(`/api/v1/courses/${courseId}`);
      return res.data;
    },
    enabled: !!courseId,
  });

  // Check pin and favorite status on load
  React.useEffect(() => {
    if (course) {
      setIsPinned(coursePersistence.getPinnedCourses().some((p) => p.id === course.id));
      setIsFavorite(coursePersistence.getFavorites().includes(course.id));
    }
  }, [course]);

  const togglePin = () => {
    if (!course) return;
    if (isPinned) {
      coursePersistence.unpinCourse(course.id);
      setIsPinned(false);
    } else {
      coursePersistence.pinCourse(course.id, course.title);
      setIsPinned(true);
    }
  };

  const toggleFavorite = () => {
    if (!course) return;
    coursePersistence.toggleFavorite(course.id);
    setIsFavorite((prev) => !prev);
  };

  const toggleChapter = (chapterId: number) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-pulse">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <div className="grid grid-cols-4 gap-6">
            <Skeleton className="h-80 col-span-1 rounded-2xl" />
            <Skeleton className="h-80 col-span-3 rounded-2xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !course) {
    return (
      <DashboardLayout>
        <EmptyState
          icon="⚠️"
          title="Failed to load course"
          description={error instanceof Error ? error.message : "The requested course could not be retrieved from the database."}
          actionText="Back to Courses"
          onAction={() => router.push("/dashboard/courses")}
        />
      </DashboardLayout>
    );
  }

  const breadcrumbs = [
    { label: "My Courses", href: "/dashboard/courses" },
    { label: course.title },
  ];

  // Count total lessons & completed lessons
  const totalLessons = course.chapters.reduce((acc, ch) => acc + ch.lessons.length, 0);
  const completedLessons = coursePersistence.getCompletedLessons();
  const completedCount = course.chapters.reduce(
    (acc, ch) => acc + ch.lessons.filter((l) => completedLessons.includes(l.id)).length,
    0
  );

  // Resume button logic: find first uncompleted lesson
  let resumeLessonId = "";
  for (const ch of course.chapters) {
    for (const l of ch.lessons) {
      if (!completedLessons.includes(l.id)) {
        resumeLessonId = l.id;
        break;
      }
    }
    if (resumeLessonId) break;
  }
  // Fallback to first lesson
  if (!resumeLessonId && course.chapters[0]?.lessons[0]) {
    resumeLessonId = course.chapters[0].lessons[0].id;
  }

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-8">
        {/* Back navigation & Actions row */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => router.push("/dashboard/courses")}
            variant="ghost"
            size="sm"
            className="rounded-lg gap-1.5 text-zinc-400 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>All Courses</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFavorite}
              className="rounded-xl text-zinc-400 hover:text-red-400"
              aria-label="Favorite course"
            >
              <Heart className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePin}
              className={`rounded-xl ${isPinned ? "text-indigo-400" : "text-zinc-400 hover:text-foreground"}`}
              aria-label="Pin course to sidebar"
            >
              <Pin className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Course Details Jumbotron */}
        <Card className="p-8 border-none bg-gradient-to-br from-indigo-950/20 via-violet-950/10 to-zinc-950/50 relative overflow-hidden">
          <div className="absolute right-[-10%] top-[-25%] h-60 w-60 rounded-full bg-indigo-500/10 blur-[90px] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl text-left">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info">{course.difficulty || "Intermediate"}</Badge>
                <Badge variant="outline">{totalLessons} Lessons</Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight leading-tight">
                {course.title}
              </h1>
              {course.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {course.description}
                </p>
              )}
            </div>

            {/* Progress Radial Ring and Resume Actions */}
            <div className="flex flex-col items-start md:items-end gap-4 shrink-0">
              <CourseProgress course={course} size={52} strokeWidth={4.5} />
              {resumeLessonId && (
                <Button
                  onClick={() => router.push(`/dashboard/lesson/${resumeLessonId}`)}
                  className="rounded-xl h-10 w-full md:w-auto px-6 gap-2"
                >
                  <BookOpen className="h-4.5 w-4.5" />
                  <span>Resume Course</span>
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Detailed Outline Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column: Quick Stats Card */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-5 border border-border/20 bg-zinc-900/10 backdrop-blur-sm">
              <CardHeader className="p-0 pb-4 mb-4 border-b border-border/20">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Course Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-4 text-xs font-medium text-zinc-350">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Chapters</span>
                  <span className="text-foreground font-bold">{course.chapters.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Total Lessons</span>
                  <span className="text-foreground font-bold">{totalLessons}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Completed</span>
                  <span className="text-emerald-400 font-bold">{completedCount}/{totalLessons}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Estimated Duration</span>
                  <span className="text-foreground font-bold">{course.estimated_time || "4.5 hours"}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Outline Chapters Accordion Tree */}
          <div className="lg:col-span-3 space-y-4">
            <h2 className="text-lg font-bold text-foreground tracking-tight border-b border-border/20 pb-3 mb-4 flex items-center gap-2">
              <BookMarked className="h-5 w-5 text-indigo-400" />
              <span>Chapters Outline Tree</span>
            </h2>

            {course.chapters.map((ch) => {
              const isExpanded = !!expandedChapters[ch.id];
              const completedInChapter = ch.lessons.filter((l) => completedLessons.includes(l.id)).length;
              const isChapterDone = completedInChapter === ch.lessons.length;

              return (
                <Card
                  key={ch.id}
                  className={cn(
                    "overflow-hidden border transition-colors duration-200",
                    isChapterDone ? "border-emerald-500/10 bg-emerald-500/[0.01]" : "border-border/30"
                  )}
                >
                  {/* Chapter Header */}
                  <div
                    onClick={() => toggleChapter(ch.id)}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-900/25 transition-colors select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider bg-zinc-900 border border-border/20 rounded-md px-2 py-0.5">
                        Ch {ch.position}
                      </span>
                      <h3 className="font-bold text-sm text-foreground truncate">{ch.title}</h3>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold shrink-0">
                      <span className={cn(isChapterDone ? "text-emerald-400" : "text-zinc-500")}>
                        {completedInChapter}/{ch.lessons.length} Done
                      </span>
                      {isExpanded ? <ChevronDown className="h-4.5 w-4.5 text-zinc-500" /> : <ChevronRight className="h-4.5 w-4.5 text-zinc-500" />}
                    </div>
                  </div>

                  {/* Chapter Lessons List Dropdown */}
                  {isExpanded && (
                    <div className="border-t border-border/10 bg-zinc-950/20 p-2 space-y-1">
                      {ch.lessons.map((l) => {
                        const isLessonDone = completedLessons.includes(l.id);
                        return (
                          <div
                            key={l.id}
                            onClick={() => router.push(`/dashboard/lesson/${l.id}`)}
                            className={cn(
                              "flex items-center justify-between rounded-xl px-4 py-3 cursor-pointer transition-colors text-xs font-medium",
                              isLessonDone ? "text-zinc-400 hover:text-foreground" : "text-zinc-200 hover:bg-secondary/40"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-zinc-500">{l.position}.</span>
                              <span className={cn(isLessonDone && "line-through text-zinc-500")}>
                                {l.title}
                              </span>
                            </div>

                            <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border",
                              isLessonDone
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                : "border-border/40 text-zinc-500"
                            )}>
                              {isLessonDone ? "Complete" : "Unread"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
