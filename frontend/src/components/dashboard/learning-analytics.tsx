"use client";

import { TrendingUp, BookOpen, Clock, Award } from "lucide-react";

const stats = [
  {
    label: "Total Learning Time",
    value: "12 hrs",
    change: "+2.5 hrs this week",
    icon: Clock,
    color: "bg-blue-600/10 text-blue-400",
  },
  {
    label: "Courses In Progress",
    value: "3",
    change: "1 completed",
    icon: BookOpen,
    color: "bg-purple-600/10 text-purple-400",
  },
  {
    label: "Lessons Completed",
    value: "24",
    change: "+5 this week",
    icon: Award,
    color: "bg-green-600/10 text-green-400",
  },
  {
    label: "Avg Quiz Score",
    value: "87%",
    change: "+3% improvement",
    icon: TrendingUp,
    color: "bg-orange-600/10 text-orange-400",
  },
];

export function LearningAnalyticsSection() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-zinc-50 mb-6">Learning Analytics</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <div className={`inline-flex rounded-lg ${stat.color} p-2 mb-4`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-sm text-zinc-400">{stat.label}</p>
              <p className="text-2xl font-bold text-zinc-50 mt-2">{stat.value}</p>
              <p className="text-xs text-zinc-500 mt-3">{stat.change}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
