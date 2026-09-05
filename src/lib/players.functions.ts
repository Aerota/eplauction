import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const optNum = (min: number, max: number) =>
  z
    .union([z.number(), z.null(), z.undefined()])
    .transform((v) => (v == null || Number.isNaN(v) ? null : v))
    .refine((v) => v == null || (v >= min && v <= max), `Must be between ${min} and ${max}`);

const PlayerInput = z.object({
  full_name: z.string().min(1).max(120),
  phone: z.string().max(30).optional().default(""),
  age: optNum(10, 80),
  gender: z.enum(["male", "female"]),
  photo_url: z.string().url().optional().or(z.literal("")).default(""),
  primary_role: z.enum(["batsman", "bowler", "all_rounder", "wicket_keeper"]),
  batting_style: z.string().max(60).optional().default(""),
  bowling_style: z.string().max(60).optional().default(""),
  years_experience: optNum(0, 60),
  matches_played: optNum(0, 2000),
  batting_average: optNum(0, 200),
  bowling_average: optNum(0, 200),
  highest_score: optNum(0, 500),
  best_bowling: z.string().max(30).optional().default(""),
  fitness_notes: z.string().max(500).optional().default(""),
  achievements: z.string().max(1000).optional().default(""),
  extra_info: z.string().max(1000).optional().default(""),
});

export const submitPlayerRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PlayerInput.parse(input))
  .handler(async ({ data, context }) => {
    const { gradePlayer } = await import("./grading.server");

    const grade = await gradePlayer({
      age: data.age,
      gender: data.gender,
      primary_role: data.primary_role,
      batting_style: data.batting_style,
      bowling_style: data.bowling_style,
      years_experience: data.years_experience,
      matches_played: data.matches_played,
      batting_average: data.batting_average,
      bowling_average: data.bowling_average,
      highest_score: data.highest_score,
      best_bowling: data.best_bowling,
      fitness_notes: data.fitness_notes,
      achievements: data.achievements,
      extra_info: data.extra_info,
    });

    // Read base prices
    const { data: settings } = await context.supabase
      .from("auction_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    const base_price =
      grade.category === "A"
        ? settings?.base_price_a ?? 2
        : grade.category === "B"
          ? settings?.base_price_b ?? 1
          : settings?.base_price_c ?? 0.5;

    const { data: inserted, error } = await context.supabase.from("players").insert({
      user_id: context.userId,
      full_name: data.full_name,
      age: data.age,
      gender: data.gender,
      photo_url: data.photo_url || null,
      primary_role: data.primary_role,
      batting_style: data.batting_style || null,
      bowling_style: data.bowling_style || null,
      years_experience: data.years_experience,
      matches_played: data.matches_played,
      batting_average: data.batting_average,
      bowling_average: data.bowling_average,
      highest_score: data.highest_score,
      best_bowling: data.best_bowling || null,
      fitness_notes: data.fitness_notes || null,
      achievements: data.achievements || null,
      extra_info: data.extra_info || null,
      skill_level: grade.skill_level,
      fitness_level: grade.fitness_level,
      category: grade.category,
      ai_summary: grade.ai_summary,
      base_price,
      status: "available",
    }).select("id").single();
    if (error) throw new Error(error.message);

    // Store contact info in the protected player_contacts table
    const email = (context.claims.email as string | undefined) ?? null;
    const phone = data.phone || null;
    if (inserted?.id && (email || phone)) {
      await context.supabase
        .from("player_contacts")
        .insert({ player_id: inserted.id, email, phone });
    }
    return { ...grade, base_price };
  });

/** Admin-only: re-grade every player with the current AI rubric. */
export const regradeAllPlayers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Admins only");

    const { gradePlayer } = await import("./grading.server");
    const { data: players, error } = await context.supabase.from("players").select("*");
    if (error) throw new Error(error.message);

    const { data: settings } = await context.supabase
      .from("auction_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    const priceFor = (c: "A" | "B" | "C") =>
      c === "A" ? settings?.base_price_a ?? 2 : c === "B" ? settings?.base_price_b ?? 1 : settings?.base_price_c ?? 0.5;

    let updated = 0;
    const counts = { A: 0, B: 0, C: 0 };
    for (const p of players ?? []) {
      const grade = await gradePlayer(p);
      counts[grade.category] += 1;
      const patch: Record<string, unknown> = {
        skill_level: grade.skill_level,
        fitness_level: grade.fitness_level,
        category: grade.category,
        ai_summary: grade.ai_summary,
      };
      // Don't change the price of a player already sold or pre-assigned.
      if (p.status !== "sold" && p.status !== "pre_assigned") {
        patch['base_price'] = priceFor(grade.category);
      }
      const { error: upErr } = await context.supabase
        .from("players")
        .update(patch as never)
        .eq("id", p.id);
      if (!upErr) updated += 1;
    }
    return { updated, total: players?.length ?? 0, counts };
  });
