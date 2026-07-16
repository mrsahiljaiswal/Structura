/**
 * Purpose: Custom useCourses Hook for Structura
 * Fetches and caches details in parallel for all registered course IDs using TanStack React Query.
 */

import { useState, useEffect } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { coursePersistence } from "@/lib/services/course-service";

export interface Lesson {
  id: string;
  title: string;
  position: number;
}

export interface Chapter {
  id: number;
  title: string;
  position: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  difficulty?: string;
  estimated_time?: string;
  chapters: Chapter[];
}

export function useCourses() {
  const queryClient = useQueryClient();
  const [courseIds, setCourseIds] = useState<string[]>([]);

  useEffect(() => {
    const updateIds = () => {
      setCourseIds(coursePersistence.getCourseIds());
    };

    updateIds();
    window.addEventListener("storage", updateIds);
    return () => window.removeEventListener("storage", updateIds);
  }, []);

  // Fetch all courses in parallel using TanStack useQueries
  const results = useQueries({
    queries: courseIds.map((id) => ({
      queryKey: ["course", id],
      queryFn: async (): Promise<Course> => {
        const res = await api.get(`/api/v1/courses/${id}`);
        return res.data;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      retry: 1,
    })),
  });

  const courses = results
    .map((r) => r.data)
    .filter((c): c is Course => !!c);

  const isLoading = results.some((r) => r.isLoading);
  const isError = results.some((r) => r.isError);

  const addCourse = (id: string) => {
    coursePersistence.addCourseId(id);
    queryClient.invalidateQueries({ queryKey: ["course", id] });
  };

  const removeCourse = (id: string) => {
    coursePersistence.removeCourseId(id);
    queryClient.removeQueries({ queryKey: ["course", id] });
  };

  return {
    courseIds,
    courses,
    isLoading,
    isError,
    addCourse,
    removeCourse,
  };
}
