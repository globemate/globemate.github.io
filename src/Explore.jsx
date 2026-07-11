import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, getDocs, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import { LangButton } from "./LanguageSelector";

/* ── mock travelers (shown when Firestore has few real users) ── */
const MOCK = [
  { uid:"m1", displayName:"Sofia Chen",      location:"Barcelona, Spain",    emoji:"🌸", visitedCountries:["JP","FR","IT","ES","PT","GR","TR","MA"], interests:["🏛️ History","🍜 Food","📸 Photography","🍷 Wine"],          travelStyles:["✨ Luxury","🏨 Boutique hotels"],  languages:[{lang:"Spanish",level:"Native"},{lang:"English",level:"Fluent"}],   upcoming:[{name:"Kyoto, Japan",status:"confirmed"},{name:"Lisbon",status:"planning"}] },
  { uid:"m2", displayName:"Marco Rossi",      location:"Milan, Italy",        emoji:"🎸", visitedCountries:["FR","ES","GR","HR","PT","JP","US"],        interests:["🎨 Art","🎪 Festivals","🍷 Wine","🎭 Culture"],           travelStyles:["🏨 Boutique hotels","✨ Luxury"],  languages:[{lang:"Italian",level:"Native"},{lang:"English",level:"Fluent"},{lang:"French",level:"Conversational"}], upcoming:[{name:"Tokyo, Japan",status:"confirmed"},{name:"Lisbon",status:"planning"}] },
  { uid:"m3", displayName:"Yuki Tanaka",      location:"Tokyo, Japan",        emoji:"🌊", visitedCountries:["NZ","IS","NO","CA","AU","NL","SE"],         interests:["🌿 Nature","🏔️ Mountains","🧘 Wellness","📸 Photography"],travelStyles:["🌱 Eco-travel","🏕️ Camping"],      languages:[{lang:"Japanese",level:"Native"},{lang:"English",level:"Fluent"}],   upcoming:[{name:"Iceland",status:"confirmed"},{name:"New Zealand",status:"planning"}] },
  { uid:"m4", displayName:"Elena Vasquez",    location:"Buenos Aires, AR",    emoji:"💃", visitedCountries:["ES","PT","IT","FR","CL","PE","CO","MX"],    interests:["🎭 Culture","🎵 Music","🍜 Food","🎪 Festivals"],         travelStyles:["🎒 Backpacker","🚐 Road trips"],  languages:[{lang:"Spanish",level:"Native"},{lang:"English",level:"Conversational"},{lang:"Portuguese",level:"Basic"}], upcoming:[{name:"Barcelona, Spain",status:"confirmed"}] },
  { uid:"m5", displayName:"James Mitchell",   location:"London, UK",          emoji:"🗺️", visitedCountries:["US","JP","IN","AU","ZA","BR","MX","EG","MA","TR"], interests:["🏛️ History","🌆 Cities","📸 Photography","🎭 Culture"], travelStyles:["⚡ Fast-paced","🏨 Boutique hotels"], languages:[{lang:"English",level:"Native"},{lang:"French",level:"Conversational"}], upcoming:[{name:"Seoul, South Korea",status:"confirmed"},{name:"Marrakech",status:"planning"}] },
  { uid:"m6", displayName:"Amara Diallo",     location:"Paris, France",       emoji:"✨", visitedCountries:["SN","MA","IT","ES","PT","GR","US","BR"],   interests:["🎨 Art","🎪 Festivals","🍜 Food","🌆 Cities"],           travelStyles:["✨ Luxury","🏨 Boutique hotels"],  languages:[{lang:"French",level:"Native"},{lang:"English",level:"Fluent"},{lang:"Arabic",level:"Conversational"}], upcoming:[{name:"Florence, Italy",status:"confirmed"},{name:"São Paulo",status:"planning"}] },
  { uid:"m7", displayName:"Lucas Oliveira",   location:"São Paulo, Brazil",   emoji:"🏄", visitedCountries:["AR","CL","PE","CO","MX","US","PT","ES"],   interests:["🏖️ Beaches","🏄 Adventure","🎵 Music","🌿 Nature"],      travelStyles:["🎒 Backpacker","🏄 Adventure"],   languages:[{lang:"Portuguese",level:"Native"},{lang:"Spanish",level:"Fluent"},{lang:"English",level:"Conversational"}], upcoming:[{name:"Bali, Indonesia",status:"confirmed"}] },
  { uid:"m8", displayName:"Nina Schmidt",     location:"Berlin, Germany",     emoji:"🎨", visitedCountries:["PL","CZ","HU","HR","GR","IT","FR","ES","PT","IS"], interests:["🎨 Art","🎵 Music","🎭 Culture","🚂 Train travel"],  travelStyles:["🚐 Road trips","🎒 Backpacker"],  languages:[{lang:"German",level:"Native"},{lang:"English",level:"Fluent"},{lang:"French",level:"Basic"}], upcoming:[{name:"Porto, Portugal",status:"planning"},{name:"Tallinn, Estonia",status:"planning"}] },
  { uid:"m9", displayName:"Priya Sharma",     location:"Mumbai, India",       emoji:"🌺", visitedCountries:["TH","SG","JP","FR","IT","GB","US","AU"],   interests:["🍜 Food","🏛️ History","🎭 Culture","🧘 Wellness"],       travelStyles:["🏨 Boutique hotels","✨ Luxury"],  languages:[{lang:"Hindi",level:"Native"},{lang:"English",level:"Fluent"}], upcoming:[{name:"Kyoto, Japan",status:"confirmed"},{name:"Amalfi, Italy",status:"planning"}] },
  { uid:"m10",displayName:"Alex Rivera",      location:"Singapore",           emoji:"📸", visitedCountries:["KR","JP","TH","VN","ID","AU","NZ","US","GB","FR"], interests:["📸 Photography","🌆 Cities","🍜 Food","⚡ Adventure"], travelStyles:["⚡ Fast-paced","🏨 Boutique hotels"], languages:[{lang:"English",level:"Native"},{lang:"Mandarin",level:"Conversational"}], upcoming:[{name:"Seoul, South Korea",status:"confirmed"},{name:"Tokyo",status:"planning"}] },
  { uid:"m11",displayName:"Isabella Torres",  location:"Mexico City, Mexico", emoji:"🌮", visitedCountries:["ES","PT","IT","FR","GR","CU","CO","PE"],   interests:["🍜 Food","🏛️ History","🎭 Culture","🎪 Festivals"],     travelStyles:["🎒 Backpacker","🌱 Eco-travel"],  languages:[{lang:"Spanish",level:"Native"},{lang:"English",level:"Fluent"},{lang:"Italian",level:"Basic"}], upcoming:[{name:"Oaxaca, Mexico",status:"confirmed"},{name:"Barcelona",status:"planning"}] },
  { uid:"m12",displayName:"Kai Nakamura",     location:"Osaka, Japan",        emoji:"🎋", visitedCountries:["NZ","AU","IS","NO","CH","AT","NL","DE"],   interests:["🌿 Nature","🧘 Wellness","🍜 Food","🏔️ Mountains"],      travelStyles:["🌱 Eco-travel","🏕️ Camping"],      languages:[{lang:"Japanese",level:"Native"},{lang:"English",level:"Fluent"}], upcoming:[{name:"Patagonia, Chile",status:"planning"},{name:"Faroe Islands",status:"planning"}] },
];

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

const ALL_STYLES = ["🎒 Backpacker","✨ Luxury","🏕️ Camping","🏨 Boutique hotels","🚐 Road trips","🛳️ Cruises","🌱 Eco-travel","⚡ Fast-paced"];
const ALL_LANGS  = ["English","Spanish","French","Portuguese","Italian","German","Japanese","Mandarin","Arabic","Russian","Hindi","Korean"];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --black:#0a0905; --dark:#100f0a; --card:#141209;
    --gold:#c9a84c; --gold-light:#e8c97a; --gold-dim:rgba(201,168,76,0.15);
    --cream:#f5f0e8; --cream-dim:rgba(245,240,232,0.55); --muted:rgba(245,240,232,0.35);
    --serif:'Cormorant Garamond',Georgia,serif; --sans:'DM Sans',sans-serif;
  }
  body { background:var(--black); color:var(--cream); font-family:var(--sans); font-weight:300; overflow-x:hidden; }

  /* nav */
  .ex-nav { position:fixed; top:0; left:0; right:0; z-index:100; display:flex; align-items:center; justify-content:space-between; padding:22px 56px; background:rgba(10,9,5,0.96); border-bottom:1px solid rgba(201,168,76,0.1); backdrop-filter:blur(8px); }
  @media(max-width:680px){ .ex-nav{ padding:18px 20px; } }
  .ex-logo { font-family:var(--serif); font-size:1.4rem; font-weight:300; letter-spacing:0.12em; color:var(--gold-light); cursor:pointer; border:none; background:none; padding:0; transition:opacity 0.2s; }
  .ex-logo:hover { opacity:0.8; }
  .ex-logo span { font-style:italic; }
  .ex-nav-actions { display:flex; gap:10px; align-items:center; }
  .ex-nav-btn { border:1px solid var(--gold); color:var(--gold); background:transparent; padding:9px 22px; font-family:var(--sans); font-size:0.72rem; letter-spacing:0.14em; text-transform:uppercase; cursor:pointer; transition:all 0.25s; white-space:nowrap; }
  .ex-nav-btn:hover { background:var(--gold); color:var(--black); }
  .ex-nav-btn.ghost { border-color:rgba(245,240,232,0.2); color:var(--cream-dim); }
  .ex-nav-btn.ghost:hover { border-color:var(--gold); color:var(--gold); background:transparent; }
  .bell-btn { position:relative; background:none; border:1px solid rgba(201,168,76,0.25); color:var(--gold); padding:6px 10px; cursor:pointer; transition:all 0.22s; font-size:1rem; display:inline-flex; align-items:center; justify-content:center; line-height:1; flex-shrink:0; }
  .bell-btn:hover { border-color:var(--gold); background:rgba(201,168,76,0.1); }
  .lang-btn { display:inline-flex !important; align-items:center; gap:6px; background:none; border:1px solid rgba(201,168,76,0.35); color:#e8c97a; cursor:pointer; font-family:inherit; font-size:0.72rem; letter-spacing:0.1em; padding:6px 10px; white-space:nowrap; flex-shrink:0; line-height:1; outline:none; transition:border-color 0.22s,color 0.22s; }
  .lang-btn:hover { border-color:#c9a84c; color:#c9a84c; }
  .bell-badge { position:absolute; top:-6px; right:-6px; background:#d32f2f; color:#fff; border-radius:50%; min-width:17px; height:17px; display:flex; align-items:center; justify-content:center; font-size:0.58rem; font-weight:700; font-family:var(--sans); border:1.5px solid var(--black); padding:0 2px; pointer-events:none; }

  /* page */
  .ex-root { min-height:100vh; background:var(--black); padding-top:72px; }

  /* header */
  .ex-hero { padding:60px 56px 40px; position:relative; overflow:hidden; }
  .ex-hero::before { content:''; position:absolute; inset:0; background:radial-gradient(ellipse 60% 80% at 80% 50%,rgba(201,168,76,0.06) 0%,transparent 70%); pointer-events:none; }
  @media(max-width:680px){ .ex-hero{ padding:40px 24px 30px; } }
  .ex-eyebrow { font-size:0.68rem; letter-spacing:0.25em; text-transform:uppercase; color:var(--gold); margin-bottom:14px; }
  .ex-h1 { font-family:var(--serif); font-size:clamp(2.2rem,4vw,3.4rem); font-weight:300; line-height:1.08; color:var(--cream); margin-bottom:14px; }
  .ex-h1 em { font-style:italic; color:var(--gold-light); }
  .ex-sub { font-size:0.88rem; color:var(--cream-dim); line-height:1.7; max-width:500px; }

  /* search + filters */
  .ex-controls { padding:0 56px 32px; display:flex; flex-direction:column; gap:16px; }
  @media(max-width:680px){ .ex-controls{ padding:0 20px 24px; } }
  .ex-search-wrap { position:relative; max-width:480px; }
  .ex-search { width:100%; background:rgba(245,240,232,0.04); border:1px solid rgba(201,168,76,0.2); color:var(--cream); padding:13px 16px 13px 44px; font-family:var(--sans); font-size:0.88rem; font-weight:300; outline:none; transition:border-color 0.25s; }
  .ex-search:focus { border-color:var(--gold); }
  .ex-search::placeholder { color:var(--muted); }
  .ex-search-icon { position:absolute; left:15px; top:50%; transform:translateY(-50%); color:var(--muted); font-size:0.9rem; pointer-events:none; }
  .ex-filter-row { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
  .ex-filter-label { font-size:0.67rem; letter-spacing:0.18em; text-transform:uppercase; color:var(--muted); margin-right:4px; }
  .ex-filter-chip { padding:6px 14px; border:1px solid rgba(201,168,76,0.2); background:transparent; color:var(--cream-dim); font-family:var(--sans); font-size:0.75rem; cursor:pointer; transition:all 0.2s; white-space:nowrap; }
  .ex-filter-chip:hover { border-color:rgba(201,168,76,0.5); color:var(--cream); }
  .ex-filter-chip.on { background:rgba(201,168,76,0.15); border-color:var(--gold); color:var(--gold-light); }
  .ex-sort-sel { background:rgba(245,240,232,0.04); border:1px solid rgba(201,168,76,0.18); color:var(--cream-dim); padding:6px 14px; font-family:var(--sans); font-size:0.75rem; outline:none; cursor:pointer; margin-left:auto; }
  .ex-sort-sel option { background:#141209; }

  /* results bar */
  .ex-results-bar { padding:0 56px 20px; display:flex; align-items:center; gap:16px; }
  @media(max-width:680px){ .ex-results-bar{ padding:0 20px 16px; } }
  .ex-count { font-size:0.78rem; color:var(--muted); letter-spacing:0.06em; }
  .ex-clear { background:none; border:none; color:var(--gold); font-family:var(--sans); font-size:0.72rem; cursor:pointer; letter-spacing:0.1em; text-transform:uppercase; padding:0; transition:color 0.2s; }
  .ex-clear:hover { color:var(--gold-light); }

  /* grid */
  .ex-grid { padding:0 56px 80px; display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:24px; }
  @media(max-width:680px){ .ex-grid{ padding:0 16px 60px; gap:16px; } }

  /* card */
  .ex-card { background:var(--card); border:1px solid rgba(201,168,76,0.1); display:flex; flex-direction:column; overflow:hidden; transition:border-color 0.3s,transform 0.3s; }
  .ex-card:hover { border-color:rgba(201,168,76,0.35); transform:translateY(-3px); }
  .ex-card-banner { height:130px; position:relative; display:flex; align-items:flex-end; justify-content:center; padding-bottom:0; flex-shrink:0; }
  .ex-card-banner-overlay { position:absolute; inset:0; background:linear-gradient(to bottom,transparent 40%,rgba(20,18,9,0.9) 100%); }
  .ex-card-avatar { position:relative; z-index:1; width:72px; height:72px; border-radius:50%; border:2.5px solid var(--gold); background:rgba(10,9,5,0.8); display:flex; align-items:center; justify-content:center; font-size:2rem; margin-bottom:-36px; overflow:hidden; flex-shrink:0; }
  .ex-card-avatar img { width:100%; height:100%; object-fit:cover; }
  .ex-card-countries { position:absolute; top:12px; right:12px; z-index:1; background:rgba(10,9,5,0.75); border:1px solid rgba(201,168,76,0.3); color:var(--gold); padding:3px 9px; font-size:0.65rem; letter-spacing:0.12em; text-transform:uppercase; }
  .ex-card-body { padding:44px 20px 20px; flex:1; display:flex; flex-direction:column; gap:10px; }
  .ex-card-name { font-family:var(--serif); font-size:1.15rem; font-weight:300; color:var(--cream); display:flex; align-items:center; gap:8px; line-height:1.2; }
  .ex-card-verified { width:14px; height:14px; background:var(--gold); border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:0.55rem; color:var(--black); flex-shrink:0; }
  .ex-card-location { font-size:0.78rem; color:var(--cream-dim); display:flex; align-items:center; gap:5px; }
  .ex-card-dest { font-size:0.75rem; color:var(--muted); display:flex; align-items:center; gap:5px; background:rgba(245,240,232,0.03); border:1px solid rgba(201,168,76,0.1); padding:5px 10px; }
  .ex-card-dest-status { font-size:0.62rem; letter-spacing:0.1em; text-transform:uppercase; padding:1px 6px; border:1px solid; flex-shrink:0; }
  .ex-card-dest-status.confirmed { color:#6fcf97; border-color:rgba(111,207,151,0.35); }
  .ex-card-dest-status.planning  { color:var(--gold); border-color:rgba(201,168,76,0.3); }
  .ex-card-interests { display:flex; flex-wrap:wrap; gap:5px; }
  .ex-interest-tag { font-size:0.7rem; padding:3px 9px; background:rgba(201,168,76,0.08); border:1px solid rgba(201,168,76,0.18); color:var(--cream-dim); white-space:nowrap; }
  .ex-interest-more { font-size:0.7rem; padding:3px 9px; color:var(--muted); border:1px solid rgba(245,240,232,0.1); }
  .ex-card-langs { font-size:0.72rem; color:var(--muted); }
  .ex-card-footer { margin-top:auto; padding-top:10px; display:flex; gap:8px; }
  .ex-connect-btn { flex:1; background:transparent; border:1px solid var(--gold); color:var(--gold); padding:10px 0; font-family:var(--sans); font-size:0.72rem; letter-spacing:0.15em; text-transform:uppercase; cursor:pointer; transition:all 0.25s; }
  .ex-connect-btn:hover { background:var(--gold); color:var(--black); }
  .ex-connect-btn.connected { background:rgba(111,207,151,0.12); border-color:rgba(111,207,151,0.4); color:#6fcf97; cursor:default; }
  .ex-view-btn { background:rgba(245,240,232,0.04); border:1px solid rgba(245,240,232,0.12); color:var(--cream-dim); padding:10px 14px; font-family:var(--sans); font-size:0.72rem; cursor:pointer; transition:all 0.25s; }
  .ex-view-btn:hover { border-color:rgba(201,168,76,0.3); color:var(--cream); }

  /* empty */
  .ex-empty { padding:80px 56px; text-align:center; }
  .ex-empty-icon { font-size:3rem; margin-bottom:20px; opacity:0.4; }
  .ex-empty-text { font-family:var(--serif); font-size:1.4rem; font-weight:300; color:var(--cream-dim); margin-bottom:8px; }
  .ex-empty-sub { font-size:0.82rem; color:var(--muted); }

  /* loading */
  .ex-loading { padding:120px 56px; text-align:center; font-size:0.8rem; letter-spacing:0.2em; text-transform:uppercase; color:rgba(245,240,232,0.3); }

  /* desktop-only nav items */
  @media(max-width:860px){ .ex-desktop{ display:none !important; } }

  /* hamburger button */
  .ex-hamburger { display:none; flex-direction:column; gap:5px; background:none; border:none; cursor:pointer; padding:6px; flex-shrink:0; }
  @media(max-width:860px){ .ex-hamburger { display:flex; } }
  .ex-hamburger span { display:block; width:22px; height:1.5px; background:var(--gold); transition:transform 0.3s; }

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

function TravelerCard({ traveler, connected, onConnect }) {
  const { t } = useTranslation();
  const gradient = traveler.travelStyles?.[0] ? (STYLE_GRADIENT[traveler.travelStyles[0]] || DEF_GRADIENT) : DEF_GRADIENT;
  const shownInterests = (traveler.interests || []).slice(0, 3);
  const extraInterests = (traveler.interests || []).length - 3;
  const nextTrip = (traveler.upcoming || []).find(d => d.status === "confirmed") || (traveler.upcoming || [])[0];
  const langStr = (traveler.languages || []).slice(0, 3).map(l => l.lang).join(" · ");

  return (
    <div className="ex-card">
      <div className="ex-card-banner" style={{ background: gradient }}>
        <div className="ex-card-banner-overlay" />
        <span className="ex-card-countries">{(traveler.visitedCountries || []).length} {t("explore.destinations")}</span>
        <div className="ex-card-avatar">
          {traveler.photoURL
            ? <img src={traveler.photoURL} alt={traveler.displayName} />
            : <span>{traveler.emoji || "👤"}</span>
          }
        </div>
      </div>

      <div className="ex-card-body">
        <div>
          <div className="ex-card-name">
            {traveler.displayName || "Traveler"}
            {traveler.isVerified && <span className="ex-card-verified">✓</span>}
          </div>
          {traveler.location && (
            <div className="ex-card-location">
              <span>📍</span>{traveler.location}
            </div>
          )}
        </div>

        {nextTrip && (
          <div className="ex-card-dest">
            <span>✈️</span>
            <span style={{ flex: 1 }}>{nextTrip.name}</span>
            <span className={`ex-card-dest-status ${nextTrip.status}`}>
              {nextTrip.status}
            </span>
          </div>
        )}

        {shownInterests.length > 0 && (
          <div className="ex-card-interests">
            {shownInterests.map(i => <span key={i} className="ex-interest-tag">{i}</span>)}
            {extraInterests > 0 && <span className="ex-interest-more">+{extraInterests}</span>}
          </div>
        )}

        {langStr && (
          <div className="ex-card-langs">🗣️ {langStr}</div>
        )}

        <div className="ex-card-footer">
          <button
            className={`ex-connect-btn${connected ? " connected" : ""}`}
            onClick={!connected ? onConnect : undefined}
          >
            {connected ? "✓" : t("explore.connect")}
          </button>
          <button className="ex-view-btn">{t("common.viewProfile")}</button>
        </div>
      </div>
    </div>
  );
}

export default function Explore({ user, onBack, onProfile, onExplore, onMatches, onChat, onMap, onSignOut, onNotif, notifCount, onSettings, onPricing }) {
  const { t } = useTranslation();
  const [travelers, setTravelers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [connected, setConnected] = useState({});
  const [search, setSearch]       = useState("");
  const [styleFilters, setStyleFilters] = useState([]);
  const [langFilter, setLangFilter]     = useState("");
  const [sort, setSort]           = useState("countries");
  const [menuOpen, setMenuOpen]   = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        const real = snap.docs
          .map(d => ({ uid: d.id, ...d.data() }))
          .filter(u => u.uid !== user?.uid && u.displayName);
        const combined = real.length >= 4
          ? real
          : [...real, ...MOCK.filter(m => !real.find(r => r.displayName === m.displayName))];
        setTravelers(combined);
      } catch {
        setTravelers(MOCK);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleConnect = async (traveler) => {
    const fromUid = user?.uid;
    const toUid   = traveler.uid;
    if (!fromUid || !toUid) return;

    // Optimistic UI update
    setConnected(prev => ({ ...prev, [toUid]: true }));

    try {
      // 1. Write our like
      await setDoc(doc(db, "likes", `${fromUid}_${toUid}`), {
        fromUid,
        toUid,
        createdAt: serverTimestamp(),
      }, { merge: true });

      // 2. Check for mutual like
      const inverseSnap = await getDoc(doc(db, "likes", `${toUid}_${fromUid}`));
      if (inverseSnap.exists()) {
        // 3. Create match — ID uses alphabetically sorted UIDs for idempotency
        const [uidA, uidB] = [fromUid, toUid].sort();
        const matchId = `${uidA}_${uidB}`;

        await setDoc(doc(db, "matches", matchId), {
          users: [uidA, uidB],
          createdAt: serverTimestamp(),
        }, { merge: true });

        // 4. Create conversation linked to this match
        await setDoc(doc(db, "conversations", matchId), {
          participants: [uidA, uidB],
          participantProfiles: {
            [fromUid]: {
              uid: fromUid,
              displayName: user.displayName || "Traveler",
              photoURL: user.photoURL || null,
            },
            [toUid]: {
              uid: toUid,
              displayName: traveler.displayName || "Traveler",
              photoURL: traveler.photoURL || null,
              emoji: traveler.emoji || null,
              location: traveler.location || null,
            },
          },
          lastMessage: "",
          lastMessageAt: serverTimestamp(),
          lastMessageBy: null,
          matchId,
        }, { merge: true });
      }
    } catch (err) {
      // Revert optimistic update on error
      setConnected(prev => ({ ...prev, [toUid]: false }));
      console.error("Like error:", err);
    }
  };

  const toggleStyle = s => setStyleFilters(prev =>
    prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
  );

  const filtered = travelers
    .filter(tr => {
      if (search) {
        const q = search.toLowerCase();
        const matchName = (tr.displayName || "").toLowerCase().includes(q);
        const matchLoc  = (tr.location || "").toLowerCase().includes(q);
        const matchDest = (tr.upcoming || []).some(d => d.name.toLowerCase().includes(q));
        if (!matchName && !matchLoc && !matchDest) return false;
      }
      if (styleFilters.length > 0) {
        const hasStyle = styleFilters.some(s => (tr.travelStyles || []).includes(s));
        if (!hasStyle) return false;
      }
      if (langFilter) {
        const hasLang = (tr.languages || []).some(l => l.lang === langFilter);
        if (!hasLang) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === "countries") return (b.visitedCountries || []).length - (a.visitedCountries || []).length;
      if (sort === "az")        return (a.displayName || "").localeCompare(b.displayName || "");
      if (sort === "interests") return (b.interests || []).length - (a.interests || []).length;
      return 0;
    });

  const hasFilters = search || styleFilters.length > 0 || langFilter;

  return (
    <>
      <style>{css}</style>

      {/* mobile nav overlay */}
      <div className={`mob-nav${menuOpen ? " open" : ""}`}>
        <div className="mob-nav-top">
          <div className="mob-nav-logo">Globe<span>Mate</span></div>
          <LangButton align="right" />
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

      <div className="ex-root">

        {/* navbar */}
        <nav className="ex-nav">
          <button className="ex-logo" onClick={onBack}>Globe<span>Mate</span></button>
          <div className="ex-nav-actions">
            <LangButton align="right" />
            {user && (
              <button className="bell-btn" onClick={onNotif}>
                🔔{notifCount > 0 && <span className="bell-badge">{notifCount > 9 ? "9+" : notifCount}</span>}
              </button>
            )}
            {user && <button className="bell-btn ex-desktop" onClick={onSettings} title={t("nav.settings")}>⚙</button>}
            {user && <button className="ex-nav-btn ghost ex-desktop" onClick={onProfile}>{t("nav.myProfile")}</button>}
            <button className="ex-nav-btn ex-desktop" onClick={onPricing}>{t("nav.plans")}</button>
            {user && <button className="ex-nav-btn ghost ex-desktop" onClick={onSignOut}>{t("nav.signOut")}</button>}
            <button className="ex-hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <span /><span /><span />
            </button>
          </div>
        </nav>

        {/* hero */}
        <div className="ex-hero">
          <div className="ex-eyebrow">{t("explore.discover")}</div>
          <h1 className="ex-h1">{t("explore.title").split(" ")[0]} <em>{t("explore.title").split(" ").slice(1).join(" ")}</em></h1>
          <p className="ex-sub">{t("explore.subtitle")}</p>
        </div>

        {/* controls */}
        <div className="ex-controls">
          <div className="ex-search-wrap">
            <span className="ex-search-icon">🔍</span>
            <input
              className="ex-search"
              placeholder={t("explore.searchPlaceholder")}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="ex-filter-row">
            <span className="ex-filter-label">{t("explore.filters")}</span>
            {ALL_STYLES.map(s => (
              <button
                key={s}
                className={`ex-filter-chip${styleFilters.includes(s) ? " on" : ""}`}
                onClick={() => toggleStyle(s)}
              >{s}</button>
            ))}
          </div>

          <div className="ex-filter-row">
            <span className="ex-filter-label">Language</span>
            {ALL_LANGS.map(l => (
              <button
                key={l}
                className={`ex-filter-chip${langFilter === l ? " on" : ""}`}
                onClick={() => setLangFilter(prev => prev === l ? "" : l)}
              >{l}</button>
            ))}
            <select className="ex-sort-sel" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="countries">Most countries</option>
              <option value="interests">Most interests</option>
              <option value="az">A – Z</option>
            </select>
          </div>
        </div>

        {/* results bar */}
        <div className="ex-results-bar">
          {!loading && (
            <span className="ex-count">
              {filtered.length} {t("explore.title").toLowerCase()}
            </span>
          )}
          {hasFilters && (
            <button className="ex-clear" onClick={() => { setSearch(""); setStyleFilters([]); setLangFilter(""); }}>
              ✕
            </button>
          )}
        </div>

        {/* content */}
        {loading ? (
          <div className="ex-loading">{t("explore.loading")}</div>
        ) : filtered.length === 0 ? (
          <div className="ex-empty">
            <div className="ex-empty-icon">🌍</div>
            <div className="ex-empty-text">{t("explore.noResults")}</div>
          </div>
        ) : (
          <div className="ex-grid">
            {filtered.map(tr => (
              <TravelerCard
                key={tr.uid}
                traveler={tr}
                connected={!!connected[tr.uid]}
                onConnect={() => handleConnect(tr)}
              />
            ))}
          </div>
        )}

      </div>
    </>
  );
}
