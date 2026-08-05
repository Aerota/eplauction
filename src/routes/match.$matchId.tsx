import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Radio, MapPin, CalendarDays, Film } from "lucide-react";
import { useMatch } from "@/lib/use-match";
import { useMatchEvents } from "@/lib/use-match-events";
import { youtubeEmbedUrl, formatMatchDate, tossLine, EVENT_LABELS, ballLabel } from "@/lib/matches";
import { LiveDot, TeamLogo } from "@/components/MatchCard";

export const Route = createFileRoute("/match/$matchId")({
  head: () => ({
    meta: [
      { title: "Match Centre — ESAG Premier League" },
      {
        name: "description",
        content:
          "Full scoreboard for this ESAG Premier League cricket match: live stream, live score, toss details and ball-by-ball commentary.",
      },
      { property: "og:title", content: "EPL Match Centre" },
      { property: "og:description", content: "Live score, stream, highlights and ball-by-ball commentary." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MatchDetailPage,
});

function MatchDetailPage() {
  const { matchId } = Route.useParams();
  const { match, loading } = useMatch(matchId);
  const { events } = useMatchEvents(matchId);

  if (loading) return <p className="mx-auto max-w-5xl px-6 py-16 text-sm text-muted-foreground">Loading match…</p>;
  if (!match)
    return (
      <div className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-sm text-muted-foreground">This match could not be found.</p>
        <Link to="/matches" className="mt-3 inline-block text-sm text-neon-blue">
          ← Back to matches
        </Link>
      </div>
    );

  const isLive = match.status === "live";
  const stream = isLive ? youtubeEmbedUrl(match.youtube_url) : null;
  const highlights = match.status === "completed" ? youtubeEmbedUrl(match.highlight_url) : null;
  const video = stream ?? highlights;
  const toss = tossLine(match);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <Link to="/matches" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> All matches
      </Link>

      {/* Scoreboard header */}
      <section className="mt-4 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          {isLive ? (
            <LiveDot />
          ) : (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {match.status}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" /> {formatMatchDate(match.match_date)}
          </span>
          {match.venue && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {match.venue}
            </span>
          )}
        </div>

        <div className="mt-6 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4">
          <TeamSide name={match.team_a_name} logo={logoFor(match.team_a_name, match.team_a_logo_url)} batting={isLive && match.batting_team === match.team_a_name} />
          <div className="text-center">
            {match.status === "upcoming" ? (
              <div className="text-sm font-semibold text-muted-foreground">Match yet to begin</div>
            ) : (
              <div className="flex items-center justify-center gap-4">
                <div className="text-2xl font-extrabold tabular-nums sm:text-3xl">
                  {match.team_a_score}/{match.team_a_wickets}
                  <div className="text-xs font-medium text-muted-foreground">({match.team_a_overs} ov)</div>
                </div>
                <span className="text-xs font-semibold uppercase text-muted-foreground">vs</span>
                <div className="text-2xl font-extrabold tabular-nums sm:text-3xl">
                  {match.team_b_score}/{match.team_b_wickets}
                  <div className="text-xs font-medium text-muted-foreground">({match.team_b_overs} ov)</div>
                </div>
              </div>
            )}
          </div>
          <TeamSide name={match.team_b_name} logo={logoFor(match.team_b_name, match.team_b_logo_url)} batting={isLive && match.batting_team === match.team_b_name} />
        </div>

        <div className="mt-4 space-y-1 text-center">
          {match.result_summary && <p className="text-sm font-semibold text-neon-blue">{match.result_summary}</p>}
          {toss && <p className="text-xs text-muted-foreground">{toss}</p>}
        </div>
        {match.commentary && (
          <p className="mt-3 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">{match.commentary}</p>
        )}
      </section>

      {/* Video */}
      {video && (
        <section className="mt-6 rounded-2xl border border-border bg-card/60 p-5 backdrop-blur">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            {stream ? (
              <>
                <Radio className="h-4 w-4 text-destructive" /> Live stream
              </>
            ) : (
              <>
                <Film className="h-4 w-4 text-neon-purple" /> Match highlights
              </>
            )}
          </h2>
          <div className="aspect-video w-full overflow-hidden rounded-xl border border-border">
            <iframe
              src={video}
              title={stream ? "Live match stream" : "Match highlights"}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      )}

      {/* Ball by ball */}
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">Ball by ball</h2>
        {events.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
            No commentary yet.
          </p>
        ) : (
          <ol className="space-y-2">
            {events.map((e) => (
              <li key={e.id} className="flex gap-3 rounded-xl border border-border bg-card/50 p-3">
                <span className="mt-0.5 min-w-12 rounded-md bg-muted px-2 py-1 text-center text-xs font-bold tabular-nums">
                  {ballLabel(e.over_number, e.ball_number)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                        e.event_type === "wicket"
                          ? "bg-destructive/20 text-destructive"
                          : e.event_type === "four" || e.event_type === "six"
                            ? "bg-gradient-neon text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {EVENT_LABELS[e.event_type] ?? e.event_type}
                    </span>
                    {e.runs > 0 && <span className="text-xs font-semibold tabular-nums">{e.runs} run{e.runs > 1 ? "s" : ""}</span>}
                    {e.team_name && <span className="text-[11px] text-muted-foreground">{e.team_name}</span>}
                  </div>
                  {e.description && <p className="mt-1 text-sm text-foreground/90">{e.description}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function TeamSide({ name, logo, batting }: { name: string; logo: string | null; batting?: boolean }) {
  return (
    <div className="flex w-24 flex-col items-center gap-2 text-center sm:w-32">
      <TeamLogo name={name} logo={logo} size="lg" />
      <span className={`text-xs font-semibold sm:text-sm ${batting ? "text-neon-blue" : "text-foreground"}`}>
        {name}
      </span>
    </div>
  );
}
