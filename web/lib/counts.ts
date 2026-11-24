import { HIST, type Lead } from "./demo-data";

/** Funnel counts: two weeks of demo history plus this session's leads. */
export function counts(leads: Lead[]) {
  const c = { matched: HIST.matched, contacted: HIST.contacted, replied: HIST.replied, meeting: HIST.meeting, closed: HIST.closed };
  leads.forEach((l) => {
    c.matched++;
    if (["contacted", "replied", "meeting"].includes(l.stage) || l.status === "approved") c.contacted++;
    if (["replied", "meeting"].includes(l.stage)) c.replied++;
    if (l.stage === "meeting") c.meeting++;
  });
  return c;
}
