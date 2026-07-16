/**
 * Purpose: Technical Textbook Markdown Prose Renderer for Structura
 * Styles headers, copyable code blocks, blockquotes, lists, and bold text.
 * Constrains width to 65-75 characters for optimal readability.
 */

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  // Parser that converts markdown string lines into structured JSX nodes
  const parseMarkdown = (text: string) => {
    if (!text) return [];

    const lines = text.split("\n");
    const nodes: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeContent: string[] = [];
    let codeLanguage = "";
    let listItems: string[] = [];
    let isOrderedList = false;

    // Helper to render inline formatting (bold, italic, inline code)
    const renderInline = (str: string): React.ReactNode[] => {
      const parts: React.ReactNode[] = [];
      let index = 0;

      // Regex matching bold (**), italic (*), and inline code (`)
      const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
      const matches = str.split(regex);

      return matches.map((match, i) => {
        if (match.startsWith("**") && match.endsWith("**")) {
          return <strong key={i} className="font-extrabold text-foreground">{match.slice(2, -2)}</strong>;
        }
        if (match.startsWith("*") && match.endsWith("*")) {
          return <em key={i} className="italic text-zinc-350">{match.slice(1, -1)}</em>;
        }
        if (match.startsWith("`") && match.endsWith("`")) {
          return (
            <code key={i} className="px-1.5 py-0.5 rounded bg-zinc-900 border border-border/40 font-mono text-[13px] text-indigo-400 select-all">
              {match.slice(1, -1)}
            </code>
          );
        }
        return match;
      });
    };

    const flushList = (key: number) => {
      if (listItems.length === 0) return;
      const ListTag = isOrderedList ? "ol" : "ul";
      nodes.push(
        <ListTag key={`list-${key}`} className={cn("pl-6 my-4 space-y-2 list-outside", isOrderedList ? "list-decimal" : "list-disc")}>
          {listItems.map((item, idx) => (
            <li key={idx} className="text-zinc-300 leading-relaxed pl-1 text-[15px]">
              {renderInline(item)}
            </li>
          ))}
        </ListTag>
      );
      listItems = [];
    };

    lines.forEach((line, idx) => {
      // 1. Code Block Boundary check
      if (line.trim().startsWith("```")) {
        if (inCodeBlock) {
          // Flush code block
          const codeString = codeContent.join("\n");
          nodes.push(
            <CodeBlock key={`code-${idx}`} code={codeString} language={codeLanguage} />
          );
          codeContent = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          codeLanguage = line.trim().slice(3) || "javascript";
        }
        return;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        return;
      }

      // 2. Heading checks
      if (line.startsWith("# ")) {
        flushList(idx);
        nodes.push(
          <h1 key={`h1-${idx}`} className="text-2xl font-black tracking-tight text-foreground mt-8 mb-4">
            {renderInline(line.slice(2))}
          </h1>
        );
        return;
      }
      if (line.startsWith("## ")) {
        flushList(idx);
        nodes.push(
          <h2 key={`h2-${idx}`} className="text-xl font-bold tracking-tight text-foreground mt-6 mb-3 border-b border-border/10 pb-1.5">
            {renderInline(line.slice(3))}
          </h2>
        );
        return;
      }
      if (line.startsWith("### ")) {
        flushList(idx);
        nodes.push(
          <h3 key={`h3-${idx}`} className="text-lg font-semibold text-foreground mt-5 mb-2">
            {renderInline(line.slice(4))}
          </h3>
        );
        return;
      }

      // 3. Blockquote / Callouts check
      if (line.startsWith(">")) {
        flushList(idx);
        // Remove > symbol and padding
        const quoteContent = line.slice(1).trim();
        nodes.push(
          <div key={`quote-${idx}`} className="my-5 border-l-3 border-indigo-500 bg-indigo-500/[0.03] p-4 rounded-r-xl text-zinc-300 italic text-[15px] leading-relaxed">
            {renderInline(quoteContent)}
          </div>
        );
        return;
      }

      // 4. List Items checks
      const isUnordered = line.trim().startsWith("* ") || line.trim().startsWith("- ");
      const isOrdered = /^\d+\.\s/.test(line.trim());

      if (isUnordered || isOrdered) {
        if (isUnordered !== !isOrderedList && listItems.length > 0) {
          flushList(idx);
        }
        isOrderedList = isOrdered;
        const cleanItem = isOrdered ? line.trim().replace(/^\d+\.\s/, "") : line.trim().slice(2);
        listItems.push(cleanItem);
        return;
      }

      // If we find an empty line, flush list and push spacer
      if (!line.trim()) {
        flushList(idx);
        return;
      }

      // 5. Default Paragraph line
      flushList(idx);
      nodes.push(
        <p key={`p-${idx}`} className="text-[15px] font-medium leading-relaxed text-zinc-300 my-4 text-justify select-text">
          {renderInline(line)}
        </p>
      );
    });

    // Flush any remaining list items at EOF
    flushList(lines.length);

    return nodes;
  };

  return (
    <article className={cn("max-w-[72ch] mx-auto select-text", className)}>
      {parseMarkdown(content)}
    </article>
  );
}

// Inner Copyable CodeBlock Component
function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-6 rounded-xl border border-border/40 bg-zinc-950/80 overflow-hidden font-mono text-[13px] shadow-lg">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/40 border-b border-border/20 text-zinc-500 text-[10px] uppercase font-bold select-none">
        <span>{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content scroll area */}
      <pre className="p-4 overflow-x-auto text-zinc-200 select-all leading-relaxed whitespace-pre font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}
