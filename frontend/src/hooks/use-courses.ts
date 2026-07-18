/**
 * Purpose: Custom useCourses Hook for Structura
 * Fetches and caches details in parallel for all registered course IDs using TanStack React Query.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { coursePersistence } from "@/lib/services/course-service";

export interface Lesson {
  id: string;
  title: string;
  position: number;
  content?: string;
  summary?: string;
  examples?: any[];
  key_takeaways?: any[];
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

  const { data: courses = [], isLoading, isError } = useQuery<Course[]>({
    queryKey: ["courses"],
    queryFn: async () => {
      const res = await api.get("/api/v1/courses");
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const addCourse = (id: string) => {
    queryClient.invalidateQueries({ queryKey: ["courses"] });
  };

  const removeCourse = (id: string) => {
    queryClient.invalidateQueries({ queryKey: ["courses"] });
  };

  return {
    courses,
    isLoading,
    isError,
    addCourse,
    removeCourse,
  };
}
