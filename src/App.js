import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LANGUAGES } from "./i18n";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
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
  const [notifs, setNotifs]           = useState([]);

  const notifCount  = notifs.filter(n => !n.read).length;
  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  const markRead    = (id) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      // On sign-out (u === null) reset every screen flag so the app lands on
      // home/landing. showAuth is intentionally NOT touched here: during
      // phone-verification Firebase fires with a real user, and showAuth is
      // closed only via onAuthSuccess() — the !u branch never runs in that case.
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
      }
    });
    return () => unsub();
  }, []);

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

  if (user === undefined) {
    return (
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
  }

  if (showAuth) {
    return <Auth onAuthSuccess={() => setShowAuth(false)} />;
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
        notifications={notifs}
        onBack={() => window.history.back()}
        onMarkAllRead={markAllRead}
        onMarkRead={markRead}
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
