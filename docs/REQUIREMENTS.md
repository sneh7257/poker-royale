# Requirements coverage

This audit describes the current public release and separates implemented behavior from verification gaps.

| Requirement | Coverage | Evidence or limit |
| --- | --- | --- |
| Public HTTPS game with no accounts or software installation | Implemented | Browser nickname and anonymous session; public Site URL. |
| Fictional chips only, no purchases, cash-outs, or monetary prizes | Implemented | No payment or prize flow; game copy and rules say fictional chips. |
| Public lobby and private six-character rooms | Implemented | Public room browser excludes private rooms; private joining uses an invite code. |
| 2–8 seats; 10,000 starting chips | Implemented | Server validates capacity and creates each seat with 10,000 chips. |
| No-limit Hold’em, betting, blinds, showdown, side pots, ties, eliminations | Implemented | Server-authoritative engine; automated tests cover hand ranks, raises, all-ins, side pots, odd chips, chip conservation, and tournament completion. |
| Secure shuffle and private cards | Implemented | Cryptographic rejection-sampled shuffle; server projects only the current player's cards, with eligible showdown reveals. Automated privacy tests cover players and spectators. |
| Solo bots and host-proposed bots with a table vote | Implemented | Bots act through the server engine. Human majority voting and spectator vote rejection are covered by the HTTP integration suite. Solo table creation directly fills the requested seats. |
| Reconnection after refresh or temporary network loss | Implemented with a device limit | Anonymous identity and room are remembered in local/session storage. Recovery requires the same browser storage; clearing it loses the identity. |
| Server-authoritative 25-second turns and host-independent play | Implemented while a client remains connected | Server advances deadlines on authenticated requests. The integration test disconnects the host while another independent client drives timeout progression. |
| Real-time synchronization | Implemented using short polling | Clients refresh room state every 750 ms plus network latency. This is not a persistent WebSocket connection and has not been load-tested. |
| Tournament progression when every browser is closed | Not autonomous | No scheduled background worker is provisioned for this Site. Expired actions catch up when a client reconnects. |
| Chat, emoji reactions, mute, profanity filtering, reports, moderation | Implemented with basic safeguards | Chat and reactions use the same server-validated channel. Reports are stored and three distinct reports mute a player. There is no staffed moderation queue and filtering is not comprehensive. |
| Profiles, achievements, tournament stats, leaderboard | Implemented | Profile choices are validated by the server; stats and achievements are derived from saved game state. The leaderboard is per tournament. |
| Responsive casino presentation and victory celebration | Implemented in the interface | CSS includes mobile breakpoints, card/chip styling, animations, and celebration variants. No automated real-device mobile run has been recorded. |
| Preferred React/TypeScript/Tailwind/Framer Motion/Node/Socket.IO/PostgreSQL stack | Partially substituted for hosting compatibility | React and TypeScript are used. CSS animations replace Framer Motion; Cloudflare Workers and D1 replace Node/Socket.IO/PostgreSQL. D1 compare-and-swap updates serialize concurrent room mutations. |
| Production-scale reliability | Not verified | No load, soak, or multi-region test; hosting capacity and free-tier limits are not guaranteed. |

## Verification status

Engine tests exhaustively compare five-card category frequencies and cover poker transitions, tournament outcomes, voting, and private views. The HTTP integration suite uses independent anonymous credentials against a deployment to check synchronization, authorization, privacy, reconnection, host disconnection, bot voting, and a full tournament. A 2026-11-02 two-tab production run with distinct guest sessions also completed a tournament and confirmed synchronized play and separate private cards. See [`TESTING.md`](TESTING.md) for the latest run details.
