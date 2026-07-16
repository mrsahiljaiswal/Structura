/**
 * Purpose: Course Progress Calculator & Gauge for Structura
 * Computes exact lesson completion rates and maps to RadialProgress circles.
 */

import React from "react";
import { RadialProgress } from "@/components/ui/progress";
import { Course } from "@/hooks/use-courses";
import { coursePersistence } from "@/lib/services/course-service";

interface CourseProgressProps {
  course: Course;
  size?: number;
  strokeWidth?: number;
  showText?: boolean;
}

export function CourseProgress({
  course,
  size = 44,
  strokeWidth = 3.5,
  showText = true,
}: CourseProgressProps) {
  const completedLessons = coursePersistence.getCompletedLessons();

  // Calculate total and completed lessons
  let totalLessons = 0;
  let completedCount = 0;

  course.chapters.forEach((ch) => {
    ch.lessons.forEach((l) => {
      totalLessons += 1;
      if (completedLessons.includes(l.id)) {
        completedCount += 1;
      }
    });
  });

  const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      {/* Radial indicator */}
      <RadialProgress value={percentage} size={size} strokeWidth={strokeWidth} />

      {/* Numerical percentage text */}
      {showText && (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-foreground leading-none">
            {percentage}%
          </span>
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
            {completedCount}/{totalLessons} Complete
          </span>
        </div>
      )}
    </div>
  );
}
export default CourseProgress;
