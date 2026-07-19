import React, { useState } from "react";
import { Sidebar, Navbar, CommandPalette, useKeyboardShortcuts } from "@/components/shared";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export function DashboardLayout({ children, breadcrumbs = [] }: DashboardLayoutProps) {
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("structura-sidebar-collapsed");
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("structura-sidebar-collapsed", JSON.stringify(next));
      }
      return next;
    });
  };

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
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={toggleSidebar}
        />

        {/* Main scrollable content view */}
        <main
          className={cn(
            "flex-1 transition-all duration-300 ease-in-out w-full min-w-0",
            isSidebarCollapsed ? "pl-0 md:pl-16" : "pl-0 md:pl-[260px]"
          )}
        >
          <div className="mx-auto max-w-7xl p-4 sm:p-6 md:p-8 animate-in fade-in duration-150">
            {children}
          </div>
        </main>
      </div>

      {/* Command Palette Overlay */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
      />
    </div>
  );
}
