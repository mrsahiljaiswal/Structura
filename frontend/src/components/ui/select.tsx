"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "Select option",
  className,
  triggerClassName,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={cn("relative inline-block text-left select-none", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex items-center justify-between gap-2.5 rounded-2xl border border-border/40 bg-card/80 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-foreground shadow-sm hover:border-primary/50 hover:bg-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer",
          triggerClassName
        )}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon}
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 min-w-[170px] w-full rounded-2xl border border-border/50 bg-card/95 backdrop-blur-2xl shadow-2xl p-1.5 z-50 animate-in fade-in-50 zoom-in-95 ring-1 ring-white/10">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer text-left",
                  isSelected
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "text-foreground hover:bg-secondary/80 hover:text-primary"
                )}
              >
                <span className="flex items-center gap-2 truncate">
                  {opt.icon}
                  <span>{opt.label}</span>
                </span>
                {isSelected && <Check className="h-3.5 w-3.5 text-primary-foreground shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
export default Select;
