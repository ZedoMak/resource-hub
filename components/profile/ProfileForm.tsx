"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UploadDropzone } from "@/lib/uploadthing";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ProfileFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null | undefined;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [name, setName] = useState(user.name);
  const [image, setImage] = useState(user.image);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image }),
      });

      if (!res.ok) throw new Error("Failed to save profile");

      toast.success("Profile updated successfully!");
      // Force Next.js to re-fetch Server Components (like the Navbar) with the new session data
      router.refresh();
    } catch (error) {
      toast.error("An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center">
        <Avatar className="h-32 w-32 border-4 border-zinc-50 shadow-md">
          <AvatarImage src={image || ""} alt={name} className="object-cover" />
          <AvatarFallback className="text-4xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
            {name[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 w-full relative">
          <Label className="text-muted-foreground mb-2 font-medium block">Upload New Avatar</Label>
          <div className="border-2 border-dashed rounded-2xl p-6 bg-zinc-50 dark:bg-zinc-900/30 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50">
            <UploadDropzone
              endpoint="imageUploader"
              onClientUploadComplete={(res) => {
                if (res?.[0]) {
                  setImage(res[0].url);
                  toast.success("Avatar uploaded! Remember to save changes.");
                }
              }}
              onUploadError={(error: Error) => {
                toast.error(`Upload failed: ${error.message}`);
              }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="name" className="text-sm font-semibold">Display Name</Label>
        <Input 
          id="name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          className="max-w-md h-12 text-lg shadow-sm border-zinc-200"
        />
        <p className="text-xs text-muted-foreground">This is the name that will appear on your uploaded resources and comments.</p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
        <Input 
          id="email" 
          value={user.email} 
          disabled 
          className="max-w-md h-12 bg-zinc-100 text-zinc-500 cursor-not-allowed select-none"
          title="Email cannot be changed"
        />
      </div>

      <div className="pt-4">
        <Button onClick={handleSave} disabled={isSaving} size="lg" className="w-full sm:w-auto px-10 h-12 shadow-indigo-500/20 shadow-lg">
          {isSaving ? "Saving changes..." : "Save Profile Changes"}
        </Button>
      </div>
    </div>
  );
}
