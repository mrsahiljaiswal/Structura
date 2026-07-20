import React, { useState } from "react";
import { Sidebar, Navbar, CommandPalette, useKeyboardShortcuts } from "@/components/shared";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export function DashboardLayout({ children, breadcrumbs = [] }: DashboardLayoutProps) {
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
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

  useKeyboardShortcuts({
    k: () => setIsCommandOpen((prev) => !prev),
  });

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      {/* Navbar */}
      <Navbar
        onSearchTrigger={() => setIsCommandOpen(true)}
        onMobileMenuToggle={() => setIsMobileOpen((prev) => !prev)}
        breadcrumbs={breadcrumbs}
      />

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
        />
      )}

      <div className="flex pt-16 min-h-[calc(100vh-4rem)]">
        {/* Mobile Slide-Over Navigation Drawer */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border p-4 transition-transform duration-300 md:hidden flex flex-col justify-between shadow-2xl pt-20",
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <Sidebar
            isCollapsed={false}
            onToggle={() => setIsMobileOpen(false)}
          />
        </div>

        {/* Desktop Collapsible Left Sidebar */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={toggleSidebar}
        />

        {/* Main scrollable content view */}
        <main
          className={cn(
            "flex-1 transition-all duration-300 ease-in-out w-full min-w-0 px-2 sm:px-4 md:px-6",
            isSidebarCollapsed ? "pl-0 md:pl-16" : "pl-0 md:pl-[260px]"
          )}
        >
          <div className="mx-auto max-w-7xl py-4 sm:py-6 md:py-8 animate-in fade-in duration-150">
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
