import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes conditionally, resolving conflicting utility
 * classes in the order they were passed (last one wins).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
