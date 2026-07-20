"use client";

import React, { useState, useEffect } from "react";
import { Volume2, VolumeX, Play, Pause, RotateCcw, Bookmark, Gauge, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Select } from "@/components/ui/select";

interface AudioNarratorProps {
  text: string;
  title?: string;
  lessonId?: string;
  onSentenceChange?: (sentence: string | null) => void;
  onEnd?: () => void;
}

export function AudioNarrator({ text, title, lessonId, onSentenceChange, onEnd }: AudioNarratorProps) {
  const toast = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [isSupported, setIsSupported] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const sentences = React.useMemo(() => {
    const clean = text
      .replace(/```[\s\S]*?```/g, "Code block omitted.")
      .replace(/[#*`_~]/g, "")
      .trim();
    const split = clean.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 2);
    return title ? [title, ...split] : split;
  }, [text, title]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsSupported(false);
    }

    // Load bookmarked narration position if available
    if (lessonId && typeof window !== "undefined") {
      const savedBm = localStorage.getItem(`structura-audio-bm-${lessonId}`);
      if (savedBm) {
        setIsBookmarked(true);
      }
    }

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [lessonId]);

  const speakFromIndex = (idx: number, currentRate: number) => {
    if (idx >= sentences.length) {
      setIsPlaying(false);
      onSentenceChange?.(null);
      onEnd?.();
      return;
    }

    window.speechSynthesis.cancel();
    const targetSentence = sentences[idx];
    setCurrentIndex(idx);
    onSentenceChange?.(targetSentence || null);

    const utterance = new SpeechSynthesisUtterance(targetSentence);
    utterance.rate = currentRate;

    utterance.onend = () => {
      speakFromIndex(idx + 1, currentRate);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      onSentenceChange?.(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleTogglePlay = () => {
    if (!isSupported) return;

    if (isPlaying) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      onSentenceChange?.(null);
    } else {
      setIsPlaying(true);
      let startIdx = currentIndex;
      if (lessonId && typeof window !== "undefined" && startIdx === 0) {
        const savedBm = localStorage.getItem(`structura-audio-bm-${lessonId}`);
        if (savedBm) {
          const parsed = parseInt(savedBm, 10);
          if (!isNaN(parsed) && parsed < sentences.length) startIdx = parsed;
        }
      }
      speakFromIndex(startIdx, rate);
    }
  };

  const handleStop = () => {
    if (!isSupported) return;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setCurrentIndex(0);
    onSentenceChange?.(null);
  };

  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    if (isPlaying) {
      handleStop();
      setTimeout(() => {
        setIsPlaying(true);
        speakFromIndex(currentIndex, newRate);
      }, 100);
    }
  };

  const toggleBookmarkNarration = () => {
    if (!lessonId || typeof window === "undefined") return;
    if (isBookmarked) {
      localStorage.removeItem(`structura-audio-bm-${lessonId}`);
      setIsBookmarked(false);
      toast.info("Audio narration bookmark removed.");
    } else {
      localStorage.setItem(`structura-audio-bm-${lessonId}`, currentIndex.toString());
      setIsBookmarked(true);
      toast.success(`Narration bookmarked at sentence #${currentIndex + 1}`);
    }
  };

  if (!isSupported) return null;

  return (
    <div className="flex flex-wrap items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-xs text-foreground transition-all">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-accent border border-indigo-500/20 text-primary">
          <Volume2 className="h-4.5 w-4.5 animate-pulse" />
        </div>
        <div>
          <h4 className="text-xs font-extrabold text-foreground">AI Audio Narration</h4>
          <p className="text-[10px] font-semibold text-muted-foreground">
            {isPlaying ? `Reading sentence ${currentIndex + 1} of ${sentences.length}` : "Listen to lesson breakdown"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Playback Speed Premium Dropdown Select */}
        <Select
          value={rate.toString()}
          onChange={(val) => handleRateChange(parseFloat(val))}
          options={[
            { value: "0.75", label: "0.75x" },
            { value: "1", label: "1.0x (Normal)" },
            { value: "1.25", label: "1.25x" },
            { value: "1.5", label: "1.5x" },
            { value: "2", label: "2.0x" },
          ]}
          triggerClassName="h-9 px-3 rounded-xl border-border bg-secondary/80 text-xs font-bold"
        />

        {/* Bookmark Narration Position Button */}
        <button
          type="button"
          onClick={toggleBookmarkNarration}
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            isBookmarked
              ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
              : "border-border/60 bg-secondary/80 text-muted-foreground hover:text-foreground"
          }`}
          title={isBookmarked ? "Bookmark saved" : "Bookmark current narration sentence"}
        >
          <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
        </button>

        {/* Play/Pause Button */}
        <Button
          onClick={handleTogglePlay}
          size="sm"
          className="h-9 px-4 gap-1.5 rounded-xl font-bold bg-primary text-primary-foreground shadow-xs hover:opacity-90 cursor-pointer"
        >
          {isPlaying ? (
            <>
              <Pause className="h-4 w-4 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-current" />
              <span>Listen</span>
            </>
          )}
        </Button>

        {isPlaying && (
          <Button
            onClick={handleStop}
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground rounded-xl cursor-pointer"
            title="Reset narration"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
