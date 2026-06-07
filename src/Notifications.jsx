import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LangButton } from "./LanguageSelector";

const TABS_KEYS = ["All", "Unread", "Messages", "Connections"];

const TYPE_ICON = { message:"💬", connect:"🤝", nearby:"✈️", view:"👀", system:"🌍" };

function ago(raw) {
  const d = raw?.toDate ? raw.toDate() : new Date(raw);
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60)      return "Just now";
  if (s < 3600)    return `${Math.floor(s/60)}m ago`;
  if (s < 86400)   return `${Math.floor(s/3600)}h ago`;
  if (s < 604800)  return `${Math.floor(s/86400)}d ago`;
  return d.toLocaleDateString([], { month:"short", day:"numeric" });
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
  .nf-mark-btn { background:none; border:none; color:var(--gold); font-family:var(--sans); font-size:0.72rem; letter-spacing:0.12em; text-transform:uppercase; cursor:pointer; padding:0; transition:color 0.2s; }
  .nf-mark-btn:hover { color:var(--gold-light); }
  .nf-mark-btn:disabled { opacity:0.3; cursor:default; }
  .lang-btn { display:inline-flex !important; align-items:center; gap:6px; background:none; border:1px solid rgba(201,168,76,0.35); color:#e8c97a; cursor:pointer; font-family:inherit; font-size:0.72rem; letter-spacing:0.1em; padding:6px 10px; white-space:nowrap; flex-shrink:0; line-height:1; outline:none; transition:border-color 0.22s,color 0.22s; }
  .lang-btn:hover { border-color:#c9a84c; color:#c9a84c; }

  /* page */
  .nf-root { min-height:100vh; background:var(--black); padding-top:58px; }
  .nf-header { padding:40px 40px 0; }
  @media(max-width:600px){ .nf-header{ padding:28px 20px 0; } }
  .nf-eyebrow { font-size:0.67rem; letter-spacing:0.24em; text-transform:uppercase; color:var(--gold); margin-bottom:10px; }
  .nf-h1 { font-family:var(--serif); font-size:clamp(1.9rem,3.5vw,2.8rem); font-weight:300; color:var(--cream); margin-bottom:6px; }
  .nf-h1 em { font-style:italic; color:var(--gold-light); }

  /* tabs */
  .nf-tabs { display:flex; gap:0; padding:24px 40px 0; border-bottom:1px solid rgba(201,168,76,0.1); overflow-x:auto; }
  @media(max-width:600px){ .nf-tabs{ padding:20px 16px 0; } }
  .nf-tab { background:none; border:none; border-bottom:2px solid transparent; color:var(--muted); font-family:var(--sans); font-size:0.78rem; letter-spacing:0.12em; text-transform:uppercase; padding:10px 20px; cursor:pointer; transition:all 0.2s; white-space:nowrap; display:flex; align-items:center; gap:7px; }
  .nf-tab.on { color:var(--gold-light); border-bottom-color:var(--gold); }
  .nf-tab:hover:not(.on) { color:var(--cream-dim); }
  .nf-tab-count { background:rgba(201,168,76,0.2); color:var(--gold); border-radius:20px; padding:1px 7px; font-size:0.64rem; }

  /* list */
  .nf-list { padding:8px 40px 80px; display:flex; flex-direction:column; }
  @media(max-width:600px){ .nf-list{ padding:8px 12px 60px; } }

  /* item */
  .nf-item { display:flex; gap:16px; padding:18px 0; border-bottom:1px solid rgba(201,168,76,0.07); position:relative; transition:background 0.18s; cursor:default; }
  .nf-item:hover { background:rgba(245,240,232,0.02); }
  .nf-item.unread { border-left:2px solid var(--gold); padding-left:16px; margin-left:-18px; }
  @media(max-width:600px){ .nf-item.unread{ margin-left:-14px; padding-left:14px; } }

  .nf-item-icon { width:44px; height:44px; border-radius:50%; border:1.5px solid rgba(201,168,76,0.25); background:rgba(20,18,9,0.9); display:flex; align-items:center; justify-content:center; font-size:1.2rem; flex-shrink:0; margin-top:2px; }
  .nf-item-icon.message  { border-color:rgba(111,168,201,0.35); background:rgba(111,168,201,0.06); }
  .nf-item-icon.connect  { border-color:rgba(111,207,151,0.35); background:rgba(111,207,151,0.06); }
  .nf-item-icon.nearby   { border-color:rgba(201,168,76,0.35); background:rgba(201,168,76,0.06); }
  .nf-item-icon.view     { border-color:rgba(201,140,76,0.35); background:rgba(201,140,76,0.06); }
  .nf-item-icon.system   { border-color:rgba(201,168,76,0.2); background:rgba(201,168,76,0.04); }

  .nf-item-body { flex:1; min-width:0; }
  .nf-item-title { font-size:0.87rem; color:var(--cream); line-height:1.4; margin-bottom:4px; }
  .nf-item.unread .nf-item-title { font-weight:400; }
  .nf-item-text { font-size:0.8rem; color:var(--cream-dim); line-height:1.55; margin-bottom:8px; }
  .nf-item-footer { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
  .nf-item-time { font-size:0.7rem; color:var(--muted); }
  .nf-action-btn { background:none; border:1px solid rgba(201,168,76,0.3); color:var(--gold); font-family:var(--sans); font-size:0.68rem; letter-spacing:0.1em; text-transform:uppercase; padding:4px 12px; cursor:pointer; transition:all 0.2s; }
  .nf-action-btn:hover { background:rgba(201,168,76,0.12); border-color:var(--gold); }

  .nf-unread-dot { width:7px; height:7px; border-radius:50%; background:var(--gold); flex-shrink:0; align-self:center; }

  /* empty */
  .nf-empty { padding:80px 40px; text-align:center; }
  .nf-empty-icon { font-size:2.8rem; opacity:0.3; margin-bottom:16px; }
  .nf-empty-txt { font-family:var(--serif); font-size:1.3rem; font-weight:300; color:var(--cream-dim); margin-bottom:8px; }
  .nf-empty-sub { font-size:0.8rem; color:var(--muted); }

  /* desktop-only nav items */
  @media(max-width:860px){ .nf-desktop{ display:none !important; } }

  /* hamburger */
  .nf-hamburger { display:none; flex-direction:column; gap:5px; background:none; border:none; cursor:pointer; padding:6px; flex-shrink:0; }
  @media(max-width:860px){ .nf-hamburger { display:flex; } }
  .nf-hamburger span { display:block; width:22px; height:1.5px; background:var(--gold); transition:transform 0.3s; }

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
  notifications, onBack, onMarkAllRead, onMarkRead,
  onChat, onProfile, onExplore, onMatches, onMap, onNotif, onSignOut, notifCount, onSettings, onPricing,
}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);

  const TAB_LABELS = {
    All: t("common.all"),
    Unread: t("common.unread"),
    Messages: t("nav.messages"),
    Connections: t("matches.connect"),
  };

  const unreadCount   = notifications.filter(n => !n.read).length;
  const messageCount  = notifications.filter(n => n.type === "message").length;
  const connectCount  = notifications.filter(n => n.type === "connect").length;

  const tabCounts = { Unread: unreadCount, Messages: messageCount, Connections: connectCount };

  const visible = notifications.filter(n => {
    if (tab === "Unread")      return !n.read;
    if (tab === "Messages")    return n.type === "message";
    if (tab === "Connections") return n.type === "connect";
    return true;
  });

  const handleAction = (n) => {
    onMarkRead(n.id);
    if (n.actionType === "chat")    onChat();
    if (n.actionType === "profile") onProfile();
    if (n.actionType === "explore") onExplore();
  };

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
        <div className="mob-nav-divider" />
        <button className="mob-nav-link gold" onClick={() => { setMenuOpen(false); onPricing?.(); }}>{t("nav.plans")}</button>
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onSettings?.(); }}>{t("nav.settings")}</button>
        <div className="mob-nav-divider" />
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onSignOut(); }}>{t("nav.signOut")}</button>
      </div>

      <div className="nf-root">

        <nav className="nf-nav">
          <button className="nf-logo" onClick={onBack}>Globe<span>Mate</span></button>
          <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            <LangButton align="right" />
            <button className="nf-mark-btn nf-desktop" style={{color:"#c9a84c",marginRight:8}} onClick={onPricing}>{t("nav.plans")}</button>
            <button className="nf-mark-btn nf-desktop" onClick={onMarkAllRead} disabled={unreadCount === 0}>
              {t("notifications.markAllRead")}
            </button>
            <button className="nf-hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <span /><span /><span />
            </button>
          </div>
        </nav>

        <div className="nf-header">
          <div className="nf-eyebrow">{t("notifications.title")}</div>
          <h1 className="nf-h1"><em>{t("notifications.title")}</em></h1>
        </div>

        <div className="nf-tabs">
          {TABS_KEYS.map(key => (
            <button key={key} className={`nf-tab${tab === key ? " on" : ""}`} onClick={() => setTab(key)}>
              {TAB_LABELS[key]}
              {tabCounts[key] > 0 && <span className="nf-tab-count">{tabCounts[key]}</span>}
            </button>
          ))}
        </div>

        <div className="nf-list">
          {visible.length === 0 ? (
            <div className="nf-empty">
              <div className="nf-empty-icon">🔔</div>
              <div className="nf-empty-txt">All caught up</div>
              <div className="nf-empty-sub">No {tab === "All" ? "" : tab.toLowerCase() + " "}notifications at the moment.</div>
            </div>
          ) : visible.map(n => (
            <div key={n.id} className={`nf-item${!n.read ? " unread" : ""}`}>
              <div className={`nf-item-icon ${n.type}`}>
                {n.icon || TYPE_ICON[n.type] || "🔔"}
              </div>
              <div className="nf-item-body">
                <div className="nf-item-title">{n.title}</div>
                {n.body && <div className="nf-item-text">{n.body}</div>}
                <div className="nf-item-footer">
                  <span className="nf-item-time">{ago(n.createdAt)}</span>
                  {n.action && (
                    <button className="nf-action-btn" onClick={() => handleAction(n)}>
                      {n.action} →
                    </button>
                  )}
                </div>
              </div>
              {!n.read && <span className="nf-unread-dot" />}
            </div>
          ))}
        </div>

      </div>
    </>
  );
}
