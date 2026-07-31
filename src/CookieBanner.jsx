import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { initAnalytics } from "./analytics";

const STORAGE_KEY = "cookie_consent";

export default function CookieBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  if (!visible) return null;

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    initAnalytics();
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem(STORAGE_KEY, "rejected");
    setVisible(false);
  };

  return (
    <>
      <style>{`
        .cb-bar {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 9999;
          background: #1a1810;
          border-top: 1px solid rgba(201,168,76,0.25);
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          color: rgba(245,240,232,0.75);
          backdrop-filter: blur(8px);
        }
        .cb-text { flex: 1; min-width: 220px; line-height: 1.45; }
        .cb-actions { display: flex; gap: 10px; flex-shrink: 0; }
        .cb-btn {
          padding: 7px 18px;
          border-radius: 6px;
          font-size: 0.82rem;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          border: 1px solid rgba(201,168,76,0.4);
          transition: background 0.15s, color 0.15s;
          white-space: nowrap;
        }
        .cb-btn-accept {
          background: rgba(201,168,76,0.15);
          color: #c9a84c;
        }
        .cb-btn-accept:hover { background: rgba(201,168,76,0.28); }
        .cb-btn-reject {
          background: transparent;
          color: rgba(245,240,232,0.45);
          border-color: rgba(245,240,232,0.15);
        }
        .cb-btn-reject:hover { color: rgba(245,240,232,0.7); border-color: rgba(245,240,232,0.3); }
        @media(max-width:500px){
          .cb-bar { flex-direction: column; align-items: flex-start; }
          .cb-actions { width: 100%; justify-content: flex-end; }
        }
      `}</style>
      <div className="cb-bar" role="dialog" aria-live="polite">
        <span className="cb-text">{t("cookieBanner.text")}</span>
        <div className="cb-actions">
          <button className="cb-btn cb-btn-reject" onClick={reject}>{t("cookieBanner.reject")}</button>
          <button className="cb-btn cb-btn-accept" onClick={accept}>{t("cookieBanner.accept")}</button>
        </div>
      </div>
    </>
  );
}
