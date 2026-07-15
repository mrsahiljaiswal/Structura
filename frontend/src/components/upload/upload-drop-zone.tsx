"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, AlertCircle, CheckCircle, X } from "lucide-react";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_TYPES = ["application/pdf"];

interface UploadState {
  status: "idle" | "uploading" | "success" | "error";
  file: File | null;
  progress: number;
  error: string | null;
}

export function UploadDropZone() {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
    file: null,
    progress: 0,
    error: null,
  });
  const [isDragOver, setIsDragOver] = useState(false);

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
      setUploadState({ status: "error", file, progress: 0, error });
      return;
    }

    setUploadState({
      status: "idle",
      file,
      progress: 0,
      error: null,
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
        if (file) {
          handleFileSelect(file);
        }
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.currentTarget.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file) {
          handleFileSelect(file);
        }
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

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadState((prev) => ({ ...prev, progress }));
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadState((prev) => ({
            ...prev,
            status: "success",
            progress: 100,
          }));
        } else {
          setUploadState((prev) => ({
            ...prev,
            status: "error",
            error: "Upload failed. Please try again.",
          }));
        }
      });

      xhr.addEventListener("error", () => {
        setUploadState((prev) => ({
          ...prev,
          status: "error",
          error: "Network error. Please try again.",
        }));
      });
      console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);
console.log("Final URL:", `${process.env.NEXT_PUBLIC_API_URL}/api/v1/documents/upload`);
      xhr.open("POST", `${process.env.NEXT_PUBLIC_API_URL}/api/v1/documents/upload`);
      xhr.send(formData);
    } catch (error) {
      setUploadState({
        status: "error",
        file: uploadState.file,
        progress: 0,
        error: error instanceof Error ? error.message : "Upload failed",
      });
    }
  }, [uploadState.file]);

  const handleReset = useCallback(() => {
    setUploadState({
      status: "idle",
      file: null,
      progress: 0,
      error: null,
    });
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Drag and Drop Zone */}
      {uploadState.status === "idle" && !uploadState.file && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative rounded-2xl border-2 border-dashed transition-colors ${
            isDragOver
              ? "border-indigo-500 bg-indigo-500/5"
              : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-600"
          } p-12 text-center cursor-pointer group`}
        >
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileInputChange}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />

          <div className="flex flex-col items-center gap-3">
            <div className="rounded-lg bg-indigo-600/10 p-3 group-hover:bg-indigo-600/20 transition-colors">
              <Upload className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-zinc-50">Drop your PDF here</p>
              <p className="text-sm text-zinc-400 mt-1">or click to browse</p>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              PDF files only • Max 50 MB
            </p>
          </div>
        </div>
      )}

      {/* File Selected State */}
      {uploadState.file && uploadState.status !== "uploading" && !uploadState.error && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-indigo-400" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-zinc-50 truncate">
                {uploadState.file.name}
              </p>
              <p className="text-sm text-zinc-400">
                {(uploadState.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-indigo-500"
            >
              Upload
            </button>
            <button
              onClick={handleReset}
              className="rounded-lg border border-zinc-700 px-4 py-2.5 font-semibold text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800/50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Uploading State */}
      {uploadState.status === "uploading" && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-indigo-400" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-zinc-50 truncate">
                {uploadState.file?.name}
              </p>
              <p className="text-sm text-zinc-400">Uploading...</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
            <p className="text-xs text-zinc-400 text-right">
              {uploadState.progress}%
            </p>
          </div>
        </div>
      )}

      {/* Success State */}
      {uploadState.status === "success" && (
        <div className="rounded-2xl border border-green-900/50 bg-green-900/10 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-400" />
            <div>
              <p className="font-semibold text-green-50">Upload successful!</p>
              <p className="text-sm text-green-200/70">
                Your document is being processed by AI
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-500"
          >
            Upload Another File
          </button>
        </div>
      )}

      {/* Error State */}
      {uploadState.status === "error" && uploadState.error && (
        <div className="rounded-2xl border border-red-900/50 bg-red-900/10 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-50">Upload failed</p>
              <p className="text-sm text-red-200/70 mt-1">{uploadState.error}</p>
            </div>
            <button
              onClick={handleReset}
              className="text-red-400 hover:text-red-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <button
            onClick={handleReset}
            className="w-full rounded-lg border border-red-600 px-4 py-2 font-semibold text-red-50 transition-colors hover:border-red-500 hover:bg-red-500/10"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
