import { db } from "@/db";
import { resources } from "@/db/schema";
import { nanoid } from "nanoid";

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
}