// Demo data, fictional organizations. Ported from pitchfeed-v2.html.
export type Row = [string, string, number];
export type Signal = { t: string; q: string; src: string; days: number; k: string };
export type Stage = "matched" | "contacted" | "replied" | "meeting" | "closed";
export type Lead = {
  id: string; company: string; industry: string; size: string; score: number; tier: "A" | "B";
  temp: "hot" | "warm"; days: number; buyer: string; title: string; email: string; linkedin: string | null;
  signals: Signal[]; path: string[] | null; via: string | null; variant: "Quote" | "Question";
  subject: string; body: string; status: "pending" | "approved" | "rejected"; stage: Stage; by: "you" | "crew";
};
export type Incoming = { company: string; industry: string; t: string; q: string; src: string; k: string; buyer: string; title: string; score: number; tier: "A" | "B"; added?: boolean };
export type ICPT = { industries: Row[]; size: Row[]; personas: Row[]; triggers: Row[]; negatives: Row[]; expansions: Row[] };

export const ICP: ICPT = {
  industries:[["Civic and social organizations","NAICS 813410",.91],["Individual and family services","NAICS 624190",.78],["Food banks","NAICS 624210",.74]],
  size:[["1 to 200 staff","50 to 2,000 volunteers",.72],["Under $10M revenue","Nonprofit budgets",.66],["Bay Area","Region from your intake",.95]],
  personas:[["Volunteer Coordinator or Manager","Day-to-day owner",.93],["Executive Director","Budget owner",.81],["Club President","Service clubs",.77]],
  triggers:[["Hiring a volunteer coordinator","Volunteer-management pain",.88],["Big new service event","Needs many volunteers fast",.84],["Public volunteer shortage","Pain in their own words",.86],["New grant or funding","Budget for tools",.69]],
  negatives:[["Hiring or spending freeze","Drop",1],["Outside target region","Drop",1],["Already on a paid volunteer platform","Lower score",.8]],
  expansions:[["University service clubs","Same recurring-event rhythm. Students need service hours.",.71],["Company volunteer days","CSR teams run quarterly events and have budget.",.63],["City parks departments","Coordinate public cleanup days every season.",.58]]
};
export const RULES: string[][] = [["Coordinators","Friendly, practical","110 words","2-min demo video"],["Directors","Warm, outcome-first","80 words","15-min call"],["Club presidents","Community tone","90 words","Free pilot on next event"]];
type RawLead = Omit<Lead, "status" | "stage" | "by">;
const RAW_LEADS: RawLead[] = [
 {id:"l1",company:"Maple Grove Volunteer Center",industry:"Civic and social",size:"35 staff · 900 volunteers",score:86,tier:"A",temp:"hot",days:4,
  buyer:"Dana Reyes",title:"Director of Volunteer Programs",email:"dana@maplegrove-vc.example",linkedin:"linkedin.com/in/dana-reyes-demo",
  signals:[{t:"Hiring a Volunteer Coordinator",q:"seeking a Volunteer Coordinator to recruit, schedule and retain our volunteers",src:"maplegrove-vc.example/jobs",days:4,k:"hiring"},
           {t:"Weekend shifts understaffed",q:"weekend shifts were understaffed more than a third of the time",src:"maplegrove-vc.example/report",days:30,k:"pain"}],
  path:["You","Bayview State","Priya Shah","Maple Grove","Dana Reyes"],via:"Priya Shah, a fellow Bayview State alum",variant:"Question",
  subject:"Maple Grove + easier volunteer sign-ups",
  body:"Hi Dana,\n\nHow is volunteer recruiting going at Maple Grove? I read this in your recent posting: “seeking a Volunteer Coordinator to recruit, schedule and retain our volunteers.” I'm also connected to your colleague Priya Shah through Bayview State.\n\nI'm building Togather: volunteers find shifts in a short video feed, sign up in one tap and get a reminder plus a quick role video before they arrive, so fewer no-shows for your coordinators.\n\nWould a 2-minute demo video be useful for your team?\n\nSam, Togather"},
 {id:"l2",company:"Riverside Food Bank Network",industry:"Food banks",size:"80 staff · 2,000 volunteers",score:83,tier:"A",temp:"warm",days:9,
  buyer:"Alicia Chen",title:"Volunteer Manager",email:"alicia@riversidefoodbank.example",linkedin:"linkedin.com/in/alicia-chen-demo",
  signals:[{t:"Holiday volunteer shortage",q:"facing a shortage of volunteers heading into the holiday season",src:"riversidefoodbank.example/press",days:9,k:"pain"},
           {t:"New operations grant",q:"awarded a community operations grant",src:"riversidefoodbank.example/grant",days:20,k:"funding"}],
  path:["You","LaunchLab","Sam Ortiz","Riverside","Alicia Chen"],via:"Sam Ortiz, from your LaunchLab cohort",variant:"Quote",
  subject:"Holiday volunteers at Riverside",
  body:"Hi Alicia,\n\nI came across this from Riverside: “facing a shortage of volunteers heading into the holiday season.” I'm also connected to your colleague Sam Ortiz through LaunchLab.\n\nI'm building Togather so volunteers can find a shift in seconds and get reminded before they show up. It's made for exactly this kind of crunch.\n\nWould it help if I set it up free for one of your holiday drives?\n\nSam, Togather"},
 {id:"l3",company:"Harborview Kiwanis Club",industry:"Civic and social",size:"60 members",score:72,tier:"A",temp:"hot",days:6,
  buyer:"Tom Becker",title:"Club President",email:"tom@harborviewkiwanis.example",linkedin:"linkedin.com/in/tom-becker-demo",
  signals:[{t:"Spring cleanup needs 120 volunteers",q:"we will need 120 volunteers for our spring coastal cleanup",src:"harborviewkiwanis.example/news",days:6,k:"event"}],
  path:["You","Campus Union","Leo Martin","Harborview","Tom Becker"],via:"Leo Martin, who also worked at the Campus Union",variant:"Quote",
  subject:"120 volunteers for the coastal cleanup",
  body:"Hi Tom,\n\nI came across this from Harborview Kiwanis: “we will need 120 volunteers for our spring coastal cleanup.” I'm also connected to your member Leo Martin through the Campus Union at Bayview State.\n\nTogather is piloting with another Kiwanis club. Volunteers sign up in one tap, see what their role looks like, and get a reminder the day before.\n\nWant me to set up the cleanup on it, no cost?\n\nSam, Togather"},
 {id:"l4",company:"Eastside Youth Mentors",industry:"Family services",size:"12 staff · 150 mentors",score:59,tier:"B",temp:"warm",days:15,
  buyer:"Marcus Lee",title:"Executive Director",email:"marcus@eastsidementors.example",linkedin:null,
  signals:[{t:"Grant to double mentors",q:"grant will help us double the number of volunteer mentors",src:"eastsidementors.example/blog",days:15,k:"funding"}],
  path:null,via:null,variant:"Question",
  subject:"Doubling your mentor program",
  body:"Hi Marcus,\n\nHow are you planning to recruit all those new mentors? I read that your new “grant will help us double the number of volunteer mentors.”\n\nI'm building Togather to make volunteer sign-ups and onboarding feel easy, with short role videos so new mentors know what to expect.\n\nOpen to a 15-minute call next week?\n\nSam, Togather"}
];
export const makeLeads = (): Lead[] => RAW_LEADS.map((l) => ({ ...l, signals: l.signals.map((s) => ({ ...s })), status: "pending", stage: "matched", by: "crew" }));
export const INCOMING: Incoming[] = [
 {company:"Bayside Literacy Project",industry:"Civic and social",t:"Hiring a Volunteer Program Manager",q:"looking for a Volunteer Program Manager to grow our tutor community",src:"baysideliteracy.example/careers",k:"hiring",buyer:"Nina Patel",title:"Executive Director",score:78,tier:"A"},
 {company:"Sunnyvale Parks Friends",industry:"Civic and social",t:"Earth Day cleanup needs 200 volunteers",q:"aiming for 200 volunteers at this year's Earth Day cleanup",src:"svparksfriends.example/events",k:"event",buyer:"Owen Brooks",title:"Volunteer Lead",score:74,tier:"A"},
 {company:"Westgate Community Pantry",industry:"Food banks",t:"Urgent weekend volunteer need",q:"urgent need for weekend volunteers to keep our doors open",src:"westgatepantry.example/news",k:"pain",buyer:"Rosa Diaz",title:"Operations Manager",score:69,tier:"B"}
];
export const COMPETITORS: { name: string; cat: string; x: number; y: number; r: number; price: string; pos: string; gap: string; you?: boolean }[] = [
 {name:"SignUpGenius",cat:"Sign-up sheets",x:.22,y:.3,r:16,price:"Free tier plus paid plans",pos:"Generic sign-up forms for any event",gap:"No discovery, no reminders that feel personal, no role prep"},
 {name:"VolunteerHub",cat:"Volunteer management",x:.75,y:.55,r:13,price:"Paid plans, sales-led",pos:"Full volunteer database for larger orgs",gap:"Heavy setup, built for admins, not volunteers"},
 {name:"Spreadsheets + group chats",cat:"Status quo",x:.12,y:.12,r:22,price:"Free",pos:"What most small clubs use today",gap:"Manual, leaky, no-shows nobody tracks"},
 {name:"Togather",cat:"You",x:.3,y:.82,r:12,price:"Free under 50, $49/mo",pos:"Volunteer-first feed, one-tap sign-up, role videos",gap:"",you:true}
];
export const STAGES: [Stage, string][] = [["matched","Matched"],["contacted","Contacted"],["replied","Replied"],["meeting","Meeting booked"],["closed","Closed / lost"]];
export const HIST = {matched:22,contacted:14,replied:5,meeting:3,closed:1,ind:{"Civic and social":[8,4],"Food banks":[4,1],"Family services":[2,0]},tier:{A:[9,4],B:[5,1]},ab:{Quote:[7,3],Question:[7,2]},by:{you:14,crew:22}};

export const INTAKE = {
  founder: "Sam Rivera", product: "Togather", website: "togather.example",
  what: "Volunteer coordination for community groups. Volunteers find shifts in a short-video feed, sign up in one tap and get reminders, so fewer no-shows.",
  pricing: "Free under 50 volunteers, $49/mo after", customers: "1 Kiwanis club (pilot)",
  schools: "Bayview State, LaunchLab, Code Commons", workplaces: "Campus Union at Bayview State",
};
export type Intake = typeof INTAKE;

export const CREW_AV: Record<string, string> = { Planner: "c-planner", Builder: "c-builder", Reviewer: "c-reviewer", Security: "c-security", You: "c-you" };
export const tempIcon = (t: string) => (t === "hot" ? "i-sun" : t === "warm" ? "i-halfsun" : "i-moon");
export const tempLabel = (l: Lead) => `${l.temp === "hot" ? "Hot" : "Warm"} · fresh ${Math.max(0, 21 - l.days)} more days`;
export const sigIcon = (k: string) => ({ hiring: "i-grid", event: "i-star", pain: "i-chat", funding: "i-coin" } as Record<string, string>)[k] || "i-spark";
export const HYPE = ["guarantee", "100%", "risk-free", "act now", "limited time", "no-brainer", "double your"];
export const PRICES = { graph: 0.1, enrich: 5, send: 1 } as const;
export const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
