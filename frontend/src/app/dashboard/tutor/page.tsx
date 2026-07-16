/**
 * Purpose: Redesigned AI Tutor Chat Page for Structura
 * Composes chat input boxes, messages histories, and course context drop-selectors.
 */

"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { SuggestedPrompts, ChatMessages, ChatInput, ChatMessage } from "@/components/tutor";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCourses } from "@/hooks/use-courses";
import api from "@/lib/axios";
import { Sparkles, MessageSquare, BookOpen, AlertCircle, RefreshCw } from "lucide-react";

export default function TutorPage() {
  const { courses } = useCourses();
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Hello! I am your AI Study Tutor. Select a course context above, or ask me any technical questions about B-Trees, Index optimizations, or semantic structures.",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const breadcrumbs = [
    { label: "AI Tutor", href: "/dashboard/tutor" },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Call backend REST API tutor chat endpoint
      const res = await api.post("/api/v1/tutor/chat", {
        message: text,
        course_id: selectedCourseId || null,
      });

      // Handle response structure
      const aiResponse = res.data;
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: aiResponse.response || aiResponse.text || "I processed your question, but could not assemble a response summary.",
        citation: aiResponse.citation || aiResponse.reference || null,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: "ai",
        text: "⚠️ Generation failed. Make sure your local Python FastAPI server is running and configured with a Groq API Key.",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: "welcome",
        sender: "ai",
        text: "Chat history cleared. Select a course context to begin studying with specific document context.",
      },
    ]);
  };

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6 h-[calc(100vh-10rem)] flex flex-col justify-between">
        {/* Top Navigation Row: Title & Context Selector dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/20 pb-4 shrink-0">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase">
              <Sparkles className="h-4 w-4" />
              <span>Cognitive Assistant</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <MessageSquare className="h-5.5 w-5.5 text-indigo-400" />
              <span>AI Study Tutor</span>
            </h1>
          </div>

          {/* Context Selector Select Element */}
          <div className="flex items-center gap-3 self-start sm:self-auto select-none">
            <label htmlFor="context-select" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
              Active Context:
            </label>
            <select
              id="context-select"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="h-9 px-3 rounded-xl border border-border/40 bg-zinc-950 text-xs font-semibold text-foreground focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="">Universal AI Tutor</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            {/* Clear Button */}
            <button
              onClick={handleClearHistory}
              className="p-2 rounded-xl text-zinc-500 hover:text-foreground hover:bg-secondary/40 transition-colors shrink-0"
              aria-label="Clear chat"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Middle Area: Message History or Prompt suggestions */}
        <div className="flex-1 min-h-0 flex flex-col justify-between relative bg-zinc-900/10 border border-border/30 rounded-2xl overflow-hidden backdrop-blur-sm">
          {messages.length <= 1 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/5 border border-indigo-500/15 text-indigo-400">
                <Sparkles className="h-6 w-6 animate-pulse" />
              </div>
              <div className="space-y-2 max-w-md">
                <h2 className="font-bold text-foreground text-sm">NotebookLM Study Mode</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Start typing a custom question below, select an active study outline, or choose from one of the suggested checkups.
                </p>
              </div>

              <SuggestedPrompts onSelect={(prompt) => handleSendMessage(prompt)} />
            </div>
          ) : (
            <ChatMessages messages={messages} isLoading={isLoading} />
          )}
        </div>

        {/* Lower Row: Form Input Container */}
        <div className="shrink-0 max-w-4xl w-full mx-auto pb-4">
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={() => handleSendMessage()}
            disabled={isLoading}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
