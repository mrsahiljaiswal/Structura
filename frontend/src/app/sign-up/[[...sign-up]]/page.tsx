"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignUp, useUser } from "@clerk/nextjs";
import { Sparkles, Brain, Zap, ShieldCheck, Star } from "lucide-react";

export default function SignUpPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

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
              <span>Create Your Free Account</span>
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground leading-tight">
              Unlock Your <span className="bg-gradient-to-r from-primary via-purple-500 to-indigo-600 bg-clip-text text-transparent">AI Learning Potential</span>
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Join thousands of students and engineering teams using Structura to convert textbooks and technical docs into AI courses.
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl border border-border/60 bg-secondary/40 backdrop-blur-md">
              <div className="p-2 rounded-xl bg-primary/10 text-primary mt-0.5">
                <Brain className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Full RAG Context Access</h4>
                <p className="text-xs text-muted-foreground">AI tutor grounded directly in your uploaded textbooks and technical guides.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl border border-border/60 bg-secondary/40 backdrop-blur-md">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 mt-0.5">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Automated Quiz & Streak Tracking</h4>
                <p className="text-xs text-muted-foreground">Keep momentum with interactive progress metrics, scorecards, and study timers.</p>
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
              &quot;The speed and quality of generated flashcards and concept maps is unmatched.&quot;
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] font-bold text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Instant Setup & Free Access</span>
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 md:p-12 relative bg-background/95 backdrop-blur-2xl">
        {/* Mobile Background Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/20 rounded-full blur-3xl lg:hidden pointer-events-none" />

        <div className="w-full max-w-md space-y-6 relative z-10">
          {/* Mobile Header Branding */}
          <div className="flex lg:hidden items-center justify-center gap-2.5 mb-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <Sparkles className="h-5.5 w-5.5" />
            </div>
            <span className="text-2xl font-black tracking-tight text-foreground">Structura</span>
          </div>

          <div className="text-center lg:text-left space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Create Your Account</h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Join Structura to generate interactive AI study courses</p>
          </div>

          {/* Form Card Container */}
          <div className="rounded-3xl border border-primary/20 bg-card/80 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10">
            <SignUp
              fallbackRedirectUrl="/dashboard"
              forceRedirectUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-transparent border-0 shadow-none p-0 w-full",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "rounded-2xl border border-border/80 bg-secondary/60 hover:bg-secondary text-foreground font-bold text-xs h-11 transition-all shadow-xs",
                  dividerLine: "bg-border/60",
                  dividerText: "text-muted-foreground text-[10px] uppercase font-extrabold tracking-wider",
                  formFieldLabel: "text-xs font-bold text-foreground mb-1",
                  formFieldInput: "rounded-2xl border border-border/80 bg-background/80 text-foreground text-xs font-medium h-11 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all",
                  formButtonPrimary: "rounded-2xl bg-primary text-primary-foreground font-extrabold text-xs h-11 hover:opacity-90 shadow-xl shadow-primary/25 transition-all cursor-pointer",
                  footerActionLink: "text-primary font-extrabold text-xs hover:underline",
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
