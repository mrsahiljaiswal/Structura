import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { UploadDropZone } from "@/components/upload/upload-drop-zone";
import { BookOpen, Sparkles } from "lucide-react";

export default function UploadPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-8">
        {/* Header */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <p className="text-sm font-medium text-indigo-400">Upload & Generate</p>
          </div>
          <h1 className="text-4xl font-bold text-zinc-50">
            Transform Your Documents
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl">
            Upload a PDF, research paper, textbook, or any document. Our AI will automatically generate a structured course with lessons, quizzes, and an interactive tutor.
          </p>
        </section>

        {/* Upload Zone */}
        <section>
          <UploadDropZone />
        </section>

        {/* Info Cards */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-2xl font-bold text-indigo-400">1</p>
            <p className="font-semibold text-zinc-50 mt-2">Upload</p>
            <p className="text-sm text-zinc-400 mt-1">
              Drag and drop your PDF or click to select
            </p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-2xl font-bold text-violet-400">2</p>
            <p className="font-semibold text-zinc-50 mt-2">Generate</p>
            <p className="text-sm text-zinc-400 mt-1">
              AI extracts knowledge and creates content
            </p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-2xl font-bold text-indigo-400">3</p>
            <p className="font-semibold text-zinc-50 mt-2">Learn</p>
            <p className="text-sm text-zinc-400 mt-1">
              Access lessons, quizzes, and AI tutor
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-50">Supported Formats</h2>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-zinc-50">PDF Documents</p>
                <p className="text-sm text-zinc-400 mt-1">
                  Research papers, textbooks, technical documentation, and more
                </p>
              </div>
            </div>

            <div className="border-t border-zinc-700 pt-4">
              <p className="text-sm text-zinc-400">
                <strong className="text-zinc-50">File limit:</strong> 50 MB per document
              </p>
              <p className="text-sm text-zinc-400 mt-2">
                <strong className="text-zinc-50">Processing time:</strong> Typically 2-5 minutes depending on document size
              </p>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
