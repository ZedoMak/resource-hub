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
import { UploadResource } from "@/components/dashboard/UploadResource";

const navItems = [
  { label: "All Resources", value: "ALL", icon: LayoutDashboard },
  { label: "Past Exams", value: "EXAM", icon: History },
  { label: "Lecture Notes", value: "NOTE", icon: FileText },
  { label: "Summaries", value: "SUMMARY", icon: BookOpen },
  { label: "Assignments", value: "ASSIGNMENT", icon: GraduationCap },
];

export function DashboardSidebar({ currentType, isAuthenticated = true }: { currentType?: string, isAuthenticated?: boolean }) {
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
                "w-full justify-start gap-3 px-4 py-2.5 text-sm font-medium transition-all rounded-xl ",
                (currentType === item.value || (!currentType && item.value === "ALL"))
                  ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              onClick={() => handleFilter(item.value)}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="px-3 py-2 pt-6 mt-2 border-t border-border/40">
        <h2 className="mb-4 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Contribute
        </h2>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[1px] shadow-sm">
          <div className="relative h-full w-full rounded-[23px] bg-background/95 backdrop-blur-xl p-6">
            <h3 className="font-semibold text-foreground mb-1 text-sm">Share Knowledge</h3>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Have a paper that could help others? Upload it!
            </p>
            <UploadResource isAuthenticated={isAuthenticated} />
          </div>
        </div>
      </div>
    </div>
  );
}