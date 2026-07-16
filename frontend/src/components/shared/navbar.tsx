/**
 * Purpose: Premium Navigation Bar Component for Structura
 * Hosts breadcrumbs, theme switches, search bars, notifications, and profile details.
 */

import React from "react";
import { Bell } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Breadcrumb } from "./breadcrumb";
import { SearchBar } from "./search-bar";
import { ThemeSwitcher } from "./theme-switcher";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  onSearchTrigger: () => void;
  breadcrumbs?: { label: string; href?: string }[];
}

export function Navbar({ onSearchTrigger, breadcrumbs = [] }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-30 h-16 border-b border-border/40 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between">
      {/* Left: Branding & Breadcrumbs */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-md">
            <span className="text-sm font-bold text-white">S</span>
          </div>
          <span className="text-sm font-bold text-foreground tracking-wide hidden sm:inline-block">
            Structura
          </span>
        </div>
        
        {breadcrumbs.length > 0 && (
          <>
            <span className="text-zinc-650 font-light">/</span>
            <Breadcrumb items={breadcrumbs} />
          </>
        )}
      </div>

      {/* Center: Search Trigger */}
      <div className="flex-1 max-w-sm mx-4 hidden md:block">
        <SearchBar onTrigger={onSearchTrigger} />
      </div>

      {/* Right: Actions & User Button */}
      <div className="flex items-center gap-3">
        {/* Mobile Search Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onSearchTrigger}
          className="md:hidden rounded-xl text-zinc-400 hover:text-foreground"
          aria-label="Search"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </Button>

        {/* Theme Cycling */}
        <ThemeSwitcher />

        {/* Alerts / Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl relative text-zinc-400 hover:text-foreground"
          aria-label="View notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-zinc-950 animate-pulse" />
        </Button>

        {/* Clerk Profile Menu */}
        <div className="flex h-9 w-9 items-center justify-center border border-border/40 rounded-xl overflow-hidden shadow-inner">
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "h-9 w-9 rounded-xl",
                userButtonTrigger: "focus:shadow-none focus:outline-none",
              },
            }}
          />
        </div>
      </div>
    </nav>
  );
}
