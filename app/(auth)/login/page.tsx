"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

const emailVerificationEnabled = process.env.NEXT_PUBLIC_ENABLE_EMAIL_VERIFICATION === "true";

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectTo = searchParams.get("redirect") || "/";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    await authClient.signIn.email(
      {
        email,
        password,
        callbackURL: redirectTo,
      },
      {
        onRequest: () => setLoading(true),
        onError: (ctx) => {
          setLoading(false);

          if (
            emailVerificationEnabled &&
            ctx.error.status === 403 &&
            ctx.error.message?.toLowerCase().includes("verified")
          ) {
            toast.error("Please verify your email address to log in.");
          } else {
            toast.error(ctx.error.message || "Failed to log in.");
          }
        },
        onSuccess: () => {
          setLoading(false);
          router.push(redirectTo);
          router.refresh();
        },
      },
    );
  };

  return (
    <div className="flex flex-col space-y-2 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="text-sm text-muted-foreground">Log in to access your resources</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
        <div className="grid gap-1">
          <Label className="sr-only" htmlFor="email">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="name@example.com"
            disabled={loading}
            required
          />
        </div>

        <div className="grid gap-1">
          <Label className="sr-only" htmlFor="password">
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Password"
            disabled={loading}
            required
          />
        </div>

        <Button className="w-full" disabled={loading}>
          {loading ? "Logging in..." : "Log In"}
        </Button>
      </form>

      <p className="px-8 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/signup" className="hover:text-brand underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  // Keep useSearchParams inside Suspense to avoid the App Router prerender bailout on /login.
  return (
    <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Loading login…</div>}>
      <LoginForm />
    </Suspense>
  );
}