import { db } from "@/db";
import { resources, courses, user, comments, universities, votes } from "@/db/schema";
import { nanoid } from "nanoid";
import {eq, and, desc, sql, or, ilike} from "drizzle-orm"

export interface FindResourcesParams {
  courseId?: string;
  type?: "EXAM" | "NOTE" | "SUMMARY" | "ASSIGNMENT";
  limit?: number;
  offset?: number;
}
export class ResourceService {
  
  static async createResource(data: {
    title: string;
    fileUrl: string;
    fileKey: string;
    userId: string;
    courseId: string;
    type: "EXAM" | "NOTE" | "SUMMARY" | "ASSIGNMENT";
  }) {
    // 1. Ensure the course exists, or create it automatically
    let existingCourse = await db
      .select()
      .from(courses)
      .where(or(eq(courses.id, data.courseId), eq(courses.code, data.courseId)))
      .limit(1)
      .then((res) => res[0]);

    if (!existingCourse) {
      // 2. Ensure a default university exists
      let uni = await db
        .select()
        .from(universities)
        .limit(1)
        .then((res) => res[0]);

      if (!uni) {
        const newUni = await db
          .insert(universities)
          .values({ id: nanoid(), name: "Default University" })
          .returning();
        uni = newUni[0];
      }

      // 3. Create the missing course on the fly
      const newCourse = await db
        .insert(courses)
        .values({
          id: nanoid(),
          code: data.courseId.toUpperCase().replace(/\s+/g, ""), // "cs 101" -> "CS101"
          name: data.courseId,
          universityId: uni.id,
        })
        .returning();
      existingCourse = newCourse[0];
    }

    // 4. Create the final resource linked to the valid course
    const id = nanoid();
    return await db.insert(resources).values({
      id,
      title: data.title,
      fileUrl: data.fileUrl,
      fileKey: data.fileKey,
      userId: data.userId,
      courseId: existingCourse.id, // Now guaranteed to be a valid UUID
      type: data.type,
      score: 0,
    }).returning();
  }
  static async findMany(params: FindResourcesParams) {
    const { courseId, type, limit = 20, offset = 0 } = params;
    // We build the "where" clause dynamically
    const conditions = [];
    if (courseId) conditions.push(eq(resources.courseId, courseId));
    if (type) conditions.push(eq(resources.type, type));

    return await db
      .select({
        id: resources.id,
        title: resources.title,
        type: resources.type,
        score: resources.score,
        fileUrl: resources.fileUrl,
        createdAt: resources.createdAt,
        courseName: courses.name,
      })
      .from(resources)
      .leftJoin(courses, eq(resources.courseId, courses.id))
      .where(and(...conditions))
      .orderBy(desc(resources.score)) // Primary sort: highest ranking first
      .limit(limit)
      .offset(offset);
  }

  static async trackDownload(resourceId: string) {
    return await db
      .update(resources)
      .set({
        downloads: sql`${resources.downloads} + 1`,
        // We update the score immediately to keep our "Read" operations fast
        score: sql`${resources.upvotes} * 3 + (${resources.downloads} + 1) - ${resources.downvotes} * 2`,
      })
      .where(eq(resources.id, resourceId))
      .returning({ id: resources.id, newScore: resources.score });
  }

  static async searchResources(query: string) {
    // Validate and sanitize input
    if (!query || typeof query !== 'string') {
      throw new Error('Invalid search query');
    }

    // Length validation to prevent abuse
    if (query.length > 100) {
      throw new Error('Search query too long');
    }

    // Remove potentially dangerous characters
    const sanitizedQuery = query.replace(/[%;]/g, '').trim();
    
    if (sanitizedQuery.length < 2) {
      return []; // Return empty for very short queries
    }

    // ilike is a Case-Insensitive LIKE search.
    // For a "Senior" approach, we combine ilike with a simple rank
    return await db
      .select()
      .from(resources)
      .where(
        or(
          ilike(resources.title, `%${sanitizedQuery}%`),
          // You could also search by course code if you join the courses table
        )
      )
      .orderBy(desc(resources.score)) // Still prioritize high-quality resources
      .limit(10);
  }

  static async findManyWithStats(limit=10){
    return await db.select({
      id: resources.id,
      title: resources.title,
      score: resources.score,
      authorName: user.name,

      commentCount: sql<number>`(
        SELECT count(*) FROM ${comments} WHERE ${comments.resourceId} = ${resources.id}
      )`.mapWith(Number),

    })
    .from(resources)
    .leftJoin(user, eq(resources.userId, user.id))
    .orderBy(desc(resources.score))
    .limit(limit)
  } 

  static async toggleVote(resourceId: string, userId: string, voteType: "UP" | "DOWN") {
    const existingVote = await db
      .select()
      .from(votes)
      .where(and(eq(votes.resourceId, resourceId), eq(votes.userId, userId)))
      .limit(1)
      .then((res) => res[0]);

    if (existingVote) {
      if (existingVote.type === voteType) {
        // Toggle off
        await db.delete(votes).where(eq(votes.id, existingVote.id));
      } else {
        // Change vote
        await db.update(votes).set({ type: voteType }).where(eq(votes.id, existingVote.id));
      }
    } else {
      // New vote
      await db.insert(votes).values({
        id: nanoid(),
        resourceId,
        userId,
        type: voteType,
      });
    }

    // Recalculate and update the materialized stats in the resources table
    await db.update(resources).set({
      upvotes: sql`(SELECT count(*)::int FROM ${votes} WHERE ${votes.resourceId} = ${resources.id} AND type = 'UP')`,
      downvotes: sql`(SELECT count(*)::int FROM ${votes} WHERE ${votes.resourceId} = ${resources.id} AND type = 'DOWN')`,
      score: sql`(SELECT count(*)::int FROM ${votes} WHERE ${votes.resourceId} = ${resources.id} AND type = 'UP') * 3 + ${resources.downloads} - (SELECT count(*)::int FROM ${votes} WHERE ${votes.resourceId} = ${resources.id} AND type = 'DOWN') * 2`
    }).where(eq(resources.id, resourceId));

    // Return the newly updated stats
    const newStats = await db.select({
      upvotes: resources.upvotes,
      downvotes: resources.downvotes,
      score: resources.score
    }).from(resources).where(eq(resources.id, resourceId)).then(r => r[0]);

    return {
      success: true,
      userVote: existingVote?.type === voteType ? null : voteType,
      ...newStats
    };
  }

  static async findById(id: string, userId?: string) {
    const result = await db
      .select({
        id: resources.id,
        title: resources.title,
        type: resources.type,
        fileUrl: resources.fileUrl,
        score: resources.score,
        createdAt: resources.createdAt,
        // Joined data
        userName: user.name,
        courseName: courses.name,
        courseCode: courses.code,
        // Adding derived stats
        upvotes: resources.upvotes,
        downvotes: resources.downvotes,
        downloads: resources.downloads,
        userVote: userId 
          ? sql<string | null>`(SELECT type FROM ${votes} WHERE ${votes.resourceId} = ${resources.id} AND ${votes.userId} = ${userId} LIMIT 1)` 
          : sql<string | null>`NULL`,
      })
      .from(resources)
      .leftJoin(user, eq(resources.userId, user.id))
      .leftJoin(courses, eq(resources.courseId, courses.id))
      .where(eq(resources.id, id))
      .limit(1);

    return result[0] || null;
  }
}


