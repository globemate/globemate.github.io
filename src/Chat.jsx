import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, doc, updateDoc, serverTimestamp,
} from "firebase/firestore";
import { useTranslation } from "react-i18next";
import { LangButton } from "./LanguageSelector";

/* ── mock conversations shown when Firestore has none ── */
const t = (offset) => new Date(Date.now() - offset);
const MOCK_CONVS = [
  {
    id: "mc1", real: false,
    otherUser: { uid: "m1", displayName: "Sofia Chen", emoji: "🌸", location: "Barcelona, Spain" },
    lastMessage: "Maybe we could explore Kyoto together?",
    lastMessageAt: t(3600000), lastMessageBy: "m1",
    mockMessages: [
      { id: "a1", senderId: "m1",  text: "Hey! I saw you're also planning Kyoto. When are you going?",         createdAt: t(7200000) },
      { id: "a2", senderId: "me",  text: "Late March — cherry blossom season. You?",                          createdAt: t(5400000) },
      { id: "a3", senderId: "m1",  text: "Same! I'm going the last week of March.",                           createdAt: t(3800000) },
      { id: "a4", senderId: "m1",  text: "Maybe we could explore Kyoto together?",                            createdAt: t(3600000) },
    ],
  },
  {
    id: "mc2", real: false,
    otherUser: { uid: "m5", displayName: "James Mitchell", emoji: "🗺️", location: "London, UK" },
    lastMessage: "Marrakech in October is unreal. You'll love it.",
    lastMessageAt: t(86400000), lastMessageBy: "m5",
    mockMessages: [
      { id: "b1", senderId: "m5",  text: "I noticed Morocco on your list — have you been to Marrakech?",      createdAt: t(90000000) },
      { id: "b2", senderId: "me",  text: "Not yet! It's on my list for this year. Any tips?",                 createdAt: t(88000000) },
      { id: "b3", senderId: "m5",  text: "Go in October — perfect weather, fewer crowds. Stay in the Medina.", createdAt: t(87000000) },
      { id: "b4", senderId: "m5",  text: "Marrakech in October is unreal. You'll love it.",                   createdAt: t(86400000) },
    ],
  },
  {
    id: "mc3", real: false,
    otherUser: { uid: "m3", displayName: "Yuki Tanaka", emoji: "🌊", location: "Tokyo, Japan" },
    lastMessage: "The Westfjords are totally worth it.",
    lastMessageAt: t(172800000), lastMessageBy: "m3",
    mockMessages: [
      { id: "c1", senderId: "me",  text: "I see Iceland is on your confirmed list! I'm going too in June.",    createdAt: t(180000000) },
      { id: "c2", senderId: "m3",  text: "Amazing! June is perfect — almost 24 hours of daylight.",           createdAt: t(175000000) },
      { id: "c3", senderId: "me",  text: "Are you doing the ring road?",                                      createdAt: t(174000000) },
      { id: "c4", senderId: "m3",  text: "Yes, plus the Westfjords. A bit off the beaten path but stunning.", createdAt: t(173000000) },
      { id: "c5", senderId: "m3",  text: "The Westfjords are totally worth it.",                              createdAt: t(172800000) },
    ],
  },
  {
    id: "mc4", real: false,
    otherUser: { uid: "m8", displayName: "Nina Schmidt", emoji: "🎨", location: "Berlin, Germany" },
    lastMessage: "Porto is underrated — best food in Europe honestly.",
    lastMessageAt: t(259200000), lastMessageBy: "m8",
    mockMessages: [
      { id: "d1", senderId: "m8",  text: "I love that you have Porto on your list. It's my favourite city.",  createdAt: t(262000000) },
      { id: "d2", senderId: "me",  text: "Really? What makes it special for you?",                           createdAt: t(260000000) },
      { id: "d3", senderId: "m8",  text: "The light, the tiles, the people… and the food is incredible.",    createdAt: t(259500000) },
      { id: "d4", senderId: "m8",  text: "Porto is underrated — best food in Europe honestly.",              createdAt: t(259200000) },
    ],
  },
];

/* ── helpers ── */
function fmtTime(raw) {
  if (!raw) return "";
  const d = raw?.toDate ? raw.toDate() : new Date(raw);
  const diff = Date.now() - d;
  if (diff < 60000)      return "Just now";
  if (diff < 3600000)    return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000)   return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diff < 604800000)  return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function fmtFull(raw) {
  if (!raw) return "";
  const d = raw?.toDate ? raw.toDate() : new Date(raw);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ── CSS ── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --black:#0a0905; --dark:#100f0a; --card:#141209;
    --gold:#c9a84c; --gold-light:#e8c97a; --gold-dim:rgba(201,168,76,0.15);
    --cream:#f5f0e8; --cream-dim:rgba(245,240,232,0.55); --muted:rgba(245,240,232,0.35);
    --border:rgba(201,168,76,0.1);
    --serif:'Cormorant Garamond',Georgia,serif; --sans:'DM Sans',sans-serif;
  }
  body { background:var(--black); color:var(--cream); font-family:var(--sans); font-weight:300; }

  /* ── nav ── */
  .ch-nav {
    position:fixed; top:0; left:0; right:0; z-index:200;
    height:58px; display:flex; align-items:center; justify-content:space-between;
    padding:0 28px; background:rgba(10,9,5,0.98);
    border-bottom:1px solid var(--border); flex-shrink:0;
  }
  .ch-nav-logo { font-family:var(--serif); font-size:1.3rem; font-weight:300; letter-spacing:0.12em; color:var(--gold-light); cursor:pointer; border:none; background:none; padding:0; transition:opacity 0.2s; }
  .ch-nav-logo:hover { opacity:0.75; }
  .ch-nav-logo span { font-style:italic; }
  .ch-nav-links { display:flex; gap:8px; align-items:center; }
  .ch-nav-btn { border:1px solid rgba(201,168,76,0.28); color:var(--cream-dim); background:transparent; padding:7px 18px; font-family:var(--sans); font-size:0.7rem; letter-spacing:0.14em; text-transform:uppercase; cursor:pointer; transition:all 0.22s; white-space:nowrap; }
  .ch-nav-btn:hover { border-color:var(--gold); color:var(--gold); }
  @media(max-width:600px){ .ch-nav-btn.hide-xs { display:none; } .ch-nav { padding:0 16px; } }
  .bell-btn { position:relative; background:none; border:1px solid rgba(201,168,76,0.25); color:var(--gold); padding:6px 10px; cursor:pointer; transition:all 0.22s; font-size:1rem; display:inline-flex; align-items:center; justify-content:center; line-height:1; flex-shrink:0; }
  .bell-btn:hover { border-color:var(--gold); background:rgba(201,168,76,0.1); }
  .bell-badge { position:absolute; top:-6px; right:-6px; background:#d32f2f; color:#fff; border-radius:50%; min-width:17px; height:17px; display:flex; align-items:center; justify-content:center; font-size:0.58rem; font-weight:700; font-family:var(--sans); border:1.5px solid var(--black); padding:0 2px; pointer-events:none; }

  /* ── layout ── */
  .ch-root { position:fixed; inset:0; padding-top:58px; display:flex; flex-direction:column; background:var(--black); }
  .ch-layout { flex:1; display:flex; overflow:hidden; }

  /* ── sidebar ── */
  .ch-sidebar { width:300px; flex-shrink:0; display:flex; flex-direction:column; border-right:1px solid var(--border); background:var(--dark); }
  .ch-sidebar-head { padding:20px 18px 14px; flex-shrink:0; border-bottom:1px solid var(--border); }
  .ch-sidebar-title { font-family:var(--serif); font-size:1.15rem; font-weight:300; letter-spacing:0.06em; color:var(--cream); margin-bottom:12px; }
  .ch-search { width:100%; background:rgba(245,240,232,0.04); border:1px solid rgba(201,168,76,0.16); color:var(--cream); padding:9px 14px; font-family:var(--sans); font-size:0.82rem; font-weight:300; outline:none; transition:border-color 0.22s; }
  .ch-search:focus { border-color:var(--gold); }
  .ch-search::placeholder { color:var(--muted); }
  .ch-conv-list { flex:1; overflow-y:auto; }
  .ch-conv-list::-webkit-scrollbar { width:3px; }
  .ch-conv-list::-webkit-scrollbar-thumb { background:rgba(201,168,76,0.2); }

  /* conversation item */
  .ch-conv-item { display:flex; align-items:center; gap:13px; padding:14px 18px; cursor:pointer; transition:background 0.18s; border-bottom:1px solid rgba(201,168,76,0.06); }
  .ch-conv-item:hover { background:rgba(245,240,232,0.03); }
  .ch-conv-item.active { background:rgba(201,168,76,0.08); border-left:2px solid var(--gold); }
  .ch-conv-avatar { width:44px; height:44px; border-radius:50%; border:1.5px solid rgba(201,168,76,0.35); background:rgba(10,9,5,0.8); display:flex; align-items:center; justify-content:center; font-size:1.35rem; flex-shrink:0; overflow:hidden; }
  .ch-conv-avatar img { width:100%; height:100%; object-fit:cover; }
  .ch-conv-info { flex:1; min-width:0; }
  .ch-conv-name { font-size:0.86rem; font-weight:400; color:var(--cream); margin-bottom:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ch-conv-preview { font-size:0.76rem; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ch-conv-meta { display:flex; flex-direction:column; align-items:flex-end; gap:5px; flex-shrink:0; }
  .ch-conv-time { font-size:0.68rem; color:var(--muted); white-space:nowrap; }
  .ch-unread-dot { width:7px; height:7px; border-radius:50%; background:var(--gold); }

  /* ── thread ── */
  .ch-thread { flex:1; display:flex; flex-direction:column; min-width:0; }
  .ch-thread-head { flex-shrink:0; padding:0 24px; height:64px; display:flex; align-items:center; gap:14px; border-bottom:1px solid var(--border); background:rgba(10,9,5,0.6); backdrop-filter:blur(6px); }
  .ch-thread-avatar { width:38px; height:38px; border-radius:50%; border:1.5px solid rgba(201,168,76,0.35); background:rgba(10,9,5,0.8); display:flex; align-items:center; justify-content:center; font-size:1.15rem; flex-shrink:0; overflow:hidden; }
  .ch-thread-avatar img { width:100%; height:100%; object-fit:cover; }
  .ch-thread-name { font-family:var(--serif); font-size:1.05rem; font-weight:300; color:var(--cream); }
  .ch-thread-loc { font-size:0.72rem; color:var(--muted); margin-top:1px; }
  .ch-back-btn { display:none; background:none; border:none; color:var(--gold); cursor:pointer; padding:6px 0; font-size:1rem; margin-right:4px; }

  /* messages */
  .ch-messages { flex:1; overflow-y:auto; padding:24px; display:flex; flex-direction:column; gap:6px; }
  .ch-messages::-webkit-scrollbar { width:3px; }
  .ch-messages::-webkit-scrollbar-thumb { background:rgba(201,168,76,0.15); }
  .ch-day-label { text-align:center; font-size:0.67rem; letter-spacing:0.18em; text-transform:uppercase; color:var(--muted); margin:10px 0; }

  .ch-msg-row { display:flex; gap:8px; }
  .ch-msg-row.mine { flex-direction:row-reverse; }
  .ch-msg-row.mine + .ch-msg-row.mine .ch-msg-mini-avatar { visibility:hidden; }
  .ch-msg-mini-avatar { width:28px; height:28px; border-radius:50%; border:1px solid rgba(201,168,76,0.25); background:rgba(10,9,5,0.8); display:flex; align-items:center; justify-content:center; font-size:0.85rem; flex-shrink:0; align-self:flex-end; overflow:hidden; }
  .ch-msg-mini-avatar img { width:100%; height:100%; object-fit:cover; }
  .ch-bubble-wrap { display:flex; flex-direction:column; max-width:68%; }
  .ch-msg-row.mine .ch-bubble-wrap { align-items:flex-end; }
  .ch-bubble { padding:10px 15px; font-size:0.85rem; line-height:1.6; word-break:break-word; }
  .ch-bubble.theirs { background:var(--card); border:1px solid rgba(201,168,76,0.1); color:var(--cream); border-radius:0 12px 12px 12px; }
  .ch-bubble.mine { background:rgba(201,168,76,0.18); border:1px solid rgba(201,168,76,0.3); color:var(--cream); border-radius:12px 0 12px 12px; }
  .ch-bubble-time { font-size:0.65rem; color:var(--muted); margin-top:4px; }

  /* input */
  .ch-input-wrap { flex-shrink:0; padding:16px 24px; border-top:1px solid var(--border); background:rgba(10,9,5,0.8); display:flex; gap:10px; align-items:flex-end; }
  .ch-textarea { flex:1; background:rgba(245,240,232,0.04); border:1px solid rgba(201,168,76,0.18); color:var(--cream); padding:12px 16px; font-family:var(--sans); font-size:0.85rem; font-weight:300; outline:none; resize:none; line-height:1.5; max-height:120px; transition:border-color 0.22s; }
  .ch-textarea:focus { border-color:var(--gold); }
  .ch-textarea::placeholder { color:var(--muted); }
  .ch-send-btn { background:var(--gold); color:var(--black); border:none; padding:12px 22px; font-family:var(--sans); font-size:0.72rem; font-weight:500; letter-spacing:0.14em; text-transform:uppercase; cursor:pointer; transition:background 0.22s; flex-shrink:0; align-self:stretch; }
  .ch-send-btn:hover:not(:disabled) { background:var(--gold-light); }
  .ch-send-btn:disabled { opacity:0.4; cursor:not-allowed; }

  /* empty states */
  .ch-empty-thread { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; color:var(--muted); text-align:center; padding:40px; }
  .ch-empty-thread-icon { font-size:3rem; opacity:0.3; }
  .ch-empty-thread-txt { font-family:var(--serif); font-size:1.3rem; font-weight:300; color:var(--cream-dim); }
  .ch-empty-thread-sub { font-size:0.8rem; max-width:280px; line-height:1.65; }

  .ch-no-convs { padding:40px 20px; text-align:center; color:var(--muted); font-size:0.82rem; line-height:1.7; }

  /* mobile */
  @media(max-width:680px){
    .ch-sidebar { width:100%; border-right:none; }
    .ch-sidebar.hidden-mobile { display:none; }
    .ch-thread.hidden-mobile { display:none; }
    .ch-back-btn { display:block; }
  }

  /* desktop-only nav items */
  @media(max-width:860px){ .ch-desktop{ display:none !important; } }

  /* hamburger */
  .ch-hamburger { display:none; flex-direction:column; gap:5px; background:none; border:none; cursor:pointer; padding:6px; flex-shrink:0; }
  @media(max-width:860px){ .ch-hamburger { display:flex; } }
  .ch-hamburger span { display:block; width:22px; height:1.5px; background:var(--gold); transition:transform 0.3s; }

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

export default function Chat({ user, onBack, onProfile, onExplore, onMatches, onChat, onMap, onSignOut, onNotif, notifCount, onSettings, onPricing }) {
  const { t } = useTranslation();
  const [convs, setConvs]           = useState([]);
  const [activeId, setActiveId]     = useState(null);
  const [msgMap, setMsgMap]         = useState({});   // { convId: [msgs] }
  const [input, setInput]           = useState("");
  const [search, setSearch]         = useState("");
  const [sending, setSending]       = useState(false);
  const [loading, setLoading]       = useState(true);
  const [mobileView, setMobileView] = useState("list"); // "list" | "chat"
  const [unread, setUnread]         = useState({});
  const [menuOpen, setMenuOpen]     = useState(false);

  const bottomRef = useRef();
  const textareaRef = useRef();

  /* ── pre-load mock messages ── */
  useEffect(() => {
    const init = {};
    MOCK_CONVS.forEach(c => { init[c.id] = c.mockMessages; });
    setMsgMap(init);
  }, []);

  /* ── load conversations from Firestore ── */
  useEffect(() => {
    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", user.uid),
      orderBy("lastMessageAt", "desc")
    );
    const unsub = onSnapshot(q,
      snap => {
        const real = snap.docs.map(d => ({ id: d.id, real: true, ...d.data() }));
        const combined = real.length >= 2
          ? real
          : [...real, ...MOCK_CONVS.filter(m => !real.find(r => r.id === m.id))];
        setConvs(combined);
        setLoading(false);
      },
      () => { setConvs(MOCK_CONVS); setLoading(false); }
    );
    return () => unsub();
  }, [user.uid]);

  /* ── real-time messages for active real conversation ── */
  useEffect(() => {
    const conv = convs.find(c => c.id === activeId);
    if (!conv?.real) return;
    const q = query(
      collection(db, "conversations", activeId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, snap => {
      setMsgMap(prev => ({ ...prev, [activeId]: snap.docs.map(d => ({ id: d.id, ...d.data() })) }));
    });
    return () => unsub();
  }, [activeId, convs]);

  /* ── scroll to bottom on new messages ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgMap, activeId]);

  /* ── mark read when opening conversation ── */
  const openConv = (id) => {
    setActiveId(id);
    setUnread(prev => ({ ...prev, [id]: false }));
    setMobileView("chat");
  };

  /* ── send ── */
  const handleSend = async () => {
    const text = input.trim();
    if (!text || !activeId) return;
    setInput("");
    textareaRef.current?.focus();

    const conv = convs.find(c => c.id === activeId);
    const newMsg = { id: `local-${Date.now()}`, senderId: user.uid, text, createdAt: new Date() };

    if (!conv?.real) {
      setMsgMap(prev => ({ ...prev, [activeId]: [...(prev[activeId] || []), newMsg] }));
      setConvs(prev => prev.map(c => c.id === activeId
        ? { ...c, lastMessage: text, lastMessageAt: new Date(), lastMessageBy: user.uid }
        : c
      ));
      return;
    }

    setSending(true);
    try {
      await addDoc(collection(db, "conversations", activeId, "messages"), {
        text, senderId: user.uid, createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "conversations", activeId), {
        lastMessage: text, lastMessageAt: serverTimestamp(), lastMessageBy: user.uid,
      });
    } catch {
      setMsgMap(prev => ({ ...prev, [activeId]: [...(prev[activeId] || []), newMsg] }));
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  /* ── derived ── */
  const filtered = convs.filter(c => {
    const name = (c.real ? c.participantProfiles?.[getOtherUid(c, user.uid)]?.displayName : c.otherUser?.displayName) || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const activeConv = convs.find(c => c.id === activeId);
  const activeOther = getOtherProfile(activeConv, user.uid);
  const activeMsgs  = msgMap[activeId] || [];

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
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onNotif(); }}>
          {t("nav.notifications")}{notifCount > 0 ? ` (${notifCount})` : ""}
        </button>
        <div className="mob-nav-divider" />
        <button className="mob-nav-link gold" onClick={() => { setMenuOpen(false); onPricing?.(); }}>{t("nav.plans")}</button>
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onSettings?.(); }}>{t("nav.settings")}</button>
        <div className="mob-nav-divider" />
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onSignOut(); }}>{t("nav.signOut")}</button>
      </div>

      <div className="ch-root">

        {/* navbar */}
        <nav className="ch-nav">
          <button className="ch-nav-logo" onClick={onBack}>Globe<span>Mate</span></button>
          <div className="ch-nav-links">
            {user && <button className="ch-nav-btn ch-desktop" onClick={onExplore}>{t("nav.explore")}</button>}
            {user && <button className="ch-nav-btn ch-desktop" onClick={onProfile}>{t("nav.myProfile")}</button>}
            <button className="ch-nav-btn ch-desktop" style={{borderColor:"#c9a84c",color:"#c9a84c"}} onClick={onPricing}>{t("nav.plans")}</button>
            {user && <button className="ch-nav-btn ch-desktop" onClick={onSignOut}>{t("nav.signOut")}</button>}
            <LangButton align="right" />
            {user && (
              <button className="bell-btn" onClick={onNotif}>
                🔔{notifCount > 0 && <span className="bell-badge">{notifCount > 9 ? "9+" : notifCount}</span>}
              </button>
            )}
            <button className="ch-hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <span /><span /><span />
            </button>
          </div>
        </nav>

        <div className="ch-layout">

          {/* sidebar */}
          <div className={`ch-sidebar${mobileView === "chat" ? " hidden-mobile" : ""}`}>
            <div className="ch-sidebar-head">
              <div className="ch-sidebar-title">{t("chat.title")}</div>
              <input
                className="ch-search"
                placeholder={t("chat.searchPlaceholder")}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="ch-conv-list">
              {loading && <div className="ch-no-convs">{t("common.loading")}</div>}
              {!loading && filtered.length === 0 && (
                <div className="ch-no-convs">{t("chat.noConversations")}<br />{t("chat.noConversationsHint")}</div>
              )}
              {filtered.map(c => {
                const other = getOtherProfile(c, user.uid);
                const isMe  = c.lastMessageBy === user.uid;
                return (
                  <div
                    key={c.id}
                    className={`ch-conv-item${activeId === c.id ? " active" : ""}`}
                    onClick={() => openConv(c.id)}
                  >
                    <div className="ch-conv-avatar">
                      {other.photoURL
                        ? <img src={other.photoURL} alt={other.displayName} />
                        : other.emoji || "👤"
                      }
                    </div>
                    <div className="ch-conv-info">
                      <div className="ch-conv-name">{other.displayName}</div>
                      <div className="ch-conv-preview">
                        {isMe ? "You: " : ""}{c.lastMessage || "Say hello!"}
                      </div>
                    </div>
                    <div className="ch-conv-meta">
                      <span className="ch-conv-time">{fmtTime(c.lastMessageAt)}</span>
                      {unread[c.id] && <span className="ch-unread-dot" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* thread */}
          <div className={`ch-thread${mobileView === "list" ? " hidden-mobile" : ""}`}>
            {!activeConv ? (
              <div className="ch-empty-thread">
                <div className="ch-empty-thread-icon">✈️</div>
                <div className="ch-empty-thread-txt">{t("chat.title")}</div>
                <div className="ch-empty-thread-sub">{t("chat.noConversationsHint")}</div>
              </div>
            ) : (
              <>
                <div className="ch-thread-head">
                  <button className="ch-back-btn" onClick={() => setMobileView("list")}>←</button>
                  <div className="ch-thread-avatar">
                    {activeOther.photoURL
                      ? <img src={activeOther.photoURL} alt={activeOther.displayName} />
                      : activeOther.emoji || "👤"
                    }
                  </div>
                  <div>
                    <div className="ch-thread-name">{activeOther.displayName}</div>
                    {activeOther.location && <div className="ch-thread-loc">📍 {activeOther.location}</div>}
                  </div>
                </div>

                <div className="ch-messages">
                  {activeMsgs.map((msg, i) => {
                    const isMine = msg.senderId === user.uid || msg.senderId === "me";
                    const prev   = activeMsgs[i - 1];
                    const showDay = !prev || !sameDay(msg.createdAt, prev.createdAt);
                    return (
                      <div key={msg.id}>
                        {showDay && (
                          <div className="ch-day-label">{dayLabel(msg.createdAt, t("common.today"), t("common.yesterday"))}</div>
                        )}
                        <div className={`ch-msg-row${isMine ? " mine" : ""}`}>
                          <div className="ch-msg-mini-avatar">
                            {isMine
                              ? (user.photoURL ? <img src={user.photoURL} alt="" /> : "👤")
                              : (activeOther.photoURL ? <img src={activeOther.photoURL} alt="" /> : (activeOther.emoji || "👤"))
                            }
                          </div>
                          <div className="ch-bubble-wrap">
                            <div className={`ch-bubble ${isMine ? "mine" : "theirs"}`}>{msg.text}</div>
                            <span className="ch-bubble-time">{fmtFull(msg.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                <div className="ch-input-wrap">
                  <textarea
                    ref={textareaRef}
                    className="ch-textarea"
                    rows={1}
                    placeholder={t("chat.messagePlaceholder")}
                    value={input}
                    onChange={e => {
                      setInput(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                    }}
                    onKeyDown={handleKey}
                  />
                  <button className="ch-send-btn" onClick={handleSend} disabled={!input.trim() || sending}>
                    {t("common.send")}
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

/* ── helpers to extract the "other" participant from a conversation ── */
function getOtherUid(conv, myUid) {
  return (conv.participants || []).find(id => id !== myUid) || "";
}

function getOtherProfile(conv, myUid) {
  if (!conv) return {};
  if (!conv.real) return conv.otherUser || {};
  const otherUid = getOtherUid(conv, myUid);
  return conv.participantProfiles?.[otherUid] || { displayName: "Traveler" };
}

function sameDay(a, b) {
  const da = (a?.toDate ? a.toDate() : new Date(a));
  const db2 = (b?.toDate ? b.toDate() : new Date(b));
  return da.toDateString() === db2.toDateString();
}

function dayLabel(raw, todayStr, yesterdayStr) {
  const d = (raw?.toDate ? raw.toDate() : new Date(raw));
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString())     return todayStr;
  if (d.toDateString() === yesterday.toDateString()) return yesterdayStr;
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}
