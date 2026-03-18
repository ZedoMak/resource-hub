"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function SignupPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    await authClient.signUp.email({
      email,
      password,
      name,
      callbackURL: "/dashboard",
    }, {
      onRequest: () => setLoading(true),
      onError: (ctx) => {
        setLoading(false);
        alert(ctx.error.message);
      },
      onSuccess: () => {
        setLoading(false);
      }
    });
  };

  return (
    <div className="flex flex-col space-y-2 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
      <p className="text-sm text-muted-foreground">Enter your details to join the community</p>
      
      <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
        <div className="grid gap-1">
          <Label className="sr-only" htmlFor="name">Full Name</Label>
          <Input id="name" name="name" placeholder="Full Name" disabled={loading} required />
        </div>
        <div className="grid gap-1">
          <Label className="sr-only" htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="name@example.com" disabled={loading} required />
        </div>
        <div className="grid gap-1">
          <Label className="sr-only" htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" placeholder="Password" disabled={loading} required />
        </div>
        <Button className="w-full" disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </Button>
      </form>

      <p className="px-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="hover:text-brand underline underline-offset-4">
          Login
        </Link>
      </p>
    </div>
  );
}