"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle, Sparkles, HelpCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  category?: string;
}

interface FlashcardsDeckProps {
  cards: Flashcard[];
}

export function FlashcardsDeck({ cards }: FlashcardsDeckProps) {
  const [deck, setDeck] = useState<Flashcard[]>(cards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Sync state whenever parent cards prop updates
  useEffect(() => {
    if (cards && cards.length > 0) {
      setDeck(cards);
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  }, [cards]);

  if (!deck || deck.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border border-border bg-card rounded-2xl shadow-xs">
        <Sparkles className="h-8 w-8 text-primary mb-2" />
        <p className="text-sm font-semibold text-muted-foreground">No flashcards generated for this course yet.</p>
      </div>
    );
  }

  const currentCard = deck[currentIndex] || deck[0];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % deck.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + deck.length) % deck.length);
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setCurrentIndex(0);
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto text-center select-none">
      {/* Header Bar */}
      <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
        <span className="flex items-center gap-1.5 text-primary">
          <Sparkles className="h-4 w-4" />
          <span>Card {currentIndex + 1} of {deck.length}</span>
        </span>
        <button
          type="button"
          onClick={handleShuffle}
          className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
        >
          <Shuffle className="h-3.5 w-3.5" />
          <span>Shuffle Deck</span>
        </button>
      </div>

      {/* 3D Flippable Card Box */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="relative h-80 w-full cursor-pointer select-none overflow-hidden rounded-3xl"
        style={{ perspective: 1000 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {!isFlipped ? (
            <motion.div
              key="front"
              initial={{ rotateY: -90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: 90, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="h-full w-full rounded-3xl border border-border bg-card p-8 shadow-xl backdrop-blur-xl flex flex-col items-center justify-between text-center"
            >
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary bg-accent border border-indigo-500/20 px-3 py-1 rounded-full">
                {currentCard?.category || "Concept Check"}
              </span>

              <div className="my-auto space-y-2">
                <h3 className="text-lg sm:text-xl font-black text-foreground leading-snug">
                  {currentCard?.front}
                </h3>
              </div>

              <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1 mt-auto">
                <HelpCircle className="h-3.5 w-3.5 text-primary" /> Click card to reveal answer
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="back"
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="h-full w-full rounded-3xl border border-border bg-card p-8 shadow-xl backdrop-blur-xl flex flex-col items-center justify-between text-center"
            >
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Answer Key</span>
              </span>

              <div className="my-auto w-full p-4 rounded-2xl bg-secondary/50 border border-border/60">
                <p className="text-sm sm:text-base font-semibold text-foreground leading-relaxed">
                  {currentCard?.back}
                </p>
              </div>

              <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1 mt-auto">
                <RotateCcw className="h-3.5 w-3.5 text-primary" /> Click card to view question
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-3">
        <Button
          onClick={handlePrev}
          variant="outline"
          size="sm"
          className="rounded-xl gap-1 border-border text-foreground font-bold hover:bg-secondary cursor-pointer shadow-xs"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </Button>

        <Button
          onClick={() => setIsFlipped(!isFlipped)}
          variant="ghost"
          size="sm"
          className="rounded-xl gap-1.5 text-xs text-primary font-bold hover:bg-accent cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>{isFlipped ? "Show Question" : "Reveal Answer"}</span>
        </Button>

        <Button
          onClick={handleNext}
          variant="outline"
          size="sm"
          className="rounded-xl gap-1 border-border text-foreground font-bold hover:bg-secondary cursor-pointer shadow-xs"
        >
          <span>Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
