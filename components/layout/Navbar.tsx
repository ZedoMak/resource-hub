// src/components/layout/Navbar.tsx
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Button } from "@/components/ui/button";
import { UserNav } from "./UserNav";

export async function Navbar() {
  // This is a Server Component, so headers() is allowed here
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <Link href="/" className="font-bold tracking-tight text-primary">
            ResourceHub
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          </nav>
        </div>
        
        <div className="flex items-center space-x-2">
          {session ? (
            <UserNav user={session.user} />
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}