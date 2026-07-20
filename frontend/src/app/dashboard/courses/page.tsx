/**
 * Purpose: Redesigned Courses Catalog Page for Structura
 * Displays generated courses, search filters, and actionable empty states.
 */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { CourseCard } from "@/components/courses/course-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useCourses } from "@/hooks/use-courses";
import { Sparkles, Search, Plus, BookOpen } from "lucide-react";

export default function CoursesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { courses, isLoading, isError, removeCourse } = useCourses();

  const breadcrumbs = [
    { label: "My Courses", href: "/dashboard/courses" },
  ];

  // Filtered list
  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/20 pb-6">
          <div className="space-y-1.5 text-left">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase">
              <Sparkles className="h-4 w-4" />
              <span>Study Materials</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              My Courses
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Access generated AI courses, outline trees, and context-aware chat logs.
            </p>
          </div>

          {courses.length > 0 && (
            <Button
              onClick={() => router.push("/dashboard/upload")}
              className="rounded-xl shrink-0 gap-1.5 self-start sm:self-auto"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Generate Course</span>
            </Button>
          )}
        </div>

        {/* Loading / Error States */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-80 rounded-2xl" />
            <Skeleton className="h-80 rounded-2xl" />
            <Skeleton className="h-80 rounded-2xl" />
          </div>
        ) : courses.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon="📚"
              title="Looks like you're just getting started"
              description="Upload your first PDF document to generate an AI-powered course outline with lessons, bookmarks, and tutoring."
              actionText="Generate Course"
              onAction={() => router.push("/dashboard/upload")}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Search Input Filter bar */}
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses..."
                className="pl-10"
              />
            </div>

            {/* Courses Cards Grid */}
            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {filteredCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onDelete={(id) => removeCourse(id)}
                  />
                ))}
              </div>
            ) : (
              <div className="py-8">
                <EmptyState
                  icon="🔍"
                  title="No courses matched search"
                  description={`No course titles or summaries contained "${searchQuery}". Please check your spellings or clear filters.`}
                  actionText="Clear Search"
                  onAction={() => setSearchQuery("")}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
