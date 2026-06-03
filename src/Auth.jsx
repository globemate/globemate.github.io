import { useState } from "react";
import { auth, googleProvider, facebookProvider } from "./firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";

/* ─────────────────────────────────────────
   Styles (dark / gold theme)
───────────────────────────────────────── */
const style = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  .auth-root {
    min-height: 100vh;
    background: #0a0905;
    display: grid;
    grid-template-columns: 1fr 1fr;
    font-family: 'DM Sans', sans-serif;
    font-weight: 300;
    color: #f5f0e8;
  }
  @media (max-width: 760px) {
    .auth-root  { grid-template-columns: 1fr; }
    .auth-panel { display: none; }
    .auth-form-wrap { padding: 40px 24px; }
  }

  /* ── Left panel ── */
  .auth-panel {
    position: relative;
    background: #0d0b07;
    display: flex; flex-direction: column; justify-content: center;
    padding: 72px 60px;
    border-right: 1px solid rgba(201,168,76,0.12);
    overflow: hidden;
  }
  .auth-panel::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 70% 60% at 30% 50%, rgba(201,168,76,0.08) 0%, transparent 70%);
    pointer-events: none;
  }
  .auth-panel-logo {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.9rem; font-weight: 300;
    letter-spacing: 0.12em; color: #e8c97a;
    margin-bottom: 56px;
  }
  .auth-panel-logo span { font-style: italic; }
  .auth-panel-h2 {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2.4rem, 3.5vw, 3.8rem);
    font-weight: 300; line-height: 1.08;
    color: #f5f0e8; margin-bottom: 24px;
  }
  .auth-panel-h2 em { font-style: italic; color: #e8c97a; }
  .auth-panel-sub {
    font-size: 0.9rem; line-height: 1.8;
    color: rgba(245,240,232,0.42); max-width: 340px; margin-bottom: 60px;
  }
  .auth-panel-stats { display: flex; gap: 40px; border-top: 1px solid rgba(201,168,76,0.15); padding-top: 28px; }
  .auth-stat-num  { font-family: 'Cormorant Garamond', serif; font-size: 1.9rem; font-weight: 300; color: #e8c97a; line-height: 1; margin-bottom: 4px; }
  .auth-stat-lbl  { font-size: 0.67rem; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(245,240,232,0.28); }

  /* ── Right form panel ── */
  .auth-form-wrap {
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    padding: 56px 48px; overflow-y: auto;
  }
  .auth-form-box { width: 100%; max-width: 380px; }

  .auth-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2.2rem; font-weight: 300;
    color: #f5f0e8; margin-bottom: 6px; line-height: 1.1;
  }
  .auth-title em { font-style: italic; color: #e8c97a; }
  .auth-subtitle { font-size: 0.82rem; color: rgba(245,240,232,0.36); margin-bottom: 36px; }

  /* Social buttons */
  .social-btn {
    width: 100%; display: flex; align-items: center; justify-content: center;
    gap: 12px; padding: 13px 20px; margin-bottom: 10px;
    background: rgba(245,240,232,0.04);
    border: 1px solid rgba(201,168,76,0.2);
    color: rgba(245,240,232,0.78);
    font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 400;
    cursor: pointer; transition: all 0.25s; box-sizing: border-box;
  }
  .social-btn:hover:not(:disabled) {
    border-color: rgba(201,168,76,0.5);
    color: #f5f0e8; background: rgba(201,168,76,0.08);
  }
  .social-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Divider */
  .auth-divider {
    display: flex; align-items: center; gap: 14px;
    margin: 22px 0; color: rgba(245,240,232,0.2);
    font-size: 0.68rem; letter-spacing: 0.18em; text-transform: uppercase;
  }
  .auth-divider::before, .auth-divider::after {
    content: ''; flex: 1; height: 1px; background: rgba(201,168,76,0.12);
  }

  /* Fields */
  .auth-label {
    display: block; font-size: 0.67rem;
    letter-spacing: 0.2em; text-transform: uppercase;
    color: rgba(245,240,232,0.38); margin-bottom: 8px;
  }
  .auth-input {
    width: 100%; background: rgba(245,240,232,0.04);
    border: 1px solid rgba(201,168,76,0.18); color: #f5f0e8;
    padding: 13px 16px; font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem; font-weight: 300; outline: none;
    transition: border-color 0.3s; box-sizing: border-box; margin-bottom: 16px;
  }
  .auth-input::placeholder { color: rgba(245,240,232,0.18); }
  .auth-input:focus { border-color: #c9a84c; }

  /* Error / info */
  .auth-error {
    background: rgba(180,60,60,0.1); border: 1px solid rgba(180,60,60,0.28);
    color: #f5a0a0; padding: 11px 14px; font-size: 0.8rem;
    line-height: 1.5; margin-bottom: 16px;
  }
  .auth-info {
    background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.28);
    color: #e8c97a; padding: 11px 14px; font-size: 0.8rem;
    line-height: 1.5; margin-bottom: 16px;
  }

  /* Submit */
  .auth-submit {
    width: 100%; background: #c9a84c; color: #0a0905; border: none;
    padding: 15px; font-family: 'DM Sans', sans-serif;
    font-size: 0.76rem; font-weight: 500;
    letter-spacing: 0.2em; text-transform: uppercase;
    cursor: pointer; transition: background 0.25s; margin-bottom: 18px;
  }
  .auth-submit:hover:not(:disabled) { background: #e8c97a; }
  .auth-submit:disabled { opacity: 0.45; cursor: not-allowed; }

  /* Footer links */
  .auth-row { display: flex; justify-content: space-between; align-items: center; }
  .auth-link {
    background: none; border: none; color: #c9a84c; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 0.78rem; font-weight: 500;
    padding: 0; transition: color 0.25s;
  }
  .auth-link:hover { color: #e8c97a; }
  .auth-muted { font-size: 0.78rem; color: rgba(245,240,232,0.3); }
`;

/* ─────────────────────────────────────────
   SVG icons
───────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
  </svg>
);

/* ─────────────────────────────────────────
   Error mapping
───────────────────────────────────────── */
const ERRORS = {
  "auth/invalid-credential":                        "Email o contraseña incorrectos.",
  "auth/user-not-found":                            "No existe cuenta con ese email.",
  "auth/wrong-password":                            "Contraseña incorrecta.",
  "auth/email-already-in-use":                      "Este email ya está registrado.",
  "auth/weak-password":                             "La contraseña debe tener al menos 6 caracteres.",
  "auth/invalid-email":                             "El formato del email no es válido.",
  "auth/too-many-requests":                         "Demasiados intentos. Espera un momento.",
  "auth/popup-closed-by-user":                      "Ventana cerrada. Inténtalo de nuevo.",
  "auth/cancelled-popup-request":                   "Solicitud cancelada.",
  "auth/account-exists-with-different-credential":  "Ya existe una cuenta con ese email usando otro método de login.",
  "auth/popup-blocked":                             "El navegador bloqueó el popup. Permite popups para este sitio.",
};

function getErrorMsg(err) {
  return ERRORS[err.code] || `Error: ${err.message}`;
}

/* ─────────────────────────────────────────
   Component
───────────────────────────────────────── */
export default function Auth({ onAuthSuccess }) {
  const [mode, setMode]         = useState("login"); // "login" | "register" | "reset"
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [info, setInfo]         = useState("");
  const [loading, setLoading]   = useState(false);

  const run = async (fn) => {
    setError(""); setInfo(""); setLoading(true);
    try {
      await fn();
      onAuthSuccess();
    } catch (err) {
      setError(getErrorMsg(err));
    } finally {
      setLoading(false);
    }
  };

  /* Social */
  const loginWithGoogle   = () => run(() => signInWithPopup(auth, googleProvider));
  const loginWithFacebook = () => run(() => signInWithPopup(auth, facebookProvider));

  /* Email / password */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === "login") {
      run(() => signInWithEmailAndPassword(auth, email, password));
    } else {
      run(() => createUserWithEmailAndPassword(auth, email, password));
    }
  };

  /* Password reset */
  const handleReset = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError("Escribe tu email primero."); return; }
    setError(""); setInfo(""); setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setInfo("Te enviamos un email para restablecer tu contraseña.");
    } catch (err) {
      setError(getErrorMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next) => { setMode(next); setError(""); setInfo(""); };

  return (
    <>
      <style>{style}</style>
      <div className="auth-root">

        {/* ── Left decorative panel ── */}
        <div className="auth-panel">
          <div className="auth-panel-logo">Globe<span>Mate</span></div>
          <h2 className="auth-panel-h2">
            Where journeys<br /><em>become connections</em>
          </h2>
          <p className="auth-panel-sub">
            Join a curated community of passionate travelers. Find companions
            who share your destinations, your curiosity, and your way of
            seeing the world.
          </p>
          <div className="auth-panel-stats">
            {[
              { num: "124K", lbl: "Travelers" },
              { num: "89",   lbl: "Countries" },
              { num: "4.2K", lbl: "Matches / mo" },
            ].map((s) => (
              <div key={s.lbl}>
                <div className="auth-stat-num">{s.num}</div>
                <div className="auth-stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Form panel ── */}
        <div className="auth-form-wrap">
          <div className="auth-form-box">

            {/* Title */}
            <h2 className="auth-title">
              {mode === "login"    && <>Welcome <em>back</em></>}
              {mode === "register" && <>Create your <em>account</em></>}
              {mode === "reset"    && <>Reset your <em>password</em></>}
            </h2>
            <p className="auth-subtitle">
              {mode === "login"    && "Sign in to continue your journey"}
              {mode === "register" && "Begin your travel story today"}
              {mode === "reset"    && "We'll send you a reset link"}
            </p>

            {/* Social — only on login / register */}
            {mode !== "reset" && (
              <>
                <button className="social-btn" disabled={loading} onClick={loginWithGoogle}>
                  <GoogleIcon /> Continue with Google
                </button>
                <button className="social-btn" disabled={loading} onClick={loginWithFacebook}>
                  <FacebookIcon /> Continue with Facebook
                </button>
                <div className="auth-divider">or continue with email</div>
              </>
            )}

            {/* Feedback */}
            {error && <div className="auth-error">{error}</div>}
            {info  && <div className="auth-info">{info}</div>}

            {/* Email form */}
            <form onSubmit={mode === "reset" ? handleReset : handleSubmit}>
              <label className="auth-label">Email address</label>
              <input
                className="auth-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />

              {mode !== "reset" && (
                <>
                  <label className="auth-label">Password</label>
                  <input
                    className="auth-input"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </>
              )}

              <button className="auth-submit" type="submit" disabled={loading}>
                {loading
                  ? "Please wait…"
                  : mode === "login"    ? "Sign in"
                  : mode === "register" ? "Create account"
                  : "Send reset email"}
              </button>
            </form>

            {/* Footer links */}
            <div className="auth-row">
              {mode === "login" && (
                <>
                  <button className="auth-link" onClick={() => switchMode("reset")}>
                    Forgot password?
                  </button>
                  <span className="auth-muted">
                    No account?{" "}
                    <button className="auth-link" onClick={() => switchMode("register")}>
                      Sign up
                    </button>
                  </span>
                </>
              )}
              {mode === "register" && (
                <span className="auth-muted">
                  Already have an account?{" "}
                  <button className="auth-link" onClick={() => switchMode("login")}>
                    Sign in
                  </button>
                </span>
              )}
              {mode === "reset" && (
                <button className="auth-link" onClick={() => switchMode("login")}>
                  ← Back to sign in
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
