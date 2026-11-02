# POKER ROYALE ULTIMATE

**One Table. Eight Players. One Crown.**

Free, browser-based Texas Hold'em tournaments for 2–8 players, using fictional chips only. No purchases, wagering with money, cash-outs or monetary prizes.

## Architecture

- React 19 + TypeScript, Tailwind CSS and authored CSS animations.
- Vinext/Cloudflare Worker server routes, Cloudflare D1 durable storage.
- A pure server-side poker engine (`lib/poker/engine.ts`).
- Authenticated HTTPS state synchronization every 750 ms; the hosted Site platform currently does not provision per-room WebSocket workers.
- Per-room optimistic compare-and-swap revisions serialize changes across Worker instances. Turn identifiers reject duplicate or stale actions.
- 256-bit anonymous bearer credentials, stored hashed on the server and remembered in browser storage. A separate guest identity may be created for a single tab.
- Cryptographic Fisher–Yates shuffle with rejection sampling; no modulo bias.
- Explicit player-specific state projection. Deck and other hidden hole cards are never serialized to unauthorized clients.
- Server-derived statistics/achievements and rate-limited, filtered chat.

## Play

1. Choose a nickname and create a public/private table, or join with its six-character code.
2. Share the invite link. Two to eight people may sit before play begins.
3. Every player starts with 10,000 chips. Private hosts start the game; any seated player can start a public game.
   Choose **Play with Bot** to start a solo tournament against server-run rivals. In a shared waiting room, the host can propose bots and the seated humans vote before they are added.
4. Two private cards plus five community cards form the best five-card poker hand. Check, call, raise, fold or go all-in. Raise inputs are total bets for the current betting round.
5. Turns last 25 seconds. A timed-out player checks if possible, otherwise folds.
6. Blinds start at 50/100 and rise every three minutes, effective on the next hand. Side pots, ties, odd chips and short all-ins are handled server-side.
7. Eliminated players can watch and chat. Last player holding chips wins the crown.
8. Private hosts can pause at most three times, up to two minutes each. A paused clock resumes automatically on the next server request after expiry.

## Local setup

Requires Node.js 24 (or >=22.13 with TypeScript stripping), pnpm, and the repository dependencies.

```sh
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit
node --experimental-strip-types --test tests/engine.test.ts
pnpm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_mean_living_mummy.sql
pnpm run dev
```

Do not replay an already applied migration. The included Sites scripts select the managed development environment automatically; outside it, consult `scripts/execution-profile.mjs` and the deployment guide. Do not commit browser identities, database contents, environment secrets or runtime directories.

## Tests

```sh
node --experimental-strip-types --test tests/engine.test.ts
BASE_URL=https://YOUR-DEPLOYMENT node tests/http.test.mjs
```

The integration runner creates disposable private rooms and independent anonymous clients on its specified target. It waits for a real server turn deadline; allow about one minute. Run only against a deployment you own. See `docs/TESTING.md` for observed results and remaining verification gaps.

## Deployment

See `docs/DEPLOYMENT.md`. The supplied source is deployed using Sites to a public HTTPS origin. The site audience must be public to permit guests without ChatGPT accounts. The `.openai/hosting.json` file identifies the current Site; create a new project identity when deploying a fork.

See [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) for the requirement-by-requirement coverage audit and verification limits.

## Known limits

- This release uses short polling, with roughly 750 ms synchronization plus network latency. It is not a persistent WebSocket service and has not been load-tested at scale.
- Deadlines are authoritative but processed on incoming requests. Host disconnection does not stop a room while any player/spectator keeps it open. **If all clients close, the server catches up expired turns on return; no autonomous background work runs in an empty room.** A persistent Node/Socket.IO service or Durable Objects with alarms is needed for that stronger guarantee. Railway is an optional external hosting path, not a connected dependency.
- D1 replaces PostgreSQL; CSS animations replace Framer Motion. These are intentional hosting-compatible substitutions.
- Identity recovery is device-local. Clearing storage or losing the anonymous token loses access; there is no cross-device login/account recovery. Tokens are secrets; do not share them.
- Statistics aggregate the most recent 200 tables for the current identity. Local guests are separate identities.
- Moderation: local mute, private-host chat mute, stored reports and automatic mute after three distinct reports. There is no staffed moderation queue. Anonymous identities can be recreated; filtering is basic English profanity filtering, not comprehensive abuse prevention.
- Bot strategy is a lightweight, intentionally imperfect heuristic, not a strong poker solver. Bot turns run on server requests, so a bot may wait for the next poll before acting. Rooms are single-table tournaments with no rebuys or multi-table seating. There is no real money or monetary prize.
- No guarantee of five-nines availability or unlimited free hosting capacity. End users have no payment flow.

## Key files

- `app/page.tsx`: all player screens and client synchronization.
- `app/globals.css`: responsive royal casino visual design.
- `app/api/game/route.ts`: sessions, rooms, chat, reports, statistics and authorized actions.
- `lib/poker/engine.ts`: state transitions, evaluation, side pots and private views.
- `db/schema.ts`, `drizzle/`: durable schema and migrations.
- `tests/`: repeatable engine and HTTP integration checks.
