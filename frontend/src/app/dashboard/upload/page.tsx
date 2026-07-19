/**
 * Purpose: Redesigned Document Upload Page for Structura
 * Composes UploadDropZone inside centered UploadLayout.
 */

"use client";

import React from "react";
import { UploadLayout } from "@/components/layouts/upload-layout";
import { UploadDropZone } from "@/components/upload/upload-drop-zone";
import { BookOpen, Sparkles, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function UploadPage() {
  const breadcrumbs = [
    { label: "Upload", href: "/dashboard/upload" },
  ];

  return (
    <UploadLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-8">
        {/* Header Title Block */}
        <section className="space-y-3 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase">
            <Sparkles className="h-4 w-4" />
            <span>Generate Course Outline</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Ingest Learning Materials
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
            Upload a PDF, research article, or textbook. Our AI parses and chunks your documents, plans chapters outline, and writes structured summaries in real-time.
          </p>
        </section>

        {/* Upload Drop Zone Card */}
        <UploadDropZone />

        {/* Supporting Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 border border-border bg-card shadow-xs">
            <span className="text-lg font-black text-primary">01</span>
            <h3 className="font-bold text-foreground mt-2 text-sm">Upload File</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Select or drop a standard PDF document (up to 50 MB limits).
            </p>
          </Card>

          <Card className="p-5 border border-border bg-card shadow-xs">
            <span className="text-lg font-black text-primary">02</span>
            <h3 className="font-bold text-foreground mt-2 text-sm">AI Processing</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              We extract text, segment chunks, and design chapter lessons.
            </p>
          </Card>

          <Card className="p-5 border border-border bg-card shadow-xs">
            <span className="text-lg font-black text-primary">03</span>
            <h3 className="font-bold text-foreground mt-2 text-sm">Start Learning</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Jump straight into read notes, taking quizzes, and talking to tutors.
            </p>
          </Card>
        </div>

        {/* Details Note Alert */}
        <Card className="p-5 border border-border bg-card shadow-xs">
          <div className="flex items-start gap-3.5">
            <BookOpen className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Processing Benchmark Limits
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                Course creation latency is determined by your document&apos;s text volume. Typical generation ranges between 20 to 50 seconds.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </UploadLayout>
  );
}
