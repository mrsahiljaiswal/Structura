/**
 * Purpose: Redesigned Settings Page for Structura
 * Integrates study targets and cache reset triggers.
 */

"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { coursePersistence } from "@/lib/services/course-service";
import { Settings, User, Sliders, Trash2, ShieldAlert, Sparkles } from "lucide-react";

export default function SettingsPage() {
  const toast = useToast();
  const [targetTime, setTargetTime] = useState("30");
  const [profileName, setProfileName] = useState("Sahil Jaiswal");

  const breadcrumbs = [
    { label: "Settings", href: "/dashboard/settings" },
  ];

  const handleSavePreferences = () => {
    toast.success("Study targets and theme preferences updated!");
  };

  const handleClearCache = () => {
    if (confirm("Are you sure you want to delete all cached courses, reading logs, and markdown scratch notes? This action cannot be undone.")) {
      coursePersistence.clearAllData();
      toast.success("Developer Cache Cleared Successfully!");
    }
  };

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-8 max-w-4xl text-left">
        {/* Header Title Block */}
        <section className="space-y-1.5 border-b border-border/20 pb-6">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase">
            <Sparkles className="h-4 w-4" />
            <span>Preferences Control</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Settings className="h-5.5 w-5.5 text-indigo-400" />
            <span>System Settings</span>
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Configure your AI tutor prompts, study streaks metrics, and profile caches.
          </p>
        </section>

        {/* Section 1: Profile details */}
        <Card className="border border-border/40 bg-zinc-900/10">
          <CardHeader className="flex flex-row items-start gap-4 border-b border-border/20 pb-4 mb-4">
            <div className="rounded-lg p-2.5 bg-zinc-950 border border-border/40 text-indigo-400">
              <User className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-foreground">User Profile</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Manage your credentials and Clerk profile indices.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Full Name
                </label>
                <Input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="bg-zinc-950 border-border/40"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Login Credentials
                </label>
                <Input
                  value="sahil@mrsahiljaiswal.com"
                  disabled
                  className="bg-zinc-950 border-border/20 text-zinc-500 cursor-not-allowed"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Study Target details */}
        <Card className="border border-border/40 bg-zinc-900/10">
          <CardHeader className="flex flex-row items-start gap-4 border-b border-border/20 pb-4 mb-4">
            <div className="rounded-lg p-2.5 bg-zinc-950 border border-border/40 text-indigo-400">
              <Sliders className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-foreground">Learning Preferences</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Configure your daily study schedules and streaks target minutes.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-0">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Daily Learning Target
              </label>
              <select
                value={targetTime}
                onChange={(e) => setTargetTime(e.target.value)}
                className="h-10 w-full md:w-60 px-3 rounded-xl border border-border/45 bg-zinc-950 text-xs font-semibold text-foreground focus:outline-none focus:border-indigo-500"
              >
                <option value="15">15 minutes / day</option>
                <option value="30">30 minutes / day</option>
                <option value="60">60 minutes / day</option>
                <option value="120">120 minutes / day</option>
              </select>
            </div>

            <Button onClick={handleSavePreferences} className="rounded-xl h-9 text-xs">
              Save Preferences
            </Button>
          </CardContent>
        </Card>

        {/* Section 3: Danger Zone Maintenance */}
        <Card className="border border-red-500/20 bg-red-500/[0.01]">
          <CardHeader className="flex flex-row items-start gap-4 border-b border-red-500/20 pb-4 mb-4">
            <div className="rounded-lg p-2.5 bg-zinc-950 border border-red-500/20 text-red-400">
              <ShieldAlert className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-red-400">Danger Zone</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Perform dangerous workspace maintenance resets.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Clearing client-side cache removes all favorited course mappings, lesson completed flags, and auto-saved draft notepad texts. The raw course documents remain saved in your Python/Postgres backend.
            </p>
            <Button
              onClick={handleClearCache}
              variant="default"
              className="rounded-xl bg-red-600 hover:bg-red-500 text-white h-9 text-xs gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear Client Cache</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
