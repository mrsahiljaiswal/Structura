/**
 * Purpose: Redesigned Drag and Drop PDF Upload Component for Structura
 * Visualizes upload percentage and routes status updates through PipelineTimeline.
 */

"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Upload, FileText, AlertCircle, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PipelineTimeline } from "./pipeline-timeline";
import { coursePersistence } from "@/lib/services/course-service";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_TYPES = ["application/pdf"];

interface UploadProcessingResult {
  filename: string;
  page_count: number;
  character_count: number;
  status: string;
  course_id?: string | null;
}

interface UploadState {
  status: "idle" | "uploading" | "processing" | "success" | "error";
  file: File | null;
  progress: number;
  error: string | null;
  processingResult: UploadProcessingResult | null;
}

export function UploadDropZone() {
  const router = useRouter();
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
    file: null,
    progress: 0,
    error: null,
    processingResult: null,
  });

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Only PDF files are allowed";
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than 50 MB (your file: ${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    }
    return null;
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadState({ status: "error", file, progress: 0, error, processingResult: null });
      return;
    }

    setUploadState({
      status: "idle",
      file,
      progress: 0,
      error: null,
      processingResult: null,
    });
  }, [validateFile]);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file) handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.currentTarget.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file) handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleUpload = useCallback(async () => {
    if (!uploadState.file) return;

    setUploadState((prev) => ({ ...prev, status: "uploading" }));

    try {
      const formData = new FormData();
      formData.append("file", uploadState.file);

      const xhr = new XMLHttpRequest();
      xhr.responseType = "json";

      // Track XMLHTTPRequest upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadState((prev) => ({
            ...prev,
            progress,
            status: progress === 100 ? "processing" : "uploading",
          }));
        }
      });

      xhr.addEventListener("load", () => {
        const response = xhr.response as UploadProcessingResult | null;

        if (xhr.status >= 200 && xhr.status < 300 && response?.filename) {
          setUploadState((prev) => ({
            ...prev,
            status: "success",
            progress: 100,
            processingResult: response,
          }));

          // Add generated course ID to client registry
          if (response?.course_id) {
            coursePersistence.addCourseId(response.course_id);
            // Delayed redirect to course details to let success toast finish
            setTimeout(() => {
              try {
                router.push(`/dashboard/course/${response.course_id}`);
              } catch (e) {
                // ignore navigation redirects errors
              }
            }, 1000);
          }
        } else {
          let errorMessage = "Upload failed. Please try again.";
          if (response && typeof response === "object") {
            if ("detail" in response && typeof response.detail === "string") {
              errorMessage = response.detail;
            } else if ("error" in response && typeof response.error === "string") {
              errorMessage = response.error;
            }
          }
          setUploadState((prev) => ({
            ...prev,
            status: "error",
            error: errorMessage,
          }));
        }
      });

      xhr.addEventListener("error", () => {
        setUploadState((prev) => ({
          ...prev,
          status: "error",
          error: "Network error. Please check your connection and try again.",
        }));
      });

      xhr.open("POST", `${process.env.NEXT_PUBLIC_API_URL}/api/v1/documents/upload`);
      xhr.send(formData);
    } catch (error) {
      setUploadState({
        status: "error",
        file: uploadState.file,
        progress: 0,
        error: error instanceof Error ? error.message : "Upload failed",
        processingResult: null,
      });
    }
  }, [uploadState.file, router]);

  const handleReset = useCallback(() => {
    setUploadState({
      status: "idle",
      file: null,
      progress: 0,
      error: null,
      processingResult: null,
    });
  }, []);

  return (
    <Card className="border border-border/40">
      <CardContent className="pt-6">
        {/* State: Idle / Drag zone */}
        {uploadState.status === "idle" && !uploadState.file && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            className={`relative rounded-2xl border-2 border-dashed transition-all duration-350 p-12 text-center cursor-pointer group flex flex-col items-center justify-center min-h-[220px] ${
              isDragOver
                ? "border-primary bg-primary/5 scale-[1.01] shadow-2xl"
                : "border-border/60 bg-zinc-900/10 hover:border-border hover:bg-zinc-900/30"
            }`}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileInputChange}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 z-10"
            />

            <div className="rounded-2xl bg-indigo-500/5 p-4 border border-indigo-500/15 mb-4 group-hover:scale-110 transition-transform">
              <Upload className="h-6 w-6 text-indigo-400" />
            </div>
            <h3 className="text-base font-bold text-foreground">Drop your PDF document here</h3>
            <p className="text-xs text-muted-foreground mt-1">or click to browse local files</p>
            <p className="text-[10px] text-zinc-500 mt-4">
              PDF files only • Maximum size 50 MB
            </p>
          </div>
        )}

        {/* State: File selected, awaiting user confirm */}
        {uploadState.file && uploadState.status !== "uploading" && uploadState.status !== "processing" && !uploadState.error && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-zinc-900/20 border border-border/20 rounded-2xl">
              <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-400">
                <FileText className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground truncate text-sm">
                  {uploadState.file.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(uploadState.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleUpload} className="flex-1">
                Upload & Generate Course
              </Button>
              <Button variant="ghost" onClick={handleReset} className="rounded-xl border border-border/40">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* State: Uploading progress bar */}
        {uploadState.status === "uploading" && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-zinc-900/20 border border-border/20 rounded-2xl">
              <FileText className="h-6 w-6 text-indigo-400 animate-bounce" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground truncate text-sm">
                  {uploadState.file?.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Uploading PDF content...</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="h-2 rounded-full bg-secondary/80 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
                  style={{ width: `${uploadState.progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right font-semibold">
                {uploadState.progress}% uploaded
              </p>
            </div>
          </div>
        )}

        {/* State: Processing pipeline visualization */}
        {uploadState.status === "processing" && (
          <PipelineTimeline
            uploadComplete={true}
            processingComplete={false}
            hasError={false}
          />
        )}

        {/* State: Upload and generation success */}
        {uploadState.status === "success" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 rounded-xl">
              <CheckCircle2 className="h-6 w-6 shrink-0" />
              <div>
                <p className="font-bold text-sm text-foreground">Course assembly completed!</p>
                <p className="text-xs text-muted-foreground mt-0.5">Redirecting to course viewer...</p>
              </div>
            </div>

            {uploadState.processingResult && (
              <div className="rounded-2xl border border-border/30 bg-zinc-900/10 p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-zinc-950 p-4 border border-border/20 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                      Pages parsed
                    </p>
                    <p className="mt-2 text-3xl font-black text-indigo-400">
                      {uploadState.processingResult.page_count}
                    </p>
                  </div>
                  <div className="rounded-xl bg-zinc-950 p-4 border border-border/20 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                      Characters extracted
                    </p>
                    <p className="mt-2 text-2xl font-black text-violet-400 truncate">
                      {uploadState.processingResult.character_count.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* State: Upload or generation error */}
        {uploadState.status === "error" && uploadState.error && (
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 border border-red-500/20 bg-red-500/5 text-red-400 rounded-2xl">
              <AlertCircle className="h-6 w-6 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-sm text-foreground">Process failed</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {uploadState.error}
                </p>
              </div>
              <button onClick={handleReset} className="text-zinc-500 hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <Button variant="default" onClick={handleReset} className="w-full">
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
