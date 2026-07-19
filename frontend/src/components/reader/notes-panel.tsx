/**
 * Purpose: Local Study Notes Scratchpad & Bookmarks Pane for Structura Reader
 * Auto-saves Markdown draft details per lesson using coursePersistence.
 */

import React, { useState, useEffect } from "react";
import { BookMarked, Save, FileText, CheckSquare, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { coursePersistence } from "@/lib/services/course-service";
import { cn } from "@/lib/utils";

interface NotesPanelProps {
  lessonId: string;
  lessonTitle: string;
}

export function NotesPanel({ lessonId, lessonTitle }: NotesPanelProps) {
  const toast = useToast();
  const [notes, setNotes] = useState("");
  const [isSaved, setIsSaved] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Load notes and bookmarks status on mount/lesson change
  useEffect(() => {
    setNotes(coursePersistence.getNotes(lessonId));
    setIsSaved(true);
    
    const favs = coursePersistence.getFavorites();
    setIsBookmarked(favs.includes(lessonId));
  }, [lessonId]);

  // Handle auto-save timer (save 1 second after typing stops)
  useEffect(() => {
    if (isSaved) return;

    const timer = setTimeout(() => {
      coursePersistence.saveNotes(lessonId, notes);
      setIsSaved(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [notes, lessonId, isSaved]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    setIsSaved(false);
  };

  const toggleBookmark = () => {
    coursePersistence.toggleFavorite(lessonId);
    setIsBookmarked((prev) => !prev);
    toast.success(isBookmarked ? "Removed from bookmarks" : "Lesson bookmarked successfully!");
  };

  return (
    <div className="h-full flex flex-col justify-between gap-6">
      {/* Top Section: Bookmarks Toggle */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/20 pb-3">
          <div className="flex items-center gap-2">
            <BookMarked className="h-4.5 w-4.5 text-indigo-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Study Tools
            </span>
          </div>
        </div>

        <Button
          onClick={toggleBookmark}
          variant="outline"
          className={cn(
            "w-full justify-start gap-2.5 rounded-2xl border transition-all shadow-2xs font-bold text-xs cursor-pointer",
            isBookmarked
              ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
              : "bg-card border-border text-foreground hover:bg-secondary"
          )}
        >
          <BookMarked className={`h-4 w-4 ${isBookmarked ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
          <span>{isBookmarked ? "Bookmarked Lesson" : "Bookmark Lesson"}</span>
        </Button>
      </div>

      {/* Center Section: Scratchpad Area */}
      <div className="flex-1 flex flex-col gap-3 min-h-[220px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4.5 w-4.5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              My Scratchpad
            </span>
          </div>
          {/* Saved Status Indicator */}
          <div className="flex items-center gap-1.5 select-none">
            <span className={`h-2 w-2 rounded-full ${isSaved ? "bg-emerald-500" : "bg-amber-500 animate-ping"}`} />
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              {isSaved ? "Saved" : "Saving"}
            </span>
          </div>
        </div>

        <Textarea
          value={notes}
          onChange={handleNotesChange}
          placeholder="Jot down summaries, code syntax, checklist triggers, or questions here..."
          className="flex-1 min-h-[180px] bg-card border-border text-foreground font-sans text-xs leading-relaxed focus-visible:ring-offset-0 focus-visible:ring-primary/20 rounded-2xl shadow-xs"
        />
      </div>

      {/* Bottom Checklist Tips panel */}
      <div className="rounded-2xl border border-border bg-card shadow-xs p-4 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <CheckSquare className="h-4 w-4 text-primary" />
          <span>Quick Note Guide</span>
        </div>
        <ul className="space-y-1.5 text-xs text-foreground font-medium leading-relaxed list-none pl-0">
          <li className="flex items-center gap-1.5">• Draft summaries in markdown.</li>
          <li className="flex items-center gap-1.5">• Notes auto-save to local cache.</li>
          <li className="flex items-center gap-1.5">
            • Press <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border text-[10px] font-bold">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border text-[10px] font-bold">B</kbd> to bookmark.
          </li>
        </ul>
      </div>
    </div>
  );
}
export default NotesPanel;
