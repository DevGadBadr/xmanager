import Link from "next/link";

import { AppLogo } from "@/components/shared/app-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-3">
          <AppLogo imageClassName="h-9 w-auto" />
          <CardTitle>Authentication access is restricted</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-zinc-500 dark:text-zinc-400">
          <p>
            Flow only allows invited or existing workspace emails to authenticate.
          </p>
          <p>
            If you expected access, ask a workspace administrator to invite your email and then reopen the invite link to create your account.
          </p>
          <Button asChild>
            <Link href="/">Return to homepage</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
