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
    <Card className="p-6 border border-border bg-card shadow-xs min-h-[500px] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <Clock className="h-4.5 w-4.5 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Recent Learning Activity
            </h2>
          </div>
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-accent text-primary border border-indigo-500/20">
            {activities.length} Events
          </span>
        </div>

        <div className="relative border-l border-border pl-6 ml-3.5 space-y-6">
          {activities.slice(0, 8).map((activity) => (
            <div key={activity.id} className="relative group">
              {/* Timeline node icon */}
              <span className="absolute left-[-38px] top-0 flex h-6.5 w-6.5 items-center justify-center rounded-xl bg-card border border-border shadow-xs group-hover:border-primary transition-colors">
                {activity.icon}
              </span>

              <div>
                <p className="text-sm font-bold text-foreground leading-snug">
                  {activity.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 font-medium">
                  {activity.subtitle}
                </p>
                <span className="text-[10px] font-semibold text-muted-foreground/80 mt-1 block">
                  {activity.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-border/40 mt-6 text-center">
        <p className="text-[11px] font-semibold text-muted-foreground">
          Showing real-time learning timeline
        </p>
      </div>
    </Card>
  );
}
