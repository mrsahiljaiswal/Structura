/**
 * Purpose: Technical Book Reader Layout Template for Structura
 * Supports 3 columns: Left outline, Center prose reader, Right scratchpad.
 */

import React, { useState } from "react";
import { Navbar, CommandPalette, useKeyboardShortcuts } from "@/components/shared";
import { Menu, BookMarked, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReaderLayoutProps {
  children: React.ReactNode;
  leftSidebar: React.ReactNode;
  rightSidebar: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export function ReaderLayout({
  children,
  leftSidebar,
  rightSidebar,
  breadcrumbs = [],
}: ReaderLayoutProps) {
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [showLeftDrawer, setShowLeftDrawer] = useState(false);
  const [showRightDrawer, setShowRightDrawer] = useState(false);

  // Hook command palette shortcut
  useKeyboardShortcuts({
    k: () => setIsCommandOpen((prev) => !prev),
  });

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased overflow-x-hidden">
      {/* Navbar */}
      <Navbar
        onSearchTrigger={() => setIsCommandOpen(true)}
        breadcrumbs={breadcrumbs}
      />

      {/* Mobile Sub-Toolbar (Visible on Mobile & Tablet) */}
      <div className="fixed top-16 left-0 right-0 h-11 border-b border-border bg-card/90 backdrop-blur-sm z-20 flex items-center justify-between px-4 lg:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowLeftDrawer((prev) => !prev)}
          className="rounded-lg text-xs gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <Menu className="h-4 w-4" />
          <span>Outline</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowRightDrawer((prev) => !prev)}
          className="rounded-lg text-xs gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <FileText className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">Notes & Bookmarks</span>
        </Button>
      </div>

      {/* 3-Column Main Layout Grid */}
      <div className="flex pt-16 lg:pt-16 min-h-[calc(100vh-4rem)]">
        {/* Column 1: Left Course Tree (Lock Scroll on desktop) */}
        <aside
          className={`fixed left-0 top-16 bottom-0 w-80 border-r border-border bg-card z-30 transition-transform duration-300 lg:translate-x-0 overflow-y-auto ${
            showLeftDrawer ? "translate-x-0 shadow-2xl" : "-translate-x-full"
          }`}
        >
          <div className="p-4 pt-16 lg:pt-4 h-full">
            {leftSidebar}
          </div>
        </aside>

        {/* Column 2: Center Independent Prose Reader */}
        <main className="flex-1 lg:pl-80 lg:pr-80 min-h-screen flex flex-col items-center bg-background">
          {/* Overlay background when mobile drawers are active */}
          {(showLeftDrawer || showRightDrawer) && (
            <div
              onClick={() => {
                setShowLeftDrawer(false);
                setShowRightDrawer(false);
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-20 lg:hidden"
            />
          )}

          <div className="w-full max-w-3xl px-4 sm:px-6 lg:px-8 pt-28 pb-16 lg:py-12 flex-1 animate-in fade-in duration-300">
            {children}
          </div>
        </main>

        {/* Column 3: Right Notes & Bookmarks Panel (Lock Scroll on desktop) */}
        <aside
          className={`fixed right-0 top-16 bottom-0 w-80 border-l border-border bg-card z-30 transition-transform duration-300 lg:translate-x-0 overflow-y-auto ${
            showRightDrawer ? "translate-x-0 shadow-2xl" : "translate-x-full"
          }`}
        >
          <div className="p-4 pt-16 lg:pt-4 h-full">
            {rightSidebar}
          </div>
        </aside>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
      />
    </div>
  );
}
