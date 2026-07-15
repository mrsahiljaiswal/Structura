"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { UploadDocumentCard } from "@/components/dashboard/upload-card";
import { RecentCoursesSection } from "@/components/dashboard/recent-courses";
import { ContinueLearningSection } from "@/components/dashboard/continue-learning";
import { LearningAnalyticsSection } from "@/components/dashboard/learning-analytics";
import { useUser } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";

export default function DashboardPage() {
  const { isLoaded, user } = useUser();

  if (!isLoaded) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-zinc-400">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-12">
        {/* Welcome Hero */}
        <section className="pt-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              <p className="text-sm font-medium text-indigo-400">Welcome back!</p>
            </div>
            <h1 className="text-4xl font-bold text-zinc-50">
              Hi {user?.fullName?.split(" ")[0]}, ready to learn something new?
            </h1>
            <p className="text-lg text-zinc-400 mt-2 max-w-2xl">
              Transform your documents into interactive learning experiences. Upload a PDF and let AI create personalized courses for you.
            </p>
          </div>
        </section>

        {/* Upload Card */}
        <section>
          <UploadDocumentCard />
        </section>

        {/* Learning Analytics */}
        <section>
          <LearningAnalyticsSection />
        </section>

        {/* Recent Courses & Continue Learning */}
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentCoursesSection />
          </div>
          <div>
            <ContinueLearningSection />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
