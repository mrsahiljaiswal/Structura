import React, { useRef, useState, useEffect } from "react";
import { Send, BookOpen, Sparkles, Globe, BookMarked, Trash2, ArrowUp, ChevronDown, Check, Layers } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  knowledgeMode?: "courses_only" | "both" | "web_only";
  onModeChange?: (mode: "courses_only" | "both" | "web_only") => void;
  courses?: { id: string; title: string }[];
  selectedCourseId?: string;
  onCourseChange?: (id: string) => void;
  onClearHistory?: () => void;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
  knowledgeMode = "both",
  onModeChange,
  courses = [],
  selectedCourseId = "",
  onCourseChange,
  onClearHistory,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto select-none">
      {/* Floating Pill Dock Bar */}
      <div className="rounded-[28px] bg-card/95 backdrop-blur-xl border border-border/80 shadow-2xl shadow-indigo-500/5 dark:shadow-black/50 p-3 sm:p-4 focus-within:border-primary/60 transition-all flex flex-col gap-2">
        {/* Top: Multi-line prompt area */}
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            knowledgeMode === "courses_only"
              ? "Ask anything grounded in your course materials..."
              : knowledgeMode === "web_only"
              ? "Ask any general or web search question..."
              : "Ask your AI Study Tutor anything..."
          }
          disabled={disabled}
          rows={1}
          className="w-full bg-transparent border-0 resize-none font-sans text-sm sm:text-base py-1 px-2 leading-relaxed min-h-[44px] max-h-[160px] focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60 text-foreground"
        />

        {/* Bottom Toolbar: Context Pills (Left) & Actions (Right) */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/30">
          {/* Left Controls: Source Pills & Course Selector */}
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {/* Knowledge Mode Pills */}
            {onModeChange && (
              <div className="flex items-center gap-1 bg-secondary/80 border border-border/60 rounded-full p-0.5">
                <button
                  type="button"
                  onClick={() => onModeChange("courses_only")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    knowledgeMode === "courses_only"
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Answer strictly from enrolled courses"
                >
                  <BookOpen className="h-3 w-3" />
                  <span className="hidden sm:inline">Courses Only</span>
                </button>

                <button
                  type="button"
                  onClick={() => onModeChange("both")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    knowledgeMode === "both"
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Answer from courses + general knowledge"
                >
                  <Sparkles className="h-3 w-3" />
                  <span className="hidden sm:inline">Courses + Web</span>
                </button>

                <button
                  type="button"
                  onClick={() => onModeChange("web_only")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    knowledgeMode === "web_only"
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Answer from web/general knowledge"
                >
                  <Globe className="h-3 w-3" />
                  <span className="hidden sm:inline">Web Only</span>
                </button>
              </div>
            )}

            {/* Course Context Premium Pill Dropdown */}
            {onCourseChange && courses.length > 0 && (
              <CourseContextDropdown
                courses={courses}
                selectedCourseId={selectedCourseId}
                onCourseChange={onCourseChange}
              />
            )}
          </div>

          {/* Right Controls: Clear & ChatGPT-style Circular Send Button */}
          <div className="flex items-center gap-2 shrink-0">
            {onClearHistory && (
              <button
                type="button"
                onClick={onClearHistory}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                title="Clear conversation"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}

            {/* Circular ChatGPT Send Arrow */}
            <button
              onClick={onSubmit}
              disabled={disabled || !value.trim()}
              className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:active:scale-100 transition-all cursor-pointer shadow-md"
              aria-label="Send prompt"
            >
              <ArrowUp className="h-5 w-5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Premium Glassmorphic Dropdown Menu for Course Context Selection
 */
function CourseContextDropdown({
  courses,
  selectedCourseId,
  onCourseChange,
}: {
  courses: { id: string; title: string }[];
  selectedCourseId: string;
  onCourseChange: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 bg-secondary/80 hover:bg-secondary border border-border/60 rounded-full px-3 py-1 text-xs font-semibold text-foreground transition-all cursor-pointer shadow-2xs group"
      >
        <BookMarked className="h-3 w-3 text-primary shrink-0" />
        <span className="truncate max-w-[130px]">
          {selectedCourse ? selectedCourse.title : "All Courses Context"}
        </span>
        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180 text-foreground" : ""}`} />
      </button>

      {/* Floating Menu Popover */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 sm:left-auto sm:right-0 z-50 min-w-[240px] max-w-xs rounded-2xl bg-card/95 backdrop-blur-2xl border border-border/80 p-1.5 shadow-2xl shadow-indigo-500/10 animate-in fade-in zoom-in-95 space-y-1">
          <div className="px-2 py-1.5 border-b border-border/40 mb-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Select Knowledge Context
            </p>
          </div>

          {/* Option: All Courses Context */}
          <button
            type="button"
            onClick={() => {
              onCourseChange("");
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
              !selectedCourseId
                ? "bg-primary/10 text-primary"
                : "text-foreground hover:bg-secondary"
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <Layers className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">All Enrolled Courses</span>
            </div>
            {!selectedCourseId && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
          </button>

          {/* Options: Individual Courses */}
          {courses.map((c) => {
            const isSelected = c.id === selectedCourseId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onCourseChange(c.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <BookOpen className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{c.title}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ChatInput;
