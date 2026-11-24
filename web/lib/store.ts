"use client";
import { create } from "zustand";
import { HAS_API } from "./api";
import { ICP, INCOMING, INTAKE, PRICES, STAGES, makeLeads, now, type ICPT, type Incoming, type Intake, type Lead, type Stage } from "./demo-data";

export type Screen = "intake" | "thinking" | "icp" | "app";
export type View = "feed" | "pipeline" | "leads" | "signals" | "network" | "market" | "insights" | "activity" | "usage";
export type Msg = { id: number; agent: string; html: string; cls: string; typing?: boolean; ask?: "schema" };
export type LogRow = { t: string; who: string; action: string; target: string; cr: number };
type Kind = keyof typeof PRICES;

const START_CREDITS = 20;
let msgId = 0;
const timers: ReturnType<typeof setTimeout>[] = [];
const later = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms));

type S = {
  screen: Screen; view: View; intake: Intake; icp: ICPT; icpSource: "demo" | "claude" | "gemini";
  credits: number; sentToday: number; ledger: Record<Kind, number>; logs: LogRow[];
  leads: Lead[]; incoming: Incoming[]; signalsShown: number; msgs: Msg[]; crewOpen: boolean;
  editId: string | null; mapId: string | null; creditOpen: boolean; wrappedOpen: boolean;
  toast: { html: string; n: number } | null; leaving: string | null; discovering: boolean; liveLeads: boolean;
  flyOut: ((dir: 1 | -1) => void) | null;

  setScreen: (s: Screen) => void; go: (v: View) => void; setIntake: (i: Partial<Intake>) => void; setIcp: (i: ICPT, src: "demo" | "claude" | "gemini") => void;
  toggleCrew: () => void; showToast: (html: string) => void;
  spend: (kind: Kind, target: string) => void; log: (who: string, action: string, target?: string, cr?: number) => void;
  say: (agent: string, html: string, cls?: string, ask?: Msg["ask"]) => number; sayTyping: (agent: string, html: string, delay: number, cls?: string) => void;
  clearAsk: (id: number) => void;
  startApp: () => void; approve: (id: string, edited?: boolean) => void; skip: (id: string) => void; updateBody: (id: string, body: string) => void;
  topUp: () => void; openEdit: (id: string | null) => void; openMap: (id: string | null) => void; setCreditOpen: (b: boolean) => void; setWrappedOpen: (b: boolean) => void;
  moveLead: (id: string, stage: Stage) => void; simulateReplies: () => void; addSignal: (company: string) => void;
  schemaDecision: (msgId: number, yes: boolean) => void; registerFlyOut: (fn: S["flyOut"]) => void;
};

// Fire-and-forget metering; the local ledger is the source of truth for the UI.
const meter = (kind: Kind, target: string) => {
  if (typeof window === "undefined" || !HAS_API) return;
  fetch("/api/meter", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ event: kind, amount: PRICES[kind], target }) }).catch(() => {});
};

export const pending = (leads: Lead[]) => leads.filter((l) => l.status === "pending");
/** True when the visitor typed their own product instead of using the demo intake. */
export const isCustom = (i: Intake) => i.product.trim() !== INTAKE.product || i.what.trim() !== INTAKE.what;

export const useApp = create<S>((set, get) => ({
  screen: "intake", view: "feed", intake: INTAKE, icp: ICP, icpSource: "demo",
  credits: START_CREDITS, sentToday: 0, ledger: { graph: 0, enrich: 0, send: 0 }, logs: [],
  leads: makeLeads(), incoming: INCOMING.map((x) => ({ ...x })), signalsShown: 0, msgs: [], crewOpen: true,
  editId: null, mapId: null, creditOpen: false, wrappedOpen: false, toast: null, leaving: null, flyOut: null, discovering: false, liveLeads: false,

  setScreen: (screen) => set({ screen }),
  go: (view) => set({ view }),
  setIntake: (i) => set((s) => ({ intake: { ...s.intake, ...i } })),
  setIcp: (icp, icpSource) => set({ icp, icpSource }),
  toggleCrew: () => set((s) => ({ crewOpen: !s.crewOpen })),
  showToast: (html) => set((s) => ({ toast: { html, n: (s.toast?.n || 0) + 1 } })),

  spend: (kind, target) => {
    const amt = PRICES[kind];
    set((s) => ({ credits: Math.round((s.credits - amt) * 10) / 10, ledger: { ...s.ledger, [kind]: s.ledger[kind] + 1 } }));
    get().log(kind === "send" ? "You" : "Builder", { graph: "Graph query", enrich: "Found verified email", send: "Sent message to demo inbox" }[kind], target, -amt);
    meter(kind, target);
  },
  log: (who, action, target = "", cr = 0) => set((s) => ({ logs: [{ t: now(), who, action, target, cr }, ...s.logs] })),
  say: (agent, html, cls = "", ask) => {
    const id = ++msgId;
    set((s) => ({ msgs: [...s.msgs, { id, agent, html, cls, ask }] }));
    return id;
  },
  sayTyping: (agent, html, delay, cls = "") => {
    later(() => {
      const id = ++msgId;
      set((s) => ({ msgs: [...s.msgs, { id, agent, html: "", cls, typing: true }] }));
      later(() => set((s) => ({ msgs: s.msgs.map((m) => (m.id === id ? { ...m, html, typing: false } : m)) })), 700);
    }, delay);
  },
  clearAsk: (id) => set((s) => ({ msgs: s.msgs.map((m) => (m.id === id ? { ...m, ask: undefined } : m)) })),

  startApp: () => {
    const g = get();
    set({ screen: "app" });
    g.log("You", "Approved ideal customer profile", g.intake.product, 0);
    g.say("Planner", "Profile approved. <em>@Builder</em> find organizations with a reason to talk now.");
    later(() => get().say("Builder", "Funding signals keep showing up. Can I add a <b>Grant</b> node type to the graph so grants link to funders? Schema changes need your OK.", "waiting", "schema"), 14000);

    if (isCustom(g.intake)) {
      // Real pull for the visitor's own product. The demo's sample signals don't apply to it.
      set({ incoming: [] });
      if (!HAS_API) {
        g.sayTyping("Builder", "This hosted demo has no server, so it can't search the web. Showing sample leads so you can try the flow. Run Pitchfeed locally with a Gemini key for a real pull.", 500, "waiting");
        g.leads.forEach((l) => g.spend("graph", l.company));
        return;
      }
      set({ leads: [], discovering: true });
      g.sayTyping("Builder", `Searching public job posts, press and event pages for <b>${g.intake.product}</b> buyers. This takes about a minute.`, 400);
      fetch("/api/discover", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ intake: g.intake, icp: g.icp }) })
        .then((r) => r.json())
        .then((j: { mode: string; reason?: string; leads: Lead[]; dropped?: { company: string; reason: string }[] }) => {
          const s = get();
          const live = j.mode === "live";
          set({ leads: j.leads, discovering: false, liveLeads: live });
          j.leads.forEach((l) => s.spend("graph", l.company));
          const drops = (j.dropped || []).slice(0, 3).map((d) => `<b>${d.company}</b> (${d.reason})`).join(", ");
          if (live) {
            s.say("Builder", `Found ${j.leads.length + (j.dropped?.length || 0)} real organizations.${drops ? ` Dropped ${j.dropped!.length}: ${drops}.` : ""}`);
            s.sayTyping("Reviewer", `I re-opened every source page. All ${j.leads.length} quotes match word for word. Receipts are on the back of each card.`, 600);
            later(() => get().say("Planner", `${j.leads.length} real cards are ready for you. Emails need a Hunter key, so sends go to the demo inbox.`, "waiting"), 1500);
          } else {
            s.say("Builder", `Live search didn't return verified leads (${j.reason || "unavailable"}). Showing sample leads so you can try the flow.`, "waiting");
          }
        })
        .catch(() => {
          set({ leads: makeLeads(), discovering: false });
          get().say("Builder", "Live search is unavailable right now. Showing sample leads.", "waiting");
        });
      return;
    }

    g.leads.forEach((l) => g.spend("graph", l.company));
    g.sayTyping("Builder", "Found 6. Dropped <b>Coastline Animal Rescue</b> (hiring freeze) and <b>Summit Senior Services</b> (outside the Bay Area).", 500);
    if (HAS_API) fetch("/api/discover", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }).then((r) => r.json()).then((j) => {
      if (j.mode === "engine") get().say("Builder", `Engine run complete: <b>${j.result?.leads ?? "?"}</b> leads kept, <b>${j.result?.dropped ?? "?"}</b> dropped by the citation validator.`);
    }).catch(() => {});
    g.sayTyping("Reviewer", "Every quote on the remaining 4 matches its source page. Receipts are on the back of each card.", 1500);
    later(() => get().say("Planner", "4 cards are ready for you.", "waiting"), 2600);
    const nextSig = () => {
      const s = get();
      if (s.signalsShown >= s.incoming.length) return;
      set({ signalsShown: s.signalsShown + 1 });
      s.say("Builder", `New signal: <b>${s.incoming[s.signalsShown].company}</b>. It's in Live signals.`);
    };
    later(nextSig, 6000);
    setInterval(nextSig, 20000);
  },

  // Human-only approval. Costs 6 credits (5 enrich + 1 send); blocked below 6.
  approve: (id, edited) => {
    const s = get();
    const l = s.leads.find((x) => x.id === id);
    if (!l || s.leaving) return;
    if (s.credits < PRICES.enrich + PRICES.send) {
      set({ creditOpen: true });
      s.say("Security", `Credits too low to find ${l.buyer}'s email. Enrichment paused.`, "waiting");
      s.log("Security", "Blocked enrichment (out of credits)", l.company, 0);
      return;
    }
    s.say("You", `Approved ${l.company}${edited ? " (edited)" : ""}`);
    s.flyOut?.(1);
    set({ leaving: id });
    s.spend("enrich", l.company);
    s.spend("send", l.company);
    set((st) => ({ sentToday: st.sentToday + 1 }));
    s.sayTyping("Builder", l.email ? `Verified ${l.email}. MX records look good.` : `No email lookup key yet (Hunter), so this went to the demo inbox only.`, 250);
    s.sayTyping("Planner", "Sent to the demo inbox. Follow-up queued for day 3.", 1100);
    s.showToast(`<svg width="16" height="16"><use href="#i-plane"/></svg>Sent to demo inbox · 6 credits`);
    later(() => set((st) => ({ leaving: null, leads: st.leads.map((x) => (x.id === id ? { ...x, status: "approved", stage: "contacted", by: "you" } : x)) })), 520);
  },
  skip: (id) => {
    const s = get();
    const l = s.leads.find((x) => x.id === id);
    if (!l || s.leaving) return;
    s.say("You", `Skipped ${l.company}`);
    s.flyOut?.(-1);
    set({ leaving: id });
    s.log("You", "Skipped lead", l.company, 0);
    s.sayTyping("Planner", "Noted. I'll weight similar leads lower.", 250);
    later(() => set((st) => ({ leaving: null, leads: st.leads.map((x) => (x.id === id ? { ...x, status: "rejected", stage: "closed", by: "you" } : x)) })), 520);
  },
  updateBody: (id, body) => set((s) => ({ leads: s.leads.map((x) => (x.id === id ? { ...x, body } : x)) })),
  topUp: () => {
    set((s) => ({ credits: s.credits + 30, creditOpen: false }));
    const g = get();
    g.log("You", "Added credits", "Wallet", 30);
    g.say("Planner", "Credits topped up. Enrichment is back on.");
    g.showToast("Added 30 credits");
  },
  openEdit: (editId) => set({ editId }),
  openMap: (mapId) => {
    set({ mapId });
    if (mapId) {
      const l = get().leads.find((x) => x.id === mapId);
      if (l) get().spend("graph", `Path to ${l.buyer}`);
    }
  },
  setCreditOpen: (creditOpen) => set({ creditOpen }),
  setWrappedOpen: (wrappedOpen) => set({ wrappedOpen }),

  moveLead: (id, stage) => {
    const l = get().leads.find((x) => x.id === id);
    if (!l) return;
    set((s) => ({ leads: s.leads.map((x) => (x.id === id ? { ...x, stage, by: "you" } : x)) }));
    const n = STAGES.find((x) => x[0] === stage)![1];
    get().say("You", `Moved ${l.company} to ${n}`);
    get().log("You", `Moved to ${n}`, l.company, 0);
  },
  simulateReplies: () => {
    const c = get().leads.filter((l) => l.stage === "contacted");
    if (!c.length) return get().showToast("Approve a few cards first");
    const upd: Record<string, Stage> = {};
    c.forEach((l, i) => {
      if (i % 2 === 0) {
        upd[l.id] = i === 0 ? "meeting" : "replied";
        get().log("Planner", `Reply detected (simulated) → ${STAGES.find((s) => s[0] === upd[l.id])![1]}`, l.company, 0);
      }
    });
    set((s) => ({ leads: s.leads.map((x) => (upd[x.id] ? { ...x, stage: upd[x.id], by: "crew" } : x)) }));
    get().say("Builder", "Simulated replies for the demo. In production these come from the inbox webhook.");
  },
  addSignal: (company) => {
    const s = get();
    const sig = s.incoming.find((x) => x.company === company);
    if (!sig || sig.added) return;
    const first = sig.buyer.split(" ")[0];
    const l: Lead = {
      id: "n" + s.leads.length, company: sig.company, industry: sig.industry, size: "New account", score: sig.score, tier: sig.tier, temp: "hot", days: 0,
      buyer: sig.buyer, title: sig.title, email: first.toLowerCase() + "@" + sig.src.split("/")[0], linkedin: null,
      signals: [{ t: sig.t, q: sig.q, src: sig.src, days: 0, k: sig.k }], path: null, via: null, variant: "Quote",
      subject: `${sig.company.split(" ")[0]} + easier volunteer sign-ups`,
      body: `Hi ${first},\n\nI came across this from ${sig.company}: “${sig.q}.”\n\nI'm building Togather so volunteers can find a shift in seconds, sign up in one tap and get a reminder before they show up.\n\nWould a 2-minute demo video be useful?\n\nSam, Togather`,
      status: "pending", stage: "matched", by: "crew",
    };
    set((st) => ({ leads: [...st.leads, l], incoming: st.incoming.map((x) => (x.company === company ? { ...x, added: true } : x)) }));
    s.spend("graph", sig.company);
    s.log("You", "Added signal to feed", sig.company, 0);
    s.say("Builder", `Drafted outreach for ${sig.company}. It's at the back of your feed.`);
  },
  schemaDecision: (id, yes) => {
    const g = get();
    g.clearAsk(id);
    if (yes) {
      g.say("You", "Approved the Grant node type");
      g.log("You", "Approved graph schema change", "Add node: Grant", 0);
      g.sayTyping("Security", "Logged. Only additive change, no data deleted.", 300);
    } else {
      g.say("You", "Not now");
      g.log("You", "Declined graph schema change", "Add node: Grant", 0);
    }
  },
  registerFlyOut: (flyOut) => set({ flyOut }),
}));
