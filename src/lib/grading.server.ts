// Server-only player grading logic (AI + amateur-tuned fallback).
import { callLovableAI } from "./ai-gateway.server";

export type GradeInput = {
  full_name?: string | null;
  age?: number | null;
  gender?: string | null;
  primary_role?: string | null;
  batting_style?: string | null;
  bowling_style?: string | null;
  years_experience?: number | null;
  matches_played?: number | null;
  batting_average?: number | null;
  bowling_average?: number | null;
  highest_score?: number | null;
  best_bowling?: string | null;
  fitness_notes?: string | null;
  achievements?: string | null;
  extra_info?: string | null;
};

export type GradeResult = {
  skill_level: number;
  fitness_level: number;
  category: "A" | "B" | "C";
  ai_summary: string;
};

const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const s = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : "not provided");

const SYSTEM = `You grade amateur cricket players for a university (ESAG) tournament auction.
You output ONLY valid compact JSON. No prose, no markdown.

CONTEXT: Almost nobody here is a professional. Most are casual/university/club-level
players, many with little or no recorded statistics. Grade strictly and conservatively
at that low level. Do NOT be generous, do NOT inflate, and do NOT reward blank or
vague answers — missing information means unproven, not average.

SCORING (skill_level 0-100), anchored for amateurs:
0-20   beginner: barely plays, no real match experience
21-40  casual: plays occasionally, no meaningful stats or achievements
41-60  regular club/university player with modest, believable stats
61-75  clearly above average for this level: consistent stats, several seasons, real achievements
76-90  standout: strong verified stats plus district/inter-university level achievements
91-100 near-professional; reserve this for genuine representative-level players

FITNESS (fitness_level 0-100): base on stated fitness notes, age, role demands and
activity level. Vague or empty notes cap fitness at 55. Ages above 35 lose points
unless fitness notes clearly say otherwise.

CATEGORY: "A" only when skill_level >= 76, "B" when 51-75, "C" when <= 50.
Expect the majority of players to land in C, a decent number in B, and only a few in A.

Judge consistency: implausibly high averages with almost no matches played should be
discounted, not rewarded. Weigh role suitability (a bowler with no bowling detail is weak).

Return JSON: {"skill_level": int, "fitness_level": int, "category": "A"|"B"|"C", "summary": string}
summary: one honest sentence, max 28 words, naming the main strength and the main gap.`;

function userPrompt(p: GradeInput) {
  return `Player details (fields marked "not provided" were left blank by the player):
- Primary role: ${s(p.primary_role)}
- Batting style: ${s(p.batting_style)}
- Bowling style: ${s(p.bowling_style)}
- Years playing: ${p.years_experience == null ? "not provided" : p.years_experience}
- Matches played: ${p.matches_played == null ? "not provided" : p.matches_played}
- Batting average: ${p.batting_average == null ? "not provided" : p.batting_average}
- Highest score: ${p.highest_score == null ? "not provided" : p.highest_score}
- Bowling average: ${p.bowling_average == null ? "not provided" : p.bowling_average}
- Best bowling: ${s(p.best_bowling)}
- Age: ${p.age == null ? "not provided" : p.age}, Gender: ${s(p.gender)}
- Fitness notes: ${s(p.fitness_notes)}
- Achievements: ${s(p.achievements)}
- Extra info: ${s(p.extra_info)}

Grade at amateur level. Return ONLY the JSON object.`;
}

export function heuristicGrade(p: GradeInput): GradeResult {
  const yrs = n(p.years_experience);
  const mp = n(p.matches_played);
  const bat = n(p.batting_average);
  const bowl = n(p.bowling_average);
  const hs = n(p.highest_score);
  const hasAch = typeof p.achievements === "string" && p.achievements.trim().length > 12;

  let score = 12;
  score += Math.min(yrs, 12) * 1.6;
  score += Math.min(mp, 80) * 0.28;
  score += Math.min(bat, 50) * 0.5;
  score += bowl > 0 ? Math.max(0, 35 - bowl) * 0.5 : 0;
  score += Math.min(hs, 150) * 0.08;
  if (hasAch) score += 8;
  if (mp < 5) score = Math.min(score, 35); // unproven

  const skill = Math.max(0, Math.min(100, Math.round(score)));
  const age = n(p.age);
  const notes = (p.fitness_notes ?? "").trim();
  let fitness = notes.length > 15 ? 62 : 48;
  if (age > 35) fitness -= (age - 35) * 2.5;
  if (age && age < 30) fitness += 5;
  fitness = Math.max(15, Math.min(90, Math.round(fitness)));

  const category: "A" | "B" | "C" = skill >= 76 ? "A" : skill >= 51 ? "B" : "C";
  return {
    skill_level: skill,
    fitness_level: fitness,
    category,
    ai_summary: "Graded from the submitted details using the standard amateur scoring rubric.",
  };
}

export async function gradePlayer(p: GradeInput): Promise<GradeResult> {
  try {
    const resp = await callLovableAI({
      model: "google/gemini-3.6-flash",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userPrompt(p) },
      ],
    });
    const parsed = JSON.parse(resp.choices[0].message.content);
    const skill = Math.max(0, Math.min(100, Math.round(Number(parsed.skill_level))));
    const fitness = Math.max(0, Math.min(100, Math.round(Number(parsed.fitness_level))));
    if (!Number.isFinite(skill) || !Number.isFinite(fitness)) throw new Error("bad numbers");
    // Keep category consistent with the rubric thresholds.
    const category: "A" | "B" | "C" = skill >= 76 ? "A" : skill >= 51 ? "B" : "C";
    return {
      skill_level: skill,
      fitness_level: fitness,
      category,
      ai_summary: String(parsed.summary ?? "").slice(0, 300),
    };
  } catch (e) {
    console.error("AI grading failed, using heuristic", e);
    return heuristicGrade(p);
  }
}
