import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Sparkles, BookOpen, Brain, Zap, CheckCircle2, ShieldCheck, Star } from "lucide-react";

export default function SignInPage() {
  return (
    <main className="min-h-screen w-full flex bg-background text-foreground overflow-hidden">
      {/* Left Column: Visual Brand Showcase & Features (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-card border-r border-border p-12 flex-col justify-between overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-foreground">Structura</h2>
            <p className="text-xs font-semibold text-muted-foreground">AI Learning Workspace</p>
          </div>
        </div>

        {/* Central Hero Content */}
        <div className="relative z-10 space-y-8 my-auto py-12 max-w-lg">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-accent text-accent-foreground border border-primary/20">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Next-Gen PDF Ingestion & RAG</span>
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground leading-tight">
              Transform Complex PDFs into <span className="bg-gradient-to-r from-primary via-purple-500 to-indigo-600 bg-clip-text text-transparent">Interactive E-Courses</span>
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Upload any document to generate instant lessons, AI tutoring, flashcards, concept maps, and tracked study quizzes in seconds.
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl border border-border/60 bg-secondary/40 backdrop-blur-md">
              <div className="p-2 rounded-xl bg-primary/10 text-primary mt-0.5">
                <Brain className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Course-Grounded RAG AI Tutor</h4>
                <p className="text-xs text-muted-foreground">Ask questions directly against your uploaded reading materials with instant citations.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl border border-border/60 bg-secondary/40 backdrop-blur-md">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 mt-0.5">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">AI Flashcards & Concept Maps</h4>
                <p className="text-xs text-muted-foreground">Visualize complex relationships with interactive concept node graphs and 3D decks.</p>
              </div>
            </div>
          </div>

          {/* Social Proof Banner */}
          <div className="p-4 rounded-2xl border border-border bg-card/60 backdrop-blur-md space-y-2">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="text-xs italic text-foreground">
              &quot;Structura turned 500-page engineering manuals into structured, searchable interactive courses in minutes.&quot;
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] font-bold text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Verified Enterprise Learning Platform</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-muted-foreground flex items-center justify-between border-t border-border/40 pt-4">
          <span>&copy; {new Date().getFullYear()} Structura Inc.</span>
          <div className="flex gap-4">
            <span className="hover:text-foreground cursor-pointer">Privacy</span>
            <span className="hover:text-foreground cursor-pointer">Terms</span>
            <span className="hover:text-foreground cursor-pointer">Security</span>
          </div>
        </div>
      </div>

      {/* Right Column: Sleek Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-background">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Header Branding */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-xl font-black text-foreground">Structura</span>
          </div>

          <div className="text-center lg:text-left space-y-1">
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Welcome Back</h2>
            <p className="text-xs text-muted-foreground">Sign in to access your AI study workspace & courses</p>
          </div>

          {/* Form Card Container */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-2xl backdrop-blur-xl">
            <SignIn
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-transparent border-0 shadow-none p-0 w-full",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs h-10 transition-all",
                  dividerLine: "bg-border",
                  dividerText: "text-muted-foreground text-[10px] uppercase font-bold",
                  formFieldLabel: "text-xs font-bold text-foreground",
                  formFieldInput: "rounded-xl border border-border bg-background text-foreground text-xs font-medium h-10 focus:border-primary focus:ring-1 focus:ring-primary",
                  formButtonPrimary: "rounded-xl bg-primary text-primary-foreground font-bold text-xs h-10 hover:opacity-90 shadow-md transition-all",
                  footerActionLink: "text-primary font-bold text-xs hover:underline",
                  identityPreviewText: "text-foreground font-semibold text-xs",
                  formResendCodeLink: "text-primary font-bold text-xs",
                },
              }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
