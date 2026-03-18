"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { UploadDropzone } from "@/lib/uploadthing"; // We'll create this helper next
import { toast } from "sonner";
import { Plus, FileIcon, Loader2 } from "lucide-react";

export function UploadResource() {
  const [open, setOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!fileUrl) return toast.error("Please upload a file first");

    const formData = new FormData(e.currentTarget);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        body: JSON.stringify({
          title: formData.get("title"),
          type: formData.get("type"),
          courseId: formData.get("courseId"),
          fileUrl: fileUrl,
        }),
      });

      if (res.ok) {
        toast.success("Resource uploaded successfully!");
        setOpen(false);
        setFileUrl(null);
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Upload Resource
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
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
              <Select name="type" defaultValue="EXAM">
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXAM">Past Exam</SelectItem>
                  <SelectItem value="NOTE">Lecture Note</SelectItem>
                  <SelectItem value="SUMMARY">Summary</SelectItem>
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