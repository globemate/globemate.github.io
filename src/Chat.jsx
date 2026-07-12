import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, doc, getDoc, updateDoc, setDoc, arrayUnion, serverTimestamp,
} from "firebase/firestore";
import { useTranslation } from "react-i18next";
import PublicProfile from "./PublicProfile";
import ReportModal from "./ReportModal";

/* ── helpers ── */
function fmtTime(raw) {
  if (!raw) return "";
  const d = raw?.toDate ? raw.toDate() : new Date(raw);
  const diff = Date.now() - d;
  if (diff < 60000)      return "Ahora";
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
  .lang-btn { display:inline-flex !important; align-items:center; gap:6px; background:none; border:1px solid rgba(201,168,76,0.35); color:#e8c97a; cursor:pointer; font-family:inherit; font-size:0.72rem; letter-spacing:0.1em; padding:6px 10px; white-space:nowrap; flex-shrink:0; line-height:1; outline:none; transition:border-color 0.22s,color 0.22s; }
  .lang-btn:hover { border-color:#c9a84c; color:#c9a84c; }
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
  .ch-thread-head { flex-shrink:0; padding:0 16px 0 24px; height:64px; display:flex; align-items:center; gap:14px; border-bottom:1px solid var(--border); background:rgba(10,9,5,0.6); backdrop-filter:blur(6px); }
  .ch-thread-avatar { width:38px; height:38px; border-radius:50%; border:1.5px solid rgba(201,168,76,0.35); background:rgba(10,9,5,0.8); display:flex; align-items:center; justify-content:center; font-size:1.15rem; flex-shrink:0; overflow:hidden; }
  .ch-thread-avatar img { width:100%; height:100%; object-fit:cover; }
  .ch-thread-name { font-family:var(--serif); font-size:1.05rem; font-weight:300; color:var(--cream); }
  .ch-thread-loc { font-size:0.72rem; color:var(--muted); margin-top:1px; }
  .ch-back-btn { display:none; background:none; border:none; color:var(--gold); cursor:pointer; padding:6px 0; font-size:1rem; margin-right:4px; }

  /* thread action buttons */
  .ch-thread-actions { margin-left:auto; display:flex; gap:6px; flex-shrink:0; }
  .ch-act-btn {
    background: transparent; border: 1px solid rgba(245,240,232,0.18);
    color: rgba(245,240,232,0.48); padding: 5px 11px;
    font-family: var(--sans); font-size: 0.62rem; letter-spacing: 0.1em;
    text-transform: uppercase; cursor: pointer; transition: all 0.2s; white-space: nowrap;
  }
  .ch-act-btn:hover { border-color: rgba(201,112,106,0.5); color: #e07070; }
  .ch-act-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .ch-act-btn.danger { border-color: rgba(201,112,106,0.25); color: rgba(224,112,112,0.65); }
  .ch-act-btn.danger:hover { background: rgba(201,112,106,0.1); border-color: rgba(201,112,106,0.55); color: #e07070; }
  @media(max-width:480px){ .ch-act-btn { font-size: 0.58rem; padding: 4px 8px; } }

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
  const [profilesMap, setProfilesMap] = useState({});
  const [activeId, setActiveId]     = useState(null);
  const [msgMap, setMsgMap]         = useState({});
  const [input, setInput]           = useState("");
  const [search, setSearch]         = useState("");
  const [sending, setSending]       = useState(false);
  const [loading, setLoading]       = useState(true);
  const [mobileView, setMobileView] = useState("list");
  const [unread, setUnread]         = useState({});
  const [viewUid, setViewUid]       = useState(null);
  const [blockingChat, setBlockingChat] = useState(false);
  const [chatReporting, setChatReporting] = useState(false);

  const bottomRef   = useRef();
  const textareaRef = useRef();

  /* ── load conversations ── */
  useEffect(() => {
    if (!user?.uid) { setLoading(false); return; }
    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", user.uid)
    );
    const unsub = onSnapshot(q,
      snap => {
        const sorted = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const ta = a.lastMessageAt?.toDate?.() ?? new Date(0);
            const tb = b.lastMessageAt?.toDate?.() ?? new Date(0);
            return tb - ta;
          });
        setConvs(sorted);
        setLoading(false);
      },
      err => {
        console.error("[Chat] onSnapshot error:", err);
        setConvs([]);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user?.uid]);

  /* ── fetch fresh profiles ── */
  useEffect(() => {
    if (!convs.length || !user?.uid) return;
    const otherUids = [...new Set(
      convs.map(c => (c.participants || []).find(p => p !== user.uid)).filter(Boolean)
    )];
    Promise.all(otherUids.map(async uid => {
      const snap = await getDoc(doc(db, "users", uid));
      return [uid, snap.exists() ? snap.data() : {}];
    })).then(entries => {
      setProfilesMap(Object.fromEntries(entries));
    }).catch(err => console.error("[Chat] profiles fetch error:", err));
  }, [convs, user?.uid]);

  /* ── real-time messages ── */
  useEffect(() => {
    if (!activeId) return;
    const q = query(
      collection(db, "conversations", activeId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, snap => {
      setMsgMap(prev => ({ ...prev, [activeId]: snap.docs.map(d => ({ id: d.id, ...d.data() })) }));
    });
    return () => unsub();
  }, [activeId, convs]);

  /* ── scroll to bottom ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgMap, activeId]);

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

    setSending(true);
    try {
      await addDoc(collection(db, "conversations", activeId, "messages"), {
        text, senderId: user.uid, createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "conversations", activeId), {
        lastMessage: text, lastMessageAt: serverTimestamp(), lastMessageBy: user.uid,
      });
    } catch {
      const newMsg = { id: `local-${Date.now()}`, senderId: user.uid, text, createdAt: new Date() };
      setMsgMap(prev => ({ ...prev, [activeId]: [...(prev[activeId] || []), newMsg] }));
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  /* ── block from chat header ── */
  const handleBlockFromChat = async () => {
    if (!activeConv || !user?.uid || blockingChat) return;
    const blockedId = getOtherUid(activeConv, user.uid);
    if (!blockedId) return;
    setBlockingChat(true);
    try {
      await setDoc(doc(db, "blocks", `${user.uid}_${blockedId}`), {
        blockerId: user.uid, blockedId, createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "conversations", activeId), {
        hiddenFor: arrayUnion(user.uid, blockedId),
      });
      setActiveId(null);
      setMobileView("list");
    } catch (err) {
      console.error("Block error:", err);
    } finally {
      setBlockingChat(false);
    }
  };

  /* ── derived ── */
  const filtered = convs.filter(c => {
    if (c.hiddenFor?.includes(user.uid)) return false;
    const name = c.participantProfiles?.[getOtherUid(c, user.uid)]?.displayName || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const activeConv  = convs.find(c => c.id === activeId);
  const activeOther = getOtherProfile(activeConv, user.uid, profilesMap);
  const activeMsgs  = msgMap[activeId] || [];

  return (
    <>
      <style>{css}</style>

      {viewUid && (
        <PublicProfile
          uid={viewUid}
          currentUser={user}
          onClose={() => setViewUid(null)}
          onBlockDone={() => {
            setViewUid(null);
            setActiveId(null);
            setMobileView("list");
          }}
        />
      )}

      {chatReporting && activeConv && (
        <ReportModal
          reportedUid={getOtherUid(activeConv, user.uid)}
          currentUser={user}
          onClose={() => setChatReporting(false)}
          onBlockDone={() => {
            setChatReporting(false);
            setActiveId(null);
            setMobileView("list");
          }}
        />
      )}

      <div className="ch-root">
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
                <div className="ch-no-convs">Aún no tienes conversaciones — consigue un match para empezar a chatear.</div>
              )}
              {filtered.map(c => {
                const other = getOtherProfile(c, user.uid, profilesMap);
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
                        {isMe ? "Tú: " : ""}{c.lastMessage || "¡Di hola!"}
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
                  <div
                    style={{ display:"flex", alignItems:"center", gap:"14px", cursor:"pointer" }}
                    onClick={() => setViewUid(getOtherUid(activeConv, user.uid))}
                    title="Ver perfil"
                  >
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

                  <div className="ch-thread-actions">
                    <button
                      className="ch-act-btn"
                      onClick={handleBlockFromChat}
                      disabled={blockingChat}
                    >
                      {blockingChat ? "…" : "Bloquear"}
                    </button>
                    <button
                      className="ch-act-btn danger"
                      onClick={() => setChatReporting(true)}
                    >
                      Reportar
                    </button>
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

/* ── helpers ── */
function getOtherUid(conv, myUid) {
  return (conv.participants || []).find(id => id !== myUid) || "";
}

function getOtherProfile(conv, myUid, profilesMap) {
  if (!conv) return {};
  const otherUid = getOtherUid(conv, myUid);
  const fresh = profilesMap?.[otherUid];
  if (fresh) return {
    displayName: fresh.displayName || "Viajero",
    photoURL:    fresh.photoURL    || null,
    location:    fresh.location    || null,
    emoji:       fresh.emoji       || null,
  };
  const stored = conv.participantProfiles?.[otherUid] || {};
  return {
    displayName: stored.displayName || "Viajero",
    photoURL:    stored.photoURL    || null,
    location:    stored.location    || null,
    emoji:       stored.emoji       || null,
  };
}

function sameDay(a, b) {
  const da  = (a?.toDate ? a.toDate() : new Date(a));
  const db2 = (b?.toDate ? b.toDate() : new Date(b));
  return da.toDateString() === db2.toDateString();
}

function dayLabel(raw, todayStr, yesterdayStr) {
  const d = (raw?.toDate ? raw.toDate() : new Date(raw));
  const today     = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString())     return todayStr;
  if (d.toDateString() === yesterday.toDateString()) return yesterdayStr;
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}
