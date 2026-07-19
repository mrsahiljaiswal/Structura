/**
 * Purpose: Premium Course Card Component for Structura
 * Composes CourseThumbnail, CourseProgress, and option dropmenus.
 */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Play, Pin, Heart, MoreVertical, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CourseThumbnail } from "./course-thumbnail";
import { CourseProgress } from "./course-progress";
import { Course, useCourses } from "@/hooks/use-courses";
import { coursePersistence } from "@/lib/services/course-service";

interface CourseCardProps {
  course: Course;
  onDelete?: (id: string) => void;
}

export function CourseCard({ course, onDelete }: CourseCardProps) {
  const router = useRouter();
  const { removeCourse } = useCourses();
  const [isPinned, setIsPinned] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    const pinned = coursePersistence.getPinnedCourses().some((p) => p.id === course.id);
    const fav = coursePersistence.getFavorites().includes(course.id);
    setIsPinned(pinned);
    setIsFavorite(fav);
  }, [course.id]);

  const togglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPinned) {
      coursePersistence.unpinCourse(course.id);
      setIsPinned(false);
    } else {
      coursePersistence.pinCourse(course.id, course.title);
      setIsPinned(true);
    }
    setShowOptions(false);
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    coursePersistence.toggleFavorite(course.id);
    setIsFavorite((prev) => !prev);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(course.id);
    } else {
      await removeCourse(course.id);
    }
    setShowOptions(false);
  };

  // Count total lessons
  const totalLessons = course.chapters.reduce((acc, ch) => acc + ch.lessons.length, 0);

  return (
    <Card
      onClick={() => router.push(`/dashboard/course/${course.id}`)}
      className="group relative flex flex-col justify-between rounded-2xl overflow-visible border border-border cursor-pointer bg-card hover:border-primary/50 hover:shadow-md transition-all duration-300 select-none max-w-sm w-full mx-auto"
    >
      {/* Upper Thumbnail Section */}
      <div className="relative">
        <CourseThumbnail title={course.title} />

        {/* Favorite Icon overlay */}
        <button
          onClick={toggleFavorite}
          className="absolute top-3 left-3 p-1.5 rounded-lg bg-card/90 backdrop-blur-md border border-border text-muted-foreground hover:text-red-500 transition-colors pointer-events-auto shadow-xs"
          aria-label="Toggle favorite"
        >
          <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
        </button>

        {/* Floating Menu button */}
        <div className="absolute top-3 right-3 pointer-events-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowOptions((prev) => !prev);
            }}
            className="p-1.5 rounded-lg bg-card/90 backdrop-blur-md border border-border text-muted-foreground hover:text-foreground transition-colors shadow-xs"
            aria-label="Options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {/* Options Dropdown menu */}
          {showOptions && (
            <>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOptions(false);
                }}
                className="fixed inset-0 z-10"
              />
              <div className="absolute right-0 mt-2.5 w-40 rounded-xl border border-border bg-popover text-popover-foreground p-1.5 shadow-2xl z-20 animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={togglePin}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                >
                  <Pin className="h-3.5 w-3.5" />
                  <span>{isPinned ? "Unpin Course" : "Pin to Sidebar"}</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Course</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content Details Section */}
      <CardContent className="p-5 flex-1 flex flex-col justify-between gap-5">
        <div className="space-y-2">
          {/* Badge line */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">
              {course.difficulty || "Intermediate"}
            </Badge>
            <Badge variant="outline">
              {totalLessons} Lessons
            </Badge>
          </div>

          <h3 className="font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors text-sm">
            {course.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {course.description || "Transform your uploaded PDF document into a structured educational program."}
          </p>
        </div>

        {/* Footer progress & continue trigger */}
        <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-2">
          <CourseProgress course={course} showText={true} />

          <Button
            variant="default"
            size="sm"
            className="rounded-lg h-8 text-xs shrink-0 pl-2.5 pr-3 gap-1 font-semibold shadow-xs"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>Continue</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
export default CourseCard;
