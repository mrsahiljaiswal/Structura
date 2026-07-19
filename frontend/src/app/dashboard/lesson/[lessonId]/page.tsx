/**
 * Purpose: Redesigned Premium Lesson Reader Page for Structura
 * Composes outlines, text readers, sticky scroll progress, and note drawers.
 */

"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { ReaderLayout } from "@/components/layouts/reader-layout";
import { StickyProgress, MarkdownRenderer, NotesPanel, PracticeQuiz, AudioNarrator } from "@/components/reader";
import { useCourses } from "@/hooks/use-courses";
import { coursePersistence } from "@/lib/services/course-service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Pin,
  Clock,
  Sparkles,
  ArrowLeft,
  Bookmark,
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  content?: string;
  examples?: string[] | null;
  key_takeaways?: string[] | null;
  summary?: string | null;
  position: number;
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const lessonId = params?.lessonId as string;
  const rawHighlight = searchParams?.get("highlight") || null;

  const [saving, setSaving] = useState(false);
  const [readTimeSec, setReadTimeSec] = useState(0);
  const [activeHighlight, setActiveHighlight] = useState<string | null>(rawHighlight);
  const [spokenSentence, setSpokenSentence] = useState<string | null>(null);

  // Auto-clear highlight after 4 seconds
  useEffect(() => {
    if (rawHighlight) {
      setActiveHighlight(rawHighlight);
      const timer = setTimeout(() => {
        setActiveHighlight(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [rawHighlight]);

  // 1. Fetch lesson details via React Query
  const { data: lesson, isLoading, isError, error } = useQuery<Lesson>({
    queryKey: ["lesson", lessonId],
    queryFn: async () => {
      const res = await api.get(`/api/v1/lessons/${lessonId}`);
      return res.data;
    },
    enabled: !!lessonId,
  });

  // Fetch lesson practice quiz questions
  const { data: quizData, isLoading: isQuizLoading } = useQuery({
    queryKey: ["lesson-quiz", lessonId],
    queryFn: async () => {
      const res = await api.get(`/api/v1/lessons/${lessonId}/quiz`);
      return res.data;
    },
    enabled: !!lessonId && !isLoading && !!lesson,
  });

  // 2. Scan all cached courses to locate which course owns this lesson
  const { courses } = useCourses();
  const activeCourse = courses.find((c) =>
    c.chapters.some((ch) => ch.lessons.some((l) => l.id === lessonId))
  );

  // Handle marking complete
  const markComplete = async () => {
    if (!lessonId) return;
    setSaving(true);
    try {
      // Calculate lesson word count and estimate reading time (200 WPM)
      const wordCount = lesson?.content ? lesson.content.split(/\s+/).length : 0;
      const readingMinutes = Math.max(1, Math.round(wordCount / 200));
      const readingSeconds = readingMinutes * 60;

      // Add actual lesson reading time to persistent logs
      coursePersistence.addStudyTime(readingSeconds);

      // call backend patch
      await api.patch(`/api/v1/lessons/${lessonId}/complete`);
      // Update client cache
      coursePersistence.toggleLessonComplete(lessonId);
      queryClient.invalidateQueries({ queryKey: ["lesson", lessonId] });
      
      // Navigate to next lesson if available, else go back to course details
      if (nextLesson) {
        router.push(`/dashboard/lesson/${nextLesson.id}`);
      } else if (activeCourse) {
        router.push(`/dashboard/course/${activeCourse.id}`);
      } else {
        router.push("/dashboard/courses");
      }
    } catch (err) {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <ReaderLayout
        leftSidebar={<Skeleton className="h-full w-full rounded-xl" />}
        rightSidebar={<Skeleton className="h-full w-full rounded-xl" />}
      >
        <div className="space-y-6 animate-pulse">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </ReaderLayout>
    );
  }

  if (isError || !lesson) {
    return (
      <ReaderLayout
        leftSidebar={<div className="text-zinc-500 text-xs">Menu failed</div>}
        rightSidebar={<div className="text-zinc-500 text-xs">Notes failed</div>}
      >
        <EmptyState
          icon="⚠️"
          title="Failed to load lesson"
          description={error instanceof Error ? error.message : "The requested lesson is unavailable."}
          actionText="Back to Courses"
          onAction={() => router.push("/dashboard/courses")}
        />
      </ReaderLayout>
    );
  }

  // Calculate previous and next lessons
  const allLessons = activeCourse ? activeCourse.chapters.flatMap((ch) => ch.lessons) : [];
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const breadcrumbs = activeCourse
    ? [
        { label: "My Courses", href: "/dashboard/courses" },
        { label: activeCourse.title, href: `/dashboard/course/${activeCourse.id}` },
        { label: lesson.title },
      ]
    : [{ label: "Lesson Reader" }];

  const isCompleted = coursePersistence.isLessonCompleted(lessonId);

  // Left Column Sidebar outline navigator
  const outlineSidebar = activeCourse ? (
    <div className="space-y-6 text-left h-full flex flex-col">
      <div className="border-b border-border/20 pb-3">
        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
          Course Outline
        </h4>
        <p className="text-xs font-bold text-foreground truncate mt-1">
          {activeCourse.title}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
        {activeCourse.chapters.map((ch) => (
          <div key={ch.id} className="space-y-1.5">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
              Ch {ch.position} • {ch.title}
            </p>
            <div className="space-y-1">
              {ch.lessons.map((l) => {
                const isCurrent = l.id === lessonId;
                const isDone = coursePersistence.isLessonCompleted(l.id);

                return (
                  <button
                    key={l.id}
                    onClick={() => router.push(`/dashboard/lesson/${l.id}`)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors text-left",
                      isCurrent
                        ? "bg-primary text-primary-foreground font-bold"
                        : "text-zinc-400 hover:bg-secondary/40 hover:text-foreground"
                    )}
                  >
                    <span className="truncate pr-2">{l.position}. {l.title}</span>
                    {isDone && (
                      <CheckCircle2 className={cn("h-3.5 w-3.5 shrink-0", isCurrent ? "text-white" : "text-emerald-400")} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : (
    <div className="text-zinc-500 text-xs">No active outline context</div>
  );

  // Right Column Sidebar notes pane
  const notesSidebar = (
    <NotesPanel lessonId={lessonId} lessonTitle={lesson.title} />
  );

  return (
    <ReaderLayout
      leftSidebar={outlineSidebar}
      rightSidebar={notesSidebar}
      breadcrumbs={breadcrumbs}
    >
      {/* Sticky top scroll indicator */}
      <StickyProgress />

      <div className="space-y-8 select-text">
        {/* Header Title Block */}
        <section className="space-y-3 border-b border-border/20 pb-6 text-left">
          <div className="flex items-center gap-2">
            <Badge variant="info">Lesson {lesson.position}</Badge>
            {isCompleted && (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Complete</span>
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight leading-tight select-text">
            {lesson.title}
          </h1>
          <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>Est. 8 min read</span>
            </span>
          </div>
        </section>

        {/* Audio Narration Bar */}
        {lesson.content && (
          <AudioNarrator
            text={lesson.content}
            title={lesson.title}
            lessonId={lessonId}
            onSentenceChange={(s) => setSpokenSentence(s)}
          />
        )}

        {/* Prose Center: Reading content */}
        <section className="prose max-w-none">
          {lesson.content ? (
            <MarkdownRenderer
              content={lesson.content}
              highlightQuery={activeHighlight}
              narrationSentence={spokenSentence}
            />
          ) : (
            <p className="text-muted-foreground italic">No summary content generated for this lesson.</p>
          )}
        </section>

        {/* Key Takeaways list */}
        {lesson.key_takeaways && lesson.key_takeaways.length > 0 && (
          <section className="rounded-2xl border border-border bg-card shadow-xs p-6 space-y-4 text-left">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-primary" />
              <span>Key Takeaways</span>
            </h3>
            <ul className="space-y-2.5 list-none pl-0">
              {lesson.key_takeaways.map((takeaway, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm font-medium text-foreground leading-relaxed">
                  <span className="text-primary font-bold mt-0.5 select-none">•</span>
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Interactive Practice Quiz */}
        <section>
          {isQuizLoading ? (
            <div className="space-y-4 rounded-2xl border border-border/20 p-6 animate-pulse">
              <Skeleton className="h-5 w-1/3 rounded bg-zinc-800" />
              <Skeleton className="h-4 w-full rounded bg-zinc-800" />
              <Skeleton className="h-10 w-full rounded-xl bg-zinc-800" />
              <Skeleton className="h-10 w-full rounded-xl bg-zinc-800" />
            </div>
          ) : (
            quizData?.questions && quizData.questions.length > 0 ? (
              <PracticeQuiz lessonTitle={lesson.title} lessonId={lessonId} questions={quizData.questions} />
            ) : (
              <p className="text-zinc-500 italic">No quiz questions generated for this lesson.</p>
            )
          )}
        </section>

        {/* Page Footer Navigation Buttons */}
        <section className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/20 pt-6 mt-12">
          {/* Complete trigger */}
          <Button
            onClick={markComplete}
            disabled={saving}
            isLoading={saving}
            className="w-full sm:w-auto rounded-xl shadow-lg shrink-0 gap-1.5"
          >
            <CheckCircle2 className="h-4.5 w-4.5" />
            <span>{isCompleted ? "Mark Incomplete" : "Mark Complete & Next"}</span>
          </Button>

          {/* Nav buttons */}
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={() => prevLesson && router.push(`/dashboard/lesson/${prevLesson.id}`)}
              disabled={!prevLesson}
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Prev</span>
            </Button>
            <Button
              onClick={() => nextLesson && router.push(`/dashboard/lesson/${nextLesson.id}`)}
              disabled={!nextLesson}
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none gap-1"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </div>
    </ReaderLayout>
  );
}
