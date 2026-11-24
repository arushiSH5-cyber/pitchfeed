"use client";
import { useApp } from "@/lib/store";
import type { Intake as IntakeT } from "@/lib/demo-data";
import OnbTop from "./OnbTop";
import { useState } from "react";
import { Char, Icon } from "./Sprites";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function Intake({ onStart }: { onStart: () => void }) {
  const intake = useApp((s) => s.intake);
  const setIntake = useApp((s) => s.setIntake);
  const [video, setVideo] = useState(false);
  const f = (k: keyof IntakeT) => ({ value: intake[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setIntake({ [k]: e.target.value }) });
  return (
    <section className="screen onb on" id="intake">
      <OnbTop step={1} />
      <div className="onb-body">
        <div className="intake-wrap">
          <div className="intake-copy">
            <span className="label" style={{ color: "var(--rose)" }}>The honest go-to-market engine</span>
            <h1>Find your first <em>ten</em> customers. Skip the cold spam.</h1>
            <p className="lead">Pitchfeed finds organizations with a real reason to talk right now, shows who can introduce you, and drafts a note you approve with a swipe. Every claim comes with a receipt.</p>
            <button className="btn btn-gold" style={{ marginBottom: 14 }} onClick={() => setVideo(true)}>▶ Watch the 90-second demo</button>
            <div className="proof-row">
              {["Every fact cited", "You approve every send", "Pay per lead, not per seat"].map((t) => (
                <span key={t}><Icon id="i-check" size={16} style={{ color: "var(--sage)" }} />{t}</span>
              ))}
            </div>
            <div className="form card-s">
              <div className="row2">
                <div className="field"><label className="label">Your name</label><input {...f("founder")} /></div>
                <div className="field"><label className="label">Product</label><input {...f("product")} /></div>
              </div>
              <div className="field"><label className="label">What does it do?</label><textarea rows={2} {...f("what")} /></div>
              <div className="row2">
                <div className="field"><label className="label">Website</label><input {...f("website")} /></div>
                <div className="field"><label className="label">Pricing</label><input {...f("pricing")} /></div>
              </div>
              <div className="row2">
                <div className="field"><label className="label">Current customers</label><input {...f("customers")} /></div>
                <div className="field"><label className="label">Schools &amp; programs</label><input {...f("schools")} /></div>
              </div>
              <div className="field"><label className="label">Past workplaces</label><input {...f("workplaces")} /></div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                <span className="faint" style={{ fontSize: 12.5 }}>Your background is only used to find warm intros.</span>
                <button className="btn btn-ink" id="startBtn" onClick={onStart}>Find my customers <Icon id="i-arrowR" size={16} /></button>
              </div>
            </div>
          </div>
          <div className="intake-art">
            <div className="art3d">
              <Char id="c-builder" width={150} style={{ position: "absolute", left: 10, top: 150, transform: "translateZ(30px)" }} />
              <Char id="c-planner" width={140} style={{ position: "absolute", left: 150, top: 160, transform: "translateZ(60px)" }} />
              <Char id="c-reviewer" width={120} style={{ position: "absolute", left: 60, top: 30, transform: "translateZ(10px)" }} />
              <Char id="c-security" width={118} style={{ position: "absolute", left: 220, top: 40, transform: "translateZ(20px)" }} />
              <Char id="c-you" width={120} style={{ position: "absolute", left: 250, top: 200, transform: "translateZ(90px) rotate(5deg)" }} />
              <div className="desk" style={{ transform: "translateZ(20px)" }} />
              <Icon id="i-star" size={22} style={{ position: "absolute", left: 190, top: 20, color: "var(--gold)" }} />
              <Icon id="i-star" size={16} style={{ position: "absolute", left: 20, top: 100, color: "var(--lav)" }} />
            </div>
            <div className="art-note" style={{ left: 20, top: 330, transform: "rotate(-4deg)" }}>your crew drafts, you decide</div>
          </div>
        </div>
      </div>
      <div className={`overlay${video ? " on" : ""}`} onClick={(e) => e.target === e.currentTarget && setVideo(false)}>
        <div className="sheet" style={{ width: "min(960px, 92vw)", maxWidth: "none" }}>
          <button className="icon-btn close" onClick={() => setVideo(false)}><Icon id="i-x" size={16} /></button>
          <h3>Pitchfeed in 90 seconds</h3>
          {video && <video src={`${BASE}/demo.mp4`} poster={`${BASE}/demo-poster.png`} controls autoPlay playsInline style={{ width: "100%", borderRadius: 14, marginTop: 12 }} />}
        </div>
      </div>
    </section>
  );
}
