import { db } from "@/db";
import { votes, resources } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export class VoteService {
  static async castVote(userId: string, resourceId: string, type: "UP" | "DOWN") {
    return await db.transaction(async (tx) => {
      // 1. Upsert the vote
      await tx.insert(votes)
        .values({ id: nanoid(), userId, resourceId, type })
        .onConflictDoUpdate({
          target: [votes.userId, votes.resourceId],
          set: { type },
        });

      // 2. Recalculate and update the Resource stats aggregate the total UP/DOWN counts from the votes table to ensure the resource table stays in sync.
      const voteStats = await tx
        .select({
          ups: sql<number>`count(*) filter (where ${votes.type} = 'UP')`,
          downs: sql<number>`count(*) filter (where ${votes.type} = 'DOWN')`,
        })
        .from(votes)
        .where(eq(votes.resourceId, resourceId));

      const { ups, downs } = voteStats[0];

      await tx.update(resources)
        .set({
          upvotes: ups,
          downvotes: downs,
          // Ranking Formula: (upvotes * 3 + downloads - downvotes * 2)
          score: sql`(${ups} * 3) + ${resources.downloads} - (${downs} * 2)`,
        })
        .where(eq(resources.id, resourceId));
      
      return { ups, downs };
    });
  }
}