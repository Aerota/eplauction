import type { Database } from "@/integrations/supabase/types";

export type Match = Database["public"]["Tables"]["matches"]["Row"];

/** Convert any YouTube URL (watch, youtu.be, live, embed) into an embeddable URL. */
export function youtubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const raw = url.trim();
  if (!raw) return null;
  let id: string | null = null;
  try {
    const u = new URL(raw);
    if (u.hostname.includes("youtu.be")) id = u.pathname.slice(1);
    else if (u.pathname.startsWith("/live/")) id = u.pathname.split("/")[2] ?? null;
    else if (u.pathname.startsWith("/embed/")) id = u.pathname.split("/")[2] ?? null;
    else id = u.searchParams.get("v");
  } catch {
    id = /^[\w-]{6,}$/.test(raw) ? raw : null;
  }
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}`;
}

export function formatMatchDate(value: string | null): string {
  if (!value) return "TBA";
  return new Date(value).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function scoreLine(runs: number, wickets: number, overs: number | string) {
  return `${runs}/${wickets} (${overs} ov)`;
}
