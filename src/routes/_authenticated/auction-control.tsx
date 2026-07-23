import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMyRoles } from "@/lib/use-role";
import { toast } from "sonner";
import { ArrowLeft, Gavel, Play, Pause, SkipForward, CheckCircle2, XCircle, Star, RotateCcw, Radio } from "lucide-react";

export const Route = createFileRoute("/_authenticated/auction-control")({
  head: () => ({ meta: [{ title: "Auction Control — ESAG" }] }),
  component: AdminAuction,
});

function AdminAuction() {
  const { roles, isAdmin } = useMyRoles();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [filter, setFilter] = useState<"available" | "unsold" | "sold" | "pre_assigned">("available");
  const [preFilter, setPreFilter] = useState<"male" | "female">("male");
  const [preTeam, setPreTeam] = useState<string>("");

  useEffect(() => { if (roles && !isAdmin) navigate({ to: "/dashboard" }); }, [roles, isAdmin, navigate]);

  async function loadAll() {
    const [{ data: s }, { data: p }, { data: t }] = await Promise.all([
      supabase.from("auction_settings").select("*").eq("id", 1).maybeSingle(),
      supabase.from("players").select("*").order("category", { nullsFirst: false }).order("skill_level", { ascending: false }),
      supabase.from("teams").select("*").order("team_name"),
    ]);
    setSettings(s); setPlayers(p ?? []); setTeams(t ?? []);
    if (!preTeam && (t ?? []).length) setPreTeam((t as any[])[0].id);
  }

  useEffect(() => {
    if (!isAdmin) return;
    loadAll();
    const ch = supabase
      .channel("admin-auction")
      .on("postgres_changes", { event: "*", schema: "public", table: "auction_settings" }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, () => loadAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAdmin]);

  const currentPlayer = useMemo(
    () => players.find((p) => p.id === settings?.current_player_id) ?? null,
    [players, settings],
  );
  const leadingTeam = useMemo(
    () => teams.find((t) => t.id === settings?.current_bid_team_id) ?? null,
    [teams, settings],
  );
  const filtered = players.filter((p) => p.status === filter);
  const preAvailable = players.filter((p) => p.status === "available" && p.gender === preFilter);

  async function rpc(fn: string, args: any = {}) {
    const { error } = await supabase.rpc(fn as any, args);
    if (error) return toast.error(error.message);
    toast.success("Done");
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Link to="/admin" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Admin
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-neon shadow-neon-purple">
              <Gavel className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Auction control</h1>
              <p className="text-xs text-muted-foreground">
                Round {settings?.auction_round} · {settings?.is_live ? "LIVE" : "Paused"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => rpc("set_auction_live", { _live: !settings?.is_live })}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              {settings?.is_live ? <><Pause className="h-3.5 w-3.5" /> Pause stream</> : <><Play className="h-3.5 w-3.5" /> Go live</>}
            </button>
            <button
              onClick={() => rpc("start_next_round")}
              disabled={(settings?.auction_round ?? 1) >= 3}
              className="inline-flex items-center gap-1 rounded-md bg-gradient-neon px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-neon-purple disabled:opacity-50"
            >
              <SkipForward className="h-3.5 w-3.5" /> Next round
            </button>
            <Link to="/auction" className="inline-flex items-center gap-1 rounded-md border-neon bg-card/60 px-3 py-1.5 text-xs font-semibold hover:shadow-neon-blue">
              <Radio className="h-3.5 w-3.5" /> Open stream view
            </Link>
          </div>
        </div>

        {/* Current player control */}
        <div className="mt-6 rounded-2xl border-neon bg-gradient-neon-soft p-6">
          {currentPlayer ? (
            <div className="grid gap-4 sm:grid-cols-[auto_1fr_auto]">
              <div className="flex items-center gap-3">
                {currentPlayer.photo_url ? (
                  <img src={currentPlayer.photo_url} alt="" className="h-16 w-16 rounded-xl object-cover neon-ring" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-neon">
                    <Star className="h-6 w-6 text-primary-foreground" />
                  </div>
                )}
                <div>
                  <div className="text-lg font-bold glow-text">{currentPlayer.full_name}</div>
                  <div className="text-xs capitalize text-muted-foreground">
                    Cat {currentPlayer.category} · {currentPlayer.primary_role?.replace("_", " ")} · base {currentPlayer.base_price}M
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card/60 p-3">
                <div className="text-xs text-muted-foreground">Highest bid</div>
                <div className="text-2xl font-bold">{settings?.current_bid != null ? `${settings.current_bid}M` : "—"}</div>
                <div className="text-xs text-muted-foreground">{leadingTeam ? `Leading: ${leadingTeam.team_name}` : "No bids"}</div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => rpc("sell_current_player")}
                  disabled={!settings?.current_bid}
                  className="inline-flex items-center justify-center gap-1 rounded-md bg-gradient-neon px-3 py-2 text-xs font-bold text-primary-foreground shadow-neon-purple disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" /> Sell
                </button>
                <button
                  onClick={() => rpc("mark_current_unsold")}
                  className="inline-flex items-center justify-center gap-1 rounded-md border border-border bg-card/60 px-3 py-2 text-xs font-semibold hover:bg-muted"
                >
                  <XCircle className="h-4 w-4" /> Mark unsold
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No player on the block. Pick one from the queue below.</p>
          )}
        </div>

        {/* Pre-assigned round */}
        <div className="mt-6 rounded-2xl border border-border bg-card/60 p-5">
          <h3 className="text-sm font-semibold text-neon-blue">Pre-assigned round</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Give each team one girl and one boy at no cost before the auction opens.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-[10px] uppercase text-muted-foreground">Gender</label>
              <select
                value={preFilter}
                onChange={(e) => setPreFilter(e.target.value as any)}
                className="rounded-md border border-border bg-input px-3 py-2 text-sm"
              >
                <option value="male">Boys</option>
                <option value="female">Girls</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase text-muted-foreground">Assign to team</label>
              <select
                value={preTeam}
                onChange={(e) => setPreTeam(e.target.value)}
                className="rounded-md border border-border bg-input px-3 py-2 text-sm"
              >
                {teams.map((t) => <option key={t.id} value={t.id}>{t.team_name}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {preAvailable.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
                <div>
                  <div className="font-semibold">{p.full_name}</div>
                  <div className="text-muted-foreground">Cat {p.category} · skill {p.skill_level}</div>
                </div>
                <button
                  onClick={() => rpc("pre_assign_player", { _player_id: p.id, _team_id: preTeam })}
                  disabled={!preTeam}
                  className="rounded-md bg-gradient-neon px-2 py-1 text-[10px] font-bold text-primary-foreground disabled:opacity-50"
                >
                  Assign
                </button>
              </div>
            ))}
            {preAvailable.length === 0 && (
              <p className="text-xs text-muted-foreground">No available players for this gender.</p>
            )}
          </div>
        </div>

        {/* Player queue */}
        <div className="mt-6">
          <div className="mb-2 inline-flex gap-1 rounded-lg bg-muted p-1">
            {(["available", "unsold", "sold", "pre_assigned"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`rounded-md px-3 py-1 text-xs font-semibold capitalize transition ${
                  filter === t ? "bg-gradient-neon text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.replace("_", " ")} ({players.filter((p) => p.status === t).length})
              </button>
            ))}
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card/60">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3">Cat</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Base</th>
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => {
                  const team = teams.find((t) => t.id === p.sold_to_team_id);
                  return (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2">{p.full_name}</td>
                      <td className="px-4 py-2">{p.category}</td>
                      <td className="px-4 py-2 text-xs capitalize">{p.primary_role?.replace("_", " ")}</td>
                      <td className="px-4 py-2">{p.base_price}M</td>
                      <td className="px-4 py-2 text-xs">
                        {team ? `${team.team_name}${p.sold_price != null ? ` · ${p.sold_price}M` : ""}` : "—"}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-1">
                          {filter === "available" && (
                            <button
                              onClick={() => rpc("set_current_player", { _player_id: p.id })}
                              className="rounded-md bg-gradient-neon px-2 py-1 text-[10px] font-bold text-primary-foreground shadow-neon-purple"
                            >
                              Put on block
                            </button>
                          )}
                          {(filter === "sold" || filter === "pre_assigned") && (
                            <button
                              onClick={() => rpc("reset_player_assignment", { _player_id: p.id })}
                              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] hover:bg-muted"
                            >
                              <RotateCcw className="h-3 w-3" /> Reset
                            </button>
                          )}
                          {filter === "unsold" && (
                            <button
                              onClick={() => rpc("set_current_player", { _player_id: p.id })}
                              className="rounded-md border-neon bg-card/60 px-2 py-1 text-[10px] font-semibold hover:shadow-neon-blue"
                            >
                              Re-auction
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nothing here.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
