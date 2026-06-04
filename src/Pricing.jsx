import { useState } from "react";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  :root {
    --black:    #0a0905;
    --gold:     #c9a84c;
    --gold-light:#e8c97a;
    --gold-dim: rgba(201,168,76,0.45);
    --cream:    #f5f0e8;
    --cream-dim:rgba(245,240,232,0.55);
    --serif:    'Cormorant Garamond', serif;
    --sans:     'DM Sans', sans-serif;
  }

  /* ── root ── */
  .px-root {
    min-height: 100vh;
    background: var(--black);
    color: var(--cream);
    font-family: var(--sans);
    font-weight: 300;
  }

  /* ── mob nav ── */
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

  /* ── navbar ── */
  .px-nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 48px;
    border-bottom: 1px solid rgba(201,168,76,0.1);
    position: sticky; top: 0; z-index: 100;
    background: rgba(10,9,5,0.92); backdrop-filter: blur(12px);
  }
  .px-logo {
    font-family: var(--serif); font-size: 1.4rem; font-weight: 300;
    letter-spacing: 0.12em; color: var(--gold-light);
    background: none; border: none; cursor: pointer; padding: 0;
    transition: opacity 0.2s;
  }
  .px-logo:hover { opacity: 0.8; }
  .px-logo span { font-style: italic; }
  .px-nav-actions { display: flex; align-items: center; gap: 12px; }
  .px-nav-btn {
    background: none; border: 1px solid rgba(201,168,76,0.25);
    color: var(--cream-dim); font-family: var(--sans);
    font-size: 0.72rem; letter-spacing: 0.15em; text-transform: uppercase;
    padding: 8px 18px; cursor: pointer; transition: all 0.22s;
  }
  .px-nav-btn:hover { border-color: var(--gold); color: var(--cream); background: rgba(201,168,76,0.08); }
  .px-nav-btn.pxd { display: inline-block; }
  .bell-btn { position:relative; background:none; border:1px solid rgba(201,168,76,0.25); color:var(--gold); padding:6px 10px; cursor:pointer; transition:all 0.22s; font-size:1rem; display:inline-flex; align-items:center; justify-content:center; line-height:1; flex-shrink:0; }
  .bell-btn:hover { border-color:var(--gold); background:rgba(201,168,76,0.1); }
  .bell-badge { position:absolute; top:-6px; right:-6px; background:#d32f2f; color:#fff; border-radius:50%; min-width:17px; height:17px; display:flex; align-items:center; justify-content:center; font-size:0.58rem; font-weight:700; font-family:var(--sans); border:1.5px solid var(--black); padding:0 2px; pointer-events:none; }
  .px-hamburger { display:none; flex-direction:column; gap:5px; background:none; border:none; cursor:pointer; padding:6px; flex-shrink:0; }
  .px-hamburger span { display:block; width:22px; height:1.5px; background:var(--gold); }
  @media(max-width:860px){
    .px-hamburger { display:flex; }
    .pxd { display:none !important; }
    .px-nav { padding: 16px 20px; }
  }

  /* ── hero ── */
  .px-hero {
    text-align: center;
    padding: 72px 24px 56px;
  }
  .px-eyebrow {
    font-size: 0.67rem; letter-spacing: 0.28em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 18px;
  }
  .px-h1 {
    font-family: var(--serif); font-size: clamp(2.6rem, 5vw, 4rem);
    font-weight: 300; line-height: 1.08; color: var(--cream);
    margin: 0 0 18px;
  }
  .px-h1 em { font-style: italic; color: var(--gold-light); }
  .px-sub {
    font-size: 0.95rem; color: var(--cream-dim); line-height: 1.7;
    max-width: 520px; margin: 0 auto;
  }

  /* ── billing toggle ── */
  .px-toggle-wrap {
    display: flex; align-items: center; justify-content: center;
    gap: 14px; margin-bottom: 56px;
    font-size: 0.78rem; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--cream-dim);
  }
  .px-toggle {
    position: relative; width: 46px; height: 26px; cursor: pointer;
    background: rgba(245,240,232,0.08);
    border: 1px solid rgba(201,168,76,0.2);
    border-radius: 13px; transition: background 0.25s;
    flex-shrink: 0;
  }
  .px-toggle.on { background: rgba(201,168,76,0.25); border-color: var(--gold); }
  .px-toggle-knob {
    position: absolute; top: 3px; left: 3px; width: 18px; height: 18px;
    border-radius: 50%; background: rgba(245,240,232,0.4);
    transition: transform 0.25s, background 0.25s;
  }
  .px-toggle.on .px-toggle-knob { transform: translateX(20px); background: var(--gold); }
  .px-save-badge {
    background: rgba(201,168,76,0.15); border: 1px solid rgba(201,168,76,0.35);
    color: var(--gold); font-size: 0.65rem; letter-spacing: 0.14em;
    padding: 3px 10px; border-radius: 2px; text-transform: uppercase;
  }

  /* ── cards grid ── */
  .px-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 20px;
    max-width: 980px;
    margin: 0 auto;
    padding: 0 24px 80px;
    align-items: start;
  }
  @media(max-width:860px){
    .px-grid { grid-template-columns: 1fr; max-width: 420px; }
  }

  /* ── card ── */
  .px-card {
    background: rgba(245,240,232,0.03);
    border: 1px solid rgba(201,168,76,0.12);
    padding: 36px 28px 32px;
    position: relative;
    transition: border-color 0.25s;
  }
  .px-card:hover { border-color: rgba(201,168,76,0.28); }
  .px-card.featured {
    border: 1px solid var(--gold);
    background: rgba(201,168,76,0.04);
    transform: translateY(-8px);
    box-shadow: 0 0 48px rgba(201,168,76,0.1);
  }
  @media(max-width:860px){
    .px-card.featured { transform: none; }
  }
  .px-card.elite {
    border-color: rgba(245,240,232,0.18);
    background: rgba(245,240,232,0.02);
  }
  .px-card.elite:hover { border-color: rgba(245,240,232,0.32); }

  /* popular badge */
  .px-popular {
    position: absolute; top: -13px; left: 50%; transform: translateX(-50%);
    background: var(--gold); color: var(--black);
    font-family: var(--sans); font-size: 0.6rem; font-weight: 500;
    letter-spacing: 0.2em; text-transform: uppercase;
    padding: 4px 16px; white-space: nowrap;
  }

  /* plan name */
  .px-plan-name {
    font-size: 0.65rem; letter-spacing: 0.28em; text-transform: uppercase;
    color: var(--gold-dim); margin-bottom: 12px;
  }
  .px-card.featured .px-plan-name { color: var(--gold); }
  .px-card.elite .px-plan-name { color: rgba(245,240,232,0.5); }

  /* price */
  .px-price {
    font-family: var(--serif); line-height: 1; margin-bottom: 6px;
    color: var(--cream);
  }
  .px-price-num { font-size: 3.2rem; font-weight: 300; }
  .px-price-period { font-size: 0.85rem; color: var(--cream-dim); margin-bottom: 4px; }
  .px-price-annual {
    font-size: 0.72rem; color: var(--gold-dim);
    margin-bottom: 28px; min-height: 1em;
  }
  .px-card.featured .px-price-annual { color: var(--gold); }

  /* divider */
  .px-card-divider {
    height: 1px; background: rgba(201,168,76,0.12); margin-bottom: 24px;
  }

  /* feature list */
  .px-features { list-style: none; padding: 0; margin: 0 0 32px; }
  .px-features li {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: 0.84rem; color: var(--cream-dim); line-height: 1.45;
    padding: 6px 0;
    border-bottom: 1px solid rgba(201,168,76,0.06);
  }
  .px-features li:last-child { border-bottom: none; }
  .px-check {
    color: var(--gold); font-size: 0.75rem; flex-shrink: 0;
    margin-top: 2px; line-height: 1.45;
  }
  .px-card.featured .px-features li { color: rgba(245,240,232,0.75); }
  .px-card.elite .px-features li { color: rgba(245,240,232,0.65); }
  .px-cross { color: rgba(245,240,232,0.2); font-size: 0.75rem; flex-shrink: 0; margin-top: 2px; }
  .px-feat-dim { color: rgba(245,240,232,0.25) !important; }

  /* cta buttons */
  .px-btn-current {
    width: 100%; padding: 14px;
    background: none; border: 1px solid rgba(201,168,76,0.15);
    color: rgba(245,240,232,0.3);
    font-family: var(--sans); font-size: 0.72rem;
    letter-spacing: 0.18em; text-transform: uppercase;
    cursor: default;
  }
  .px-btn-subscribe {
    width: 100%; padding: 14px;
    background: none; border: 1px solid rgba(201,168,76,0.4);
    color: var(--gold);
    font-family: var(--sans); font-size: 0.72rem;
    letter-spacing: 0.18em; text-transform: uppercase;
    cursor: pointer; transition: all 0.25s;
    text-decoration: none; display: block; text-align: center;
  }
  .px-btn-subscribe:hover {
    background: rgba(201,168,76,0.1); border-color: var(--gold); color: var(--gold-light);
  }
  .px-card.featured .px-btn-subscribe {
    background: var(--gold); color: var(--black); border-color: var(--gold);
  }
  .px-card.featured .px-btn-subscribe:hover {
    background: var(--gold-light); border-color: var(--gold-light);
  }

  /* ── footer note ── */
  .px-footer-note {
    text-align: center; padding: 0 24px 64px;
    font-size: 0.72rem; color: rgba(245,240,232,0.22);
    line-height: 1.7; max-width: 560px; margin: 0 auto;
  }
  .px-footer-note a { color: rgba(201,168,76,0.5); text-decoration: none; }
  .px-footer-note a:hover { color: var(--gold); }
`;

const FREE_FEATURES = [
  { ok: true,  text: "Explorar perfiles (limitado a 10/día)" },
  { ok: true,  text: "5 likes al día" },
  { ok: true,  text: "Perfil básico" },
  { ok: false, text: "Ver quién te dio like" },
  { ok: false, text: "Matches ilimitados" },
  { ok: false, text: "Chat completo" },
  { ok: false, text: "Sin anuncios" },
];

const PREMIUM_FEATURES = [
  { ok: true, text: "Explorar perfiles ilimitado" },
  { ok: true, text: "Likes ilimitados" },
  { ok: true, text: "Ver quién te dio like" },
  { ok: true, text: "Matches ilimitados" },
  { ok: true, text: "Chat completo" },
  { ok: true, text: "Sin anuncios" },
  { ok: true, text: "Filtros de búsqueda avanzados" },
];

const ELITE_FEATURES = [
  { ok: true, text: "Todo lo de Premium" },
  { ok: true, text: "Perfil destacado en búsquedas" },
  { ok: true, text: "2 boosts de visibilidad / semana" },
  { ok: true, text: "Ver quién visitó tu perfil" },
  { ok: true, text: "Badge VIP dorado en tu perfil" },
  { ok: true, text: "Soporte prioritario 24/7" },
  { ok: true, text: "Acceso anticipado a nuevas funciones" },
];

export default function Pricing({
  user, onBack, onProfile, onExplore, onMatches, onChat,
  onMap, onSignOut, onNotif, notifCount, onSettings, onPricing,
}) {
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [annual,    setAnnual]    = useState(false);

  const premiumPrice = annual ? "8,32" : "9,99";
  const elitePrice   = annual ? "16,65" : "19,99";
  const premiumLink  = "https://buy.stripe.com/test_9B6fZj2FWeCQ3cy3jo6c000";
  const eliteLink    = "https://buy.stripe.com/test_14A7sNa8o2U8bJ46vA6c001";

  return (
    <>
      <style>{style}</style>

      {/* ── mob nav ── */}
      <div className={`mob-nav${menuOpen ? " open" : ""}`}>
        <div className="mob-nav-top">
          <div className="mob-nav-logo">Globe<span>Mate</span></div>
          <button className="mob-nav-close" onClick={() => setMenuOpen(false)}>✕</button>
        </div>
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onBack(); }}>← Home</button>
        <div className="mob-nav-divider" />
        <button className="mob-nav-link gold" onClick={() => { setMenuOpen(false); onExplore?.(); }}>Explore</button>
        <button className="mob-nav-link gold" onClick={() => { setMenuOpen(false); onMatches?.(); }}>Matches</button>
        <button className="mob-nav-link gold" onClick={() => { setMenuOpen(false); onChat?.(); }}>Messages</button>
        <button className="mob-nav-link gold" onClick={() => { setMenuOpen(false); onMap?.(); }}>Map</button>
        <div className="mob-nav-divider" />
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onProfile?.(); }}>My Profile</button>
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onNotif?.(); }}>
          🔔 Notificaciones{notifCount > 0 ? ` (${notifCount})` : ""}
        </button>
        <button className="mob-nav-link gold" onClick={() => { setMenuOpen(false); onPricing?.(); }}>✦ Planes</button>
        <div className="mob-nav-divider" />
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onSettings?.(); }}>⚙ Configuración</button>
        <div className="mob-nav-divider" />
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onSignOut?.(); }}>Sign out</button>
      </div>

      <div className="px-root">

        {/* ── navbar ── */}
        <nav className="px-nav">
          <button className="px-logo" onClick={onBack}>Globe<span>Mate</span></button>
          <div className="px-nav-actions">
            {user && (
              <button className="bell-btn" onClick={onNotif}>
                🔔{notifCount > 0 && <span className="bell-badge">{notifCount > 9 ? "9+" : notifCount}</span>}
              </button>
            )}
            <button className="px-nav-btn pxd" onClick={onExplore}>Explore</button>
            <button className="px-nav-btn pxd" onClick={onProfile}>My Profile</button>
            <button className="px-hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <span /><span /><span />
            </button>
          </div>
        </nav>

        {/* ── hero ── */}
        <div className="px-hero">
          <div className="px-eyebrow">Suscripciones</div>
          <h1 className="px-h1">Elige tu plan <em>ideal</em></h1>
          <p className="px-sub">
            Conecta con viajeros de todo el mundo. Desbloquea matches ilimitados,
            chat completo y funciones exclusivas para encontrar tu compañero de viaje perfecto.
          </p>
        </div>

        {/* ── billing toggle ── */}
        <div className="px-toggle-wrap">
          <span>Mensual</span>
          <button
            className={`px-toggle${annual ? " on" : ""}`}
            onClick={() => setAnnual(a => !a)}
            aria-label="Toggle anual"
          >
            <div className="px-toggle-knob" />
          </button>
          <span>Anual</span>
          {annual && <span className="px-save-badge">Ahorra 17%</span>}
        </div>

        {/* ── plan cards ── */}
        <div className="px-grid">

          {/* FREE */}
          <div className="px-card">
            <div className="px-plan-name">Free</div>
            <div className="px-price">
              <span className="px-price-num">0€</span>
            </div>
            <div className="px-price-period">para siempre</div>
            <div className="px-price-annual">&nbsp;</div>
            <div className="px-card-divider" />
            <ul className="px-features">
              {FREE_FEATURES.map((f, i) => (
                <li key={i} className={f.ok ? "" : "px-feat-dim"}>
                  <span className={f.ok ? "px-check" : "px-cross"}>{f.ok ? "✦" : "✕"}</span>
                  {f.text}
                </li>
              ))}
            </ul>
            <button className="px-btn-current" disabled>Plan actual</button>
          </div>

          {/* PREMIUM */}
          <div className="px-card featured">
            <div className="px-popular">Más popular</div>
            <div className="px-plan-name">Premium</div>
            <div className="px-price">
              <span className="px-price-num">{premiumPrice}€</span>
            </div>
            <div className="px-price-period">/ mes</div>
            <div className="px-price-annual">
              {annual ? "Facturado anualmente — 99,90€/año" : "O 99,90€/año (ahorra 17%)"}
            </div>
            <div className="px-card-divider" />
            <ul className="px-features">
              {PREMIUM_FEATURES.map((f, i) => (
                <li key={i}>
                  <span className="px-check">✦</span>
                  {f.text}
                </li>
              ))}
            </ul>
            <a
              className="px-btn-subscribe"
              href={premiumLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Suscribirse
            </a>
          </div>

          {/* ELITE */}
          <div className="px-card elite">
            <div className="px-plan-name">Elite</div>
            <div className="px-price">
              <span className="px-price-num">{elitePrice}€</span>
            </div>
            <div className="px-price-period">/ mes</div>
            <div className="px-price-annual">
              {annual ? "Facturado anualmente — 199,90€/año" : "O 199,90€/año (ahorra 17%)"}
            </div>
            <div className="px-card-divider" />
            <ul className="px-features">
              {ELITE_FEATURES.map((f, i) => (
                <li key={i}>
                  <span className="px-check">✦</span>
                  {f.text}
                </li>
              ))}
            </ul>
            <a
              className="px-btn-subscribe"
              href={eliteLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Suscribirse
            </a>
          </div>

        </div>

        {/* ── footer note ── */}
        <p className="px-footer-note">
          Puedes cancelar tu suscripción en cualquier momento desde la configuración de tu cuenta.
          Los precios incluyen IVA. Al suscribirte aceptas nuestros{" "}
          <a href="#terms">términos y condiciones</a>.
        </p>

      </div>
    </>
  );
}
