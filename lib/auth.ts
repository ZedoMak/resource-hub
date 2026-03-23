import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { sendVerificationEmail } from "@/lib/mail";

export const enableEmailVerification = process.env.ENABLE_EMAIL_VERIFICATION === "true";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  // Keep email verification toggleable for free deployments until a sending domain is configured.
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: enableEmailVerification,
  },
  ...(enableEmailVerification
    ? {
        emailVerification: {
          sendOnSignUp: true,
          sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
            await sendVerificationEmail({ email: user.email, url });
          },
        },
      }
    : {
        // sendVerificationEmail is intentionally disabled while email verification is off.
      }),
});
