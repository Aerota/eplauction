# EPL — ESAG Cricket Player Auction & Match Centre

A live cricket player-auction and match-scoring platform for the Engineering Students' Association Gampaha (ESAG).

It has three sides:

- **Public** — landing page, sponsors banner, match centre with live scores, ball-by-ball commentary and YouTube live/highlight video.
- **Team managers** — register a team with a logo, get a budget, bid live in the auction, track squad strength.
- **Admin** — approve/categorise players (AI-assisted), run the auction (set current player, sell, mark unsold, start next round), manage teams, matches, live scoring and sponsor banners.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | TanStack Start v1 (React 19, SSR) |
| Router | TanStack Router (file-based routing) |
| Build | Vite 7 |
| Data fetching | TanStack Query |
| Styling | Tailwind CSS v4 (`src/styles.css` theme tokens) + shadcn/ui |
| Backend | Lovable Cloud (Postgres, Auth, Storage, Realtime) |
| AI | Lovable AI Gateway (Gemini) for player analysis |

### Running locally

```sh
npm i
npm run dev      # dev server on :8080
npm run build    # production build
npm run lint     # eslint
```

---

## Root files

| File | What it does |
| --- | --- |
| `package.json` | Dependencies and npm scripts (`dev`, `build`, `preview`, `lint`, `format`). |
| `vite.config.ts` | Vite setup: TanStack Start plugin, Tailwind v4 plugin, path aliases, dev server port. |
| `tsconfig.json` | TypeScript config, including the `@/*` → `src/*` path alias. |
| `components.json` | shadcn/ui generator config (paths, style, aliases). |
| `eslint.config.js` | Flat ESLint config (TypeScript, React hooks, Prettier). |
| `.prettierrc` / `.prettierignore` | Code formatting rules. |
| `bunfig.toml`, `bun.lock`, `package-lock.json` | Package-manager lockfiles/config. |
| `.env` | Auto-generated backend connection variables. Do not edit by hand. |
| `AGENTS.md` | Notes for AI agents working in this repo. |
| `public/` | Static files served as-is (favicon, robots, etc.). |

---

## `src/` — application entry points

| File | What it does |
| --- | --- |
| `src/router.tsx` | Creates the TanStack Router instance, wires in the generated route tree and the TanStack Query client. |
| `src/routeTree.gen.ts` | **Auto-generated** route tree. Never edit — it is rebuilt from `src/routes/`. |
| `src/server.ts` | Server entry used for SSR request handling. |
| `src/start.ts` | TanStack Start instance: registers request middleware and the client-side middleware that attaches the auth bearer token to server functions. |
| `src/styles.css` | Global stylesheet and the design system: neon blue/purple colour tokens, gradients, glow utilities, dark theme variables. All colours used in components come from here. |

---

## `src/routes/` — pages (file-based routing)

Filename maps to URL: `index.tsx` → `/`, `matches.tsx` → `/matches`, `match.$matchId.tsx` → `/match/:matchId`. Folders starting with `_` are layouts and do not appear in the URL.

| File | Route | What it does |
| --- | --- | --- |
| `__root.tsx` | — | App shell wrapping every page: html/head metadata, fonts, global `SiteHeader`, toast container, error boundaries, `<Outlet />`. |
| `README.md` | — | Short reference on routing conventions. |
| `index.tsx` | `/` | Landing page: EPL hero, feature highlights, match snapshot (live/upcoming), sponsors banner section, CTA into login. |
| `auth.tsx` | `/auth` | Login/registration with tabs for **Player**, **Team manager** and **Admin**. Remembers the chosen intent so a player can't later register a team and vice-versa. Supports `?tab=team` deep links. |
| `matches.tsx` | `/matches` | Public Match Centre — grid of live, upcoming and completed matches. |
| `match.$matchId.tsx` | `/match/:id` | Google-style scoreboard for one match: team logos and scores side by side, toss line, result summary, embedded YouTube live stream (live) or highlights (completed), and a realtime ball-by-ball feed. |
| `_authenticated/route.tsx` | — | Auth gate for everything beneath it: redirects signed-out users to `/auth` before any child loader runs. |
| `_authenticated/dashboard.tsx` | `/dashboard` | Post-login hub. Shows role-appropriate cards (register as player / register a team / open auction / admin console). |
| `_authenticated/player-registration.tsx` | `/player-registration` | Player profile form: photo, age, gender, role, batting/bowling style, experience, stats, fitness notes, achievements. Triggers the AI analysis used for categorisation. |
| `_authenticated/team-registration.tsx` | `/team-registration` | Team manager form: team name, manager name, logo upload. Team starts with the admin-configured budget. |
| `_authenticated/auction.tsx` | `/auction` | Team manager auction view. Realtime current player card, last bid and bidding team, quick +0.5M bid and custom higher bid, remaining budget and squad slots, plus cumulative batting/bowling strength of the squad. |
| `_authenticated/auction-control.tsx` | `/auction-control` | Admin auction cockpit: go live, pick the current player, watch bids stream in, sell to highest bidder, mark unsold, advance rounds 1→2→3, and run the pre-assigned round. |
| `_authenticated/admin.tsx` | `/admin` | Admin console with tabs for Players, Teams, Matches and Sponsors: detail popups, edit team (name, manager, logo, budget), category/base-price assignment, deletes, and reset of player assignments. |

---

## `src/components/`

| File | What it does |
| --- | --- |
| `SiteHeader.tsx` | Global header used on every page: EPL logo, navigation (Home, Matches, Auction, Dashboard/Admin) and sign-in/sign-out state. |
| `MatchCard.tsx` | Compact match tile: team logos next to team names (no shadow), scores, status badge, links to the match detail page. |
| `admin/MatchesAdmin.tsx` | Admin match manager: create/edit matches with team dropdowns (pulled from registered teams) plus manual entry, venue and date, toss winner/decision, status (upcoming/live/completed), YouTube live link and highlight link, fast scoring buttons (+1, +2, +4, +6, wicket, wide, no-ball) and the ball-by-ball commentary panel with auto-incrementing over/ball. |
| `admin/SponsorsAdmin.tsx` | Uploads, replaces and deletes the two sponsor banner images (desktop 2400×600, mobile 1080×1350) stored in the `sponsors` bucket. |
| `ui/*` | shadcn/ui primitives (button, card, dialog, tabs, select, table, toast/sonner, etc.). Styled through the tokens in `styles.css`; generally not edited directly. |

---

## `src/lib/` — hooks, helpers and server logic

| File | What it does |
| --- | --- |
| `utils.ts` | `cn()` class-name merge helper (clsx + tailwind-merge). |
| `matches.ts` | Match domain helpers: `Match`/`MatchEvent` types, event types and labels, `tossLine()`, `youtubeEmbedUrl()` (normalises watch/youtu.be/live/embed URLs), `formatMatchDate()`, `scoreLine()`. |
| `use-matches.ts` | Realtime list of all matches for the Match Centre and landing snapshot. |
| `use-match.ts` | Realtime single-match subscription for the detail page. |
| `use-match-events.ts` | Realtime ball-by-ball commentary feed for a match. |
| `use-team-logos.ts` | Fetches team branding through the public `get_team_logos()` backend function and exposes `logoFor(teamName)` so logos render even for signed-out visitors. |
| `use-sponsors.ts` | Loads the desktop/mobile sponsor banner URLs from storage/site content. |
| `use-role.ts` | Resolves the signed-in user's role (`admin`, `team_manager`, `player`) for route and UI gating. |
| `players.functions.ts` | Server functions for player workflows (AI analysis, categorisation and related privileged writes). |
| `ai-gateway.server.ts` | Server-only wrapper around the Lovable AI Gateway (Gemini). Turns raw player details into a category suggestion, skill/fitness scores and a batting/bowling strength summary. |
| `error-capture.ts`, `error-page.ts`, `lovable-error-reporting.ts` | Runtime error capture, the fallback error page and error reporting plumbing. |

---

## `src/integrations/`

| File | What it does |
| --- | --- |
| `supabase/client.ts` | Browser backend client (respects row-level security). **Auto-generated — do not edit.** |
| `supabase/client.server.ts` | Server-side clients, including the privileged admin client used only inside verified handlers. Auto-generated. |
| `supabase/auth-middleware.ts` | `requireSupabaseAuth` middleware for protected server functions. Auto-generated. |
| `supabase/auth-attacher.ts` | Client middleware that attaches the session bearer token to server-function calls. Auto-generated. |
| `supabase/types.ts` | Generated TypeScript types for every table, enum and database function. Auto-generated. |
| `lovable/index.ts` | Lovable platform integration glue. |

## `src/hooks/`

| File | What it does |
| --- | --- |
| `use-mobile.tsx` | Media-query hook used for responsive behaviour (e.g. desktop vs mobile sponsor banner). |

## `src/assets/`

`logo_for_web.png` — the EPL logo used in the header, favicon and hero. The `.asset.json` sidecar is Lovable asset metadata.

---

## `supabase/` — backend

| Path | What it does |
| --- | --- |
| `config.toml` | Backend project config. Auto-generated. |
| `migrations/*.sql` | Ordered schema history: tables, enums, row-level-security policies, grants and database functions. Each new backend change is a new migration file. |

### Database tables

| Table | Purpose |
| --- | --- |
| `profiles` | One row per user (name, email), created by a trigger on sign-up. |
| `user_roles` | Role assignments (`admin`, `team_manager`, `player`) in a separate table for safety. Checked with `has_role()`. |
| `auction_settings` | Single-row auction state: budget, players per team, base prices per category, bid increment, current player, current bid and bidding team, round number, live flag. |
| `teams` | Team name, manager, logo and remaining budget. |
| `players` | Player profile, AI category/scores, base price, status (`pending`/`available`/`sold`/`unsold`/`pre_assigned`), sold team and price. |
| `player_contacts` | Email/phone kept separate from `players` and readable only by the owner or an admin. |
| `bids` | Immutable bid log per player and team. |
| `matches` | Fixtures and live scores: teams, logos, venue, date, status, scores/wickets/overs per side, toss, commentary, result, YouTube live and highlight URLs. |
| `match_events` | Ball-by-ball events (innings, over, ball, runs, event type, description). |
| `site_content` | Key/value store for editable site content such as sponsor banner URLs. |

### Database functions

| Function | Purpose |
| --- | --- |
| `has_role(user, role)` | Security-definer role check used by every policy. |
| `claim_admin_role()` | Lets the designated admin email claim the admin role once. |
| `place_bid(amount)` | Validates budget, squad slots, live state and minimum increment, then records the bid and updates auction state. |
| `set_current_player(id)` | Admin puts a player on the block and goes live. |
| `sell_current_player()` | Admin finalises the sale to the highest bidder and debits the team budget. |
| `mark_current_unsold()` | Admin marks the current player unsold for this round. |
| `start_next_round()` | Re-queues unsold players into the next round (max 3 rounds). |
| `pre_assign_player(player, team)` | Assigns a pre-round player to a team at zero cost. |
| `reset_player_assignment(player)` | Undoes a sale/assignment and refunds the budget. |
| `set_auction_live(bool)` | Toggles the live flag. |
| `get_team_logos()` | Public, PII-free team name + logo lookup for signed-out visitors. |

### Storage

| Bucket | Contents |
| --- | --- |
| `sponsors` | Sponsor banner images uploaded from the admin Sponsors tab. |

---

## Auction flow in short

1. Players register → admin reviews AI analysis → assigns category A (2M) / B (1M) / C (0.5M).
2. Managers register teams and receive the configured budget.
3. Pre-assigned round: each team picks two published players (one boy, one girl).
4. Admin goes live and puts players up one at a time. Managers bid in 0.5M steps or enter a higher custom bid.
5. Admin sells to the highest bidder or marks unsold.
6. Unsold players automatically return in rounds 2 and 3 until squads are full.

## Notes

- `src/routeTree.gen.ts`, `src/integrations/supabase/*` and `.env` are generated — changes there are overwritten.
- All colours must come from the tokens in `src/styles.css`; avoid hard-coded colour utilities so the neon theme stays consistent.
