/**
 * Purpose: Chat Messages List Component for Structura AI Tutor
 * Renders user text bubbles and AI responses, reusing MarkdownRenderer.
 */

import React, { useEffect, useRef } from "react";
import { Sparkles, User, AlertCircle, Quote } from "lucide-react";
import { MarkdownRenderer } from "@/components/reader/markdown-renderer";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  citation?: string;
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin">
      {messages.map((m) => {
        const isAI = m.sender === "ai";

        return (
          <div
            key={m.id}
            className={cn(
              "flex gap-4 max-w-4xl mx-auto items-start",
              isAI ? "justify-start text-left" : "justify-end text-right flex-row-reverse"
            )}
          >
            {/* Avatar indicator */}
            <div className="shrink-0 select-none">
              {isAI ? (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md border border-indigo-400/20">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary border border-border text-muted-foreground">
                  <User className="h-4.5 w-4.5" />
                </div>
              )}
            </div>

            {/* Bubble content container */}
            <div
              className={cn(
                "space-y-2.5 max-w-[82%]",
                isAI ? "items-start text-left" : "items-end text-right flex flex-col ml-auto"
              )}
            >
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm leading-relaxed border select-text shadow-xs transition-colors",
                  m.text.startsWith("⚠️")
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200 font-medium rounded-tl-xs"
                    : isAI
                    ? "bg-card border-border text-foreground rounded-tl-xs"
                    : "bg-primary border-primary text-primary-foreground font-medium rounded-tr-xs"
                )}
              >
                {isAI ? (
                  <MarkdownRenderer content={m.text} />
                ) : (
                  <p className="whitespace-pre-wrap select-text text-right">{m.text}</p>
                )}
              </div>

              {/* Citation Details Card */}
              {isAI && m.citation && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-accent border border-indigo-500/20 rounded-lg px-2.5 py-1.5 max-w-fit shadow-xs">
                  <Quote className="h-3 w-3 shrink-0" />
                  <span className="truncate">Reference Source: {m.citation}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Pulsing Loading Indicators */}
      {isLoading && (
        <div className="flex gap-4 max-w-4xl mx-auto items-start justify-start text-left">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shrink-0">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div className="rounded-2xl px-4 py-3 bg-secondary border border-border flex items-center gap-1.5 shadow-xs min-h-[40px]">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      )}

      <div ref={scrollRef} />
    </div>
  );
}
export default ChatMessages;
