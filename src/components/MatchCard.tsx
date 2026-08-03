import { Link } from "@tanstack/react-router";
import { Radio, CalendarDays, MapPin } from "lucide-react";
import type { Match } from "@/lib/matches";
import { formatMatchDate, scoreLine } from "@/lib/matches";

export function LiveDot() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" /> Live
    </span>
  );
}

export function MatchCard({ match, compact = false }: { match: Match; compact?: boolean }) {
  const isLive = match.status === "live";
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur shadow-card">
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
          score={match.status === "upcoming" ? "—" : scoreLine(match.team_a_score, match.team_a_wickets, match.team_a_overs)}
          batting={isLive && match.batting_team === match.team_a_name}
        />
        <TeamRow
          name={match.team_b_name}
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
        <Link
          to="/matches"
          className="mt-4 inline-flex items-center gap-1 rounded-md bg-gradient-neon px-3 py-1.5 text-xs font-semibold text-primary-foreground"
        >
          <Radio className="h-3.5 w-3.5" /> Watch live
        </Link>
      )}
    </div>
  );
}

function TeamRow({ name, score, batting }: { name: string; score: string; batting?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={`text-sm ${batting ? "font-bold text-foreground" : "font-medium text-muted-foreground"}`}>
        {name} {batting && <span className="text-neon-blue">•</span>}
      </span>
      <span className="text-sm font-bold tabular-nums">{score}</span>
    </div>
  );
}
