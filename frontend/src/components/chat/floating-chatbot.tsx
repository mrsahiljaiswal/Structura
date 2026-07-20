"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { KeyboardEvent } from "react";
import { useUser } from "@clerk/nextjs";
import { MarkdownRenderer } from "@/components/reader/markdown-renderer";

type GroundingMode = "courses_only" | "both" | "web_only";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface CourseSummary {
  id: string;
  title: string;
}

interface ChatApiResponse {
  reply?: string;
  response?: string;
  sources?: string[];
  grounding_mode: GroundingMode;
}

interface ApiErrorBody {
  detail?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const GROUNDING_LABELS: Record<GroundingMode, { label: string; icon: string; hint: string }> = {
  courses_only: { label: "Courses Only", icon: "📘", hint: "Answers strictly from your uploaded lessons" },
  both: { label: "Courses + Web", icon: "🌐", hint: "Combines your course material with general knowledge" },
  web_only: { label: "Web Only", icon: "✨", hint: "General knowledge, no course citations" },
};

const QUICK_ACTIONS = [
  "What should I study next?",
  "Summarize my progress",
  "Take a quiz",
];

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function FloatingChatbot() {
  const { user } = useUser();
  const userId = user?.id ?? null;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("structura-floating-chat-messages");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {
          // ignore
        }
      }
    }
    return [];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync messages history to localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && messages.length > 0) {
      localStorage.setItem("structura-floating-chat-messages", JSON.stringify(messages));
    }
  }, [messages]);

  const [groundingMode, setGroundingMode] = useState<GroundingMode>("both");
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const coursesLoadedRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Track active study time while Floating Chatbot is open
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(async () => {
      try {
        const { coursePersistence } = await import("@/lib/services/course-service");
        coursePersistence.addStudyTime(10);
      } catch (e) {
        // ignore persistence errors
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || coursesLoadedRef.current || !userId) return;
    coursesLoadedRef.current = true;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/courses`, {
          headers: { "x-user-id": userId },
        });
        if (!res.ok) return;
        const data: CourseSummary[] = await res.json();
        setCourses(data);
      } catch {
        // Non-fatal fallback
      }
    })();
  }, [isOpen, userId]);

  const seedGreeting = useCallback(() => {
    setMessages([
      {
        id: uid(),
        role: "assistant",
        content:
          "Hi! I'm your Structura AI Tutor. Ask me anything about your courses, or use a quick action below to get started.",
        timestamp: Date.now(),
      },
    ]);
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) seedGreeting();
  }, [isOpen, messages.length, seedGreeting]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      if (!userId) {
        setError("You must be signed in to chat with the tutor.");
        return;
      }

      const userMessage: ChatMessage = {
        id: uid(),
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };

      // Track 30 seconds of study time and log activity
      try {
        const { coursePersistence } = await import("@/lib/services/course-service");
        coursePersistence.addStudyTime(30);
        coursePersistence.addActivity("chatbot", "Talked with AI Assistant", text.slice(0, 40));
      } catch (e) {
        // ignore persistence errors
      }

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE}/api/v1/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify({
            message: trimmed,
            course_id: selectedCourseId || null,
            knowledge_mode: groundingMode,
            chat_history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        if (!res.ok) {
          const body: ApiErrorBody = await res.json().catch(() => ({} as ApiErrorBody));
          throw new Error(body.detail || `Request failed with status ${res.status}`);
        }

        const data: ChatApiResponse = await res.json();
        const replyText = data.reply || data.response || "No response received.";

        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content: replyText,
            timestamp: Date.now(),
          },
        ]);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setError(message);
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content: `⚠️ ${message}`,
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, userId, selectedCourseId, groundingMode, messages]
  );

  const handleSend = () => sendMessage(input);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("structura-floating-chat-messages");
    }
    seedGreeting();
  };

  return (
    <>
      <style>{`
        @media print {
          .print\\:hidden, [data-chatbot-floating] { display: none !important; }
        }
      `}</style>

      <div data-chatbot-floating className="print:hidden fixed bottom-6 right-6 z-[9999]">
        {!isOpen ? (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open AI study tutor"
            className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition-transform hover:scale-105 hover:bg-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8-1.06 0-2.078-.163-3.024-.463L3 21l1.5-4.5C3.55 15.19 3 13.65 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z"
              />
            </svg>
          </button>
        ) : (
          <div className="flex h-[580px] w-[420px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-border bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-3 text-white">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">Structura AI Tutor</p>
                <p className="truncate text-[11px] text-indigo-100">
                  {GROUNDING_LABELS[groundingMode].hint}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={clearChat}
                  title="Clear conversation"
                  className="rounded-md p-1.5 text-indigo-100 hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close chatbot"
                  className="rounded-md p-1.5 text-indigo-100 hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-2 border-b border-border bg-secondary/40 px-3 py-2">
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">All my courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-3 gap-1">
                {(Object.keys(GROUNDING_LABELS) as GroundingMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setGroundingMode(mode)}
                    className={`truncate rounded-md px-1.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                      groundingMode === mode
                        ? "bg-indigo-600 text-white font-bold"
                        : "bg-background text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                    title={GROUNDING_LABELS[mode].hint}
                  >
                    {GROUNDING_LABELS[mode].icon} {GROUNDING_LABELS[mode].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "rounded-br-sm bg-indigo-600 text-white"
                        : "rounded-bl-sm bg-secondary text-foreground"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <MarkdownRenderer content={m.content} />
                    ) : (
                      <span className="whitespace-pre-wrap">{m.content}</span>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-secondary px-3 py-2">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick actions */}
            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-1.5 border-t border-border px-3 py-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => sendMessage(action)}
                    disabled={isLoading}
                    className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-medium text-indigo-400 hover:bg-indigo-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}

            {error && (
              <p className="border-t border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-[11px] text-rose-400">{error}</p>
            )}

            {/* Input */}
            <div className="flex items-end gap-2 border-t border-border p-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your courses..."
                rows={1}
                className="max-h-24 flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                aria-label="Send message"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-muted cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-6 6m6-6l6 6" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default FloatingChatbot;
