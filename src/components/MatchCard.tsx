import { Link } from "@tanstack/react-router";
import { Radio, CalendarDays, MapPin } from "lucide-react";
import type { Match } from "@/lib/matches";
import { formatMatchDate, scoreLine } from "@/lib/matches";
import { useTeamLogos } from "@/lib/use-team-logos";

export function LiveDot() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" /> Live
    </span>
  );
}

export function MatchCard({ match, compact = false }: { match: Match; compact?: boolean }) {
  const isLive = match.status === "live";
  const { logoFor } = useTeamLogos();
  return (
    <Link
      to="/match/$matchId"
      params={{ matchId: match.id }}
      className="block rounded-2xl border border-border bg-card/60 p-5 backdrop-blur shadow-card transition hover:border-neon-blue/60"
    >
      <div className="flex items-center justify-between gap-2">
        {isLive ? (
          <LiveDot />
        ) : (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            {match.status}
          </span>
        )}
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <CalendarDays className="h-3 w-3" /> {formatMatchDate(match.match_date)}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <TeamRow
          name={match.team_a_name}
          logo={logoFor(match.team_a_name, match.team_a_logo_url)}
          score={match.status === "upcoming" ? "—" : scoreLine(match.team_a_score, match.team_a_wickets, match.team_a_overs)}
          batting={isLive && match.batting_team === match.team_a_name}
        />
        <TeamRow
          name={match.team_b_name}
          logo={logoFor(match.team_b_name, match.team_b_logo_url)}
          score={match.status === "upcoming" ? "—" : scoreLine(match.team_b_score, match.team_b_wickets, match.team_b_overs)}
          batting={isLive && match.batting_team === match.team_b_name}
        />
      </div>

      {match.venue && (
        <div className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3" /> {match.venue}
        </div>
      )}

      {!compact && match.commentary && (
        <p className="mt-3 rounded-lg bg-muted/40 p-2 text-xs text-muted-foreground">{match.commentary}</p>
      )}
      {match.result_summary && (
        <p className="mt-3 text-xs font-medium text-neon-blue">{match.result_summary}</p>
      )}

      {match.youtube_url && isLive && (
        <span className="mt-4 inline-flex items-center gap-1 rounded-md bg-gradient-neon px-3 py-1.5 text-xs font-semibold text-primary-foreground">
          <Radio className="h-3.5 w-3.5" /> Watch live
        </span>
      )}
    </Link>
  );
}

export function TeamLogo({ name, logo, size = "sm" }: { name: string; logo?: string | null; size?: "sm" | "lg" }) {
  const box = size === "lg" ? "h-12 w-12 text-sm" : "h-6 w-6 text-[10px]";
  if (logo) {
    return (
      <img
        src={logo}
        alt={`${name} logo`}
        loading="lazy"
        className={`${box} shrink-0 rounded-md object-contain`}
      />
    );
  }
  return (
    <span className={`${box} grid shrink-0 place-items-center rounded-md bg-muted font-bold uppercase text-muted-foreground`}>
      {name.slice(0, 2)}
    </span>
  );
}

function TeamRow({ name, logo, score, batting }: { name: string; logo?: string | null; score: string; batting?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={`flex min-w-0 items-center gap-2 text-sm ${batting ? "font-bold text-foreground" : "font-medium text-muted-foreground"}`}>
        <TeamLogo name={name} logo={logo} />
        <span className="truncate">{name}</span>
        {batting && <span className="text-neon-blue">•</span>}
      </span>
      <span className="text-sm font-bold tabular-nums">{score}</span>
    </div>
  );
}
