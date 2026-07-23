import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Gavel, Sparkles, Trophy, Users, UsersRound, Wallet, Radio } from "lucide-react";

export const Route = createFileRoute("/_authenticated/auction")({
  head: () => ({ meta: [{ title: "Live Auction — ESAG" }] }),
  component: AuctionPage,
});

type Settings = {
  id: number;
  is_live: boolean;
  auction_round: number;
  current_player_id: string | null;
  current_bid: number | null;
  current_bid_team_id: string | null;
  bid_increment: number;
  players_per_team: number;
  team_budget: number;
};
type Player = any;
type Team = any;

function AuctionPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [uid, setUid] = useState<string | null>(null);
  const [customBid, setCustomBid] = useState<string>("");
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null));
  }, []);

  async function loadAll() {
    const [{ data: s }, { data: t }, { data: p }] = await Promise.all([
      supabase.from("auction_settings").select("*").eq("id", 1).maybeSingle(),
      supabase.from("teams").select("*").order("team_name"),
      supabase.from("players").select("*"),
    ]);
    setSettings(s as any);
    setTeams(t ?? []);
    setPlayers(p ?? []);
  }

  useEffect(() => {
    loadAll();
    const ch = supabase
      .channel("auction-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "auction_settings" }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "bids" }, () => loadAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    (async () => {
      if (!settings?.current_player_id) { setPlayer(null); return; }
      const { data } = await supabase.from("players").select("*").eq("id", settings.current_player_id).maybeSingle();
      setPlayer(data);
      setCustomBid("");
    })();
  }, [settings?.current_player_id]);

  const myTeam = useMemo(() => teams.find((t) => t.manager_id === uid) ?? null, [teams, uid]);
  const mySquad = useMemo(
    () => (myTeam ? players.filter((p) => p.sold_to_team_id === myTeam.id) : []),
    [players, myTeam],
  );
  const battingStrength = useMemo(
    () => squadStrength(mySquad, "batting"),
    [mySquad],
  );
  const bowlingStrength = useMemo(
    () => squadStrength(mySquad, "bowling"),
    [mySquad],
  );

  const leadingTeam = teams.find((t) => t.id === settings?.current_bid_team_id);
  const minNext = settings
    ? settings.current_bid == null
      ? Number(player?.base_price ?? 0)
      : Number(settings.current_bid) + Number(settings.bid_increment)
    : 0;

  async function quickBid() {
    await placeBid(minNext);
  }
  async function customBidSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = parseFloat(customBid);
    if (!Number.isFinite(v)) return toast.error("Enter a valid amount");
    await placeBid(v);
  }
  async function placeBid(amount: number) {
    setPlacing(true);
    const { error } = await supabase.rpc("place_bid", { _amount: amount });
    setPlacing(false);
    if (error) return toast.error(error.message);
    toast.success(`Bid placed: ${amount}M`);
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-neon shadow-neon-purple">
              <Gavel className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold glow-text">Live auction</h1>
              <p className="text-xs text-muted-foreground">
                Round {settings?.auction_round ?? 1} · {settings?.is_live ? "LIVE" : "Paused"}
              </p>
            </div>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${settings?.is_live ? "bg-neon-blue/20 text-neon-blue" : "bg-muted text-muted-foreground"}`}>
            <Radio className={`h-3 w-3 ${settings?.is_live ? "animate-pulse" : ""}`} /> {settings?.is_live ? "Streaming" : "Off air"}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Player card */}
          <div className="lg:col-span-2">
            {player ? (
              <div className="rounded-2xl border-neon bg-gradient-neon-soft p-6">
                <div className="flex flex-col gap-6 sm:flex-row">
                  {player.photo_url ? (
                    <img src={player.photo_url} alt="" className="h-40 w-40 rounded-2xl object-cover neon-ring" />
                  ) : (
                    <div className="flex h-40 w-40 items-center justify-center rounded-2xl bg-gradient-neon shadow-neon-purple">
                      <Users className="h-16 w-16 text-primary-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-2xl font-bold glow-text">{player.full_name}</h2>
                        <p className="text-xs capitalize text-muted-foreground">
                          {player.primary_role?.replace("_", " ")} · {player.gender} · age {player.age}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${catCls(player.category)}`}>
                        Cat {player.category ?? "-"}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <Stat label="Skill" value={player.skill_level} />
                      <Stat label="Fitness" value={player.fitness_level} />
                      <Stat label="Base" value={`${player.base_price}M`} />
                    </div>
                    {player.ai_summary && (
                      <div className="mt-3 rounded-lg border border-border bg-card/50 p-2 text-xs">
                        <span className="mr-1 inline-flex items-center gap-1 text-neon-blue">
                          <Sparkles className="h-3 w-3" /> AI
                        </span>
                        {player.ai_summary}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bid area */}
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-card/60 p-4">
                    <div className="text-xs text-muted-foreground">Current highest bid</div>
                    <div className="mt-1 text-3xl font-bold glow-text">
                      {settings?.current_bid != null ? `${settings.current_bid}M` : "—"}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {leadingTeam ? `Leading: ${leadingTeam.team_name}` : "No bids yet"}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-card/60 p-4">
                    <div className="text-xs text-muted-foreground">Minimum next bid</div>
                    <div className="mt-1 text-3xl font-bold text-neon-blue">{minNext}M</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Increment {settings?.bid_increment}M
                    </div>
                  </div>
                </div>

                {myTeam ? (
                  <div className="mt-4 flex flex-wrap items-end gap-3">
                    <button
                      onClick={quickBid}
                      disabled={placing || !settings?.is_live}
                      className="rounded-md bg-gradient-neon px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-neon-purple disabled:opacity-60"
                    >
                      Bid {minNext}M
                    </button>
                    <form onSubmit={customBidSubmit} className="flex items-end gap-2">
                      <div>
                        <label className="mb-1 block text-[10px] uppercase text-muted-foreground">Custom bid (M)</label>
                        <input
                          type="number"
                          step="0.1"
                          min={minNext}
                          value={customBid}
                          onChange={(e) => setCustomBid(e.target.value)}
                          className="w-32 rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                          placeholder={`≥ ${minNext}`}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={placing || !customBid || !settings?.is_live}
                        className="rounded-md border-neon bg-card/60 px-4 py-2 text-sm font-semibold hover:shadow-neon-blue disabled:opacity-60"
                      >
                        Custom bid
                      </button>
                    </form>
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-muted-foreground">Register a team to place bids.</p>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
                <Gavel className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Waiting for the admin to put the next player on the block…
                </p>
              </div>
            )}
          </div>

          {/* My team panel */}
          <div className="space-y-4">
            {myTeam ? (
              <div className="rounded-2xl border border-border bg-card/60 p-5">
                <div className="flex items-center gap-3">
                  {myTeam.logo_url ? (
                    <img src={myTeam.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover neon-ring" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-neon">
                      <UsersRound className="h-5 w-5 text-primary-foreground" />
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-bold">{myTeam.team_name}</div>
                    <div className="text-xs text-muted-foreground">{myTeam.manager_name}</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-lg border border-border bg-muted/30 p-2">
                    <div className="text-[10px] uppercase text-muted-foreground">Budget</div>
                    <div className="flex items-center justify-center gap-1 text-lg font-bold">
                      <Wallet className="h-4 w-4 text-neon-blue" /> {myTeam.budget_remaining}M
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-2">
                    <div className="text-[10px] uppercase text-muted-foreground">Squad</div>
                    <div className="text-lg font-bold">
                      {mySquad.length}/{settings?.players_per_team ?? 0}
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                  <Meter label="Batting" value={battingStrength} />
                  <Meter label="Bowling" value={bowlingStrength} />
                </div>

                <div className="mt-4">
                  <div className="mb-2 text-xs font-semibold text-muted-foreground">Your squad</div>
                  <div className="space-y-1">
                    {mySquad.length === 0 && (
                      <p className="text-xs text-muted-foreground">No players yet.</p>
                    )}
                    {mySquad.map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-md border border-border bg-card/40 px-2 py-1.5 text-xs">
                        <span className="truncate">{p.full_name}</span>
                        <span className="text-muted-foreground">
                          {p.sold_price != null ? `${p.sold_price}M` : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card/60 p-5 text-sm text-muted-foreground">
                You're spectating. <Link to="/team-registration" className="text-neon-blue underline">Register a team</Link> to bid.
              </div>
            )}

            {/* All teams ticker */}
            <div className="rounded-2xl border border-border bg-card/60 p-5">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Trophy className="h-3.5 w-3.5 text-neon-blue" /> All teams
              </div>
              <div className="space-y-1.5">
                {teams.map((t) => {
                  const count = players.filter((p) => p.sold_to_team_id === t.id).length;
                  return (
                    <div key={t.id} className="flex items-center justify-between rounded-md bg-muted/30 px-2 py-1.5 text-xs">
                      <span className="truncate font-medium">{t.team_name}</span>
                      <span className="text-muted-foreground">
                        {t.budget_remaining}M · {count}/{settings?.players_per_team}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function catCls(c: string | null) {
  if (c === "A") return "bg-gradient-neon text-primary-foreground shadow-neon-purple";
  if (c === "B") return "bg-accent/20 text-accent";
  if (c === "C") return "bg-muted text-muted-foreground";
  return "bg-muted text-muted-foreground";
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card/40 p-2">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="text-base font-bold">{value}</div>
    </div>
  );
}
function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-2">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="text-base font-bold text-neon-blue">{Math.round(value)}</div>
    </div>
  );
}

function squadStrength(squad: any[], kind: "batting" | "bowling") {
  const rel = squad.filter((p) =>
    kind === "batting"
      ? ["batsman", "all_rounder", "wicket_keeper"].includes(p.primary_role)
      : ["bowler", "all_rounder"].includes(p.primary_role),
  );
  if (rel.length === 0) return 0;
  const avg = rel.reduce((s, p) => s + (p.skill_level ?? 0), 0) / rel.length;
  return avg;
}
