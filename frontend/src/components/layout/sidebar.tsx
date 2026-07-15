"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Upload,
  MessageSquare,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Courses", href: "/dashboard/courses", icon: BookOpen },
  { label: "Upload PDF", href: "/dashboard/upload", icon: Upload },
  { label: "AI Tutor", href: "/dashboard/tutor", icon: MessageSquare },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-zinc-800 bg-zinc-900/80 p-4 backdrop-blur-sm">
      <nav className="space-y-2">
        {sidebarItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-600/15 text-indigo-400"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
