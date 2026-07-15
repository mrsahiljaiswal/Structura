import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-10 text-zinc-100 bg-zinc-950">
      <div className="max-w-2xl text-center">
        <p className="text-sm uppercase tracking-[0.4em] text-indigo-400">Structura</p>
        <h1 className="mt-6 text-4xl font-semibold text-white">Transform documents into interactive learning.</h1>
        <p className="mt-4 text-zinc-400">Upload a PDF, generate a course, and access your personalized learning dashboard.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/sign-in" className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500">
            Sign In
          </Link>
          <Link href="/sign-up" className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-100 hover:border-indigo-500 hover:text-white">
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}
