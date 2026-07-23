import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import api from "@/lib/axios";
import { coursePersistence } from "@/lib/services/course-service";

export interface UserProgressData {
  pinned_courses: { id: string; title: string }[];
  favorite_courses: string[];
  completed_lessons: string[];
  study_time_total: number;
  study_time_by_day: Record<string, number>;
  quiz_scores: Record<string, number>;
  lesson_notes: Record<string, string>;
  streak_count?: number;
  streak_last_date?: string | null;
  chat_history?: { role: string; content: string }[];
}

export function useUserProgress() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const userId = user?.id || "anonymous";

  useEffect(() => {
    const handleStorage = () => {
      queryClient.invalidateQueries({ queryKey: ["userProgress", userId] });
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [queryClient, userId]);

  const { data, isLoading } = useQuery<UserProgressData>({
    queryKey: ["userProgress", userId],
    queryFn: async () => {
      await coursePersistence.loadFromServer();
      const res = await api.get("/api/v1/user/progress");
      return res.data;
    },
    staleTime: 1000 * 5,
  });

  const progressData: UserProgressData = data || {
    pinned_courses: [],
    favorite_courses: [],
    completed_lessons: [],
    study_time_total: 0,
    study_time_by_day: {},
    quiz_scores: {},
    lesson_notes: {},
    streak_count: 0,
    streak_last_date: null,
    chat_history: [],
  };

  const toggleLessonComplete = async (lessonId: string) => {
    await coursePersistence.toggleLessonComplete(lessonId);
    queryClient.invalidateQueries({ queryKey: ["userProgress", userId] });
  };

  const addStudyTime = async (seconds: number) => {
    await coursePersistence.addStudyTime(seconds);
    queryClient.invalidateQueries({ queryKey: ["userProgress", userId] });
  };

  const saveQuizScore = async (lessonId: string, scorePercent: number) => {
    await coursePersistence.saveQuizScore(lessonId, scorePercent);
    queryClient.invalidateQueries({ queryKey: ["userProgress", userId] });
  };

  const clearChatHistory = async () => {
    await coursePersistence.clearChatHistory();
    queryClient.invalidateQueries({ queryKey: ["userProgress", userId] });
  };

  const quizScores = progressData.quiz_scores || {};
  const scoreValues = Object.values(quizScores);
  const avgQuizScore =
    scoreValues.length > 0
      ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
      : 0;

  return {
    progress: progressData,
    avgQuizScore,
    isLoading,
    toggleLessonComplete,
    addStudyTime,
    saveQuizScore,
    clearChatHistory,
  };
}
