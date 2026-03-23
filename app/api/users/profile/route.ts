import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { checkRateLimit, rateLimitPolicies, withRateLimitHeaders } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/security";

export const maxDuration = 10;

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { state, response } = await checkRateLimit({
      req,
      policy: rateLimitPolicies.profileWrite,
      userId: session.user.id,
    });

    if (response) {
      return response;
    }

    const body = await req.json();
    const { name, image } = body;

    if (!name || typeof name !== "string") {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Name is required" }, { status: 400 }),
        state,
      );
    }

    await db
      .update(user)
      .set({
        name: name.trim(),
        ...(image && { image }),
      })
      .where(eq(user.id, session.user.id));

    return withRateLimitHeaders(
      NextResponse.json({ success: true, name: name.trim(), image }),
      state,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
