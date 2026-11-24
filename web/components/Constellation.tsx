"use client";
import { useEffect, useRef } from "react";
import { createConstellation } from "@/lib/constellation";
import { useApp } from "@/lib/store";

/** Canvas warm-path graph. `focus` lights up the shortest path to that lead's buyer. */
export default function Constellation({ focus = null, reveal = false, id }: { focus?: string | null; reveal?: boolean; id?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const inst = useRef<ReturnType<typeof createConstellation> | null>(null);
  const leads = useApp((s) => s.leads);
  const n = leads.length;
  useEffect(() => {
    if (!ref.current) return;
    inst.current = createConstellation(ref.current, useApp.getState().leads, { reveal });
    inst.current.focus(focus);
    return () => inst.current?.destroy();
    // rebuild when new leads join the graph
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, reveal]);
  useEffect(() => { inst.current?.focus(focus); }, [focus]);
  return <canvas ref={ref} id={id} />;
}
