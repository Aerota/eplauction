import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, UsersRound } from "lucide-react";

export const Route = createFileRoute("/_authenticated/team-registration")({
  head: () => ({ meta: [{ title: "Team Registration — ESAG Auction" }] }),
  component: TeamReg,
});

function TeamReg() {
  const navigate = useNavigate();
  const [existing, setExisting] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ team_name: "", manager_name: "", logo_url: "" });

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("teams")
        .select("*")
        .eq("manager_id", u.user.id)
        .maybeSingle();
      if (data) setExisting(data);
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");

      const { data: settings } = await supabase
        .from("auction_settings")
        .select("team_budget")
        .eq("id", 1)
        .maybeSingle();

      const { error } = await supabase.from("teams").insert({
        manager_id: u.user.id,
        manager_name: form.manager_name,
        team_name: form.team_name,
        logo_url: form.logo_url || null,
        budget_remaining: settings?.team_budget ?? 100,
      });
      if (error) throw error;

      // Assign team_manager role
      await supabase.from("user_roles").insert({ user_id: u.user.id, role: "team_manager" });

      toast.success("Team registered!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to register team");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Link to="/dashboard" className="mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
        </Link>

        {existing ? (
          <div>
            <h1 className="text-2xl font-bold">Your team</h1>
            <div className="mt-6 rounded-2xl border-neon bg-gradient-neon-soft p-6">
              <div className="flex items-center gap-4">
                {existing.logo_url ? (
                  <img src={existing.logo_url} alt="" className="h-16 w-16 rounded-xl object-cover neon-ring" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-neon shadow-neon-purple">
                    <UsersRound className="h-8 w-8 text-primary-foreground" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold glow-text">{existing.team_name}</h2>
                  <p className="text-sm text-muted-foreground">Manager: {existing.manager_name}</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-card/60 p-4">
                  <div className="text-xs text-muted-foreground">Budget remaining</div>
                  <div className="mt-1 text-2xl font-bold">{existing.budget_remaining}M</div>
                </div>
                <div className="rounded-lg border border-border bg-card/60 p-4">
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div className="mt-1 text-sm font-medium text-neon-blue">Waiting for auction</div>
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Live auction dashboard is coming in phase 2. You'll see the current player, the highest bid, and be able to bid from here.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Register your team</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Set up your team so you can bid live in the auction.
            </p>
            <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-border bg-card/60 p-6">
              <div>
                <label className="mb-1 block text-xs font-medium">Team name</label>
                <input
                  required
                  value={form.team_name}
                  onChange={(e) => setForm({ ...form, team_name: e.target.value })}
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Team manager name</label>
                <input
                  required
                  value={form.manager_name}
                  onChange={(e) => setForm({ ...form, manager_name: e.target.value })}
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Logo URL</label>
                <input
                  type="url"
                  placeholder="https://…"
                  value={form.logo_url}
                  onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-gradient-neon px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-neon-purple disabled:opacity-60"
              >
                {loading ? "Registering…" : "Create team"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
