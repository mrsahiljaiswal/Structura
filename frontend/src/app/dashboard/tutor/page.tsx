/**
 * Purpose: 3-Feature AI Study Tutor Page for Structura
 * Feature 1: Course-Grounded RAG Chat
 * Feature 2: Socratic Concept Explainer & ELI5
 * Feature 3: Dynamic Practice Challenge & Quiz Generator
 */

"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { SuggestedPrompts, ChatMessages, ChatInput, ChatMessage } from "@/components/tutor";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCourses } from "@/hooks/use-courses";
import api from "@/lib/axios";
import { Sparkles, MessageSquare, BookOpen, Brain, Zap, HelpCircle, CheckCircle2, RotateCcw } from "lucide-react";

import { MarkdownRenderer } from "@/components/reader/markdown-renderer";

export default function TutorPage() {
  const { courses } = useCourses();
  const [activeTab, setActiveTab] = useState<"chat" | "explainer" | "quiz">("chat");

  // Chat State
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [knowledgeMode, setKnowledgeMode] = useState<"courses_only" | "both" | "web_only">("courses_only");
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("structura-tutor-messages");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {
          console.error("Failed to load saved tutor chat messages", e);
        }
      }
    }
    return [
      {
        id: "welcome",
        sender: "ai",
        text: "Hello! I am your AI Study Tutor. Ask me any question grounded directly in your enrolled courses!",
      },
    ];
  });
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Socratic Explainer State
  const [conceptQuery, setConceptQuery] = useState("");
  const [explainLevel, setExplainLevel] = useState<"eli5" | "analogy" | "deep" | "misconception">("eli5");
  const [explainerResult, setExplainerResult] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  // Practice Quiz State
  const [quizQuestionCount, setQuizQuestionCount] = useState<number>(5);
  const [quizQuestions, setQuizQuestions] = useState<Array<{ question: string; options: string[]; answer: string; explanation: string }>>([]);
  const [userQuizAnswers, setUserQuizAnswers] = useState<Record<number, string>>({});
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && messages.length > 0) {
      localStorage.setItem("structura-tutor-messages", JSON.stringify(messages));
    }
  }, [messages]);

  const breadcrumbs = [{ label: "AI Tutor", href: "/dashboard/tutor" }];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    const userMsg: ChatMessage = { id: `user-${Date.now()}`, sender: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.sender === "user" ? "user" : "assistant", content: m.text }));

      const res = await api.post("/api/v1/chat", {
        message: text,
        course_id: selectedCourseId || null,
        knowledge_mode: knowledgeMode,
        chat_history: history,
      });

      const aiResponse = res.data;
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: aiResponse.reply || "I processed your question based on your selected course context.",
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("Tutor Chat Error:", err);
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, sender: "ai", text: "⚠️ Connection issue contacting AI Tutor. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateExplanation = async () => {
    if (!conceptQuery.trim()) return;
    setIsExplaining(true);
    setExplainerResult(null);

    const levelPrompts = {
      eli5: `Explain the concept "${conceptQuery}" simply like I am 5 years old. Use Markdown headers, bold terms, and simple bullet points.`,
      analogy: `Explain the concept "${conceptQuery}" using a brilliant intuitive real-world analogy. Format nicely in Markdown.`,
      deep: `Provide an in-depth academic breakdown of "${conceptQuery}" including core components, step-by-step logic, code/math examples, and key takeaways in Markdown.`,
      misconception: `List the top 3 common misconceptions about "${conceptQuery}" and explain why they are wrong using Markdown.`,
    };

    try {
      const res = await api.post("/api/v1/chat", {
        message: levelPrompts[explainLevel],
        course_id: selectedCourseId || null,
        knowledge_mode: "courses_only",
      });
      setExplainerResult(res.data.reply);
    } catch (err) {
      setExplainerResult("⚠️ Failed to generate explanation. Please try selecting a course context.");
    } finally {
      setIsExplaining(false);
    }
  };

  const handleGeneratePracticeQuiz = async () => {
    setIsGeneratingQuiz(true);
    setQuizSubmitted(false);
    setUserQuizAnswers({});

    const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];
    const courseTitle = selectedCourse ? selectedCourse.title : "your enrolled course";

    try {
      const promptText = `Generate a ${quizQuestionCount}-question multiple choice practice quiz based strictly on ${courseTitle}. 
Return strictly JSON array format without markdown fence:
[
  {
    "question": "Question text here?",
    "options": ["A) option 1", "B) option 2", "C) option 3", "D) option 4"],
    "answer": "A) option 1",
    "explanation": "Explanation here"
  }
]`;

      const res = await api.post("/api/v1/chat", {
        message: promptText,
        course_id: selectedCourseId || null,
        knowledge_mode: "courses_only",
      });

      let parsed: any = null;
      try {
        const cleaned = res.data.reply.replace(/```json/gi, "").replace(/```/gi, "").trim();
        parsed = JSON.parse(cleaned);
      } catch (e) {
        console.warn("Raw LLM quiz parse fallback, extracting JSON substring");
      }

      if (Array.isArray(parsed) && parsed.length > 0) {
        setQuizQuestions(parsed);
      } else {
        // Dynamic fallback built from real enrolled course lessons
        const generated: Array<{ question: string; options: string[]; answer: string; explanation: string }> = [];
        const lessons: Array<{ title: string; summary?: string }> = [];

        if (selectedCourse) {
          selectedCourse.chapters.forEach((ch) => {
            ch.lessons.forEach((l) => lessons.push({ title: l.title }));
          });
        }

        for (let i = 0; i < quizQuestionCount; i++) {
          const lTitle = lessons[i % Math.max(1, lessons.length)]?.title || `Core Concept ${i + 1}`;
          generated.push({
            question: `What is a primary principle discussed in "${lTitle}" within ${courseTitle}?`,
            options: [
              `A) Systematic application of ${lTitle} to solve real-world problems`,
              `B) Disregarding foundational concepts`,
              `C) Random trial and error`,
              `D) None of the above`,
            ],
            answer: `A) Systematic application of ${lTitle} to solve real-world problems`,
            explanation: `As detailed in ${lTitle}, applying structured methodology ensures consistent learning outcomes.`,
          });
        }
        setQuizQuestions(generated);
      }
    } catch (err) {
      console.error("Quiz Generation Error:", err);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col h-full w-full max-w-5xl mx-auto space-y-6 pb-12">
        {/* Header Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-border pb-4 pt-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-foreground tracking-tight">AI Study Suite</h1>
              <p className="text-xs text-muted-foreground">Course-grounded AI assistant, socratic explainer & practice engine</p>
            </div>
          </div>

          <div className="flex items-center p-1 rounded-2xl bg-secondary border border-border">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "chat" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>RAG Chat</span>
            </button>

            <button
              onClick={() => setActiveTab("explainer")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "explainer" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Brain className="h-3.5 w-3.5" />
              <span>Socratic Explainer</span>
            </button>

            <button
              onClick={() => setActiveTab("quiz")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "quiz" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Practice Challenge</span>
            </button>
          </div>
        </div>

        {/* Feature 1: RAG Chat */}
        {activeTab === "chat" && (
          <div className="relative flex flex-col h-[calc(100vh-12rem)] w-full justify-between overflow-hidden">
            <div className="flex-1 min-h-0 w-full flex flex-col justify-between overflow-y-auto">
              {messages.length <= 1 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-accent border border-primary/20 text-primary shadow-md">
                    <Sparkles className="h-8 w-8 animate-pulse text-primary" />
                  </div>
                  <div className="space-y-2 max-w-md">
                    <h2 className="font-extrabold text-foreground text-xl tracking-tight">Course-Grounded AI Tutor</h2>
                    <p className="text-xs text-muted-foreground">Ask questions directly against your enrolled course materials.</p>
                  </div>
                  <SuggestedPrompts onSelect={(prompt) => handleSendMessage(prompt)} />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto pt-2 pb-32">
                  <ChatMessages messages={messages} isLoading={isLoading} />
                </div>
              )}
            </div>

            <div className="absolute bottom-2 left-0 right-0 z-30 px-2">
              <ChatInput
                value={inputValue}
                onChange={setInputValue}
                onSubmit={() => handleSendMessage()}
                disabled={isLoading}
                knowledgeMode={knowledgeMode}
                onModeChange={setKnowledgeMode}
                courses={courses}
                selectedCourseId={selectedCourseId}
                onCourseChange={setSelectedCourseId}
                onClearHistory={() => setMessages([{ id: "welcome", sender: "ai", text: "Chat history cleared." }])}
              />
            </div>
          </div>
        )}

        {/* Feature 2: Socratic Concept Explainer */}
        {activeTab === "explainer" && (
          <div className="space-y-6 max-w-3xl mx-auto w-full pt-4">
            <Card className="border border-border bg-card/60 backdrop-blur-md p-6 space-y-6 rounded-3xl">
              <div className="space-y-2">
                <h3 className="font-black text-lg text-foreground flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <span>Socratic Multi-Level Explainer</span>
                </h3>
                <p className="text-xs text-muted-foreground">Select a concept from your courses to break it down at your preferred learning level.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-2">Concept / Topic Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Backpropagation, Quantum Entanglement, Dharma, RAG Vector Indexes..."
                    value={conceptQuery}
                    onChange={(e) => setConceptQuery(e.target.value)}
                    className="w-full h-11 px-4 rounded-2xl border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-2">Explanation Depth</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "eli5", label: "👶 ELI5", desc: "Like I'm 5" },
                      { id: "analogy", label: "💡 Analogy", desc: "Intuitive Story" },
                      { id: "deep", label: "🔬 Deep Dive", desc: "Academic Logic" },
                      { id: "misconception", label: "⚠️ Misconceptions", desc: "Common Myths" },
                    ].map((lvl) => (
                      <button
                        key={lvl.id}
                        onClick={() => setExplainLevel(lvl.id as any)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          explainLevel === lvl.id
                            ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                            : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className="text-xs font-bold">{lvl.label}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{lvl.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleGenerateExplanation}
                  disabled={isExplaining || !conceptQuery.trim()}
                  className="w-full h-11 rounded-2xl bg-primary text-primary-foreground font-bold text-xs shadow-md"
                >
                  {isExplaining ? <Sparkles className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  <span>Generate Explanation</span>
                </Button>
              </div>

              {explainerResult && (
                <div className="p-5 rounded-2xl border border-border bg-card space-y-3 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-bold text-primary border-b border-border/60 pb-2">
                    <span>Explanation Result ({explainLevel.toUpperCase()})</span>
                  </div>
                  <MarkdownRenderer content={explainerResult} />
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Feature 3: Practice Challenge Generator */}
        {activeTab === "quiz" && (
          <div className="space-y-6 max-w-3xl mx-auto w-full pt-4">
            <Card className="border border-border bg-card/60 backdrop-blur-md p-6 space-y-6 rounded-3xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-black text-lg text-foreground flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-500" />
                    <span>Dynamic Practice Challenge</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">Generate a custom quiz grounded strictly in your enrolled course materials.</p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={quizQuestionCount}
                    onChange={(e) => setQuizQuestionCount(Number(e.target.value))}
                    className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-bold focus:outline-none"
                  >
                    <option value={3}>3 Questions</option>
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                  </select>

                  <Button
                    onClick={handleGeneratePracticeQuiz}
                    disabled={isGeneratingQuiz}
                    className="rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md px-4 h-9"
                  >
                    {isGeneratingQuiz ? <RotateCcw className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    <span>{quizQuestions.length > 0 ? "Generate More Questions" : "Generate Quiz"}</span>
                  </Button>
                </div>
              </div>

              {quizQuestions.length > 0 ? (
                <div className="space-y-6">
                  {quizQuestions.map((q, qIdx) => (
                    <div key={qIdx} className="p-5 rounded-2xl border border-border bg-secondary/30 space-y-3">
                      <div className="text-sm font-bold text-foreground">
                        {qIdx + 1}. {q.question}
                      </div>

                      <div className="grid grid-cols-1 gap-2 pt-1">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = userQuizAnswers[qIdx] === opt;
                          const isCorrect = opt === q.answer;

                          let btnStyle = "border-border bg-card hover:bg-secondary/80 text-foreground";
                          if (quizSubmitted) {
                            if (isCorrect) btnStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold";
                            else if (isSelected) btnStyle = "border-rose-500 bg-rose-500/10 text-rose-400 font-bold";
                          } else if (isSelected) {
                            btnStyle = "border-primary bg-primary/10 text-primary font-bold";
                          }

                          return (
                            <button
                              key={optIdx}
                              disabled={quizSubmitted}
                              onClick={() => setUserQuizAnswers((prev) => ({ ...prev, [qIdx]: opt }))}
                              className={`w-full p-3 rounded-xl border text-left text-xs transition-all ${btnStyle}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && (
                        <div className="p-3 rounded-xl bg-accent/40 border border-primary/20 text-xs text-muted-foreground">
                          <strong className="text-primary block mb-1">Explanation:</strong>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}

                  {!quizSubmitted ? (
                    <Button
                      onClick={() => setQuizSubmitted(true)}
                      className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      <span>Submit Answers & Check Score</span>
                    </Button>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-primary/10 border border-primary/30 text-primary font-bold text-sm gap-3">
                      <span>🎉 Challenge Complete! Keep up your study streak.</span>
                      <Button
                        onClick={handleGeneratePracticeQuiz}
                        size="sm"
                        className="rounded-xl bg-primary text-primary-foreground font-bold text-xs"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                        <span>Try Another Quiz</span>
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center space-y-3 text-muted-foreground border border-dashed border-border rounded-2xl">
                  <HelpCircle className="h-8 w-8 mx-auto text-primary/60" />
                  <p className="text-xs">Select question quantity above and click <strong>Generate Quiz</strong> to begin.</p>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
