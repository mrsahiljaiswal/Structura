/**
 * Purpose: Custom Illustrated Empty States for Structura
 * Displays visual icons, headers, and actionable buttons.
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: string | React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  className,
  icon,
  title,
  description,
  actionText,
  onAction,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed border-border/40 bg-zinc-900/10 backdrop-blur-sm max-w-md mx-auto",
        className
      )}
      {...props}
    >
      {/* Illustrated Icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/5 text-3xl mb-6 shadow-inner border border-indigo-500/10 select-none animate-pulse">
        {typeof icon === "string" ? icon : icon}
      </div>

      {/* Header text */}
      <h3 className="text-lg font-semibold text-foreground tracking-tight mb-2">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
        {description}
      </p>

      {/* Action CTA Button */}
      {actionText && onAction && (
        <Button variant="default" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
