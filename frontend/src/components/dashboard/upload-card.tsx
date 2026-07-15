"use client";

import { Upload, Zap } from "lucide-react";

export function UploadDocumentCard() {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-700 bg-gradient-to-br from-indigo-600/5 to-violet-600/5 p-12 text-center transition-colors hover:border-indigo-500/50">
      <div className="flex justify-center mb-4">
        <div className="rounded-lg bg-indigo-600/10 p-3">
          <Upload className="h-6 w-6 text-indigo-400" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-zinc-50 mb-2">Upload Your First Document</h3>
      <p className="text-zinc-400 mb-4 text-sm">
        Transform any PDF, research paper, or textbook into an interactive course
      </p>
      <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500">
        <Zap className="h-4 w-4" />
        Upload PDF
      </button>
    </div>
  );
}
