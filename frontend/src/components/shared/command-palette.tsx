/**
 * Purpose: Universal CommandCenter Command Palette for Structura
 * Supports search, full keyboard navigation (arrows, Enter), and themed categories.
 */

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BookOpen, Compass, ShieldAlert, Sparkles, Settings, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCourses } from "@/hooks/use-courses";

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  icon: React.ReactNode;
  action: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on load
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const commandItems: CommandItem[] = [
    // Pages / Navigations
    {
      id: "nav-dash",
      title: "Go to Dashboard",
      subtitle: "Jump to overview hub",
      category: "Navigation",
      icon: <Compass className="h-4 w-4" />,
      action: () => {
        router.push("/dashboard");
        onClose();
      },
    },
    {
      id: "nav-courses",
      title: "View My Courses",
      subtitle: "Browse study documents",
      category: "Navigation",
      icon: <BookOpen className="h-4 w-4" />,
      action: () => {
        router.push("/dashboard/courses");
        onClose();
      },
    },
    {
      id: "nav-upload",
      title: "Upload New PDF",
      subtitle: "Generate AI Course",
      category: "Navigation",
      icon: <Sparkles className="h-4 w-4" />,
      action: () => {
        router.push("/dashboard/upload");
        onClose();
      },
    },
    {
      id: "nav-tutor",
      title: "Start AI Tutor Chat",
      subtitle: "Contextual assistant",
      category: "Navigation",
      icon: <Sparkles className="h-4 w-4" />,
      action: () => {
        router.push("/dashboard/tutor");
        onClose();
      },
    },
    {
      id: "nav-settings",
      title: "Preferences & Settings",
      subtitle: "Configure SaaS dashboard",
      category: "Settings",
      icon: <Settings className="h-4 w-4" />,
      action: () => {
        router.push("/dashboard/settings");
        onClose();
      },
    },
    // Theme switches
    {
      id: "action-theme-dark",
      title: "Toggle Theme: Dark Mode",
      category: "System Settings",
      icon: <ShieldAlert className="h-4 w-4" />,
      action: () => {
        document.documentElement.className = "dark";
        localStorage.setItem("structura-theme", "dark");
        onClose();
      },
    },
    {
      id: "action-theme-contrast",
      title: "Toggle Theme: High Contrast",
      category: "System Settings",
      icon: <EyeIcon className="h-4 w-4" />,
      action: () => {
        document.documentElement.className = "high-contrast";
        localStorage.setItem("structura-theme", "high-contrast");
        onClose();
      },
    },
  ];

  // Simple contrast icon helper
  function EyeIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  // 1. Fetch user's courses to enable deep search across chapters, topics, lessons, and keywords
  const { courses } = useCourses();

  // 2. Build dynamic search index from course material
  const courseSearchItems: CommandItem[] = [];
  if (courses) {
    courses.forEach((course) => {
      // Index Course (Topic level)
      courseSearchItems.push({
        id: `course-${course.id}`,
        title: course.title,
        subtitle: `Course \u2022 ${course.difficulty || "All Levels"}`,
        category: "Topics & Courses",
        icon: <BookOpen className="h-4 w-4" />,
        action: () => {
          router.push(`/dashboard/course/${course.id}`);
          onClose();
        },
      });

      course.chapters?.forEach((chapter) => {
        // Index Chapter
        courseSearchItems.push({
          id: `chapter-${chapter.id}`,
          title: chapter.title,
          subtitle: `Chapter \u2022 ${course.title}`,
          category: "Chapters",
          icon: <Compass className="h-4 w-4" />,
          action: () => {
            const firstLesson = chapter.lessons?.[0];
            if (firstLesson) {
              router.push(`/dashboard/lesson/${firstLesson.id}`);
            } else {
              router.push(`/dashboard/course/${course.id}`);
            }
            onClose();
          },
        });

        chapter.lessons?.forEach((lesson) => {
          // Index Lesson
          courseSearchItems.push({
            id: `lesson-${lesson.id}`,
            title: lesson.title,
            subtitle: `Lesson \u2022 ${chapter.title}`,
            category: "Lessons",
            icon: <BookOpen className="h-4 w-4" />,
            action: () => {
              router.push(`/dashboard/lesson/${lesson.id}`);
              onClose();
            },
          });

          // Index Keywords / Topics (from key_takeaways)
          if (lesson.key_takeaways && Array.isArray(lesson.key_takeaways)) {
            lesson.key_takeaways.forEach((takeaway, idx) => {
              const itemObj = typeof takeaway === "object" && takeaway !== null ? (takeaway as Record<string, unknown>) : null;
              const keywordTitle =
                typeof takeaway === "string"
                  ? takeaway
                  : typeof itemObj?.title === "string"
                    ? itemObj.title
                    : typeof itemObj?.concept === "string"
                      ? itemObj.concept
                      : "Key Topic";
              if (keywordTitle && typeof keywordTitle === "string") {
                courseSearchItems.push({
                  id: `keyword-${lesson.id}-${idx}`,
                  title: keywordTitle,
                  subtitle: `Keyword in ${lesson.title}`,
                  category: "Keywords",
                  icon: <Sparkles className="h-4 w-4" />,
                  action: () => {
                    router.push(`/dashboard/lesson/${lesson.id}?highlight=${encodeURIComponent(keywordTitle)}`);
                    onClose();
                  },
                });
              }
            });
          }

          // Deep Semantic Content Search: Match search query inside full lesson body text
          if (search.trim().length >= 2 && lesson.content) {
            const cleanContent = lesson.content;
            const queryLower = search.trim().toLowerCase();
            const matchIndex = cleanContent.toLowerCase().indexOf(queryLower);

            if (matchIndex !== -1) {
              const snippetStart = Math.max(0, matchIndex - 30);
              const snippetEnd = Math.min(cleanContent.length, matchIndex + search.trim().length + 50);
              const snippet = (snippetStart > 0 ? "..." : "") + cleanContent.substring(snippetStart, snippetEnd).trim() + (snippetEnd < cleanContent.length ? "..." : "");

              courseSearchItems.push({
                id: `content-${lesson.id}-${matchIndex}`,
                title: snippet,
                subtitle: `Text match in ${lesson.title} (${course.title})`,
                category: "Deep Content Search",
                icon: <Search className="h-4 w-4 text-amber-400" />,
                action: () => {
                  router.push(`/dashboard/lesson/${lesson.id}?highlight=${encodeURIComponent(search.trim())}`);
                  onClose();
                },
              });
            }
          }
        });
      });
    });
  }

  const allItems = [...commandItems, ...courseSearchItems];

  // Filter items
  const filtered = allItems.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
  );

  // Keyboard navigation inside menu
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[activeIndex]) {
          filtered[activeIndex].action();
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeIndex, filtered, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Dialog Body */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -10 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="relative z-10 w-full max-w-xl rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl flex flex-col overflow-hidden max-h-[60vh]"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setActiveIndex(0);
                }}
                placeholder="Search commands, pages..."
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>

            {/* List Results */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {filtered.length > 0 ? (
                Object.entries(
                  filtered.reduce((acc, curr) => {
                    if (!acc[curr.category]) acc[curr.category] = [];
                    acc[curr.category]!.push(curr);
                    return acc;
                  }, {} as Record<string, CommandItem[]>)
                ).map(([category, items]) => (
                  <div key={category} className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-3 py-1.5">
                      {category}
                    </p>
                    {items.map((item) => {
                      const itemIdx = filtered.findIndex((f) => f.id === item.id);
                      const isSelected = itemIdx === activeIndex;

                      return (
                        <div
                          key={item.id}
                          onClick={item.action}
                          onMouseEnter={() => setActiveIndex(itemIdx)}
                          className={cn(
                            "flex items-center justify-between rounded-xl px-3 py-2.5 cursor-pointer transition-colors text-sm",
                            isSelected
                              ? "bg-primary text-primary-foreground font-semibold"
                              : "text-foreground hover:bg-secondary"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className={cn(isSelected ? "text-primary-foreground" : "text-primary")}>
                              {item.icon}
                            </span>
                            <div className="flex flex-col">
                              <span className="font-medium">{item.title}</span>
                              {item.subtitle && (
                                <span
                                  className={cn(
                                    "text-xs mt-0.5",
                                    isSelected ? "text-primary-foreground/85" : "text-muted-foreground"
                                  )}
                                >
                                  {item.subtitle}
                                </span>
                              )}
                            </div>
                          </div>

                          {isSelected && (
                            <ArrowRight className="h-4 w-4 text-primary-foreground/80" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                  <p>No results found for &quot;{search}&quot;</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
