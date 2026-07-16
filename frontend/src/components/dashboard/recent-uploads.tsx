/**
 * Purpose: Recent Activity / Uploads Component for Structura Dashboard
 * Shows chronological logs of generated courses and completed lessons.
 */

import React from "react";
import { Clock, CheckCircle, FilePlus, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Course } from "@/hooks/use-courses";
import { coursePersistence } from "@/lib/services/course-service";

interface RecentActivityProps {
  courses: Course[];
}

export function RecentUploadsSection({ courses }: RecentActivityProps) {
  const completedLessons = coursePersistence.getCompletedLessons();

  // Construct a list of recent activities dynamically
  const activities: {
    id: string;
    type: "upload" | "complete" | "achievement";
    title: string;
    subtitle: string;
    time: string;
    icon: React.ReactNode;
  }[] = [];

  // 1. Add generated courses
  courses.slice(0, 2).forEach((c) => {
    activities.push({
      id: `course-${c.id}`,
      type: "upload",
      title: `Generated Course`,
      subtitle: c.title,
      time: "Recent",
      icon: <FilePlus className="h-4 w-4 text-indigo-400" />,
    });
  });

  // 2. Add completed lessons details
  courses.forEach((c) => {
    c.chapters.forEach((ch) => {
      ch.lessons.forEach((l) => {
        if (completedLessons.includes(l.id)) {
          activities.push({
            id: `lesson-${l.id}`,
            type: "complete",
            title: `Completed Lesson`,
            subtitle: `${c.title} • ${l.title}`,
            time: "Completed",
            icon: <CheckCircle className="h-4 w-4 text-emerald-400" />,
          });
        }
      });
    });
  });

  // 3. Fallback mock activities if the database has no data yet
  if (activities.length === 0) {
    activities.push(
      {
        id: "mock-1",
        type: "achievement",
        title: "Welcome to Structura",
        subtitle: "Upload a PDF document to generate your first course",
        time: "Just now",
        icon: <Trophy className="h-4 w-4 text-amber-400" />,
      },
      {
        id: "mock-2",
        type: "upload",
        title: "Sample Course: Advanced TypeScript",
        subtitle: "Mock course reference loaded in system",
        time: "1 hour ago",
        icon: <FilePlus className="h-4 w-4 text-indigo-400" />,
      }
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 border-b border-border/20 pb-4 mb-4">
        <Clock className="h-4.5 w-4.5 text-indigo-400" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
          Recent Learning Activity
        </h2>
      </div>

      <div className="relative border-l border-border/40 pl-6 ml-3.5 space-y-6">
        {activities.slice(0, 4).map((activity) => (
          <div key={activity.id} className="relative">
            {/* Timeline node icon */}
            <span className="absolute left-[-38px] top-0 flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-950 border border-border/60 shadow-md">
              {activity.icon}
            </span>

            <div>
              <p className="text-sm font-semibold text-foreground leading-none">
                {activity.title}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-1">
                {activity.subtitle}
              </p>
              <span className="inline-block text-[10px] text-zinc-500 font-semibold bg-zinc-900 border border-border/20 px-2 py-0.5 rounded-md mt-2">
                {activity.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
