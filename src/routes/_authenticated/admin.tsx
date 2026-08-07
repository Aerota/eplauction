import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMyRoles } from "@/lib/use-role";
import { toast } from "sonner";
import { MatchesAdmin } from "@/components/admin/MatchesAdmin";
import { SponsorsAdmin } from "@/components/admin/SponsorsAdmin";
import { ArrowLeft, ShieldCheck, Trash2, Users, UsersRound, X, Sparkles, Pencil } from "lucide-react";
import { ImageField } from "@/components/ImageField";


export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin Console — ESAG Auction" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { roles, isAdmin } = useMyRoles();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [detail, setDetail] = useState<{ kind: "player" | "team"; data: any } | null>(null);
  const [editTeam, setEditTeam] = useState<any | null>(null);
  const [tab, setTab] = useState<"players" | "teams" | "matches" | "sponsors" | "settings">("players");

  useEffect(() => {
    if (roles && !isAdmin) navigate({ to: "/dashboard" });
  }, [roles, isAdmin, navigate]);

  async function refresh() {
    const [{ data: p }, { data: t }, { data: s }] = await Promise.all([
      supabase.from("players").select("*").order("created_at", { ascending: false }),
      supabase.from("teams").select("*").order("created_at", { ascending: false }),
      supabase.from("auction_settings").select("*").eq("id", 1).maybeSingle(),
    ]);
    setPlayers(p ?? []);
    setTeams(t ?? []);
    setSettings(s);
  }

  useEffect(() => {
    if (isAdmin) refresh();
  }, [isAdmin]);

  async function deletePlayer(id: string, name: string) {
    if (!confirm(`Delete player "${name}"?`)) return;
    const { error } = await supabase.from("players").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Player deleted");
    refresh();
  }
  async function deleteTeam(id: string, name: string) {
    if (!confirm(`Delete team "${name}"?`)) return;
    const { error } = await supabase.from("teams").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Team deleted");
    refresh();
  }

  async function saveTeam(id: string, values: { team_name: string; manager_name: string; logo_url: string | null; budget_remaining: number }) {
    const { error } = await supabase.from("teams").update(values).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Team updated");
    setEditTeam(null);
    refresh();
  }

  async function saveSettings(next: Partial<typeof settings>) {
    const { error } = await supabase
      .from("auction_settings")
      .update({ ...next, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) return toast.error(error.message);
    toast.success("Settings saved");
    refresh();
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-neon shadow-neon-purple">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin console</h1>
            <p className="text-xs text-muted-foreground">Full control of the ESAG auction</p>
          </div>
          </div>
          <Link
            to="/auction-control"
            className="ml-auto rounded-md bg-gradient-neon px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-neon-purple"
          >
            Open auction control →
          </Link>

        {/* Tabs */}
        <div className="mt-6 inline-flex gap-1 rounded-lg bg-muted p-1">
          {(["players", "teams", "matches", "sponsors", "settings"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-4 py-1.5 text-xs font-semibold capitalize transition ${
                tab === t ? "bg-gradient-neon text-primary-foreground shadow-neon-purple" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "players" && (
          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-neon-blue" />
              <span className="font-semibold">Registered players ({players.length})</span>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-card/60">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Player</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Skill</th>
                    <th className="px-4 py-3">Fitness</th>
                    <th className="px-4 py-3">Base</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {players.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => setDetail({ kind: "player", data: p })}
                      className="cursor-pointer hover:bg-muted/30"
                    >
                      <td className="flex items-center gap-3 px-4 py-3">
                        {p.photo_url ? (
                          <img src={p.photo_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-neon text-xs font-bold text-primary-foreground">
                            {p.full_name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{p.full_name}</div>
                          <div className="text-xs text-muted-foreground">{p.gender} · age {p.age}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 capitalize">{p.primary_role.replace("_", " ")}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${catCls(p.category)}`}>{p.category ?? "-"}</span>
                      </td>
                      <td className="px-4 py-3">{p.skill_level}</td>
                      <td className="px-4 py-3">{p.fitness_level}</td>
                      <td className="px-4 py-3">{p.base_price}M</td>
                      <td className="px-4 py-3 text-xs capitalize text-muted-foreground">{p.status}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); deletePlayer(p.id, p.full_name); }}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {players.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No players yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "teams" && (
          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2 text-sm">
              <UsersRound className="h-4 w-4 text-neon-blue" />
              <span className="font-semibold">Registered teams ({teams.length})</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teams.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setDetail({ kind: "team", data: t })}
                  className="cursor-pointer rounded-2xl border border-border bg-card/60 p-5 backdrop-blur transition hover:border-transparent hover:shadow-neon-purple"
                >
                  <div className="flex items-center gap-3">
                    {t.logo_url ? (
                      <img src={t.logo_url} alt="" className="h-12 w-12 rounded-lg object-cover " />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-neon ">
                        <UsersRound className="h-6 w-6 text-primary-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-semibold">{t.team_name}</div>
                      <div className="text-xs text-muted-foreground">Mgr: {t.manager_name}</div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditTeam(t); }}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={`Edit ${t.team_name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteTeam(t.id, t.team_name); }}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-4 rounded-lg bg-muted/40 p-3">
                    <div className="text-xs text-muted-foreground">Budget</div>
                    <div className="text-lg font-bold">{t.budget_remaining}M</div>
                  </div>
                </div>
              ))}
              {teams.length === 0 && (
                <div className="col-span-full rounded-2xl border border-border bg-card/60 p-8 text-center text-sm text-muted-foreground">
                  No teams registered yet.
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "matches" && <MatchesAdmin />}

        {tab === "sponsors" && <SponsorsAdmin />}

        {tab === "settings" && settings && (
          <div className="mt-6 rounded-2xl border border-border bg-card/60 p-6">
            <h3 className="text-sm font-semibold text-neon-blue">Auction settings</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Base prices are per category in millions. Bid increment applies to every raise.
            </p>
            <SettingsForm settings={settings} onSave={saveSettings} />
          </div>
        )}
      </div>

      {detail && (
        <DetailModal
          detail={detail}
          onClose={() => setDetail(null)}
          onEdit={detail.kind === "team" ? () => { setEditTeam(detail.data); setDetail(null); } : undefined}
        />
      )}
      {editTeam && (
        <EditTeamModal team={editTeam} onClose={() => setEditTeam(null)} onSave={saveTeam} />
      )}
    </div>
  );
}

function EditTeamModal({
  team,
  onClose,
  onSave,
}: {
  team: any;
  onClose: () => void;
  onSave: (id: string, values: { team_name: string; manager_name: string; logo_url: string | null; budget_remaining: number }) => void;
}) {
  const [form, setForm] = useState({
    team_name: team.team_name ?? "",
    manager_name: team.manager_name ?? "",
    logo_url: team.logo_url ?? "",
    budget_remaining: String(team.budget_remaining ?? 0),
  });
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.team_name.trim() || !form.manager_name.trim()) return toast.error("Team and manager name are required");
          setSaving(true);
          onSave(team.id, {
            team_name: form.team_name.trim(),
            manager_name: form.manager_name.trim(),
            logo_url: form.logo_url.trim() || null,
            budget_remaining: Number(form.budget_remaining) || 0,
          });
          setSaving(false);
        }}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-neon-purple"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">Edit team</h2>
            <p className="text-xs text-muted-foreground">Update team details and budget</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-5 space-y-4">
          {([
            ["team_name", "Team name", "text"],
            ["manager_name", "Manager name", "text"],
            ["budget_remaining", "Budget remaining (M)", "number"],
          ] as const).map(([key, label, type]) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-medium">{label}</label>
              <input
                type={type}
                step={type === "number" ? "0.1" : undefined}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
          <ImageField
            label="Team logo"
            folder="team-logos"
            value={form.logo_url}
            onChange={(url) => setForm({ ...form, logo_url: url })}
          />
        </div>


        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm">Cancel</button>
          <button
            disabled={saving}
            className="rounded-md bg-gradient-neon px-5 py-2 text-sm font-semibold text-primary-foreground shadow-neon-purple disabled:opacity-60"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}

function catCls(c: string | null) {
  if (c === "A") return "bg-gradient-neon text-primary-foreground shadow-neon-purple";
  if (c === "B") return "bg-accent/20 text-accent";
  if (c === "C") return "bg-muted text-muted-foreground";
  return "bg-muted text-muted-foreground";
}

function SettingsForm({ settings, onSave }: { settings: any; onSave: (n: any) => void }) {
  const [s, setS] = useState(settings);
  useEffect(() => setS(settings), [settings]);
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSave({
        team_budget: +s.team_budget,
        players_per_team: +s.players_per_team,
        base_price_a: +s.base_price_a,
        base_price_b: +s.base_price_b,
        base_price_c: +s.base_price_c,
        bid_increment: +s.bid_increment,
      }); }}
      className="mt-4 grid gap-4 sm:grid-cols-2"
    >
      {[
        ["team_budget", "Team budget (M)"],
        ["players_per_team", "Players per team"],
        ["base_price_a", "Base price — Category A"],
        ["base_price_b", "Base price — Category B"],
        ["base_price_c", "Base price — Category C"],
        ["bid_increment", "Bid increment (M)"],
      ].map(([key, label]) => (
        <div key={key}>
          <label className="mb-1 block text-xs font-medium">{label}</label>
          <input
            type="number"
            step="0.1"
            value={s[key] ?? 0}
            onChange={(e) => setS({ ...s, [key]: e.target.value })}
            className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      ))}
      <div className="sm:col-span-2">
        <button className="rounded-md bg-gradient-neon px-5 py-2 text-sm font-semibold text-primary-foreground shadow-neon-purple">
          Save settings
        </button>
      </div>
    </form>
  );
}

function DetailModal({ detail, onClose, onEdit }: { detail: { kind: "player" | "team"; data: any }; onClose: () => void; onEdit?: () => void }) {
  const [contact, setContact] = useState<{ email: string | null; phone: string | null } | null>(null);
  useEffect(() => {
    if (detail.kind !== "player" || !detail.data?.id) return;
    supabase.from("player_contacts").select("email, phone").eq("player_id", detail.data.id).maybeSingle()
      .then(({ data }) => setContact({ email: data?.email ?? null, phone: data?.phone ?? null }));
  }, [detail]);
  const d = detail.data;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-2xl border border-border bg-card p-6 shadow-neon-purple"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {detail.kind === "player" && d.photo_url ? (
              <img src={d.photo_url} alt="" className="h-14 w-14 rounded-full object-cover" />
            ) : detail.kind === "team" && d.logo_url ? (
              <img src={d.logo_url} alt="" className="h-14 w-14 rounded-lg object-cover" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-neon shadow-neon-purple">
                {detail.kind === "player" ? <Users className="h-6 w-6 text-primary-foreground" /> : <UsersRound className="h-6 w-6 text-primary-foreground" />}
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold">{d.full_name ?? d.team_name}</h2>
              <p className="text-xs text-muted-foreground">
                {detail.kind === "player" ? `${d.gender} · age ${d.age}` : `Manager: ${d.manager_name}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onEdit && (
              <button onClick={onEdit} className="rounded-md p-1 hover:bg-muted" aria-label="Edit team"><Pencil className="h-4 w-4" /></button>
            )}
            <button onClick={onClose} className="rounded-md p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-sm">
          {detail.kind === "player" ? (
            <>
              <div className="grid grid-cols-3 gap-2">
                <StatMini label="Category" value={d.category ?? "-"} />
                <StatMini label="Skill" value={d.skill_level} />
                <StatMini label="Fitness" value={d.fitness_level} />
                <StatMini label="Base price" value={`${d.base_price}M`} />
                <StatMini label="Matches" value={d.matches_played} />
                <StatMini label="Exp" value={`${d.years_experience}y`} />
              </div>
              <Row k="Role" v={d.primary_role?.replace("_", " ")} />
              <Row k="Batting" v={`${d.batting_style || "-"} · Avg ${d.batting_average} · HS ${d.highest_score}`} />
              <Row k="Bowling" v={`${d.bowling_style || "-"} · Avg ${d.bowling_average} · Best ${d.best_bowling || "-"}`} />
              <Row k="Phone" v={contact?.phone || "-"} />
              <Row k="Email" v={contact?.email || "-"} />

              <Row k="Fitness notes" v={d.fitness_notes || "-"} />
              <Row k="Achievements" v={d.achievements || "-"} />
              {d.ai_summary && (
                <div className="mt-2 rounded-lg border border-border bg-gradient-neon-soft p-3 text-xs">
                  <div className="mb-1 flex items-center gap-1 font-semibold text-neon-blue">
                    <Sparkles className="h-3 w-3" /> AI analysis
                  </div>
                  {d.ai_summary}
                </div>
              )}
            </>
          ) : (
            <>
              <Row k="Team name" v={d.team_name} />
              <Row k="Manager" v={d.manager_name} />
              <Row k="Budget remaining" v={`${d.budget_remaining}M`} />
              <Row k="Created" v={new Date(d.created_at).toLocaleString()} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatMini({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-2">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="text-sm font-bold">{value}</div>
    </div>
  );
}
function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border/50 py-2">
      <span className="text-xs text-muted-foreground">{k}</span>
      <span className="text-right text-xs font-medium">{v}</span>
    </div>
  );
}
