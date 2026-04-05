"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { inviteUserAction } from "@/modules/invitations/actions";
import { inviteSchema } from "@/modules/invitations/schemas";
import { initialActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type InviteValues = z.infer<typeof inviteSchema>;

export function InviteUserDialog({
  teams,
}: {
  teams: Array<{ id: string; name: string }>;
}) {
  const [state, formAction, pending] = useActionState(inviteUserAction, initialActionState);
  const form = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "MEMBER",
      teamId: "",
    },
  });

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      form.reset();
    }

    if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [form, state]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Invite user
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a workspace member</DialogTitle>
          <DialogDescription>
            Invitations are locked to the invited email. Users can sign up with email first and optionally link Google later from their profile.
          </DialogDescription>
        </DialogHeader>
        <form
          className="mt-6 space-y-4"
          onSubmit={form.handleSubmit((values) => {
            const payload = new FormData();
            payload.set("email", values.email);
            payload.set("role", values.role);
            if (values.teamId) payload.set("teamId", values.teamId);
            startTransition(() => formAction(payload));
          })}
        >
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input id="invite-email" placeholder="member@example.com" {...form.register("email")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-role">Role</Label>
            <Select id="invite-role" {...form.register("role")}>
              <option value="ADMIN">Admin</option>
              <option value="TEAM_MANAGER">Team Manager</option>
              <option value="MEMBER">Member</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-team">Optional team</Label>
            <Select id="invite-team" {...form.register("teamId")}>
              <option value="">No team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </Select>
          </div>
          <Button className="w-full" disabled={pending} type="submit">
            {pending ? "Sending invite..." : "Send invitation"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
