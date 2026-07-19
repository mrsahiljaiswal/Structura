"use client";

import React, { useState } from "react";
import { GitBranch, BookOpen, Layers, CheckCircle, Sparkles, Filter, ArrowRight, Check, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface MindMapLesson {
  id: string;
  title: string;
  key_takeaways?: string[] | null;
}

interface MindMapChapter {
  id: number;
  title: string;
  position: number;
  lessons: MindMapLesson[];
}

interface MindMapViewerProps {
  courseTitle: string;
  chapters: MindMapChapter[];
  completedLessonIds?: string[];
}

export function MindMapViewer({
  courseTitle,
  chapters,
  completedLessonIds = [],
}: MindMapViewerProps) {
  const router = useRouter();
  const [filterMode, setFilterMode] = useState<"all" | "completed" | "unread">("all");
  const [selectedLesson, setSelectedLesson] = useState<{ id: string; title: string; chapterTitle: string } | null>(null);

  if (!chapters || chapters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border border-border bg-card rounded-2xl shadow-xs">
        <GitBranch className="h-8 w-8 text-primary mb-2" />
        <p className="text-sm font-semibold text-muted-foreground">No Concept Map structure generated for this course.</p>
      </div>
    );
  }

  // Calculate totals
  const totalLessons = chapters.reduce((acc, ch) => acc + ch.lessons.length, 0);
  const completedCount = chapters.reduce(
    (acc, ch) => acc + ch.lessons.filter((l) => completedLessonIds.includes(l.id)).length,
    0
  );

  return (
    <div className="space-y-6 select-none">
      {/* Top Controls Bar: Title & Filter Pills */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-accent border border-indigo-500/20 text-primary">
            <GitBranch className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-foreground tracking-tight">Interactive AI Concept Graph</h3>
            <p className="text-[11px] font-semibold text-muted-foreground">
              {completedCount} of {totalLessons} concepts mastered
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-secondary/80 border border-border shadow-2xs">
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterMode === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({totalLessons})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("completed")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterMode === "completed"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mastered ({completedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("unread")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterMode === "unread"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Unread ({totalLessons - completedCount})
          </button>
        </div>
      </div>

      {/* Main Concept Tree Container */}
      <div className="p-6 sm:p-8 rounded-3xl border border-border bg-card shadow-lg relative overflow-hidden backdrop-blur-xl">
        <div className="flex flex-col items-center space-y-8 max-w-5xl mx-auto">
          {/* Central Root Hub Node: Course Title */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative z-10 px-8 py-5 rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-primary/10 via-accent/30 to-purple-500/10 text-center shadow-lg backdrop-blur-md max-w-lg w-full"
          >
            <div className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-wider text-primary mb-1">
              <BookOpen className="h-4 w-4" />
              <span>Core Course Knowledge Hub</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight">{courseTitle}</h2>
          </motion.div>

          {/* Central Connecting Beam */}
          <div className="w-0.5 h-8 bg-gradient-to-b from-primary via-indigo-400 to-border animate-pulse" />

          {/* Chapters Branch Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {chapters.map((ch) => {
              const chCompleted = ch.lessons.filter((l) => completedLessonIds.includes(l.id)).length;
              const isChDone = chCompleted === ch.lessons.length && ch.lessons.length > 0;

              const filteredLessons = ch.lessons.filter((l) => {
                const isDone = completedLessonIds.includes(l.id);
                if (filterMode === "completed") return isDone;
                if (filterMode === "unread") return !isDone;
                return true;
              });

              if (filterMode !== "all" && filteredLessons.length === 0) return null;

              return (
                <motion.div
                  key={ch.id}
                  whileHover={{ y: -3 }}
                  className={`flex flex-col justify-between p-5 rounded-2xl border transition-all shadow-xs ${
                    isChDone
                      ? "border-emerald-500/30 bg-emerald-500/[0.02]"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Chapter Header */}
                    <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                      <span className="text-xs font-black uppercase tracking-wider text-primary bg-accent border border-indigo-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5" />
                        Ch {ch.position}
                      </span>
                      <span className={`text-xs font-bold ${isChDone ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                        {chCompleted}/{ch.lessons.length} Mastered
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-foreground leading-snug">{ch.title}</h4>

                    {/* Children Lesson Nodes */}
                    <div className="space-y-2 pt-1">
                      {filteredLessons.map((l) => {
                        const isDone = completedLessonIds.includes(l.id);
                        const isSelected = selectedLesson?.id === l.id;

                        return (
                          <div
                            key={l.id}
                            onClick={() => setSelectedLesson({ id: l.id, title: l.title, chapterTitle: ch.title })}
                            className={`flex items-center justify-between p-3 rounded-xl text-xs font-medium cursor-pointer transition-all border ${
                              isSelected
                                ? "border-primary bg-primary/10 text-primary shadow-xs"
                                : isDone
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                : "border-border/60 bg-secondary/50 hover:bg-secondary text-foreground"
                            }`}
                          >
                            <span className="truncate pr-2 font-semibold">{l.title}</span>
                            {isDone ? (
                              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            ) : (
                              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Lesson Inspection Drawer */}
      <AnimatePresence>
        {selectedLesson && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-primary/30 bg-accent/40 shadow-md backdrop-blur-md"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                Selected Concept Node • {selectedLesson.chapterTitle}
              </span>
              <p className="text-sm font-black text-foreground">{selectedLesson.title}</p>
            </div>

            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
              <Button
                onClick={() => router.push(`/dashboard/lesson/${selectedLesson.id}`)}
                size="sm"
                className="w-full sm:w-auto rounded-xl gap-2 font-bold shadow-xs bg-primary text-primary-foreground hover:opacity-90"
              >
                <span>Study Lesson Now</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <button
                type="button"
                onClick={() => setSelectedLesson(null)}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground px-2 py-1"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
