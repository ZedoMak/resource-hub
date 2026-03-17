import { db } from "@/db";
import { resources, courses } from "@/db/schema";
import { nanoid } from "nanoid";
import {eq, and, desc, sql} from "drizzle-orm"

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
   // here Generate IDs on the application side (e.g., nanoid) 
    // instead of relying on serial integers for public-facing IDs. 
    // It prevents people from guessing the total number of resources.
    const id = nanoid();

    return await db.insert(resources).values({
      id,
      ...data,
      score: 0, // Initial score
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
    // ilike is a Case-Insensitive LIKE search.
    // For a "Senior" approach, we combine ilike with a simple rank
    return await db
      .select()
      .from(resources)
      .where(
        or(
          ilike(resources.title, `%${query}%`),
          // You could also search by course code if you join the courses table
        )
      )
      .orderBy(desc(resources.score)) // Still prioritize high-quality resources
      .limit(10);
  }
}


