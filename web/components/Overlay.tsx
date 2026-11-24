"use client";
import { Icon } from "./Sprites";

/** Prototype overlay: click the backdrop or the close button to dismiss. */
export default function Overlay({ open, onClose, className, children, closeBtn = true }: { open: boolean; onClose: () => void; className: string; children: React.ReactNode; closeBtn?: boolean }) {
  return (
    <div className={`overlay${open ? " on" : ""}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`sheet ${className}`}>
        {closeBtn && <button className="icon-btn close" onClick={onClose}><Icon id="i-x" size={16} /></button>}
        {children}
      </div>
    </div>
  );
}
