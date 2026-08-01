import { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { db } from "./firebase";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import PublicProfile from "./PublicProfile";
import { resolveCoords } from "./geoData";

/* ── isVisibleTo — geographic visibility filter ── */
function isVisibleTo(traveler, viewerCountry) {
  const mode = traveler.visibilityMode || "all";
  if (mode === "all") return true;
  const countries = traveler.visibilityCountries || [];
  if (!countries.length) return true;
  if (!viewerCountry) return true;
  const hit = countries.includes(viewerCountry);
  return mode === "except" ? !hit : hit;
}

/* ── build clusters of users by current location ── */
function buildLocationClusters(travelers) {
  const map = {};
  travelers
    .filter(t => t.settings?.privacy?.showLocation !== false)
    .filter(t => t.locationCountry || t.location)
    .forEach(t => {
      const coords = resolveCoords(t.location, t.locationCountry);
      if (!coords) return;
      const key = `${coords[0].toFixed(2)}_${coords[1].toFixed(2)}`;
      if (!map[key]) {
        map[key] = {
          id: `home_${key}`,
          lat: coords[0], lng: coords[1],
          label: t.location || t.locationCountry || "",
          country: t.locationCountry || "",
          type: "home",
          travelers: [],
        };
      }
      map[key].travelers.push({
        uid: t.uid,
        displayName: t.displayName || "",
        photoURL: t.photoURL || null,
        emoji: t.emoji || "👤",
      });
    });
  return Object.values(map).filter(c => c.travelers.length > 0);
}

/* ── build clusters of users by upcoming destination ── */
function buildDestClusters(travelers) {
  const map = {};
  travelers.forEach(t => {
    (t.upcoming || []).forEach(dest => {
      if (!dest.name) return;
      const coords = resolveCoords(dest.name, null);
      if (!coords) {
        console.warn(`[GlobeMate Map] No geocode for destination "${dest.name}" (uid: ${t.uid})`);
        return;
      }
      const key = `${coords[0].toFixed(2)}_${coords[1].toFixed(2)}`;
      const clusterId = `dest_${key}`;
      if (!map[clusterId]) {
        map[clusterId] = {
          id: clusterId,
          lat: coords[0], lng: coords[1],
          label: dest.name,
          country: "",
          type: "dest",
          travelers: [],
        };
      }
      if (!map[clusterId].travelers.find(x => x.uid === t.uid)) {
        map[clusterId].travelers.push({
          uid: t.uid,
          displayName: t.displayName || "",
          photoURL: t.photoURL || null,
          emoji: t.emoji || "👤",
          status: dest.status,
        });
      }
    });
  });
  return Object.values(map).filter(c => c.travelers.length > 0);
}

/* ── marker icons ── */
function makeHomeIcon(count) {
  const size = count > 3 ? 40 : count > 1 ? 34 : 28;
  const inner = count > 1 ? `<span>${count}</span>` : `<span>●</span>`;
  return L.divIcon({
    className: "",
    html: `<div class="gm-pin gm-pin-home" style="width:${size}px;height:${size}px;font-size:${count>1?"12px":"11px"}">${inner}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 6)],
  });
}

function makeDestIcon(count) {
  const size = count > 3 ? 40 : count > 1 ? 34 : 28;
  const inner = count > 1 ? `<span>${count}</span>` : `<span>✈</span>`;
  return L.divIcon({
    className: "",
    html: `<div class="gm-pin gm-pin-dest" style="width:${size}px;height:${size}px;font-size:${count>1?"12px":"13px"}">${inner}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 6)],
  });
}

/* ── known destinations for search autocomplete ── */
const SEARCH_DESTS = [
  { id:"kyoto",     label:"Kyoto",       country:"Japan",       lat:35.0116, lng:135.7681 },
  { id:"tokyo",     label:"Tokyo",       country:"Japan",       lat:35.6762, lng:139.6503 },
  { id:"lisbon",    label:"Lisbon",      country:"Portugal",    lat:38.7223, lng:-9.1393  },
  { id:"barcelona", label:"Barcelona",   country:"Spain",       lat:41.3851, lng:2.1734   },
  { id:"florence",  label:"Florence",    country:"Italy",       lat:43.7696, lng:11.2558  },
  { id:"paris",     label:"Paris",       country:"France",      lat:48.8566, lng:2.3522   },
  { id:"london",    label:"London",      country:"UK",          lat:51.5074, lng:-0.1278  },
  { id:"berlin",    label:"Berlin",      country:"Germany",     lat:52.5200, lng:13.4050  },
  { id:"rome",      label:"Rome",        country:"Italy",       lat:41.9028, lng:12.4964  },
  { id:"bali",      label:"Bali",        country:"Indonesia",   lat:-8.3405, lng:115.0920 },
  { id:"seoul",     label:"Seoul",       country:"South Korea", lat:37.5665, lng:126.9780 },
  { id:"bangkok",   label:"Bangkok",     country:"Thailand",    lat:13.7563, lng:100.5018 },
  { id:"dubai",     label:"Dubai",       country:"UAE",         lat:25.2048, lng:55.2708  },
  { id:"sydney",    label:"Sydney",      country:"Australia",   lat:-33.8688,lng:151.2093 },
  { id:"ny",        label:"New York",    country:"USA",         lat:40.7128, lng:-74.0060 },
  { id:"marrakech", label:"Marrakech",   country:"Morocco",     lat:31.6295, lng:-7.9811  },
  { id:"istanbul",  label:"Istanbul",    country:"Turkey",      lat:41.0082, lng:28.9784  },
  { id:"santorini", label:"Santorini",   country:"Greece",      lat:36.3932, lng:25.4615  },
  { id:"buenos",    label:"Buenos Aires",country:"Argentina",   lat:-34.6037,lng:-58.3816 },
  { id:"mex",       label:"Mexico City", country:"Mexico",      lat:19.4326, lng:-99.1332 },
];

/* ── recenter helper ── */
function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 8, { duration: 1.4 });
  }, [target, map]);
  return null;
}

/* ── main component ── */
export default function Map({ user, onBack, onChat }) {
  const { t } = useTranslation();
  const [allTravelers,     setAllTravelers]     = useState([]);
  const [myLocationCountry,setMyLocationCountry] = useState("");
  const [search,           setSearch]           = useState("");
  const [flyTarget,        setFlyTarget]        = useState(null);
  const [filterConfirmed,  setFilterConfirmed]  = useState(false);
  const [suggestions,      setSuggestions]      = useState([]);
  const [selectedUid,      setSelectedUid]      = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [mySnap, usersSnap, q1Snap, q2Snap] = await Promise.all([
          user?.uid ? getDoc(doc(db, "users", user.uid)) : Promise.resolve(null),
          getDocs(collection(db, "users")),
          user?.uid ? getDocs(query(collection(db, "blocks"), where("blockerId", "==", user.uid))) : Promise.resolve({ docs: [] }),
          user?.uid ? getDocs(query(collection(db, "blocks"), where("blockedId", "==", user.uid)))  : Promise.resolve({ docs: [] }),
        ]);
        if (mySnap?.exists()) setMyLocationCountry(mySnap.data().locationCountry || "");
        const blocked = new Set([
          ...q1Snap.docs.map(d => d.data().blockedId),
          ...q2Snap.docs.map(d => d.data().blockerId),
        ]);
        setAllTravelers(
          usersSnap.docs
            .map(d => ({ uid: d.id, ...d.data() }))
            .filter(u =>
              u.uid !== user?.uid &&
              !blocked.has(u.uid) &&
              !u.suspended &&
              u.settings?.privacy?.profileVisibility !== "hidden" &&
              !u.settings?.privacy?.incognitoMode
            )
        );
      } catch (err) {
        console.error("Map load error:", err);
      }
    };
    load();
  }, [user]);

  const visibleTravelers = useMemo(
    () => allTravelers.filter(u => isVisibleTo(u, myLocationCountry)),
    [allTravelers, myLocationCountry]
  );

  const locationClusters = useMemo(() => buildLocationClusters(visibleTravelers), [visibleTravelers]);

  const destClusters = useMemo(() => {
    const all = buildDestClusters(visibleTravelers);
    return filterConfirmed ? all.filter(c => c.travelers.some(t => t.status === "confirmed")) : all;
  }, [visibleTravelers, filterConfirmed]);

  const handleSearchChange = (val) => {
    setSearch(val);
    if (!val.trim()) { setSuggestions([]); return; }
    const q = val.toLowerCase();
    setSuggestions(SEARCH_DESTS.filter(d =>
      d.label.toLowerCase().includes(q) || d.country.toLowerCase().includes(q)
    ).slice(0, 5));
  };

  const flyToDestination = (dest) => {
    setFlyTarget([dest.lat, dest.lng]);
    setSearch(dest.label);
    setSuggestions([]);
  };

  const totalTravelers = useMemo(() => {
    const uids = new Set([
      ...locationClusters.flatMap(c => c.travelers.map(t => t.uid)),
      ...destClusters.flatMap(c => c.travelers.map(t => t.uid)),
    ]);
    return uids.size;
  }, [locationClusters, destClusters]);

  return (
    <>
      <style>{`
        @keyframes gm-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(201,168,76,0.55), 0 3px 10px rgba(0,0,0,0.6); }
          65%  { box-shadow: 0 0 0 10px rgba(201,168,76,0), 0 3px 10px rgba(0,0,0,0.6); }
          100% { box-shadow: 0 0 0 0 rgba(201,168,76,0), 0 3px 10px rgba(0,0,0,0.6); }
        }
        @keyframes gm-pulse-dest {
          0%   { box-shadow: 0 0 0 0 rgba(201,168,76,0.35), 0 3px 10px rgba(0,0,0,0.6); }
          65%  { box-shadow: 0 0 0 8px rgba(201,168,76,0), 0 3px 10px rgba(0,0,0,0.6); }
          100% { box-shadow: 0 0 0 0 rgba(201,168,76,0), 0 3px 10px rgba(0,0,0,0.6); }
        }
        .gm-pin {
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-family: 'DM Sans', sans-serif; font-weight: 600;
          cursor: pointer; transition: transform 0.18s;
        }
        .gm-pin:hover { transform: scale(1.18); }
        .gm-pin-home {
          background: rgba(201,168,76,0.92);
          border: 2px solid #e8c97a;
          color: #0a0905;
          animation: gm-pulse 2.8s ease-out infinite;
        }
        .gm-pin-dest {
          background: rgba(10,9,5,0.88);
          border: 2px dashed #c9a84c;
          color: #c9a84c;
          animation: gm-pulse-dest 3.2s ease-out infinite;
        }
        .leaflet-container { background: #0d0c09 !important; }
        .leaflet-popup-content-wrapper {
          background: #141209 !important;
          border: 1px solid rgba(201,168,76,0.32) !important;
          border-radius: 0 !important;
          box-shadow: 0 12px 40px rgba(0,0,0,0.75) !important;
          padding: 0 !important; min-width: 260px;
        }
        .leaflet-popup-tip { background: #141209 !important; }
        .leaflet-popup-tip-container { margin-top: -1px; }
        .leaflet-popup-content { margin: 0 !important; line-height: 1 !important; }
        .leaflet-popup-close-button {
          color: rgba(201,168,76,0.5) !important; font-size: 20px !important;
          top: 10px !important; right: 10px !important;
          width: 20px !important; height: 20px !important; line-height: 18px !important;
        }
        .leaflet-popup-close-button:hover { color: #c9a84c !important; background: none !important; }
        .leaflet-control-zoom { border: 1px solid rgba(201,168,76,0.2) !important; border-radius: 0 !important; }
        .leaflet-control-zoom a {
          background: rgba(14,13,9,0.95) !important; color: #c9a84c !important;
          border-bottom: 1px solid rgba(201,168,76,0.15) !important;
          line-height: 28px !important; width: 28px !important; height: 28px !important; font-size: 16px !important;
        }
        .leaflet-control-zoom a:hover { background: rgba(201,168,76,0.12) !important; }
        .leaflet-control-attribution {
          background: rgba(10,9,5,0.8) !important;
          color: rgba(245,240,232,0.25) !important; font-size: 9px !important;
        }
        .leaflet-control-attribution a { color: rgba(201,168,76,0.4) !important; }
      `}</style>

      <div style={{ position:"fixed", inset:0, paddingTop:60, display:"flex", flexDirection:"column", background:"#0a0905", fontFamily:"'DM Sans',sans-serif" }}>
        <div style={{ flex:1, position:"relative", overflow:"hidden" }}>

          {/* search bar */}
          <div style={{ position:"absolute", top:16, left:16, zIndex:400, display:"flex", flexDirection:"column", width:"min(320px,calc(100vw - 32px))" }}>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:"rgba(245,240,232,0.3)", fontSize:"0.9rem", pointerEvents:"none" }}>🔍</span>
              <input
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder={t("map.searchPlaceholder")}
                style={{ width:"100%", background:"rgba(10,9,5,0.92)", border:"1px solid rgba(201,168,76,0.25)", color:"#f5f0e8", padding:"11px 14px 11px 38px", fontFamily:"'DM Sans',sans-serif", fontSize:"0.84rem", fontWeight:300, outline:"none", boxShadow:"0 4px 20px rgba(0,0,0,0.5)" }}
              />
            </div>
            {suggestions.length > 0 && (
              <div style={{ background:"rgba(14,13,9,0.97)", border:"1px solid rgba(201,168,76,0.2)", borderTop:"none", boxShadow:"0 8px 24px rgba(0,0,0,0.5)" }}>
                {suggestions.map(s => (
                  <button key={s.id} onClick={() => flyToDestination(s)} style={{ width:"100%", background:"none", border:"none", borderBottom:"1px solid rgba(201,168,76,0.08)", color:"rgba(245,240,232,0.7)", padding:"10px 14px", textAlign:"left", fontFamily:"'DM Sans',sans-serif", fontSize:"0.82rem", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between" }}
                    onMouseEnter={e => e.currentTarget.style.background="rgba(201,168,76,0.08)"}
                    onMouseLeave={e => e.currentTarget.style.background="none"}
                  >
                    <span>{s.label}</span>
                    <span style={{ fontSize:"0.7rem", color:"rgba(245,240,232,0.35)", letterSpacing:"0.1em" }}>{s.country}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* stats + filter */}
          <div style={{ position:"absolute", top:16, right:16, zIndex:400, background:"rgba(10,9,5,0.92)", border:"1px solid rgba(201,168,76,0.2)", padding:"12px 16px", display:"flex", flexDirection:"column", gap:8, boxShadow:"0 4px 20px rgba(0,0,0,0.5)" }}>
            <div style={{ display:"flex", gap:20 }}>
              <div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.4rem", fontWeight:300, color:"#e8c97a", lineHeight:1 }}>{locationClusters.length}</div>
                <div style={{ fontSize:"0.6rem", letterSpacing:"0.16em", textTransform:"uppercase", color:"rgba(245,240,232,0.35)", marginTop:3 }}>{t("map.locations")}</div>
              </div>
              <div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.4rem", fontWeight:300, color:"#e8c97a", lineHeight:1 }}>{destClusters.length}</div>
                <div style={{ fontSize:"0.6rem", letterSpacing:"0.16em", textTransform:"uppercase", color:"rgba(245,240,232,0.35)", marginTop:3 }}>{t("map.destinations")}</div>
              </div>
              <div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.4rem", fontWeight:300, color:"#e8c97a", lineHeight:1 }}>{totalTravelers}</div>
                <div style={{ fontSize:"0.6rem", letterSpacing:"0.16em", textTransform:"uppercase", color:"rgba(245,240,232,0.35)", marginTop:3 }}>{t("map.travelers")}</div>
              </div>
            </div>
            <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", userSelect:"none" }}>
              <div onClick={() => setFilterConfirmed(v => !v)} style={{ width:32, height:18, borderRadius:9, background:filterConfirmed?"rgba(201,168,76,0.35)":"rgba(245,240,232,0.08)", border:filterConfirmed?"1px solid #c9a84c":"1px solid rgba(201,168,76,0.2)", position:"relative", transition:"all 0.22s", flexShrink:0 }}>
                <div style={{ position:"absolute", top:2, left:filterConfirmed?14:2, width:12, height:12, borderRadius:"50%", background:filterConfirmed?"#c9a84c":"rgba(245,240,232,0.35)", transition:"all 0.22s" }} />
              </div>
              <span style={{ fontSize:"0.7rem", color:"rgba(245,240,232,0.45)", letterSpacing:"0.1em", textTransform:"uppercase" }}>{t("map.confirmedOnly")}</span>
            </label>
          </div>

          {/* legend */}
          <div style={{ position:"absolute", bottom:24, left:16, zIndex:400, background:"rgba(10,9,5,0.88)", border:"1px solid rgba(201,168,76,0.15)", padding:"10px 14px", display:"flex", flexDirection:"column", gap:7, boxShadow:"0 4px 16px rgba(0,0,0,0.4)" }}>
            {[
              { cls:"gm-pin-home", symbol:"●", label:t("map.liveHere") },
              { cls:"gm-pin-dest", symbol:"✈", label:t("map.travelingHere") },
            ].map(({ cls, symbol, label }) => (
              <div key={label} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div className={`gm-pin ${cls}`} style={{ width:22, height:22, fontSize:"9px", flexShrink:0 }}>{symbol}</div>
                <span style={{ fontSize:"0.68rem", color:"rgba(245,240,232,0.4)", letterSpacing:"0.1em" }}>{label}</span>
              </div>
            ))}
          </div>

          {/* map */}
          <MapContainer center={[25,15]} zoom={2} minZoom={2} maxZoom={12} zoomControl={false} style={{ height:"100%", width:"100%" }} worldCopyJump={true}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              subdomains="abcd" maxZoom={19}
            />
            <ZoomControl position="bottomright" />
            <FlyTo target={flyTarget} />

            {locationClusters.map(cluster => (
              <Marker key={cluster.id} position={[cluster.lat, cluster.lng]} icon={makeHomeIcon(cluster.travelers.length)}>
                <Popup minWidth={260} maxWidth={320}>
                  <PopupContent cluster={cluster} onViewProfile={setSelectedUid} />
                </Popup>
              </Marker>
            ))}

            {destClusters.map(cluster => (
              <Marker key={cluster.id} position={[cluster.lat, cluster.lng]} icon={makeDestIcon(cluster.travelers.length)}>
                <Popup minWidth={260} maxWidth={320}>
                  <PopupContent cluster={cluster} onViewProfile={setSelectedUid} />
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {selectedUid && (
        <PublicProfile
          uid={selectedUid}
          currentUser={user}
          onClose={() => setSelectedUid(null)}
          onBlockDone={() => setSelectedUid(null)}
        />
      )}
    </>
  );
}

/* ── popup content ── */
function PopupContent({ cluster, onViewProfile }) {
  const { t } = useTranslation();
  const isHome = cluster.type === "home";

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:300, color:"#f5f0e8" }}>
      {/* header */}
      <div style={{ padding:"14px 16px 10px", borderBottom:"1px solid rgba(201,168,76,0.12)", background:"rgba(201,168,76,0.05)" }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.05rem", fontWeight:300, color:"#f5f0e8", marginBottom:2 }}>
          {cluster.label || cluster.country}
        </div>
        <div style={{ fontSize:"0.68rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"rgba(201,168,76,0.7)" }}>
          {isHome ? t("map.liveHere") : t("map.travelingHere")} · {cluster.travelers.length} {cluster.travelers.length === 1 ? t("map.oneTraveler") : t("map.multipleTravelers")}
        </div>
      </div>

      {/* traveler list */}
      <div style={{ maxHeight:240, overflowY:"auto" }}>
        {cluster.travelers.map((tr, i) => (
          <div key={tr.uid} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px", borderBottom: i < cluster.travelers.length - 1 ? "1px solid rgba(201,168,76,0.07)" : "none" }}>
            {/* avatar */}
            <div style={{ width:38, height:38, borderRadius:"50%", border:"1.5px solid rgba(201,168,76,0.35)", background:"rgba(10,9,5,0.8)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.15rem", flexShrink:0, overflow:"hidden" }}>
              {tr.photoURL
                ? <img src={tr.photoURL} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : tr.emoji
              }
            </div>

            {/* name + status (destinations only) */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:"0.85rem", color:"#f5f0e8", marginBottom:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                {tr.displayName}
              </div>
              {!isHome && tr.status && (
                <span style={{ fontSize:"0.61rem", letterSpacing:"0.1em", textTransform:"uppercase", color: tr.status === "confirmed" ? "#6fcf97" : "#c9a84c", border:`1px solid ${tr.status === "confirmed" ? "rgba(111,207,151,0.35)" : "rgba(201,168,76,0.35)"}`, padding:"1px 6px" }}>
                  {tr.status === "confirmed" ? t("map.confirmed") : t("map.planning")}
                </span>
              )}
            </div>

            {/* view profile */}
            <button
              onClick={() => onViewProfile(tr.uid)}
              style={{ background:"rgba(201,168,76,0.12)", border:"1px solid rgba(201,168,76,0.35)", color:"#c9a84c", padding:"5px 10px", fontFamily:"'DM Sans',sans-serif", fontSize:"0.64rem", letterSpacing:"0.1em", textTransform:"uppercase", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, transition:"all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(201,168,76,0.22)"}
              onMouseLeave={e => e.currentTarget.style.background="rgba(201,168,76,0.12)"}
            >
              {t("map.viewProfile")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
