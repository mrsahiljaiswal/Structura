/**
 * Purpose: Backend-Synced Course Persistence Service for Structura
 * Manages course lists, favorites, pins, lesson completions, and study time logs
 * by synchronizing dynamically with the FastAPI backend database.
 */

import api from "@/lib/axios";

interface StreakInfo {
  count: number;
  lastDate: string | null;
}

interface UserProgress {
  pinned_courses: { id: string; title: string }[];
  favorite_courses: string[];
  completed_lessons: string[];
  study_time_total: number;
  study_time_by_day: Record<string, number>;
  quiz_scores: Record<string, number>;
  lesson_notes: Record<string, string>;
  streak_count?: number;
  streak_last_date?: string | null;
}

class CoursePersistenceService {
  private progress: UserProgress = {
    pinned_courses: [],
    favorite_courses: [],
    completed_lessons: [],
    study_time_total: 0,
    study_time_by_day: {},
    quiz_scores: {},
    lesson_notes: {},
    streak_count: 0,
    streak_last_date: null,
  };
  private isLoaded = false;
  private loadingPromise: Promise<void> | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.loadFromServer();
    }
  }

  async loadFromServer(): Promise<void> {
    if (typeof window === "undefined") return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = (async () => {
      try {
        const res = await api.get("/api/v1/user/progress");
        this.progress = {
          pinned_courses: res.data.pinned_courses || [],
          favorite_courses: res.data.favorite_courses || [],
          completed_lessons: res.data.completed_lessons || [],
          study_time_total: res.data.study_time_total || 0,
          study_time_by_day: res.data.study_time_by_day || {},
          quiz_scores: res.data.quiz_scores || {},
          lesson_notes: res.data.lesson_notes || {},
          streak_count: res.data.streak_count || 0,
          streak_last_date: res.data.streak_last_date || null,
        };
        this.isLoaded = true;
        window.dispatchEvent(new Event("storage"));
      } catch (err) {
        console.error("Failed to load user progress from server", err);
      } finally {
        this.loadingPromise = null;
      }
    })();

    return this.loadingPromise;
  }

  async saveToServer(): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      const payload = {
        user_id: (window as any).Clerk?.user?.id || "anonymous",
        pinned_courses: this.progress.pinned_courses,
        favorite_courses: this.progress.favorite_courses,
        completed_lessons: this.progress.completed_lessons,
        study_time_total: this.progress.study_time_total,
        study_time_by_day: this.progress.study_time_by_day,
        quiz_scores: this.progress.quiz_scores,
        lesson_notes: this.progress.lesson_notes,
        streak_count: this.progress.streak_count || 0,
        streak_last_date: this.progress.streak_last_date || null,
      };
      await api.post("/api/v1/user/progress", payload);
    } catch (err) {
      console.error("Failed to save user progress to server", err);
    }
  }

  // Course ID Registry (stubs since list is fully queryable from API)
  getCourseIds(): string[] {
    return [];
  }
  addCourseId(id: string) {}
  removeCourseId(id: string) {}

  // Pinned / Favorite Courses
  getPinnedCourses(): { id: string; title: string }[] {
    return this.progress.pinned_courses || [];
  }

  async pinCourse(id: string, title: string) {
    const pinned = this.getPinnedCourses();
    if (!pinned.some((p) => p.id === id)) {
      pinned.push({ id, title });
      this.progress.pinned_courses = pinned;
      await this.saveToServer();
      window.dispatchEvent(new Event("storage"));
    }
  }

  async unpinCourse(id: string) {
    this.progress.pinned_courses = this.getPinnedCourses().filter((p) => p.id !== id);
    await this.saveToServer();
    window.dispatchEvent(new Event("storage"));
  }

  getFavorites(): string[] {
    return this.progress.favorite_courses || [];
  }

  async toggleFavorite(id: string) {
    const favs = this.getFavorites();
    const idx = favs.indexOf(id);
    if (idx === -1) {
      favs.push(id);
    } else {
      favs.splice(idx, 1);
    }
    this.progress.favorite_courses = favs;
    await this.saveToServer();
    window.dispatchEvent(new Event("storage"));
  }

  async unfavoriteCourse(id: string) {
    this.progress.favorite_courses = this.getFavorites().filter((f) => f !== id);
    await this.saveToServer();
    window.dispatchEvent(new Event("storage"));
  }

  // Lesson completions registry
  getCompletedLessons(): string[] {
    return this.progress.completed_lessons || [];
  }

  async toggleLessonComplete(lessonId: string) {
    const completed = this.getCompletedLessons();
    const idx = completed.indexOf(lessonId);
    if (idx === -1) {
      completed.push(lessonId);
    } else {
      completed.splice(idx, 1);
    }
    this.progress.completed_lessons = completed;
    await this.saveToServer();
    window.dispatchEvent(new Event("storage"));
  }

  isLessonCompleted(lessonId: string): boolean {
    return this.getCompletedLessons().includes(lessonId);
  }

  // Study timers
  getStudyTime(): number {
    return this.progress.study_time_total || 0;
  }

  getStudyTimeByDay(): Record<string, number> {
    return this.progress.study_time_by_day || {};
  }

  async addStudyTime(seconds: number) {
    this.progress.study_time_total = (this.progress.study_time_total || 0) + seconds;
    
    const day = new Date().toLocaleDateString("en-US", { weekday: "short" });
    const byDay = this.getStudyTimeByDay();
    byDay[day] = (byDay[day] || 0) + seconds;
    this.progress.study_time_by_day = byDay;

    await this.updateStreak();
  }

  // Streak calculations
  getStreak(): StreakInfo {
    return {
      count: this.progress.streak_count || 0,
      lastDate: this.progress.streak_last_date || null,
    };
  }

  async updateStreak() {
    const today = new Date().toDateString();
    const currentStreak = this.getStreak();

    if (currentStreak.lastDate === today) {
      await this.saveToServer();
      window.dispatchEvent(new Event("storage"));
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (currentStreak.lastDate === yesterdayStr) {
      this.progress.streak_count = (this.progress.streak_count || 0) + 1;
    } else {
      this.progress.streak_count = 1;
    }

    this.progress.streak_last_date = today;
    await this.saveToServer();
    window.dispatchEvent(new Event("storage"));
  }

  // Markdown Notes panel
  getNotes(lessonId: string): string {
    return this.progress.lesson_notes[lessonId] || "";
  }

  async saveNotes(lessonId: string, notes: string) {
    this.progress.lesson_notes[lessonId] = notes;
    await this.saveToServer();
  }

  // Master cache reset
  async clearAllData() {
    this.progress = {
      pinned_courses: [],
      favorite_courses: [],
      completed_lessons: [],
      study_time_total: 0,
      study_time_by_day: {},
      quiz_scores: {},
      lesson_notes: {},
      streak_count: 0,
      streak_last_date: null,
    };
    await this.saveToServer();
    window.dispatchEvent(new Event("storage"));
  }

  // Quiz Scores
  getQuizScores(): Record<string, number> {
    return this.progress.quiz_scores || {};
  }

  async saveQuizScore(lessonId: string, scorePercent: number) {
    const scores = this.getQuizScores();
    scores[lessonId] = scorePercent;
    this.progress.quiz_scores = scores;
    await this.saveToServer();
    window.dispatchEvent(new Event("storage"));
  }

  getAvgQuizScore(): number {
    const scores = Object.values(this.getQuizScores());
    if (scores.length === 0) return 0;
    const sum = scores.reduce((a, b) => a + b, 0);
    return Math.round(sum / scores.length);
  }
}

export const coursePersistence = new CoursePersistenceService();
export default coursePersistence;
