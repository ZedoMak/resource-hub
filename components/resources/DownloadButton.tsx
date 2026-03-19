"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DownloadButtonProps {
  resourceId: string;
  fileUrl: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  children: React.ReactNode;
}

export function DownloadButton({
  resourceId,
  fileUrl,
  className,
  variant = "default",
  size = "default",
  children
}: DownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/resources/${resourceId}/download`, {
        method: "POST",
      });

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Please sign in to log downloads.");
        }
      }

      // Download actual file
      window.open(fileUrl, "_blank");
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while attempting to download.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      className={className} 
      onClick={handleDownload}
      disabled={isLoading}
    >
      {children}
    </Button>
  );
}
