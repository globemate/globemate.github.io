import { useState, useEffect, useRef } from "react";
import { db, auth } from "./firebase";
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { LangButton } from "./LanguageSelector";
import { isPremium } from "./utils/isPremium";

function relTime(ts) {
  if (!ts?.toDate) return "";
  const d = ts.toDate(), diff = Date.now() - d.getTime();
  if (diff < 60_000)    return "ahora";
  if (diff < 3_600_000) return `hace ${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `hace ${Math.floor(diff / 3_600_000)}h`;
  if (diff < 604_800_000) return `hace ${Math.floor(diff / 86_400_000)}d`;
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  :root {
    --black:#0a0905; --dark:#100f0a; --card:#141209;
    --gold:#c9a84c; --gold-light:#e8c97a; --gold-dim:rgba(201,168,76,0.15);
    --cream:#f5f0e8; --cream-dim:rgba(245,240,232,0.55); --muted:rgba(245,240,232,0.35);
    --serif:'Cormorant Garamond',Georgia,serif; --sans:'DM Sans',sans-serif;
  }
  body { background:var(--black); color:var(--cream); font-family:var(--sans); font-weight:300; }

  /* nav */
  .nf-nav { position:fixed; top:0; left:0; right:0; z-index:200; height:58px; display:flex; align-items:center; justify-content:space-between; padding:0 32px; background:rgba(10,9,5,0.98); border-bottom:1px solid rgba(201,168,76,0.1); }
  @media(max-width:600px){ .nf-nav{ padding:0 16px; } }
  .nf-logo { font-family:var(--serif); font-size:1.3rem; font-weight:300; letter-spacing:0.12em; color:var(--gold-light); cursor:pointer; border:none; background:none; padding:0; transition:opacity 0.2s; }
  .nf-logo:hover { opacity:0.75; }
  .nf-logo span { font-style:italic; }
  .lang-btn { display:inline-flex !important; align-items:center; gap:6px; background:none; border:1px solid rgba(201,168,76,0.35); color:#e8c97a; cursor:pointer; font-family:inherit; font-size:0.72rem; letter-spacing:0.1em; padding:6px 10px; white-space:nowrap; flex-shrink:0; line-height:1; outline:none; transition:border-color 0.22s,color 0.22s; }
  .lang-btn:hover { border-color:#c9a84c; color:#c9a84c; }

  /* page */
  .nf-root { min-height:100vh; background:var(--black); padding-top:58px; }
  .nf-header { padding:40px 40px 20px; }
  @media(max-width:600px){ .nf-header{ padding:28px 20px 16px; } }
  .nf-eyebrow { font-size:0.67rem; letter-spacing:0.24em; text-transform:uppercase; color:var(--gold); margin-bottom:10px; }
  .nf-h1 { font-family:var(--serif); font-size:clamp(1.9rem,3.5vw,2.8rem); font-weight:300; color:var(--cream); }
  .nf-h1 em { font-style:italic; color:var(--gold-light); }
  .nf-subtitle { font-size:0.8rem; color:var(--muted); margin-top:6px; }

  /* list */
  .nf-list { padding:0 40px 80px; display:flex; flex-direction:column; }
  @media(max-width:600px){ .nf-list{ padding:0 16px 60px; } }
  .nf-divider { height:1px; background:rgba(201,168,76,0.1); margin-bottom:8px; }

  /* section header */
  .nf-section-hdr { font-size:0.63rem; letter-spacing:0.22em; text-transform:uppercase; color:var(--muted); padding:18px 0 6px; }

  /* request card */
  .nf-req { display:flex; align-items:center; gap:14px; padding:18px 0; border-bottom:1px solid rgba(201,168,76,0.07); }
  .nf-req-avatar { width:50px; height:50px; border-radius:50%; border:1.5px solid rgba(201,168,76,0.3); background:rgba(20,18,9,0.9); display:flex; align-items:center; justify-content:center; font-size:1.5rem; overflow:hidden; flex-shrink:0; }
  .nf-req-avatar img { width:100%; height:100%; object-fit:cover; }
  .nf-req-info { flex:1; min-width:0; }
  .nf-req-name { font-size:0.9rem; color:var(--cream); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .nf-req-sub  { font-size:0.75rem; color:var(--muted); margin-top:2px; }
  .nf-req-actions { display:flex; gap:8px; flex-shrink:0; }
  .nf-accept-btn {
    background:var(--gold); border:none; color:#0a0905;
    font-family:var(--sans); font-size:0.68rem; letter-spacing:0.1em; text-transform:uppercase;
    padding:8px 16px; cursor:pointer; transition:background 0.2s; white-space:nowrap;
  }
  .nf-accept-btn:hover:not(:disabled) { background:var(--gold-light); }
  .nf-accept-btn:disabled { opacity:0.5; cursor:default; }
  .nf-accept-btn.matched { background:rgba(201,168,76,0.15); color:var(--gold-light); cursor:default; }
  .nf-ignore-btn {
    background:none; border:1px solid rgba(245,240,232,0.15); color:rgba(245,240,232,0.4);
    font-family:var(--sans); font-size:0.68rem; letter-spacing:0.1em; text-transform:uppercase;
    padding:8px 14px; cursor:pointer; transition:all 0.2s; white-space:nowrap;
  }
  .nf-ignore-btn:hover { border-color:rgba(245,240,232,0.3); color:rgba(245,240,232,0.65); }

  /* persistent notification card */
  .nf-notif {
    display:flex; align-items:center; gap:14px;
    padding:15px 0; border-bottom:1px solid rgba(201,168,76,0.07);
    position:relative;
  }
  .nf-notif-unseen { border-left:2px solid rgba(201,168,76,0.5); padding-left:10px; margin-left:-12px; }
  @media(max-width:600px){ .nf-notif-unseen{ margin-left:-4px; padding-left:4px; } }
  .nf-notif-icon {
    width:44px; height:44px; border-radius:50%;
    border:1.5px solid rgba(201,168,76,0.22);
    background:rgba(20,18,9,0.9);
    display:flex; align-items:center; justify-content:center;
    font-size:1.3rem; overflow:hidden; flex-shrink:0;
  }
  .nf-notif-icon img { width:100%; height:100%; object-fit:cover; }
  .nf-notif-body { flex:1; min-width:0; }
  .nf-notif-text { font-size:0.85rem; color:var(--cream-dim); line-height:1.45; }
  .nf-notif-text em { color:var(--cream); font-style:normal; font-weight:400; }
  .nf-notif-text strong { color:var(--gold-light); font-weight:400; }
  .nf-notif-sub { font-size:0.71rem; color:var(--muted); margin-top:3px; }
  .nf-del-btn {
    background:none; border:none;
    color:rgba(245,240,232,0.2); font-size:0.85rem;
    cursor:pointer; padding:6px 8px; flex-shrink:0;
    transition:color 0.15s; line-height:1;
  }
  .nf-del-btn:hover { color:rgba(245,240,232,0.55); }

  /* empty */
  .nf-empty { padding:80px 40px; text-align:center; }
  .nf-empty-icon { font-size:2.8rem; opacity:0.3; margin-bottom:16px; }
  .nf-empty-txt { font-family:var(--serif); font-size:1.3rem; font-weight:300; color:var(--cream-dim); margin-bottom:8px; }
  .nf-empty-sub { font-size:0.8rem; color:var(--muted); }

  /* visits card */
  .nf-visits-card { padding:15px 0; border-bottom:1px solid rgba(201,168,76,0.07); }
  .nf-visits-header { display:flex; align-items:center; gap:14px; cursor:pointer; user-select:none; }
  .nf-visits-toggle { margin-left:auto; font-size:0.72rem; color:var(--gold); letter-spacing:0.08em; flex-shrink:0; }
  .nf-visits-list { margin-top:10px; display:flex; flex-direction:column; gap:0; }
  .nf-visitor-row { display:flex; align-items:center; gap:12px; padding:10px 0; border-top:1px solid rgba(201,168,76,0.06); }
  .nf-visitor-avatar { width:38px; height:38px; border-radius:50%; border:1px solid rgba(201,168,76,0.25); background:rgba(20,18,9,0.9); display:flex; align-items:center; justify-content:center; font-size:1.15rem; overflow:hidden; flex-shrink:0; }
  .nf-visitor-avatar img { width:100%; height:100%; object-fit:cover; }
  .nf-visitor-name { font-size:0.85rem; color:var(--cream-dim); flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .nf-visitor-time { font-size:0.7rem; color:var(--muted); flex-shrink:0; }
  /* free teaser */
  .nf-visits-teaser { margin-top:8px; font-size:0.77rem; color:var(--muted); line-height:1.5; }
  .nf-visits-teaser-btn { margin-top:10px; display:inline-block; background:none; border:1px solid rgba(201,168,76,0.4); color:var(--gold); font-family:var(--sans); font-size:0.7rem; letter-spacing:0.12em; text-transform:uppercase; padding:7px 16px; cursor:pointer; transition:border-color 0.2s,color 0.2s; }
  .nf-visits-teaser-btn:hover { border-color:var(--gold); color:var(--gold-light); }

  /* hamburger */
  .nf-hamburger { display:none; flex-direction:column; gap:5px; background:none; border:none; cursor:pointer; padding:6px; flex-shrink:0; }
  @media(max-width:860px){ .nf-hamburger { display:flex; } }
  .nf-hamburger span { display:block; width:22px; height:1.5px; background:var(--gold); transition:transform 0.3s; }
  @media(max-width:860px){ .nf-desktop{ display:none !important; } }

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

export default function Notifications({
  pendingRequests = [], user, onIgnore,
  persistentNotifs = [], profileVisitDocs = [], lastVisitSeenAt = new Date(0),
  onMarkSeen, onDeleteNotif, subscription,
  onBack, onChat, onProfile, onExplore, onMatches, onMap, onSignOut,
  notifCount, onSettings, onPricing,
}) {
  const premium = isPremium(subscription);

  const [profiles,       setProfiles]       = useState({});
  const [accepting,      setAccepting]      = useState(new Set());
  const [matched,        setMatched]        = useState(new Set());
  const [menuOpen,       setMenuOpen]       = useState(false);
  const [visitsExpanded, setVisitsExpanded] = useState(false);
  const [visitorProfiles, setVisitorProfiles] = useState({});
  const [visitsDismissedAt, setVisitsDismissedAt] = useState(() => {
    try { return new Date(localStorage.getItem("gm_visitsDismissed") || 0); }
    catch { return new Date(0); }
  });

  const markedRef = useRef(false);

  // Mark all seen when panel opens
  useEffect(() => {
    if (!markedRef.current) { markedRef.current = true; onMarkSeen?.(); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Also mark seen when data arrives (if any unseen)
  useEffect(() => {
    if (persistentNotifs.some(n => !n.seen)) onMarkSeen?.();
  }, [persistentNotifs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load profiles for pending requesters
  useEffect(() => {
    const uids = pendingRequests.map(r => r.fromUid).filter(uid => !profiles[uid]);
    if (!uids.length) return;
    Promise.all(uids.map(uid =>
      getDoc(doc(db, "users", uid)).then(snap => ({ uid, data: snap.data() || {} }))
    )).then(results => {
      setProfiles(prev => {
        const next = { ...prev };
        results.forEach(({ uid, data }) => {
          next[uid] = {
            displayName: data.displayName || "Viajero",
            photoURL:    data.photoURL    || null,
            emoji:       data.emoji       || "👤",
          };
        });
        return next;
      });
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingRequests.map(r => r.fromUid).join(",")]);

  const handleAccept = async (fromUid) => {
    if (!user?.uid || accepting.has(fromUid) || matched.has(fromUid)) return;
    const myUid = user.uid;
    setAccepting(prev => new Set([...prev, fromUid]));

    const [uidA, uidB] = [myUid, fromUid].sort();
    const matchId = `${uidA}_${uidB}`;
    const theirProfile = profiles[fromUid] || {};
    let likeOk = false;

    try {
      // 1. Create my like back
      await setDoc(doc(db, "likes", `${myUid}_${fromUid}`), {
        fromUid: myUid, toUid: fromUid, createdAt: serverTimestamp(),
      }, { merge: true });
      likeOk = true;

      // 2. Match — may already exist if both users liked each other in Explore first.
      // The firestore.rules match update rule allows participants to merge-update.
      await setDoc(doc(db, "matches", matchId), {
        users: [uidA, uidB], createdAt: serverTimestamp(),
      }, { merge: true });

      // 3. Conversation
      await setDoc(doc(db, "conversations", matchId), {
        participants: [uidA, uidB],
        participantProfiles: {
          [myUid]:   { uid: myUid,   displayName: auth.currentUser?.displayName || "Viajero", photoURL: auth.currentUser?.photoURL || null },
          [fromUid]: { uid: fromUid, displayName: theirProfile.displayName || "Viajero", photoURL: theirProfile.photoURL || null, emoji: theirProfile.emoji || null },
        },
        lastMessage: "", lastMessageAt: serverTimestamp(), lastMessageBy: null, matchId,
      }, { merge: true });
    } catch (err) {
      console.error("[handleAccept] match/conv creation failed:", err);
    }

    // Notifications written independently: a pre-existing match (Explore mutual like) must
    // not prevent the history entry and the other user's notification from being written.
    if (likeOk) {
      // Notify the original requester: "X aceptó tu solicitud — ¡es un match! ✓"
      addDoc(collection(db, "notifications", fromUid, "items"), {
        type: "match_received",
        fromUid: myUid,
        fromName:     auth.currentUser?.displayName || "Viajero",
        fromPhotoURL: auth.currentUser?.photoURL    || null,
        matchId, seen: false, deleted: false, createdAt: serverTimestamp(),
      }).catch(err => console.error("[handleAccept] notif→requester failed:", err));

      // Write history entry for myself: "Hiciste match con X ✓"
      addDoc(collection(db, "notifications", myUid, "items"), {
        type: "match_accepted",
        fromUid,
        fromName:     theirProfile.displayName || "Viajero",
        fromPhotoURL: theirProfile.photoURL    || null,
        matchId, seen: false, deleted: false, createdAt: serverTimestamp(),
      }).catch(err => console.error("[handleAccept] notif→self failed:", err));

      setMatched(prev => new Set([...prev, fromUid]));
    }
    setAccepting(prev => { const s = new Set(prev); s.delete(fromUid); return s; });
  };

  // Load visitor profiles for premium users
  useEffect(() => {
    if (!premium || !profileVisitDocs.length) return;
    const uids = [...new Set(profileVisitDocs.map(v => v.visitorId).filter(Boolean))];
    const missing = uids.filter(uid => !visitorProfiles[uid]);
    if (!missing.length) return;
    Promise.all(missing.map(uid =>
      getDoc(doc(db, "users", uid)).then(snap => ({ uid, data: snap.data() || {} }))
    )).then(results => {
      setVisitorProfiles(prev => {
        const next = { ...prev };
        results.forEach(({ uid, data }) => {
          next[uid] = {
            displayName: data.displayName || "Viajero",
            photoURL:    data.photoURL    || null,
            emoji:       data.emoji       || "👤",
          };
        });
        return next;
      });
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [premium, profileVisitDocs.map(v => v.visitorId).join(",")]);

  // Profile visits
  const totalVisits = profileVisitDocs.length;
  const hasNewVisits = profileVisitDocs.some(v => {
    const t = v.timestamp?.toDate?.();
    return t && t > visitsDismissedAt;
  });
  const showVisitsCard = totalVisits > 0 && hasNewVisits;

  const handleDismissVisits = () => {
    const now = new Date();
    setVisitsDismissedAt(now);
    try { localStorage.setItem("gm_visitsDismissed", now.toISOString()); } catch {}
  };

  const hasHistory = persistentNotifs.length > 0 || showVisitsCard;
  const isEmpty    = pendingRequests.length === 0 && !hasHistory;

  return (
    <>
      <style>{css}</style>

      {/* mobile nav */}
      <div className={`mob-nav${menuOpen ? " open" : ""}`}>
        <div className="mob-nav-top">
          <div className="mob-nav-logo">Globe<span>Mate</span></div>
          <LangButton align="right" />
          <button className="mob-nav-close" onClick={() => setMenuOpen(false)}>✕</button>
        </div>
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onBack(); }}>Inicio</button>
        <div className="mob-nav-divider" />
        <button className="mob-nav-link gold" onClick={() => { setMenuOpen(false); onExplore(); }}>Explorar</button>
        <button className="mob-nav-link gold" onClick={() => { setMenuOpen(false); onMatches(); }}>Matches</button>
        <button className="mob-nav-link gold" onClick={() => { setMenuOpen(false); onChat(); }}>Mensajes</button>
        <button className="mob-nav-link gold" onClick={() => { setMenuOpen(false); onMap(); }}>Mapa</button>
        <div className="mob-nav-divider" />
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onProfile(); }}>Mi perfil</button>
        <div className="mob-nav-divider" />
        <button className="mob-nav-link gold" onClick={() => { setMenuOpen(false); onPricing?.(); }}>Planes</button>
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onSettings?.(); }}>Ajustes</button>
        <div className="mob-nav-divider" />
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onSignOut(); }}>Cerrar sesión</button>
      </div>

      <div className="nf-root">
        <nav className="nf-nav">
          <button className="nf-logo" onClick={onBack}>Globe<span>Mate</span></button>
          <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            <LangButton align="right" className="nf-desktop" />
            <button className="nf-hamburger" onClick={() => setMenuOpen(true)} aria-label="Abrir menú">
              <span /><span /><span />
            </button>
          </div>
        </nav>

        <div className="nf-header">
          <div className="nf-eyebrow">Centro de notificaciones</div>
          <h1 className="nf-h1"><em>Notificaciones</em></h1>
          {pendingRequests.length > 0 && (
            <p className="nf-subtitle">
              {pendingRequests.length} solicitud{pendingRequests.length !== 1 ? "es" : ""} pendiente{pendingRequests.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <div className="nf-list">
          <div className="nf-divider" />

          {/* ─── Pending connection requests ─── */}
          {pendingRequests.length > 0 && (
            <>
              <div className="nf-section-hdr">Pendientes</div>
              {pendingRequests.map(({ likeId, fromUid }) => {
                const p           = profiles[fromUid];
                const isAccepting = accepting.has(fromUid);
                const isMatched   = matched.has(fromUid);
                return (
                  <div key={likeId} className="nf-req">
                    <div className="nf-req-avatar">
                      {p?.photoURL
                        ? <img src={p.photoURL} alt={p.displayName} />
                        : <span>{p?.emoji || "👤"}</span>
                      }
                    </div>
                    <div className="nf-req-info">
                      <div className="nf-req-name">{p?.displayName || "…"}</div>
                      <div className="nf-req-sub">quiere conectar contigo</div>
                    </div>
                    <div className="nf-req-actions">
                      {isMatched ? (
                        <span className="nf-accept-btn matched">Match ✓</span>
                      ) : (
                        <button
                          className="nf-accept-btn"
                          onClick={() => handleAccept(fromUid)}
                          disabled={isAccepting}
                        >
                          {isAccepting ? "…" : "Aceptar"}
                        </button>
                      )}
                      {!isMatched && (
                        <button className="nf-ignore-btn" onClick={() => onIgnore?.(fromUid)}>
                          Ignorar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* ─── History: matches, verification, visits ─── */}
          {hasHistory && (
            <>
              <div className="nf-section-hdr" style={{ marginTop: pendingRequests.length ? 8 : 0 }}>Historial</div>

              {/* Profile visits card */}
              {showVisitsCard && (
                <div className={`nf-visits-card${hasNewVisits ? " nf-notif-unseen" : ""}`} style={{ paddingLeft: hasNewVisits ? undefined : 0 }}>
                  <div
                    className="nf-visits-header"
                    onClick={premium ? () => setVisitsExpanded(e => !e) : undefined}
                    style={{ cursor: premium ? "pointer" : "default" }}
                  >
                    <div className="nf-notif-icon">
                      <span style={{ fontSize:"1.35rem" }}>👁</span>
                    </div>
                    <div className="nf-notif-body">
                      <div className="nf-notif-text">
                        <em>{totalVisits}</em> {totalVisits === 1 ? "persona visitó" : "personas visitaron"} tu perfil
                      </div>
                      {!premium && (
                        <div className="nf-visits-teaser">
                          Descubre quién te visitó. Hazte Premium para ver la lista ✨
                          <br />
                          <button className="nf-visits-teaser-btn" onClick={() => onPricing?.()}>
                            Ver planes
                          </button>
                        </div>
                      )}
                    </div>
                    {premium && (
                      <span className="nf-visits-toggle">
                        {visitsExpanded ? "Ocultar ▴" : "Ver lista ▾"}
                      </span>
                    )}
                    <button
                      className="nf-del-btn"
                      onClick={e => { e.stopPropagation(); handleDismissVisits(); }}
                      title="Marcar como visto"
                    >✕</button>
                  </div>

                  {premium && visitsExpanded && (
                    <div className="nf-visits-list">
                      {[...profileVisitDocs]
                        .sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0))
                        .map((v, i) => {
                          const uid = v.visitorId;
                          const p   = visitorProfiles[uid] || {};
                          return (
                            <div key={uid || i} className="nf-visitor-row">
                              <div className="nf-visitor-avatar">
                                {p.photoURL
                                  ? <img src={p.photoURL} alt={p.displayName} />
                                  : <span>{p.emoji || "👤"}</span>
                                }
                              </div>
                              <span className="nf-visitor-name">{p.displayName || "…"}</span>
                              <span className="nf-visitor-time">{relTime(v.timestamp)}</span>
                            </div>
                          );
                        })
                      }
                    </div>
                  )}
                </div>
              )}

              {/* Match & verification notifications */}
              {persistentNotifs.map(n => (
                <div key={n.id} className={`nf-notif${!n.seen ? " nf-notif-unseen" : ""}`}>
                  <div className="nf-notif-icon">
                    {n.type === "verification"
                      ? <span style={{ fontSize:"1.35rem" }}>{n.status === "verified" ? "✅" : "⚠️"}</span>
                      : n.fromPhotoURL
                        ? <img src={n.fromPhotoURL} alt="" />
                        : <span style={{ fontSize:"1.35rem" }}>👤</span>
                    }
                  </div>
                  <div className="nf-notif-body">
                    <div className="nf-notif-text">
                      {n.type === "match_accepted" && (
                        <>Hiciste match con <em>{n.fromName}</em> <strong>✓</strong></>
                      )}
                      {n.type === "match_received" && (
                        <><em>{n.fromName}</em> aceptó tu solicitud — ¡es un match! <strong>✓</strong></>
                      )}
                      {n.type === "verification" && n.status === "verified" && (
                        <><strong>✓</strong> Tu perfil fue verificado</>
                      )}
                      {n.type === "verification" && n.status !== "verified" && (
                        <>Tu verificación fue rechazada — puedes intentarlo de nuevo</>
                      )}
                    </div>
                    <div className="nf-notif-sub">{relTime(n.createdAt)}</div>
                  </div>
                  <button className="nf-del-btn" onClick={() => onDeleteNotif?.(n.id)} title="Eliminar">✕</button>
                </div>
              ))}
            </>
          )}

          {/* ─── Empty state ─── */}
          {isEmpty && (
            <div className="nf-empty">
              <div className="nf-empty-icon">🔔</div>
              <div className="nf-empty-txt">Sin notificaciones</div>
              <div className="nf-empty-sub">Cuando alguien quiera conectar contigo o tengas novedades aparecerán aquí.</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
