import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { KeyRound, UserRound } from "lucide-react";

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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-zinc-200/80 bg-gradient-to-br from-white via-zinc-50 to-violet-50/60 p-6 shadow-sm sm:p-8">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">Settings</p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">A cleaner place to manage your account</h1>
          <p className="text-sm leading-6 text-zinc-600 sm:text-base">
            Update your public profile, pick a consistent avatar, and connect AI provider keys without the page feeling heavy or crowded.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-2xl border border-white/80 bg-white/80 px-4 py-4 backdrop-blur">
            <div className="rounded-2xl bg-zinc-900 p-2 text-white">
              <UserRound className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium text-zinc-900">Profile & avatar</p>
              <p className="text-sm text-zinc-500">Upload a photo or choose a generated avatar that stays polished across the app.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-white/80 bg-white/80 px-4 py-4 backdrop-blur">
            <div className="rounded-2xl bg-violet-600 p-2 text-white">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium text-zinc-900">AI keys</p>
              <p className="text-sm text-zinc-500">Bring your own provider key with lighter, easier-to-scan settings controls.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)] xl:items-start">
        <section>
          <ProfileForm user={session.user} />
        </section>

        <section>
          <AIProviderKeysForm />
        </section>
      </div>
    </div>
  );
}
