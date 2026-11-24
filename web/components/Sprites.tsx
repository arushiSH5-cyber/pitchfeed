/* eslint-disable */
// SVG sprite copied verbatim from pitchfeed-v2.html: icons, cat crew, bunny "you".
const SPRITE = `
  <filter id="rough"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="1.5"/></filter>
  <filter id="watercolor"><feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="3" seed="8"/><feDisplacementMap in="SourceGraphic" scale="60"/></filter>
  <!-- icons -->
  <symbol id="i-plane" viewBox="0 0 32 32"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15.5 27 5l-6.5 21-5.2-7.6L4 15.5Z"/><path d="m15.3 18.4 11.7-13.4"/><path d="M15.3 18.4 14 25l3.3-3.6"/></g></symbol>
  <symbol id="i-check" viewBox="0 0 32 32"><path d="M6 17.5c3 2.2 5 4.6 6.6 7.3C15.8 17 20.4 11 26.5 6.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-x" viewBox="0 0 32 32"><path d="M8.5 8c5 5.4 10 10.8 15.4 16.2M24 7.6C18.7 13.3 13.4 19 8 24.6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></symbol>
  <symbol id="i-pencil" viewBox="0 0 32 32"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 26.2 7.4 20 21.3 6.2a2.7 2.7 0 0 1 3.9 0l.7.7a2.7 2.7 0 0 1 0 3.9L12 24.7 6 26.2Z"/><path d="m18.6 9 4.6 4.6"/></g></symbol>
  <symbol id="i-flip" viewBox="0 0 32 32"><g fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 13.5C7.5 8.7 11.5 6 16.3 6c4.5 0 8 2.3 9.7 6"/><path d="m26.4 6.4-.4 5.8-5.7-1"/><path d="M26 18.5c-1.5 4.8-5.5 7.5-10.3 7.5-4.5 0-8-2.3-9.7-6"/><path d="m5.6 25.6.4-5.8 5.7 1"/></g></symbol>
  <symbol id="i-link" viewBox="0 0 32 32"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M13.6 18.4a5 5 0 0 0 7.1 0l4-4a5 5 0 0 0-7.1-7.1l-1.7 1.7"/><path d="M18.4 13.6a5 5 0 0 0-7.1 0l-4 4a5 5 0 0 0 7.1 7.1l1.7-1.7"/></g></symbol>
  <symbol id="i-sun" viewBox="0 0 32 32"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="16" cy="16" r="5.4"/><path d="M16 3.5v3.3M16 25.2v3.3M3.5 16h3.3M25.2 16h3.3M7.2 7.2l2.3 2.3M22.5 22.5l2.3 2.3M7.2 24.8l2.3-2.3M22.5 9.5l2.3-2.3"/></g></symbol>
  <symbol id="i-moon" viewBox="0 0 32 32"><path d="M20.8 5.6A11 11 0 1 0 26.4 22 9 9 0 0 1 20.8 5.6Z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></symbol>
  <symbol id="i-halfsun" viewBox="0 0 32 32"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9.5 21a6.5 6.5 0 0 1 13 0"/><path d="M4 21h24M16 8v3M7.5 11.5l2 2M24.5 11.5l-2 2M5 26h22"/></g></symbol>
  <symbol id="i-star" viewBox="0 0 32 32"><path d="M16 3.5c1 6.5 2.6 10.6 12.5 12.5C18.6 17.9 17 22 16 28.5 15 22 13.4 17.9 3.5 16 13.4 14.1 15 10 16 3.5Z" fill="currentColor"/></symbol>
  <symbol id="i-spark" viewBox="0 0 32 32"><g fill="currentColor"><path d="M13 6c.7 4.6 1.9 7.3 8 8.5-6.1 1.2-7.3 3.9-8 8.5-.7-4.6-1.9-7.3-8-8.5 6.1-1.2 7.3-3.9 8-8.5Z"/><path d="M24 4c.3 2 .9 3.1 3.5 3.6-2.6.5-3.2 1.6-3.5 3.6-.3-2-.9-3.1-3.5-3.6 2.6-.5 3.2-1.6 3.5-3.6Z"/></g></symbol>
  <symbol id="i-feed" viewBox="0 0 32 32"><g fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><rect x="8" y="6" width="16" height="21" rx="4"/><path d="M5 10v13M27 10v13" stroke-linecap="round"/></g></symbol>
  <symbol id="i-grid" viewBox="0 0 32 32"><g fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="5" y="6" width="22" height="20" rx="4"/><path d="M5 12.6h22M5 19.3h22M13 6v20"/></g></symbol>
  <symbol id="i-board" viewBox="0 0 32 32"><g fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><rect x="4.5" y="6" width="6.5" height="18" rx="2.5"/><rect x="12.8" y="6" width="6.5" height="12" rx="2.5"/><rect x="21" y="6" width="6.5" height="15" rx="2.5"/></g></symbol>
  <symbol id="i-gift" viewBox="0 0 32 32"><g fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="5.5" y="12" width="21" height="14.5" rx="3"/><path d="M4.5 12h23M16 12v14.5"/><path d="M16 12c-1.5-4.5-6.5-6-7.5-3.5S12 12 16 12Zm0 0c1.5-4.5 6.5-6 7.5-3.5S20 12 16 12Z"/></g></symbol>
  <symbol id="i-constel" viewBox="0 0 32 32"><path d="M7 22 13 11l8 5 5-9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="2 3"/><g fill="currentColor"><circle cx="7" cy="22" r="2.3"/><circle cx="13" cy="11" r="2.3"/><circle cx="21" cy="16" r="2.3"/><circle cx="26" cy="7" r="2.3"/></g></symbol>
  <symbol id="i-chat" viewBox="0 0 32 32"><path d="M6 8.5C6 7 7 6 8.5 6h15C25 6 26 7 26 8.5v11c0 1.5-1 2.5-2.5 2.5H14l-6 4.5V22c-1.2 0-2-1-2-2.5v-11Z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></symbol>
  <symbol id="i-coin" viewBox="0 0 32 32"><g fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="16" cy="16" r="10"/><path d="M16 10.5c1 3.3 1.8 4.6 5.5 5.5-3.7.9-4.5 2.2-5.5 5.5-1-3.3-1.8-4.6-5.5-5.5 3.7-.9 4.5-2.2 5.5-5.5Z" stroke-linejoin="round"/></g></symbol>
  <symbol id="i-hand" viewBox="0 0 32 32"><path d="M11 17V8.5a1.8 1.8 0 0 1 3.6 0V15m0-1V6.8a1.8 1.8 0 0 1 3.6 0V15m0-1.5V8.5a1.8 1.8 0 0 1 3.6 0V18c0 5.5-3 8.5-7.5 8.5-3.4 0-5.3-1.7-7-4.8L5.8 17.5a1.8 1.8 0 0 1 3-1.9L11 18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-arrowL" viewBox="0 0 32 32"><path d="M19 7.5c-3.4 3-6.2 5.8-8.5 8.5 2.3 2.7 5.1 5.5 8.5 8.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-arrowR" viewBox="0 0 32 32"><path d="M13 7.5c3.4 3 6.2 5.8 8.5 8.5-2.3 2.7-5.1 5.5-8.5 8.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-cloud" viewBox="0 0 64 32"><path d="M10 26c-4.5 0-6.5-5.5-2.5-8 0-5 5.5-7 8.5-4 1.5-6 10-8 13.5-2.5 2.5-4 10-3 10.5 2.5 5-1.5 9 3 6.5 7 4 .5 4.5 5-.5 5H10Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></symbol>
  <symbol id="i-radar" viewBox="0 0 32 32"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="16" cy="16" r="11"/><circle cx="16" cy="16" r="5.5"/><path d="M16 16 24 8"/></g><circle cx="21" cy="19" r="1.8" fill="currentColor"/></symbol>
  <symbol id="i-chess" viewBox="0 0 32 32"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 26h12M11.5 22.5h9l-1.5-7h-6l-1.5 7Z"/><path d="M13 15.5c-2-1.5-2-5 0-7 1.5-1.5 4.5-1.5 6 0 2 2 2 5.5 0 7"/><path d="M16 5v2"/></g></symbol>
  <symbol id="i-chart" viewBox="0 0 32 32"><g fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 26h22"/><path d="M8 21v-5M14 21v-10M20 21v-7M26 21V8"/></g></symbol>
  <symbol id="i-list" viewBox="0 0 32 32"><g fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M12 9h14M12 16h14M12 23h10"/><circle cx="7" cy="9" r="1.4" fill="currentColor"/><circle cx="7" cy="16" r="1.4" fill="currentColor"/><circle cx="7" cy="23" r="1.4" fill="currentColor"/></g></symbol>
  <symbol id="i-gauge" viewBox="0 0 32 32"><g fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 22a10 10 0 1 1 20 0"/><path d="m16 22 5-6"/></g></symbol>
  <symbol id="i-download" viewBox="0 0 32 32"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 6v14M10.5 15l5.5 5.5 5.5-5.5M7 25.5h18"/></g></symbol>
  <symbol id="i-shield" viewBox="0 0 32 32"><path d="M16 4.5 25 8v7c0 6-4 10.5-9 12.5C11 25.5 7 21 7 15V8l9-3.5Z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></symbol>
  <symbol id="i-mail" viewBox="0 0 32 32"><g fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><rect x="5" y="8" width="22" height="16" rx="3"/><path d="m6 9.5 10 7.5 10-7.5" stroke-linecap="round"/></g></symbol>
  <!-- characters: working cats + founder bunny -->
  <symbol id="cat-base" viewBox="0 0 64 64"><path d="M13 47c-2-11 0-21 4-28l5.5 7.5c6-2.8 13-2.8 19 0L47 19c4 7 6 17 4 28-1.5 6.5-9 9-19 9s-17.5-2.5-19-9Z" fill="#FFFDF8" stroke="#2B3555" stroke-width="2" stroke-linejoin="round"/><path d="M18.5 23.5l2.5 3.4M45.5 23.5 43 26.9" stroke="#F0B3AE" stroke-width="2.4" stroke-linecap="round"/><path d="M29.5 30v3M32 29.3v3.7M34.5 30v3" stroke="#B9BDCB" stroke-width="1.6" stroke-linecap="round"/><circle cx="25.5" cy="39" r="1.8" fill="#2B3555"/><circle cx="38.5" cy="39" r="1.8" fill="#2B3555"/><ellipse cx="21.5" cy="43" rx="3.2" ry="2" fill="#F5BDB7"/><ellipse cx="42.5" cy="43" rx="3.2" ry="2" fill="#F5BDB7"/><path d="M29.4 42c.8 1.2 1.8 1.2 2.6 0 .8 1.2 1.8 1.2 2.6 0" fill="none" stroke="#2B3555" stroke-width="1.4" stroke-linecap="round"/></symbol>
  <symbol id="c-planner" viewBox="0 0 64 64"><use href="#cat-base"/><path d="M13.5 38C13 21 51 21 50.5 38" fill="none" stroke="#2B3555" stroke-width="3.2" stroke-linecap="round"/><rect x="9" y="33" width="8" height="12" rx="4" fill="#D4888A" stroke="#2B3555" stroke-width="1.8"/><rect x="47" y="33" width="8" height="12" rx="4" fill="#D4888A" stroke="#2B3555" stroke-width="1.8"/></symbol>
  <symbol id="c-builder" viewBox="0 0 64 64"><use href="#cat-base"/><g stroke="#2B3555" stroke-width="1.9" stroke-linejoin="round"><path d="M6 59h52" stroke-linecap="round"/><rect x="18" y="44" width="28" height="15" rx="2.5" fill="#C9CCEA"/></g><path d="M32 54.5c-1.6-1.2-2.8-2.1-2.8-3.4a1.4 1.4 0 0 1 2.8-.5 1.4 1.4 0 0 1 2.8.5c0 1.3-1.2 2.2-2.8 3.4Z" fill="#6A6FA3"/><path d="M50 18c2-1.5 4.5-1 4.5 1s-3 2-2.2 4" fill="none" stroke="#7D84C9" stroke-width="2" stroke-linecap="round"/></symbol>
  <symbol id="c-reviewer" viewBox="0 0 64 64"><use href="#cat-base"/><g fill="none" stroke="#2B3555" stroke-width="1.7"><circle cx="25.5" cy="39" r="5.2"/><circle cx="38.5" cy="39" r="5.2"/><path d="M30.7 38.5c.8-.6 1.8-.6 2.6 0M20.3 38l-4-1.5M43.7 38l4-1.5" stroke-linecap="round"/></g><rect x="40" y="50" width="12" height="9" rx="1.5" fill="#F3E0BC" stroke="#2B3555" stroke-width="1.6" transform="rotate(-8 46 54)"/><path d="M42.5 53.5h6M42.8 56h4.5" stroke="#2B3555" stroke-width="1.2" stroke-linecap="round" transform="rotate(-8 46 54)"/></symbol>
  <symbol id="c-security" viewBox="0 0 64 64"><use href="#cat-base"/><path d="M15 27.5c2-9 32-9 34 0-10-2.5-24-2.5-34 0Z" fill="#A39D7B" stroke="#2B3555" stroke-width="1.8" stroke-linejoin="round"/><path d="M15 27.5c-5 .5-7.5 2.5-2 3.5 2.5.4 5-.6 8-1.6" fill="#A39D7B" stroke="#2B3555" stroke-width="1.8" stroke-linejoin="round"/><path d="M32 47.5 37 49.4v3.4c0 2.8-2.2 4.8-5 5.8-2.8-1-5-3-5-5.8v-3.4l5-1.9Z" fill="#F3E0BC" stroke="#2B3555" stroke-width="1.6" stroke-linejoin="round"/></symbol>
  <symbol id="c-you" viewBox="0 0 64 64"><g stroke="#2B3555" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M42 31c5.5-2 8.5 3 7 13-.8 5-3.5 6.5-4.5 2.5" fill="#FFFDF8"/><ellipse cx="32" cy="43" rx="15" ry="14.5" fill="#FFFDF8"/><path d="M17 32.5C17.5 19 46.5 18.5 47.5 32.5c-9.5-2.4-21-2.4-30.5 0Z" fill="#A39D7B"/><path d="M17.5 32.5c-6.5.6-10 3.5-3 4.8 3 .5 6.5-1 10-2" fill="#A39D7B"/><path d="M32 20v-1.6"/></g><path d="M45.5 40c1.4 3.2 1 6.2-.4 7" fill="none" stroke="#EFA6A2" stroke-width="2.2" stroke-linecap="round"/><circle cx="27" cy="42" r="1.8" fill="#2B3555"/><circle cx="37" cy="42" r="1.8" fill="#2B3555"/><ellipse cx="23.5" cy="46" rx="2.6" ry="1.6" fill="#F5BDB7"/><ellipse cx="40.5" cy="46" rx="2.6" ry="1.6" fill="#F5BDB7"/><path d="M31 45.6l1 .8 1-.8" fill="none" stroke="#2B3555" stroke-width="1.3" stroke-linecap="round"/><path d="M12 22.5c-.7-1.5.3-2.8 1.6-2.2.5-1.4 2.2-1 2 .6-.3 1.8-2.6 2.6-3.6 1.6Z" fill="none" stroke="#2B3555" stroke-width="1.2"/></symbol>
`;

export default function Sprites() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <defs dangerouslySetInnerHTML={{ __html: SPRITE }} />
    </svg>
  );
}

export function Icon({ id, size = 18, className, style }: { id: string; size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} className={className} style={style}>
      <use href={`#${id}`} />
    </svg>
  );
}

export function Char({ id, width, className, style }: { id: string; width?: number | string; className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" width={width} className={className} style={style}>
      <use href={`#${id}`} />
    </svg>
  );
}
