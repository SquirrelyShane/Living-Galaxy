# 0.3.93 — ARIA Core: experience, live goals and dialogue

Built on upstream **4584b5d — “0.3.92 patch plus aria improvement”**, fetched 2026-10-04.

## Player-visible changes

- NAV → ARIA CORE follows the actual mission step, status and interrupted work.
  Career contracts retain their existing repair/resume behavior; at-the-conn
  work replans after repair. The Core does not falsely restore an old saved
  mission as running.
- Player observations transfer between related actions (for example MINE and
  a mining board contract). Comparisons consider hull, cargo, charge, docking
  and nearby danger. ARIA's own actions do not become captain habits.
- Learning now affects career-sized scores. Impossible or unauthorized conn
  candidates cannot be revived by a strong preference. Standing orders and
  execution-time spending checks still decide what she may do.
- Confidence considers successes, failures and prediction error. More failed
  runs no longer make ARIA more confident simply by increasing the sample count.
  Expected credits and duration are explicitly historical averages, not promises.
- Visits and crew changes enter a bounded episodic memory. People are referenced
  by identity in CRADLE/GDB; there is no second person database. Important older
  encounters survive alongside recent events. Observations expire and display
  as stale rather than silently remaining current.
- Ask ARIA about her work. The selected LFM2-700M-Q4_K_M model runs on demand
  through a bounded relay endpoint; the ship log answers when it is unavailable.
  Model text has no command authority. Captain switches clear the conversation
  and discard late replies from the prior captain.

Saved v2 minds retain their authority toggles, orders, experience and habits.
The earlier v1 migration still resets the obsolete withheld-by-default gates.
Live mission state is not resumed from storage. Observations and preferences
remain local to this browser's captain and sky; this is not account-wide sync.

The 0.3.92 close-range salvage, debris reeling, frame matching and hulk rendering
changes are preserved byte-for-byte. The 0.3.91 shared-hulk fixes and 0.3.88 mining/repair fixes remain intact.
A healthy hull does not retreat solely because rogue drones are nearby.

## Deployment

There is no frontend compilation step. Apply the supplied Git patch to a clean
0.3.92 checkout, deploy the changed game files using the existing workflow, and
hard-refresh the browser. Deploy `server.py` to the relay as well if enabling
model dialogue. Model installation is separate and optional: see
[ARIA-DIALOGUE.md](ARIA-DIALOGUE.md).

The patch includes two new runtime modules, `js/aria/memory.js` and
`js/aria/conversation.js`; deploy them with their importers. It also changes the
`/llm/proxy` request contract from a generic proxy to bounded ARIA requests.
The existing comms provider that directly calls a configured llama.cpp endpoint
is not changed.

## Validation

Passed:

- Existing ARIA mind and captain-switch integration tests; console 11 and boot
  23 checks.
- Mining-loop regression (low charge waits; recharge resumes; stuck power fails
  explicitly; proximity alone never breaks work off).
- ARIA loop, repair, investment, career, business, senses, the updated upstream
  salvage-loop and hulkwire suites, mission and recorder checks.
- New shared-learning tests: contextual transfer, source isolation, meaningful
  score scaling, failure confidence, prediction error, interruptions, memory
  bounds and v2 migration. Port/crew observation tests cover joins, departures,
  stale facts and captain isolation.
- New dialogue and Core DOM tests: one request, fallback, cancellation, captain
  isolation, live mission/memory repaint, input draft preservation, authority
  controls and inert model text.
- Real HTTP tests against a mock Ollama: bounds, host-owned model and endpoint,
  global concurrency/cooldown, oversized/malformed bodies, redirect refusal and
  recovery after model errors.
- Persistent Sol: zero-player simulation, authenticated writes, checkpoint and
  news restore, host/relay restart and simulation resumption.

The browser smoke test is included (`test/smoke-aria-core.mjs`) but could not run
here: Chromium's process socket was refused by the execution environment. DOM
checks do not establish mobile layout or visual quality. Real LFM2 inference,
Ollama installation and mpcbb performance remain to be checked on that machine.
No changes have been deployed to the live game or pushed to origin.
