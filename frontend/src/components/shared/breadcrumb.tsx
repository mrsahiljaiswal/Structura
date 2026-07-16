/**
 * Purpose: Custom Breadcrumb Navigation Component for Structura
 * Displays current path layers cleanly.
 */

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ className, items, ...props }: BreadcrumbProps) {
  return (
    <nav
      className={cn("flex items-center space-x-1.5 text-xs text-muted-foreground", className)}
      aria-label="Breadcrumb"
      {...props}
    >
      <Link
        href="/dashboard"
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            <ChevronRight className="h-3 w-3 shrink-0" />
            {isLast || !item.href ? (
              <span className="font-medium text-foreground truncate max-w-[150px]">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors truncate max-w-[150px]"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
