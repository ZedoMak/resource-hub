import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-screen lg:grid-cols-[1fr_450px]">
      {/* Back Button */}
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "absolute left-4 top-4 md:left-8 md:top-8 z-50"
        )}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back
      </Link>

      {/* Form Section */}
      <div className="flex items-center justify-center p-8">
        <div className="mx-auto w-full max-w-[350px] space-y-6">
          {children}
        </div>
      </div>

      {/* Slim Dark Marketing Sidebar */}
      <div className="hidden lg:flex flex-col justify-between bg-zinc-950 p-10 text-white border-l border-zinc-800">
        <div className="flex items-center text-lg font-medium">
          <div className="mr-2 h-6 w-6 rounded bg-white text-black flex items-center justify-center font-bold text-xs">
            R
          </div>
          ResourceHub
        </div>
        
        <div className="mt-auto">
          <blockquote className="space-y-2">
            <p className="text-base text-zinc-300 italic leading-relaxed">
              &ldquo;Accessing organized past exams for my specific courses changed the way I study. Highly recommended.&rdquo;
            </p>
            <footer className="text-sm text-zinc-500">— Yeabsra Abesha</footer>
          </blockquote>

          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-zinc-800 pt-8">
            <div>
              <p className="text-xl font-bold">10k+</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Resources</p>
            </div>
            <div>
              <p className="text-xl font-bold">50+</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Universities</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}