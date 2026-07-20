import { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import {
  updatePassword, verifyBeforeUpdateEmail,
  reauthenticateWithCredential, reauthenticateWithPopup,
  EmailAuthProvider, GoogleAuthProvider, deleteUser,
} from "firebase/auth";
import { useTranslation } from "react-i18next";
import { LangButton, LangSelect } from "./LanguageSelector";
import { COUNTRY_NAMES } from "./countryData";

const TABS_KEYS = ["account", "notifications", "privacy", "advanced"];

const DEF = {
  phone: "",
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

function CountryPicker({ selected, onChange }) {
  const [search, setSearch] = useState("");
  const suggestions = search.trim().length > 0
    ? COUNTRY_NAMES.filter(c =>
        c.toLowerCase().includes(search.toLowerCase()) && !selected.includes(c)
      ).slice(0, 8)
    : [];
  const add    = (c) => { onChange([...selected, c]); setSearch(""); };
  const remove = (c) => onChange(selected.filter(x => x !== c));
  return (
    <div className="sg-cpicker">
      {selected.length > 0 && (
        <div className="sg-cpicker-chips">
          {selected.map(c => (
            <span key={c} className="sg-cpicker-chip">
              {c}
              <button type="button" onClick={() => remove(c)}>×</button>
            </span>
          ))}
        </div>
      )}
      <div className="sg-cpicker-wrap">
        <input
          className="sg-inp"
          placeholder="Buscar país…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onBlur={() => setTimeout(() => setSearch(""), 160)}
        />
        {suggestions.length > 0 && (
          <div className="sg-cpicker-drop">
            {suggestions.map(c => (
              <button key={c} type="button" className="sg-cpicker-opt" onMouseDown={() => add(c)}>{c}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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
  .lang-btn { display:inline-flex !important; align-items:center; gap:6px; background:none; border:1px solid rgba(201,168,76,0.35); color:#e8c97a; cursor:pointer; font-family:inherit; font-size:0.72rem; letter-spacing:0.1em; padding:6px 10px; white-space:nowrap; flex-shrink:0; line-height:1; outline:none; transition:border-color 0.22s,color 0.22s; }
  .lang-btn:hover { border-color:#c9a84c; color:#c9a84c; }
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

  /* country picker */
  .sg-cpicker { display:flex; flex-direction:column; gap:10px; margin-top:10px; padding-left:26px; }
  .sg-cpicker-chips { display:flex; flex-wrap:wrap; gap:6px; }
  .sg-cpicker-chip { background:rgba(201,168,76,0.1); border:1px solid rgba(201,168,76,0.28); color:var(--gold-light); padding:4px 6px 4px 10px; font-size:0.78rem; font-family:var(--sans); display:inline-flex; align-items:center; gap:6px; }
  .sg-cpicker-chip button { background:none; border:none; color:rgba(201,168,76,0.5); cursor:pointer; font-size:1rem; line-height:1; padding:0 2px; transition:color 0.15s; }
  .sg-cpicker-chip button:hover { color:var(--gold-light); }
  .sg-cpicker-wrap { position:relative; }
  .sg-cpicker-drop { position:absolute; top:100%; left:0; right:0; z-index:100; background:rgba(14,13,9,0.98); border:1px solid rgba(201,168,76,0.2); border-top:none; max-height:200px; overflow-y:auto; box-shadow:0 8px 24px rgba(0,0,0,0.5); }
  .sg-cpicker-opt { width:100%; background:none; border:none; border-bottom:1px solid rgba(201,168,76,0.06); color:rgba(245,240,232,0.75); padding:9px 14px; text-align:left; font-family:var(--sans); font-size:0.82rem; cursor:pointer; transition:background 0.12s; }
  .sg-cpicker-opt:hover { background:rgba(201,168,76,0.09); color:var(--cream); }

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
  const { t } = useTranslation();
  const [tab, setTab]           = useState("account");
  const [menuOpen, setMenuOpen] = useState(false);
  const [settings, setSettings]                   = useState(DEF);
  const [visibilityMode, setVisibilityMode]       = useState("all");
  const [visibilityCountries, setVisibilityCountries] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [dirty, setDirty]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saveMsg, setSaveMsg]   = useState({ text:"", type:"" });

  const [newEmail, setNewEmail]   = useState("");
  const [emailPwd, setEmailPwd]   = useState("");
  const [emailMsg, setEmailMsg]   = useState({ text:"", type:"" });
  const [emailBusy, setEmailBusy] = useState(false);
  const [curPwd, setCurPwd]     = useState("");
  const [newPwd, setNewPwd]     = useState("");
  const [cfmPwd, setCfmPwd]     = useState("");
  const [pwdMsg, setPwdMsg]     = useState({ text:"", type:"" });
  const [pwdBusy, setPwdBusy]   = useState(false);
  const [showDel, setShowDel]   = useState(false);
  const [delText, setDelText]   = useState("");
  const [delPwd, setDelPwd]     = useState("");
  const [delBusy, setDelBusy]   = useState(false);
  const [delErr, setDelErr]     = useState("");

  const isEmailUser = user.providerData.some(p => p.providerId === "password");

  const TAB_LABELS = {
    account:       t("settings.account"),
    notifications: t("settings.notifications"),
    privacy:       t("settings.privacy"),
    advanced:      t("settings.advanced"),
  };

  useEffect(() => {
    getDoc(doc(db, "users", user.uid)).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.settings) {
          const s = data.settings;
          setSettings({
            ...DEF, ...s,
            notif:   { ...DEF.notif,   ...(s.notif   || {}) },
            privacy: { ...DEF.privacy, ...(s.privacy  || {}) },
          });
        }
        setVisibilityMode(data.visibilityMode || "all");
        setVisibilityCountries(data.visibilityCountries || []);
      }
    }).finally(() => setLoading(false));
  }, [user]);

  const updNotif   = (k, v) => { setSettings(s => ({ ...s, notif:   { ...s.notif,   [k]: v } })); setDirty(true); setSaveMsg({ text:"", type:"" }); };
  const updPrivacy = (k, v) => { setSettings(s => ({ ...s, privacy: { ...s.privacy, [k]: v } })); setDirty(true); setSaveMsg({ text:"", type:"" }); };
  const updField   = (k, v) => { setSettings(s => ({ ...s, [k]: v }));                            setDirty(true); setSaveMsg({ text:"", type:"" }); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "users", user.uid), { settings, visibilityMode, visibilityCountries }, { merge: true });
      setDirty(false);
      setSaveMsg({ text: t("settings.savedChanges"), type:"ok" });
      setTimeout(() => setSaveMsg({ text:"", type:"" }), 3000);
    } catch {
      setSaveMsg({ text: t("settings.errorSaving"), type:"err" });
    }
    setSaving(false);
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || !emailPwd) return;
    setEmailBusy(true); setEmailMsg({ text:"", type:"" });
    try {
      const currentUser = auth.currentUser;
      const cred = EmailAuthProvider.credential(currentUser.email, emailPwd);
      await reauthenticateWithCredential(currentUser, cred);
      await verifyBeforeUpdateEmail(currentUser, newEmail);
      setEmailMsg({ text: "Te enviamos un enlace de verificación al nuevo correo. Confírmalo para aplicar el cambio.", type:"ok" });
      setNewEmail(""); setEmailPwd("");
    } catch (e) {
      console.error("[Settings] handleUpdateEmail:", e.code, e.message);
      const msg = e.code === "auth/wrong-password" || e.code === "auth/invalid-credential"
                    ? "Contraseña actual incorrecta."
                : e.code === "auth/email-already-in-use"
                    ? "Ese email ya está en uso por otra cuenta."
                : e.code === "auth/invalid-email"
                    ? "El formato del email no es válido."
                : "Error al cambiar el email. Inténtalo de nuevo.";
      setEmailMsg({ text: msg, type:"err" });
    }
    setEmailBusy(false);
  };

  const handleUpdatePassword = async () => {
    if (!curPwd || !newPwd || !cfmPwd) { setPwdMsg({ text:"Rellena todos los campos.", type:"err" }); return; }
    if (newPwd !== cfmPwd)             { setPwdMsg({ text:"Las contraseñas nuevas no coinciden.", type:"err" }); return; }
    if (newPwd.length < 6)             { setPwdMsg({ text:"La nueva contraseña debe tener al menos 6 caracteres.", type:"err" }); return; }
    setPwdBusy(true); setPwdMsg({ text:"", type:"" });
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No hay sesión activa.");
      console.log("[Settings] reautenticando con email:", currentUser.email);
      const cred = EmailAuthProvider.credential(currentUser.email, curPwd);
      await reauthenticateWithCredential(currentUser, cred);
      console.log("[Settings] reauth OK, actualizando contraseña…");
      await updatePassword(currentUser, newPwd);
      console.log("[Settings] updatePassword OK");
      setPwdMsg({ text:"Contraseña actualizada correctamente. Cierra sesión y vuelve a entrar para confirmar.", type:"ok" });
      setCurPwd(""); setNewPwd(""); setCfmPwd("");
    } catch (e) {
      console.error("[Settings] handleUpdatePassword:", e.code, e.message);
      const msg = e.code === "auth/wrong-password" || e.code === "auth/invalid-credential"
                    ? "Contraseña actual incorrecta."
                : e.code === "auth/weak-password"
                    ? "La nueva contraseña es demasiado débil (mínimo 6 caracteres)."
                : e.code === "auth/requires-recent-login"
                    ? "Por seguridad, cierra sesión, vuelve a entrar e inténtalo de nuevo."
                : `Error al actualizar: ${e.message}`;
      setPwdMsg({ text: msg, type:"err" });
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
    const uid = user.uid;
    try {
      // 1. Reautenticar con auth.currentUser (no el prop React)
      const currentUser = auth.currentUser;
      if (isEmailUser) {
        if (!delPwd) { setDelErr("Introduce tu contraseña para confirmar."); setDelBusy(false); return; }
        const cred = EmailAuthProvider.credential(currentUser.email, delPwd);
        await reauthenticateWithCredential(currentUser, cred);
      } else {
        const pid = currentUser.providerData[0]?.providerId;
        const provider = pid === "google.com" ? new GoogleAuthProvider() : null;
        if (!provider) { setDelErr("No se pudo identificar tu proveedor. Cierra sesión, vuelve a entrar e inténtalo."); setDelBusy(false); return; }
        await reauthenticateWithPopup(currentUser, provider);
      }

      // 2. Recopilar todos los refs a borrar.
      //    Orden: messages → conversaciones → resto → users/{uid}
      //    (mensajes antes que su padre para que la regla get() los encuentre
      //    aunque se dividan en lotes distintos)
      const msgRefs  = [];
      const convRefs = [];
      const otherRefs = [];

      const [likesFrom, likesTo, matchSnap, convSnap, blockSnap] = await Promise.all([
        getDocs(query(collection(db, "likes"),         where("fromUid",      "==",             uid))),
        getDocs(query(collection(db, "likes"),         where("toUid",        "==",             uid))),
        getDocs(query(collection(db, "matches"),       where("users",        "array-contains", uid))),
        getDocs(query(collection(db, "conversations"), where("participants", "array-contains", uid))),
        getDocs(query(collection(db, "blocks"),        where("blockerId",    "==",             uid))),
      ]);

      // mensajes de cada conversación (subcolección)
      await Promise.all(convSnap.docs.map(async convDoc => {
        const msgs = await getDocs(collection(db, "conversations", convDoc.id, "messages"));
        msgs.forEach(m => msgRefs.push(m.ref));
        convRefs.push(convDoc.ref);
      }));

      likesFrom.forEach(d => otherRefs.push(d.ref));
      likesTo.forEach(d => otherRefs.push(d.ref));
      matchSnap.forEach(d => otherRefs.push(d.ref));
      blockSnap.forEach(d => otherRefs.push(d.ref));

      // Orden final garantiza que messages se borran antes que su conversación
      const allRefs = [
        ...msgRefs,
        ...convRefs,
        ...otherRefs,
        doc(db, "users", uid),
      ];

      // 3. Ejecutar en lotes de 450 (límite Firestore: 500)
      const CHUNK = 450;
      for (let i = 0; i < allRefs.length; i += CHUNK) {
        const batch = writeBatch(db);
        allRefs.slice(i, i + CHUNK).forEach(ref => batch.delete(ref));
        await batch.commit();
      }

      // 4. Borrar usuario de Auth
      await deleteUser(currentUser);

    } catch (e) {
      console.error("[Settings] handleDeleteAccount:", e.code, e.message);
      const msg = e.code === "auth/wrong-password" || e.code === "auth/invalid-credential"
                    ? "Contraseña incorrecta. No se eliminó la cuenta."
                : e.code === "auth/popup-closed-by-user"
                    ? "Cancelaste la autenticación. No se eliminó la cuenta."
                : e.code === "auth/requires-recent-login"
                    ? "Por seguridad, cierra sesión, vuelve a entrar e inténtalo de nuevo."
                : `Error al eliminar la cuenta: ${e.message}`;
      setDelErr(msg);
      setDelBusy(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#0a0905", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", color:"rgba(245,240,232,0.4)", fontSize:"0.85rem", letterSpacing:"0.15em", textTransform:"uppercase" }}>
      {t("common.loading")}
    </div>
  );

  return (
    <>
      <style>{css}</style>

      {showDel && (
        <div className="sg-overlay" onClick={() => { setShowDel(false); setDelText(""); setDelPwd(""); setDelErr(""); }}>
          <div className="sg-modal" onClick={e => e.stopPropagation()}>
            <div className="sg-modal-icon">⚠️</div>
            <div className="sg-modal-title">Eliminar cuenta</div>
            <div className="sg-modal-body">
              Esta acción es <strong>irreversible</strong>. Se borrarán tu perfil, likes, matches y conversaciones.
              Los reportes donde apareces se conservan para el historial de moderación.
            </div>
            <div className="sg-modal-lbl">Escribe <strong>ELIMINAR</strong> para confirmar:</div>
            <input
              className="sg-inp"
              placeholder="ELIMINAR"
              value={delText}
              onChange={e => { setDelText(e.target.value); setDelErr(""); }}
              autoComplete="off"
            />
            {isEmailUser && (
              <>
                <div className="sg-modal-lbl" style={{ marginTop:12 }}>Tu contraseña actual:</div>
                <input
                  className="sg-inp"
                  type="password"
                  placeholder="••••••••"
                  value={delPwd}
                  onChange={e => { setDelPwd(e.target.value); setDelErr(""); }}
                  autoComplete="current-password"
                />
              </>
            )}
            {!isEmailUser && delText === "ELIMINAR" && (
              <div className="sg-modal-lbl" style={{ marginTop:8, color:"rgba(245,240,232,0.45)" }}>
                Se abrirá una ventana para confirmar tu identidad con {user.providerData[0]?.providerId?.replace(".com","") || "tu proveedor"}.
              </div>
            )}
            {delErr && <div className="sg-modal-err">{delErr}</div>}
            <div className="sg-modal-actions">
              <button className="sg-btn-cancel" onClick={() => { setShowDel(false); setDelText(""); setDelPwd(""); setDelErr(""); }}>
                Cancelar
              </button>
              <button
                className="sg-btn-confirm-del"
                onClick={handleDeleteAccount}
                disabled={delText !== "ELIMINAR" || delBusy || (isEmailUser && !delPwd)}
              >
                {delBusy ? "Eliminando…" : "Eliminar definitivamente"}
              </button>
            </div>
          </div>
        </div>
      )}

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
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onNotif?.(); }}>
          {t("nav.notifications")}{notifCount > 0 ? ` (${notifCount})` : ""}
        </button>
        <button className="mob-nav-link gold" onClick={() => { setMenuOpen(false); onPricing?.(); }}>{t("nav.plans")}</button>
        <div className="mob-nav-divider" />
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onSignOut(); }}>{t("nav.signOut")}</button>
      </div>

      <div className="sg-root">

        <nav className="sg-nav">
          <button className="sg-logo" onClick={onBack}>Globe<span>Mate</span></button>
          <div style={{ display:"flex", gap:4, alignItems:"center" }}>
            <div className="sg-desktop" style={{ display:"flex", alignItems:"center" }}>
              <button className="sg-nav-btn" onClick={onExplore}>{t("nav.explore")}</button>
              <button className="sg-nav-btn" onClick={onMatches}>{t("nav.matches")}</button>
              <button className="sg-nav-btn" onClick={onChat}>{t("nav.messages")}</button>
              <button className="sg-nav-btn" onClick={onProfile}>{t("nav.profile")}</button>
              <button className="sg-nav-btn" style={{color:"#c9a84c"}} onClick={onPricing}>{t("nav.plans")}</button>
            </div>
            <LangButton align="right" />
            <button className="sg-hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <span /><span /><span />
            </button>
          </div>
        </nav>

        <div className="sg-header">
          <div className="sg-eyebrow">{t("settings.title")}</div>
          <h1 className="sg-h1"><em>{t("settings.title")}</em></h1>
        </div>

        <div className="sg-tabs">
          {TABS_KEYS.map(key => (
            <button key={key} className={`sg-tab${tab === key ? " on" : ""}`} onClick={() => setTab(key)}>
              {TAB_LABELS[key]}
            </button>
          ))}
        </div>

        <div className="sg-content">

          {/* ─── ACCOUNT ─────────────────────────── */}
          {tab === "account" && (<>

            {/* Email actual (siempre visible) */}
            <div className="sg-section">
              <div className="sg-sec-title">Correo electrónico</div>
              <div className="sg-field">
                <div className="sg-lbl">Correo actual</div>
                <div className="sg-cur-val">{user.email}</div>
              </div>
              {isEmailUser && (
                <div className="sg-field">
                  <div className="sg-lbl">Nuevo correo</div>
                  <input className="sg-inp" type="email" placeholder="nuevo@correo.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                  <div className="sg-lbl" style={{ marginTop:6 }}>Contraseña actual (para confirmar)</div>
                  <input className="sg-inp" type="password" placeholder="••••••••" value={emailPwd} onChange={e => setEmailPwd(e.target.value)} />
                  {emailMsg.text && <div className={`sg-note ${emailMsg.type}`}>{emailMsg.text}</div>}
                  <button className="sg-field-btn" onClick={handleUpdateEmail} disabled={emailBusy || !newEmail || !emailPwd}>
                    {emailBusy ? "Enviando…" : "Cambiar email"}
                  </button>
                </div>
              )}
            </div>

            {/* Contraseña — solo usuarios email/contraseña */}
            {isEmailUser && (
              <div className="sg-section">
                <div className="sg-sec-title">Contraseña</div>
                <div className="sg-field">
                  <div className="sg-lbl">Contraseña actual</div>
                  <input className="sg-inp" type="password" placeholder="••••••••" value={curPwd} onChange={e => setCurPwd(e.target.value)} />
                  <div className="sg-lbl" style={{ marginTop:6 }}>Nueva contraseña</div>
                  <input className="sg-inp" type="password" placeholder="Mínimo 6 caracteres" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
                  <div className="sg-lbl" style={{ marginTop:6 }}>Confirmar nueva contraseña</div>
                  <input className="sg-inp" type="password" placeholder="••••••••" value={cfmPwd} onChange={e => setCfmPwd(e.target.value)} />
                  {pwdMsg.text && <div className={`sg-note ${pwdMsg.type}`}>{pwdMsg.text}</div>}
                  <button className="sg-field-btn" onClick={handleUpdatePassword} disabled={pwdBusy || !curPwd || !newPwd || !cfmPwd}>
                    {pwdBusy ? "Guardando…" : "Cambiar contraseña"}
                  </button>
                </div>
              </div>
            )}

            <div className="sg-section">
              <div className="sg-sec-title">{t("settings.phone")}</div>
              <div className="sg-field">
                <div className="sg-lbl">{t("settings.phone")}</div>
                <input className="sg-inp" type="tel" placeholder="+1 555 000 0000" value={settings.phone} onChange={e => updField("phone", e.target.value)} />
              </div>
            </div>

            <div className="sg-section">
              <div className="sg-sec-title">{t("settings.language")}</div>
              <div className="sg-field">
                <div className="sg-lbl">{t("settings.selectLanguage")}</div>
                <LangSelect className="sg-sel" />
              </div>
            </div>

            {/* Cerrar sesión */}
            <div className="sg-section">
              <div className="sg-danger-row">
                <div className="sg-row-info">
                  <div className="sg-row-lbl">Cerrar sesión</div>
                  <div className="sg-row-sub" style={{ marginTop:4 }}>Salir de tu cuenta en este dispositivo.</div>
                </div>
                <button className="sg-btn-pause" onClick={onSignOut}>Cerrar sesión</button>
              </div>
            </div>

          </>)}

          {/* ─── NOTIFICATIONS ─────────────────── */}
          {tab === "notifications" && (
            <div className="sg-section">
              <div className="sg-sec-title">{t("settings.notifications")}</div>
              {[
                { k:"newMatches",         lbl: t("settings.notifNewMatches") },
                { k:"messages",           lbl: t("settings.notifMessages") },
                { k:"profileViews",       lbl: t("settings.notifProfileViews") },
                { k:"connectionRequests", lbl: t("settings.notifConnectionRequests") },
                { k:"destinationAlerts",  lbl: t("settings.notifDestinationAlerts") },
                { k:"promotionalEmails",  lbl: t("settings.notifPromotionalEmails") },
              ].map(({ k, lbl }) => (
                <div key={k} className="sg-row">
                  <div className="sg-row-info">
                    <div className="sg-row-lbl">{lbl}</div>
                  </div>
                  <Toggle on={settings.notif[k]} onChange={v => updNotif(k, v)} />
                </div>
              ))}
            </div>
          )}

          {/* ─── PRIVACY ─────────────────────────── */}
          {tab === "privacy" && (<>
            <div className="sg-section">
              <div className="sg-sec-title">{t("settings.privacyProfileVisibility")}</div>
              <div className="sg-field">
                <div className="sg-radios">
                  {[
                    { v:"all",     l: t("settings.visibilityAll") },
                    { v:"matches", l: t("settings.visibilityMatches") },
                    { v:"hidden",  l: t("settings.visibilityNone") },
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
              {[
                { k:"showLocation",         lbl: t("settings.privacyShowLocation") },
                { k:"showLastSeen",         lbl: t("settings.privacyShowLastSeen") },
                { k:"showVisitedCountries", lbl: t("settings.privacyShowVisitedCountries") },
              ].map(({ k, lbl }) => (
                <div key={k} className="sg-row">
                  <div className="sg-row-info">
                    <div className="sg-row-lbl">{lbl}</div>
                  </div>
                  <Toggle on={settings.privacy[k]} onChange={v => updPrivacy(k, v)} />
                </div>
              ))}
            </div>

            <div className="sg-section">
              <div className="sg-row">
                <div className="sg-row-info">
                  <div className="sg-row-lbl">{t("settings.privacyIncognito")}</div>
                </div>
                <Toggle on={settings.privacy.incognitoMode} onChange={v => updPrivacy("incognitoMode", v)} />
              </div>
            </div>

            <div className="sg-section">
              <div className="sg-sec-title">Visibilidad geográfica</div>
              <div className="sg-field">
                <div className="sg-row-sub" style={{ marginBottom:10 }}>
                  Elige en qué países pueden descubrirte otros viajeros en Explorar y el Mapa.
                </div>
                <div className="sg-radios">
                  {[
                    { v:"all",    l:"🌍 Visible en todo el mundo" },
                    { v:"except", l:"🚫 Visible en todo el mundo excepto en:" },
                    { v:"only",   l:"✅ Visible solo en:" },
                  ].map(({ v, l }) => (
                    <div key={v}>
                      <div
                        className={`sg-radio${visibilityMode === v ? " on" : ""}`}
                        onClick={() => {
                          setVisibilityMode(v);
                          if (v === "all") setVisibilityCountries([]);
                          setDirty(true);
                        }}
                      >
                        <div className="sg-radio-dot" />
                        <span className="sg-radio-lbl">{l}</span>
                      </div>
                      {visibilityMode === v && v !== "all" && (
                        <CountryPicker
                          selected={visibilityCountries}
                          onChange={c => { setVisibilityCountries(c); setDirty(true); }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>)}

          {/* ─── ADVANCED ────────────────────────── */}
          {tab === "advanced" && (<>
            <div className="sg-section">
              <div className="sg-danger-row">
                <div className="sg-row-info">
                  <div className="sg-row-lbl">{t("settings.pauseAccount")}</div>
                  <div className="sg-row-sub" style={{ marginTop:4 }}>{t("settings.pauseAccountDesc")}</div>
                </div>
                <button
                  className={`sg-btn-pause${settings.accountPaused ? " paused" : ""}`}
                  onClick={handlePauseToggle}
                >
                  {t("settings.pauseAccount")}
                </button>
              </div>
            </div>

            <div className="sg-section danger">
              <div className="sg-sec-title danger">{t("settings.deleteAccount")}</div>
              <div className="sg-danger-row">
                <div className="sg-row-info">
                  <div className="sg-row-lbl" style={{ color:"#e07070" }}>{t("settings.deleteAccount")}</div>
                  <div className="sg-row-sub" style={{ marginTop:4 }}>{t("settings.deleteWarning")}</div>
                </div>
                <button className="sg-btn-del" onClick={() => setShowDel(true)}>
                  {t("settings.deleteAccount")}
                </button>
              </div>
            </div>
          </>)}

        </div>

        {(dirty || saveMsg.text) && (
          <div className="sg-save-bar">
            {saveMsg.text && <span className={`sg-save-msg ${saveMsg.type}`}>{saveMsg.text}</span>}
            {dirty && (
              <button className="sg-save-btn" onClick={handleSave} disabled={saving}>
                {saving ? t("settings.saving") : t("settings.saveChanges")}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
