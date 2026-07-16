/**
 * Purpose: Centered Authentication Layout Template for Structura
 * Sets premium glowing blobs and glass frames around sign-in/up components.
 */

import React from "react";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen w-screen bg-background overflow-hidden flex items-center justify-center px-4 py-8">
      {/* Background glowing nodes */}
      <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-violet-500/10 blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: "1.5s" }} />

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Centered Children Card Container */}
      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        {children}
      </div>
    </main>
  );
}
