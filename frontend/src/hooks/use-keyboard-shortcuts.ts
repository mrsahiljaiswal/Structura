/**
 * Purpose: Global Keyboard Shortcuts Listener Hook for Structura
 * Binds custom actions to key combos (Ctrl+K, Ctrl+U, Ctrl+/, Ctrl+B, Ctrl+D).
 */

import { useEffect } from "react";

type ShortcutCallback = (e: KeyboardEvent) => void;

interface ShortcutMap {
  [key: string]: ShortcutCallback;
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Ctrl or Cmd key is pressed
      const isMeta = e.ctrlKey || e.metaKey;
      if (!isMeta) return;

      const key = e.key.toLowerCase();
      
      if (shortcuts[key]) {
        e.preventDefault();
        shortcuts[key](e);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}
