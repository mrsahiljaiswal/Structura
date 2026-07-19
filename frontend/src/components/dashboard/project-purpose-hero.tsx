/**
 * Purpose: Project Purpose Visual Flow Hero Component for Structura Dashboard
 * Visualizes: PDF Upload -> AI Parsing & RAG -> Structured E-Course & AI Tutor.
 * Serves as the primary center of attraction with a direct Upload CTA button.
 */

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FileText,
  Sparkles,
  BookOpen,
  ArrowRight,
  Upload,
  Cpu,
  CheckCircle2,
  Zap,
} from "lucide-react";

export function ProjectPurposeHero() {
  const router = useRouter();

  return (
    <Card className="relative overflow-hidden border border-border bg-card shadow-md rounded-3xl p-6 sm:p-8">
      {/* Background Decorative Glows */}
      <div className="absolute -left-10 -top-10 h-56 w-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -right-10 -bottom-10 h-56 w-56 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-8">
        {/* Top Header & Center Attraction CTA */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent border border-indigo-500/20 text-primary text-xs font-bold tracking-wide uppercase">
              <Zap className="h-3.5 w-3.5" />
              <span>AI-Powered Learning Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-tight">
              Turn Raw PDFs into Interactive E-Courses & AI Tutors
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Upload any PDF textbook or research notes. Structura AI automatically parses text, extracts key concepts, builds structured chapters, and connects an AI Study Assistant.
            </p>
          </div>

          {/* Main Action Button */}
          <div className="shrink-0">
            <Button
              onClick={() => router.push("/dashboard/upload")}
              size="lg"
              className="h-13 px-8 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-indigo-500/25 hover:opacity-95 active:scale-98 transition-all gap-3 cursor-pointer group"
            >
              <Upload className="h-5 w-5 group-hover:-translate-y-0.5 transition-transform" />
              <span>Upload PDF & Generate Course</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        {/* Visual Flow Animation Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Node 1: PDF Document Upload */}
          <div className="relative flex flex-col items-center text-center p-5 rounded-2xl bg-secondary/50 border border-border/60 hover:border-primary/50 transition-all duration-300 group shadow-2xs">
            <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-card border border-border shadow-xs text-primary group-hover:scale-110 transition-transform">
              <FileText className="h-7 w-7" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                1
              </span>
            </div>
            <h3 className="text-sm font-bold text-foreground">1. Upload PDF</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Drop textbooks, slides, or lecture PDFs
            </p>
          </div>

          {/* Node 2: AI Pipeline & RAG Processing */}
          <div className="relative flex flex-col items-center text-center p-5 rounded-2xl bg-secondary/50 border border-border/60 hover:border-primary/50 transition-all duration-300 group shadow-2xs">
            <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent border border-indigo-500/30 text-primary group-hover:scale-110 transition-transform">
              <Cpu className="h-7 w-7 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                2
              </span>
            </div>
            <h3 className="text-sm font-bold text-foreground">2. AI Extraction & RAG</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Semantic chunking & outline planning
            </p>
          </div>

          {/* Node 3: E-Course & AI Tutor */}
          <div className="relative flex flex-col items-center text-center p-5 rounded-2xl bg-secondary/50 border border-border/60 hover:border-primary/50 transition-all duration-300 group shadow-2xs">
            <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-card border border-border shadow-xs text-primary group-hover:scale-110 transition-transform">
              <BookOpen className="h-7 w-7" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white">
                3
              </span>
            </div>
            <h3 className="text-sm font-bold text-foreground">3. E-Course & AI Tutor</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Study chapters, flashcards, & cognitive chat
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
export default ProjectPurposeHero;
