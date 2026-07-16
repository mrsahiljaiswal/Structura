/**
 * Purpose: General Dashboard Layout Template for Structura
 * Manages sidebars, navigation bars, Command Palettes (Ctrl+K), and toasts.
 */

import React, { useState } from "react";
import { Sidebar, Navbar, CommandPalette, FloatingAIButton, useKeyboardShortcuts } from "@/components/shared";

interface DashboardLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export function DashboardLayout({ children, breadcrumbs = [] }: DashboardLayoutProps) {
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Hook global shortcut Ctrl+K to toggle Command Palette
  useKeyboardShortcuts({
    k: () => setIsCommandOpen((prev) => !prev),
  });

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      {/* Navbar */}
      <Navbar
        onSearchTrigger={() => setIsCommandOpen(true)}
        breadcrumbs={breadcrumbs}
      />

      <div className="flex pt-16 min-h-[calc(100vh-4rem)]">
        {/* Collapsible Left Sidebar */}
        <Sidebar />

        {/* Main scrollable content view */}
        <main className="flex-1 transition-all duration-300 pl-16 md:pl-[260px]">
          <div className="mx-auto max-w-7xl p-6 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {children}
          </div>
        </main>
      </div>

      {/* Command Palette Overlay */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
      />

      {/* Ask AI Context Button */}
      <FloatingAIButton />
    </div>
  );
}
