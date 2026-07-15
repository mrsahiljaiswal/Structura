"use client";

import { SearchIcon, Bell } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

export function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600">
            <span className="text-sm font-bold text-white">S</span>
          </div>
          <span className="text-lg font-semibold text-white">Structura</span>
        </div>

        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search courses, lessons..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 pl-10 text-sm text-zinc-200 placeholder-zinc-500 transition-colors focus:border-indigo-600/50 focus:outline-none focus:ring-1 focus:ring-indigo-600/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-zinc-200">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <div className="flex h-8 w-8 items-center justify-center">
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: "h-8 w-8 rounded-lg",
                  userButtonTrigger: "focus:shadow-none",
                },
              }}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
