import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Radio, Minus, Save, Youtube } from "lucide-react";
import { useMatches } from "@/lib/use-matches";
import type { Match } from "@/lib/matches";
import { youtubeEmbedUrl } from "@/lib/matches";

const empty = {
  team_a_name: "",
  team_b_name: "",
  venue: "",
  match_date: "",
  youtube_url: "",
};

export function MatchesAdmin() {
  const { matches, reload } = useMatches();
  const [form, setForm] = useState(empty);
  const [creating, setCreating] = useState(false);

  async function createMatch(e: React.FormEvent) {
    e.preventDefault();
    if (!form.team_a_name || !form.team_b_name) return toast.error("Both team names are required");
    setCreating(true);
    const { error } = await supabase.from("matches").insert({
      team_a_name: form.team_a_name,
      team_b_name: form.team_b_name,
      venue: form.venue || null,
      match_date: form.match_date ? new Date(form.match_date).toISOString() : null,
      youtube_url: form.youtube_url || null,
    });
    setCreating(false);
    if (error) return toast.error(error.message);
    toast.success("Match scheduled");
    setForm(empty);
    reload();
  }

  return (
    <div className="mt-6 space-y-6">
      <form onSubmit={createMatch} className="rounded-2xl border border-border bg-card/60 p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-neon-blue">
          <Plus className="h-4 w-4" /> Schedule a new match
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Team A" value={form.team_a_name} onChange={(v) => setForm({ ...form, team_a_name: v })} />
          <Field label="Team B" value={form.team_b_name} onChange={(v) => setForm({ ...form, team_b_name: v })} />
          <Field label="Venue" value={form.venue} onChange={(v) => setForm({ ...form, venue: v })} />
          <Field label="Date & time" type="datetime-local" value={form.match_date} onChange={(v) => setForm({ ...form, match_date: v })} />
          <Field label="YouTube live link (optional)" value={form.youtube_url} onChange={(v) => setForm({ ...form, youtube_url: v })} />
        </div>
        <button
          disabled={creating}
          className="mt-4 rounded-md bg-gradient-neon px-5 py-2 text-sm font-semibold text-primary-foreground shadow-neon-purple disabled:opacity-60"
        >
          {creating ? "Adding…" : "Add match"}
        </button>
      </form>

      {matches.length === 0 && (
        <p className="rounded-2xl border border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
          No matches yet — schedule one above.
        </p>
      )}
      {matches.map((m) => (
        <MatchControl key={m.id} match={m} onChanged={reload} />
      ))}
    </div>
  );
}

function MatchControl({ match, onChanged }: { match: Match; onChanged: () => void }) {
  const [m, setM] = useState<Match>(match);
  const [saving, setSaving] = useState(false);
  useEffect(() => setM(match), [match]);

  async function patch(next: Partial<Match>, silent = false) {
    setM((prev) => ({ ...prev, ...next }));
    const { error } = await supabase.from("matches").update(next).eq("id", match.id);
    if (error) return toast.error(error.message);
    if (!silent) toast.success("Updated");
    onChanged();
  }

  async function saveAll() {
    setSaving(true);
    const { error } = await supabase
      .from("matches")
      .update({
        team_a_name: m.team_a_name,
        team_b_name: m.team_b_name,
        venue: m.venue,
        match_date: m.match_date,
        youtube_url: m.youtube_url,
        batting_team: m.batting_team,
        toss_info: m.toss_info,
        commentary: m.commentary,
        result_summary: m.result_summary,
        team_a_overs: m.team_a_overs,
        team_b_overs: m.team_b_overs,
      })
      .eq("id", match.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Match saved");
    onChanged();
  }

  async function remove() {
    if (!confirm(`Delete match "${m.team_a_name} vs ${m.team_b_name}"?`)) return;
    const { error } = await supabase.from("matches").delete().eq("id", match.id);
    if (error) return toast.error(error.message);
    toast.success("Match deleted");
    onChanged();
  }

  const isLive = m.status === "live";

  return (
    <div className={`rounded-2xl border bg-card/60 p-5 ${isLive ? "border-destructive/60" : "border-border"}`}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm font-bold">
          {m.team_a_name} <span className="text-muted-foreground">vs</span> {m.team_b_name}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-1 rounded-lg bg-muted p-1">
          {(["upcoming", "live", "completed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => patch({ status: s })}
              className={`rounded-md px-3 py-1 text-xs font-semibold capitalize transition ${
                m.status === s ? "bg-gradient-neon text-primary-foreground shadow-neon-purple" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "live" && <Radio className="mr-1 inline h-3 w-3" />}
              {s}
            </button>
          ))}
        </div>
        <button onClick={remove} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Quick score controls */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <ScorePanel
          label={m.team_a_name}
          runs={m.team_a_score}
          wickets={m.team_a_wickets}
          overs={Number(m.team_a_overs)}
          onRuns={(v) => patch({ team_a_score: v }, true)}
          onWickets={(v) => patch({ team_a_wickets: v }, true)}
          onOvers={(v) => patch({ team_a_overs: v }, true)}
          batting={m.batting_team === m.team_a_name}
          onSetBatting={() => patch({ batting_team: m.team_a_name }, true)}
        />
        <ScorePanel
          label={m.team_b_name}
          runs={m.team_b_score}
          wickets={m.team_b_wickets}
          overs={Number(m.team_b_overs)}
          onRuns={(v) => patch({ team_b_score: v }, true)}
          onWickets={(v) => patch({ team_b_wickets: v }, true)}
          onOvers={(v) => patch({ team_b_overs: v }, true)}
          batting={m.batting_team === m.team_b_name}
          onSetBatting={() => patch({ batting_team: m.team_b_name }, true)}
        />
      </div>

      {/* Details */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Team A" value={m.team_a_name} onChange={(v) => setM({ ...m, team_a_name: v })} />
        <Field label="Team B" value={m.team_b_name} onChange={(v) => setM({ ...m, team_b_name: v })} />
        <Field label="Venue" value={m.venue ?? ""} onChange={(v) => setM({ ...m, venue: v })} />
        <Field
          label="Date & time"
          type="datetime-local"
          value={m.match_date ? new Date(m.match_date).toISOString().slice(0, 16) : ""}
          onChange={(v) => setM({ ...m, match_date: v ? new Date(v).toISOString() : null })}
        />
        <Field label="Toss / info" value={m.toss_info ?? ""} onChange={(v) => setM({ ...m, toss_info: v })} />
        <Field label="Result summary" value={m.result_summary ?? ""} onChange={(v) => setM({ ...m, result_summary: v })} />
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="mb-1 flex items-center gap-1 text-xs font-medium">
            <Youtube className="h-3.5 w-3.5 text-destructive" /> YouTube live link
          </label>
          <input
            value={m.youtube_url ?? ""}
            onChange={(e) => setM({ ...m, youtube_url: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            {m.youtube_url
              ? youtubeEmbedUrl(m.youtube_url)
                ? "Valid link — it will embed on the Matches page while the match is live."
                : "This link doesn't look like a YouTube URL."
              : "Paste a watch, youtu.be or /live link."}
          </p>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="mb-1 block text-xs font-medium">Live commentary / note</label>
          <textarea
            value={m.commentary ?? ""}
            onChange={(e) => setM({ ...m, commentary: e.target.value })}
            rows={2}
            className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <button
        onClick={saveAll}
        disabled={saving}
        className="mt-4 inline-flex items-center gap-1 rounded-md bg-gradient-neon px-5 py-2 text-sm font-semibold text-primary-foreground shadow-neon-purple disabled:opacity-60"
      >
        <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save details"}
      </button>
    </div>
  );
}

function ScorePanel({
  label,
  runs,
  wickets,
  overs,
  onRuns,
  onWickets,
  onOvers,
  batting,
  onSetBatting,
}: {
  label: string;
  runs: number;
  wickets: number;
  overs: number;
  onRuns: (v: number) => void;
  onWickets: (v: number) => void;
  onOvers: (v: number) => void;
  batting: boolean;
  onSetBatting: () => void;
}) {
  return (
    <div className={`rounded-xl border p-4 ${batting ? "border-neon-blue/60 bg-gradient-neon-soft" : "border-border bg-muted/30"}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{label}</span>
        <button
          onClick={onSetBatting}
          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
            batting ? "bg-gradient-neon text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          Batting
        </button>
      </div>
      <div className="mt-3 text-3xl font-extrabold tabular-nums">
        {runs}/{wickets} <span className="text-sm font-medium text-muted-foreground">({overs} ov)</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        {[1, 2, 3, 4, 6].map((n) => (
          <button
            key={n}
            onClick={() => onRuns(runs + n)}
            className="rounded-md bg-gradient-neon px-3 py-1 text-xs font-bold text-primary-foreground"
          >
            +{n}
          </button>
        ))}
        <button onClick={() => onRuns(Math.max(0, runs - 1))} className="rounded-md border border-border px-2 py-1 text-xs">
          <Minus className="h-3 w-3" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stepper label="Runs" value={runs} onChange={(v) => onRuns(Math.max(0, v))} />
        <Stepper label="Wickets" value={wickets} onChange={(v) => onWickets(Math.min(10, Math.max(0, v)))} />
        <Stepper label="Overs" value={overs} step={0.1} onChange={(v) => onOvers(Math.max(0, Number(v.toFixed(1))))} />
      </div>
      <div className="mt-2 flex gap-1">
        <button onClick={() => onWickets(Math.min(10, wickets + 1))} className="flex-1 rounded-md border border-border px-2 py-1 text-xs font-semibold hover:bg-muted">
          + Wicket
        </button>
        <button onClick={() => onOvers(Number((overs + 0.1).toFixed(1)))} className="flex-1 rounded-md border border-border px-2 py-1 text-xs font-semibold hover:bg-muted">
          + Ball
        </button>
        <button onClick={() => onOvers(Math.floor(overs) + 1)} className="flex-1 rounded-md border border-border px-2 py-1 text-xs font-semibold hover:bg-muted">
          + Over
        </button>
      </div>
    </div>
  );
}

function Stepper({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] uppercase text-muted-foreground">{label}</label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-md border border-border bg-input px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
