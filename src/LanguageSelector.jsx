import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LANGUAGES } from "./i18n";

const CSS_ID = "ls-styles";
const style = `
  .ls-wrap { position: relative; display: inline-flex; align-items: center; }

  /* ── compact trigger (navbar) ── */
  .ls-trigger {
    display: inline-flex !important; align-items: center; gap: 6px;
    background: none; border: 1px solid rgba(201,168,76,0.3);
    color: rgba(245,240,232,0.8); cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 0.72rem;
    letter-spacing: 0.1em; padding: 6px 10px;
    transition: all 0.22s; white-space: nowrap;
    flex-shrink: 0;
  }
  .ls-trigger:hover { border-color: #c9a84c; color: #f5f0e8; background: rgba(201,168,76,0.06); }
  .ls-trigger.active { border-color: #c9a84c; color: #c9a84c; }
  .ls-flag { font-size: 1rem; line-height: 1; }
  .ls-code { font-size: 0.68rem; letter-spacing: 0.12em; text-transform: uppercase; }
  .ls-chevron { font-size: 0.55rem; opacity: 0.6; transition: transform 0.2s; }
  .ls-trigger.active .ls-chevron { transform: rotate(180deg); }

  /* ── dropdown ── */
  .ls-dropdown {
    position: absolute; top: calc(100% + 8px);
    background: #111009; border: 1px solid rgba(201,168,76,0.2);
    min-width: 180px; z-index: 600;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    opacity: 0; visibility: hidden; transform: translateY(-6px);
    transition: opacity 0.18s, visibility 0.18s, transform 0.18s;
  }
  .ls-dropdown.open { opacity: 1; visibility: visible; transform: translateY(0); }
  .ls-dropdown.right { right: 0; left: auto; }
  .ls-dropdown.left  { left: 0; right: auto; }

  .ls-option {
    display: flex; align-items: center; gap: 10px;
    width: 100%; background: none; border: none;
    color: rgba(245,240,232,0.6);
    font-family: 'DM Sans', sans-serif; font-size: 0.82rem;
    padding: 11px 16px; cursor: pointer; text-align: left;
    transition: background 0.15s, color 0.15s;
    border-bottom: 1px solid rgba(201,168,76,0.06);
  }
  .ls-option:last-child { border-bottom: none; }
  .ls-option:hover { background: rgba(201,168,76,0.07); color: #f5f0e8; }
  .ls-option.selected { color: #c9a84c; background: rgba(201,168,76,0.05); }
  .ls-option-flag { font-size: 1.1rem; flex-shrink: 0; }
  .ls-option-name { flex: 1; }
  .ls-option-check { color: #c9a84c; font-size: 0.7rem; }

  /* ── full selector (Settings) ── */
  .ls-full { display: flex; flex-direction: column; gap: 6px; }
  .ls-full-label {
    font-size: 0.67rem; letter-spacing: 0.2em; text-transform: uppercase;
    color: rgba(245,240,232,0.38);
  }
  .ls-full-select {
    width: 100%;
    background: rgba(245,240,232,0.04);
    border: 1px solid rgba(201,168,76,0.18); color: #f5f0e8;
    padding: 12px 14px; font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem; font-weight: 300; outline: none;
    cursor: pointer; transition: border-color 0.3s;
  }
  .ls-full-select:focus { border-color: #c9a84c; }
  .ls-full-select option { background: #111009; }
`;

function injectStyles() {
  if (!document.getElementById(CSS_ID)) {
    const el = document.createElement("style");
    el.id = CSS_ID;
    el.textContent = style;
    document.head.appendChild(el);
  }
}

/* ── Compact navbar variant ── */
export function LangButton({ align = "right" }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = LANGUAGES.find(l => l.code === i18n.resolvedLanguage) || LANGUAGES[0];

  useEffect(() => {
    injectStyles();
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const choose = (code) => {
    i18n.changeLanguage(code);
    const lang = LANGUAGES.find(l => l.code === code);
    document.documentElement.dir = lang?.dir || "ltr";
    document.documentElement.lang = code;
    setOpen(false);
  };

  return (
    <div className="ls-wrap" ref={ref}>
      <button
        className={`ls-trigger${open ? " active" : ""}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Select language"
      >
        <span className="ls-flag">🌐</span>
        <span className="ls-code">{current.code.toUpperCase()}</span>
        <span className="ls-chevron">▼</span>
      </button>
      <div className={`ls-dropdown ${align} ${open ? "open" : ""}`}>
        {LANGUAGES.map(lang => (
          <button
            key={lang.code}
            className={`ls-option${lang.code === i18n.resolvedLanguage ? " selected" : ""}`}
            onClick={() => choose(lang.code)}
          >
            <span className="ls-option-flag">{lang.flag}</span>
            <span className="ls-option-name">{lang.name}</span>
            {lang.code === i18n.resolvedLanguage && <span className="ls-option-check">✦</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Full Settings variant ── */
export function LangSelect() {
  const { i18n, t } = useTranslation();

  useEffect(() => { injectStyles(); }, []);

  const choose = (code) => {
    i18n.changeLanguage(code);
    const lang = LANGUAGES.find(l => l.code === code);
    document.documentElement.dir = lang?.dir || "ltr";
    document.documentElement.lang = code;
  };

  return (
    <div className="ls-full">
      <label className="ls-full-label">{t("settings.language")}</label>
      <select
        className="ls-full-select"
        value={i18n.resolvedLanguage}
        onChange={e => choose(e.target.value)}
      >
        {LANGUAGES.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}
