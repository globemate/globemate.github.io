import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LANGUAGES } from "./i18n";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
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

const t = (ms) => new Date(Date.now() - ms);
const INIT_NOTIFS = [
  { id:"n1", type:"message",  read:false, icon:"🌸", title:"Sofia Chen sent you a message",          body:"\"Maybe we could explore Kyoto together?\"",                    createdAt:t(3600000),   action:"Reply",            actionType:"chat"    },
  { id:"n2", type:"connect",  read:false, icon:"🗺️", title:"James Mitchell wants to connect",        body:"James is heading to Marrakech. You share 4 travel interests.",  createdAt:t(7200000),   action:"View profile",     actionType:"profile" },
  { id:"n3", type:"nearby",   read:false, icon:"✈️", title:"3 travelers are going to Kyoto in March",body:"Check who's visiting your next destination.",                   createdAt:t(18000000),  action:"Explore travelers", actionType:"explore"  },
  { id:"n4", type:"view",     read:true,  icon:"👀", title:"Your profile was viewed 12 times",        body:"Complete your bio to attract more connections.",                 createdAt:t(86400000),  action:"Edit profile",     actionType:"profile" },
  { id:"n5", type:"message",  read:true,  icon:"🎨", title:"Nina Schmidt replied to your message",   body:"\"Porto is underrated — best food in Europe honestly.\"",       createdAt:t(172800000), action:"Reply",            actionType:"chat"    },
  { id:"n6", type:"connect",  read:true,  icon:"🏄", title:"Lucas Oliveira accepted your connection", body:"Lucas is based in São Paulo and heading to Bali.",              createdAt:t(259200000), action:"Send message",     actionType:"chat"    },
  { id:"n7", type:"system",   read:true,  icon:"🌍", title:"Welcome to GlobeMate!",                  body:"Complete your profile to get better matches with travelers.",   createdAt:t(604800000), action:"Complete profile",  actionType:"profile" },
];

export default function App() {
  const { i18n } = useTranslation();
  const [user, setUser]               = useState(undefined);

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
  const [notifs, setNotifs]           = useState(INIT_NOTIFS);

  const notifCount  = notifs.filter(n => !n.read).length;
  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  const markRead    = (id) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      // Auth closes only when onAuthSuccess() is called explicitly —
      // never on auth-state change, so the phone-verification step
      // isn't skipped when Firebase creates the account mid-flow.
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
      setShowProfile(false);
      setShowExplore(false);
      setShowChat(false);
      setShowMatches(false);
      setShowMap(false);
      setShowNotif(false);
      setShowSettings(false);
      setShowPricing(false);
      if (screen === "profile") setShowProfile(true);
      else if (screen === "explore") setShowExplore(true);
      else if (screen === "chat") setShowChat(true);
      else if (screen === "matches") setShowMatches(true);
      else if (screen === "map") setShowMap(true);
      else if (screen === "notif") setShowNotif(true);
      else if (screen === "settings") setShowSettings(true);
      else if (screen === "pricing") setShowPricing(true);
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
    if (screen === "profile") setShowProfile(true);
    else if (screen === "explore") setShowExplore(true);
    else if (screen === "chat") setShowChat(true);
    else if (screen === "matches") setShowMatches(true);
    else if (screen === "map") setShowMap(true);
    else if (screen === "notif") setShowNotif(true);
    else if (screen === "settings") setShowSettings(true);
    else if (screen === "pricing") setShowPricing(true);
  };

  const nav = {
    onNotif:   () => goTo("notif"),
    notifCount,
    onProfile:  () => goTo("profile"),
    onExplore:  () => goTo("explore"),
    onChat:     () => goTo("chat"),
    onMatches:  () => goTo("matches"),
    onMap:      () => goTo("map"),
    onSettings: () => goTo("settings"),
    onPricing:  () => goTo("pricing"),
    onSignOut:  () => signOut(auth),
  };

  if (showPricing) {
    return <Pricing user={user} onBack={() => window.history.back()} {...nav} />;
  }

  if (showSettings && user) {
    return <Settings user={user} onBack={() => window.history.back()} {...nav} />;
  }

  if (showNotif && user) {
    return (
      <Notifications
        notifications={notifs}
        onBack={() => window.history.back()}
        onMarkAllRead={markAllRead}
        onMarkRead={markRead}
        {...nav}
      />
    );
  }

  if (showProfile && user) {
    return <Profile user={user} onBack={() => window.history.back()} {...nav} />;
  }

  if (showExplore) {
    return <Explore user={user} onBack={() => window.history.back()} {...nav} />;
  }

  if (showChat && user) {
    return <Chat user={user} onBack={() => window.history.back()} {...nav} />;
  }

  if (showMatches && user) {
    return <Matches user={user} onBack={() => window.history.back()} {...nav} />;
  }

  if (showMap && user) {
    return <Map user={user} onBack={() => window.history.back()} {...nav} />;
  }

  return (
    <GlobeMate
      user={user}
      onSignIn={() => setShowAuth(true)}
      {...nav}
    />
  );
}
