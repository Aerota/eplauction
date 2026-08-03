import { createFileRoute } from "@tanstack/react-router";
import { Radio, Tv } from "lucide-react";
import { useMatches } from "@/lib/use-matches";
import { youtubeEmbedUrl, formatMatchDate, scoreLine } from "@/lib/matches";
import { MatchCard, LiveDot } from "@/components/MatchCard";

export const Route = createFileRoute("/matches")({
  head: () => ({
    meta: [
      { title: "Live Scores & Fixtures — ESAG Premier League" },
      {
        name: "description",
        content:
          "Follow ESAG Premier League live cricket scores, ball-by-ball updates, the live YouTube stream, upcoming fixtures and past results.",
      },
      { property: "og:title", content: "EPL Live Scores & Fixtures" },
      {
        property: "og:description",
        content: "Live scores, live stream and upcoming ESAG Premier League cricket matches.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MatchesPage,
});

function MatchesPage() {
  const { live, upcoming, completed, loading } = useMatches();
  const streamMatch = live.find((m) => youtubeEmbedUrl(m.youtube_url));
  const embed = youtubeEmbedUrl(streamMatch?.youtube_url);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Matches</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Live scores, the official stream, upcoming fixtures and completed results.
        </p>

        {embed && streamMatch && (
          <section className="mt-8 rounded-2xl border border-border bg-card/60 p-5 backdrop-blur">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <LiveDot />
              <h2 className="text-sm font-semibold">
                {streamMatch.team_a_name} vs {streamMatch.team_b_name}
              </h2>
              <span className="text-xs text-muted-foreground">{formatMatchDate(streamMatch.match_date)}</span>
            </div>
            <div className="aspect-video w-full overflow-hidden rounded-xl border border-border">
              <iframe
                src={embed}
                title="Live match stream"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ScoreBox
                name={streamMatch.team_a_name}
                value={scoreLine(streamMatch.team_a_score, streamMatch.team_a_wickets, streamMatch.team_a_overs)}
              />
              <ScoreBox
                name={streamMatch.team_b_name}
                value={scoreLine(streamMatch.team_b_score, streamMatch.team_b_wickets, streamMatch.team_b_overs)}
              />
            </div>
            {streamMatch.commentary && (
              <p className="mt-3 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">{streamMatch.commentary}</p>
            )}
          </section>
        )}

        <Section title="Live now" icon={<Radio className="h-4 w-4 text-destructive" />} items={live} empty="No match is live right now." />
        <Section title="Upcoming matches" icon={<Tv className="h-4 w-4 text-neon-blue" />} items={upcoming} empty="No upcoming fixtures announced yet." />
        <Section title="Results" icon={<Tv className="h-4 w-4 text-muted-foreground" />} items={completed} empty="No completed matches yet." />

        {loading && <p className="mt-8 text-sm text-muted-foreground">Loading matches…</p>}
      </div>
    </div>
  );
}

function ScoreBox({ name, value }: { name: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <div className="text-[11px] uppercase text-muted-foreground">{name}</div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function Section({
  title,
  icon,
  items,
  empty,
}: {
  title: string;
  icon: React.ReactNode;
  items: ReturnType<typeof useMatches>["matches"];
  empty: string;
}) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-semibold uppercase tracking-wide">{title}</h2>
      </div>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </section>
  );
}
