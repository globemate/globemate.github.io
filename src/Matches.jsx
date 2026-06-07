import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import { LangButton } from "./LanguageSelector";

/* ── mock matches ── */
const MOCK_MATCHES = [
  { uid:"m1",  displayName:"Sofia Chen",     location:"Barcelona, Spain",  emoji:"🌸", matchedAt: new Date(Date.now()-3600000),    visitedCountries:["JP","FR","IT","ES","PT","GR","TR","MA"], interests:["🏛️ History","🍜 Food","📸 Photography","🍷 Wine"],       travelStyles:["✨ Luxury","🏨 Boutique hotels"], upcoming:[{name:"Kyoto, Japan",status:"confirmed"},{name:"Lisbon",status:"planning"}],   languages:[{lang:"Spanish",level:"Native"},{lang:"English",level:"Fluent"}],   isNew:true  },
  { uid:"m5",  displayName:"James Mitchell", location:"London, UK",        emoji:"🗺️", matchedAt: new Date(Date.now()-7200000),    visitedCountries:["US","JP","IN","AU","ZA","BR","MX","EG","MA","TR"], interests:["🏛️ History","🌆 Cities","📸 Photography","🎭 Culture"], travelStyles:["⚡ Fast-paced","🏨 Boutique hotels"], upcoming:[{name:"Seoul",status:"confirmed"},{name:"Marrakech",status:"planning"}], languages:[{lang:"English",level:"Native"},{lang:"French",level:"Conversational"}], isNew:true },
  { uid:"m3",  displayName:"Yuki Tanaka",    location:"Tokyo, Japan",      emoji:"🌊", matchedAt: new Date(Date.now()-86400000),   visitedCountries:["NZ","IS","NO","CA","AU","NL","SE"],        interests:["🌿 Nature","🏔️ Mountains","🧘 Wellness","📸 Photography"], travelStyles:["🌱 Eco-travel","🏕️ Camping"],     upcoming:[{name:"Iceland",status:"confirmed"},{name:"New Zealand",status:"planning"}], languages:[{lang:"Japanese",level:"Native"},{lang:"English",level:"Fluent"}],   isNew:true },
  { uid:"m8",  displayName:"Nina Schmidt",   location:"Berlin, Germany",   emoji:"🎨", matchedAt: new Date(Date.now()-172800000),  visitedCountries:["PL","CZ","HU","HR","GR","IT","FR","ES","PT","IS"], interests:["🎨 Art","🎵 Music","🎭 Culture","🚂 Train travel"],   travelStyles:["🚐 Road trips","🎒 Backpacker"],  upcoming:[{name:"Porto, Portugal",status:"planning"}],                           languages:[{lang:"German",level:"Native"},{lang:"English",level:"Fluent"}],    isNew:false },
  { uid:"m9",  displayName:"Priya Sharma",   location:"Mumbai, India",     emoji:"🌺", matchedAt: new Date(Date.now()-259200000),  visitedCountries:["TH","SG","JP","FR","IT","GB","US","AU"],   interests:["🍜 Food","🏛️ History","🎭 Culture","🧘 Wellness"],        travelStyles:["🏨 Boutique hotels","✨ Luxury"],  upcoming:[{name:"Kyoto, Japan",status:"confirmed"},{name:"Amalfi",status:"planning"}], languages:[{lang:"Hindi",level:"Native"},{lang:"English",level:"Fluent"}],     isNew:false },
  { uid:"m6",  displayName:"Amara Diallo",   location:"Paris, France",     emoji:"✨", matchedAt: new Date(Date.now()-345600000),  visitedCountries:["SN","MA","IT","ES","PT","GR","US","BR"],   interests:["🎨 Art","🎪 Festivals","🍜 Food","🌆 Cities"],            travelStyles:["✨ Luxury","🏨 Boutique hotels"],  upcoming:[{name:"Florence, Italy",status:"confirmed"}],                          languages:[{lang:"French",level:"Native"},{lang:"English",level:"Fluent"}],   isNew:false },
  { uid:"m12", displayName:"Kai Nakamura",   location:"Osaka, Japan",      emoji:"🎋", matchedAt: new Date(Date.now()-432000000),  visitedCountries:["NZ","AU","IS","NO","CH","AT","NL","DE"],   interests:["🌿 Nature","🧘 Wellness","🍜 Food","🏔️ Mountains"],       travelStyles:["🌱 Eco-travel","🏕️ Camping"],     upcoming:[{name:"Patagonia, Chile",status:"planning"}],                          languages:[{lang:"Japanese",level:"Native"},{lang:"English",level:"Fluent"}],  isNew:false },
  { uid:"m10", displayName:"Alex Rivera",    location:"Singapore",         emoji:"📸", matchedAt: new Date(Date.now()-518400000),  visitedCountries:["KR","JP","TH","VN","ID","AU","NZ","US","GB","FR"], interests:["📸 Photography","🌆 Cities","🍜 Food"],                   travelStyles:["⚡ Fast-paced","🏨 Boutique hotels"], upcoming:[{name:"Seoul",status:"confirmed"},{name:"Tokyo",status:"planning"}], languages:[{lang:"English",level:"Native"},{lang:"Mandarin",level:"Conversational"}], isNew:false },
];

/* my mock profile for compatibility calculation */
const MY_PROFILE = {
  interests:    ["🏛️ History","📸 Photography","🌿 Nature","🍜 Food","🎭 Culture"],
  travelStyles: ["🏨 Boutique hotels","✨ Luxury"],
  upcoming:     [{name:"Kyoto, Japan"},{name:"Iceland"},{name:"Lisbon"}],
};

function compatibility(match) {
  const sharedInterests  = (match.interests || []).filter(i => MY_PROFILE.interests.includes(i)).length;
  const sharedStyles     = (match.travelStyles || []).filter(s => MY_PROFILE.travelStyles.includes(s)).length;
  const myDests          = MY_PROFILE.upcoming.map(d => d.name.toLowerCase());
  const sharedDests      = (match.upcoming || []).filter(d => myDests.some(m => d.name.toLowerCase().includes(m) || m.includes(d.name.toLowerCase())));
  const score = Math.min(99, sharedInterests * 14 + sharedStyles * 12 + sharedDests.length * 18 + 20);
  return { score, sharedInterests, sharedDests };
}

function ago(d, t) {
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 3600)   return t("matches.minutesAgo", { n: Math.floor(s/60) });
  if (s < 86400)  return t("matches.hoursAgo",   { n: Math.floor(s/3600) });
  if (s < 604800) return t("matches.daysAgo",    { n: Math.floor(s/86400) });
  return d.toLocaleDateString([], { month:"short", day:"numeric" });
}

const STYLE_GRADIENT = {
  "🎒 Backpacker":      "linear-gradient(135deg,#2a1c08,#1a1205)",
  "✨ Luxury":          "linear-gradient(135deg,#1e1a08,#2d2510)",
  "🏕️ Camping":        "linear-gradient(135deg,#0c1a0a,#0e2210)",
  "🏨 Boutique hotels": "linear-gradient(135deg,#150d1e,#1d1028)",
  "🚐 Road trips":      "linear-gradient(135deg,#1e1208,#281808)",
  "🛳️ Cruises":        "linear-gradient(135deg,#080f1e,#091524)",
  "🌱 Eco-travel":      "linear-gradient(135deg,#091a0d,#0d2218)",
  "⚡ Fast-paced":      "linear-gradient(135deg,#1e0808,#2a0e0e)",
};
const DEF_GRADIENT = "linear-gradient(135deg,#1a1508,#100f0a)";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  :root {
    --black:#0a0905; --dark:#100f0a; --card:#141209;
    --gold:#c9a84c; --gold-light:#e8c97a; --gold-dim:rgba(201,168,76,0.15);
    --cream:#f5f0e8; --cream-dim:rgba(245,240,232,0.55); --muted:rgba(245,240,232,0.35);
    --serif:'Cormorant Garamond',Georgia,serif; --sans:'DM Sans',sans-serif;
  }
  body { background:var(--black); color:var(--cream); font-family:var(--sans); font-weight:300; overflow-x:hidden; }

  /* nav */
  .mx-nav { position:fixed; top:0; left:0; right:0; z-index:100; display:flex; align-items:center; justify-content:space-between; padding:18px 40px; background:rgba(10,9,5,0.96); border-bottom:1px solid rgba(201,168,76,0.1); backdrop-filter:blur(8px); }
  @media(max-width:680px){ .mx-nav{ padding:14px 18px; } }
  .mx-logo { font-family:var(--serif); font-size:1.35rem; font-weight:300; letter-spacing:0.12em; color:var(--gold-light); cursor:pointer; border:none; background:none; padding:0; transition:opacity 0.2s; }
  .mx-logo:hover { opacity:0.78; }
  .mx-logo span { font-style:italic; }
  .mx-nav-actions { display:flex; gap:9px; align-items:center; }
  .mx-nav-btn { border:1px solid rgba(245,240,232,0.18); color:var(--cream-dim); background:transparent; padding:7px 18px; font-family:var(--sans); font-size:0.7rem; letter-spacing:0.13em; text-transform:uppercase; cursor:pointer; transition:all 0.22s; white-space:nowrap; }
  .mx-nav-btn:hover { border-color:var(--gold); color:var(--gold); }
  .bell-btn { position:relative; background:none; border:1px solid rgba(201,168,76,0.25); color:var(--gold); padding:6px 10px; cursor:pointer; transition:all 0.22s; font-size:1rem; display:inline-flex; align-items:center; justify-content:center; line-height:1; flex-shrink:0; }
  .bell-btn:hover { border-color:var(--gold); background:rgba(201,168,76,0.1); }
  .lang-btn { display:inline-flex !important; align-items:center; gap:6px; background:none; border:1px solid rgba(201,168,76,0.35); color:#e8c97a; cursor:pointer; font-family:inherit; font-size:0.72rem; letter-spacing:0.1em; padding:6px 10px; white-space:nowrap; flex-shrink:0; line-height:1; outline:none; transition:border-color 0.22s,color 0.22s; }
  .lang-btn:hover { border-color:#c9a84c; color:#c9a84c; }
  .bell-badge { position:absolute; top:-6px; right:-6px; background:#d32f2f; color:#fff; border-radius:50%; min-width:17px; height:17px; display:flex; align-items:center; justify-content:center; font-size:0.58rem; font-weight:700; font-family:var(--sans); border:1.5px solid var(--black); padding:0 2px; pointer-events:none; }
  @media(max-width:600px){ .mx-nav-btn.hide-xs{ display:none; } }

  /* page */
  .mx-root { min-height:100vh; background:var(--black); padding-top:70px; }

  /* hero */
  .mx-hero { padding:52px 56px 36px; position:relative; overflow:hidden; }
  .mx-hero::before { content:''; position:absolute; inset:0; background:radial-gradient(ellipse 55% 70% at 85% 40%, rgba(201,168,76,0.07) 0%,transparent 70%); pointer-events:none; }
  @media(max-width:680px){ .mx-hero{ padding:36px 20px 24px; } }
  .mx-eyebrow { font-size:0.67rem; letter-spacing:0.25em; text-transform:uppercase; color:var(--gold); margin-bottom:12px; }
  .mx-h1 { font-family:var(--serif); font-size:clamp(2.2rem,4vw,3.2rem); font-weight:300; line-height:1.08; color:var(--cream); margin-bottom:16px; }
  .mx-h1 em { font-style:italic; color:var(--gold-light); }

  /* stats bar */
  .mx-stats { display:flex; gap:32px; flex-wrap:wrap; margin-bottom:8px; }
  .mx-stat { display:flex; flex-direction:column; }
  .mx-stat-n { font-family:var(--serif); font-size:1.6rem; font-weight:300; color:var(--gold-light); line-height:1; }
  .mx-stat-l { font-size:0.64rem; letter-spacing:0.17em; text-transform:uppercase; color:var(--muted); margin-top:4px; }

  /* controls */
  .mx-controls { padding:0 56px 24px; display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  @media(max-width:680px){ .mx-controls{ padding:0 20px 20px; } }
  .mx-filter-label { font-size:0.67rem; letter-spacing:0.18em; text-transform:uppercase; color:var(--muted); margin-right:4px; }
  .mx-sort-chip { padding:7px 16px; border:1px solid rgba(201,168,76,0.2); background:transparent; color:var(--cream-dim); font-family:var(--sans); font-size:0.75rem; cursor:pointer; transition:all 0.2s; white-space:nowrap; }
  .mx-sort-chip:hover { border-color:rgba(201,168,76,0.5); color:var(--cream); }
  .mx-sort-chip.on { background:rgba(201,168,76,0.15); border-color:var(--gold); color:var(--gold-light); }
  .mx-new-only { display:flex; align-items:center; gap:8px; margin-left:auto; font-size:0.75rem; color:var(--muted); cursor:pointer; user-select:none; }
  .mx-toggle { width:36px; height:20px; border-radius:10px; background:rgba(245,240,232,0.1); border:1px solid rgba(201,168,76,0.2); position:relative; transition:background 0.25s; flex-shrink:0; }
  .mx-toggle.on { background:rgba(201,168,76,0.3); border-color:var(--gold); }
  .mx-toggle-dot { position:absolute; top:2px; left:2px; width:14px; height:14px; border-radius:50%; background:var(--muted); transition:all 0.25s; }
  .mx-toggle.on .mx-toggle-dot { left:18px; background:var(--gold); }

  /* grid */
  .mx-grid { padding:0 56px 80px; display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:24px; }
  @media(max-width:680px){ .mx-grid{ padding:0 16px 60px; gap:16px; } }

  /* card */
  .mx-card { background:var(--card); border:1px solid rgba(201,168,76,0.1); display:flex; flex-direction:column; overflow:hidden; transition:border-color 0.28s, transform 0.28s; position:relative; }
  .mx-card:hover { border-color:rgba(201,168,76,0.38); transform:translateY(-3px); }

  .mx-card-banner { height:120px; position:relative; display:flex; align-items:flex-end; justify-content:center; flex-shrink:0; }
  .mx-card-banner-overlay { position:absolute; inset:0; background:linear-gradient(to bottom, transparent 30%, rgba(20,18,9,0.92) 100%); }
  .mx-card-avatar { position:relative; z-index:1; width:70px; height:70px; border-radius:50%; border:2.5px solid var(--gold); background:rgba(10,9,5,0.8); display:flex; align-items:center; justify-content:center; font-size:1.9rem; margin-bottom:-35px; overflow:hidden; flex-shrink:0; }
  .mx-card-avatar img { width:100%; height:100%; object-fit:cover; }

  /* new badge */
  .mx-new-badge { position:absolute; top:12px; left:12px; z-index:1; background:var(--gold); color:var(--black); padding:3px 9px; font-family:var(--sans); font-size:0.6rem; font-weight:500; letter-spacing:0.14em; text-transform:uppercase; }

  /* compat ring */
  .mx-compat { position:absolute; top:10px; right:12px; z-index:1; display:flex; flex-direction:column; align-items:center; }
  .mx-compat-score { font-family:var(--serif); font-size:1.15rem; font-weight:300; color:var(--gold-light); line-height:1; }
  .mx-compat-label { font-size:0.56rem; letter-spacing:0.14em; text-transform:uppercase; color:var(--muted); margin-top:1px; }

  /* body */
  .mx-card-body { padding:44px 20px 18px; flex:1; display:flex; flex-direction:column; gap:9px; }
  .mx-card-name { font-family:var(--serif); font-size:1.12rem; font-weight:300; color:var(--cream); display:flex; align-items:center; gap:7px; }
  .mx-verified { width:13px; height:13px; background:var(--gold); border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:0.52rem; color:var(--black); flex-shrink:0; }
  .mx-location { font-size:0.77rem; color:var(--cream-dim); display:flex; align-items:center; gap:5px; }
  .mx-matched-at { font-size:0.69rem; color:var(--muted); }

  /* shared row */
  .mx-shared { background:rgba(201,168,76,0.06); border:1px solid rgba(201,168,76,0.14); padding:8px 12px; display:flex; align-items:flex-start; gap:8px; }
  .mx-shared-label { font-size:0.64rem; letter-spacing:0.12em; text-transform:uppercase; color:var(--gold); flex-shrink:0; margin-top:1px; }
  .mx-shared-text { font-size:0.77rem; color:var(--cream-dim); line-height:1.5; }

  /* interests */
  .mx-chips { display:flex; flex-wrap:wrap; gap:5px; }
  .mx-chip { font-size:0.7rem; padding:3px 9px; background:rgba(201,168,76,0.07); border:1px solid rgba(201,168,76,0.18); color:var(--cream-dim); white-space:nowrap; }
  .mx-chip.shared { border-color:rgba(201,168,76,0.4); color:var(--gold-light); background:rgba(201,168,76,0.12); }

  /* footer */
  .mx-card-footer { margin-top:auto; padding-top:12px; display:flex; gap:8px; }
  .mx-msg-btn { flex:1; background:var(--gold); color:var(--black); border:none; padding:10px 0; font-family:var(--sans); font-size:0.71rem; font-weight:500; letter-spacing:0.14em; text-transform:uppercase; cursor:pointer; transition:background 0.22s; }
  .mx-msg-btn:hover { background:var(--gold-light); }
  .mx-view-btn { background:rgba(245,240,232,0.04); border:1px solid rgba(245,240,232,0.12); color:var(--cream-dim); padding:10px 14px; font-family:var(--sans); font-size:0.71rem; cursor:pointer; transition:all 0.22s; }
  .mx-view-btn:hover { border-color:rgba(201,168,76,0.3); color:var(--cream); }

  /* empty */
  .mx-empty { padding:80px 40px; text-align:center; }
  .mx-empty-icon { font-size:3rem; opacity:0.35; margin-bottom:18px; }
  .mx-empty-txt { font-family:var(--serif); font-size:1.4rem; font-weight:300; color:var(--cream-dim); margin-bottom:8px; }
  .mx-empty-sub { font-size:0.82rem; color:var(--muted); line-height:1.7; }
  .mx-explore-btn { display:inline-block; margin-top:20px; border:1px solid var(--gold); color:var(--gold); background:transparent; padding:11px 32px; font-family:var(--sans); font-size:0.74rem; letter-spacing:0.15em; text-transform:uppercase; cursor:pointer; transition:all 0.25s; }
  .mx-explore-btn:hover { background:var(--gold); color:var(--black); }

  /* desktop-only nav items */
  @media(max-width:860px){ .mx-desktop{ display:none !important; } }

  /* hamburger */
  .mx-hamburger { display:none; flex-direction:column; gap:5px; background:none; border:none; cursor:pointer; padding:6px; flex-shrink:0; }
  @media(max-width:860px){ .mx-hamburger { display:flex; } }
  .mx-hamburger span { display:block; width:22px; height:1.5px; background:var(--gold); transition:transform 0.3s; }

  /* mobile nav overlay */
  .mob-nav { position:fixed; inset:0; z-index:500; background:rgba(10,9,5,0.98); backdrop-filter:blur(12px); display:flex; flex-direction:column; padding:28px 32px 40px; opacity:0; visibility:hidden; transition:opacity 0.3s,visibility 0.3s; overflow-y:auto; }
  .mob-nav.open { opacity:1; visibility:visible; }
  .mob-nav-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:36px; }
  .mob-nav-logo { font-family:var(--serif); font-size:1.4rem; font-weight:300; letter-spacing:0.12em; color:var(--gold-light); }
  .mob-nav-logo span { font-style:italic; }
  .mob-nav-close { background:none; border:none; color:var(--cream-dim); font-size:1.5rem; cursor:pointer; padding:4px 8px; line-height:1; }
  .mob-nav-link { background:none; border:none; color:var(--cream-dim); font-family:var(--sans); font-size:1rem; letter-spacing:0.12em; text-transform:uppercase; text-align:left; padding:18px 0; cursor:pointer; border-bottom:1px solid rgba(201,168,76,0.08); transition:color 0.2s; display:block; width:100%; }
  .mob-nav-link:hover { color:var(--cream); }
  .mob-nav-link.gold { color:var(--gold); }
  .mob-nav-divider { height:1px; background:rgba(201,168,76,0.12); margin:8px 0; }
`;


function MatchCard({ m, onMessage }) {
  const { t } = useTranslation();
  const { score, sharedInterests, sharedDests } = compatibility(m);
  const gradient = m.travelStyles?.[0] ? (STYLE_GRADIENT[m.travelStyles[0]] || DEF_GRADIENT) : DEF_GRADIENT;
  const sharedInterestList = (m.interests || []).filter(i => MY_PROFILE.interests.includes(i));
  const otherInterests     = (m.interests || []).filter(i => !MY_PROFILE.interests.includes(i)).slice(0, 2);

  return (
    <div className="mx-card">
      <div className="mx-card-banner" style={{ background: gradient }}>
        <div className="mx-card-banner-overlay" />
        {m.isNew && <span className="mx-new-badge">New</span>}
        <div className="mx-compat">
          <span className="mx-compat-score">{score}%</span>
          <span className="mx-compat-label">match</span>
        </div>
        <div className="mx-card-avatar">
          {m.photoURL ? <img src={m.photoURL} alt={m.displayName} /> : m.emoji}
        </div>
      </div>

      <div className="mx-card-body">
        <div>
          <div className="mx-card-name">
            {m.displayName}
            <span className="mx-verified">✓</span>
          </div>
          <div className="mx-location">📍 {m.location}</div>
          <div className="mx-matched-at">{t("matches.matchedAgo", { time: ago(m.matchedAt, t) })}</div>
        </div>

        {sharedDests.length > 0 && (
          <div className="mx-shared">
            <span className="mx-shared-label">✈️ {t("map.goingTo")}</span>
            <span className="mx-shared-text">{sharedDests.map(d => d.name).join(" · ")}</span>
          </div>
        )}

        {(sharedInterestList.length > 0 || otherInterests.length > 0) && (
          <div className="mx-chips">
            {sharedInterestList.map(i => <span key={i} className="mx-chip shared">{i}</span>)}
            {otherInterests.map(i => <span key={i} className="mx-chip">{i}</span>)}
            {(m.interests || []).length > sharedInterestList.length + otherInterests.length && (
              <span className="mx-chip">+{(m.interests || []).length - sharedInterestList.length - otherInterests.length}</span>
            )}
          </div>
        )}

        <div style={{ fontSize:"0.72rem", color:"var(--muted)" }}>
          🌍 {(m.visitedCountries||[]).length} countries · 🗣️ {(m.languages||[]).map(l=>l.lang).slice(0,2).join(", ")}
        </div>

        <div className="mx-card-footer">
          <button className="mx-msg-btn" onClick={onMessage}>{t("matches.message")}</button>
          <button className="mx-view-btn">{t("common.viewProfile")}</button>
        </div>
      </div>
    </div>
  );
}

export default function Matches({ user, onBack, onProfile, onExplore, onMatches, onChat, onMap, onSignOut, onNotif, notifCount, onSettings, onPricing }) {
  const { t } = useTranslation();
  const SORTS = [
    { key:"recent",   label: t("matches.sortRecent") },
    { key:"compat",   label: t("matches.sortCompat") },
    { key:"shared",   label: t("matches.sortShared") },
    { key:"countries",label: t("matches.sortCountries") },
  ];
  const [matches, setMatches]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [sort, setSort]           = useState("recent");
  const [newOnly, setNewOnly]     = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, "matches"));
        const real = snap.docs.map(d => ({ uid: d.id, ...d.data() })).filter(m => m.uid !== user?.uid);
        setMatches(real.length >= 2 ? real : [...real, ...MOCK_MATCHES.slice(0, 8 - real.length)]);
      } catch {
        setMatches(MOCK_MATCHES);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const sorted = [...(newOnly ? matches.filter(m => m.isNew) : matches)].sort((a, b) => {
    if (sort === "recent")    return new Date(b.matchedAt) - new Date(a.matchedAt);
    if (sort === "compat")    return compatibility(b).score - compatibility(a).score;
    if (sort === "shared")    return compatibility(b).sharedDests.length - compatibility(a).sharedDests.length;
    if (sort === "countries") return (b.visitedCountries||[]).length - (a.visitedCountries||[]).length;
    return 0;
  });

  const newCount      = matches.filter(m => m.isNew).length;
  const sharedDestAll = matches.reduce((acc, m) => acc + compatibility(m).sharedDests.length, 0);

  return (
    <>
      <style>{css}</style>

      {/* mobile nav overlay */}
      <div className={`mob-nav${menuOpen ? " open" : ""}`}>
        <div className="mob-nav-top">
          <div className="mob-nav-logo">Globe<span>Mate</span></div>
          <button className="mob-nav-close" onClick={() => setMenuOpen(false)}>✕</button>
        </div>
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onBack(); }}>{t("nav.home")}</button>
        <div className="mob-nav-divider" />
        <button className="mob-nav-link gold" onClick={() => { setMenuOpen(false); onExplore(); }}>{t("nav.explore")}</button>
        <button className="mob-nav-link gold" onClick={() => { setMenuOpen(false); onMatches(); }}>{t("nav.matches")}</button>
        <button className="mob-nav-link gold" onClick={() => { setMenuOpen(false); onChat(); }}>{t("nav.messages")}</button>
        <button className="mob-nav-link gold" onClick={() => { setMenuOpen(false); onMap(); }}>{t("nav.map")}</button>
        <div className="mob-nav-divider" />
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onProfile(); }}>{t("nav.myProfile")}</button>
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onNotif(); }}>
          {t("nav.notifications")}{notifCount > 0 ? ` (${notifCount})` : ""}
        </button>
        <div className="mob-nav-divider" />
        <button className="mob-nav-link gold" onClick={() => { setMenuOpen(false); onPricing?.(); }}>{t("nav.plans")}</button>
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onSettings?.(); }}>{t("nav.settings")}</button>
        <div className="mob-nav-divider" />
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onSignOut(); }}>{t("nav.signOut")}</button>
      </div>

      <div className="mx-root">

        {/* navbar */}
        <nav className="mx-nav">
          <button className="mx-logo" onClick={onBack}>Globe<span>Mate</span></button>
          <div className="mx-nav-actions">
            <button className="mx-nav-btn mx-desktop" onClick={onExplore}>{t("nav.explore")}</button>
            <button className="mx-nav-btn mx-desktop" onClick={onChat}>{t("nav.messages")}</button>
            <LangButton align="right" />
            {onNotif && (
              <button className="bell-btn" onClick={onNotif}>
                🔔{notifCount > 0 && <span className="bell-badge">{notifCount > 9 ? "9+" : notifCount}</span>}
              </button>
            )}
            <button className="mx-nav-btn mx-desktop" onClick={onProfile}>{t("nav.myProfile")}</button>
            <button className="mx-nav-btn mx-desktop" style={{borderColor:"#c9a84c",color:"#c9a84c"}} onClick={onPricing}>{t("nav.plans")}</button>
            <button className="mx-nav-btn mx-desktop" onClick={onSignOut}>{t("nav.signOut")}</button>
            <button className="mx-hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <span /><span /><span />
            </button>
          </div>
        </nav>

        {/* hero */}
        <div className="mx-hero">
          <div className="mx-eyebrow">{t("matches.subtitle")}</div>
          <h1 className="mx-h1">{t("matches.title").split(" ").slice(0,-1).join(" ")} <em>{t("matches.title").split(" ").slice(-1)}</em></h1>
          {!loading && (
            <div className="mx-stats">
              <div className="mx-stat">
                <span className="mx-stat-n">{matches.length}</span>
                <span className="mx-stat-l">{t("matches.title")}</span>
              </div>
              <div className="mx-stat">
                <span className="mx-stat-n">{newCount}</span>
                <span className="mx-stat-l">{t("explore.title")}</span>
              </div>
              <div className="mx-stat">
                <span className="mx-stat-n">{sharedDestAll}</span>
                <span className="mx-stat-l">{t("explore.sharedDestinations")}</span>
              </div>
            </div>
          )}
        </div>

        {/* controls */}
        <div className="mx-controls">
          <span className="mx-filter-label">{t("matches.sortLabel")}</span>
          {SORTS.map(s => (
            <button key={s.key} className={`mx-sort-chip${sort === s.key ? " on" : ""}`} onClick={() => setSort(s.key)}>
              {s.label}
            </button>
          ))}
          <label className="mx-new-only">
            <div className={`mx-toggle${newOnly ? " on" : ""}`} onClick={() => setNewOnly(v => !v)}>
              <div className="mx-toggle-dot" />
            </div>
            {t("matches.newOnly")}
          </label>
        </div>

        {/* content */}
        {loading ? (
          <div style={{ padding:"80px 56px", textAlign:"center", fontSize:"0.8rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(245,240,232,0.3)" }}>
            {t("matches.loadingMatches")}
          </div>
        ) : sorted.length === 0 ? (
          <div className="mx-empty">
            <div className="mx-empty-icon">💫</div>
            <div className="mx-empty-txt">{newOnly ? t("matches.noNewMatches") : t("matches.noMatches")}</div>
            <div className="mx-empty-sub">
              {newOnly ? t("matches.noNewMatchesHint") : t("matches.noMatchesHint")}
            </div>
            {!newOnly && (
              <button className="mx-explore-btn" onClick={onExplore}>{t("matches.exploreTravelers")}</button>
            )}
          </div>
        ) : (
          <div className="mx-grid">
            {sorted.map(m => (
              <MatchCard key={m.uid} m={m} onMessage={onChat} />
            ))}
          </div>
        )}

      </div>
    </>
  );
}
