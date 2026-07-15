"use client";

import { SignOutButton, useUser } from "@clerk/nextjs";

export default function DashboardPage() {
  const { isLoaded, user } = useUser();

  if (!isLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-200">
        <p>Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10">
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-lg shadow-zinc-950/20">
          <div className="flex items-center gap-6">
            <img
                src={user?.imageUrl} 
                alt={user?.fullName ?? "User avatar"}
                className="h-24 w-24 rounded-full border border-zinc-800 object-cover"
            />
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-indigo-400">Welcome back</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">{user?.fullName ?? "Learner"}</h1>
              <p className="mt-2 text-sm text-zinc-400">{user?.emailAddresses?.[0]?.emailAddress ?? "No email available"}</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-lg shadow-zinc-950/20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Dashboard</h2>
              <p className="mt-2 text-zinc-400">Your authenticated workspace is ready.</p>
            </div>
            <SignOutButton>
              <button className="rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500">
                Sign out
              </button>
            </SignOutButton>
          </div>
        </section>
      </div>
    </main>
  );
}
