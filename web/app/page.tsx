"use client";
import { useCallback, useEffect } from "react";
import AppShell from "@/components/AppShell";
import IcpReview from "@/components/IcpReview";
import Intake from "@/components/Intake";
import Sky from "@/components/Sky";
import Sprites from "@/components/Sprites";
import Thinking from "@/components/Thinking";
import Toast from "@/components/Toast";
import { useApp } from "@/lib/store";
import { HAS_API } from "@/lib/api";

export default function Home() {
  const screen = useApp((s) => s.screen);
  const { setScreen, setIcp, startApp } = useApp.getState();

  const onStart = () => {
    setScreen("thinking");
    // Live ICP from Claude if a key is set; the route always falls back to demo data.
    if (HAS_API) fetch("/api/icp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(useApp.getState().intake) })
      .then((r) => r.json()).then((j) => j.icp && setIcp(j.icp, j.mode === "live" ? j.provider : "demo")).catch(() => {});
  };
  // #feed skips onboarding (handy for judges and screenshots).
  useEffect(() => { if (window.location.hash === "#feed" && useApp.getState().screen === "intake") startApp(); }, [startApp]);
  const onThinkDone = useCallback(() => setScreen("icp"), [setScreen]);

  return (
    <>
      <Sprites />
      <Sky />
      <div className="root">
        {screen === "intake" && <Intake onStart={onStart} />}
        {screen === "thinking" && <Thinking onDone={onThinkDone} />}
        {screen === "icp" && <IcpReview onGo={startApp} />}
        {screen === "app" && <AppShell />}
      </div>
      <Toast />
    </>
  );
}
