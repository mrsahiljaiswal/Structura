/**
 * Purpose: Suggested Prompts Panel for Structura AI Tutor
 * Renders quick question cards to help users initiate tutor chats.
 */

import React from "react";
import { Sparkles, Terminal, Award, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuggestedPromptsProps {
  courseTitle?: string;
  onSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ courseTitle, onSelect }: SuggestedPromptsProps) {
  const activeTitle = courseTitle ? `"${courseTitle}"` : "my enrolled course";

  const suggestions = [
    {
      label: "Summarize Course Concepts",
      desc: `Get a clear high-level breakdown of ${activeTitle}.`,
      prompt: `Can you summarize the primary chapters and core learning objectives of ${activeTitle}?`,
      icon: <Sparkles className="h-4 w-4 text-primary" />,
    },
    {
      label: "Key Definitions & Formulas",
      desc: "Extract core terminology and essential formulas.",
      prompt: `What are the core definitions, essential formulas, and key terms introduced in ${activeTitle}?`,
      icon: <Terminal className="h-4 w-4 text-violet-400" />,
    },
    {
      label: "Explain Core Theory",
      desc: "Step-by-step conceptual breakdown of Chapter 1.",
      prompt: `Can you explain the main theoretical concept from Chapter 1 of ${activeTitle} with a step-by-step breakdown?`,
      icon: <MessageSquare className="h-4 w-4 text-indigo-400" />,
    },
    {
      label: "Generate Practice Quiz",
      desc: "Test your retention with 3 checkup questions.",
      prompt: `Draft 3 multiple-choice practice questions based strictly on ${activeTitle}.`,
      icon: <Award className="h-4 w-4 text-emerald-400" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mx-auto select-none mt-2">
      {suggestions.map((s, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(s.prompt)}
          className="flex flex-col items-start text-left p-3.5 rounded-2xl border border-border/80 bg-card/80 hover:bg-secondary/80 hover:border-primary/40 active:scale-98 transition-all duration-200 cursor-pointer shadow-xs backdrop-blur-md"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="rounded-xl p-1.5 bg-secondary border border-primary/20 text-primary shadow-xs">
              {s.icon}
            </div>
            <span className="text-xs font-bold text-foreground">{s.label}</span>
          </div>
          <span className="text-[11px] text-muted-foreground leading-relaxed">
            {s.desc}
          </span>
        </button>
      ))}
    </div>
  );
}
export default SuggestedPrompts;
