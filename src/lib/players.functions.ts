import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const PlayerInput = z.object({
  full_name: z.string().min(1).max(120),
  phone: z.string().max(30).optional().default(""),
  age: z.number().int().min(10).max(80),
  gender: z.enum(["male", "female"]),
  photo_url: z.string().url().optional().or(z.literal("")).default(""),
  primary_role: z.enum(["batsman", "bowler", "all_rounder", "wicket_keeper"]),
  batting_style: z.string().max(60).optional().default(""),
  bowling_style: z.string().max(60).optional().default(""),
  years_experience: z.number().int().min(0).max(60).default(0),
  matches_played: z.number().int().min(0).max(2000).default(0),
  batting_average: z.number().min(0).max(200).default(0),
  bowling_average: z.number().min(0).max(200).default(0),
  highest_score: z.number().int().min(0).max(500).default(0),
  best_bowling: z.string().max(30).optional().default(""),
  fitness_notes: z.string().max(500).optional().default(""),
  achievements: z.string().max(1000).optional().default(""),
  extra_info: z.string().max(1000).optional().default(""),
});

export const submitPlayerRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PlayerInput.parse(input))
  .handler(async ({ data, context }) => {
    const { callLovableAI } = await import("./ai-gateway.server");

    // Ask AI for skill/fitness/category
    let skill_level = 50;
    let fitness_level = 50;
    let category: "A" | "B" | "C" = "B";
    let ai_summary = "";
    try {
      const prompt = `You are grading a cricket player for a local tournament auction. Based on the details below, return JSON with fields: skill_level (0-100 integer), fitness_level (0-100 integer), category ("A" = elite, "B" = solid, "C" = developing), and summary (one sentence, max 25 words).\n\nDetails:\n- Role: ${data.primary_role}\n- Years experience: ${data.years_experience}\n- Matches played: ${data.matches_played}\n- Batting avg: ${data.batting_average}, Highest: ${data.highest_score}\n- Bowling avg: ${data.bowling_average}, Best: ${data.best_bowling}\n- Batting style: ${data.batting_style} | Bowling style: ${data.bowling_style}\n- Age: ${data.age}, Gender: ${data.gender}\n- Fitness notes: ${data.fitness_notes}\n- Achievements: ${data.achievements}\n- Extra: ${data.extra_info}\n\nReturn ONLY compact JSON.`;
      const resp = await callLovableAI({
        model: "google/gemini-3.6-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You output only valid JSON." },
          { role: "user", content: prompt },
        ],
      });
      const parsed = JSON.parse(resp.choices[0].message.content);
      skill_level = Math.max(0, Math.min(100, Number(parsed.skill_level) || 50));
      fitness_level = Math.max(0, Math.min(100, Number(parsed.fitness_level) || 50));
      const cat = String(parsed.category || "B").toUpperCase();
      category = cat === "A" || cat === "C" ? cat : "B";
      ai_summary = String(parsed.summary || "").slice(0, 300);
    } catch (e) {
      console.error("AI categorization failed", e);
      // Fallback heuristic
      const score =
        data.years_experience * 3 +
        Math.min(data.matches_played, 100) / 2 +
        data.batting_average +
        (data.bowling_average > 0 ? Math.max(0, 40 - data.bowling_average) : 0);
      skill_level = Math.min(100, Math.round(30 + score));
      fitness_level = Math.max(30, 80 - Math.max(0, data.age - 25) * 2);
      category = skill_level >= 75 ? "A" : skill_level >= 50 ? "B" : "C";
      ai_summary = "Graded via fallback heuristic.";
    }

    // Read base prices
    const { data: settings } = await context.supabase
      .from("auction_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    const base_price =
      category === "A"
        ? settings?.base_price_a ?? 2
        : category === "B"
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
      skill_level,
      fitness_level,
      category,
      ai_summary,
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
    return { skill_level, fitness_level, category, ai_summary, base_price };
  });
