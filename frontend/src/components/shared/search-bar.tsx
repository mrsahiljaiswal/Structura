/**
 * Purpose: Premium Search Bar Trigger for Structura
 * Displays icon indicator and ⌘K shortcuts trigger.
 */

import React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps extends React.HTMLAttributes<HTMLButtonElement> {
  onTrigger: () => void;
}

export function SearchBar({ className, onTrigger, ...props }: SearchBarProps) {
  return (
    <button
      onClick={onTrigger}
      className={cn(
        "flex h-10 w-full max-w-sm items-center justify-between rounded-xl border border-border/60 bg-zinc-900/30 px-3 py-2 text-xs text-muted-foreground transition-all hover:bg-zinc-900/50 hover:border-border cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-zinc-500" />
        <span>Search courses, lessons...</span>
      </div>
      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-border/60 bg-zinc-950 px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
        <span className="text-[10px]">Ctrl</span>K
      </kbd>
    </button>
  );
}
