/**
 * Purpose: Redesigned AI Tutor Chat Page for Structura
 * Composes chat input boxes, messages histories, and course context drop-selectors.
 */

"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { SuggestedPrompts, ChatMessages, ChatInput, ChatMessage } from "@/components/tutor";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCourses } from "@/hooks/use-courses";
import api from "@/lib/axios";
import { Sparkles, MessageSquare, BookOpen, AlertCircle, RefreshCw, Globe } from "lucide-react";

export default function TutorPage() {
  const { courses } = useCourses();
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [knowledgeMode, setKnowledgeMode] = useState<"courses_only" | "both" | "web_only">("both");
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("structura-tutor-messages");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {
          console.error("Failed to load saved tutor chat messages", e);
        }
      }
    }
    return [
      {
        id: "welcome",
        sender: "ai",
        text: "Hello! I am your AI Study Tutor. Select your preferred Knowledge Source mode above (Courses Only, Courses + Web, or Web Only) to begin studying.",
      },
    ];
  });
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && messages.length > 0) {
      localStorage.setItem("structura-tutor-messages", JSON.stringify(messages));
    }
  }, [messages]);

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
      // Format chat history
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.sender === "user" ? "user" : "assistant", content: m.text }));

      // Call backend REST API unified chat endpoint
      const res = await api.post("/api/v1/chat", {
        message: text,
        course_id: selectedCourseId || null,
        knowledge_mode: knowledgeMode,
        chat_history: history,
      });

      // Handle response structure
      const aiResponse = res.data;
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: aiResponse.reply || "I processed your question based on your selected mode.",
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("Tutor Chat Error:", err);
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: "ai",
        text: "⚠️ Connection issue while contacting AI Tutor. Please ensure your Python FastAPI server is running.",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    const defaultWelcome: ChatMessage[] = [
      {
        id: "welcome",
        sender: "ai",
        text: "Chat history cleared. Select a course context or change Knowledge Mode to start asking questions.",
      },
    ];
    setMessages(defaultWelcome);
    if (typeof window !== "undefined") {
      localStorage.removeItem("structura-tutor-messages");
    }
  };

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      <div className="relative flex flex-col h-[calc(100vh-4rem)] w-full justify-between overflow-hidden">
        {/* Full-Width Maximized Chat Viewport */}
        <div className="flex-1 min-h-0 w-full max-w-4xl mx-auto flex flex-col justify-between overflow-y-auto">
          {messages.length <= 1 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-accent border border-indigo-500/20 text-primary shadow-md">
                <Sparkles className="h-8 w-8 animate-pulse text-primary" />
              </div>
              <div className="space-y-2 max-w-md">
                <h1 className="font-black text-foreground text-xl tracking-tight">AI Study Tutor</h1>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Select your knowledge source and course context from the floating bar below to begin asking questions.
                </p>
              </div>

              <SuggestedPrompts onSelect={(prompt) => handleSendMessage(prompt)} />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pt-2 pb-32">
              <ChatMessages messages={messages} isLoading={isLoading} />
            </div>
          )}
        </div>

        {/* Floating Bottom Dock Bar (ChatGPT / Gemini Style) */}
        <div className="absolute bottom-4 left-0 right-0 z-30 px-4">
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={() => handleSendMessage()}
            disabled={isLoading}
            knowledgeMode={knowledgeMode}
            onModeChange={setKnowledgeMode}
            courses={courses}
            selectedCourseId={selectedCourseId}
            onCourseChange={setSelectedCourseId}
            onClearHistory={handleClearHistory}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
