import { useState } from "react";
import { useTranslation } from "react-i18next";
import { db } from "./firebase";
import {
  collection, addDoc, setDoc, doc, updateDoc, arrayUnion, serverTimestamp,
} from "firebase/firestore";

const REASONS = [
  "Perfil falso",
  "Acoso",
  "Contenido inapropiado",
  "Spam",
  "Menor de edad",
  "Otro",
];

const css = `
  .rm-overlay {
    position: fixed; inset: 0; z-index: 1100;
    background: rgba(10,9,5,0.93); backdrop-filter: blur(12px);
    display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .rm-modal {
    background: #141209; border: 1px solid rgba(201,168,76,0.25);
    width: 100%; max-width: 420px; padding: 32px 28px; position: relative;
  }
  .rm-close {
    position: absolute; top: 14px; right: 16px;
    background: none; border: 1px solid rgba(201,168,76,0.2);
    color: rgba(245,240,232,0.5); width: 30px; height: 30px;
    cursor: pointer; font-size: 0.9rem;
    display: flex; align-items: center; justify-content: center; transition: all 0.2s;
  }
  .rm-close:hover { border-color: #c9a84c; color: #c9a84c; }
  .rm-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 1.3rem; font-weight: 300; color: #f5f0e8; margin-bottom: 6px;
  }
  .rm-sub {
    font-size: 0.78rem; color: rgba(245,240,232,0.45);
    margin-bottom: 24px; line-height: 1.6;
  }
  .rm-label {
    font-size: 0.62rem; letter-spacing: 0.18em; text-transform: uppercase;
    color: #c9a84c; margin-bottom: 10px; display: block;
  }
  .rm-reasons { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
  .rm-reason {
    display: flex; align-items: center; gap: 10px; padding: 10px 14px;
    cursor: pointer; border: 1px solid rgba(201,168,76,0.15);
    background: transparent; color: rgba(245,240,232,0.65);
    font-family: 'DM Sans', sans-serif; font-size: 0.82rem;
    text-align: left; transition: all 0.18s; width: 100%;
  }
  .rm-reason:hover { border-color: rgba(201,168,76,0.4); color: #f5f0e8; }
  .rm-reason.rm-sel { border-color: #c9a84c; background: rgba(201,168,76,0.1); color: #f5f0e8; }
  .rm-dot {
    width: 14px; height: 14px; border-radius: 50%;
    border: 1.5px solid rgba(201,168,76,0.4); flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; transition: all 0.18s;
  }
  .rm-reason.rm-sel .rm-dot { background: #c9a84c; border-color: #c9a84c; }
  .rm-dot-inner { width: 6px; height: 6px; border-radius: 50%; background: #0a0905; }
  .rm-textarea {
    width: 100%; background: rgba(245,240,232,0.04);
    border: 1px solid rgba(201,168,76,0.18); color: #f5f0e8;
    padding: 10px 14px; font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem; font-weight: 300; outline: none; resize: none;
    line-height: 1.5; transition: border-color 0.22s; margin-bottom: 20px; display: block;
  }
  .rm-textarea:focus { border-color: #c9a84c; }
  .rm-textarea::placeholder { color: rgba(245,240,232,0.3); }
  .rm-actions { display: flex; gap: 10px; }
  .rm-cancel {
    flex: 1; padding: 11px 0; background: transparent;
    border: 1px solid rgba(245,240,232,0.15); color: rgba(245,240,232,0.5);
    font-family: 'DM Sans', sans-serif; font-size: 0.72rem;
    letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; transition: all 0.2s;
  }
  .rm-cancel:hover { border-color: rgba(245,240,232,0.35); color: rgba(245,240,232,0.8); }
  .rm-submit {
    flex: 2; padding: 11px 0;
    background: rgba(201,112,106,0.12); border: 1px solid rgba(201,112,106,0.38);
    color: #e07070; font-family: 'DM Sans', sans-serif; font-size: 0.72rem;
    letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; transition: all 0.2s;
  }
  .rm-submit:hover:not(:disabled) { background: rgba(201,112,106,0.26); }
  .rm-submit:disabled { opacity: 0.4; cursor: not-allowed; }
  .rm-success { text-align: center; padding: 20px 0; }
  .rm-success-icon { font-size: 2.2rem; margin-bottom: 12px; color: #6dbf67; }
  .rm-success-text { font-size: 0.85rem; color: rgba(245,240,232,0.65); line-height: 1.7; }
`;

export default function ReportModal({ reportedUid, currentUser, onClose, onBlockDone }) {
  const { t } = useTranslation();
  const [reason, setReason]       = useState("");
  const [details, setDetails]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]           = useState(false);

  const handleSubmit = async () => {
    if (!reason || !currentUser?.uid) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "reports"), {
        reporterId: currentUser.uid,
        reportedId: reportedUid,
        reason,
        details: details.trim(),
        createdAt: serverTimestamp(),
        status: "pending",
      });

      const blockerId = currentUser.uid;
      const blockedId = reportedUid;
      await setDoc(doc(db, "blocks", `${blockerId}_${blockedId}`), {
        blockerId, blockedId, createdAt: serverTimestamp(),
      });

      const [uidA, uidB] = [blockerId, blockedId].sort();
      try {
        await updateDoc(doc(db, "conversations", `${uidA}_${uidB}`), {
          hiddenFor: arrayUnion(blockerId, blockedId),
        });
      } catch { /* conversation may not exist */ }

      setDone(true);
      onBlockDone?.();
    } catch (err) {
      console.error("Report error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="rm-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="rm-modal">
          <button className="rm-close" onClick={onClose}>✕</button>

          {done ? (
            <div className="rm-success">
              <div className="rm-success-icon">✓</div>
              <div className="rm-success-text">{t("report.successText")}</div>
            </div>
          ) : (
            <>
              <div className="rm-title">{t("report.title")}</div>
              <div className="rm-sub">{t("report.sub")}</div>

              <span className="rm-label">{t("report.reasonLabel")}</span>
              <div className="rm-reasons">
                {REASONS.map(r => (
                  <button
                    key={r}
                    className={`rm-reason${reason === r ? " rm-sel" : ""}`}
                    onClick={() => setReason(r)}
                  >
                    <div className="rm-dot">
                      {reason === r && <div className="rm-dot-inner" />}
                    </div>
                    {r}
                  </button>
                ))}
              </div>

              <span className="rm-label">{t("report.detailsLabel")}</span>
              <textarea
                className="rm-textarea"
                rows={3}
                placeholder={t("report.detailsPlaceholder")}
                value={details}
                onChange={e => setDetails(e.target.value)}
              />

              <div className="rm-actions">
                <button className="rm-cancel" onClick={onClose}>{t("common.cancel")}</button>
                <button
                  className="rm-submit"
                  onClick={handleSubmit}
                  disabled={!reason || submitting}
                >
                  {submitting ? t("auth.sending") : t("report.submit")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
