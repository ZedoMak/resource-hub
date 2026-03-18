"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function CommentSection({ resourceId, initialComments, user }: any) {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePostComment = async () => {
    if (!user) return toast.error("Please log in to comment");
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      // Logic for posting to your /api/comments endpoint...
      // For now, we'll simulate the success
      const fakeNewComment = { id: Date.now(), content: newComment, userName: user.name, createdAt: new Date() };
      setComments([fakeNewComment, ...comments]);
      setNewComment("");
      toast.success("Comment posted!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Discussion</h3>
        <div className="flex gap-4">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={user?.image} />
            <AvatarFallback>{user?.name?.charAt(0) || "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea 
              placeholder="Write a helpful comment..." 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px] rounded-2xl border-zinc-200 focus:ring-zinc-900"
            />
            <div className="flex justify-end">
              <Button onClick={handlePostComment} disabled={isSubmitting || !newComment}>
                Post Comment
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {comments.map((comment: any) => (
          <div key={comment.id} className="flex gap-4">
            <Avatar className="h-9 w-9 border">
              <AvatarImage src={comment.userImage} />
              <AvatarFallback>{comment.userName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{comment.userName}</span>
                <span className="text-xs text-zinc-400">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}