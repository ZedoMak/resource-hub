"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { UploadDropzone } from "@/lib/uploadthing";
import { toast } from "sonner";
import { Plus, FileIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function UploadResource({ isAuthenticated = true }: { isAuthenticated?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState<string>("EXAM");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!fileUrl) return toast.error("Please upload a file first");

    const formData = new FormData(e.currentTarget);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.get("title"),
          type: type,          // ← use state, not FormData (Select is a headless component)
          courseId: formData.get("courseId"),
          fileUrl: fileUrl,
        }),
      });

      if (res.ok) {
        toast.success("Resource uploaded successfully!");
        setOpen(false);
        setFileUrl(null);
        setType("EXAM");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Upload failed. Please try again.");
      }
    } catch (error) {
      toast.error("Something went wrong. Check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Button className="w-full gap-2" onClick={() => router.push("/login")}>
        <Plus className="h-4 w-4" /> Sign in to Upload
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2 lg:w-auto">
          <Plus className="h-4 w-4" /> Upload Resource
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload New Resource</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="e.g. Midterm 2023 - CS101" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXAM">Past Exam</SelectItem>
                  <SelectItem value="NOTE">Lecture Note</SelectItem>
                  <SelectItem value="SUMMARY">Summary</SelectItem>
                  <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Course ID</Label>
              <Input name="courseId" placeholder="Course UUID" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>File (PDF)</Label>
            {!fileUrl ? (
              <UploadDropzone
                endpoint="pdfUploader"
                appearance={{
                  container: "border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center bg-zinc-50/50 hover:bg-zinc-50 transition-colors cursor-pointer",
                  button: "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-md px-4 py-2 text-sm font-medium transition-colors w-full mt-4 cursor-pointer",
                  label: "text-zinc-700 dark:text-zinc-300 font-medium hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors",
                  allowedContent: "text-zinc-500 text-xs mt-2",
                  uploadIcon: "text-zinc-400 mb-4 h-10 w-10",
                }}
                onClientUploadComplete={(res) => {
                  setFileUrl(res[0].url);
                  toast.success("File uploaded to server");
                }}
                onUploadError={(error: Error) => {
                  toast.error(`Upload failed: ${error.message}`);
                }}
              />
            ) : (
              <div className="flex items-center gap-2 p-4 border rounded-xl bg-emerald-50 border-emerald-200">
                <FileIcon className="h-8 w-8 text-emerald-600" />
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium text-emerald-900 truncate">File ready for submission</p>
                  <button onClick={() => setFileUrl(null)} className="text-xs text-emerald-700 underline">Change file</button>
                </div>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || !fileUrl}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Publish Resource"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}