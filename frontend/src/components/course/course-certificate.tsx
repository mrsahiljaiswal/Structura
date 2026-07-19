"use client";

import React, { useRef } from "react";
import { Award, Download, Printer, X, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CourseCertificateProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string | null;
  courseTitle: string;
  completionDate?: string;
}

export function CourseCertificate({
  isOpen,
  onClose,
  userName = "Valued Student",
  courseTitle,
  completionDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }),
}: CourseCertificateProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl rounded-3xl bg-zinc-950 border border-amber-500/30 p-8 shadow-2xl overflow-hidden flex flex-col space-y-6">
        {/* Header Actions Bar */}
        <div className="flex items-center justify-between border-b border-border/20 pb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <Award className="h-4 w-4" />
            <span>Official Completion Certificate</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-xl border-amber-500/30 text-amber-300 hover:bg-amber-500/10 text-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Save as PDF</span>
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Frame */}
        <div
          ref={printRef}
          className="relative rounded-2xl border-4 border-amber-500/40 bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-900 p-10 text-center space-y-6 shadow-inner print:border-black print:text-black print:bg-white"
        >
          {/* Gold Crest */}
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-4 ring-amber-500/20">
            <Award className="h-9 w-9 text-zinc-950" />
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-amber-400">
              Structura Learning Suite
            </p>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Certificate of Achievement
            </h2>
          </div>

          <p className="text-xs text-zinc-400 italic">This certifies that</p>

          <h3 className="text-2xl font-bold text-amber-300 underline decoration-amber-500/40 underline-offset-8">
            {userName}
          </h3>

          <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
            has successfully completed 100% of all required chapters, study modules, and interactive practice checkups for the course
          </p>

          <h4 className="text-xl font-extrabold text-white max-w-lg mx-auto leading-snug">
            {courseTitle}
          </h4>

          <div className="pt-6 border-t border-amber-500/20 flex items-center justify-between text-xs font-medium text-zinc-400">
            <div>
              <span className="block text-[10px] font-bold uppercase text-zinc-500">Date Issued</span>
              <span className="text-zinc-200">{completionDate}</span>
            </div>

            <div className="flex items-center gap-1 text-emerald-400 font-bold">
              <CheckCircle2 className="h-4 w-4" />
              <span>Verified Complete</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
