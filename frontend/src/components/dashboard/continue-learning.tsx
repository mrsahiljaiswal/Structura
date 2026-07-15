"use client";

import { Play } from "lucide-react";

const continueLearning = [
  {
    id: 1,
    course: "Advanced TypeScript",
    lesson: "Generics and Advanced Types",
    progress: 65,
  },
  {
    id: 2,
    course: "System Design Fundamentals",
    lesson: "Load Balancing Strategies",
    progress: 42,
  },
];

export function ContinueLearningSection() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-zinc-50 mb-6">Continue Learning</h2>
      <div className="grid gap-3">
        {continueLearning.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700 transition-colors">
            <div>
              <p className="text-sm text-zinc-400">{item.course}</p>
              <p className="font-medium text-zinc-50 mt-1">{item.lesson}</p>
            </div>
            <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500">
              <Play className="h-4 w-4" />
              Resume
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
