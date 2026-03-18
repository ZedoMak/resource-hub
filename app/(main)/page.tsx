import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Search, 
  TrendingUp, 
  Users, 
  ShieldCheck, 
  ArrowRight 
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* --- Hero Section --- */}
      <section className="flex flex-col items-center text-center pt-10 md:pt-20 gap-6">
        <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium bg-secondary/50">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2" />
          Join 2,000+ students today
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl">
          Master your exams with <span className="text-zinc-500">shared intelligence.</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
          The central hub for past exams, lecture notes, and study resources. 
          Built by students, for students.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Link href="/signup">
            <Button size="lg" className="h-12 px-8 text-base">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/courses">
            <Button size="lg" variant="outline" className="h-12 px-8 text-base">
              Browse Resources
            </Button>
          </Link>
        </div>
      </section>

      {/* --- Bento Features Grid --- */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 rounded-3xl border bg-zinc-50 dark:bg-zinc-900/50 p-8 flex flex-col justify-between min-h-[300px]">
          <div className="h-12 w-12 rounded-xl bg-white dark:bg-zinc-800 border shadow-sm flex items-center justify-center">
            <Search className="h-6 w-6 text-zinc-900 dark:text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold mb-2">Smart Search</h3>
            <p className="text-muted-foreground">
              Filter by university, department, or specific course codes. 
              Find exactly what you need in seconds, not hours.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border p-8 flex flex-col justify-between min-h-[300px]">
          <div className="h-12 w-12 rounded-xl bg-white dark:bg-zinc-800 border shadow-sm flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-zinc-900 dark:text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold mb-2">Ranking System</h3>
            <p className="text-muted-foreground">
              Our community-driven score ensures high-quality resources stay at the top.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border p-8 flex flex-col justify-between min-h-[300px]">
          <div className="h-12 w-12 rounded-xl bg-white dark:bg-zinc-800 border shadow-sm flex items-center justify-center">
            <FileText className="h-6 w-6 text-zinc-900 dark:text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold mb-2">PDF Previews</h3>
            <p className="text-muted-foreground">
              Preview documents directly in your browser before downloading.
            </p>
          </div>
        </div>

        <div className="md:col-span-2 rounded-3xl border bg-zinc-950 text-white p-8 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <h3 className="text-2xl font-semibold mb-2 text-white">Verified by Peers</h3>
            <p className="text-zinc-400">
              Each resource is upvoted and commented on by students who actually took the course. 
              No more irrelevant study material.
            </p>
          </div>
          <div className="flex -space-x-4">
             {/* Simple Avatar pile mockup */}
             {[1,2,3,4].map(i => (
               <div key={i} className="h-12 w-12 rounded-full border-2 border-zinc-950 bg-zinc-800 flex items-center justify-center text-xs font-bold">
                 U{i}
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* --- Social Proof / Stats --- */}
      <section className="border-t pt-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-4xl font-bold">12k+</p>
            <p className="text-sm text-muted-foreground">Documents</p>
          </div>
          <div>
            <p className="text-4xl font-bold">45</p>
            <p className="text-sm text-muted-foreground">Universities</p>
          </div>
          <div>
            <p className="text-4xl font-bold">8k+</p>
            <p className="text-sm text-muted-foreground">Active Users</p>
          </div>
          <div>
            <p className="text-4xl font-bold">100%</p>
            <p className="text-sm text-muted-foreground">Free Access</p>
          </div>
        </div>
      </section>

      {/* --- Footer CTA --- */}
      <section className="rounded-3xl bg-zinc-100 dark:bg-zinc-900 p-12 text-center flex flex-col items-center gap-6">
        <h2 className="text-3xl font-bold">Ready to ace your next exam?</h2>
        <p className="text-muted-foreground max-w-md">
          Join thousands of students and start contributing to the community.
        </p>
        <Link href="/signup">
          <Button size="lg" className="px-10">Create Free Account</Button>
        </Link>
      </section>
    </div>
  );
}