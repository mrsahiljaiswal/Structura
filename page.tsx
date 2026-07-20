"use client";

/**
 * /dashboard/tutor
 * -----------------
 * 3-feature AI Study Tutor Suite: RAG Chat, Socratic Concept Explainer,
 * and Practice Challenge Generator.
 *
 * Assumptions about sibling modules (adjust import paths to match your repo):
 *  - "@/components/dashboard-layout" exports a <DashboardLayout> wrapper
 *    that already handles the mobile drawer / nav chrome.
 *  - "@/components/markdown-renderer" exports <MarkdownRenderer content={string} />
 *  - "@/lib/course-persistence" exports `coursePersistence.saveQuizScore(id, percent)`
 *  - Clerk's useUser() hook is available via "@clerk/nextjs"
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import DashboardLayout from "@/components/dashboard-layout";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { coursePersistence } from "@/lib/course-persistence";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

type GroundingMode = "courses_only" | "both" | "web_only";
type TabId = "chat" | "explainer" | "quiz";
type DepthLevel = "eli5" | "analogy" | "deep_dive" | "misconceptions";
type QuizSize = 3 | 5 | 10;

interface Course {
  id: string;
  title: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const CHAT_HISTORY_STORAGE_KEY = "structura_tutor_chat_history_v1";

const GROUNDING_LABELS: Record<GroundingMode, string> = {
  courses_only: "📘 Courses Only",
  both: "🌐 Courses + Web",
  web_only: "✨ Web Only",
};

const DEPTH_LEVELS: { id: DepthLevel; label: string; icon: string; description: string }[] = [
  { id: "eli5", label: "ELI5", icon: "👶", description: "Explain like I'm five" },
  { id: "analogy", label: "Analogy", icon: "💡", description: "Make it click with a comparison" },
  { id: "deep_dive", label: "Deep Dive", icon: "🔬", description: "Technical, thorough detail" },
  { id: "misconceptions", label: "Misconceptions", icon: "⚠️", description: "Common mistakes, corrected" },
];

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ---------------------------------------------------------------------------
// Shared fetch helper
// ---------------------------------------------------------------------------

async function callChatApi(params: {
  userId: string;
  message: string;
  courseId: string | null;
  groundingMode: GroundingMode;
  history?: { role: "user" | "assistant"; content: string }[];
}): Promise<string> {
  const res = await fetch(`${API_BASE}/api/v1/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": params.userId,
    },
    body: JSON.stringify({
      message: params.message,
      course_id: params.courseId,
      grounding_mode: params.groundingMode,
      history: params.history ?? [],
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail || `Request failed with status ${res.status}`);
  }

  const data = await res.json();
  return data.response as string;
}

/** Best-effort extraction of a JSON payload from an LLM text response,
 * tolerant of markdown code fences or leading/trailing prose. */
function extractQuizQuestions(raw: string): QuizQuestion[] {
  let text = raw.trim();
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) text = fenceMatch[1].trim();

  const firstBracket = Math.min(
    ...[text.indexOf("["), text.indexOf("{")].filter((i) => i !== -1)
  );
  const lastBracket = Math.max(text.lastIndexOf("]"), text.lastIndexOf("}"));
  if (firstBracket !== Infinity && lastBracket !== -1 && lastBracket > firstBracket) {
    text = text.slice(firstBracket, lastBracket + 1);
  }

  const parsed = JSON.parse(text);
  const rawQuestions: unknown[] = Array.isArray(parsed) ? parsed : parsed.questions;

  if (!Array.isArray(rawQuestions)) throw new Error("Unexpected quiz format");

  return rawQuestions.map((q) => {
    const item = q as { question: string; options: string[]; correctIndex: number };
    if (
      typeof item.question !== "string" ||
      !Array.isArray(item.options) ||
      typeof item.correctIndex !== "number"
    ) {
      throw new Error("Malformed question object");
    }
    return item;
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TutorPage() {
  const { user } = useUser();
  const userId = user?.id ?? null;

  const [activeTab, setActiveTab] = useState<TabId>("chat");
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/courses`, {
          headers: { "x-user-id": userId },
        });
        if (!res.ok) return;
        setCourses(await res.json());
      } catch {
        // dropdowns just render "All courses" if this fails
      }
    })();
  }, [userId]);

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: "chat", label: "RAG Chat", icon: "💬" },
    { id: "explainer", label: "Concept Explainer", icon: "🧠" },
    { id: "quiz", label: "Practice Challenge", icon: "📝" },
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto flex h-full max-w-5xl flex-col gap-4 p-4 sm:p-6">
        <header>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">AI Study Tutor</h1>
          <p className="mt-1 text-sm text-gray-500">
            Chat with your courses, get concepts explained your way, and drill with generated quizzes.
          </p>
        </header>

        {/* Tab bar - horizontally scrollable on mobile */}
        <nav className="flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                activeTab === tab.id
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span>{tab.icon}</span>
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="min-h-0 flex-1">
          {activeTab === "chat" && <RagChatTab userId={userId} courses={courses} />}
          {activeTab === "explainer" && <ExplainerTab userId={userId} courses={courses} />}
          {activeTab === "quiz" && <QuizTab userId={userId} courses={courses} />}
        </div>
      </div>
    </DashboardLayout>
  );
}

// ---------------------------------------------------------------------------
// Tab 1: RAG Chat
// ---------------------------------------------------------------------------

function RagChatTab({ userId, courses }: { userId: string | null; courses: Course[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groundingMode, setGroundingMode] = useState<GroundingMode>("both");
  const [courseId, setCourseId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Restore persisted history
  useEffect(() => {
    if (!userId) return;
    try {
      const saved = localStorage.getItem(`${CHAT_HISTORY_STORAGE_KEY}_${userId}`);
      if (saved) setMessages(JSON.parse(saved));
    } catch {
      // ignore corrupted local storage
    }
  }, [userId]);

  // Persist history on change
  useEffect(() => {
    if (!userId || messages.length === 0) return;
    localStorage.setItem(`${CHAT_HISTORY_STORAGE_KEY}_${userId}`, JSON.stringify(messages.slice(-40)));
  }, [messages, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || !userId) return;

    const userMessage: ChatMessage = { id: uid(), role: "user", content: trimmed, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await callChatApi({
        userId,
        message: trimmed,
        courseId: courseId || null,
        groundingMode,
        history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      });
      setMessages((prev) => [...prev, { id: uid(), role: "assistant", content: response, timestamp: Date.now() }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, userId, courseId, groundingMode, messages]);

  const clearHistory = () => {
    setMessages([]);
    if (userId) localStorage.removeItem(`${CHAT_HISTORY_STORAGE_KEY}_${userId}`);
  };

  return (
    <div className="flex h-[70vh] flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-gray-100 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">All my courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          <select
            value={groundingMode}
            onChange={(e) => setGroundingMode(e.target.value as GroundingMode)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {(Object.keys(GROUNDING_LABELS) as GroundingMode[]).map((mode) => (
              <option key={mode} value={mode}>
                {GROUNDING_LABELS[mode]}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={clearHistory}
          className="self-start rounded-lg px-3 py-2 text-xs font-medium text-gray-500 hover:bg-gray-100 sm:self-auto"
        >
          Clear history
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="mt-10 text-center text-sm text-gray-400">
            Ask a question about your courses to get started.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user" ? "rounded-br-sm bg-indigo-600 text-white" : "rounded-bl-sm bg-gray-100 text-gray-800"
              }`}
            >
              {m.role === "assistant" ? <MarkdownRenderer content={m.content} /> : <span className="whitespace-pre-wrap">{m.content}</span>}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-gray-100 px-4 py-2.5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && <p className="border-t border-rose-100 bg-rose-50 px-4 py-2 text-xs text-rose-600">{error}</p>}

      <div className="flex items-end gap-2 border-t border-gray-100 p-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask about your courses..."
          rows={1}
          className="max-h-28 flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          Send
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Socratic Concept Explainer
// ---------------------------------------------------------------------------

function ExplainerTab({ userId, courses }: { userId: string | null; courses: Course[] }) {
  const [concept, setConcept] = useState("");
  const [depth, setDepth] = useState<DepthLevel>("eli5");
  const [courseId, setCourseId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [explainerResult, setExplainerResult] = useState<string>("");

  const depthPrompt = (level: DepthLevel, topic: string): string => {
    switch (level) {
      case "eli5":
        return `Explain the concept "${topic}" like I'm five years old. Use very simple words, a short relatable example, and no jargon.`;
      case "analogy":
        return `Explain the concept "${topic}" using one vivid, memorable analogy that makes the idea click intuitively. Walk through how the analogy maps to the real concept.`;
      case "deep_dive":
        return `Give a rigorous, technical deep dive on "${topic}". Cover underlying mechanisms, edge cases, and nuance a student would need for mastery, not just a surface overview.`;
      case "misconceptions":
        return `List the most common misconceptions students have about "${topic}", explain why each one is wrong, and give the correct understanding for each.`;
    }
  };

  const handleExplain = useCallback(async () => {
    const trimmed = concept.trim();
    if (!trimmed || isLoading || !userId) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await callChatApi({
        userId,
        message: depthPrompt(depth, trimmed),
        courseId: courseId || null,
        groundingMode: "both",
      });
      setExplainerResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }, [concept, depth, courseId, isLoading, userId]);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
        <input
          type="text"
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder="Enter a concept, e.g. 'recursion' or 'supply and demand'"
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="">No course context</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {DEPTH_LEVELS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setDepth(d.id)}
            title={d.description}
            className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-xs font-medium transition-colors ${
              depth === d.id
                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span className="text-lg">{d.icon}</span>
            {d.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleExplain}
        disabled={isLoading || !concept.trim()}
        className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-300 sm:w-auto"
      >
        {isLoading ? "Explaining..." : "Explain This Concept"}
      </button>

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}

      {explainerResult && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <MarkdownRenderer content={explainerResult} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3: Practice Challenge Generator
// ---------------------------------------------------------------------------

function QuizTab({ userId, courses }: { userId: string | null; courses: Course[] }) {
  const [courseId, setCourseId] = useState<string>("");
  const [quizSize, setQuizSize] = useState<QuizSize>(5);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [scorePercent, setScorePercent] = useState<number | null>(null);

  const buildQuizPrompt = (count: number) =>
    `Generate exactly ${count} multiple-choice practice questions strictly based on the user's actual uploaded course lessons. ` +
    `Each question must have exactly 4 answer options and one correct answer. ` +
    `Respond with ONLY valid JSON (no prose, no markdown code fences) in this exact shape: ` +
    `{"questions": [{"question": "string", "options": ["string", "string", "string", "string"], "correctIndex": 0}]}`;

  const generateQuiz = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    setSubmitted(false);
    setScorePercent(null);
    setAnswers({});

    try {
      const response = await callChatApi({
        userId,
        message: buildQuizPrompt(quizSize),
        courseId: courseId || null,
        groundingMode: "courses_only",
      });
      const parsedQuestions = extractQuizQuestions(response);
      if (parsedQuestions.length === 0) throw new Error("No questions were generated.");
      setQuestions(parsedQuestions);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Couldn't generate a quiz: ${err.message}`
          : "Couldn't generate a quiz. Please try again."
      );
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, courseId, quizSize]);

  const selectAnswer = (questionIndex: number, optionIndex: number) => {
    if (submitted || answers[questionIndex] !== undefined) return; // lock after first pick
    setAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const allAnswered = questions.length > 0 && Object.keys(answers).length === questions.length;

  const submitQuiz = () => {
    if (!allAnswered) return;
    const correctCount = questions.reduce(
      (acc, q, idx) => acc + (answers[idx] === q.correctIndex ? 1 : 0),
      0
    );
    const percent = Math.round((correctCount / questions.length) * 100);
    setScorePercent(percent);
    setSubmitted(true);
    coursePersistence.saveQuizScore(`tutor-challenge-${Date.now()}`, percent);
  };

  const tryAnotherQuiz = () => {
    setQuestions([]);
    setAnswers({});
    setSubmitted(false);
    setScorePercent(null);
    generateQuiz();
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="">All my courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>

        <select
          value={quizSize}
          onChange={(e) => setQuizSize(Number(e.target.value) as QuizSize)}
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value={3}>3 Questions</option>
          <option value={5}>5 Questions</option>
          <option value={10}>10 Questions</option>
        </select>

        <button
          type="button"
          onClick={generateQuiz}
          disabled={isLoading}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isLoading ? "Generating..." : questions.length > 0 ? "Generate More Questions" : "Generate Quiz"}
        </button>
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}

      {questions.length === 0 && !isLoading && !error && (
        <p className="mt-6 text-center text-sm text-gray-400">
          Choose a course and question count, then generate a quiz from your own lessons.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {questions.map((q, qIdx) => {
          const selected = answers[qIdx];
          const hasAnswered = selected !== undefined;

          return (
            <div key={qIdx} className="rounded-xl border border-gray-200 p-4">
              <p className="mb-3 text-sm font-semibold text-gray-800">
                {qIdx + 1}. {q.question}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {q.options.map((option, optIdx) => {
                  const isCorrectOption = optIdx === q.correctIndex;
                  const isSelected = selected === optIdx;

                  let styles = "border-gray-200 text-gray-700 hover:bg-gray-50";
                  if (hasAnswered) {
                    if (isCorrectOption) {
                      styles = "border-emerald-500 bg-emerald-50 text-emerald-700";
                    } else if (isSelected && !isCorrectOption) {
                      styles = "border-rose-500 bg-rose-50 text-rose-700";
                    } else {
                      styles = "border-gray-200 text-gray-400";
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => selectAnswer(qIdx, optIdx)}
                      disabled={hasAnswered}
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:cursor-default ${styles}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {questions.length > 0 && !submitted && (
        <button
          type="button"
          onClick={submitQuiz}
          disabled={!allAnswered}
          className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-300 sm:w-auto"
        >
          Submit Quiz
        </button>
      )}

      {submitted && scorePercent !== null && (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-indigo-800">
            You scored {scorePercent}% ({Object.values(answers).filter((a, i) => a === questions[i].correctIndex).length}/
            {questions.length} correct)
          </p>
          <button
            type="button"
            onClick={tryAnotherQuiz}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Try Another Quiz
          </button>
        </div>
      )}
    </div>
  );
}
