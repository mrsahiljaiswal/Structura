/**
 * Purpose: Sticky Reading Scroll Progress Component for Structura Reader
 * Calculates page scroll percentage dynamically (0% to 100%).
 */

import React, { useEffect, useState } from "react";

export function StickyProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;

      // Handle edge case of non-scrollable pages
      if (documentHeight <= windowHeight) {
        setProgress(100);
        return;
      }

      const totalScroll = documentHeight - windowHeight;
      const scrollPercent = Math.min(100, Math.max(0, (scrollTop / totalScroll) * 100));
      setProgress(Math.round(scrollPercent));
    };

    window.addEventListener("scroll", handleScroll);
    // Initial check
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-16 left-0 right-0 z-30 h-1 bg-zinc-900 overflow-hidden pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 transition-all duration-100 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
export default StickyProgress;
