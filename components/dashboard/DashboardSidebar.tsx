"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  FileText, 
  GraduationCap, 
  History, 
  LayoutDashboard 
} from "lucide-react";

const navItems = [
  { label: "All Resources", value: "ALL", icon: LayoutDashboard },
  { label: "Past Exams", value: "EXAM", icon: History },
  { label: "Lecture Notes", value: "NOTE", icon: FileText },
  { label: "Summaries", value: "SUMMARY", icon: BookOpen },
  { label: "Assignments", value: "ASSIGNMENT", icon: GraduationCap },
];

export function DashboardSidebar({ currentType }: { currentType?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilter = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL") {
      params.delete("type");
    } else {
      params.set("type", value);
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Resource Type
        </h2>
        <div className="space-y-1">
          {navItems.map((item) => (
            <Button
              key={item.value}
              variant={
                (currentType === item.value || (!currentType && item.value === "ALL")) 
                ? "secondary" 
                : "ghost"
              }
              className={cn(
                "w-full justify-start gap-3 px-4 py-2 text-sm font-medium transition-all",
                (currentType === item.value || (!currentType && item.value === "ALL"))
                ? "bg-zinc-100 text-zinc-900"
                : "text-zinc-500 hover:text-zinc-900"
              )}
              onClick={() => handleFilter(item.value)}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="px-3 py-2 pt-4 border-t border-zinc-100">
         <h2 className="mb-4 px-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Contribute
        </h2>
        <div className="rounded-2xl bg-zinc-950 p-6 text-white">
           <p className="text-xs text-zinc-400 mb-4">
             Have a paper that could help others? Upload it and earn points.
           </p>
           <Button variant="secondary" size="sm" className="w-full text-xs">
             Upload Now
           </Button>
        </div>
      </div>
    </div>
  );
}