// Captures demo scenes from the running app via Chrome DevTools Protocol (Node 24, no deps).
// Usage: node media/capture.mjs http://localhost:3210 media/scenes
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
const [, , BASE = "http://localhost:3210", OUT = "media/scenes"] = process.argv;
mkdirSync(OUT, { recursive: true });
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9333, W = 1600, H = 1000;
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${process.env.TMPDIR}/pf-cdp`, `--window-size=${W},${H}`, "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json(); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const waits = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && waits.has(m.id)) { waits.get(m.id)(m); waits.delete(m.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; waits.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const js = async (expr) => (await send("Runtime.evaluate", { expression: `(async()=>{${expr}})()`, awaitPromise: true, returnByValue: true })).result?.result?.value;
const shot = async (name) => { const r = await send("Page.captureScreenshot", { format: "png" }); writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.result.data, "base64")); console.log("shot", name); };
await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
await send("Page.enable");
await send("Page.navigate", { url: BASE + "/" }); await sleep(3000);
const nav = (t) => js(`[...document.querySelectorAll('.nav a')].find(a=>a.textContent.startsWith(${JSON.stringify(t)})).click()`);
const closeOv = () => js(`document.querySelector('.overlay.on .close')?.click(); document.querySelector('.overlay.on')?.click()`);

await shot("04-intake");
await js(`document.querySelector('#startBtn').click()`); await sleep(2300); await shot("05-thinking");
await sleep(2400); await shot("06-icp");
await js(`document.querySelector('#icpGo').click()`); await sleep(3600); await shot("07-feed");
await js(`document.querySelectorAll('.act button')[3].click()`); await sleep(1300); await shot("08a-receipt");
await js(`document.querySelectorAll('.act button')[3].click()`); await sleep(1000);
await js(`document.querySelector('.warm button').click()`); await sleep(2200); await shot("08b-path");
await closeOv(); await sleep(600);
await js(`document.querySelectorAll('.act button')[1].click()`); await sleep(500);
await js(`const t=document.querySelector('#editText'); const set=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set; set.call(t, t.value + ' We guarantee results.'); t.dispatchEvent(new Event('input',{bubbles:true}))`); await sleep(500); await shot("09-edit");
await closeOv(); await sleep(600);
for (let i = 0; i < 3; i++) { await js(`document.querySelectorAll('.act button')[2].click()`); await sleep(1400); }
await js(`document.querySelectorAll('.act button')[2].click()`); await sleep(900); await shot("10-credit");
await js(`[...document.querySelectorAll('.overlay.on button')].find(b=>b.textContent.includes('Add 30')).click()`); await sleep(500);
await sleep(Math.max(0, 15500 - 0)); // let the schema request and signals arrive
await nav("Live signals"); await sleep(800);
await js(`document.querySelector('#msgs .ask .btn-ink')?.click()`); await sleep(1600); await shot("11-signals");
await nav("Pipeline"); await sleep(500); await js(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Simulate')).click()`); await sleep(700); await shot("12a-pipeline");
await nav("Insights"); await sleep(900); await shot("12b-insights");
await js(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Play your week')).click()`); await sleep(1200); await shot("12c-wrapped");
await closeOv(); await sleep(500);
await nav("Activity log"); await sleep(700); await shot("13-activity");
ws.close(); chrome.kill();
