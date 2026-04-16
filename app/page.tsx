import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, FolderKanban, MessageSquare, Users } from "lucide-react";

import { AppLogo } from "@/components/shared/app-logo";
import { SignInButton } from "@/components/shared/sign-in-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentMembership } from "@/modules/auth/server";

export const dynamic = "force-dynamic";

const highlights = [
  {
    title: "One shared picture",
    description: "Projects, tasks, comments, and deadlines stay in one place instead of being split across chats and spreadsheets.",
  },
  {
    title: "Clear ownership",
    description: "Everyone can see who is carrying the next step, what needs attention, and where progress has slowed down.",
  },
  {
    title: "Team memory intact",
    description: "Updates stay attached to the work, so context is still there when someone joins mid-project or picks work back up later.",
  },
];

const featureCards = [
  {
    icon: FolderKanban,
    title: "Projects with context",
    description: "Keep briefs, task lists, ownership, and the running story of the work together so teams do not lose the thread.",
  },
  {
    icon: Users,
    title: "A workspace people can trust",
    description: "Team structure, responsibilities, and day-to-day visibility are clear enough that follow-up feels straightforward instead of political.",
  },
  {
    icon: MessageSquare,
    title: "Updates where they belong",
    description: "Comments, activity, and notifications sit beside the task or project itself, which cuts down on status chasing.",
  },
];

export default async function Home() {
  const membership = await getCurrentMembership();
  const currentYear = new Date().getFullYear();

  if (membership) {
    redirect("/dashboard");
  }

  return (
    <main className="relative isolate mx-auto flex min-h-screen w-full max-w-7xl flex-col overflow-hidden px-6 py-8 lg:px-10">
      <div aria-hidden="true" className="landing-aurora landing-aurora-left" />
      <div aria-hidden="true" className="landing-aurora landing-aurora-right" />

      <header className="landing-reveal landing-delay-1 flex items-center justify-between rounded-[28px] border border-white/65 bg-white/80 px-5 py-4 shadow-[0_24px_70px_-38px_rgba(15,23,42,0.45)] backdrop-blur dark:border-white/10 dark:bg-zinc-950/75">
        <div className="space-y-2">
          <AppLogo imageClassName="h-8 w-auto" priority />
          <h1 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            X-Labs Technology Management
          </h1>
        </div>
        <SignInButton label="Enter workspace" />
      </header>

      <section className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.06fr_0.94fr] lg:py-18">
        <div className="space-y-8">
          <div className="space-y-6">
            <p className="landing-reveal landing-delay-1 inline-flex rounded-full border border-sky-200/80 bg-white/85 px-4 py-2 text-sm font-medium text-sky-700 shadow-sm dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200">
              Built for X-Labs teams that need a clean view of what is moving and what needs attention
            </p>

            <div className="space-y-4">
              <h2 className="landing-reveal landing-delay-2 max-w-3xl text-5xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-6xl dark:text-zinc-50">
                A steadier way to run projects, follow tasks, and keep accountability visible.
              </h2>
              <p className="landing-reveal landing-delay-3 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
                Flow gives operational teams one workspace for project structure, task ownership, comments, deadlines,
                and activity so people spend less time asking for updates and more time moving work forward.
              </p>
            </div>
          </div>

          <div className="landing-reveal landing-delay-4 flex flex-wrap gap-4">
            <SignInButton label="Enter workspace" />
            <Button asChild size="lg" variant="outline">
              <Link href="#inside-flow">
                See how it feels
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {highlights.map((item, index) => (
              <Card
                className={`landing-reveal landing-delay-${index + 3} rounded-[24px] border-white/70 bg-white/78 shadow-[0_20px_55px_-42px_rgba(15,23,42,0.55)] backdrop-blur dark:border-white/10 dark:bg-zinc-950/75`}
                key={item.title}
              >
                <CardContent className="space-y-3 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">{item.title}</h3>
                    <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="landing-reveal landing-delay-3 overflow-hidden rounded-[32px] border border-white/70 bg-white/82 shadow-[0_32px_90px_-46px_rgba(15,23,42,0.58)] backdrop-blur dark:border-white/10 dark:bg-zinc-950/80">
          <CardContent className="space-y-6 p-0">
            <div className="border-b border-zinc-200/80 px-7 py-6 dark:border-zinc-800/80">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600 dark:text-sky-300">
                Inside the workspace
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                What people open when the work needs a clear owner
              </h3>
              <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                The layout is meant to answer the practical questions quickly: what is active, who owns the next
                step, what changed, and where the conversation belongs.
              </p>
            </div>

            <div className="space-y-4 px-7 pb-7">
              <div className="landing-panel rounded-[24px] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Projects in motion</p>
                    <p className="mt-1 text-xl font-semibold text-zinc-950 dark:text-zinc-50">North hub rollout</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                    On track
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/78 p-4 dark:bg-zinc-900/80">
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">Assigned next</p>
                    <p className="mt-2 font-medium text-zinc-950 dark:text-zinc-50">Finalize handover notes</p>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Owner: Salma Hassan</p>
                  </div>
                  <div className="rounded-2xl bg-white/78 p-4 dark:bg-zinc-900/80">
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">Needs attention</p>
                    <p className="mt-2 font-medium text-zinc-950 dark:text-zinc-50">Pending client approval</p>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Due follow-up today</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
                <div className="landing-panel rounded-[24px] p-5">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">This week</p>
                  <ul className="mt-4 space-y-3">
                    {[
                      "7 open tasks already assigned",
                      "2 blockers raised before the deadline slipped",
                      "1 project update shared with the full team",
                    ].map((item) => (
                      <li className="flex items-start gap-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300" key={item}>
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-500 dark:bg-sky-300" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="landing-panel rounded-[24px] p-5">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Recent activity</p>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl bg-white/78 p-4 dark:bg-zinc-900/80">
                      <p className="font-medium text-zinc-950 dark:text-zinc-50">
                        “Timeline updated after procurement call.”
                      </p>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        Comment saved directly on the project for everyone following the work.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/78 p-4 dark:bg-zinc-900/80">
                      <p className="font-medium text-zinc-950 dark:text-zinc-50">A delayed task is visible immediately.</p>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        The conversation stays beside the task instead of disappearing into chat.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 pb-12 lg:grid-cols-[0.92fr_1.08fr]" id="inside-flow">
        <Card className="landing-reveal landing-delay-2 rounded-[30px] border-white/70 bg-[linear-gradient(145deg,rgba(14,165,233,0.13),rgba(255,255,255,0.9))] shadow-[0_26px_70px_-40px_rgba(15,23,42,0.52)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(14,165,233,0.18),rgba(9,12,18,0.92))]">
          <CardContent className="space-y-5 p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700 dark:text-sky-300">
              Why it feels different
            </p>
            <h3 className="max-w-xl text-3xl font-semibold tracking-[-0.03em] text-zinc-950 dark:text-zinc-50">
              Flow is built for the working day, not for sounding impressive in a pitch.
            </h3>
            <div className="space-y-4 text-base leading-7 text-zinc-700 dark:text-zinc-300">
              <p>
                Teams need a place where priorities are visible, owners are obvious, and project history does not need
                to be reconstructed from chat threads.
              </p>
              <p>
                That is the job of this platform: give invited people the right workspace, keep the flow of work clear,
                and make follow-up easier because the context is already where the work is happening.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {featureCards.map((item, index) => (
            <Card
              className={`landing-reveal landing-delay-${index + 3} rounded-[28px] border-white/70 bg-white/80 shadow-[0_22px_60px_-40px_rgba(15,23,42,0.55)] backdrop-blur dark:border-white/10 dark:bg-zinc-950/78`}
              key={item.title}
            >
              <CardContent className="space-y-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">{item.title}</h3>
                  <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="pb-4 text-center text-xs font-light tracking-wide text-zinc-500 dark:text-zinc-400">
        XLABS Technology | Managed by Eng. Ibrahim Mobarak | Dev Gad Badr | {currentYear}
      </footer>
    </main>
  );
}
