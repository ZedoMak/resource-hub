import { ResourceService } from "@/services/resource.service";
import { CommentService } from "@/services/comment.service";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/resources/DownloadButton";
import { Download, MessageSquare, Share2 } from "lucide-react";
import { CommentSection } from "@/components/resources/CommentSection";
import { VoteButtons } from "@/components/resources/VoteButtons";
import ShareButton from "../../share/page";

export default async function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) {
    redirect("/login");
  }

  const resource = await ResourceService.findById(resolvedParams.id);
  const comments = await CommentService.getByResource(resolvedParams.id);

  if (!resource) notFound();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
      <div className="lg:col-span-2 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 border-none uppercase text-[10px]">
              {resource.type}
            </Badge>
            <span className="text-sm font-medium text-zinc-500">{resource.courseCode} — {resource.courseName}</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900">{resource.title}</h1>
        </div>

        {/* Professional PDF Viewer */}
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl border bg-zinc-50 shadow-sm">
          <iframe
            src={`${resource.fileUrl}#toolbar=0`}
            className="h-full w-full"
            title={resource.title}
          />
          {/* Subtle overlay for guest users could go here */}
        </div>

        {/* Interactive Comment Section */}
        <CommentSection 
          resourceId={resource.id} 
          initialComments={comments} 
          user={session?.user} 
        />
      </div>

      {/* Sidebar Stats & Actions */}
      <div className="space-y-6">
        <div className="rounded-3xl border p-8 sticky top-24 bg-white shadow-sm">
          <div className="flex justify-around mb-8">
            <div className="text-center">
              <p className="text-3xl font-bold">{resource.score}</p>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">Score</p>
            </div>
            <div className="w-px bg-zinc-100" />
            <div className="text-center">
              <p className="text-3xl font-bold">{resource.downloads}</p>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">Downloads</p>
            </div>
          </div>

          <div className="space-y-3">
            <DownloadButton resourceId={resource.id} fileUrl={resource.fileUrl} className="w-full h-12 text-base gap-2" size="lg">
              <Download className="h-4 w-4" /> Download PDF
            </DownloadButton>
            <VoteButtons 
              resourceId={resource.id}
              initialUserVote={resource.userVote}
              initialUpvotes={resource.upvotes}
              initialDownvotes={resource.downvotes}
            />
            <ShareButton />
          </div>

          <div className="mt-8 pt-8 border-t border-zinc-50 space-y-4">
             <div className="flex items-center justify-between text-sm">
               <span className="text-zinc-500">Contributor</span>
               <span className="font-semibold text-zinc-900">{resource.userName}</span>
             </div>
             <div className="flex items-center justify-between text-sm">
               <span className="text-zinc-500">Uploaded</span>
               <span className="font-semibold text-zinc-900">
                 {new Date(resource.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
               </span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}