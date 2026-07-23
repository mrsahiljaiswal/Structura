/**
 * Purpose: Redesigned Drag and Drop PDF Upload Component for Structura
 * Visualizes upload percentage and routes status updates through PipelineTimeline.
 */

"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Upload, FileText, AlertCircle, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PipelineTimeline } from "./pipeline-timeline";
import { coursePersistence } from "@/lib/services/course-service";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".doc", ".pptx", ".ppt", ".txt", ".md"];

interface UploadProcessingResult {
  filename: string;
  page_count: number;
  character_count: number;
  status: string;
  course_id?: string | null;
}

interface UploadState {
  status: "idle" | "uploading" | "processing" | "success" | "error";
  files: File[];
  progress: number;
  error: string | null;
  processingResult: UploadProcessingResult | null;
}

export function UploadDropZone() {
  const router = useRouter();
  const { user } = useUser();
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
    files: [],
    progress: 0,
    error: null,
    processingResult: null,
  });

  // Clear any leftover stale upload state from previous sessions
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("structura_active_upload_state");
    }
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `File '${file.name}' is not supported. Please upload PDF, Word (.docx, .doc), PowerPoint (.pptx, .ppt), or Text (.txt, .md) files.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File '${file.name}' exceeds 50 MB limit.`;
    }
    return null;
  }, []);

  const handleAddFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const errors: string[] = [];
    const valid: File[] = [];

    fileArray.forEach((f) => {
      const err = validateFile(f);
      if (err) errors.push(err);
      else valid.push(f);
    });

    if (errors.length > 0) {
      setUploadState((prev) => ({
        ...prev,
        error: errors[0] ?? "Invalid file selected.",
      }));
    }

    if (valid.length > 0) {
      setUploadState((prev) => {
        const existingNames = new Set(prev.files.map((f) => f.name));
        const uniqueNew = valid.filter((f) => !existingNames.has(f.name));
        return {
          ...prev,
          files: [...prev.files, ...uniqueNew],
          error: null,
          status: "idle",
        };
      });
    }
  }, [validateFile]);

  const handleRemoveFile = useCallback((indexToRemove: number) => {
    setUploadState((prev) => ({
      ...prev,
      files: prev.files.filter((_, idx) => idx !== indexToRemove),
    }));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleAddFiles(e.dataTransfer.files);
      }
    },
    [handleAddFiles]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.currentTarget.files && e.currentTarget.files.length > 0) {
        handleAddFiles(e.currentTarget.files);
      }
    },
    [handleAddFiles]
  );

  const handleUpload = useCallback(async () => {
    if (uploadState.files.length === 0) return;

    setUploadState((prev) => ({ ...prev, status: "uploading" }));
    const batchLabel = uploadState.files.length === 1
      ? uploadState.files[0]?.name ?? "Document"
      : `${uploadState.files.length} Documents Batch`;

    coursePersistence.addActivity("upload", "Processing Multi-Document Synthesis", batchLabel);

    try {
      const formData = new FormData();
      uploadState.files.forEach((file) => {
        formData.append("files", file);
      });

      const xhr = new XMLHttpRequest();
      xhr.responseType = "json";

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

          if (response.course_id) {
            try {
              router.push(`/dashboard/course/${response.course_id}`);
            } catch (e) {
              // ignore navigation redirect error
            }
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

      xhr.open("POST", `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/documents/upload`);
      const activeUserId = user?.id || (typeof window !== "undefined" ? localStorage.getItem("structura_active_user_id") : null);
      if (activeUserId) {
        xhr.setRequestHeader("X-User-Id", activeUserId);
      }
      xhr.send(formData);
    } catch (error) {
      setUploadState({
        status: "error",
        files: uploadState.files,
        progress: 0,
        error: error instanceof Error ? error.message : "Upload failed",
        processingResult: null,
      });
    }
  }, [uploadState.files, router, user]);

  const handleReset = useCallback(() => {
    setUploadState({
      status: "idle",
      files: [],
      progress: 0,
      error: null,
      processingResult: null,
    });
  }, []);

  const totalBytes = uploadState.files.reduce((acc, f) => acc + f.size, 0);
  const totalMb = (totalBytes / 1024 / 1024).toFixed(2);
  const estimatedConcepts = uploadState.files.length === 0 ? 0 : Math.max(10, uploadState.files.length * 8);
  const estimatedSeconds = uploadState.files.length === 0 ? 0 : Math.max(30, uploadState.files.length * 20);

  return (
    <Card className="border border-border/40">
      <CardContent className="pt-6">
        {/* State: Idle / Drag zone */}
        {uploadState.status === "idle" && (
          <div className="space-y-6">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              className={`relative rounded-2xl border-2 border-dashed transition-all duration-350 p-10 text-center cursor-pointer group flex flex-col items-center justify-center min-h-[200px] ${
                isDragOver
                  ? "border-primary bg-accent scale-[1.01] shadow-xl"
                  : "border-border bg-secondary/30 hover:border-border hover:bg-secondary"
              }`}
            >
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md"
                onChange={handleFileInputChange}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0 z-10"
              />

              <div className="rounded-2xl bg-accent p-4 border border-indigo-500/20 mb-4 group-hover:scale-110 transition-transform">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                Drop your documents here (select one or multiple files)
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Drag & drop multiple files or click to browse local documents
              </p>
              <p className="text-[10px] text-muted-foreground mt-3">
                PDF, Word (.docx), PowerPoint (.pptx), Text files • Up to 50 MB per file
              </p>
            </div>

            {/* Queued Files List */}
            {uploadState.files.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Selected Documents ({uploadState.files.length})
                  </h4>
                  <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs h-7 text-muted-foreground hover:text-foreground">
                    Clear all
                  </Button>
                </div>

                <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
                  {uploadState.files.map((file, idx) => {
                    const ext = file.name.split(".").pop()?.toUpperCase() || "DOC";
                    return (
                      <div
                        key={`${file.name}-${idx}`}
                        className="flex items-center justify-between gap-3 p-3 bg-secondary/60 border border-border/50 rounded-xl hover:border-border transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="px-2 py-0.5 text-[10px] font-black tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md shrink-0">
                            {ext}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">
                              {file.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFile(idx)}
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>

                {/* Synthesis Summary Metrics */}
                <div className="grid grid-cols-3 gap-3 p-3.5 bg-accent/40 border border-border/40 rounded-xl text-center">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Size</p>
                    <p className="text-sm font-black text-foreground mt-0.5">{totalMb} MB</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Estimated Concepts</p>
                    <p className="text-sm font-black text-indigo-400 mt-0.5">~{estimatedConcepts}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Est. Processing</p>
                    <p className="text-sm font-black text-emerald-400 mt-0.5">~{estimatedSeconds}s</p>
                  </div>
                </div>

                <Button onClick={handleUpload} className="w-full h-11 text-sm font-bold shadow-md">
                  Synthesize & Generate Master Course ({uploadState.files.length} {uploadState.files.length === 1 ? 'file' : 'files'})
                </Button>
              </div>
            )}
          </div>
        )}

        {/* State: Uploading progress bar */}
        {uploadState.status === "uploading" && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-zinc-900/20 border border-border/20 rounded-2xl">
              <FileText className="h-6 w-6 text-indigo-400 animate-bounce" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground truncate text-sm">
                  Uploading {uploadState.files.length} {uploadState.files.length === 1 ? 'document' : 'documents'}...
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Transferring payload to Structura synthesis engine</p>
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
                <p className="font-bold text-sm text-foreground">Multi-document synthesis completed!</p>
                <p className="text-xs text-muted-foreground mt-0.5">Redirecting to course viewer...</p>
              </div>
            </div>

            {uploadState.processingResult && (
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-secondary/50 p-4 border border-border/60 text-center shadow-2xs">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      Sources synthesized
                    </p>
                    <p className="mt-2 text-3xl font-black text-primary">
                      {uploadState.processingResult.page_count}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-secondary/50 p-4 border border-border/60 text-center shadow-2xs">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      Pipeline status
                    </p>
                    <p className="mt-2 text-xl font-black text-emerald-400 uppercase tracking-wider truncate">
                      {uploadState.processingResult.status}
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
                <p className="font-bold text-sm text-foreground">Synthesis failed</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {uploadState.error}
                </p>
              </div>
            </div>

            <Button onClick={handleReset} variant="outline" className="w-full">
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
