/**
 * Purpose: Interactive Practice Quiz Component for Lesson Reader
 * Renders multiple choice question checkups with instant feedback.
 */

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  id: number;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

interface PracticeQuizProps {
  lessonTitle: string;
  questions?: Question[];
}

export function PracticeQuiz({
  lessonTitle,
  questions = [
    {
      id: 1,
      question: "Which data structure is typically preferred for database indexing due to its self-balancing and efficient disk page alignment?",
      options: ["Binary Search Trees", "B-Trees", "Hash Tables", "Singly Linked Lists"],
      answerIndex: 1,
      explanation: "B-Trees are optimized for block storage architectures. They minimize disk I/O seek times by keeping tree heights low and page nodes large.",
    },
    {
      id: 2,
      question: "How does semantic chunking maintain context during LLM educational processing?",
      options: [
        "It splits words by absolute character limits.",
        "It keeps sentence boundaries and shares overlapping margin texts.",
        "It translates all characters to straight ASCII bytes.",
        "It bypasses paragraphs entirely.",
      ],
      answerIndex: 1,
      explanation: "Semantic chunking (typically using recursive text splitters) uses overlapping character margins to ensure concept boundaries are preserved across splits.",
    },
  ],
}: PracticeQuizProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    if (submitted[questionId]) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const handleSubmit = (questionId: number) => {
    if (selectedAnswers[questionId] === undefined) return;
    setSubmitted((prev) => ({
      ...prev,
      [questionId]: true,
    }));
  };

  return (
    <Card className="border border-indigo-500/20 bg-indigo-500/[0.01] my-8">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/20 pb-4 mb-4">
        <div className="flex items-center gap-2 text-left">
          <HelpCircle className="h-5 w-5 text-indigo-400" />
          <div>
            <CardTitle className="text-sm font-bold text-foreground">
              Lesson Practice Checkup
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Verify your comprehension of the concepts covered in this lesson.
            </CardDescription>
          </div>
        </div>
        <Badge variant="info">2 Questions</Badge>
      </CardHeader>

      <CardContent className="space-y-6 pt-0">
        {questions.map((q, idx) => {
          const selectedIdx = selectedAnswers[q.id];
          const isSubmitted = !!submitted[q.id];
          const isCorrect = selectedIdx === q.answerIndex;

          return (
            <div key={q.id} className="space-y-3 text-left">
              <p className="text-xs font-semibold text-foreground leading-relaxed">
                {idx + 1}. {q.question}
              </p>

              {/* Multiple Choice Options List */}
              <div className="space-y-2">
                {q.options.map((opt, optIdx) => {
                  const isSelected = selectedIdx === optIdx;
                  const isAnswer = optIdx === q.answerIndex;

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(q.id, optIdx)}
                      disabled={isSubmitted}
                      className={cn(
                        "w-full text-left rounded-xl px-4 py-2.5 text-xs font-medium border transition-all select-none cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35",
                        isSelected && !isSubmitted && "border-indigo-500 bg-indigo-500/5 text-indigo-300",
                        isSelected && isSubmitted && isCorrect && "border-emerald-500 bg-emerald-500/5 text-emerald-300",
                        isSelected && isSubmitted && !isCorrect && "border-red-500 bg-red-500/5 text-red-300",
                        isSubmitted && isAnswer && !isCorrect && "border-emerald-500 bg-emerald-500/5 text-emerald-300",
                        !isSelected && (!isSubmitted || !isAnswer) && "border-border/30 bg-zinc-900/10 text-zinc-350 hover:bg-zinc-900/30 hover:border-border/60"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span>{opt}</span>
                        {isSubmitted && isAnswer && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 ml-2" />
                        )}
                        {isSubmitted && isSelected && !isCorrect && (
                          <XCircle className="h-4 w-4 text-red-400 shrink-0 ml-2" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Submit Trigger Actions */}
              {!isSubmitted && selectedIdx !== undefined && (
                <button
                  onClick={() => handleSubmit(q.id)}
                  className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-[10px] font-bold text-white hover:bg-indigo-500 transition-colors"
                >
                  Submit Answer
                </button>
              )}

              {/* Explanation block */}
              {isSubmitted && (
                <div className={cn(
                  "p-3 rounded-lg text-[11px] leading-relaxed border",
                  isCorrect
                    ? "border-emerald-500/20 bg-emerald-500/[0.02] text-emerald-400/90"
                    : "border-red-500/20 bg-red-500/[0.02] text-red-400/90"
                )}>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">{isCorrect ? "Correct. " : "Incorrect. "}</span>
                      {q.explanation}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
export default PracticeQuiz;
