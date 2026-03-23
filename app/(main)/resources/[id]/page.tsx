import { asc, eq } from "drizzle-orm";
import { Download } from "lucide-react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { AICompanionPanel } from "@/components/ai/AICompanionPanel";
import { CommentSection } from "@/components/resources/CommentSection";
import { DownloadButton } from "@/components/resources/DownloadButton";
import { VoteButtons } from "@/components/resources/VoteButtons";
import { Badge } from "@/components/ui/badge";
import { db } from "@/db";
import { aiProviderKeys } from "@/db/schema";
import { auth } from "@/lib/auth";
import { isTrustedUploadThingFileUrl } from "@/lib/trusted-resource-url";
import { CommentService } from "@/services/comment.service";
import { ResourceService } from "@/services/resource.service";

import ShareButton from "../../share/page";

export default async function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const [resource, comments, providerKeys] = await Promise.all([
    ResourceService.findById(resolvedParams.id, session.user.id),
    CommentService.getByResource(resolvedParams.id),
    db.query.aiProviderKeys.findMany({
      where: eq(aiProviderKeys.userId, session.user.id),
      columns: {
        provider: true,
        status: true,
        keyFingerprint: true,
      },
      orderBy: asc(aiProviderKeys.provider),
    }),
  ]);

  if (!resource) notFound();

  const canPreviewFile = isTrustedUploadThingFileUrl(resource.fileUrl);

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="border-none bg-zinc-100 text-[10px] uppercase text-zinc-900 hover:bg-zinc-200">
              {resource.type}
            </Badge>
            <span className="text-sm font-medium text-zinc-500">
              {resource.courseCode} — {resource.courseName}
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900">{resource.title}</h1>
        </div>

        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl border bg-zinc-50 shadow-sm">
          {canPreviewFile ? (
            <iframe
              src={`${resource.fileUrl}#toolbar=0`}
              className="h-full w-full"
              title={resource.title}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-8 text-center">
              <div className="space-y-3">
                <p className="text-lg font-semibold text-zinc-900">Preview unavailable</p>
                <p className="text-sm text-zinc-500">
                  This file is stored on an untrusted host, so the inline preview has been disabled for safety.
                </p>
              </div>
            </div>
          )}
        </div>

        <CommentSection resourceId={resource.id} initialComments={comments} user={session.user} />
      </div>

      <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <div className="mb-8 flex justify-around">
            <div className="text-center">
              <p className="text-3xl font-bold">{resource.score}</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Score</p>
            </div>
            <div className="w-px bg-zinc-100" />
            <div className="text-center">
              <p className="text-3xl font-bold">{resource.downloads}</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Downloads</p>
            </div>
          </div>

          <div className="space-y-3">
            <DownloadButton resourceId={resource.id} fileUrl={resource.fileUrl} className="h-12 w-full gap-2 text-base" size="lg">
              <Download className="h-4 w-4" /> Download PDF
            </DownloadButton>
            <VoteButtons
              resourceId={resource.id}
              initialUserVote={resource.userVote}
              initialUpvotes={resource.upvotes}
              initialDownvotes={resource.downvotes}
            />
            <ShareButton />
            <AICompanionPanel
              isAuthenticated={Boolean(session.user)}
              resource={{
                id: resource.id,
                title: resource.title,
                courseCode: resource.courseCode,
                courseName: resource.courseName,
                type: resource.type,
              }}
              providers={providerKeys}
            />
          </div>

          <div className="mt-8 space-y-4 border-t border-zinc-50 pt-8">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Contributor</span>
              <span className="font-semibold text-zinc-900">{resource.userName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Uploaded</span>
              <span className="font-semibold text-zinc-900">
                {new Date(resource.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
