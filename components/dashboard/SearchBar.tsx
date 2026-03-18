"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchBar() {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search for courses or topics..."
        className="pl-9 bg-zinc-50 border-zinc-200 focus:bg-white transition-colors"
      />
    </div>
  );
}