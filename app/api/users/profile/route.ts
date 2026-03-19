import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { handleApiError } from "@/lib/security";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
export const maxDuration = 10;

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, image } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Update the database record using Better Auth's raw user table through drizzle
    await db.update(user)
      .set({ 
        name: name.trim(), 
        ...(image && { image }) 
      })
      .where(eq(user.id, session.user.id));

    return NextResponse.json({ success: true, name: name.trim(), image });
  } catch (error) {
    return handleApiError(error);
  }
}
