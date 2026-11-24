import { Icon } from "./Sprites";

export default function OnbTop({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="onb-top">
      <div className="brand"><Icon id="i-plane" size={28} className="doodle" /><b>pitchfeed</b></div>
      <div className="steps">
        {["Your product", "Ideal customer", "Your feed"].map((t, i) => (
          <span key={t} className={step === i + 1 ? "on" : ""}><i>{i + 1}</i>{t}</span>
        ))}
      </div>
    </div>
  );
}
