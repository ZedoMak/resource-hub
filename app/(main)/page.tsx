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
          <Link href="/dashboard">
            <Button size="lg" variant="outline" className="h-12 px-8 text-base">
              Browse Resources
            </Button>
          </Link>
        </div>
      </section>

      {/* --- Enhanced Bento Features Grid --- */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Smart Search Card */}
        <div className="md:col-span-2 relative overflow-hidden rounded-3xl p-[1px] group transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-200 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900" />
          <div className="relative h-full bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl rounded-[23px] p-8 md:p-10 flex flex-col justify-between min-h-[300px] border border-white/50 dark:border-white/5">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px] shadow-lg mb-6">
              <div className="h-full w-full bg-white dark:bg-zinc-950 rounded-[15px] flex items-center justify-center">
                <Search className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight text-zinc-900 dark:text-zinc-100">Smart Search</h3>
              <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
                Filter by university, department, or specific course codes.
                Find exactly what you need in seconds, not hours.
              </p>
            </div>
          </div>
        </div>

        {/* Ranking System Card */}
        <div className="relative overflow-hidden rounded-3xl p-[1px] group transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-200 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900" />
          <div className="relative h-full bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl rounded-[23px] p-8 md:p-10 flex flex-col justify-between min-h-[300px] border border-white/50 dark:border-white/5">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-[1px] shadow-lg mb-6">
              <div className="h-full w-full bg-white dark:bg-zinc-950 rounded-[15px] flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight text-zinc-900 dark:text-zinc-100">Ranking System</h3>
              <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Our community-driven score ensures high-quality resources stay at the top.
              </p>
            </div>
          </div>
        </div>

        {/* PDF Previews Card */}
        <div className="relative overflow-hidden rounded-3xl p-[1px] group transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-200 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900" />
          <div className="relative h-full bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl rounded-[23px] p-8 md:p-10 flex flex-col justify-between min-h-[300px] border border-white/50 dark:border-white/5">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-[1px] shadow-lg mb-6">
              <div className="h-full w-full bg-white dark:bg-zinc-950 rounded-[15px] flex items-center justify-center">
                <FileText className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight text-zinc-900 dark:text-zinc-100">PDF Previews</h3>
              <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Preview documents seamlessly in your browser before committing to a download.
              </p>
            </div>
          </div>
        </div>

        {/* Verified by Peers Card */}
        <div className="md:col-span-2 relative overflow-hidden rounded-3xl group transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl border-0 bg-zinc-950 text-white p-8 md:p-12 flex flex-col lg:flex-row items-center gap-10">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-pink-500/10 pointer-events-none" />
          <div className="flex-1 relative z-10">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-md mb-6">
              <ShieldCheck className="h-3 w-3 mr-2 text-indigo-400" /> Community Driven
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-4 text-white tracking-tight">Verified by Peers</h3>
            <p className="text-lg text-zinc-400 leading-relaxed max-w-xl">
              Each resource is upvoted and commented on by students who actually took the course.
              Say goodbye to irrelevant curriculum study material.
            </p>
          </div>
          <div className="flex -space-x-4 relative z-10 shrink-0">
            {/* Styling Avatar pile mockup */}
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-14 w-14 rounded-full border-[3px] border-zinc-950 bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-300 shadow-xl transition-transform hover:-translate-y-2 hover:z-50 cursor-default">
                U{i}
              </div>
            ))}
            <div className="h-14 w-14 rounded-full border-[3px] border-zinc-950 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-xl z-20">
              +9k
            </div>
          </div>
        </div>
      </section>

      {/* --- Social Proof / Stats --- */}
      <section className="border-t border-zinc-200 dark:border-white/10 pt-20 mt-10 w-full max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          <div className="group">
            <p className="text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-b from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 transition-transform group-hover:scale-110 duration-300 mb-2">12k+</p>
            <p className="text-sm md:text-base font-semibold text-zinc-500 tracking-widest uppercase">Documents</p>
          </div>
          <div className="group">
            <p className="text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-b from-indigo-500 to-purple-500 transition-transform group-hover:scale-110 duration-300 mb-2">45</p>
            <p className="text-sm md:text-base font-semibold text-zinc-500 tracking-widest uppercase">Universities</p>
          </div>
          <div className="group">
            <p className="text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-b from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 transition-transform group-hover:scale-110 duration-300 mb-2">8k+</p>
            <p className="text-sm md:text-base font-semibold text-zinc-500 tracking-widest uppercase">Active Users</p>
          </div>
          <div className="group">
            <p className="text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-b from-emerald-400 to-teal-500 transition-transform group-hover:scale-110 duration-300 mb-2">100%</p>
            <p className="text-sm md:text-base font-semibold text-zinc-500 tracking-widest uppercase">Free Access</p>
          </div>
        </div>
      </section>

      {/* --- Footer Premium CTA --- */}
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 mt-10 mb-20">
        <div className="relative rounded-[3rem] overflow-hidden isolate shadow-2xl">
          {/* Animated Background Gradients */}
          <div className="absolute inset-0 bg-zinc-900 dark:bg-black" />
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/40 via-purple-500/20 to-pink-500/40 opacity-50 mix-blend-color-dodge" />
          <div className="absolute -top-1/2 -right-1/4 w-[1000px] h-[1000px] rounded-full bg-gradient-to-bl from-indigo-500/30 to-transparent blur-3xl opacity-50" />
          <div className="absolute -bottom-1/2 -left-1/4 w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-purple-500/30 to-transparent blur-3xl opacity-50" />

          <div className="relative z-10 px-6 py-24 sm:px-16 md:py-32 flex flex-col items-center text-center gap-8 backdrop-blur-sm border border-white/10 rounded-[3rem]">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white max-w-3xl">
              Ready to ace your next exam?
            </h2>
            <p className="text-lg md:text-xl text-zinc-300 max-w-2xl leading-relaxed">
              Join thousands of students across the globe. Start contributing your knowledge and accessing top-tier study materials entirely for free.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <Link href="/signup">
                <Button size="lg" className="h-14 px-10 text-lg bg-white text-zinc-900 hover:bg-zinc-100 hover:scale-105 transition-all shadow-xl shadow-white/10">
                  Create Free Account
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="h-14 px-10 text-lg text-white border-white/20 hover:bg-white/10 hover:text-white backdrop-blur-md transition-all bg-violet">
                  Browse Guest Resources
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}