import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Trophy, ShieldCheck, User, UsersRound } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — ESAG Cricket Auction" },
      { name: "description", content: "Sign in as a player, team manager, or admin." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } => {
    const t = search.tab;
    if (t === "player" || t === "team" || t === "admin") return { tab: t };
    return {};
  },
  component: AuthPage,
});

type Tab = "player" | "team" | "admin";

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [tab, setTab] = useState<Tab>(search.tab ?? "player");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        if (tab === "player" || tab === "team") {
          localStorage.setItem("esag_intent", tab);
        }
        if (!data.session) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
          if (signInErr) throw signInErr;
        }
        toast.success("Account created!");
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (tab === "admin") {
          // Try to claim admin role (server enforces email match).
          const { error: claimErr } = await supabase.rpc("claim_admin_role");
          if (claimErr && !/already/i.test(claimErr.message)) {
            // Not a fatal issue if the user is already admin — but if unauthorized, warn.
            if (/authorized/i.test(claimErr.message)) {
              toast.error("This email is not authorized as admin.");
              await supabase.auth.signOut();
              return;
            }
          }
        }

        if (tab === "player" || tab === "team") {
          localStorage.setItem("esag_intent", tab);
        }
        toast.success("Welcome back!");
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    if (tab === "player" || tab === "team") {
      localStorage.setItem("esag_intent", tab);
    }
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/dashboard",
    });
    if (result.error) toast.error(result.error.message);
  }

  const tabs: { id: Tab; label: string; icon: typeof User; hint: string }[] = [
    { id: "player", label: "Player", icon: User, hint: "Register and fill your cricket profile." },
    { id: "team", label: "Team Manager", icon: UsersRound, hint: "Manage your team and bid for players." },
    { id: "admin", label: "Admin", icon: ShieldCheck, hint: "Run the auction. Restricted access." },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        <div className="rounded-2xl border border-border bg-card/70 p-6 shadow-card backdrop-blur">
          {/* Tabs */}
          <div className="mb-6 grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-col items-center gap-1 rounded-md px-2 py-2 text-xs font-medium transition ${
                  tab === t.id
                    ? "bg-gradient-neon text-primary-foreground shadow-neon-purple"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>
          <p className="mb-4 text-center text-xs text-muted-foreground">{tabs.find((t) => t.id === tab)?.hint}</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <div>
                <label className="mb-1 block text-xs font-medium">Full name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-gradient-neon px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-neon-purple disabled:opacity-60"
            >
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          {tab !== "admin" && (
            <>
             
            </>
          )}

          <p className="mt-4 text-center text-xs text-muted-foreground">
            {mode === "login" ? "Don't have an account? " : "Have an account? "}
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="font-semibold text-neon-blue hover:underline"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>

          {tab === "admin" && (
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Admin access is restricted to the designated ESAG organizer email.
            </p>
          )}
        </div>

        <div className="mt-4 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
