"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { initialActionState } from "@/lib/action-state";
import { createTeamAction } from "@/modules/teams/actions";
import { teamSchema } from "@/modules/teams/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type TeamValues = z.infer<typeof teamSchema>;

export function TeamForm({
  memberships,
  className,
  title = "Create team",
  onSuccess,
}: {
  memberships: Array<{ id: string; user: { fullName: string | null; email: string } }>;
  className?: string;
  title?: string;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(createTeamAction, initialActionState);
  const form = useForm<TeamValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      description: "",
      managerMembershipId: "",
    },
  });

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      form.reset();
      onSuccess?.();
    }

    if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [form, onSuccess, state]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-3.5"
          onSubmit={form.handleSubmit((values) => {
            const payload = new FormData();
            payload.set("name", values.name);
            payload.set("description", values.description ?? "");
            if (values.managerMembershipId) payload.set("managerMembershipId", values.managerMembershipId);
            startTransition(() => formAction(payload));
          })}
        >
          <div className="space-y-2">
            <Label htmlFor="team-name">Team name</Label>
            <Input id="team-name" {...form.register("name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="team-description">Description</Label>
            <Textarea id="team-description" rows={4} {...form.register("description")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="team-manager">Manager</Label>
            <Select id="team-manager" {...form.register("managerMembershipId")}>
              <option value="">No manager</option>
              {memberships.map((membership) => (
                <option key={membership.id} value={membership.id}>
                  {membership.user.fullName ?? membership.user.email}
                </option>
              ))}
            </Select>
          </div>
          <Button className="w-full" disabled={pending} type="submit">
            {pending ? "Creating..." : "Create team"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
