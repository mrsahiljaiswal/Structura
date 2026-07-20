/**
 * Purpose: Custom useCourses Hook for Structura
 * Fetches and caches details in parallel for all registered course IDs using TanStack React Query.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import api from "@/lib/axios";
import { coursePersistence } from "@/lib/services/course-service";

export interface Lesson {
  id: string;
  title: string;
  position: number;
  content?: string;
  summary?: string;
  examples?: unknown[] | null;
  key_takeaways?: unknown[] | null;
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
  const { user } = useUser();
  const userId = user?.id || "anonymous";

  const { data: courses = [], isLoading, isError, refetch } = useQuery<Course[]>({
    queryKey: ["courses", userId],
    queryFn: async () => {
      const res = await api.get("/api/v1/courses");
      return res.data;
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const addCourse = (id: string) => {
    queryClient.invalidateQueries({ queryKey: ["courses"] });
    refetch();
  };

  const removeCourse = async (id: string) => {
    try {
      await api.delete(`/api/v1/courses/${id}`);
      await coursePersistence.unpinCourse(id);
      await coursePersistence.unfavoriteCourse(id);
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    } catch (err) {
      console.error("Failed to delete course:", err);
    }
  };

  return {
    courses,
    isLoading,
    isError,
    addCourse,
    removeCourse,
  };
}
