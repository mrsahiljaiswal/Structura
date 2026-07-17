/**
 * Purpose: Local Storage Course Persistence Service for Structura
 * Manages course lists, favorites, pins, lesson completions, and study time logs.
 * Provides a clean interface that can be easily swapped for database REST APIs later.
 */

const KEYS = {
  COURSE_IDS: "structura-course-ids",
  PINNED_IDS: "structura-pinned-courses",
  FAVORITES: "structura-favorites",
  COMPLETED_LESSONS: "structura-completed-lessons",
  STUDY_TIME: "structura-study-time",
  STREAK_INFO: "structura-streak-info",
  NOTES_PREFIX: "structura-notes-",
};

interface StreakInfo {
  count: number;
  lastDate: string | null;
}

class CoursePersistenceService {
  // Course ID Registry
  getCourseIds(): string[] {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem(KEYS.COURSE_IDS);
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }

  addCourseId(id: string) {
    if (typeof window === "undefined") return;
    const ids = this.getCourseIds();
    if (!ids.includes(id)) {
      ids.push(id);
      localStorage.setItem(KEYS.COURSE_IDS, JSON.stringify(ids));
      // Dispatch storage event to trigger sidebar updates
      window.dispatchEvent(new Event("storage"));
    }
  }

  removeCourseId(id: string) {
    if (typeof window === "undefined") return;
    const ids = this.getCourseIds().filter((currId) => currId !== id);
    localStorage.setItem(KEYS.COURSE_IDS, JSON.stringify(ids));
    
    // Cleanup pins and favorites
    this.unpinCourse(id);
    this.unfavoriteCourse(id);
    window.dispatchEvent(new Event("storage"));
  }

  // Pinned / Favorite Courses
  getPinnedCourses(): { id: string; title: string }[] {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem(KEYS.PINNED_IDS);
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }

  pinCourse(id: string, title: string) {
    if (typeof window === "undefined") return;
    const pinned = this.getPinnedCourses();
    if (!pinned.some((p) => p.id === id)) {
      pinned.push({ id, title });
      localStorage.setItem(KEYS.PINNED_IDS, JSON.stringify(pinned));
      window.dispatchEvent(new Event("storage"));
    }
  }

  unpinCourse(id: string) {
    if (typeof window === "undefined") return;
    const pinned = this.getPinnedCourses().filter((p) => p.id !== id);
    localStorage.setItem(KEYS.PINNED_IDS, JSON.stringify(pinned));
    window.dispatchEvent(new Event("storage"));
  }

  getFavorites(): string[] {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem(KEYS.FAVORITES);
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }

  toggleFavorite(id: string) {
    if (typeof window === "undefined") return;
    const favs = this.getFavorites();
    const idx = favs.indexOf(id);
    if (idx === -1) {
      favs.push(id);
    } else {
      favs.splice(idx, 1);
    }
    localStorage.setItem(KEYS.FAVORITES, JSON.stringify(favs));
    window.dispatchEvent(new Event("storage"));
  }

  unfavoriteCourse(id: string) {
    if (typeof window === "undefined") return;
    const favs = this.getFavorites().filter((f) => f !== id);
    localStorage.setItem(KEYS.FAVORITES, JSON.stringify(favs));
    window.dispatchEvent(new Event("storage"));
  }

  // Lesson completions registry
  getCompletedLessons(): string[] {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem(KEYS.COMPLETED_LESSONS);
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }

  toggleLessonComplete(lessonId: string) {
    if (typeof window === "undefined") return;
    const completed = this.getCompletedLessons();
    const idx = completed.indexOf(lessonId);
    if (idx === -1) {
      completed.push(lessonId);
    } else {
      completed.splice(idx, 1);
    }
    localStorage.setItem(KEYS.COMPLETED_LESSONS, JSON.stringify(completed));
    window.dispatchEvent(new Event("storage"));
  }

  isLessonCompleted(lessonId: string): boolean {
    return this.getCompletedLessons().includes(lessonId);
  }

  // Study timers
  getStudyTime(): number {
    if (typeof window === "undefined") return 0;
    const time = localStorage.getItem(KEYS.STUDY_TIME);
    return time ? parseInt(time, 10) : 0;
  }

  getStudyTimeByDay(): Record<string, number> {
    if (typeof window === "undefined") return {};
    const saved = localStorage.getItem("structura-study-time-by-day");
    if (!saved) return {};
    try {
      return JSON.parse(saved);
    } catch {
      return {};
    }
  }

  addStudyTime(seconds: number) {
    if (typeof window === "undefined") return;
    const current = this.getStudyTime();
    localStorage.setItem(KEYS.STUDY_TIME, (current + seconds).toString());
    
    // Log per-day study time
    const day = new Date().toLocaleDateString("en-US", { weekday: "short" }); // e.g. "Mon", "Tue"
    const byDay = this.getStudyTimeByDay();
    byDay[day] = (byDay[day] || 0) + seconds;
    localStorage.setItem("structura-study-time-by-day", JSON.stringify(byDay));

    this.updateStreak();
  }

  // Streak calculations
  getStreak(): StreakInfo {
    if (typeof window === "undefined") return { count: 0, lastDate: null };
    const saved = localStorage.getItem(KEYS.STREAK_INFO);
    if (!saved) return { count: 0, lastDate: null };
    try {
      return JSON.parse(saved);
    } catch {
      return { count: 0, lastDate: null };
    }
  }

  updateStreak() {
    if (typeof window === "undefined") return;
    const today = new Date().toDateString();
    const streak = this.getStreak();

    if (streak.lastDate === today) return; // Streak already incremented today

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (streak.lastDate === yesterdayStr) {
      streak.count += 1;
    } else {
      streak.count = 1; // Streak broken, restart
    }

    streak.lastDate = today;
    localStorage.setItem(KEYS.STREAK_INFO, JSON.stringify(streak));
    window.dispatchEvent(new Event("storage"));
  }

  // Markdown Notes panel
  getNotes(lessonId: string): string {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(`${KEYS.NOTES_PREFIX}${lessonId}`) || "";
  }

  saveNotes(lessonId: string, notes: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(`${KEYS.NOTES_PREFIX}${lessonId}`, notes);
  }

  // Quiz Scores
  getQuizScores(): Record<string, number> {
    if (typeof window === "undefined") return {};
    const saved = localStorage.getItem("structura-quiz-scores");
    if (!saved) return {};
    try {
      return JSON.parse(saved);
    } catch {
      return {};
    }
  }

  saveQuizScore(lessonId: string, scorePercent: number) {
    if (typeof window === "undefined") return;
    const scores = this.getQuizScores();
    scores[lessonId] = scorePercent;
    localStorage.setItem("structura-quiz-scores", JSON.stringify(scores));
    window.dispatchEvent(new Event("storage"));
  }

  getAvgQuizScore(): number {
    const scores = Object.values(this.getQuizScores());
    if (scores.length === 0) return 0;
    const sum = scores.reduce((a, b) => a + b, 0);
    return Math.round(sum / scores.length);
  }

  // Master cache reset
  clearAllData() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(KEYS.COURSE_IDS);
    localStorage.removeItem(KEYS.PINNED_IDS);
    localStorage.removeItem(KEYS.FAVORITES);
    localStorage.removeItem(KEYS.COMPLETED_LESSONS);
    localStorage.removeItem(KEYS.STUDY_TIME);
    localStorage.removeItem("structura-study-time-by-day");
    localStorage.removeItem("structura-quiz-scores");
    localStorage.removeItem(KEYS.STREAK_INFO);
    
    // Clear all notes keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(KEYS.NOTES_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    
    window.dispatchEvent(new Event("storage"));
  }
}

export const coursePersistence = new CoursePersistenceService();
export default coursePersistence;
