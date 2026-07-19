import Link from "next/link";
import {
  Sparkles,
  BookOpen,
  Brain,
  Zap,
  ArrowRight,
  Upload,
  CheckCircle2,
  ShieldCheck,
  Star,
  BarChart3,
  Layers,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-primary selection:text-primary-foreground">
      {/* Landing Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-xl font-black tracking-tight text-foreground">Structura</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-bold text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-xs font-bold text-foreground px-4 py-2 rounded-xl hover:bg-secondary transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="text-xs font-bold bg-primary text-primary-foreground px-4 py-2.5 rounded-xl hover:opacity-90 shadow-md shadow-primary/20 transition-all flex items-center gap-1.5"
            >
              <span>Get Started Free</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="mx-auto max-w-5xl px-6 text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-accent text-accent-foreground border border-primary/20 shadow-xs animate-in fade-in duration-500">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span>Next-Gen PDF to E-Course Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground leading-[1.15]">
            Turn Any PDF Document into an <br />
            <span className="bg-gradient-to-r from-primary via-indigo-500 to-purple-600 bg-clip-text text-transparent">
              Interactive E-Course
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed font-normal">
            Upload textbooks, research papers, or engineering documentation. Structura extracts chapter trees, generates grounded RAG lessons, 3D flashcards, concept maps, and quizzes in seconds.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/sign-up"
              className="h-12 px-8 rounded-2xl bg-primary text-primary-foreground font-extrabold text-sm flex items-center gap-2 hover:opacity-90 shadow-xl shadow-primary/25 transition-all cursor-pointer"
            >
              <Upload className="h-4.5 w-4.5" />
              <span>Upload PDF & Create Course</span>
            </Link>
            <Link
              href="/dashboard"
              className="h-12 px-8 rounded-2xl border border-border bg-card text-foreground font-extrabold text-sm flex items-center gap-2 hover:bg-secondary transition-all cursor-pointer shadow-xs"
            >
              <BookOpen className="h-4.5 w-4.5 text-primary" />
              <span>Explore Dashboard</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="py-20 bg-card/50 border-t border-border">
        <div className="mx-auto max-w-7xl px-6 space-y-12">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Everything You Need</h2>
            <h3 className="text-3xl font-extrabold text-foreground tracking-tight">Built for Deep Learning & Retention</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl border border-border bg-card shadow-xs space-y-4">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary w-fit">
                <Brain className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-foreground">Course-Grounded AI Tutor</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Chat with an AI assistant that has complete memory of your published course content with direct highlighted lesson references.
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-border bg-card shadow-xs space-y-4">
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500 w-fit">
                <Layers className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-foreground">AI Concept Node Maps</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Explore interactive visual knowledge graphs linking core concepts and chapter lessons to quickly pinpoint weak spots.
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-border bg-card shadow-xs space-y-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 w-fit">
                <Zap className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-foreground">Interactive 3D Flashcard Decks</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Test your mastery with 3D flip card question decks that automatically track your progress and quiz scores over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 bg-background text-xs text-muted-foreground">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-bold text-foreground">Structura Inc. &copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6 font-semibold">
            <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
            <Link href="/sign-in" className="hover:text-foreground">Sign In</Link>
            <Link href="/sign-up" className="hover:text-foreground">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
