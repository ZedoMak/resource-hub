import { 
  ShieldCheck, 
  BookOpen, 
  Users, 
  FileWarning, 
  Scale 
} from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-3xl py-12 px-4 sm:px-6">
      {/* Header */}
      <div className="space-y-4 text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900">
          The Vibe Check <span className="text-zinc-400">(aka Terms of Service)</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          We kept the legal jargon to a minimum. Here is how we keep ResourceHub useful, legal, and chill for everyone.
        </p>
      </div>

      <div className="space-y-12">
        {/* Rule 1 */}
        <section className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <BookOpen className="h-6 w-6" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">1. The "Don't Be That Guy" Rule (Academic Integrity)</h2>
            <p className="text-zinc-600 leading-relaxed">
              This platform is for studying, preparing, and sharing knowledge. It is <strong className="text-zinc-900">not</strong> a tool for active cheating. Do not upload live exam papers, unreleased assignments, or anything that violates your university's honor code. If your professor wouldn't want it here, don't upload it.
            </p>
          </div>
        </section>

        {/* Rule 2 */}
        <section className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">2. Respect the Copyright</h2>
            <p className="text-zinc-600 leading-relaxed">
              Only upload content you have the right to share. Your personal lecture notes, study guides, and summaries are perfect. Ripped PDFs of $200 textbooks or proprietary publisher test banks are not. We comply with DMCA takedowns and will remove infringing material.
            </p>
          </div>
        </section>

        {/* Rule 3 */}
        <section className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">3. Keep the Comments Constructive</h2>
            <p className="text-zinc-600 leading-relaxed">
              The comment section is for thanking uploaders, pointing out typos in notes, or asking clarifying questions. Spam, hate speech, bullying, or aggressive behavior will get you banned. We are all stressed out; be kind.
            </p>
          </div>
        </section>

        {/* Rule 4 */}
        <section className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <FileWarning className="h-6 w-6" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">4. Quality Control & Votes</h2>
            <p className="text-zinc-600 leading-relaxed">
              Don't upload blank PDFs or spam files to farm points. The community curates the content through upvotes and downvotes. Consistently uploading low-quality or misleading files will result in your account losing upload privileges.
            </p>
          </div>
        </section>

        {/* Rule 5 */}
        <section className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-2xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
              <Scale className="h-6 w-6" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">5. The "We Do Our Best" Disclaimer</h2>
            <p className="text-zinc-600 leading-relaxed">
              ResourceHub is crowdsourced. That means a student might accidentally write <code className="bg-zinc-100 px-1 py-0.5 rounded text-sm text-zinc-800">2 + 2 = 5</code> in their Calculus notes. We don't guarantee the 100% accuracy of any uploaded document. Use these resources to supplement your studying, not replace it. If you fail a test because you memorized a wrong note, that's on you, friend.
            </p>
          </div>
        </section>
      </div>

      {/* Footer / Legal out */}
      <div className="mt-16 pt-8 border-t border-zinc-200 text-center space-y-4">
        <p className="text-sm text-zinc-500">
          By creating an account and using ResourceHub, you agree to these terms. 
          If you have questions, reach out to our moderation team.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/signup" className="text-sm font-medium text-zinc-900 hover:underline">
            Back to Sign Up
          </Link>
          <span className="text-zinc-300">•</span>
          <Link href="/" className="text-sm font-medium text-zinc-900 hover:underline">
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}