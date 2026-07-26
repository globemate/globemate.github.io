import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { LANGUAGES } from "./i18n";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, onSnapshot, doc, getDoc, addDoc, updateDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import { useSubscription } from "./useSubscription";
import Auth from "./Auth.jsx";
import GlobeMate from "./GlobeMate.jsx";
import Profile from "./Profile.jsx";
import Explore from "./Explore.jsx";
import Chat from "./Chat.jsx";
import Notifications from "./Notifications.jsx";
import Matches from "./Matches.jsx";
import Map from "./Map.jsx";
import Settings from "./Settings.jsx";
import Pricing from "./Pricing.jsx";
import Privacy from "./Privacy.jsx";
import Terms from "./Terms.jsx";
import AdminDashboard, { ADMIN_EMAIL } from "./AdminDashboard.js";
import Navbar from "./Navbar.jsx";
import BottomNav from "./BottomNav.jsx";


export default function App() {
  const { i18n } = useTranslation();
  const [user, setUser]               = useState(undefined);
  const [checkingUser,    setCheckingUser]    = useState(false);
  const [needsPhoneVerif, setNeedsPhoneVerif] = useState(false);
  const verificationStatusRef = useRef(null);
  const subscription = useSubscription(user || null);

  // Apply RTL direction whenever language changes
  useEffect(() => {
    const lang = LANGUAGES.find(l => l.code === i18n.resolvedLanguage);
    document.documentElement.dir  = lang?.dir  || "ltr";
    document.documentElement.lang = i18n.resolvedLanguage || "en";
  }, [i18n.resolvedLanguage]);
  const [showAuth, setShowAuth]       = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showExplore, setShowExplore] = useState(false);
  const [showChat, setShowChat]       = useState(false);
  const [showMatches, setShowMatches] = useState(false);
  const [showMap, setShowMap]         = useState(false);
  const [showNotif, setShowNotif]     = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms,   setShowTerms]   = useState(false);
  const [showAdmin,   setShowAdmin]   = useState(false);
  const [receivedLikes, setReceivedLikes] = useState([]);   // [{likeId, fromUid}]
  const [sentLikeUids,  setSentLikeUids]  = useState(new Set());
  const [ignoredUids,   setIgnoredUids]   = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("gm_ignored") || "[]")); }
    catch { return new Set(); }
  });
  const [persistentNotifs, setPersistentNotifs] = useState([]);
  const [profileVisitDocs, setProfileVisitDocs] = useState([]);
  const [lastVisitSeenAt,  setLastVisitSeenAt]  = useState(() => {
    try { return new Date(localStorage.getItem("gm_lastVisitSeenAt") || 0); }
    catch { return new Date(0); }
  });

  const pendingRequests    = receivedLikes.filter(r => !sentLikeUids.has(r.fromUid) && !ignoredUids.has(r.fromUid));
  const unseenPersistCount = persistentNotifs.filter(n => !n.seen).length;
  const newVisitsCount     = profileVisitDocs.filter(v => { const t = v.timestamp?.toDate?.(); return t && t > lastVisitSeenAt; }).length;
  const notifCount         = showNotif ? 0 : (pendingRequests.length + unseenPersistCount + (newVisitsCount > 0 ? 1 : 0));

  const handleIgnore = (fromUid) => {
    const next = new Set([...ignoredUids, fromUid]);
    setIgnoredUids(next);
    try { localStorage.setItem("gm_ignored", JSON.stringify([...next])); } catch {}
  };

  const handleMarkSeen = async () => {
    if (!user?.uid) return;
    const now = new Date();
    setLastVisitSeenAt(now);
    try { localStorage.setItem("gm_lastVisitSeenAt", now.toISOString()); } catch {}
    const unseen = persistentNotifs.filter(n => !n.seen);
    if (unseen.length > 0) {
      try {
        const batch = writeBatch(db);
        unseen.forEach(n => batch.update(doc(db, "notifications", user.uid, "items", n.id), { seen: true }));
        await batch.commit();
      } catch {}
    }
  };

  const handleDeleteNotif = async (notifId) => {
    if (!user?.uid) return;
    try { await updateDoc(doc(db, "notifications", user.uid, "items", notifId), { deleted: true }); } catch {}
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u && !u.phoneNumber) setCheckingUser(true);
      setUser(u);
      if (!u) {
        setShowProfile(false);
        setShowExplore(false);
        setShowChat(false);
        setShowMatches(false);
        setShowMap(false);
        setShowNotif(false);
        setShowSettings(false);
        setShowPricing(false);
        setShowPrivacy(false);
        setShowTerms(false);
        setShowAdmin(false);
        setPersistentNotifs([]);
        setProfileVisitDocs([]);
        setNeedsPhoneVerif(false);
        setCheckingUser(false);
        verificationStatusRef.current = null;
      }
    });
    return () => unsub();
  }, []);

  // Gate: if authenticated user has no phone linked, check whether they have a
  // users doc. No doc means they abandoned registration mid-phone-step.
  useEffect(() => {
    if (!user || user.phoneNumber) {
      setNeedsPhoneVerif(false);
      setCheckingUser(false);
      return;
    }
    let cancelled = false;
    getDoc(doc(db, "users", user.uid)).then(snap => {
      if (!cancelled) {
        setNeedsPhoneVerif(!snap.exists());
        setCheckingUser(false);
      }
    }).catch(() => {
      if (!cancelled) { setNeedsPhoneVerif(false); setCheckingUser(false); }
    });
    return () => { cancelled = true; };
  }, [user]);

  // subscribe to likes received (solicitudes de conexión)
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "likes"), where("toUid", "==", user.uid));
    const unsub = onSnapshot(q, snap => {
      setReceivedLikes(snap.docs.map(d => ({ likeId: d.id, fromUid: d.data().fromUid })));
    }, () => {});
    return () => unsub();
  }, [user?.uid]);

  // subscribe to likes sent (to know which requests I've already accepted)
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "likes"), where("fromUid", "==", user.uid));
    const unsub = onSnapshot(q, snap => {
      setSentLikeUids(new Set(snap.docs.map(d => d.data().toUid)));
    }, () => {});
    return () => unsub();
  }, [user?.uid]);

  // subscribe to persistent notifications (matches, verification)
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(collection(db, "notifications", user.uid, "items"), snap => {
      setPersistentNotifs(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(n => !n.deleted)
          .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      );
    }, err => console.error("[notifications] subscription error:", err));
    return () => unsub();
  }, [user?.uid]);

  // subscribe to profile visits (subcollection)
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(collection(db, "users", user.uid, "profileVisits"), snap => {
      setProfileVisitDocs(snap.docs.map(d => d.data()));
    }, () => {});
    return () => unsub();
  }, [user?.uid]);

  // detect verificationStatus change → write notification
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), snap => {
      const status = snap.data()?.verificationStatus || "";
      const prev   = verificationStatusRef.current;
      if (prev !== null && prev !== status && (status === "verified" || status === "rejected")) {
        addDoc(collection(db, "notifications", user.uid, "items"), {
          type: "verification", status, seen: false, deleted: false, createdAt: serverTimestamp(),
        }).catch(() => {});
      }
      verificationStatusRef.current = status;
    }, () => {});
    return () => unsub();
  }, [user?.uid]);

  // initialise history state so browser back has a baseline
  useEffect(() => {
    window.history.replaceState({ screen: "home" }, "");
  }, []);

  // browser/mobile back button
  useEffect(() => {
    const handlePop = (e) => {
      const screen = e.state?.screen || "home";
      setShowAuth(false);
      setShowProfile(false);
      setShowExplore(false);
      setShowChat(false);
      setShowMatches(false);
      setShowMap(false);
      setShowNotif(false);
      setShowSettings(false);
      setShowPricing(false);
      setShowPrivacy(false);
      setShowTerms(false);
      setShowAdmin(false);
      if (screen === "profile") setShowProfile(true);
      else if (screen === "explore") setShowExplore(true);
      else if (screen === "chat") setShowChat(true);
      else if (screen === "matches") setShowMatches(true);
      else if (screen === "map") setShowMap(true);
      else if (screen === "notif") setShowNotif(true);
      else if (screen === "settings") setShowSettings(true);
      else if (screen === "pricing") setShowPricing(true);
      else if (screen === "privacy") setShowPrivacy(true);
      else if (screen === "terms")   setShowTerms(true);
      else if (screen === "admin")   setShowAdmin(true);
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  const loadingScreen = (
    <div style={{
      minHeight: "100vh",
      background: "#0a0905",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
      color: "rgba(245,240,232,0.4)",
      fontSize: "0.85rem",
      letterSpacing: "0.15em",
      textTransform: "uppercase",
    }}>
      Loading…
    </div>
  );

  if (user === undefined || checkingUser) return loadingScreen;

  if (needsPhoneVerif) {
    return (
      <Auth
        initialMode="phone"
        onAuthSuccess={() => setNeedsPhoneVerif(false)}
        onBack={null}
      />
    );
  }

  if (showAuth) {
    return <Auth onAuthSuccess={() => setShowAuth(false)} onBack={() => window.history.back()} />;
  }

  // navigate to a screen and push history state
  const goTo = (screen) => {
    window.history.pushState({ screen }, "");
    setShowProfile(false);
    setShowExplore(false);
    setShowChat(false);
    setShowMatches(false);
    setShowMap(false);
    setShowNotif(false);
    setShowSettings(false);
    setShowPricing(false);
    setShowPrivacy(false);
    setShowTerms(false);
    setShowAdmin(false);
    if (screen === "profile") setShowProfile(true);
    else if (screen === "explore") setShowExplore(true);
    else if (screen === "chat") setShowChat(true);
    else if (screen === "matches") setShowMatches(true);
    else if (screen === "map") setShowMap(true);
    else if (screen === "notif") setShowNotif(true);
    else if (screen === "settings") setShowSettings(true);
    else if (screen === "pricing") setShowPricing(true);
    else if (screen === "privacy") setShowPrivacy(true);
    else if (screen === "terms")   setShowTerms(true);
    else if (screen === "admin")   setShowAdmin(true);
  };

  const isAdmin = user?.email === ADMIN_EMAIL;

  const nav = {
    onHome:     () => goTo("home"),
    onNotif:   () => goTo("notif"),
    notifCount,
    onProfile:  () => goTo("profile"),
    onExplore:  () => goTo("explore"),
    onChat:     () => goTo("chat"),
    onMatches:  () => goTo("matches"),
    onMap:      () => goTo("map"),
    onSettings: () => goTo("settings"),
    onPricing:  () => goTo("pricing"),
    onPrivacy:  () => goTo("privacy"),
    onTerms:    () => goTo("terms"),
    onSignOut:  () => signOut(auth),
    ...(isAdmin ? { onAdmin: () => goTo("admin") } : {}),
  };

  const activeScreen =
    showExplore ? "explore" :
    showMatches ? "matches" :
    showChat    ? "chat"    :
    showMap     ? "map"     :
    showProfile ? "profile" :
    "home";

  const showBottomNav =
    !showAdmin && !showPrivacy && !showTerms &&
    !showPricing && !showSettings && !showNotif;

  let pageContent;
  if (showAdmin && user && isAdmin) {
    pageContent = <AdminDashboard user={user} onBack={() => window.history.back()} />;
  } else if (showPrivacy) {
    pageContent = <Privacy onBack={() => window.history.back()} />;
  } else if (showTerms) {
    pageContent = <Terms onBack={() => window.history.back()} />;
  } else if (showPricing) {
    pageContent = <Pricing user={user} onBack={() => window.history.back()} subscription={subscription} {...nav} />;
  } else if (showSettings && user) {
    pageContent = <Settings user={user} onBack={() => window.history.back()} {...nav} />;
  } else if (showNotif && user) {
    pageContent = (
      <Notifications
        pendingRequests={pendingRequests}
        user={user}
        onIgnore={handleIgnore}
        persistentNotifs={persistentNotifs}
        profileVisitDocs={profileVisitDocs}
        lastVisitSeenAt={lastVisitSeenAt}
        onMarkSeen={handleMarkSeen}
        onDeleteNotif={handleDeleteNotif}
        subscription={subscription}
        onBack={() => window.history.back()}
        {...nav}
      />
    );
  } else if (showProfile && user) {
    pageContent = <Profile user={user} onBack={() => window.history.back()} subscription={subscription} {...nav} />;
  } else if (showExplore) {
    pageContent = <Explore user={user} onBack={() => window.history.back()} {...nav} />;
  } else if (showChat && user) {
    pageContent = <Chat user={user} onBack={() => window.history.back()} {...nav} />;
  } else if (showMatches && user) {
    pageContent = <Matches user={user} onBack={() => window.history.back()} {...nav} />;
  } else if (showMap && user) {
    pageContent = <Map user={user} onBack={() => window.history.back()} {...nav} />;
  } else {
    pageContent = <GlobeMate user={user} onSignIn={() => { window.history.pushState({ screen: "auth" }, ""); setShowAuth(true); }} {...nav} />;
  }

  return (
    <>
      {user && !showAdmin && (
        <Navbar
          user={user}
          active={activeScreen}
          onBack={() => window.history.back()}
          {...nav}
        />
      )}
      {pageContent}
      {user && !showAdmin && showBottomNav && (
        <BottomNav
          active={activeScreen}
          onExplore={nav.onExplore}
          onMatches={nav.onMatches}
          onChat={nav.onChat}
          onMap={nav.onMap}
          onProfile={nav.onProfile}
        />
      )}
    </>
  );
}
