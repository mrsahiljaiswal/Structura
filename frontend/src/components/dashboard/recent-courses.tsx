"use client";

import { BookOpen, Clock } from "lucide-react";

const recentCourses = [
  {
    id: 1,
    title: "Advanced TypeScript",
    description: "Master advanced TypeScript patterns and best practices",
    progress: 65,
    chapters: 8,
    estimatedTime: "4.5 hours",
  },
  {
    id: 2,
    title: "System Design Fundamentals",
    description: "Learn scalable system architecture principles",
    progress: 42,
    chapters: 12,
    estimatedTime: "6 hours",
  },
  {
    id: 3,
    title: "PostgreSQL Deep Dive",
    description: "Advanced database optimization and design",
    progress: 28,
    chapters: 10,
    estimatedTime: "5 hours",
  },
];

export function RecentCoursesSection() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-zinc-50 mb-6">Recent Courses</h2>
      <div className="grid gap-4">
        {recentCourses.map((course) => (
          <div key={course.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-zinc-700 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-indigo-600/10 p-2">
                  <BookOpen className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-50">{course.title}</h3>
                  <p className="text-sm text-zinc-400 mt-1">{course.description}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span>{course.chapters} chapters</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {course.estimatedTime}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-1.5 w-24 rounded-full bg-zinc-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-zinc-400 w-8">{course.progress}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
