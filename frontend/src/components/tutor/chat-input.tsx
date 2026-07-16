/**
 * Purpose: Chat Input Bar Component for Structura AI Tutor
 * Manages keystroke shortcuts (Enter to submit) and layouts.
 */

import React, { useRef } from "react";
import { Send, CornerDownLeft } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function ChatInput({ value, onChange, onSubmit, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="relative border border-border/40 bg-zinc-950/80 rounded-2xl p-2 flex items-end gap-2 focus-within:border-border/80 transition-colors shadow-2xl">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a question about database indexing, normalization..."
        disabled={disabled}
        rows={1}
        className="flex-1 bg-transparent border-0 resize-none font-sans text-sm py-3 px-2 leading-relaxed min-h-[44px] max-h-[160px] focus-visible:ring-0 focus-visible:ring-offset-0 placeholder-zinc-500"
      />
      <button
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 disabled:bg-zinc-900 disabled:text-zinc-500 disabled:active:scale-100 transition-all cursor-pointer"
        aria-label="Send message"
      >
        <Send className="h-4.5 w-4.5" />
      </button>

      {/* Keyboard Hint Overlay */}
      <span className="absolute bottom-[-22px] right-3 select-none flex items-center gap-1.5 text-[9px] text-zinc-500 font-semibold tracking-wide">
        <span>Enter to send</span>
        <CornerDownLeft className="h-2.5 w-2.5" />
      </span>
    </div>
  );
}
export default ChatInput;
