"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";

export default function Toast() {
  const toast = useApp((s) => s.toast);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!toast) return;
    setOn(true);
    const t = setTimeout(() => setOn(false), 2400);
    return () => clearTimeout(t);
  }, [toast]);
  return <div className={`toast${on ? " on" : ""}`} dangerouslySetInnerHTML={{ __html: toast?.html || "" }} />;
}
