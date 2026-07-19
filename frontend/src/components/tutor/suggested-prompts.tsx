/**
 * Purpose: Suggested Prompts Panel for Structura AI Tutor
 * Renders quick question cards to help users initiate tutor chats.
 */

import React from "react";
import { Sparkles, Terminal, Award, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  const suggestions = [
    {
      label: "Explain indexing structures",
      desc: "Get a clear breakdown of B-Trees vs Hash maps.",
      prompt: "Can you explain B-Tree database indexing structures in detail?",
      icon: <Terminal className="h-4 w-4 text-indigo-400" />,
    },
    {
      label: "Summarize current outline",
      desc: "Create a brief summary of the chapters covered.",
      prompt: "Can you summarize the primary chapters and core learning objectives of the active course?",
      icon: <Sparkles className="h-4 w-4 text-violet-400" />,
    },
    {
      label: "Draft a mock exam quiz",
      desc: "Generate 3 multiple-choice practice questions.",
      prompt: "Draft 3 multiple-choice practice checkup questions based on the active lesson summaries.",
      icon: <Award className="h-4 w-4 text-emerald-400" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mx-auto select-none mt-6">
      {suggestions.map((s, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(s.prompt)}
          className="flex flex-col items-start text-left p-4 rounded-xl border border-border bg-card hover:bg-accent/60 hover:border-primary/50 active:scale-98 transition-all duration-200 cursor-pointer shadow-xs"
        >
          <div className="rounded-lg p-2 bg-accent border border-indigo-500/20 text-primary mb-3 shadow-xs">
            {s.icon}
          </div>
          <span className="text-xs font-bold text-foreground">{s.label}</span>
          <span className="text-[10px] text-muted-foreground leading-relaxed mt-1">
            {s.desc}
          </span>
        </button>
      ))}
    </div>
  );
}
export default SuggestedPrompts;
