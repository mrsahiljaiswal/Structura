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
          variant="glass"
          className="w-full justify-start gap-2.5 rounded-xl border border-border/40 hover:bg-zinc-900"
        >
          <BookMarked className={`h-4 w-4 ${isBookmarked ? "text-amber-400 fill-amber-400" : "text-zinc-500"}`} />
          <span className="text-xs font-medium text-foreground">
            {isBookmarked ? "Bookmarked" : "Bookmark Lesson"}
          </span>
        </Button>
      </div>

      {/* Center Section: Scratchpad Area */}
      <div className="flex-1 flex flex-col gap-3 min-h-[220px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4.5 w-4.5 text-indigo-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
              My Scratchpad
            </span>
          </div>
          {/* Saved Status Indicator */}
          <div className="flex items-center gap-1.5 select-none">
            <span className={`h-1.5 w-1.5 rounded-full ${isSaved ? "bg-emerald-400" : "bg-amber-400 animate-ping"}`} />
            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
              {isSaved ? "Saved" : "Saving"}
            </span>
          </div>
        </div>

        <Textarea
          value={notes}
          onChange={handleNotesChange}
          placeholder="Jot down summaries, code syntax, checklist triggers, or questions here..."
          className="flex-1 min-h-[180px] bg-zinc-950/60 border-border/40 font-sans text-xs leading-relaxed focus-visible:ring-offset-0 focus-visible:ring-indigo-500/20"
        />
      </div>

      {/* Bottom Checklist Tips panel */}
      <div className="rounded-xl border border-border/20 bg-zinc-900/10 p-4 space-y-3">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          <CheckSquare className="h-3.5 w-3.5" />
          <span>Quick Note Guide</span>
        </div>
        <ul className="space-y-1.5 text-[10px] text-zinc-400 leading-relaxed list-none pl-0">
          <li>• Draft summaries in markdown.</li>
          <li>• Checklists auto-save in local caches.</li>
          <li>• Press <kbd className="px-1 rounded bg-zinc-950 border border-border/60">Ctrl</kbd> + <kbd className="px-1 rounded bg-zinc-950 border border-border/60">B</kbd> to toggle bookmark status.</li>
        </ul>
      </div>
    </div>
  );
}
export default NotesPanel;
