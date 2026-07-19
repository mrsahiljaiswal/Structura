import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
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

  const { data: progress, isLoading } = useQuery<UserProgressData>({
    queryKey: ["userProgress", userId],
    queryFn: async () => {
      await coursePersistence.loadFromServer();
      const res = await api.get("/api/v1/user/progress");
      return res.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (newProgress: Partial<UserProgressData>) => {
      const current = progress || {
        pinned_courses: [],
        favorite_courses: [],
        completed_lessons: [],
        study_time_total: 0,
        study_time_by_day: {},
        quiz_scores: {},
        lesson_notes: {},
        chat_history: [],
      };
      const payload = { ...current, ...newProgress };
      const res = await api.post("/api/v1/user/progress", payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["userProgress"], data);
      window.dispatchEvent(new Event("storage"));
    },
  });

  const toggleLessonComplete = async (lessonId: string) => {
    const currentCompleted = progress?.completed_lessons || [];
    const exists = currentCompleted.includes(lessonId);
    const updated = exists
      ? currentCompleted.filter((id) => id !== lessonId)
      : [...currentCompleted, lessonId];

    await updateProgressMutation.mutateAsync({ completed_lessons: updated });
    await coursePersistence.toggleLessonComplete(lessonId);
  };

  const addStudyTime = async (seconds: number) => {
    const newTotal = (progress?.study_time_total || 0) + seconds;
    const day = new Date().toLocaleDateString("en-US", { weekday: "short" });
    const byDay = { ...(progress?.study_time_by_day || {}) };
    byDay[day] = (byDay[day] || 0) + seconds;

    await updateProgressMutation.mutateAsync({
      study_time_total: newTotal,
      study_time_by_day: byDay,
    });
    await coursePersistence.addStudyTime(seconds);
  };

  const quizScores = progress?.quiz_scores || {};
  const scoreValues = Object.values(quizScores);
  const avgQuizScore = scoreValues.length > 0 ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) : 0;

  const saveQuizScore = async (lessonId: string, scorePercent: number) => {
    const updatedScores = { ...quizScores, [lessonId]: scorePercent };
    await updateProgressMutation.mutateAsync({ quiz_scores: updatedScores });
    await coursePersistence.saveQuizScore(lessonId, scorePercent);
  };

  const clearChatHistory = async () => {
    await updateProgressMutation.mutateAsync({ chat_history: [] });
  };

  return {
    progress: progress || {
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
    },
    avgQuizScore,
    isLoading,
    toggleLessonComplete,
    addStudyTime,
    saveQuizScore,
    clearChatHistory,
  };
}
