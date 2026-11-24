# Pitchfeed — Spec (v1)

> **Swipe right on your first customers.**
> An AI go-to-market engine for first-time and student founders who have a great product but no sales experience and no network. It finds real buyers with real reasons to talk right now, shows you the warm path to them, drafts the message, and lets you approve each one with a swipe. Every claim comes with a receipt.

Working name: Pitchfeed. Demo product: **Togather** (volunteer-coordination app that sells to Kiwanis clubs, volunteer centers and nonprofits).

---

## 1. Why it wins (pitch in 3 lines)

1. **AI SDRs failed by spamming made-up, generic messages** (11x churn, Artisan's LinkedIn ban). Pitchfeed sends *few, true, well-timed* messages.
2. **Founders without a network** don't know their warm paths. Our graph finds "you → alum → buyer".
3. **Approving outreach is fun** (swipe), so the human actually stays in the loop.

## 2. Scoring map (spec criterion → where we hit it)

| Criterion | Weight | Where in Pitchfeed |
|---|---|---|
| ICP & Discovery | 20% | Intake chat → ICP cards with confidence bars + expansion segments; every lead has cited signals |
| Enrichment & Outreach | 20% | Verified email + MX badge; 3-touch sequence from one cited signal; swipe HITL gate; proof receipt |
| Dashboard & Lead Mgmt | 15% | Kanban with 🤖/🧑 attribution, audit log, Founder Wrapped analytics |
| Startup Viability | 15% | Founders-without-a-network wedge, "few true sends" pitch, credit pricing |
| Tech & Demo | 10% | Live/demo fallback per integration, `/health`, end-to-end |
| Band bonus | +20% | Pigeon Crew: Planner, Builder, Reviewer, Security agents in a Band room; human approval can't be faked |
| Flexprice bonus | +20% | Every lead/send/graph query metered; enrichment gated at 0 credits (HTTP 402); cost on every receipt |

## 3. Screens (for design)

Design language: Arushi's call. Must-haves: a feed-first, playful look **and** a dense Table view toggle (the spec asks for a spreadsheet-style surface). Mascot idea: the **Pigeon Crew** (messenger pigeons = outreach), one character per agent.

| # | Screen | What's on it | Key states |
|---|---|---|---|
| 1 | **Intake** | Chat + form tabs. Product name, description, URL, current customers, pricing, founder's own background (school, past jobs, programs) | empty, typing, "crew is thinking" |
| 2 | **ICP** | Cards: industries (NAICS), size band, personas/titles, trigger events. Each field has a confidence bar (0–1). "Expansion ideas" row: accept / adjust / dismiss | loading, approved |
| 3 | **Feed (hero)** | One full-screen card per lead: company, fit score + tier badge (A/B/C), "why now" signal with source chip, lead-temperature indicator, warm path strip, drafted email. Swipe → approve, ← reject, ↑ edit | card, editing, approved toast, rejected, out-of-credits block, empty feed |
| 3a | Card detail | Warm-path map (you → person → buyer), all signals + sources, contact (email + MX ✓, LinkedIn), 3-touch sequence tabs (Email 1, Email 2, LinkedIn) | |
| 3b | **Proof receipt** | Receipt-style list: each claim → source link ✓, checks passed (length, CTA, no invented facts, links safe), reviewer + security verdicts, credits spent | pass, warning, blocked |
| 4 | **Table view** | Same leads as dense grid: score, tier, signal, verification badges, stage, owner | sort, filter |
| 5 | **Pipeline** | Kanban: Matched → Contacted → Replied → Meeting Booked → Closed/Lost. Each card shows 🤖 AI or 🧑 rep last-moved | drag |
| 6 | **Founder Wrapped** | Story cards: funnel, best opener (A/B), best industry/tier, replies by channel, time saved | |
| 7 | **Crew room** (side panel, collapsible) | Live "Agent Thinking" feed: agent messages, @mentions, graph queries, validation logs, "waiting on you 👀" | |
| 8 | **Credits** (header chip + sheet) | Balance, usage by event, per-lead cost | low, empty |

## 4. Core loop (backend)

```
Intake → ICP (LLM, confidence per field) → founder approves
  → Discovery (Tavily search → candidates; each claim = url + verbatim quote; validator re-fetches & checks)
  → Negative filters (hiring freeze, wrong region)
  → Knowledge graph (Kùzu): Company, Person, Product, Competitor, Signal, Founder
       edges: works_at, previously_employed_at, studied_at, competes_with, matched_to, has_signal, contacted_via, replied_to
  → Warm path query (shortest path founder → buyer)
  → Score: fit 0–60 + intent 0–40 → tier A/B/C; temperature from signal age
  → Enrichment (Hunter + MX check) [metered, credit-gated]
  → Outreach drafts (3 touches from one cited signal) → Verifier → Receipt
  → Feed → human swipe (only humans can approve; logged)
  → "Send" (demo inbox only) [metered] → Pipeline → Analytics
```

Rules:
- Agents and LLMs **read** the graph; only deterministic code **writes** it (idempotent MERGE).
- A claim with no verified source is dropped, never shown or sent.
- Approve/send routes reject any actor that isn't `human`.
- Every integration is **live** if its key is set, **demo** otherwise; `/health` reports which.
- Sends only go to `DEMO_INBOX`. LinkedIn touches are copy-to-clipboard tasks.

## 5. Credits (Flexprice)

| Event | Credits |
|---|---|
| `lead_enriched` | 5 |
| `outreach_sent` | 1 |
| `graph_query` | 0.1 |

Enrichment and send call `billing.check()` first → HTTP 402 `out_of_credits` when the balance is too low. Default `DEMO_CREDITS=400`; set to 6 for the on-camera block.

## 6. API contract (frontend talks to these)

Base: `http://localhost:8000`

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | mode of each integration (live/demo) |
| POST | `/reset` | reseed demo state |
| POST | `/intake` | body: product + founder info → returns ICP |
| GET | `/icp` | current ICP |
| POST | `/icp/expansions/{id}` | body `{action: accept\|dismiss\|adjust, note?}` |
| POST | `/discover` | run discovery on approved ICP → leads |
| GET | `/feed` | swipe cards (pending drafts, best first) |
| GET | `/leads` | table view rows |
| GET | `/leads/{id}` | card detail (signals, contact, warm path, sequence, receipt) |
| POST | `/leads/{id}/enrich` | enrich contact (metered, may 402) |
| POST | `/cards/{id}/approve` | body `{actor: "human", edited_body?}` → sends to demo inbox (metered) |
| POST | `/cards/{id}/reject` | body `{actor: "human", reason?}` |
| GET | `/pipeline` | kanban columns |
| POST | `/leads/{id}/stage` | body `{stage, actor: "human"\|"ai"}` |
| GET | `/analytics` | funnel, by industry/tier, variants, wrapped cards |
| GET | `/graph/path/{lead_id}` | nodes + edges + the Cypher used |
| GET | `/credits` | balance + usage |
| GET | `/audit` | every action with timestamp + actor |
| GET | `/thinking` | crew room event stream (polling list; SSE later) |

## 7. Stack

- **API:** Python 3.12+, FastAPI, Kùzu (embedded graph, Cypher), Anthropic Claude, Tavily, Hunter, dnspython, Flexprice REST
- **Web:** Next.js + Tailwind + Radix (built from Arushi's designs)
- **Agents:** Band SDK, four remote agents with route allow-lists
- **CI:** Snyk SAST + SCA GitHub workflow

## 8. Build order

1. ✅ Backend thin slice with demo fallback (this commit)
2. Design: Feed card + Receipt + ICP (Arushi)
3. Next.js screens wired to API
4. Live keys: Claude, Tavily, Hunter → real Togather leads
5. Flexprice live + Band crew room
6. Wrapped, temperature, polish → demo video + architecture doc

## 9. Open questions

- Hackathon deadline + team size?
- Final name (check availability)
- Togather vs Benefeed as the demo product
