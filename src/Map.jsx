import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

/* ── known destinations with coordinates ── */
const KNOWN_DESTS = [
  { id:"kyoto",      label:"Kyoto",        country:"Japan",       lat:35.0116,  lng:135.7681,  searchKeys:["kyoto","japan"] },
  { id:"tokyo",      label:"Tokyo",        country:"Japan",       lat:35.6762,  lng:139.6503,  searchKeys:["tokyo"] },
  { id:"lisbon",     label:"Lisbon",       country:"Portugal",    lat:38.7223,  lng:-9.1393,   searchKeys:["lisbon","lisboa"] },
  { id:"porto",      label:"Porto",        country:"Portugal",    lat:41.1579,  lng:-8.6291,   searchKeys:["porto"] },
  { id:"barcelona",  label:"Barcelona",    country:"Spain",       lat:41.3851,  lng:2.1734,    searchKeys:["barcelona"] },
  { id:"florence",   label:"Florence",     country:"Italy",       lat:43.7696,  lng:11.2558,   searchKeys:["florence","firenze"] },
  { id:"amalfi",     label:"Amalfi",       country:"Italy",       lat:40.6340,  lng:14.6027,   searchKeys:["amalfi"] },
  { id:"marrakech",  label:"Marrakech",    country:"Morocco",     lat:31.6295,  lng:-7.9811,   searchKeys:["marrakech","marrakesh"] },
  { id:"iceland",    label:"Iceland",      country:"Iceland",     lat:64.9631,  lng:-19.0208,  searchKeys:["iceland","reykjavik"] },
  { id:"seoul",      label:"Seoul",        country:"South Korea", lat:37.5665,  lng:126.9780,  searchKeys:["seoul","south korea","korea"] },
  { id:"bali",       label:"Bali",         country:"Indonesia",   lat:-8.3405,  lng:115.0920,  searchKeys:["bali","indonesia"] },
  { id:"saopaulo",   label:"São Paulo",    country:"Brazil",      lat:-23.5505, lng:-46.6333,  searchKeys:["são paulo","sao paulo","brazil"] },
  { id:"patagonia",  label:"Patagonia",    country:"Chile",       lat:-50.9423, lng:-73.4068,  searchKeys:["patagonia","chile"] },
  { id:"oaxaca",     label:"Oaxaca",       country:"Mexico",      lat:17.0732,  lng:-96.7266,  searchKeys:["oaxaca","mexico"] },
  { id:"tallinn",    label:"Tallinn",      country:"Estonia",     lat:59.4370,  lng:24.7536,   searchKeys:["tallinn","estonia"] },
  { id:"faroe",      label:"Faroe Islands",country:"Faroe Islands",lat:61.8926, lng:-6.9118,   searchKeys:["faroe"] },
  { id:"newzealand", label:"New Zealand",  country:"New Zealand", lat:-40.9006, lng:174.8860,  searchKeys:["new zealand"] },
  { id:"santorini",  label:"Santorini",    country:"Greece",      lat:36.3932,  lng:25.4615,   searchKeys:["santorini","greece"] },
  { id:"maldives",   label:"Maldives",     country:"Maldives",    lat:3.2028,   lng:73.2207,   searchKeys:["maldives"] },
  { id:"capetown",   label:"Cape Town",    country:"South Africa",lat:-33.9249, lng:18.4241,   searchKeys:["cape town","south africa"] },
];

/* ── mock travelers (same dataset as Explore/Matches) ── */
const MOCK_TRAVELERS = [
  { uid:"m1",  displayName:"Sofia Chen",     emoji:"🌸", interests:["🏛️ History","🍜 Food","📸 Photography"],  upcoming:[{name:"Kyoto, Japan",status:"confirmed"},{name:"Lisbon",status:"planning"}] },
  { uid:"m2",  displayName:"Marco Rossi",    emoji:"🎸", interests:["🎨 Art","🎪 Festivals","🍷 Wine"],          upcoming:[{name:"Tokyo, Japan",status:"confirmed"},{name:"Lisbon",status:"planning"}] },
  { uid:"m3",  displayName:"Yuki Tanaka",    emoji:"🌊", interests:["🌿 Nature","🏔️ Mountains","🧘 Wellness"],   upcoming:[{name:"Iceland",status:"confirmed"},{name:"New Zealand",status:"planning"}] },
  { uid:"m4",  displayName:"Elena Vasquez",  emoji:"💃", interests:["🎭 Culture","🎵 Music","🍜 Food"],           upcoming:[{name:"Barcelona, Spain",status:"confirmed"}] },
  { uid:"m5",  displayName:"James Mitchell", emoji:"🗺️", interests:["🏛️ History","🌆 Cities","📸 Photography"], upcoming:[{name:"Seoul, South Korea",status:"confirmed"},{name:"Marrakech",status:"planning"}] },
  { uid:"m6",  displayName:"Amara Diallo",   emoji:"✨", interests:["🎨 Art","🎪 Festivals","🌆 Cities"],         upcoming:[{name:"Florence, Italy",status:"confirmed"},{name:"São Paulo",status:"planning"}] },
  { uid:"m7",  displayName:"Lucas Oliveira", emoji:"🏄", interests:["🏖️ Beaches","🏄 Adventure","🎵 Music"],     upcoming:[{name:"Bali, Indonesia",status:"confirmed"}] },
  { uid:"m8",  displayName:"Nina Schmidt",   emoji:"🎨", interests:["🎨 Art","🎵 Music","🚂 Train travel"],       upcoming:[{name:"Porto, Portugal",status:"planning"},{name:"Tallinn, Estonia",status:"planning"}] },
  { uid:"m9",  displayName:"Priya Sharma",   emoji:"🌺", interests:["🍜 Food","🏛️ History","🧘 Wellness"],        upcoming:[{name:"Kyoto, Japan",status:"confirmed"},{name:"Amalfi, Italy",status:"planning"}] },
  { uid:"m10", displayName:"Alex Rivera",    emoji:"📸", interests:["📸 Photography","🌆 Cities","🍜 Food"],       upcoming:[{name:"Seoul, South Korea",status:"confirmed"},{name:"Tokyo",status:"planning"}] },
  { uid:"m11", displayName:"Isabella Torres",emoji:"🌮", interests:["🍜 Food","🏛️ History","🎪 Festivals"],       upcoming:[{name:"Oaxaca, Mexico",status:"confirmed"},{name:"Barcelona",status:"planning"}] },
  { uid:"m12", displayName:"Kai Nakamura",   emoji:"🎋", interests:["🌿 Nature","🧘 Wellness","🏔️ Mountains"],    upcoming:[{name:"Patagonia, Chile",status:"planning"},{name:"Faroe Islands",status:"planning"}] },
];

/* ── build destination clusters from traveler data ── */
function buildClusters(travelers) {
  const map = {};
  travelers.forEach(t => {
    (t.upcoming || []).forEach(dest => {
      const destLow = dest.name.toLowerCase();
      const known = KNOWN_DESTS.find(d => d.searchKeys.some(k => destLow.includes(k) || k.includes(destLow.split(",")[0].trim())));
      if (!known) return;
      if (!map[known.id]) map[known.id] = { ...known, travelers: [] };
      const already = map[known.id].travelers.find(x => x.uid === t.uid);
      if (!already) {
        map[known.id].travelers.push({
          uid: t.uid, displayName: t.displayName, emoji: t.emoji || "👤",
          photoURL: t.photoURL || null, status: dest.status, interests: t.interests || [],
        });
      }
    });
  });
  return Object.values(map).filter(c => c.travelers.length > 0);
}

/* ── custom gold marker icon ── */
function makeIcon(count) {
  const size  = count > 3 ? 40 : count > 1 ? 34 : 28;
  const inner = count > 1 ? `<span>${count}</span>` : `<span>✈</span>`;
  return L.divIcon({
    className: "",
    html: `<div class="gm-pin" style="width:${size}px;height:${size}px;font-size:${count>1?'12px':'13px'}">${inner}</div>`,
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor:[0, -(size / 2 + 6)],
  });
}

/* ── recenter helper (inside MapContainer) ── */
function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 8, { duration: 1.4 });
  }, [target, map]);
  return null;
}

/* ── component ── */
export default function Map({ user, onBack, onProfile, onExplore, onMatches, onChat, onMap, onSignOut, onNotif, notifCount, onSettings, onPricing }) {
  const [clusters, setClusters]     = useState([]);
  const [search, setSearch]         = useState("");
  const [flyTarget, setFlyTarget]   = useState(null);
  const [connected, setConnected]   = useState({});
  const [filterNew, setFilterNew]   = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [menuOpen, setMenuOpen]     = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        const real = snap.docs.map(d => ({ uid: d.id, ...d.data() })).filter(u => u.uid !== user?.uid);
        const travelers = real.length >= 3 ? real : [...real, ...MOCK_TRAVELERS];
        setClusters(buildClusters(travelers));
      } catch {
        setClusters(buildClusters(MOCK_TRAVELERS));
      }
    };
    load();
  }, [user]);

  const handleSearchChange = (val) => {
    setSearch(val);
    if (!val.trim()) { setSuggestions([]); return; }
    const q = val.toLowerCase();
    setSuggestions(KNOWN_DESTS.filter(d =>
      d.label.toLowerCase().includes(q) || d.country.toLowerCase().includes(q)
    ).slice(0, 5));
  };

  const flyToDestination = (dest) => {
    setFlyTarget([dest.lat, dest.lng]);
    setSearch(dest.label);
    setSuggestions([]);
  };

  const visible = filterNew
    ? clusters.filter(c => c.travelers.some(t => t.status === "confirmed"))
    : clusters;

  return (
    <>
      {/* inject global Leaflet overrides + marker animation */}
      <style>{`
        /* hamburger + mobile nav overlay */
        .mp-hamburger { display:none; flex-direction:column; gap:5px; background:none; border:none; cursor:pointer; padding:6px; flex-shrink:0; }
        @media(max-width:860px){ .mp-hamburger { display:flex; } }
        .mp-hamburger span { display:block; width:22px; height:1.5px; background:#c9a84c; transition:transform 0.3s; }
        .mob-nav { position:fixed; inset:0; z-index:600; background:rgba(10,9,5,0.98); backdrop-filter:blur(12px); display:flex; flex-direction:column; padding:28px 32px 40px; opacity:0; visibility:hidden; transition:opacity 0.3s,visibility 0.3s; overflow-y:auto; font-family:'DM Sans',sans-serif; }
        .mob-nav.open { opacity:1; visibility:visible; }
        .mob-nav-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:36px; }
        .mob-nav-logo { font-family:'Cormorant Garamond',Georgia,serif; font-size:1.4rem; font-weight:300; letter-spacing:0.12em; color:#e8c97a; }
        .mob-nav-logo span { font-style:italic; }
        .mob-nav-close { background:none; border:none; color:rgba(245,240,232,0.55); font-size:1.5rem; cursor:pointer; padding:4px 8px; line-height:1; }
        .mob-nav-link { background:none; border:none; color:rgba(245,240,232,0.55); font-family:'DM Sans',sans-serif; font-size:1rem; letter-spacing:0.12em; text-transform:uppercase; text-align:left; padding:18px 0; cursor:pointer; border-bottom:1px solid rgba(201,168,76,0.08); transition:color 0.2s; display:block; width:100%; }
        .mob-nav-link:hover { color:#f5f0e8; }
        .mob-nav-link.gold { color:#c9a84c; }
        .mob-nav-divider { height:1px; background:rgba(201,168,76,0.12); margin:8px 0; }
      `}</style>
      <style>{`
        /* ── Leaflet popup ── */
        .leaflet-popup-content-wrapper {
          background: #141209 !important;
          border: 1px solid rgba(201,168,76,0.32) !important;
          border-radius: 0 !important;
          box-shadow: 0 12px 40px rgba(0,0,0,0.75) !important;
          padding: 0 !important;
          min-width: 260px;
        }
        .leaflet-popup-tip { background: #141209 !important; }
        .leaflet-popup-tip-container { margin-top: -1px; }
        .leaflet-popup-content { margin: 0 !important; line-height: 1 !important; }
        .leaflet-popup-close-button {
          color: rgba(201,168,76,0.5) !important;
          font-size: 20px !important;
          top: 10px !important; right: 10px !important;
          width: 20px !important; height: 20px !important;
          line-height: 18px !important;
        }
        .leaflet-popup-close-button:hover { color: #c9a84c !important; background: none !important; }
        /* ── zoom controls ── */
        .leaflet-control-zoom { border: 1px solid rgba(201,168,76,0.2) !important; border-radius: 0 !important; }
        .leaflet-control-zoom a {
          background: rgba(14,13,9,0.95) !important;
          color: #c9a84c !important;
          border-bottom: 1px solid rgba(201,168,76,0.15) !important;
          line-height: 28px !important; width: 28px !important; height: 28px !important;
          font-size: 16px !important;
        }
        .leaflet-control-zoom a:hover { background: rgba(201,168,76,0.12) !important; }
        /* ── attribution ── */
        .leaflet-control-attribution {
          background: rgba(10,9,5,0.8) !important;
          color: rgba(245,240,232,0.25) !important;
          font-size: 9px !important;
        }
        .leaflet-control-attribution a { color: rgba(201,168,76,0.4) !important; }
        /* ── marker pin ── */
        @keyframes gm-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(201,168,76,0.55), 0 3px 10px rgba(0,0,0,0.6); }
          65%  { box-shadow: 0 0 0 11px rgba(201,168,76,0), 0 3px 10px rgba(0,0,0,0.6); }
          100% { box-shadow: 0 0 0 0 rgba(201,168,76,0), 0 3px 10px rgba(0,0,0,0.6); }
        }
        .gm-pin {
          background: rgba(201,168,76,0.92);
          border: 2px solid #e8c97a;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: #0a0905;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          animation: gm-pulse 2.8s ease-out infinite;
          cursor: pointer;
          transition: transform 0.18s;
        }
        .gm-pin:hover { transform: scale(1.18); }
        /* ── container ── */
        .leaflet-container { background: #0d0c09 !important; }
      `}</style>

      {/* mobile nav overlay */}
      <div className={`mob-nav${menuOpen ? " open" : ""}`}>
        <div className="mob-nav-top">
          <div className="mob-nav-logo">Globe<span>Mate</span></div>
          <button className="mob-nav-close" onClick={() => setMenuOpen(false)}>✕</button>
        </div>
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onBack(); }}>← Home</button>
        <div className="mob-nav-divider" />
        <button className="mob-nav-link gold" onClick={() => { setMenuOpen(false); onExplore(); }}>Explore</button>
        <button className="mob-nav-link gold" onClick={() => { setMenuOpen(false); onMatches(); }}>Matches</button>
        <button className="mob-nav-link gold" onClick={() => { setMenuOpen(false); onChat(); }}>Messages</button>
        <button className="mob-nav-link gold" onClick={() => { setMenuOpen(false); onMap(); }}>Map</button>
        <div className="mob-nav-divider" />
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onProfile(); }}>My Profile</button>
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onNotif(); }}>
          Notifications{notifCount > 0 ? ` (${notifCount})` : ""}
        </button>
        <div className="mob-nav-divider" />
        <button className="mob-nav-link gold" onClick={() => { setMenuOpen(false); onPricing?.(); }}>✦ Planes</button>
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onSettings?.(); }}>⚙ Configuración</button>
        <div className="mob-nav-divider" />
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onSignOut(); }}>Sign out</button>
      </div>

      <div style={{ position:"fixed", inset:0, display:"flex", flexDirection:"column", background:"#0a0905", fontFamily:"'DM Sans',sans-serif" }}>

        {/* ── navbar ── */}
        <nav style={{
          height:56, flexShrink:0, display:"flex", alignItems:"center",
          justifyContent:"space-between", padding:"0 28px",
          background:"rgba(10,9,5,0.98)", borderBottom:"1px solid rgba(201,168,76,0.12)",
          zIndex:500, gap:8,
        }}>
          <button onClick={onBack} style={btnStyle("logo")}>Globe<em style={{fontStyle:"italic"}}>Mate</em></button>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <button style={btnStyle("ghost")} onClick={onExplore}  className="mp-hide-xs">Explore</button>
            <button style={btnStyle("ghost")} onClick={onMatches}  className="mp-hide-xs">Matches</button>
            <button style={btnStyle("ghost")} onClick={onChat}     className="mp-hide-xs">Messages</button>
            {onNotif && (
              <button onClick={onNotif} style={{ position:"relative", background:"none", border:"1px solid rgba(201,168,76,0.25)", color:"#c9a84c", padding:"6px 10px", cursor:"pointer", fontSize:"1rem", display:"inline-flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                🔔{notifCount > 0 && <span style={{ position:"absolute", top:-6, right:-6, background:"#d32f2f", color:"#fff", borderRadius:"50%", minWidth:17, height:17, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.58rem", fontWeight:700, border:"1.5px solid #0a0905", padding:"0 2px" }}>{notifCount > 9 ? "9+" : notifCount}</span>}
              </button>
            )}
            <button style={btnStyle("ghost")} onClick={onProfile}  className="mp-hide-xs">My Profile</button>
            <button style={{...btnStyle("ghost"), borderColor:"#c9a84c", color:"#c9a84c"}} onClick={onPricing} className="mp-hide-xs">✦ Planes</button>
            <button style={btnStyle("ghost")} onClick={onSignOut}  className="mp-hide-xs">Sign out</button>
            <button className="mp-hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <span /><span /><span />
            </button>
          </div>
        </nav>

        {/* ── map area ── */}
        <div style={{ flex:1, position:"relative", overflow:"hidden" }}>

          {/* floating search */}
          <div style={{
            position:"absolute", top:16, left:16, zIndex:400,
            display:"flex", flexDirection:"column", gap:0,
            width: "min(320px, calc(100vw - 32px))",
          }}>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:"rgba(245,240,232,0.3)", fontSize:"0.9rem", pointerEvents:"none" }}>🔍</span>
              <input
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Search destination…"
                style={{
                  width:"100%", background:"rgba(10,9,5,0.92)", border:"1px solid rgba(201,168,76,0.25)",
                  color:"#f5f0e8", padding:"11px 14px 11px 38px", fontFamily:"'DM Sans',sans-serif",
                  fontSize:"0.84rem", fontWeight:300, outline:"none",
                  boxShadow:"0 4px 20px rgba(0,0,0,0.5)",
                }}
              />
            </div>
            {suggestions.length > 0 && (
              <div style={{ background:"rgba(14,13,9,0.97)", border:"1px solid rgba(201,168,76,0.2)", borderTop:"none", boxShadow:"0 8px 24px rgba(0,0,0,0.5)" }}>
                {suggestions.map(s => (
                  <button key={s.id} onClick={() => flyToDestination(s)} style={{
                    width:"100%", background:"none", border:"none", borderBottom:"1px solid rgba(201,168,76,0.08)",
                    color:"rgba(245,240,232,0.7)", padding:"10px 14px", textAlign:"left",
                    fontFamily:"'DM Sans',sans-serif", fontSize:"0.82rem", cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    transition:"background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(201,168,76,0.08)"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                  >
                    <span>{s.label}</span>
                    <span style={{ fontSize:"0.7rem", color:"rgba(245,240,232,0.35)", letterSpacing:"0.1em" }}>{s.country}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* floating stats + filter */}
          <div style={{
            position:"absolute", top:16, right:16, zIndex:400,
            background:"rgba(10,9,5,0.92)", border:"1px solid rgba(201,168,76,0.2)",
            padding:"12px 16px", display:"flex", flexDirection:"column", gap:8,
            boxShadow:"0 4px 20px rgba(0,0,0,0.5)",
          }}>
            <div style={{ display:"flex", gap:20 }}>
              <div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.4rem", fontWeight:300, color:"#e8c97a", lineHeight:1 }}>{clusters.length}</div>
                <div style={{ fontSize:"0.6rem", letterSpacing:"0.16em", textTransform:"uppercase", color:"rgba(245,240,232,0.35)", marginTop:3 }}>Destinations</div>
              </div>
              <div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.4rem", fontWeight:300, color:"#e8c97a", lineHeight:1 }}>
                  {clusters.reduce((n, c) => n + c.travelers.length, 0)}
                </div>
                <div style={{ fontSize:"0.6rem", letterSpacing:"0.16em", textTransform:"uppercase", color:"rgba(245,240,232,0.35)", marginTop:3 }}>Travelers</div>
              </div>
            </div>
            <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", userSelect:"none" }}>
              <div onClick={() => setFilterNew(v => !v)} style={{
                width:32, height:18, borderRadius:9,
                background: filterNew ? "rgba(201,168,76,0.35)" : "rgba(245,240,232,0.08)",
                border: filterNew ? "1px solid #c9a84c" : "1px solid rgba(201,168,76,0.2)",
                position:"relative", transition:"all 0.22s", flexShrink:0,
              }}>
                <div style={{
                  position:"absolute", top:2, left: filterNew ? 14 : 2, width:12, height:12,
                  borderRadius:"50%", background: filterNew ? "#c9a84c" : "rgba(245,240,232,0.35)",
                  transition:"all 0.22s",
                }}/>
              </div>
              <span style={{ fontSize:"0.7rem", color:"rgba(245,240,232,0.45)", letterSpacing:"0.1em", textTransform:"uppercase" }}>Confirmed only</span>
            </label>
          </div>

          {/* legend */}
          <div style={{
            position:"absolute", bottom:24, left:16, zIndex:400,
            background:"rgba(10,9,5,0.88)", border:"1px solid rgba(201,168,76,0.15)",
            padding:"10px 14px", display:"flex", flexDirection:"column", gap:7,
            boxShadow:"0 4px 16px rgba(0,0,0,0.4)",
          }}>
            {[["✈","1 traveler"],["3+","Multiple travelers"]].map(([icon, label]) => (
              <div key={label} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{
                  width:22, height:22, borderRadius:"50%",
                  background:"rgba(201,168,76,0.9)", border:"2px solid #e8c97a",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:"8px", fontWeight:700, color:"#0a0905", flexShrink:0,
                }}>{icon}</div>
                <span style={{ fontSize:"0.68rem", color:"rgba(245,240,232,0.4)", letterSpacing:"0.1em" }}>{label}</span>
              </div>
            ))}
          </div>

          {/* the map */}
          <MapContainer
            center={[25, 15]}
            zoom={2}
            minZoom={2}
            maxZoom={12}
            zoomControl={false}
            style={{ height:"100%", width:"100%" }}
            worldCopyJump={true}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              subdomains="abcd"
              maxZoom={19}
            />
            <ZoomControl position="bottomright" />
            <FlyTo target={flyTarget} />

            {visible.map(cluster => (
              <Marker
                key={cluster.id}
                position={[cluster.lat, cluster.lng]}
                icon={makeIcon(cluster.travelers.length)}
              >
                <Popup minWidth={260} maxWidth={320}>
                  <PopupContent
                    cluster={cluster}
                    connected={connected}
                    onConnect={uid => setConnected(prev => ({ ...prev, [uid]: true }))}
                    onChat={onChat}
                  />
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* responsive helper */}
      <style>{`@media(max-width:580px){ .mp-hide-xs{ display:none !important; } }`}</style>
    </>
  );
}

/* ── popup content rendered inside Leaflet popup ── */
function PopupContent({ cluster, connected, onConnect, onChat }) {
  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:300, color:"#f5f0e8" }}>
      {/* header */}
      <div style={{
        padding:"14px 16px 10px",
        borderBottom:"1px solid rgba(201,168,76,0.12)",
        background:"rgba(201,168,76,0.05)",
      }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.05rem", fontWeight:300, color:"#f5f0e8", marginBottom:2 }}>
          {cluster.label}
        </div>
        <div style={{ fontSize:"0.68rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"rgba(201,168,76,0.7)" }}>
          {cluster.country} · {cluster.travelers.length} {cluster.travelers.length === 1 ? "traveler" : "travelers"}
        </div>
      </div>

      {/* traveler list */}
      <div style={{ maxHeight:240, overflowY:"auto" }}>
        {cluster.travelers.map((t, i) => (
          <div key={t.uid} style={{
            display:"flex", alignItems:"center", gap:10, padding:"10px 16px",
            borderBottom: i < cluster.travelers.length - 1 ? "1px solid rgba(201,168,76,0.07)" : "none",
          }}>
            {/* avatar */}
            <div style={{
              width:38, height:38, borderRadius:"50%", border:"1.5px solid rgba(201,168,76,0.35)",
              background:"rgba(10,9,5,0.8)", display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:"1.15rem", flexShrink:0, overflow:"hidden",
            }}>
              {t.photoURL ? <img src={t.photoURL} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : t.emoji}
            </div>

            {/* info */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:"0.85rem", color:"#f5f0e8", marginBottom:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                {t.displayName}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                <span style={{
                  fontSize:"0.61rem", letterSpacing:"0.1em", textTransform:"uppercase",
                  color: t.status === "confirmed" ? "#6fcf97" : "#c9a84c",
                  border: `1px solid ${t.status === "confirmed" ? "rgba(111,207,151,0.35)" : "rgba(201,168,76,0.35)"}`,
                  padding:"1px 6px",
                }}>
                  {t.status === "confirmed" ? "✓ Confirmed" : "Planning"}
                </span>
              </div>
            </div>

            {/* connect / chat */}
            <button
              onClick={() => connected[t.uid] ? onChat() : onConnect(t.uid)}
              style={{
                background: connected[t.uid] ? "rgba(111,207,151,0.12)" : "rgba(201,168,76,0.15)",
                border: `1px solid ${connected[t.uid] ? "rgba(111,207,151,0.4)" : "rgba(201,168,76,0.4)"}`,
                color: connected[t.uid] ? "#6fcf97" : "#c9a84c",
                padding:"5px 10px", fontFamily:"'DM Sans',sans-serif",
                fontSize:"0.64rem", letterSpacing:"0.1em", textTransform:"uppercase",
                cursor:"pointer", whiteSpace:"nowrap", flexShrink:0,
                transition:"all 0.2s",
              }}
            >
              {connected[t.uid] ? "Message →" : "Connect"}
            </button>
          </div>
        ))}
      </div>

      {/* interests preview */}
      {cluster.travelers[0]?.interests?.length > 0 && (
        <div style={{ padding:"8px 16px 12px", borderTop:"1px solid rgba(201,168,76,0.08)" }}>
          <div style={{ fontSize:"0.64rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"rgba(245,240,232,0.3)", marginBottom:6 }}>
            Common interests in this destination
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
            {[...new Set(cluster.travelers.flatMap(t => t.interests))].slice(0, 5).map(i => (
              <span key={i} style={{
                fontSize:"0.7rem", padding:"2px 8px",
                background:"rgba(201,168,76,0.08)", border:"1px solid rgba(201,168,76,0.2)",
                color:"rgba(245,240,232,0.6)",
              }}>{i}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── inline style helpers ── */
function btnStyle(variant) {
  const base = {
    border:"none", background:"none", fontFamily:"'DM Sans',sans-serif",
    fontSize:"0.7rem", letterSpacing:"0.13em", textTransform:"uppercase",
    cursor:"pointer", padding:"7px 16px", transition:"all 0.22s", whiteSpace:"nowrap",
  };
  if (variant === "logo") return {
    ...base, fontFamily:"'Cormorant Garamond',serif", fontSize:"1.3rem",
    fontWeight:300, letterSpacing:"0.12em", color:"#e8c97a", padding:0,
    textTransform:"none",
  };
  if (variant === "ghost") return {
    ...base, border:"1px solid rgba(245,240,232,0.18)", color:"rgba(245,240,232,0.55)",
  };
  return base;
}
