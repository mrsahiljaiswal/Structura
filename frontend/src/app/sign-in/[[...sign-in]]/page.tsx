import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-10">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-xl shadow-zinc-950/20">
        <h1 className="text-2xl font-semibold text-white">Sign in to Structura</h1>
        <div className="mt-6">
          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-transparent border-0 shadow-none p-0",
              },
            }}
          />
        </div>
      </div>
    </main>
  );
}
