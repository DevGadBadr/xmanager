import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, ShieldCheck, Users } from "lucide-react";

import { SignInButton } from "@/components/shared/sign-in-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentMembership } from "@/modules/auth/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const membership = await getCurrentMembership();
  const currentYear = new Date().getFullYear();

  if (membership) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10">
      <header className="flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-white/70 px-5 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-indigo-500">x-wrike</p>
          <h1 className="mt-1 text-lg font-semibold">Work coordination for delivery teams</h1>
        </div>
        <SignInButton />
      </header>

      <section className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          <div className="space-y-5">
            <p className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
              Invite-only onboarding • Email-first • Google-optional
            </p>
            <h2 className="max-w-3xl text-5xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Keep teams, projects, tasks, and accountability in one controlled workspace.
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              x-wrike is a lightweight Wrike-style platform for operational teams that need structured invites,
              role-based access, project visibility, assignment notifications, and activity tracking without a heavy setup.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <SignInButton />
            <Button asChild variant="outline">
              <Link href="/auth/error">
                Auth flow details
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Strict invites",
                description: "Email-bound acceptance with password setup, mandatory profile completion, and optional same-email Google login.",
              },
              {
                icon: Users,
                title: "Team structure",
                description: "Workspace members, teams, roles, and assignment-aware delivery views.",
              },
              {
                icon: CheckCircle2,
                title: "Execution tracking",
                description: "Projects, tasks, comments, activity logs, and in-app + email notifications.",
              },
            ].map((item) => (
              <Card key={item.title}>
                <CardContent className="space-y-3 p-5">
                  <div className="w-fit rounded-xl bg-indigo-100 p-3 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-medium text-zinc-950 dark:text-zinc-50">{item.title}</h3>
                    <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="overflow-hidden border-indigo-100 dark:border-indigo-500/20">
          <CardContent className="space-y-5 p-8">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.22em] text-indigo-500">Core modules</p>
              <h3 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">Built for operational clarity</h3>
            </div>
            <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
              <p>Left navigation, project hierarchy, task ownership, and notification surfaces are ready from day one.</p>
              <p>The architecture is modular so Gantt charts, dashboards, automation, file attachments, and time tracking can be added without rewriting the core models.</p>
              <p>Access is restricted to seeded workspace members or users with valid invites. There is no anonymous signup path.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <footer className="pb-4 text-center text-xs font-light tracking-wide text-zinc-500 dark:text-zinc-400">
        Dev Gad Badr | XLABS Technology | Managed by Eng. Ibrahim Mobarak | {currentYear}
      </footer>
    </main>
  );
}
