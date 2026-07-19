/**
 * Purpose: Animated Course Generation Pipeline Timeline for Structura
 * Visualizes the stages of PDF ingestion, chunking, and AI lesson creation.
 */

import React, { useEffect, useState } from "react";
import { CheckCircle, Loader2, Circle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PipelineStep {
  id: number;
  label: string;
  duration: number; // Simulated time in seconds
  description: string;
}

const pipelineSteps: PipelineStep[] = [
  { id: 1, label: "PDF Document Uploaded", duration: 1, description: "Saving PDF to server" },
  { id: 2, label: "Extracting Text", duration: 3, description: "Parsing pages using PyMuPDF" },
  { id: 3, label: "Cleaning & Normalizing", duration: 3, description: "Cleaning regex, smart quotes, formatting" },
  { id: 4, label: "Semantic Chunking", duration: 4, description: "Splitting text into overlapping paragraphs" },
  { id: 5, label: "Course Outline Planning", duration: 8, description: "Designing chapters outline with Groq AI" },
  { id: 6, label: "Generating Lessons Content", duration: 16, description: "Writing detailed markdown lesson summaries" },
  { id: 7, label: "Reviewing Content Quality", duration: 4, description: "Validating structural consistency" },
  { id: 8, label: "Building Database Assembly", duration: 3, description: "Saving PostgreSQL course tables" },
  { id: 9, label: "Completed", duration: 1, description: "Course ready for learning" },
];

interface PipelineTimelineProps {
  uploadComplete: boolean;
  processingComplete: boolean;
  hasError: boolean;
}

export function PipelineTimeline({
  uploadComplete,
  processingComplete,
  hasError,
}: PipelineTimelineProps) {
  const [currentStepId, setCurrentStepId] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(42);

  // Compute total simulated duration
  const totalSimulatedTime = pipelineSteps.reduce((acc, s) => acc + s.duration, 0);

  useEffect(() => {
    if (!uploadComplete || processingComplete || hasError) return;

    // Start timer once upload reaches 100%
    const interval = setInterval(() => {
      setElapsed((prev) => {
        const nextElapsed = prev + 1;
        
        // Find current step based on cumulative simulated duration
        let accumulated = 0;
        let activeStep = 2; // Start from Step 2: Extracting Text
        
        for (const step of pipelineSteps.slice(1, -1)) {
          accumulated += step.duration;
          if (nextElapsed <= accumulated) {
            activeStep = step.id;
            break;
          }
          activeStep = step.id + 1; // Fallback to next
        }

        setCurrentStepId(activeStep);
        setTimeLeft(Math.max(1, totalSimulatedTime - nextElapsed));
        return nextElapsed;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [uploadComplete, processingComplete, hasError, totalSimulatedTime]);

  // If backend returns successfully, fast-forward to completion
  useEffect(() => {
    if (processingComplete) {
      setCurrentStepId(9);
      setTimeLeft(0);
    }
  }, [processingComplete]);

  return (
    <div className="w-full space-y-6">
      {/* Header Stat Area */}
      <div className="flex items-center justify-between p-5 bg-card border border-border rounded-2xl shadow-xs">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            AI Pipeline Processing
          </p>
          <p className="text-lg font-bold text-foreground mt-1">
            {hasError
              ? "Generation Halted"
              : processingComplete
              ? "Assembly Completed"
              : `Analyzing Document...`}
          </p>
        </div>
        {!processingComplete && !hasError && (
          <div className="text-right">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Est. Time Remaining
            </p>
            <p className="text-lg font-black text-primary mt-1 animate-pulse">
              ~{timeLeft}s
            </p>
          </div>
        )}
      </div>

      {/* Timeline Progression Line */}
      <div className="relative border-l border-border pl-6 ml-3.5 space-y-6">
        {pipelineSteps.map((step) => {
          const isFinished =
            processingComplete ||
            (currentStepId > step.id && !hasError) ||
            (step.id === 1 && uploadComplete && currentStepId > 1);
          const isErrorStep = hasError && currentStepId === step.id;
          const isActive = !processingComplete && !hasError && currentStepId === step.id;
          const isPending = !isFinished && !isActive && !isErrorStep;

          return (
            <div key={step.id} className="relative transition-all duration-300">
              {/* Timeline Indicator Icons */}
              <span
                className={cn(
                  "absolute left-[-38px] top-0 flex h-6 w-6 items-center justify-center rounded-lg bg-card border shadow-2xs transition-colors",
                  isFinished && "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
                  isActive && "border-primary text-primary animate-pulse bg-primary/10",
                  isErrorStep && "border-red-500/40 text-red-500 bg-red-500/10",
                  isPending && "border-border text-muted-foreground bg-secondary/80"
                )}
              >
                {isFinished && <CheckCircle className="h-4 w-4" />}
                {isActive && <Loader2 className="h-4 w-4 animate-spin" />}
                {isErrorStep && <AlertCircle className="h-4 w-4 text-red-500" />}
                {isPending && <Circle className="h-2 w-2 fill-current" />}
              </span>

              <div className={cn("transition-opacity", isPending && "opacity-50")}>
                <p className={cn("text-sm font-semibold leading-none", isErrorStep ? "text-red-400" : "text-foreground")}>
                  {step.label}
                </p>
                {isActive && (
                  <p className="text-xs text-indigo-400/80 font-medium mt-1 animate-pulse">
                    {step.description}...
                  </p>
                )}
                {isErrorStep && (
                  <p className="text-xs text-red-400/90 font-medium mt-1">
                    Halted at this step. Please re-try or check API keys.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Error state alert panel */}
      {hasError && (
        <div className="flex items-center gap-3 p-4 border border-red-500/20 bg-red-500/5 text-red-400 rounded-xl">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            AI generation failed. Check backend console logs or GROQ API configurations.
          </p>
        </div>
      )}
    </div>
  );
}
