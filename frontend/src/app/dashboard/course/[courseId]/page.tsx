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
import { FlashcardsDeck, Flashcard } from "@/components/course/flashcards-deck";
import { MindMapViewer } from "@/components/course/mind-map-viewer";
import { CourseCertificate } from "@/components/course/course-certificate";
import { useUser } from "@clerk/nextjs";
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
  GitBranch,
  Layers,
  Download,
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  content?: string;
  key_takeaways?: string[] | null;
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
  const { user } = useUser();
  const courseId = params?.courseId as string;

  const [activeTab, setActiveTab] = useState<"outline" | "flashcards" | "mindmap">("outline");
  const [showCertificate, setShowCertificate] = useState(false);
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

  const completedLessonsCount = course.chapters.reduce((acc, ch) => {
    return acc + ch.lessons.filter((l) => coursePersistence.isLessonCompleted(l.id)).length;
  }, 0);
  const isCourseCompleted = totalLessons > 0 && completedLessonsCount >= totalLessons;

  // Generate Flashcards list from course takeaways
  const flashcardsList: Flashcard[] = [];
  course.chapters.forEach((ch) => {
    ch.lessons.forEach((l) => {
      if (l.key_takeaways && Array.isArray(l.key_takeaways)) {
        l.key_takeaways.forEach((t, i) => {
          const item = t as Record<string, unknown> | string;
          const text = typeof item === "string" ? item : String(item?.concept || item?.title || "");
          if (text) {
            flashcardsList.push({
              id: `${l.id}-${i}`,
              front: `Key Concept in ${l.title}`,
              back: text,
              category: ch.title,
            });
          }
        });
      }
    });
  });

  const handleExportMarkdown = () => {
    let md = `# ${course.title}\n\n${course.description || ""}\n\n`;
    course.chapters.forEach((ch) => {
      md += `## Chapter ${ch.position}: ${ch.title}\n\n`;
      ch.lessons.forEach((l) => {
        md += `### ${l.position}. ${l.title}\n${l.content || "Lesson content notes..."}\n\n`;
      });
    });
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${course.title.toLowerCase().replace(/\s+/g, "_")}_course.md`;
    a.click();
  };

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-8">
        {/* Course Certificate Modal */}
        <CourseCertificate
          isOpen={showCertificate}
          onClose={() => setShowCertificate(false)}
          userName={user?.fullName || user?.firstName || "Student"}
          courseTitle={course.title}
        />

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
              onClick={handleExportMarkdown}
              variant="outline"
              size="sm"
              className="rounded-xl gap-1.5 border-border/40 text-xs text-zinc-300"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Markdown</span>
            </Button>

            {isCourseCompleted ? (
              <Button
                onClick={() => setShowCertificate(true)}
                variant="outline"
                size="sm"
                className="rounded-xl gap-1.5 border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs font-bold shadow-md shadow-amber-500/10"
              >
                <Award className="h-3.5 w-3.5" />
                <span>Get Certificate</span>
              </Button>
            ) : (
              <Button
                onClick={() =>
                  alert(`🔒 Certificate Locked: You must complete all ${totalLessons} lessons in this course to unlock your certificate (${completedLessonsCount}/${totalLessons} completed).`)
                }
                variant="outline"
                size="sm"
                className="rounded-xl gap-1.5 border-border/60 text-muted-foreground text-xs font-semibold opacity-70"
              >
                <Award className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Certificate (Locked: {completedLessonsCount}/{totalLessons})</span>
              </Button>
            )}

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
        <Card className="p-8 border border-border bg-card shadow-xs relative overflow-hidden rounded-3xl">
          <div className="absolute right-[-5%] top-[-25%] h-60 w-60 rounded-full bg-primary/10 blur-[80px] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl text-left">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info" className="bg-primary/10 text-primary border-primary/20">{course.difficulty || "Intermediate"}</Badge>
                <Badge variant="outline" className="border-border text-foreground">{totalLessons} Lessons</Badge>
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
                  className="rounded-xl h-10 w-full md:w-auto px-6 gap-2 bg-primary text-primary-foreground font-semibold shadow-xs hover:opacity-90"
                >
                  <BookOpen className="h-4.5 w-4.5" />
                  <span>Resume Course</span>
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Navigation Tabs Switcher */}
        <div className="flex items-center gap-2 border-b border-border/40 pb-2">
          <button
            onClick={() => setActiveTab("outline")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
              activeTab === "outline"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <BookMarked className="h-4 w-4" />
            <span>Course Outline</span>
          </button>

          <button
            onClick={() => setActiveTab("flashcards")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
              activeTab === "flashcards"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span>AI Flashcards ({flashcardsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("mindmap")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
              activeTab === "mindmap"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <GitBranch className="h-4 w-4 text-primary" />
            <span>AI Concept Map</span>
          </button>
        </div>

        {/* Tab Content Views */}
        {activeTab === "flashcards" && (
          <div className="py-6 animate-in fade-in">
            <FlashcardsDeck cards={flashcardsList} />
          </div>
        )}

        {activeTab === "mindmap" && (
          <div className="py-6 animate-in fade-in">
            <MindMapViewer
              courseTitle={course.title}
              chapters={course.chapters}
              completedLessonIds={completedLessons}
            />
          </div>
        )}

        {activeTab === "outline" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column: Quick Stats Card */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-5 border border-border bg-card shadow-xs rounded-2xl">
              <CardHeader className="p-0 pb-4 mb-4 border-b border-border/40">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Course Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-4 text-xs font-medium">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Chapters</span>
                  <span className="text-foreground font-bold">{course.chapters.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Lessons</span>
                  <span className="text-foreground font-bold">{totalLessons}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{completedCount}/{totalLessons}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Estimated Duration</span>
                  <span className="text-foreground font-bold">{course.estimated_time || "4.5 hours"}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Outline Chapters Accordion Tree */}
          <div className="lg:col-span-3 space-y-4">
            <h2 className="text-lg font-bold text-foreground tracking-tight border-b border-border/40 pb-3 mb-4 flex items-center gap-2">
              <BookMarked className="h-5 w-5 text-primary" />
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
                    "overflow-hidden border bg-card shadow-xs transition-colors duration-200 rounded-2xl",
                    isChapterDone ? "border-emerald-500/30 bg-emerald-500/[0.02]" : "border-border"
                  )}
                >
                  {/* Chapter Header */}
                  <div
                    onClick={() => toggleChapter(ch.id)}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/40 transition-colors select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider bg-accent border border-indigo-500/20 rounded-md px-2.5 py-1">
                        Ch {ch.position}
                      </span>
                      <h3 className="font-bold text-sm text-foreground truncate">{ch.title}</h3>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold shrink-0">
                      <span className={cn(isChapterDone ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-muted-foreground")}>
                        {completedInChapter}/{ch.lessons.length} Done
                      </span>
                      {isExpanded ? <ChevronDown className="h-4.5 w-4.5 text-muted-foreground" /> : <ChevronRight className="h-4.5 w-4.5 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Chapter Lessons List Dropdown */}
                  {isExpanded && (
                    <div className="border-t border-border/40 bg-secondary/30 p-2.5 space-y-1.5">
                      {ch.lessons.map((l) => {
                        const isLessonDone = completedLessons.includes(l.id);
                        return (
                          <div
                            key={l.id}
                            onClick={() => router.push(`/dashboard/lesson/${l.id}`)}
                            className={cn(
                              "flex items-center justify-between rounded-xl px-4 py-3 cursor-pointer transition-colors text-xs font-medium border border-border/30",
                              isLessonDone ? "bg-card text-muted-foreground hover:text-foreground" : "bg-card text-foreground hover:bg-secondary shadow-2xs"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-muted-foreground font-semibold">{l.position}.</span>
                              <span className={cn(isLessonDone && "line-through text-muted-foreground")}>
                                {l.title}
                              </span>
                            </div>

                            <span className={cn("text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md border",
                              isLessonDone
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "border-border text-muted-foreground bg-secondary/60"
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
        )}
      </div>
    </DashboardLayout>
  );
}
