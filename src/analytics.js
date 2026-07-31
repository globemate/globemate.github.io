import { getAnalytics, isSupported, logEvent as fbLogEvent } from "firebase/analytics";
import app from "./firebase";

let _analytics = null;

export function initAnalytics() {
  if (_analytics) return;
  isSupported()
    .then(supported => { if (supported) _analytics = getAnalytics(app); })
    .catch(() => {});
}

// If consent was already given in a previous session, initialize immediately.
if (typeof localStorage !== "undefined" && localStorage.getItem("cookie_consent") === "accepted") {
  initAnalytics();
}

// Safe wrapper — never throws, never sends PII.
export function logEvent(eventName, params = {}) {
  if (!_analytics) return;
  try { fbLogEvent(_analytics, eventName, params); } catch {}
}
