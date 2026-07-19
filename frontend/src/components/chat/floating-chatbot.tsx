"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Trash2,
  ChevronDown,
  BookOpen,
  Zap,
  Award,
  HelpCircle,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import api from "@/lib/axios";
import { useUserProgress } from "@/hooks/use-user-progress";
import { MarkdownRenderer } from "@/components/reader/markdown-renderer";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestedActions?: string[];
  timestamp: string;
}

const DEFAULT_PROMPTS = [
  { label: "What should I study next?", icon: BookOpen },
  { label: "Summarize my progress & streaks", icon: Award },
  { label: "Give me a quick quiz on my course", icon: Zap },
  { label: "Explain a key concept from my lessons", icon: HelpCircle },
];

export function FloatingChatbot() {
  const { isSignedIn } = useUser();
  const { progress, clearChatHistory } = useUserProgress();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const welcomeMessage: Message = {
    id: "welcome-1",
    role: "assistant",
    content:
      "👋 **Hello! I am Structura AI**, your course-grounded tutor.\n\nI have real-time access to your **published courses** and **account progress**. Ask me anything about your lessons, test scores, or what to study next!",
    suggestedActions: [
      "What should I study next?",
      "Summarize my progress & streaks",
      "Give me a quick quiz",
    ],
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };

  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);

  const chatHistoryStr = JSON.stringify(progress?.chat_history || []);

  // Hydrate chat messages from PostgreSQL user progress safely
  useEffect(() => {
    if (progress?.chat_history && progress.chat_history.length > 0) {
      const dbMsgs: Message[] = progress.chat_history.map((m, idx) => ({
        id: `db-${idx}`,
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }));
      setMessages([welcomeMessage, ...dbMsgs]);
    }
  }, [chatHistoryStr]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Early return ONLY after all hooks have executed to comply with React Rules of Hooks
  if (!mounted || !isSignedIn) return null;

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput("");
    setIsLoading(true);

    try {
      // Format chat history for backend context
      const chatHistory = messages
        .filter((m) => m.id !== "welcome-1")
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await api.post("/api/v1/chat", {
        message: query,
        chat_history: chatHistory,
      });

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.data.reply || "I am analyzing your course progress. How can I help you today?",
        suggestedActions: response.data.suggested_actions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "⚠️ Sorry, I encountered a temporary connection issue. Please make sure your backend is running.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = async () => {
    await clearChatHistory();
    setMessages([
      {
        id: "welcome-1",
        role: "assistant",
        content: "Chat history cleared! How can I help with your courses today?",
        suggestedActions: [
          "What should I study next?",
          "Summarize my progress & streaks",
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] pointer-events-auto flex flex-col items-end">
      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="mb-4 w-[90vw] sm:w-[420px] h-[580px] max-h-[80vh] flex flex-col rounded-2xl bg-popover text-popover-foreground border border-border shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="px-4 py-3 bg-card border-b border-border flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md">
                  <Bot className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  Structura AI Tutor
                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-accent text-accent-foreground border border-indigo-500/20">
                    Course-Grounded
                  </span>
                </h3>
                <p className="text-[11px] text-muted-foreground">Connected to your account & courses</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={clearChat}
                title="Clear Chat"
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Chat"
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-accent text-accent-foreground border border-indigo-500/20"
                  }`}
                >
                  {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Content */}
                <div className="max-w-[82%] space-y-2 text-left">
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed border select-text ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground border-primary rounded-tr-none font-medium shadow-xs"
                        : "bg-secondary text-foreground border-border rounded-tl-none shadow-xs"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <MarkdownRenderer content={msg.content} />
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    )}
                    <span
                      className={`block text-[10px] mt-1.5 ${
                        msg.role === "user" ? "text-indigo-100/80" : "text-muted-foreground"
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Action Chips */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.suggestedActions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(action)}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-accent hover:bg-accent/80 text-accent-foreground border border-indigo-500/20 transition-all text-left flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-primary shrink-0" />
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-3 items-center">
                <div className="w-7 h-7 rounded-lg bg-accent border border-indigo-500/20 flex items-center justify-center text-primary">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="px-4 py-2.5 rounded-2xl rounded-tl-none bg-secondary border border-border text-muted-foreground text-xs flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                  <span className="ml-2 font-medium">Searching your published courses & progress...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts (visible when chat has few messages) */}
          {messages.length <= 2 && !isLoading && (
            <div className="px-4 py-2 bg-card border-t border-border flex gap-2 overflow-x-auto scrollbar-none">
              {DEFAULT_PROMPTS.map((prompt, i) => {
                const Icon = prompt.icon;
                return (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt.label)}
                    className="whitespace-nowrap px-2.5 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-medium text-foreground border border-border flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                  >
                    <Icon className="w-3.5 h-3.5 text-primary" />
                    {prompt.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Input Footer */}
          <div className="p-3 bg-card border-t border-border">
            <div className="relative flex items-end rounded-xl bg-background border border-border focus-within:border-primary transition-all">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your courses, progress, topics..."
                rows={1}
                className="w-full resize-none bg-transparent px-3.5 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none max-h-24 min-h-[40px]"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="mb-1.5 mr-1.5 p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:hover:opacity-40 transition-all shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-indigo-600/30 hover:scale-105 transition-all duration-300 focus:outline-none cursor-pointer"
        aria-label="Open AI Tutor Chat"
      >
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-primary border-2 border-background" />
        </span>
        {isOpen ? (
          <ChevronDown className="w-7 h-7 transition-transform duration-200" />
        ) : (
          <Bot className="w-7 h-7 transition-transform duration-200 group-hover:scale-110" />
        )}
      </button>
    </div>
  );
}
