import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/profile/ProfileForm";
import { AIProviderKeysForm } from "@/components/settings/AIProviderKeysForm";
import { auth } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-3">Account Settings</h1>
        <p className="text-lg text-muted-foreground">Manage your profile details, AI provider keys, and personal preferences.</p>
      </div>

      <div className="space-y-8">
        <section className="rounded-[2.5rem] border bg-white dark:bg-zinc-950 p-8 md:p-12 shadow-sm">
          <ProfileForm user={session.user} />
        </section>

        <section className="rounded-[2.5rem] border bg-white dark:bg-zinc-950 p-8 md:p-12 shadow-sm">
          <AIProviderKeysForm />
        </section>
      </div>
    </div>
  );
}
