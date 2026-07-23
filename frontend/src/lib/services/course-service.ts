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

export interface ActivityLogItem {
  id: string;
  type: "chatbot" | "tutor_quiz" | "lesson_read" | "course_completed" | "note_saved" | "upload";
  title: string;
  subtitle: string;
  time: string;
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
  activities?: ActivityLogItem[];
  chat_history?: { role: string; content: string }[];
}

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDateStr(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  try {
    const parsed = new Date(trimmed);
    if (isNaN(parsed.getTime())) return null;
    return getLocalDateString(parsed);
  } catch {
    return null;
  }
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
    activities: [],
    chat_history: [],
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
          chat_history: res.data.chat_history || [],
        };
        this.isLoaded = true;
        await this.checkStreakExpiration();
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      const payload = {
        user_id: win?.Clerk?.user?.id || "anonymous",
        pinned_courses: this.progress.pinned_courses,
        favorite_courses: this.progress.favorite_courses,
        completed_lessons: this.progress.completed_lessons,
        study_time_total: this.progress.study_time_total,
        study_time_by_day: this.progress.study_time_by_day,
        quiz_scores: this.progress.quiz_scores,
        lesson_notes: this.progress.lesson_notes,
        streak_count: this.progress.streak_count || 0,
        streak_last_date: this.progress.streak_last_date || null,
        chat_history: this.progress.chat_history || [],
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
    await this.updateStreak();
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

  // Check if user missed a day without prematurely resetting if study happened yesterday or today
  async checkStreakExpiration() {
    if (!this.progress.streak_last_date) return;
    const lastDateNorm = normalizeDateStr(this.progress.streak_last_date);
    if (!lastDateNorm) return;

    const todayNorm = getLocalDateString(new Date());
    if (lastDateNorm === todayNorm) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayNorm = getLocalDateString(yesterday);

    if (lastDateNorm === yesterdayNorm) return;

    // If last study date was older than yesterday, reset streak count to 0
    this.progress.streak_count = 0;
    await this.saveToServer();
    window.dispatchEvent(new Event("storage"));
  }

  // Record active study activity for today to increment/maintain streak
  async updateStreak() {
    const todayNorm = getLocalDateString(new Date());
    const lastDateNorm = normalizeDateStr(this.progress.streak_last_date);

    // Already recorded study activity for today
    if (lastDateNorm === todayNorm) {
      await this.saveToServer();
      window.dispatchEvent(new Event("storage"));
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayNorm = getLocalDateString(yesterday);

    if (lastDateNorm === yesterdayNorm) {
      this.progress.streak_count = (this.progress.streak_count || 0) + 1;
    } else {
      this.progress.streak_count = 1;
    }

    this.progress.streak_last_date = todayNorm;
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

  // Activity Logging
  getActivities(): ActivityLogItem[] {
    return this.progress.activities || [];
  }

  async addActivity(type: ActivityLogItem["type"], title: string, subtitle: string) {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const item: ActivityLogItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      title,
      subtitle,
      time,
    };
    const current = [item, ...(this.progress.activities || [])].slice(0, 30);
    this.progress.activities = current;
    await this.saveToServer();
    window.dispatchEvent(new Event("storage"));
  }

  getAvgQuizScore(): number {
    const scores = Object.values(this.getQuizScores());
    if (scores.length === 0) return 0;
    const sum = scores.reduce((a, b) => a + b, 0);
    return Math.round(sum / scores.length);
  }

  // Chat History Management
  getChatHistory(): { role: string; content: string }[] {
    return this.progress.chat_history || [];
  }

  async clearChatHistory() {
    this.progress.chat_history = [];
    await this.saveToServer();
    window.dispatchEvent(new Event("storage"));
  }
}

export const coursePersistence = new CoursePersistenceService();
export default coursePersistence;
