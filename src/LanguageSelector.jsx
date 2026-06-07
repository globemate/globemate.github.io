import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { LANGUAGES } from "./i18n";

const CSS_ID = "ls-styles";
const style = `
  /* ── dropdown portal (rendered in body, not inside nav) ── */
  .ls-portal-dropdown {
    position: fixed;
    background: #111009;
    border: 1px solid rgba(201,168,76,0.25);
    min-width: 180px;
    z-index: 9999;
    box-shadow: 0 8px 32px rgba(0,0,0,0.7);
    opacity: 0; visibility: hidden; transform: translateY(-6px);
    transition: opacity 0.18s, visibility 0.18s, transform 0.18s;
    pointer-events: none;
  }
  .ls-portal-dropdown.open {
    opacity: 1; visibility: visible; transform: translateY(0);
    pointer-events: auto;
  }

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

const TRIGGER_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  background: "none",
  border: "1px solid rgba(201,168,76,0.35)",
  color: "rgba(245,240,232,0.85)",
  cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: "0.72rem",
  letterSpacing: "0.1em",
  padding: "6px 10px",
  whiteSpace: "nowrap",
  flexShrink: 0,
  transition: "border-color 0.22s, color 0.22s",
};

const WRAP_STYLE = {
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  flexShrink: 0,
};

/* ── Compact navbar variant ── */
export function LangButton({ align = "right" }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const dropRef    = useRef(null);
  const current = LANGUAGES.find(l => l.code === i18n.resolvedLanguage) || LANGUAGES[0];

  useEffect(() => { injectStyles(); }, []);

  // Position the portal dropdown below the trigger button
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropWidth = 180;
    let left = align === "right"
      ? rect.right - dropWidth       // right-align: dropdown right = trigger right
      : rect.left;                   // left-align:  dropdown left  = trigger left
    // clamp to viewport
    left = Math.max(8, Math.min(left, window.innerWidth - dropWidth - 8));
    setDropPos({ top: rect.bottom + 6, left });
  }, [open, align]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropRef.current    && !dropRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const choose = (code) => {
    i18n.changeLanguage(code);
    const lang = LANGUAGES.find(l => l.code === code);
    document.documentElement.dir  = lang?.dir || "ltr";
    document.documentElement.lang = code;
    setOpen(false);
  };

  return (
    <div style={WRAP_STYLE}>
      <button
        ref={triggerRef}
        style={open
          ? { ...TRIGGER_STYLE, borderColor: "#c9a84c", color: "#c9a84c" }
          : TRIGGER_STYLE
        }
        onClick={() => setOpen(o => !o)}
        aria-label="Select language"
        aria-expanded={open}
      >
        <span style={{ fontSize: "1rem", lineHeight: 1 }}>🌐</span>
        <span style={{ fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          {current.code.toUpperCase()}
        </span>
        <span style={{ fontSize: "0.55rem", opacity: 0.6, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
      </button>

      {/* Portal: renders directly in <body>, outside any stacking context */}
      {createPortal(
        <div
          ref={dropRef}
          className={`ls-portal-dropdown${open ? " open" : ""}`}
          style={{ top: dropPos.top, left: dropPos.left }}
        >
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
        </div>,
        document.body
      )}
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
    document.documentElement.dir  = lang?.dir || "ltr";
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
