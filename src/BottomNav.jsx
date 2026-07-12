const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap');

  /* ── Mobile bottom nav ──────────────────────────────────────── */
  .bnav {
    display: none;
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 400;
    height: 62px; align-items: stretch;
    background: rgba(10,9,5,0.98); border-top: 1px solid rgba(201,168,76,0.15);
    backdrop-filter: blur(10px);
    padding-bottom: env(safe-area-inset-bottom);
  }
  @media (max-width: 860px) { .bnav { display: flex; } }

  .bnav-btn {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 3px;
    background: none; border: none; cursor: pointer;
    color: rgba(245,240,232,0.3); font-family: 'DM Sans', sans-serif;
    transition: color 0.2s; -webkit-tap-highlight-color: transparent;
    padding: 0 2px;
  }
  .bnav-btn.bactive { color: #c9a84c; }
  .bnav-btn:not(.bactive):active { color: rgba(245,240,232,0.7); }
  .bnav-dot {
    width: 4px; height: 4px; border-radius: 50%;
    background: #c9a84c; visibility: hidden; flex-shrink: 0;
  }
  .bnav-btn.bactive .bnav-dot { visibility: visible; }
  .bnav-icon { font-size: 1.2rem; line-height: 1; }
  .bnav-label {
    font-size: 0.52rem; letter-spacing: 0.1em;
    text-transform: uppercase; line-height: 1;
  }

  /* ── Bottom padding so content clears BottomNav on mobile ──── */
  @media (max-width: 860px) {
    .ex-root { padding-bottom: 70px !important; }
    .mx-root { padding-bottom: 70px !important; }
    .ch-root { padding-bottom: 62px !important; }
    .nf-root { padding-bottom: 70px !important; }
    .px-root { padding-bottom: 70px !important; }
    .pr-root { padding-bottom: 182px !important; }
  }
`;

const ITEMS = [
  { key: "explore",  label: "Explore",  icon: "🔭" },
  { key: "matches",  label: "Matches",  icon: "❤️" },
  { key: "chat",     label: "Messages", icon: "💬" },
  { key: "map",      label: "Map",      icon: "🗺️" },
  { key: "profile",  label: "Profile",  icon: "👤" },
];

export default function BottomNav({ active, onExplore, onMatches, onChat, onMap, onProfile }) {
  const handlers = {
    explore: onExplore,
    matches: onMatches,
    chat: onChat,
    map: onMap,
    profile: onProfile,
  };
  return (
    <>
      <style>{css}</style>
      <nav className="bnav" aria-label="Main navigation">
        {ITEMS.map(({ key, label, icon }) => (
          <button
            key={key}
            className={`bnav-btn${active === key ? " bactive" : ""}`}
            onClick={handlers[key]}
          >
            <span className="bnav-dot" />
            <span className="bnav-icon">{icon}</span>
            <span className="bnav-label">{label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
