import { db } from "@/db";
import { comments, user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export class CommentService {
  static async addComment(userId: string, resourceId: string, content: string) {
    return await db.insert(comments).values({
      id: nanoid(),
      userId,
      resourceId,
      content,
    }).returning();
  }

  static async getByResource(resourceId: string) {
    return await db
      .select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        user: {
          name: user.name,
          image: user.image,
        },
      })
      .from(comments)
      .innerJoin(user, eq(comments.userId, user.id))
      .where(eq(comments.resourceId, resourceId))
      .orderBy(desc(comments.createdAt));
  }
}