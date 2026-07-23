import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMyRoles } from "@/lib/use-role";
import { LogOut, Trophy, User, UsersRound, ShieldCheck, Gavel, Radio } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ESAG Auction" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { roles, userId, email, isAdmin } = useMyRoles();
  const [hasPlayer, setHasPlayer] = useState<boolean | null>(null);
  const [hasTeam, setHasTeam] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const [{ count: pc }, { count: tc }] = await Promise.all([
        supabase.from("players").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("teams").select("id", { count: "exact", head: true }).eq("manager_id", userId),
      ]);
      setHasPlayer((pc ?? 0) > 0);
      setHasTeam((tc ?? 0) > 0);
    })();
  }, [userId]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60 bg-card/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-neon shadow-neon-purple">
              <Trophy className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold">ESAG Auction</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">{email}</span>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome<span className="text-muted-foreground">.</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose what you'd like to do.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isAdmin && (
            <ActionCard
              to="/admin"
              icon={ShieldCheck}
              title="Admin console"
              body="Manage players, teams, and settings."
              primary
            />
          )}
          {isAdmin && (
            <ActionCard
              to="/auction-control"
              icon={Gavel}
              title="Auction control"
              body="Run the live auction, sell players, manage rounds."
              primary
            />
          )}
          <ActionCard
            to="/auction"
            icon={Radio}
            title="Live auction"
            body="Watch the stream and bid on players in real time."
          />
          <ActionCard
            to="/player-registration"
            icon={User}
            title={hasPlayer ? "View player profile" : "Register as player"}
            body={hasPlayer ? "You've registered as a player." : "Fill your profile and get AI-graded."}
          />
          <ActionCard
            to="/team-registration"
            icon={UsersRound}
            title={hasTeam ? "Manage your team" : "Register a team"}
            body={hasTeam ? "Manage your squad and bid live." : "Create your team with a name and logo."}
          />
        </div>

        {roles && roles.length === 0 && (
          <div className="mt-8 rounded-lg border border-border bg-card/60 p-4 text-sm text-muted-foreground">
            Tip: register as a player or a team manager to get started.
          </div>
        )}
      </main>
    </div>
  );
}

function ActionCard({
  to,
  icon: Icon,
  title,
  body,
  primary,
}: {
  to: string;
  icon: typeof Trophy;
  title: string;
  body: string;
  primary?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`group rounded-2xl border border-border bg-card/60 p-6 shadow-card backdrop-blur transition hover:border-transparent hover:shadow-neon-purple ${
        primary ? "border-neon" : ""
      }`}
    >
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-neon-soft">
        <Icon className="h-5 w-5 text-neon-blue" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </Link>
  );
}
