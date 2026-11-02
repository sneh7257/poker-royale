# Setup and deployment

## Existing Sites deployment

The source includes `.openai/hosting.json` with its assigned project identity and D1 binding `DB`. Use the Sites source workflow to commit/push the exact source, build the Worker, package it, save a version and deploy that version. New database migrations are applied during publication. Runtime secrets belong in the hosting environment, never in source. No third-party API secret is required for this game.

The current implementation uses server-side HTTP requests and a durable D1 database. An isolate's memory is not used as the source of truth. Bot voting and actions are stored within the room state; bots have server-generated identities and cannot submit their own client requests. All game mutations compare the loaded room revision in an atomic SQL UPDATE and retry on contention. Per-action turn numbers reject retries after an action has already been applied.

## Local use outside ChatGPT Work

Install dependencies with the included pnpm lockfile. The execution-profile scripts select the portable mode outside the managed environment. Run `pnpm run build` to create the local Wrangler configuration, apply pending migrations to the local D1 binding, then `pnpm run dev`. The local database is separate from production. To inspect a production-like build locally, use `pnpm start` after building and migrating.

## Stronger background execution

For continuous execution after all clients disconnect, port the transport/storage adapter to either:

1. A continuously running Node.js service (for example on Railway) with Socket.IO and PostgreSQL, using row locks per room and a durable deadline scheduler; or
2. A Cloudflare Durable Object per tournament, with persisted alarms and WebSocket sessions.

The pure engine is transport-independent, but neither optional adapter is included or deployed in this release. Do not claim that polling is equivalent to autonomous background execution. Confirm host pricing, limits and database provisioning before any paid deployment.

## Operational checks

- Test anonymous access to the public HTTPS link.
- Run the integration suite against the deployment you control.
- Check D1/Worker capacity and request limits before a large event.
- Verify persisted rooms survive publication.
- Keep player credentials out of URLs, chat, source and logs.
- A private invite code controls room discovery, not spectator confidentiality. Anyone with the code can watch public information; they never receive the deck or private cards.
