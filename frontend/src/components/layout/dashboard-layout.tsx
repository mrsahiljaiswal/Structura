import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
