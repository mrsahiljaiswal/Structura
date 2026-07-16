/**
 * Purpose: Context-Aware Floating AI Button & Chat Popover for Structura
 * Toggles a compact chat dialog in the bottom-right corner.
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FloatingAIButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: "user" | "ai"; text: string }[]>([
    { sender: "ai", text: "Hi Sahil! Ask me anything about your current reading context." },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input;
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setInput("");
    setIsLoading(true);

    // Simulate tutor responses with structured answers
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `In this reading section, the key concept revolves around the optimization of indexes. For instance, B-Trees decrease disk I/O complexity to O(log N). Let me know if you would like me to draft a quick quiz or summarize this further!`,
        },
      ]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <>
      {/* Floating Button Trigger */}
      <div className="fixed bottom-6 right-6 z-40 pointer-events-auto">
        <Button
          onClick={() => setIsOpen((prev) => !prev)}
          className="rounded-full h-12 px-5 bg-gradient-to-r from-indigo-600 to-violet-600 shadow-xl shadow-indigo-500/20 text-white flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
        >
          <Sparkles className="h-5 w-5 animate-pulse" />
          <span className="font-semibold text-sm">Ask AI</span>
        </Button>
      </div>

      {/* Slide-out Compact Chat Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-22 right-6 z-50 w-80 md:w-96 h-[450px] rounded-2xl border border-border/40 bg-zinc-950/95 backdrop-blur-md shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/40 border-b border-border/20">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-indigo-400" />
                <span className="text-sm font-semibold text-foreground">AI Study Assistant</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-7 w-7 rounded-lg text-zinc-500 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`rounded-xl px-3 py-2.5 text-sm max-w-[85%] leading-relaxed ${
                      m.sender === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-zinc-900/60 text-zinc-200 border border-border/20"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-xl px-3 py-2.5 bg-zinc-900/60 border border-border/20 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-zinc-900/20 border-t border-border/20">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="relative flex items-center"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="pr-10 rounded-xl bg-zinc-950/80 border-border/60"
                />
                <button
                  type="submit"
                  className="absolute right-3 p-1 rounded-md text-zinc-500 hover:text-indigo-400 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
