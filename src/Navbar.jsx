import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LangButton } from "./LanguageSelector";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  /* ── Shared Navbar ────────────────────────────────────────────── */
  .gnav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 500;
    height: 60px; display: flex; align-items: center;
    justify-content: space-between; padding: 0 28px;
    background: rgba(10,9,5,0.98); border-bottom: 1px solid rgba(201,168,76,0.15);
    backdrop-filter: blur(10px);
  }
  @media (max-width: 600px) { .gnav { padding: 0 14px; } }

  .gnav-logo {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 1.3rem; font-weight: 300; letter-spacing: 0.12em; color: #e8c97a;
    cursor: pointer; border: none; background: none; padding: 0; flex-shrink: 0;
    transition: opacity 0.2s;
  }
  .gnav-logo:hover { opacity: 0.75; }
  .gnav-logo em { font-style: italic; }

  /* Center tabs — desktop only */
  .gnav-tabs {
    position: absolute; left: 50%; transform: translateX(-50%);
    display: flex; align-items: center; gap: 2px;
  }
  .gnav-tab {
    background: none; border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 0.7rem; font-weight: 400;
    letter-spacing: 0.13em; text-transform: uppercase; white-space: nowrap;
    color: rgba(245,240,232,0.45); padding: 6px 12px;
    position: relative; transition: color 0.18s;
  }
  .gnav-tab:hover { color: rgba(245,240,232,0.85); }
  .gnav-tab.gactive { color: #c9a84c; }
  .gnav-tab.gactive::after {
    content: ''; position: absolute; bottom: 0; left: 12px; right: 12px;
    height: 1.5px; background: #c9a84c;
  }

  /* Right actions */
  .gnav-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .gnav-icon {
    background: none; border: 1px solid rgba(201,168,76,0.25); color: #c9a84c;
    padding: 6px 10px; cursor: pointer; font-size: 0.95rem; line-height: 1;
    display: inline-flex; align-items: center; justify-content: center;
    transition: all 0.2s; flex-shrink: 0; position: relative;
  }
  .gnav-icon:hover { border-color: #c9a84c; background: rgba(201,168,76,0.1); }
  .gnav-badge {
    position: absolute; top: -6px; right: -6px; background: #d32f2f; color: #fff;
    border-radius: 50%; min-width: 17px; height: 17px; display: flex;
    align-items: center; justify-content: center;
    font-size: 0.58rem; font-weight: 700; font-family: 'DM Sans', sans-serif;
    border: 1.5px solid #0a0905; padding: 0 2px; pointer-events: none;
  }
  .gnav-btn {
    border: 1px solid rgba(201,168,76,0.28); color: rgba(245,240,232,0.6);
    background: transparent; padding: 6px 14px;
    font-family: 'DM Sans', sans-serif; font-size: 0.68rem;
    letter-spacing: 0.13em; text-transform: uppercase; cursor: pointer;
    transition: all 0.22s; white-space: nowrap;
  }
  .gnav-btn:hover { border-color: #c9a84c; color: #c9a84c; }
  .gnav-btn.gold { border-color: #c9a84c; color: #c9a84c; }

  .gnav-hamburger {
    display: none; flex-direction: column; gap: 5px;
    background: none; border: none; cursor: pointer; padding: 6px; flex-shrink: 0;
  }
  .gnav-hamburger span { display: block; width: 22px; height: 1.5px; background: #c9a84c; }

  @media (max-width: 860px) {
    .gnav-tabs { display: none; }
    .gnav-hide-mob { display: none !important; }
    .gnav-hamburger { display: flex; }
  }

  /* Mobile overlay */
  .gnav-mob {
    position: fixed; inset: 0; z-index: 600;
    background: rgba(10,9,5,0.98); backdrop-filter: blur(12px);
    display: flex; flex-direction: column; padding: 28px 32px 40px;
    opacity: 0; visibility: hidden; transition: opacity 0.3s, visibility 0.3s;
    overflow-y: auto;
  }
  .gnav-mob.open { opacity: 1; visibility: visible; }
  .gnav-mob-top {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 36px;
  }
  .gnav-mob-logo {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 1.4rem; font-weight: 300; letter-spacing: 0.12em; color: #e8c97a;
  }
  .gnav-mob-logo em { font-style: italic; }
  .gnav-mob-close {
    background: none; border: none; color: rgba(245,240,232,0.6);
    font-size: 1.5rem; cursor: pointer; padding: 4px 8px; line-height: 1;
  }
  .gnav-mob-link {
    background: none; border: none; color: rgba(245,240,232,0.6);
    font-family: 'DM Sans', sans-serif; font-size: 1rem; letter-spacing: 0.12em;
    text-transform: uppercase; text-align: left; padding: 18px 0; cursor: pointer;
    border-bottom: 1px solid rgba(201,168,76,0.08); transition: color 0.2s;
    display: block; width: 100%;
  }
  .gnav-mob-link:hover { color: #f5f0e8; }
  .gnav-mob-link.gold { color: #c9a84c; }
  .gnav-mob-link.gmactive { color: #e8c97a; font-weight: 500; }
  .gnav-mob-divider { height: 1px; background: rgba(201,168,76,0.12); margin: 8px 0; }

  /* ── Hide local duplicate navbars ─────────────────────────────── */
  .ex-nav, .mx-nav, .ch-nav, .sg-nav, .nf-nav, .px-nav { display: none !important; }

  /* ── Offset page roots below shared Navbar (60 px) ────────────── */
  .ex-root  { padding-top: 60px !important; }
  .mx-root  { padding-top: 60px !important; }
  .ch-root  { padding-top: 60px !important; }
  .sg-root  { padding-top: 60px !important; }
  .nf-root  { padding-top: 60px !important; }
  .px-root  { padding-top: 60px !important; }
  .pr-root  { padding-top: 60px !important; }
`;

export default function Navbar({
  user, active, onBack, onHome,
  onExplore, onMatches, onChat, onMap, onProfile,
  onNotif, notifCount, onSettings, onPricing, onSignOut,
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const go = (fn) => { setOpen(false); fn?.(); };

  const TABS = [
    { key: "explore", label: t("nav.explore"),  fn: onExplore },
    { key: "matches", label: t("nav.matches"),  fn: onMatches },
    { key: "chat",    label: t("nav.messages"), fn: onChat    },
    { key: "map",     label: t("nav.map"),      fn: onMap     },
  ];

  return (
    <>
      <style>{css}</style>

      {/* Mobile overlay */}
      <div className={`gnav-mob${open ? " open" : ""}`}>
        <div className="gnav-mob-top">
          <span className="gnav-mob-logo">Globe<em>Mate</em></span>
          <LangButton align="right" />
          <button className="gnav-mob-close" onClick={() => setOpen(false)}>✕</button>
        </div>
        {TABS.map(l => (
          <button
            key={l.key}
            className={`gnav-mob-link gold${active === l.key ? " gmactive" : ""}`}
            onClick={() => go(l.fn)}
          >
            {l.label}
          </button>
        ))}
        <div className="gnav-mob-divider" />
        <button
          className={`gnav-mob-link${active === "profile" ? " gmactive" : ""}`}
          onClick={() => go(onProfile)}
        >
          {t("nav.myProfile")}
        </button>
        <button className="gnav-mob-link" onClick={() => go(onNotif)}>
          {t("nav.notifications")}{notifCount > 0 ? ` (${notifCount})` : ""}
        </button>
        <div className="gnav-mob-divider" />
        <button className="gnav-mob-link gold" onClick={() => go(onPricing)}>{t("nav.plans")}</button>
        <button className="gnav-mob-link" onClick={() => go(onSettings)}>{t("nav.settings")}</button>
        <div className="gnav-mob-divider" />
        <button className="gnav-mob-link" onClick={() => go(onSignOut)}>{t("nav.signOut")}</button>
      </div>

      <nav className="gnav">
        <button className="gnav-logo" onClick={onHome}>Globe<em>Mate</em></button>

        {/* Desktop center tabs */}
        <div className="gnav-tabs">
          {TABS.map(l => (
            <button
              key={l.key}
              className={`gnav-tab${active === l.key ? " gactive" : ""}`}
              onClick={l.fn}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Right actions */}
        <div className="gnav-right">
          <LangButton align="right" />
          <button className="gnav-icon" onClick={onNotif} title={t("nav.notifications")}>
            🔔{notifCount > 0 && <span className="gnav-badge">{notifCount > 9 ? "9+" : notifCount}</span>}
          </button>
          <button className="gnav-icon gnav-hide-mob" onClick={onSettings} title={t("nav.settings")}>⚙</button>
          <button className="gnav-btn gold gnav-hide-mob" onClick={onPricing}>{t("nav.plans")}</button>
          <button
            className={`gnav-btn gnav-hide-mob${active === "profile" ? " gold" : ""}`}
            onClick={onProfile}
          >
            {t("nav.myProfile")}
          </button>
          <button className="gnav-btn gnav-hide-mob" onClick={onSignOut}>{t("nav.signOut")}</button>
          <button className="gnav-hamburger" onClick={() => setOpen(true)} aria-label="Open menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>
    </>
  );
}
