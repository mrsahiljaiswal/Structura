/**
 * Purpose: Premium Stepped Practice Quiz Component for Lesson Reader
 * Features single-question-at-a-time flow, progress indicators,
 * micro-animations, and an interactive quiz summary scorecard.
 */

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, HelpCircle, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { coursePersistence } from "@/lib/services/course-service";

interface Question {
  id: number;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

interface PracticeQuizProps {
  lessonTitle: string;
  lessonId?: string;
  questions?: Question[];
}

export function PracticeQuiz({
  lessonTitle,
  lessonId,
  questions = [],
}: PracticeQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = questions[currentIndex];

  if (!questions || questions.length === 0 || !currentQuestion) {
    return null;
  }

  const totalQuestions = questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  const handleSelectOption = (optionIdx: number) => {
    if (submitted[currentQuestion.id]) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIdx,
    }));
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswers[currentQuestion.id] === undefined) return;
    setSubmitted((prev) => ({
      ...prev,
      [currentQuestion.id]: true,
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setShowResults(true);
      if (lessonId) {
        coursePersistence.saveQuizScore(lessonId, scorePercent);
      }
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSubmitted({});
    setCurrentIndex(0);
    setShowResults(false);
  };

  // Score calculations
  const answeredCount = Object.keys(submitted).length;
  const correctCount = questions.reduce((acc, q) => {
    return acc + (selectedAnswers[q.id] === q.answerIndex ? 1 : 0);
  }, 0);
  const scorePercent = Math.round((correctCount / totalQuestions) * 100);

  // Render Quiz Summary Scorecard
  if (showResults) {
    return (
      <Card className="border border-indigo-500/20 bg-zinc-950/40 backdrop-blur-md my-8 shadow-2xl relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
        <CardContent className="p-8 text-center space-y-6">
          <div className="mx-auto h-20 w-20 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-xl font-black text-foreground">Practice Quiz Complete!</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Review your overall comprehension score for: <span className="text-foreground font-semibold">{lessonTitle}</span>
            </CardDescription>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto border-y border-border/20 py-4 my-2">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Score</p>
              <p className="text-2xl font-black text-foreground mt-0.5">{scorePercent}%</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Correct</p>
              <p className="text-2xl font-black text-emerald-400 mt-0.5">
                {correctCount} / {totalQuestions}
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setShowResults(false);
                setCurrentIndex(0);
              }}
              className="rounded-xl border border-border bg-zinc-900/40 px-4 py-2 text-xs font-bold text-foreground hover:bg-zinc-900 transition-all cursor-pointer flex items-center gap-1.5"
            >
              Review Answers
            </button>
            <button
              onClick={handleReset}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-indigo-600/10"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retake Quiz</span>
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedIdx = selectedAnswers[currentQuestion.id];
  const isSubmitted = !!submitted[currentQuestion.id];
  const isCorrect = selectedIdx === currentQuestion.answerIndex;
  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <Card className="border border-indigo-500/20 bg-zinc-950/20 backdrop-blur-md my-8 shadow-xl transition-all duration-300">
      {/* Dynamic top progress bar */}
      <div className="w-full h-1 bg-zinc-900">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <CardHeader className="flex flex-row items-center justify-between border-b border-border/10 pb-4 mb-4">
        <div className="flex items-center gap-2.5 text-left">
          <div className="rounded-lg p-2 bg-indigo-500/5 border border-indigo-500/10 text-indigo-400">
            <HelpCircle className="h-4.5 w-4.5" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-foreground">
              Lesson Practice Checkup
            </CardTitle>
            <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
              Verify your comprehension of the concepts covered in this lesson.
            </CardDescription>
          </div>
        </div>
        <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 font-semibold bg-indigo-500/[0.03]">
          {currentIndex + 1} of {totalQuestions} Questions
        </Badge>
      </CardHeader>

      <CardContent className="space-y-6 pt-2">
        <div className="space-y-4 text-left">
          {/* Question Text */}
          <h4 className="text-sm font-semibold text-foreground leading-relaxed">
            {currentIndex + 1}. {currentQuestion.question}
          </h4>

          {/* Options Grid */}
          <div className="grid grid-cols-1 gap-2.5">
            {currentQuestion.options.map((opt, optIdx) => {
              const isSelected = selectedIdx === optIdx;
              const isAnswer = optIdx === currentQuestion.answerIndex;

              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  disabled={isSubmitted}
                  className={cn(
                    "w-full text-left rounded-xl px-4 py-3 text-xs font-medium border transition-all duration-200 select-none cursor-pointer outline-none relative group",
                    isSelected && !isSubmitted && "border-indigo-500 bg-indigo-500/5 text-indigo-300 shadow-lg shadow-indigo-500/5",
                    isSelected && isSubmitted && isCorrect && "border-emerald-500 bg-emerald-500/5 text-emerald-300",
                    isSelected && isSubmitted && !isCorrect && "border-rose-500 bg-rose-500/5 text-rose-300",
                    isSubmitted && isAnswer && !isCorrect && "border-emerald-500 bg-emerald-500/5 text-emerald-300",
                    !isSelected && (!isSubmitted || !isAnswer) && "border-border/30 bg-zinc-900/10 text-zinc-350 hover:bg-zinc-900/30 hover:border-border/60 hover:scale-[1.005]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>{opt}</span>
                    {isSubmitted && isAnswer && (
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0 ml-2" />
                    )}
                    {isSubmitted && isSelected && !isCorrect && (
                      <XCircle className="h-4.5 w-4.5 text-rose-400 shrink-0 ml-2" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation card */}
          {isSubmitted && (
            <div className={cn(
              "p-4 rounded-xl text-[11px] leading-relaxed border transition-all duration-300",
              isCorrect
                ? "border-emerald-500/20 bg-emerald-500/[0.02] text-emerald-400/90"
                : "border-rose-500/20 bg-rose-500/[0.02] text-rose-400/90"
            )}>
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">{isCorrect ? "Correct. " : "Incorrect. "}</span>
                  {currentQuestion.explanation}
                </div>
              </div>
            </div>
          )}

          {/* Footer Navigation controls */}
          <div className="flex items-center justify-between border-t border-border/10 pt-4 mt-6">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="rounded-xl border border-border/30 bg-zinc-900/10 px-3 py-2 text-xs font-bold text-zinc-400 hover:bg-zinc-900 hover:text-foreground disabled:opacity-40 disabled:hover:bg-zinc-900/10 disabled:hover:text-zinc-400 transition-all cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            {!isSubmitted ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={selectedIdx === undefined}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all cursor-pointer shadow-lg shadow-indigo-600/10"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="rounded-xl bg-zinc-900 border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-zinc-800 transition-all cursor-pointer flex items-center gap-1"
              >
                <span>{isLastQuestion ? "Finish Quiz" : "Next Question"}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
export default PracticeQuiz;
