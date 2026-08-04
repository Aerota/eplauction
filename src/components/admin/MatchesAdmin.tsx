import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Radio, Minus, Save, Youtube, Film, ListPlus } from "lucide-react";
import { useMatches } from "@/lib/use-matches";
import { useMatchEvents } from "@/lib/use-match-events";
import type { Match } from "@/lib/matches";
import { youtubeEmbedUrl, EVENT_TYPES, EVENT_LABELS, ballLabel } from "@/lib/matches";

const empty = {
  team_a_name: "",
  team_b_name: "",
  venue: "",
  match_date: "",
  youtube_url: "",
};

/** All registered auction team names, for the dropdowns. */
function useTeamNames() {
  const [names, setNames] = useState<string[]>([]);
  useEffect(() => {
    supabase
      .from("teams")
      .select("team_name")
      .order("team_name")
      .then(({ data }) => setNames((data ?? []).map((t) => t.team_name)));
  }, []);
  return names;
}

export function MatchesAdmin() {
  const { matches, reload } = useMatches();
  const teamNames = useTeamNames();
  const [form, setForm] = useState(empty);
  const [creating, setCreating] = useState(false);

  async function createMatch(e: React.FormEvent) {
    e.preventDefault();
    if (!form.team_a_name || !form.team_b_name) return toast.error("Both team names are required");
    if (form.team_a_name === form.team_b_name) return toast.error("Pick two different teams");
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
          <TeamSelect label="Team A" value={form.team_a_name} teams={teamNames} onChange={(v) => setForm({ ...form, team_a_name: v })} />
          <TeamSelect label="Team B" value={form.team_b_name} teams={teamNames} onChange={(v) => setForm({ ...form, team_b_name: v })} />
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
        <MatchControl key={m.id} match={m} teamNames={teamNames} onChanged={reload} />
      ))}
    </div>
  );
}

function MatchControl({ match, teamNames, onChanged }: { match: Match; teamNames: string[]; onChanged: () => void }) {
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
        highlight_url: m.highlight_url,
        batting_team: m.batting_team,
        toss_winner: m.toss_winner,
        toss_decision: m.toss_decision,
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

      {/* Toss */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium">Toss winner</label>
          <select
            value={m.toss_winner ?? ""}
            onChange={(e) => patch({ toss_winner: e.target.value || null }, true)}
            className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Not decided</option>
            <option value={m.team_a_name}>{m.team_a_name}</option>
            <option value={m.team_b_name}>{m.team_b_name}</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Chose to</label>
          <select
            value={m.toss_decision ?? ""}
            onChange={(e) => patch({ toss_decision: e.target.value || null }, true)}
            className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Not decided</option>
            <option value="bat">Bat first</option>
            <option value="bowl">Bowl first</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Batting now</label>
          <select
            value={m.batting_team ?? ""}
            onChange={(e) => patch({ batting_team: e.target.value || null }, true)}
            className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">—</option>
            <option value={m.team_a_name}>{m.team_a_name}</option>
            <option value={m.team_b_name}>{m.team_b_name}</option>
          </select>
        </div>
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

      {/* Ball by ball */}
      <BallByBallAdmin match={m} />

      {/* Details */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <TeamSelect label="Team A" value={m.team_a_name} teams={teamNames} onChange={(v) => setM({ ...m, team_a_name: v })} />
        <TeamSelect label="Team B" value={m.team_b_name} teams={teamNames} onChange={(v) => setM({ ...m, team_b_name: v })} />
        <Field label="Venue" value={m.venue ?? ""} onChange={(v) => setM({ ...m, venue: v })} />
        <Field
          label="Date & time"
          type="datetime-local"
          value={m.match_date ? new Date(m.match_date).toISOString().slice(0, 16) : ""}
          onChange={(v) => setM({ ...m, match_date: v ? new Date(v).toISOString() : null })}
        />
        <Field label="Extra info" value={m.toss_info ?? ""} onChange={(v) => setM({ ...m, toss_info: v })} />
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
                ? "Valid link — it will embed on the match page while the match is live."
                : "This link doesn't look like a YouTube URL."
              : "Paste a watch, youtu.be or /live link."}
          </p>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="mb-1 flex items-center gap-1 text-xs font-medium">
            <Film className="h-3.5 w-3.5 text-neon-purple" /> Highlights video link (shown when completed)
          </label>
          <input
            value={m.highlight_url ?? ""}
            onChange={(e) => setM({ ...m, highlight_url: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
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

function BallByBallAdmin({ match }: { match: Match }) {
  const { events, reload } = useMatchEvents(match.id);
  const last = events[0];
  const [over, setOver] = useState(0);
  const [ball, setBall] = useState(1);
  const [type, setType] = useState<string>("run");
  const [runs, setRuns] = useState(0);
  const [desc, setDesc] = useState("");
  const [team, setTeam] = useState<string>(match.batting_team ?? match.team_a_name);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (last) {
      const nextBall = last.ball_number >= 6 ? 1 : last.ball_number + 1;
      setOver(last.ball_number >= 6 ? last.over_number + 1 : last.over_number);
      setBall(nextBall);
    }
  }, [last?.id]);

  useEffect(() => {
    if (match.batting_team) setTeam(match.batting_team);
  }, [match.batting_team]);

  async function addEvent() {
    setAdding(true);
    const { error } = await supabase.from("match_events").insert({
      match_id: match.id,
      innings: match.current_innings,
      over_number: over,
      ball_number: ball,
      team_name: team,
      runs,
      event_type: type,
      description: desc || null,
    });
    setAdding(false);
    if (error) return toast.error(error.message);
    setDesc("");
    setRuns(0);
    setType("run");
    reload();
  }

  async function removeEvent(id: string) {
    const { error } = await supabase.from("match_events").delete().eq("id", id);
    if (error) return toast.error(error.message);
    reload();
  }

  return (
    <div className="mt-5 rounded-xl border border-border bg-muted/20 p-4">
      <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neon-blue">
        <ListPlus className="h-4 w-4" /> Ball-by-ball commentary
      </h4>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <Stepper label="Over" value={over} onChange={(v) => setOver(Math.max(0, v))} />
        <Stepper label="Ball" value={ball} onChange={(v) => setBall(Math.min(6, Math.max(1, v)))} />
        <div>
          <label className="mb-1 block text-[10px] uppercase text-muted-foreground">Team</label>
          <select
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            className="w-full rounded-md border border-border bg-input px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value={match.team_a_name}>{match.team_a_name}</option>
            <option value={match.team_b_name}>{match.team_b_name}</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[10px] uppercase text-muted-foreground">Event</label>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              if (e.target.value === "four") setRuns(4);
              else if (e.target.value === "six") setRuns(6);
              else if (e.target.value === "wicket") setRuns(0);
            }}
            className="w-full rounded-md border border-border bg-input px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {EVENT_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <Stepper label="Runs" value={runs} onChange={(v) => setRuns(Math.max(0, v))} />
        <div className="flex items-end">
          <button
            onClick={addEvent}
            disabled={adding}
            className="w-full rounded-md bg-gradient-neon px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
          >
            {adding ? "Adding…" : "Add ball"}
          </button>
        </div>
      </div>

      <input
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Description e.g. Perera drives through covers for four"
        className="mt-2 w-full rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />

      {events.length > 0 && (
        <ul className="mt-3 max-h-56 space-y-1 overflow-y-auto">
          {events.map((e) => (
            <li key={e.id} className="flex items-center gap-2 rounded-md bg-card/60 px-2 py-1 text-xs">
              <span className="min-w-10 font-bold tabular-nums">{ballLabel(e.over_number, e.ball_number)}</span>
              <span className="font-semibold uppercase text-muted-foreground">{EVENT_LABELS[e.event_type] ?? e.event_type}</span>
              {e.runs > 0 && <span className="tabular-nums">{e.runs}r</span>}
              <span className="truncate text-muted-foreground">{e.description}</span>
              <button
                onClick={() => removeEvent(e.id)}
                className="ml-auto rounded p-1 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
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

function TeamSelect({
  label,
  value,
  teams,
  onChange,
}: {
  label: string;
  value: string;
  teams: string[];
  onChange: (v: string) => void;
}) {
  const known = value === "" || teams.includes(value);
  const [custom, setCustom] = useState(!known && value !== "");

  return (
    <div>
      <label className="mb-1 block text-xs font-medium">{label}</label>
      {custom ? (
        <div className="flex gap-1">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Team name"
            className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={() => {
              setCustom(false);
              onChange("");
            }}
            className="rounded-md border border-border px-2 text-xs text-muted-foreground"
          >
            List
          </button>
        </div>
      ) : (
        <select
          value={value}
          onChange={(e) => {
            if (e.target.value === "__custom__") {
              setCustom(true);
              onChange("");
            } else onChange(e.target.value);
          }}
          className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select a team…</option>
          {teams.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
          <option value="__custom__">Other (type manually)…</option>
        </select>
      )}
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
