import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Zap, Radio, ArrowRight } from "lucide-react";
import logoAsset from "@/assets/logo_for_web.png.asset.json";
import { useMatches } from "@/lib/use-matches";
import { MatchCard } from "@/components/MatchCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ESAG Premier League" },
      {
        name: "description",
        content:
          "Register as a player, form a team, and bid live for your squad at the ESAG cricket auction.",
      },
      { property: "og:title", content: "ESAG Cricket Auction" },
      {
        property: "og:description",
        content: "Live player bidding for the ESAG cricket match.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-neon-blue animate-pulse" />
          Engineering Students' Association Gampaha
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
          <span className="text-foreground">ESAG</span>
           <br />
          <span className="text-neon-purple">
            Premier League
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Welcome to the official ESAG Cricket Player Auction. An intelligent
          auction platform that combines AI-driven player analysis, live
          bidding, and real-time team management to create a fair and exciting
          squad selection experience.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            to="/matches"
            className="rounded-lg bg-gradient-neon px-6 py-3 font-semibold text-primary-foreground "
          >
            <span className="h-1.5 w-1.5 rounded-full bg-black animate-pulse" />
            Watch Live
          </Link>
          <Link
            to="/auth"
            className="rounded-lg border border-border bg-card/60 px-6 py-3 font-semibold backdrop-blur"
          >
            Get started
          </Link>
        </div>
      </section>

      <MatchesSnapshot />


      {/* Features 
      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-24 sm:grid-cols-3">
        {[
          {
            icon: Zap,
            title: "AI-graded players",
            body: "Skill and fitness scoring assigns each player a category and base price automatically.",
          },
          {
            icon: Radio,
            title: "Live auction streaming",
            body: "Every team sees the current player, last bid, and their remaining budget in real time.",
          },
          {
            icon: Users,
            title: "Smart Squad Management",
            body: "Manage your team's roster throughout the auction. Unsold players automatically return in later rounds until every squad is complete.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="rounded-2xl border border-border bg-card/60 p-6 shadow-card backdrop-blur"
          >
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-neon-soft">
              <Icon className="h-5 w-5 text-neon-blue" />
            </div>
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>
      */}
    </div>
  );
}

function MatchesSnapshot() {
  const { live, upcoming, loading } = useMatches();
  const shown = [...live, ...upcoming].slice(0, 3);

  return (
    <section className="mx-auto max-w-6xl px-6 pb-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {live.length > 0 ? "Live & upcoming matches" : "Upcoming matches"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Scores, fixtures and the official live stream — updated in real time.
          </p>
        </div>
        <Link
          to="/matches"
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-card/60 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-muted"
        >
          All matches & live stream <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
          {loading ? "Loading matches…" : "No matches scheduled yet — check back soon."}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((m) => (
            <MatchCard key={m.id} match={m} compact />
          ))}
        </div>
      )}
        <div style="margin-top: 10px; margin-bottom: 15px;">
          <h2 className="text-2xl font-bold tracking-tight">
            Our Sponsors
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
          </p>
           <div> 
             <img src="https://i.pinimg.com/736x/1c/68/6e/1c686eea5580f43241c7fc23df12e698.jpg"></img>
           </div>
        </div>
    </section>
  );
}
