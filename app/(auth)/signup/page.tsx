"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    
    setSubmittedEmail(email);

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
        setSuccess(true);
      }
    });
  };

  if (success) {
    return (
      <div className="flex flex-col space-y-4 text-center items-center justify-center py-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mb-2 shadow-sm border border-emerald-200">
            <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Check your email</h1>
        <p className="text-base text-muted-foreground max-w-sm leading-relaxed">
          We just sent a verification link to <br/>
          <span className="font-semibold text-zinc-900 border-b border-zinc-200 pb-0.5">{submittedEmail}</span>
        </p>
        <p className="text-sm text-muted-foreground pb-4">
          Please click the link in your email to verify your account and gain full access to the Dashboard.
        </p>
        <Link href="/login" className="w-full">
          <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 mx-auto -mt-2">Return to Login</Button>
        </Link>
      </div>
    );
  }

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
      <p className="px-8 text-center  text-sm text-muted-foreground">
        By creating and joining our community you agree to the <Link href="/terms" className="hover:text-brand underline underline-offset-4">Terms and Conditions</Link>
      </p>
    </div>
  );
}