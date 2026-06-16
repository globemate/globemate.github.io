import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collectionGroup, onSnapshot, query } from "firebase/firestore";

// ── ADMIN CONFIG ──────────────────────────────────────────────────────────────
// Pon aquí tu email de Firebase Auth (el mismo con el que inicias sesión):
export const ADMIN_EMAIL = "iamrosa.soto18@gmail.com";
// ─────────────────────────────────────────────────────────────────────────────
// NOTA: Para que la consulta funcione, agrega esta regla en Firestore Rules:
//
//   match /{path=**}/subscriptions/{subId} {
//     allow read: if request.auth != null
//                 && request.auth.token.email == "danielaj1446@gmail.com";
//   }
// ─────────────────────────────────────────────────────────────────────────────

const PRICE_MAP = {
  "price_1TeHGSQvs8aipB6ZWZ3rlBEE": { label: "Premium", price: 9.99 },
  "price_1TeHHmQvs8aipB6ZW7edIWGw": { label: "Elite",   price: 19.99 },
};

const MONTHS_ES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function getPlan(sub) {
  const priceId = sub.price?.id || sub.items?.[0]?.price?.id || "";
  return PRICE_MAP[priceId] || null;
}

function toDate(ts) {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  if (typeof ts === "number") return new Date(ts * 1000);
  return new Date(ts);
}

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
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

  /* ── root ── */
  .adm-root { min-height:100vh; background:var(--black); color:var(--cream); font-family:var(--sans); font-weight:300; }

  /* ── nav ── */
  .adm-nav {
    position:sticky; top:0; z-index:100;
    display:flex; align-items:center; justify-content:space-between;
    padding:0 40px; height:58px;
    background:rgba(10,9,5,0.98); border-bottom:1px solid rgba(201,168,76,0.12);
  }
  @media(max-width:600px){ .adm-nav{ padding:0 16px; } }
  .adm-nav-left { display:flex; align-items:center; gap:12px; }
  .adm-logo { font-family:var(--serif); font-size:1.3rem; font-weight:300; letter-spacing:0.12em; color:var(--gold-light); }
  .adm-logo span { font-style:italic; }
  .adm-badge {
    background:rgba(201,168,76,0.1); border:1px solid rgba(201,168,76,0.28);
    color:var(--gold); font-size:0.58rem; letter-spacing:0.2em; text-transform:uppercase;
    padding:3px 8px; line-height:1.6;
  }
  .adm-back {
    background:none; border:none; color:var(--cream-dim); font-family:var(--sans);
    font-size:0.72rem; letter-spacing:0.1em; text-transform:uppercase;
    cursor:pointer; padding:6px 0; transition:color 0.2s;
  }
  .adm-back:hover { color:var(--gold); }

  /* ── body ── */
  .adm-body { padding:48px 40px; max-width:1100px; margin:0 auto; }
  @media(max-width:600px){ .adm-body{ padding:28px 16px; } }

  .adm-title {
    font-family:var(--serif); font-size:clamp(1.8rem,4vw,2.5rem);
    font-weight:300; letter-spacing:0.06em; color:var(--gold-light); margin-bottom:6px;
  }
  .adm-subtitle {
    font-size:0.72rem; letter-spacing:0.14em; text-transform:uppercase;
    color:var(--muted); margin-bottom:44px;
  }

  /* ── stat cards ── */
  .adm-cards {
    display:grid;
    grid-template-columns:repeat(auto-fit,minmax(150px,1fr));
    gap:14px; margin-bottom:44px;
  }
  .adm-card {
    background:var(--card); border:1px solid rgba(201,168,76,0.1);
    padding:22px 18px;
  }
  .adm-card.hl { border-color:rgba(201,168,76,0.32); background:rgba(201,168,76,0.05); }
  .adm-card-label { font-size:0.62rem; letter-spacing:0.16em; text-transform:uppercase; color:var(--muted); margin-bottom:10px; }
  .adm-card-value { font-family:var(--serif); font-size:2.5rem; font-weight:300; color:var(--gold-light); line-height:1; }
  .adm-card-sub   { font-size:0.67rem; color:var(--muted); margin-top:7px; }

  /* ── divider ── */
  .adm-divider { height:1px; background:rgba(201,168,76,0.1); margin:36px 0; }

  /* ── section title ── */
  .adm-sec { font-family:var(--serif); font-size:1.35rem; font-weight:300; letter-spacing:0.08em; color:var(--cream); margin-bottom:20px; }

  /* ── bar chart ── */
  .adm-chart { background:var(--card); border:1px solid rgba(201,168,76,0.1); padding:28px 24px 20px; }
  .adm-bars  { display:flex; align-items:flex-end; gap:10px; height:140px; }
  .adm-bar-col { flex:1; display:flex; flex-direction:column; align-items:center; }
  .adm-bar-wrap { width:100%; display:flex; align-items:flex-end; justify-content:center; height:120px; }
  .adm-bar {
    width:100%; background:rgba(201,168,76,0.18); border:1px solid rgba(201,168,76,0.28);
    transition:all 0.4s ease; cursor:default; position:relative; min-height:4px;
  }
  .adm-bar:hover { background:rgba(201,168,76,0.38); }
  .adm-bar-n { position:absolute; top:-20px; left:50%; transform:translateX(-50%); font-size:0.68rem; color:var(--gold); white-space:nowrap; }
  .adm-bar-label { font-size:0.6rem; letter-spacing:0.08em; text-transform:uppercase; color:var(--muted); margin-top:10px; text-align:center; }

  /* ── table ── */
  .adm-table-wrap { overflow-x:auto; }
  .adm-tbl { width:100%; border-collapse:collapse; font-size:0.79rem; }
  .adm-tbl th {
    text-align:left; font-size:0.6rem; letter-spacing:0.14em; text-transform:uppercase;
    color:var(--muted); padding:10px 14px; border-bottom:1px solid rgba(201,168,76,0.12); font-weight:400;
  }
  .adm-tbl td { padding:13px 14px; border-bottom:1px solid rgba(201,168,76,0.06); color:var(--cream-dim); }
  .adm-tbl tr:hover td { background:rgba(201,168,76,0.03); }

  /* ── badges ── */
  .b-status { display:inline-block; font-size:0.58rem; letter-spacing:0.12em; text-transform:uppercase; padding:3px 8px; border:1px solid; }
  .b-status.active   { color:#6dbf67; border-color:rgba(109,191,103,0.3); background:rgba(109,191,103,0.07); }
  .b-status.trialing { color:#e8c97a; border-color:rgba(232,201,122,0.3); background:rgba(232,201,122,0.07); }
  .b-status.canceled { color:#c9706a; border-color:rgba(201,112,106,0.3); background:rgba(201,112,106,0.07); }
  .b-status.other    { color:var(--muted); border-color:rgba(245,240,232,0.1); }

  .b-plan { display:inline-block; font-size:0.6rem; letter-spacing:0.12em; text-transform:uppercase; padding:3px 9px; }
  .b-plan.premium { background:rgba(201,168,76,0.12); color:var(--gold); }
  .b-plan.elite   { background:rgba(201,168,76,0.25); color:var(--gold-light); font-weight:500; }
  .b-plan.unknown { background:rgba(245,240,232,0.05); color:var(--muted); }

  /* ── empty / loading / denied ── */
  .adm-empty { text-align:center; padding:56px 20px; color:var(--muted); }
  .adm-empty-ico { font-size:2.4rem; margin-bottom:14px; opacity:0.35; }
  .adm-empty-msg { font-size:0.82rem; letter-spacing:0.08em; }

  .adm-loading { text-align:center; padding:80px 20px; color:var(--muted); font-size:0.75rem; letter-spacing:0.18em; text-transform:uppercase; }

  .adm-error { background:rgba(201,112,106,0.08); border:1px solid rgba(201,112,106,0.2); padding:16px 20px; color:#c9706a; font-size:0.8rem; line-height:1.6; margin-bottom:32px; }

  .adm-denied {
    min-height:100vh; display:flex; flex-direction:column;
    align-items:center; justify-content:center; gap:18px;
    background:var(--black); text-align:center; padding:40px;
  }
  .adm-denied-ico   { font-size:3rem; opacity:0.4; }
  .adm-denied-title { font-family:var(--serif); font-size:2rem; color:var(--gold-light); font-weight:300; }
  .adm-denied-text  { color:var(--muted); font-size:0.78rem; letter-spacing:0.1em; max-width:320px; line-height:1.7; }
  .adm-denied-btn   {
    border:1px solid rgba(201,168,76,0.35); color:var(--gold); background:none;
    padding:10px 26px; font-family:var(--sans); font-size:0.72rem; letter-spacing:0.12em;
    text-transform:uppercase; cursor:pointer; transition:all 0.22s; margin-top:8px;
  }
  .adm-denied-btn:hover { background:rgba(201,168,76,0.1); }
`;

export default function AdminDashboard({ user, onBack }) {
  const [subs, setSubs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collectionGroup(db, "subscriptions"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a, b) => {
          const ta = toDate(a.created)?.getTime() ?? 0;
          const tb = toDate(b.created)?.getTime() ?? 0;
          return tb - ta;
        });
        setSubs(docs);
        setLoading(false);
      },
      (err) => {
        console.error("AdminDashboard Firestore:", err);
        setError(
          err.code === "permission-denied"
            ? "Sin permisos de Firestore. Agrega la regla de seguridad indicada en el comentario de AdminDashboard.js para permitir al admin leer todas las suscripciones."
            : err.message
        );
        setLoading(false);
      }
    );
    return unsub;
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <>
        <style>{css}</style>
        <div className="adm-denied">
          <div className="adm-denied-ico">🔒</div>
          <div className="adm-denied-title">Acceso denegado</div>
          <div className="adm-denied-text">Esta sección es exclusiva para la administradora de GlobeMate.</div>
          <button className="adm-denied-btn" onClick={onBack}>← Volver</button>
        </div>
      </>
    );
  }

  // ── Metrics ──────────────────────────────────────────────────────────────
  const active   = subs.filter(s => s.status === "active");
  const trialing = subs.filter(s => s.status === "trialing");
  const canceled = subs.filter(s => s.status === "canceled");

  const activeSubs   = [...active, ...trialing];
  const premiumSubs  = activeSubs.filter(s => getPlan(s)?.label === "Premium");
  const eliteSubs    = activeSubs.filter(s => getPlan(s)?.label === "Elite");
  const mrr          = premiumSubs.length * 9.99 + eliteSubs.length * 19.99;

  // ── Bar chart: last 6 months ─────────────────────────────────────────────
  const now  = new Date();
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { key: monthKey(d), label: MONTHS_ES[d.getMonth()], count: 0 };
  });
  subs.forEach(s => {
    const d = toDate(s.created);
    if (!d) return;
    const b = last6.find(x => x.key === monthKey(d));
    if (b) b.count++;
  });
  const maxCount = Math.max(...last6.map(b => b.count), 1);

  // ── Recent subscriptions (last 20) ───────────────────────────────────────
  const recent = subs.slice(0, 20);

  return (
    <>
      <style>{css}</style>
      <div className="adm-root">

        {/* Navbar */}
        <nav className="adm-nav">
          <div className="adm-nav-left">
            <div className="adm-logo">Globe<span>Mate</span></div>
            <span className="adm-badge">Admin</span>
          </div>
          <button className="adm-back" onClick={onBack}>← Volver</button>
        </nav>

        <div className="adm-body">
          <h1 className="adm-title">Panel de Administrador</h1>
          <p className="adm-subtitle">
            Métricas de suscripciones ·{" "}
            {now.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
          </p>

          {loading && <div className="adm-loading">Cargando datos…</div>}

          {error && (
            <div className="adm-error">
              ⚠️ {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {/* ── Stat cards ── */}
              <div className="adm-cards">
                <div className="adm-card hl">
                  <div className="adm-card-label">MRR</div>
                  <div className="adm-card-value">{mrr === 0 ? "—" : `${mrr.toFixed(0)}€`}</div>
                  <div className="adm-card-sub">Ingreso mensual recurrente</div>
                </div>

                <div className="adm-card">
                  <div className="adm-card-label">Activos</div>
                  <div className="adm-card-value">{activeSubs.length}</div>
                  <div className="adm-card-sub">active + trialing</div>
                </div>

                <div className="adm-card">
                  <div className="adm-card-label">Premium</div>
                  <div className="adm-card-value">{premiumSubs.length}</div>
                  <div className="adm-card-sub">9,99 €/mes</div>
                </div>

                <div className="adm-card">
                  <div className="adm-card-label">Elite</div>
                  <div className="adm-card-value">{eliteSubs.length}</div>
                  <div className="adm-card-sub">19,99 €/mes</div>
                </div>

                <div className="adm-card">
                  <div className="adm-card-label">En prueba</div>
                  <div className="adm-card-value">{trialing.length}</div>
                  <div className="adm-card-sub">Periodo trial activo</div>
                </div>

                <div className="adm-card">
                  <div className="adm-card-label">Cancelaciones</div>
                  <div className="adm-card-value">{canceled.length}</div>
                  <div className="adm-card-sub">Status canceled</div>
                </div>
              </div>

              <div className="adm-divider" />

              {/* ── Bar chart ── */}
              <div className="adm-sec">Nuevos suscriptores por mes</div>
              {subs.length === 0 ? (
                <div className="adm-empty">
                  <div className="adm-empty-ico">📊</div>
                  <div className="adm-empty-msg">Sin datos de suscripciones aún. ¡Aquí aparecerán cuando lleguen los primeros suscriptores!</div>
                </div>
              ) : (
                <div className="adm-chart">
                  <div className="adm-bars">
                    {last6.map(b => (
                      <div key={b.key} className="adm-bar-col">
                        <div className="adm-bar-wrap">
                          <div
                            className="adm-bar"
                            style={{ height: `${Math.max(4, (b.count / maxCount) * 110)}px` }}
                            title={`${b.count} suscriptores`}
                          >
                            {b.count > 0 && <span className="adm-bar-n">{b.count}</span>}
                          </div>
                        </div>
                        <div className="adm-bar-label">{b.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="adm-divider" />

              {/* ── Recent table ── */}
              <div className="adm-sec">Últimas suscripciones</div>
              {subs.length === 0 ? (
                <div className="adm-empty">
                  <div className="adm-empty-ico">📋</div>
                  <div className="adm-empty-msg">Aún no hay suscripciones registradas.</div>
                </div>
              ) : (
                <div className="adm-table-wrap">
                  <table className="adm-tbl">
                    <thead>
                      <tr>
                        <th>Plan</th>
                        <th>Estado</th>
                        <th>Alta</th>
                        <th>Fin periodo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map(s => {
                        const plan       = getPlan(s);
                        const created    = toDate(s.created);
                        const periodEnd  = toDate(s.current_period_end);
                        const statusCls  = ["active","trialing","canceled"].includes(s.status) ? s.status : "other";
                        return (
                          <tr key={s.id}>
                            <td>
                              <span className={`b-plan ${plan ? plan.label.toLowerCase() : "unknown"}`}>
                                {plan ? `${plan.label} · ${plan.price.toFixed(2)}€` : "Desconocido"}
                              </span>
                            </td>
                            <td>
                              <span className={`b-status ${statusCls}`}>{s.status}</span>
                            </td>
                            <td style={{ color: "var(--cream-dim)", fontSize: "0.77rem" }}>
                              {created ? created.toLocaleDateString("es-ES") : "—"}
                            </td>
                            <td style={{ color: "var(--muted)", fontSize: "0.77rem" }}>
                              {periodEnd ? periodEnd.toLocaleDateString("es-ES") : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
