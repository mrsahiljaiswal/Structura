/**
 * Purpose: Collapsible Left Navigation Sidebar for Structura
 * Supports collapse transitions, active item indicators, pinned items, and shortcuts.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  Upload,
  MessageSquare,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Pin,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const menuItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Courses", href: "/dashboard/courses", icon: BookOpen },
  { label: "Upload PDF", href: "/dashboard/upload", icon: Upload },
  { label: "AI Tutor", href: "/dashboard/tutor", icon: MessageSquare },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pinnedCourses, setPinnedCourses] = useState<{ id: string; title: string }[]>([]);

  // Load pinned courses from localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("structura-pinned-courses");
      if (saved) {
        try {
          setPinnedCourses(JSON.parse(saved));
        } catch {
          // ignore
        }
      }
    };
    handleStorageChange();
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 64 : 260 }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      className="fixed left-0 top-16 bottom-0 z-20 border-r border-border/40 bg-zinc-950/80 backdrop-blur-md flex flex-col justify-between overflow-hidden"
    >
      {/* Upper Navigation Block */}
      <div className="p-3 flex-1 flex flex-col gap-6 overflow-y-auto overflow-x-hidden scrollbar-none">
        {/* Core Nav Menu */}
        <nav className="space-y-1">
          {menuItems.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center h-10 rounded-xl px-3 text-sm font-medium transition-all group select-none",
                  isActive
                    ? "text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                )}
              >
                {/* Active Slider Indicator background */}
                {isActive && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute inset-0 bg-primary rounded-xl z-0"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}

                <span className="relative z-10 flex items-center gap-3">
                  <Icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span>{label}</span>}
                </span>

                {/* Tooltip for collapsed mode */}
                {isCollapsed && (
                  <div className="absolute left-16 z-50 px-2 py-1 text-xs font-semibold text-zinc-100 bg-zinc-950 border border-border/45 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 whitespace-nowrap">
                    {label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Pinned Courses / Favorites Section (only visible when expanded) */}
        {!isCollapsed && pinnedCourses.length > 0 && (
          <div className="space-y-2 border-t border-border/20 pt-4 px-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              <Pin className="h-3 w-3" />
              <span>Pinned Courses</span>
            </div>
            <div className="space-y-1.5">
              {pinnedCourses.map((c) => (
                <Link
                  key={c.id}
                  href={`/dashboard/course/${c.id}`}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground truncate py-1 transition-colors"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  <span className="truncate">{c.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lower Toggle Bar */}
      <div className="p-3 border-t border-border/25 bg-zinc-950 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground select-none pl-1">
            <Clock className="h-3.5 w-3.5" />
            <span>Streaks: 7 Days</span>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="h-8 w-8 rounded-lg text-zinc-400 hover:text-foreground mx-auto"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </motion.aside>
  );
}
