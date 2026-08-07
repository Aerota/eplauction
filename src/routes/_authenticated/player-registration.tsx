import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitPlayerRegistration } from "@/lib/players.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Sparkles } from "lucide-react";
import { ImageField } from "@/components/ImageField";


export const Route = createFileRoute("/_authenticated/player-registration")({
  head: () => ({ meta: [{ title: "Player Registration — ESAG Auction" }] }),
  component: PlayerReg,
});

function PlayerReg() {
  const submit = useServerFn(submitPlayerRegistration);
  const navigate = useNavigate();
  const [existing, setExisting] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    age: 22,
    gender: "male" as "male" | "female",
    photo_url: "",
    primary_role: "batsman" as "batsman" | "bowler" | "all_rounder" | "wicket_keeper",
    batting_style: "",
    bowling_style: "",
    years_experience: 0,
    matches_played: 0,
    batting_average: 0,
    bowling_average: 0,
    highest_score: 0,
    best_bowling: "",
    fitness_notes: "",
    achievements: "",
    extra_info: "",
  });

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("players").select("*").eq("user_id", u.user.id).maybeSingle();
      if (data) setExisting(data);
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await submit({ data: form });
      toast.success(
        `Registered! AI graded you as Category ${result.category} (Skill ${result.skill_level}, Fitness ${result.fitness_level}).`,
        { duration: 6000 },
      );
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to register");
    } finally {
      setLoading(false);
    }
  }

  if (existing) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold">Your player profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You've already registered. Here's how you've been graded.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <StatCard label="Category" value={existing.category ?? "-"} accent />
          <StatCard label="Base price" value={`${existing.base_price ?? "-"}M`} />
          <StatCard label="Skill level" value={`${existing.skill_level}/100`} />
          <StatCard label="Fitness level" value={`${existing.fitness_level}/100`} />
        </div>
        {existing.ai_summary && (
          <div className="mt-4 rounded-lg border border-border bg-card/60 p-4 text-sm">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-neon-blue">
              <Sparkles className="h-3.5 w-3.5" /> AI analysis
            </div>
            {existing.ai_summary}
          </div>
        )}
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-2xl font-bold">Register as a player</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Fill this in truthfully — our AI grades your skill, fitness, and category.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        <Section title="Personal">
          <Field label="Full name">
            <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Phone">
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Age">
            <input type="number" min={10} max={80} required value={form.age} onChange={(e) => setForm({ ...form, age: +e.target.value })} className={inputCls} />
          </Field>
          <Field label="Gender">
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as any })} className={inputCls}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <ImageField
              label="Player photo"
              folder="player-photos"
              round
              value={form.photo_url}
              onChange={(url) => setForm({ ...form, photo_url: url })}
            />
          </div>

        </Section>

        <Section title="Playing style">
          <Field label="Primary role">
            <select value={form.primary_role} onChange={(e) => setForm({ ...form, primary_role: e.target.value as any })} className={inputCls}>
              <option value="batsman">Batsman</option>
              <option value="bowler">Bowler</option>
              <option value="all_rounder">All-rounder</option>
              <option value="wicket_keeper">Wicket-keeper</option>
            </select>
          </Field>
          <Field label="Batting style">
            <input placeholder="Right-hand top order" value={form.batting_style} onChange={(e) => setForm({ ...form, batting_style: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Bowling style">
            <input placeholder="Right-arm medium" value={form.bowling_style} onChange={(e) => setForm({ ...form, bowling_style: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Years of experience">
            <input type="number" min={0} value={form.years_experience} onChange={(e) => setForm({ ...form, years_experience: +e.target.value })} className={inputCls} />
          </Field>
        </Section>

        <Section title="Stats">
          <Field label="Matches played">
            <input type="number" min={0} value={form.matches_played} onChange={(e) => setForm({ ...form, matches_played: +e.target.value })} className={inputCls} />
          </Field>
          <Field label="Highest score">
            <input type="number" min={0} value={form.highest_score} onChange={(e) => setForm({ ...form, highest_score: +e.target.value })} className={inputCls} />
          </Field>
          <Field label="Batting average">
            <input type="number" step="0.01" min={0} value={form.batting_average} onChange={(e) => setForm({ ...form, batting_average: +e.target.value })} className={inputCls} />
          </Field>
          <Field label="Bowling average">
            <input type="number" step="0.01" min={0} value={form.bowling_average} onChange={(e) => setForm({ ...form, bowling_average: +e.target.value })} className={inputCls} />
          </Field>
          <Field label="Best bowling (e.g. 4/23)">
            <input value={form.best_bowling} onChange={(e) => setForm({ ...form, best_bowling: e.target.value })} className={inputCls} />
          </Field>
        </Section>

        <Section title="Fitness & background">
          <Field label="Fitness notes" span2>
            <textarea rows={2} value={form.fitness_notes} onChange={(e) => setForm({ ...form, fitness_notes: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Achievements" span2>
            <textarea rows={2} value={form.achievements} onChange={(e) => setForm({ ...form, achievements: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Anything else" span2>
            <textarea rows={2} value={form.extra_info} onChange={(e) => setForm({ ...form, extra_info: e.target.value })} className={inputCls} />
          </Field>
        </Section>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-gradient-neon px-6 py-3 text-sm font-semibold text-primary-foreground shadow-neon-purple disabled:opacity-60"
        >
          <Sparkles className="h-4 w-4" />
          {loading ? "Grading with AI…" : "Submit for AI grading"}
        </button>
      </form>
    </Shell>
  );
}

const inputCls =
  "w-full rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link to="/dashboard" className="mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
        </Link>
        {children}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur">
      <h3 className="mb-4 text-sm font-semibold text-neon-blue">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({ label, children, span2 }: { label: string; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={span2 ? "sm:col-span-2" : ""}>
      <label className="mb-1 block text-xs font-medium">{label}</label>
      {children}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-card ${accent ? "border-neon bg-gradient-neon-soft" : "border-border bg-card/60"}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-3xl font-bold ${accent ? "glow-text" : ""}`}>{value}</div>
    </div>
  );
}
