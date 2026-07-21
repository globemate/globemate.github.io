import { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { LangButton } from "./LanguageSelector";

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

  /* empty */
  .nf-empty { padding:80px 40px; text-align:center; }
  .nf-empty-icon { font-size:2.8rem; opacity:0.3; margin-bottom:16px; }
  .nf-empty-txt { font-family:var(--serif); font-size:1.3rem; font-weight:300; color:var(--cream-dim); margin-bottom:8px; }
  .nf-empty-sub { font-size:0.8rem; color:var(--muted); }

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
  onBack, onChat, onProfile, onExplore, onMatches, onMap, onSignOut,
  notifCount, onSettings, onPricing,
}) {
  const [profiles,  setProfiles]  = useState({});  // {uid: {displayName, photoURL, emoji}}
  const [accepting, setAccepting] = useState(new Set());  // uids mid-accept
  const [matched,   setMatched]   = useState(new Set());  // uids just matched
  const [menuOpen,  setMenuOpen]  = useState(false);

  // load profiles for pending requesters
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
    try {
      // 1. Create my like back
      await setDoc(doc(db, "likes", `${myUid}_${fromUid}`), {
        fromUid: myUid, toUid: fromUid, createdAt: serverTimestamp(),
      }, { merge: true });

      // 2. Match is guaranteed (they already liked me)
      const [uidA, uidB] = [myUid, fromUid].sort();
      const matchId = `${uidA}_${uidB}`;
      await setDoc(doc(db, "matches", matchId), {
        users: [uidA, uidB], createdAt: serverTimestamp(),
      }, { merge: true });

      // 3. Conversation
      const theirProfile = profiles[fromUid] || {};
      await setDoc(doc(db, "conversations", matchId), {
        participants: [uidA, uidB],
        participantProfiles: {
          [myUid]:   { uid: myUid,   displayName: auth.currentUser?.displayName || "Viajero", photoURL: auth.currentUser?.photoURL || null },
          [fromUid]: { uid: fromUid, displayName: theirProfile.displayName || "Viajero", photoURL: theirProfile.photoURL || null, emoji: theirProfile.emoji || null },
        },
        lastMessage: "", lastMessageAt: serverTimestamp(), lastMessageBy: null, matchId,
      }, { merge: true });

      setMatched(prev => new Set([...prev, fromUid]));
    } catch (err) {
      console.error("Accept error:", err);
    }
    setAccepting(prev => { const s = new Set(prev); s.delete(fromUid); return s; });
  };

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
          <h1 className="nf-h1"><em>Solicitudes</em> de conexión</h1>
          {pendingRequests.length > 0 && (
            <p className="nf-subtitle">{pendingRequests.length} solicitud{pendingRequests.length !== 1 ? "es" : ""} pendiente{pendingRequests.length !== 1 ? "s" : ""}</p>
          )}
        </div>

        <div className="nf-list">
          <div className="nf-divider" />

          {pendingRequests.length === 0 ? (
            <div className="nf-empty">
              <div className="nf-empty-icon">🔔</div>
              <div className="nf-empty-txt">Sin solicitudes pendientes</div>
              <div className="nf-empty-sub">Cuando alguien quiera conectar contigo aparecerá aquí.</div>
            </div>
          ) : pendingRequests.map(({ likeId, fromUid }) => {
            const p   = profiles[fromUid];
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
        </div>
      </div>
    </>
  );
}
