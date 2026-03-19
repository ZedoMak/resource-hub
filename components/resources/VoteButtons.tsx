"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VoteButtonsProps {
  resourceId: string;
  initialUserVote: string | null;
  initialUpvotes: number;
  initialDownvotes: number;
}

export function VoteButtons({
  resourceId,
  initialUserVote,
  initialUpvotes,
  initialDownvotes,
}: VoteButtonsProps) {
  const [userVote, setUserVote] = useState<string | null>(initialUserVote);
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [isLoading, setIsLoading] = useState(false);

  const handleVote = async (type: "UP" | "DOWN") => {
    setIsLoading(true);

    try {
      const res = await fetch(`/api/resources/${resourceId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Please log in to vote.");
          return;
        }
        throw new Error("Failed to vote");
      }

      const data = await res.json();

      setUserVote(data.userVote);
      setUpvotes(data.upvotes);
      setDownvotes(data.downvotes);

    } catch (error) {
      toast.error("An error occurred while voting.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        variant="outline"
        className={cn(
          "h-11 gap-2 border-zinc-200 transition-colors",
          userVote === "UP" && "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:text-indigo-800"
        )}
        onClick={() => handleVote("UP")}
        disabled={isLoading}
      >
        <ThumbsUp className={cn("h-4 w-4", userVote === "UP" && "fill-current")} />
        <span className="font-semibold">{upvotes}</span>
      </Button>

      <Button
        variant="outline"
        className={cn(
          "h-11 gap-2 border-zinc-200 transition-colors",
          userVote === "DOWN" && "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:text-rose-800"
        )}
        onClick={() => handleVote("DOWN")}
        disabled={isLoading}
      >
        <ThumbsDown className={cn("h-4 w-4", userVote === "DOWN" && "fill-current")} />
        <span className="font-semibold">{downvotes}</span>
      </Button>
    </div>
  );
}
