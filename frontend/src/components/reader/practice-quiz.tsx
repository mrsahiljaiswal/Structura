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

export interface Question {
  id: number;
  question: string;
  type?: "multiple_choice" | "true_false" | "short_answer";
  options?: string[];
  answerIndex?: number;
  correctAnswer?: string;
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
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = questions[currentIndex];

  if (!questions || questions.length === 0 || !currentQuestion) {
    return null;
  }

  const qType = currentQuestion.type || "multiple_choice";
  const totalQuestions = questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  const handleSelectOption = (optionIdx: number) => {
    if (submitted[currentQuestion.id]) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIdx,
    }));
  };

  const handleTextChange = (val: string) => {
    if (submitted[currentQuestion.id]) return;
    setTextAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: val,
    }));
  };

  const handleSubmitAnswer = () => {
    setSubmitted((prev) => ({
      ...prev,
      [currentQuestion.id]: true,
    }));
  };

  const checkIsCorrect = (q: Question) => {
    const type = q.type || "multiple_choice";
    if (type === "short_answer") {
      const userText = (textAnswers[q.id] || "").trim().toLowerCase();
      const targetText = (q.correctAnswer || "").trim().toLowerCase();
      if (!userText || !targetText) return false;
      return userText.includes(targetText) || targetText.includes(userText);
    }
    return selectedAnswers[q.id] === (q.answerIndex ?? 0);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      const computedCorrect = questions.reduce((acc, q) => acc + (checkIsCorrect(q) ? 1 : 0), 0);
      const computedPercent = Math.round((computedCorrect / totalQuestions) * 100);
      const targetId = lessonId || `quiz-${Date.now()}`;
      coursePersistence.saveQuizScore(targetId, computedPercent);
      setShowResults(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setTextAnswers({});
    setSubmitted({});
    setCurrentIndex(0);
    setShowResults(false);
  };

  // Score calculations
  const correctCount = questions.reduce((acc, q) => {
    return acc + (checkIsCorrect(q) ? 1 : 0);
  }, 0);
  const scorePercent = Math.round((correctCount / totalQuestions) * 100);

  // Render Quiz Summary Scorecard
  if (showResults) {
    return (
      <Card className="border border-indigo-500/20 bg-card backdrop-blur-md my-8 shadow-2xl relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
        <CardContent className="p-8 text-center space-y-6">
          <div className="mx-auto h-20 w-20 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-500">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-xl font-black text-foreground">Practice Quiz Complete!</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Overall score for: <span className="text-foreground font-semibold">{lessonTitle}</span>
            </CardDescription>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto border-y border-border/40 py-4 my-2">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Score</p>
              <p className="text-2xl font-black text-foreground mt-0.5">{scorePercent}%</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Correct</p>
              <p className="text-2xl font-black text-emerald-500 mt-0.5">
                {correctCount} / {totalQuestions}
              </p>
            </div>
          </div>

          {/* Breakdown of questions */}
          <div className="space-y-3 text-left max-w-md mx-auto">
            <h5 className="text-xs font-bold text-foreground uppercase tracking-wider">Question Review:</h5>
            {questions.map((q, qIdx) => {
              const passed = checkIsCorrect(q);
              return (
                <div key={q.id} className="p-3 rounded-xl border border-border/40 bg-secondary/50 text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-foreground">Q{qIdx + 1}: {q.question}</span>
                    {passed ? (
                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10">Passed</Badge>
                    ) : (
                      <Badge variant="outline" className="border-rose-500/30 text-rose-600 bg-rose-500/10">Incorrect</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    <span className="font-bold text-foreground">Correct Answer: </span>
                    {q.correctAnswer || (q.options ? q.options[q.answerIndex ?? 0] : "")}
                  </p>
                  <p className="text-muted-foreground text-[11px] italic mt-0.5">{q.explanation}</p>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setShowResults(false);
                setCurrentIndex(0);
              }}
              className="rounded-xl border border-border bg-secondary px-4 py-2 text-xs font-bold text-foreground hover:bg-secondary/80 transition-all cursor-pointer flex items-center gap-1.5"
            >
              Review Answers
            </button>
            <button
              onClick={handleReset}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-indigo-600/10"
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
  const userText = textAnswers[currentQuestion.id] || "";
  const isSubmitted = !!submitted[currentQuestion.id];
  const isCorrect = checkIsCorrect(currentQuestion);
  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;

  const canSubmit = qType === "short_answer" ? userText.trim().length > 0 : selectedIdx !== undefined;

  return (
    <Card className="border border-indigo-500/20 bg-card backdrop-blur-md my-8 shadow-xl transition-all duration-300">
      {/* Dynamic top progress bar */}
      <div className="w-full h-1 bg-secondary">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <CardHeader className="flex flex-row items-center justify-between border-b border-border/20 pb-4 mb-4">
        <div className="flex items-center gap-2.5 text-left">
          <div className="rounded-lg p-2 bg-indigo-500/10 text-indigo-500">
            <HelpCircle className="h-4.5 w-4.5" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-foreground">
              Practice Checkup
            </CardTitle>
            <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
              Type: <span className="font-semibold capitalize text-foreground">{qType.replace("_", " ")}</span>
            </CardDescription>
          </div>
        </div>
        <Badge variant="outline" className="border-indigo-500/30 text-indigo-500 font-semibold bg-accent">
          {currentIndex + 1} of {totalQuestions} Questions
        </Badge>
      </CardHeader>

      <CardContent className="space-y-6 pt-2">
        <div className="space-y-4 text-left">
          {/* Question Text */}
          <h4 className="text-sm font-semibold text-foreground leading-relaxed">
            {currentIndex + 1}. {currentQuestion.question}
          </h4>

          {/* Multiple Choice & True/False Options */}
          {(qType === "multiple_choice" || qType === "true_false") && (
            <div className="grid grid-cols-1 gap-2.5">
              {(currentQuestion.options || (qType === "true_false" ? ["True", "False"] : [])).map((opt, optIdx) => {
                const isSelected = selectedIdx === optIdx;
                const isAnswer = optIdx === (currentQuestion.answerIndex ?? 0);

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    disabled={isSubmitted}
                    className={cn(
                      "w-full text-left rounded-xl px-4 py-3 text-xs font-medium border transition-all duration-200 select-none cursor-pointer outline-none relative group",
                      isSelected && !isSubmitted && "border-primary bg-accent text-accent-foreground shadow-sm",
                      isSelected && isSubmitted && isCorrect && "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                      isSelected && isSubmitted && !isCorrect && "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300",
                      isSubmitted && isAnswer && !isCorrect && "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                      !isSelected && (!isSubmitted || !isAnswer) && "border-border/60 bg-secondary/30 text-foreground hover:bg-secondary hover:border-border"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span>{opt}</span>
                      {isSubmitted && isAnswer && (
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 ml-2" />
                      )}
                      {isSubmitted && isSelected && !isCorrect && (
                        <XCircle className="h-4.5 w-4.5 text-rose-500 shrink-0 ml-2" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Short Answer Input Field */}
          {qType === "short_answer" && (
            <div className="space-y-3">
              <input
                type="text"
                value={userText}
                onChange={(e) => handleTextChange(e.target.value)}
                disabled={isSubmitted}
                placeholder="Type your answer here..."
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
              {isSubmitted && (
                <div className="p-3 rounded-xl border border-indigo-500/20 bg-accent text-xs">
                  <span className="font-bold text-foreground">Correct Answer: </span>
                  <span className="text-indigo-600 dark:text-indigo-300 font-semibold">{currentQuestion.correctAnswer}</span>
                </div>
              )}
            </div>
          )}

          {/* Explanation card */}
          {isSubmitted && (
            <div className={cn(
              "p-4 rounded-xl text-[11px] leading-relaxed border transition-all duration-300",
              isCorrect
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                : "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300"
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
          <div className="flex items-center justify-between border-t border-border/20 pt-4 mt-6">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary/80 disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            {!isSubmitted ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={!canSubmit}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-indigo-600/10"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="rounded-xl bg-secondary border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-secondary/80 transition-all cursor-pointer flex items-center gap-1"
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
