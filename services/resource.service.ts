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
}


