# Verification notes

## Automated checks

Run the poker engine and rank frequency tests with:

```sh
node --experimental-strip-types --test tests/engine.test.ts tests/rank-distribution.test.ts
```

Most recent run: **23 passed, 0 failed** (22 engine checks and 1 exhaustive rank-frequency check). The engine suite covers hand categories and kickers, blinds and action order, legal raises, all-ins, side pots, split pots, chip conservation, eliminations, blind escalation, server deadlines, pause limits, bot voting, and player-specific private-card projections. The independent rank test checks the exact frequency of every category across all 2,598,960 five-card combinations.

For server and storage integration, run against a deployment you control:

```sh
BASE_URL=https://YOUR-DEPLOYMENT node tests/http.test.mjs
```

This runner creates disposable rooms and independent anonymous player credentials. It exercises spectator privacy, turn validation, duplicate action rejection, reconnection, private-host pause permissions, chat synchronization, timeout progression without the host client, and a complete tournament. It waits for one 25-second server deadline.

Most recent production run on 2026-11-02 against release v8: **20 passed, 0 failed**. It covers the bot proposal/majority-vote flow, rejects a spectator vote, verifies server-run bot action, and confirms bot cards stay private. The duplicate-action check uses the server-issued initial turn snapshot so it is independent of later turn-timer expiry. See [`http-test-results.txt`](http-test-results.txt).

## Browser checks

On 2026-11-02, production v9 was exercised in two browser tabs using distinct anonymous sessions. The second player joined by room code; both clients showed the same hand, board, pot, turn, chip totals, and champion result. Each tab showed its own two private cards. The players completed a tournament through the browser controls. A prior 2026-10-29 check on v4 also confirmed refresh recovery for both seats.

## Transport and background work

Production runs authenticated state polling at 750 ms plus network latency. The Sites publisher accepted the Worker build but did not provision the Durable Object binding, so the deployed build does not claim persistent WebSocket connections. While any participant or spectator is connected, server requests enforce deadlines and advance bot turns. If every browser closes, expired turns are processed when the next client reconnects; there is no autonomous scheduler for empty rooms.

No load test, multi-region soak test, or automated mobile-device run has been performed.
