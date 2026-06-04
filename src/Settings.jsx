import { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import {
  updateEmail, updatePassword,
  reauthenticateWithCredential, EmailAuthProvider, deleteUser,
} from "firebase/auth";

const TABS = ["Cuenta", "Notificaciones", "Privacidad", "Avanzada"];

const DEF = {
  phone: "",
  appLanguage: "Español",
  notif: {
    newMatches: true, messages: true, profileViews: true,
    connectionRequests: true, destinationAlerts: true, promotionalEmails: false,
  },
  privacy: {
    profileVisibility: "all",
    showLocation: true, showLastSeen: true,
    showVisitedCountries: true, incognitoMode: false,
  },
  accountPaused: false,
};

function Toggle({ on, onChange }) {
  return (
    <button
      className={`sg-toggle${on ? " on" : ""}`}
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      type="button"
    >
      <span className="sg-toggle-knob" />
    </button>
  );
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
  .sg-nav { position:fixed; top:0; left:0; right:0; z-index:200; height:58px; display:flex; align-items:center; justify-content:space-between; padding:0 32px; background:rgba(10,9,5,0.98); border-bottom:1px solid rgba(201,168,76,0.1); }
  @media(max-width:600px){ .sg-nav{ padding:0 16px; } }
  .sg-logo { font-family:var(--serif); font-size:1.3rem; font-weight:300; letter-spacing:0.12em; color:var(--gold-light); cursor:pointer; border:none; background:none; padding:0; transition:opacity 0.2s; }
  .sg-logo:hover { opacity:0.75; }
  .sg-logo span { font-style:italic; }
  .sg-nav-btn { background:none; border:none; color:var(--cream-dim); font-family:var(--sans); font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; cursor:pointer; padding:6px 10px; transition:color 0.2s; }
  .sg-nav-btn:hover { color:var(--cream); }
  .sg-nav-btn.active { color:var(--gold-light); }

  /* page */
  .sg-root { min-height:100vh; background:var(--black); padding-top:58px; padding-bottom:110px; }
  .sg-header { padding:40px 40px 0; }
  @media(max-width:600px){ .sg-header{ padding:28px 20px 0; } }
  .sg-eyebrow { font-size:0.67rem; letter-spacing:0.24em; text-transform:uppercase; color:var(--gold); margin-bottom:10px; }
  .sg-h1 { font-family:var(--serif); font-size:clamp(1.9rem,3.5vw,2.8rem); font-weight:300; color:var(--cream); margin-bottom:6px; }
  .sg-h1 em { font-style:italic; color:var(--gold-light); }

  /* tabs */
  .sg-tabs { display:flex; padding:24px 40px 0; border-bottom:1px solid rgba(201,168,76,0.1); overflow-x:auto; }
  @media(max-width:600px){ .sg-tabs{ padding:20px 16px 0; } }
  .sg-tab { background:none; border:none; border-bottom:2px solid transparent; color:var(--muted); font-family:var(--sans); font-size:0.78rem; letter-spacing:0.12em; text-transform:uppercase; padding:10px 20px; cursor:pointer; transition:all 0.2s; white-space:nowrap; }
  .sg-tab.on { color:var(--gold-light); border-bottom-color:var(--gold); }
  .sg-tab:hover:not(.on) { color:var(--cream-dim); }
  @media(max-width:460px){ .sg-tab{ padding:10px 12px; font-size:0.7rem; } }

  /* content */
  .sg-content { max-width:680px; padding:32px 40px; }
  @media(max-width:600px){ .sg-content{ padding:24px 16px; } }

  /* card sections */
  .sg-section { background:var(--card); border:1px solid rgba(201,168,76,0.1); margin-bottom:16px; }
  .sg-section.danger { border-color:rgba(192,57,43,0.2); }
  .sg-sec-title { font-family:var(--serif); font-size:0.9rem; font-weight:300; letter-spacing:0.1em; text-transform:uppercase; color:var(--gold); padding:16px 24px 12px; border-bottom:1px solid rgba(201,168,76,0.08); }
  .sg-sec-title.danger { color:#e07070; border-bottom-color:rgba(192,57,43,0.1); }

  /* toggle rows */
  .sg-row { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:15px 24px; border-bottom:1px solid rgba(201,168,76,0.06); }
  .sg-row:last-child { border-bottom:none; }
  .sg-row-info { flex:1; min-width:0; }
  .sg-row-lbl { font-size:0.86rem; color:var(--cream); margin-bottom:2px; }
  .sg-row-sub { font-size:0.74rem; color:var(--muted); line-height:1.5; }

  /* field rows */
  .sg-field { display:flex; flex-direction:column; gap:8px; padding:16px 24px; border-bottom:1px solid rgba(201,168,76,0.06); }
  .sg-field:last-child { border-bottom:none; }
  .sg-lbl { font-size:0.65rem; letter-spacing:0.18em; text-transform:uppercase; color:var(--muted); }
  .sg-cur-val { font-size:0.86rem; color:var(--cream-dim); padding:3px 0; }
  .sg-inp { background:rgba(245,240,232,0.04); border:1px solid rgba(201,168,76,0.18); color:var(--cream); padding:10px 14px; font-family:var(--sans); font-size:0.84rem; font-weight:300; outline:none; width:100%; transition:border-color 0.25s; }
  .sg-inp:focus { border-color:var(--gold); }
  .sg-inp::placeholder { color:var(--muted); }
  .sg-sel { background:rgba(245,240,232,0.04); border:1px solid rgba(201,168,76,0.18); color:var(--cream); padding:10px 14px; font-family:var(--sans); font-size:0.84rem; font-weight:300; outline:none; width:100%; cursor:pointer; }
  .sg-sel option { background:#141209; }
  .sg-field-btn { align-self:flex-start; background:transparent; border:1px solid var(--gold); color:var(--gold); padding:8px 20px; font-family:var(--sans); font-size:0.7rem; letter-spacing:0.12em; text-transform:uppercase; cursor:pointer; transition:all 0.25s; margin-top:2px; }
  .sg-field-btn:hover:not(:disabled) { background:rgba(201,168,76,0.14); }
  .sg-field-btn:disabled { opacity:0.38; cursor:not-allowed; }
  .sg-note { font-size:0.74rem; padding:3px 0; }
  .sg-note.ok { color:#6fcf97; }
  .sg-note.err { color:#f5a0a0; }

  /* toggle */
  .sg-toggle { width:46px; height:26px; border-radius:13px; border:none; background:rgba(245,240,232,0.13); cursor:pointer; position:relative; transition:background 0.25s; flex-shrink:0; padding:0; }
  .sg-toggle.on { background:var(--gold); }
  .sg-toggle-knob { position:absolute; top:3px; left:3px; width:20px; height:20px; border-radius:50%; background:#f5f0e8; transition:transform 0.25s; display:block; pointer-events:none; }
  .sg-toggle.on .sg-toggle-knob { transform:translateX(20px); }

  /* radio group */
  .sg-radios { display:flex; flex-direction:column; gap:8px; padding:12px 0 4px; }
  .sg-radio { display:flex; align-items:center; gap:10px; cursor:pointer; padding:5px 0; }
  .sg-radio-dot { width:16px; height:16px; border-radius:50%; border:1.5px solid rgba(201,168,76,0.35); flex-shrink:0; position:relative; transition:border-color 0.2s; }
  .sg-radio.on .sg-radio-dot { border-color:var(--gold); }
  .sg-radio.on .sg-radio-dot::after { content:''; position:absolute; inset:3px; border-radius:50%; background:var(--gold); }
  .sg-radio-lbl { font-size:0.85rem; color:var(--cream-dim); }
  .sg-radio.on .sg-radio-lbl { color:var(--cream); }

  /* danger zone */
  .sg-danger-row { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; padding:18px 24px; border-bottom:1px solid rgba(201,168,76,0.06); flex-wrap:wrap; }
  .sg-danger-row:last-child { border-bottom:none; }
  .sg-btn-pause { background:transparent; border:1px solid rgba(201,168,76,0.35); color:var(--gold); padding:9px 20px; font-family:var(--sans); font-size:0.7rem; letter-spacing:0.12em; text-transform:uppercase; cursor:pointer; transition:all 0.25s; white-space:nowrap; }
  .sg-btn-pause:hover { background:rgba(201,168,76,0.1); border-color:var(--gold); }
  .sg-btn-pause.paused { background:rgba(201,168,76,0.14); border-color:var(--gold); color:var(--gold-light); }
  .sg-btn-del { background:transparent; border:1px solid rgba(192,57,43,0.45); color:#e07070; padding:9px 20px; font-family:var(--sans); font-size:0.7rem; letter-spacing:0.12em; text-transform:uppercase; cursor:pointer; transition:all 0.25s; white-space:nowrap; }
  .sg-btn-del:hover { background:rgba(192,57,43,0.12); border-color:#c0392b; color:#ff8a80; }

  /* delete modal */
  .sg-overlay { position:fixed; inset:0; z-index:600; background:rgba(10,9,5,0.9); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; padding:20px; }
  .sg-modal { background:var(--card); border:1px solid rgba(192,57,43,0.28); max-width:440px; width:100%; padding:36px 32px; }
  @media(max-width:480px){ .sg-modal{ padding:28px 20px; } }
  .sg-modal-icon { font-size:2rem; margin-bottom:12px; }
  .sg-modal-title { font-family:var(--serif); font-size:1.55rem; font-weight:300; color:var(--cream); margin-bottom:10px; }
  .sg-modal-body { font-size:0.84rem; color:var(--cream-dim); line-height:1.72; margin-bottom:20px; }
  .sg-modal-lbl { font-size:0.73rem; color:var(--muted); margin-bottom:8px; }
  .sg-modal-lbl strong { color:var(--cream); }
  .sg-modal-err { font-size:0.74rem; color:#f5a0a0; margin-top:8px; }
  .sg-modal-actions { display:flex; gap:10px; margin-top:20px; flex-wrap:wrap; }
  .sg-btn-cancel { flex:1; background:none; border:1px solid rgba(201,168,76,0.25); color:var(--cream-dim); padding:10px 16px; font-family:var(--sans); font-size:0.7rem; letter-spacing:0.12em; text-transform:uppercase; cursor:pointer; transition:all 0.2s; }
  .sg-btn-cancel:hover { border-color:var(--gold); color:var(--cream); }
  .sg-btn-confirm-del { flex:1; background:transparent; border:1px solid rgba(192,57,43,0.5); color:#e07070; padding:10px 16px; font-family:var(--sans); font-size:0.7rem; letter-spacing:0.12em; text-transform:uppercase; cursor:pointer; transition:all 0.25s; }
  .sg-btn-confirm-del:hover:not(:disabled) { background:rgba(192,57,43,0.12); border-color:#c0392b; color:#ff8a80; }
  .sg-btn-confirm-del:disabled { opacity:0.32; cursor:not-allowed; }

  /* save bar */
  .sg-save-bar { position:fixed; bottom:0; left:0; right:0; z-index:200; background:rgba(10,9,5,0.97); border-top:1px solid rgba(201,168,76,0.2); padding:16px 40px; display:flex; align-items:center; justify-content:space-between; gap:16px; }
  @media(max-width:600px){ .sg-save-bar{ padding:14px 16px; } }
  .sg-save-msg { font-size:0.78rem; color:var(--muted); }
  .sg-save-msg.ok { color:#6fcf97; }
  .sg-save-msg.err { color:#f5a0a0; }
  .sg-save-btn { background:var(--gold); color:var(--black); border:none; padding:11px 40px; font-family:var(--sans); font-size:0.74rem; font-weight:500; letter-spacing:0.18em; text-transform:uppercase; cursor:pointer; transition:background 0.25s; white-space:nowrap; }
  .sg-save-btn:hover:not(:disabled) { background:var(--gold-light); }
  .sg-save-btn:disabled { opacity:0.45; cursor:not-allowed; }

  /* hamburger */
  .sg-hamburger { display:none; flex-direction:column; gap:5px; background:none; border:none; cursor:pointer; padding:6px; flex-shrink:0; }
  @media(max-width:860px){ .sg-hamburger{ display:flex; } }
  .sg-hamburger span { display:block; width:22px; height:1.5px; background:var(--gold); }
  @media(max-width:860px){ .sg-desktop{ display:none !important; } }

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

export default function Settings({
  user, onBack, onNotif, notifCount, onExplore, onMatches,
  onChat, onMap, onProfile, onSignOut, onPricing,
}) {
  const [tab, setTab]         = useState("Cuenta");
  const [menuOpen, setMenuOpen] = useState(false);
  const [settings, setSettings] = useState(DEF);
  const [loading, setLoading]   = useState(true);
  const [dirty, setDirty]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saveMsg, setSaveMsg]   = useState({ text:"", type:"" });

  // Cuenta — email
  const [newEmail, setNewEmail]   = useState("");
  const [emailPwd, setEmailPwd]   = useState("");
  const [emailMsg, setEmailMsg]   = useState({ text:"", type:"" });
  const [emailBusy, setEmailBusy] = useState(false);
  // Cuenta — password
  const [curPwd, setCurPwd]     = useState("");
  const [newPwd, setNewPwd]     = useState("");
  const [cfmPwd, setCfmPwd]     = useState("");
  const [pwdMsg, setPwdMsg]     = useState({ text:"", type:"" });
  const [pwdBusy, setPwdBusy]   = useState(false);
  // Avanzada — delete
  const [showDel, setShowDel]   = useState(false);
  const [delText, setDelText]   = useState("");
  const [delBusy, setDelBusy]   = useState(false);
  const [delErr, setDelErr]     = useState("");

  useEffect(() => {
    getDoc(doc(db, "users", user.uid)).then(snap => {
      if (snap.exists() && snap.data().settings) {
        const s = snap.data().settings;
        setSettings({
          ...DEF, ...s,
          notif:   { ...DEF.notif,    ...(s.notif    || {}) },
          privacy: { ...DEF.privacy,  ...(s.privacy  || {}) },
        });
      }
    }).finally(() => setLoading(false));
  }, [user]);

  const updNotif   = (k, v) => { setSettings(s => ({ ...s, notif:   { ...s.notif,   [k]: v } })); setDirty(true); setSaveMsg({ text:"", type:"" }); };
  const updPrivacy = (k, v) => { setSettings(s => ({ ...s, privacy: { ...s.privacy, [k]: v } })); setDirty(true); setSaveMsg({ text:"", type:"" }); };
  const updField   = (k, v) => { setSettings(s => ({ ...s, [k]: v }));                             setDirty(true); setSaveMsg({ text:"", type:"" }); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "users", user.uid), { settings }, { merge: true });
      setDirty(false);
      setSaveMsg({ text:"Guardado ✓", type:"ok" });
      setTimeout(() => setSaveMsg({ text:"", type:"" }), 3000);
    } catch {
      setSaveMsg({ text:"Error al guardar. Intenta de nuevo.", type:"err" });
    }
    setSaving(false);
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || !emailPwd) return;
    setEmailBusy(true); setEmailMsg({ text:"", type:"" });
    try {
      const cred = EmailAuthProvider.credential(user.email, emailPwd);
      await reauthenticateWithCredential(user, cred);
      await updateEmail(user, newEmail);
      setEmailMsg({ text:"Email actualizado ✓", type:"ok" });
      setNewEmail(""); setEmailPwd("");
    } catch (e) {
      const msg = e.code === "auth/wrong-password"   ? "Contraseña incorrecta."
                : e.code === "auth/email-already-in-use" ? "Ese email ya está en uso."
                : "Error al actualizar email.";
      setEmailMsg({ text: msg, type:"err" });
    }
    setEmailBusy(false);
  };

  const handleUpdatePassword = async () => {
    if (!curPwd || !newPwd || !cfmPwd) { setPwdMsg({ text:"Completa todos los campos.", type:"err" }); return; }
    if (newPwd !== cfmPwd) { setPwdMsg({ text:"Las contraseñas no coinciden.", type:"err" }); return; }
    if (newPwd.length < 6) { setPwdMsg({ text:"Mínimo 6 caracteres.", type:"err" }); return; }
    setPwdBusy(true); setPwdMsg({ text:"", type:"" });
    try {
      const cred = EmailAuthProvider.credential(user.email, curPwd);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPwd);
      setPwdMsg({ text:"Contraseña actualizada ✓", type:"ok" });
      setCurPwd(""); setNewPwd(""); setCfmPwd("");
    } catch (e) {
      setPwdMsg({ text: e.code === "auth/wrong-password" ? "Contraseña actual incorrecta." : "Error al actualizar.", type:"err" });
    }
    setPwdBusy(false);
  };

  const handlePauseToggle = async () => {
    const next = { ...settings, accountPaused: !settings.accountPaused };
    setSettings(next);
    await setDoc(doc(db, "users", user.uid), { settings: next }, { merge: true });
  };

  const handleDeleteAccount = async () => {
    if (delText !== "ELIMINAR") return;
    setDelBusy(true); setDelErr("");
    try {
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
    } catch {
      setDelErr("Error al eliminar. Vuelve a iniciar sesión e inténtalo de nuevo.");
      setDelBusy(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#0a0905", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", color:"rgba(245,240,232,0.4)", fontSize:"0.85rem", letterSpacing:"0.15em", textTransform:"uppercase" }}>
      Cargando…
    </div>
  );

  return (
    <>
      <style>{css}</style>

      {/* delete confirm modal */}
      {showDel && (
        <div className="sg-overlay" onClick={() => { setShowDel(false); setDelText(""); setDelErr(""); }}>
          <div className="sg-modal" onClick={e => e.stopPropagation()}>
            <div className="sg-modal-icon">⚠️</div>
            <div className="sg-modal-title">Eliminar cuenta</div>
            <div className="sg-modal-body">
              Esta acción es <strong>permanente e irreversible</strong>. Se eliminarán tu perfil, matches, mensajes y todos tus datos de GlobeMate.
            </div>
            <div className="sg-modal-lbl">Para confirmar, escribe <strong>ELIMINAR</strong></div>
            <input
              className="sg-inp"
              placeholder="ELIMINAR"
              value={delText}
              onChange={e => { setDelText(e.target.value); setDelErr(""); }}
              autoComplete="off"
            />
            {delErr && <div className="sg-modal-err">{delErr}</div>}
            <div className="sg-modal-actions">
              <button className="sg-btn-cancel" onClick={() => { setShowDel(false); setDelText(""); setDelErr(""); }}>
                Cancelar
              </button>
              <button
                className="sg-btn-confirm-del"
                onClick={handleDeleteAccount}
                disabled={delText !== "ELIMINAR" || delBusy}
              >
                {delBusy ? "Eliminando…" : "Eliminar cuenta"}
              </button>
            </div>
          </div>
        </div>
      )}

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
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onNotif?.(); }}>
          Notifications{notifCount > 0 ? ` (${notifCount})` : ""}
        </button>
        <button className="mob-nav-link gold" onClick={() => { setMenuOpen(false); onPricing?.(); }}>✦ Planes</button>
        <div className="mob-nav-divider" />
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onSignOut(); }}>Sign out</button>
      </div>

      <div className="sg-root">

        <nav className="sg-nav">
          <button className="sg-logo" onClick={onBack}>Globe<span>Mate</span></button>
          <div style={{ display:"flex", gap:4, alignItems:"center" }}>
            <div className="sg-desktop" style={{ display:"flex", alignItems:"center" }}>
              <button className="sg-nav-btn" onClick={onExplore}>Explore</button>
              <button className="sg-nav-btn" onClick={onMatches}>Matches</button>
              <button className="sg-nav-btn" onClick={onChat}>Messages</button>
              <button className="sg-nav-btn" onClick={onProfile}>Profile</button>
              <button className="sg-nav-btn" style={{color:"#c9a84c"}} onClick={onPricing}>✦ Planes</button>
            </div>
            <button className="sg-hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <span /><span /><span />
            </button>
          </div>
        </nav>

        <div className="sg-header">
          <div className="sg-eyebrow">Tu cuenta</div>
          <h1 className="sg-h1"><em>Configuración</em></h1>
        </div>

        <div className="sg-tabs">
          {TABS.map(t => (
            <button key={t} className={`sg-tab${tab === t ? " on" : ""}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        <div className="sg-content">

          {/* ─── CUENTA ─────────────────────────── */}
          {tab === "Cuenta" && (<>
            <div className="sg-section">
              <div className="sg-sec-title">Email</div>
              <div className="sg-field">
                <div className="sg-lbl">Email actual</div>
                <div className="sg-cur-val">{user.email}</div>
              </div>
              <div className="sg-field">
                <div className="sg-lbl">Nuevo email</div>
                <input className="sg-inp" type="email" placeholder="nuevo@email.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                <div className="sg-lbl" style={{ marginTop:6 }}>Contraseña actual (para confirmar)</div>
                <input className="sg-inp" type="password" placeholder="••••••••" value={emailPwd} onChange={e => setEmailPwd(e.target.value)} />
                {emailMsg.text && <div className={`sg-note ${emailMsg.type}`}>{emailMsg.text}</div>}
                <button className="sg-field-btn" onClick={handleUpdateEmail} disabled={emailBusy || !newEmail || !emailPwd}>
                  {emailBusy ? "Actualizando…" : "Actualizar email"}
                </button>
              </div>
            </div>

            <div className="sg-section">
              <div className="sg-sec-title">Contraseña</div>
              <div className="sg-field">
                <div className="sg-lbl">Contraseña actual</div>
                <input className="sg-inp" type="password" placeholder="••••••••" value={curPwd} onChange={e => setCurPwd(e.target.value)} />
                <div className="sg-lbl" style={{ marginTop:6 }}>Nueva contraseña</div>
                <input className="sg-inp" type="password" placeholder="Mín. 6 caracteres" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
                <div className="sg-lbl" style={{ marginTop:6 }}>Confirmar nueva contraseña</div>
                <input className="sg-inp" type="password" placeholder="Repite la contraseña" value={cfmPwd} onChange={e => setCfmPwd(e.target.value)} />
                {pwdMsg.text && <div className={`sg-note ${pwdMsg.type}`}>{pwdMsg.text}</div>}
                <button className="sg-field-btn" onClick={handleUpdatePassword} disabled={pwdBusy || !curPwd || !newPwd || !cfmPwd}>
                  {pwdBusy ? "Actualizando…" : "Cambiar contraseña"}
                </button>
              </div>
            </div>

            <div className="sg-section">
              <div className="sg-sec-title">Contacto</div>
              <div className="sg-field">
                <div className="sg-lbl">Teléfono</div>
                <input className="sg-inp" type="tel" placeholder="+34 600 000 000" value={settings.phone} onChange={e => updField("phone", e.target.value)} />
              </div>
            </div>

            <div className="sg-section">
              <div className="sg-sec-title">Preferencias</div>
              <div className="sg-field">
                <div className="sg-lbl">Idioma de la app</div>
                <select className="sg-sel" value={settings.appLanguage} onChange={e => updField("appLanguage", e.target.value)}>
                  <option>Español</option>
                  <option>English</option>
                  <option>Français</option>
                  <option>Português</option>
                  <option>Deutsch</option>
                  <option>Italiano</option>
                  <option>日本語</option>
                </select>
              </div>
            </div>
          </>)}

          {/* ─── NOTIFICACIONES ─────────────────── */}
          {tab === "Notificaciones" && (
            <div className="sg-section">
              <div className="sg-sec-title">Notificaciones</div>
              {[
                { k:"newMatches",         lbl:"Nuevos matches",             sub:"Cuando alguien hace match contigo." },
                { k:"messages",           lbl:"Mensajes",                   sub:"Cuando recibes un mensaje nuevo." },
                { k:"profileViews",       lbl:"Visitas al perfil",          sub:"Cuando alguien ve tu perfil." },
                { k:"connectionRequests", lbl:"Solicitudes de conexión",    sub:"Cuando alguien quiere conectar contigo." },
                { k:"destinationAlerts",  lbl:"Alertas de destino",         sub:"Viajeros con tus mismos destinos próximos." },
                { k:"promotionalEmails",  lbl:"Emails promocionales",       sub:"Novedades, ofertas y actualizaciones de GlobeMate." },
              ].map(({ k, lbl, sub }) => (
                <div key={k} className="sg-row">
                  <div className="sg-row-info">
                    <div className="sg-row-lbl">{lbl}</div>
                    <div className="sg-row-sub">{sub}</div>
                  </div>
                  <Toggle on={settings.notif[k]} onChange={v => updNotif(k, v)} />
                </div>
              ))}
            </div>
          )}

          {/* ─── PRIVACIDAD ─────────────────────── */}
          {tab === "Privacidad" && (<>
            <div className="sg-section">
              <div className="sg-sec-title">Visibilidad del perfil</div>
              <div className="sg-field">
                <div className="sg-lbl">¿Quién puede ver tu perfil?</div>
                <div className="sg-radios">
                  {[
                    { v:"all",     l:"Todos los usuarios" },
                    { v:"matches", l:"Solo mis matches" },
                    { v:"hidden",  l:"Oculto (nadie puede verlo)" },
                  ].map(({ v, l }) => (
                    <div key={v} className={`sg-radio${settings.privacy.profileVisibility === v ? " on" : ""}`} onClick={() => updPrivacy("profileVisibility", v)}>
                      <div className="sg-radio-dot" />
                      <span className="sg-radio-lbl">{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="sg-section">
              <div className="sg-sec-title">Datos visibles</div>
              {[
                { k:"showLocation",        lbl:"Mostrar mi ubicación",         sub:"Tu ciudad es visible en tu perfil." },
                { k:"showLastSeen",        lbl:"Mostrar última conexión",       sub:"Otros ven cuándo estuviste activo por última vez." },
                { k:"showVisitedCountries",lbl:"Mostrar países visitados",      sub:"Tu colección de países es visible públicamente." },
              ].map(({ k, lbl, sub }) => (
                <div key={k} className="sg-row">
                  <div className="sg-row-info">
                    <div className="sg-row-lbl">{lbl}</div>
                    <div className="sg-row-sub">{sub}</div>
                  </div>
                  <Toggle on={settings.privacy[k]} onChange={v => updPrivacy(k, v)} />
                </div>
              ))}
            </div>

            <div className="sg-section">
              <div className="sg-sec-title">Modo incógnito</div>
              <div className="sg-row">
                <div className="sg-row-info">
                  <div className="sg-row-lbl">Modo incógnito</div>
                  <div className="sg-row-sub">Navega perfiles sin aparecer en sus visitas. Disponible para usuarios Premium.</div>
                </div>
                <Toggle on={settings.privacy.incognitoMode} onChange={v => updPrivacy("incognitoMode", v)} />
              </div>
            </div>
          </>)}

          {/* ─── AVANZADA ───────────────────────── */}
          {tab === "Avanzada" && (<>
            <div className="sg-section">
              <div className="sg-sec-title">Estado de la cuenta</div>
              <div className="sg-danger-row">
                <div className="sg-row-info">
                  <div className="sg-row-lbl">Pausar cuenta</div>
                  <div className="sg-row-sub" style={{ marginTop:4 }}>
                    Tu perfil queda oculto temporalmente. Tus datos, matches y mensajes se conservan. Puedes reactivar en cualquier momento.
                  </div>
                </div>
                <button
                  className={`sg-btn-pause${settings.accountPaused ? " paused" : ""}`}
                  onClick={handlePauseToggle}
                >
                  {settings.accountPaused ? "⏸ Pausada — reactivar" : "Pausar cuenta"}
                </button>
              </div>
            </div>

            <div className="sg-section danger">
              <div className="sg-sec-title danger">Zona de peligro</div>
              <div className="sg-danger-row">
                <div className="sg-row-info">
                  <div className="sg-row-lbl" style={{ color:"#e07070" }}>Eliminar cuenta</div>
                  <div className="sg-row-sub" style={{ marginTop:4 }}>
                    Elimina de forma permanente tu cuenta, perfil, matches y todos tus datos. Esta acción no puede deshacerse.
                  </div>
                </div>
                <button className="sg-btn-del" onClick={() => setShowDel(true)}>
                  Eliminar cuenta
                </button>
              </div>
            </div>
          </>)}

        </div>

        {(dirty || saveMsg.text) && (
          <div className="sg-save-bar">
            <span className={`sg-save-msg ${saveMsg.type}`}>{saveMsg.text || "Cambios sin guardar"}</span>
            {dirty && (
              <button className="sg-save-btn" onClick={handleSave} disabled={saving}>
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
