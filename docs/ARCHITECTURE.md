# Pitchfeed architecture

Two halves: a **Next.js web app** (`web/`) that owns the demo experience, and a **FastAPI engine** (`engine/`) that owns discovery, the graph, scoring, outreach, billing and the human-in-the-loop gate. The web app works on its own with demo data; set `ENGINE_URL` to proxy discovery to the engine.

## Core loop

```
Intake → ICP (LLM, confidence per field) → founder approves
  → Discovery (search → candidates; every claim = url + verbatim quote)
  → Citation validator (re-fetch the page, check the quote) → drop anything unverified
  → Negative filters (hiring freeze, wrong region)
  → Knowledge graph (Kùzu, deterministic MERGE writes)
  → Warm path (shortest path founder → buyer)
  → Score: fit 0–60 + intent 0–40 → tier A/B/C; temperature from signal age
  → Enrichment (Hunter + MX)       [metered, credit-gated]
  → Outreach: 3 touches from one cited signal → verifier → proof receipt
  → Feed → human swipe (only humans approve; logged)
  → Send (demo inbox only)          [metered] → Pipeline → Analytics
```

## Graph ontology (Kùzu)

**Nodes**

| Node | Key fields | What it is |
|---|---|---|
| `Founder` | id, name | You |
| `Company` | id, name, domain, industry | A prospect organization |
| `Person` | id, name, title | Buyers and connectors |
| `Product` | id, name | What you sell (Togather) |
| `Competitor` | id, name, category | Alternatives buyers could pick |
| `Signal` | id, type, text, url, days_ago | A cited reason to talk now (hiring, event, pain, funding) |
| `Org` | id, name, kind | Schools and programs (SJSU, CodePath, AI4ALL) |

**Edges**

| Edge | From → To | Meaning |
|---|---|---|
| `works_at` | Person → Company | Current job |
| `previously_employed_at` | Person/Founder → Company | Past job (warm-path hop) |
| `member_of` | Person/Founder → Org | Shared school or program (warm-path hop) |
| `has_signal` | Company → Signal | Cited reason to reach out |
| `matched_to` | Company → Product (score) | ICP match with fit score |
| `competes_with` | Competitor → Product | Market map |
| `contacted_via` | Person → Product (channel, ts) | An approved send |
| `replied_to` | Person → Product (ts) | A reply |

The engine also records `builds` (Founder → Product). Agents and LLMs **read** the graph; only deterministic code **writes** it, with idempotent `MERGE`.

### Warm-path query

```cypher
MATCH p = (f:Founder {id: $f})
          -[:member_of|works_at|previously_employed_at* SHORTEST 1..6]-
          (b:Person {id: $b})
RETURN p
```

The UI shows this query under the Warm network canvas, and every path opened is metered as a `graph_query` (0.1 credits).

## Citation validation loop

1. Discovery returns candidates where every claim is `{url, verbatim quote}`.
2. `validator.verify_quote(url, quote)` re-fetches the page (SSRF-guarded: http(s) to public IPs only), normalizes whitespace and checks the quote appears verbatim.
3. Unverified claims are dropped. A lead with no verified signal is dropped and listed under `/dropped` (the crew room says why, e.g. "hiring freeze", "outside the Bay Area").
4. Drafts are written from one verified signal only. The verifier checks the draft names the org, keeps the cited quote, has no hype or guarantees, no unsafe links, a sensible length and a closing question. The result is the **proof receipt** on the back of each card.
5. The web `/api/draft` route applies the same guard: a live Claude draft that drops the cited quote is discarded for the demo draft.

## Human-in-the-loop rules

- `POST /cards/{id}/approve` and `/reject` require `{actor: "human"}`. Any other actor is rejected, written to the audit log as `blocked_non_human_action`, and Security posts in the crew room.
- Sends go only to `DEMO_INBOX`. LinkedIn touches are copy-to-clipboard tasks; nothing auto-posts.
- Edits re-run the checks live; a failed hard check (hype, missing quote, outside link, missing org name) disables Approve.
- Schema changes to the graph need the founder's OK in the crew room (see below).
- Daily send cap (20) protects the founder's domain.

## Flexprice metering

| Event | Credits | When |
|---|---|---|
| `graph_query` | 0.1 | Each lead checked during discovery, each warm path opened |
| `lead_enriched` | 5 | Finding a verified email on approve |
| `outreach_sent` | 1 | Sending to the demo inbox on approve |

Approving a card costs **6 credits** (5 + 1). Enrichment and send call `billing.check()` first; if the balance won't cover it the engine returns **HTTP 402 `out_of_credits`** and the UI opens the credit modal ("Security paused enrichment"). Top-ups are logged. In the web app every spend also posts to `/api/meter`, which forwards a Flexprice event when `FLEXPRICE_API_KEY` is set and always updates the local ledger. Set `DEMO_CREDITS=6` on the engine to show the gate on camera.

## Band crew

| Agent | Role | Can | Cannot |
|---|---|---|---|
| **Planner** | Breaks the goal into steps, assigns work, tells you when cards are ready ("waiting on you") | Read graph, queue tasks | Approve sends |
| **Builder** | Runs discovery, drafts outreach, maps warm paths, proposes schema changes | Read graph, call discovery and drafting routes | Write the graph directly, approve |
| **Reviewer** | Checks every quote against its source and every draft against the checklist | Read, mark pass/fail | Approve sends |
| **Security** | Screens links and personal data, enforces the credit gate, blocks non-human approvals | Pause enrichment, log blocks | Approve sends |

Each agent has a route allow-list; none of them can call approve/reject.

### Schema-approval flow

1. Builder notices a repeated pattern (funding signals) and asks in the crew room: *"Can I add a `Grant` node type so grants link to funders? Schema changes need your OK."*
2. The message is marked **waiting on you** with Approve / Not now buttons.
3. Approve → the change is logged in the activity log as "Approved graph schema change · Add node: Grant", and Security confirms it was additive (no data deleted). Not now → logged as declined; nothing changes.
4. Only deterministic code applies the migration (`CREATE NODE TABLE IF NOT EXISTS ...`), never an agent.

## Web app map

| Piece | File |
|---|---|
| Global palette, fonts, all prototype CSS | `web/app/globals.css` |
| SVG sprite (icons, cat crew, bunny "you") | `web/components/Sprites.tsx` |
| Demo data (ICP, leads, signals, competitors, history) | `web/lib/demo-data.ts` |
| App state (credits, leads, logs, crew messages, gates) | `web/lib/store.ts` (Zustand) |
| 3D constellation canvas | `web/lib/constellation.ts` + `components/Constellation.tsx` |
| Thin API routes | `web/app/api/{icp,draft,meter,health,discover}` |
