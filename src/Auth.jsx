import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LangButton } from "./LanguageSelector";
import { auth, googleProvider, facebookProvider, twitterProvider, db } from "./firebase";
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  linkWithPhoneNumber,
  PhoneAuthProvider,
  linkWithCredential,
  getAdditionalUserInfo,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

/* ─────────────────────────────────────────
   Country codes
───────────────────────────────────────── */
const COUNTRY_CODES = [
  { dial:"+1",   name:"EE.UU. / Canadá",     flag:"🇺🇸" },
  { dial:"+34",  name:"España",               flag:"🇪🇸" },
  { dial:"+52",  name:"México",               flag:"🇲🇽" },
  { dial:"+54",  name:"Argentina",            flag:"🇦🇷" },
  { dial:"+55",  name:"Brasil",               flag:"🇧🇷" },
  { dial:"+56",  name:"Chile",                flag:"🇨🇱" },
  { dial:"+57",  name:"Colombia",             flag:"🇨🇴" },
  { dial:"+51",  name:"Perú",                 flag:"🇵🇪" },
  { dial:"+58",  name:"Venezuela",            flag:"🇻🇪" },
  { dial:"+593", name:"Ecuador",              flag:"🇪🇨" },
  { dial:"+595", name:"Paraguay",             flag:"🇵🇾" },
  { dial:"+598", name:"Uruguay",              flag:"🇺🇾" },
  { dial:"+591", name:"Bolivia",              flag:"🇧🇴" },
  { dial:"+502", name:"Guatemala",            flag:"🇬🇹" },
  { dial:"+506", name:"Costa Rica",           flag:"🇨🇷" },
  { dial:"+503", name:"El Salvador",          flag:"🇸🇻" },
  { dial:"+504", name:"Honduras",             flag:"🇭🇳" },
  { dial:"+505", name:"Nicaragua",            flag:"🇳🇮" },
  { dial:"+507", name:"Panamá",               flag:"🇵🇦" },
  { dial:"+53",  name:"Cuba",                 flag:"🇨🇺" },
  { dial:"+1809",name:"Rep. Dominicana",      flag:"🇩🇴" },
  { dial:"+44",  name:"Reino Unido",          flag:"🇬🇧" },
  { dial:"+33",  name:"Francia",              flag:"🇫🇷" },
  { dial:"+49",  name:"Alemania",             flag:"🇩🇪" },
  { dial:"+39",  name:"Italia",               flag:"🇮🇹" },
  { dial:"+351", name:"Portugal",             flag:"🇵🇹" },
  { dial:"+31",  name:"Países Bajos",         flag:"🇳🇱" },
  { dial:"+32",  name:"Bélgica",              flag:"🇧🇪" },
  { dial:"+41",  name:"Suiza",                flag:"🇨🇭" },
  { dial:"+43",  name:"Austria",              flag:"🇦🇹" },
  { dial:"+45",  name:"Dinamarca",            flag:"🇩🇰" },
  { dial:"+46",  name:"Suecia",               flag:"🇸🇪" },
  { dial:"+47",  name:"Noruega",              flag:"🇳🇴" },
  { dial:"+358", name:"Finlandia",            flag:"🇫🇮" },
  { dial:"+48",  name:"Polonia",              flag:"🇵🇱" },
  { dial:"+7",   name:"Rusia",                flag:"🇷🇺" },
  { dial:"+380", name:"Ucrania",              flag:"🇺🇦" },
  { dial:"+30",  name:"Grecia",               flag:"🇬🇷" },
  { dial:"+36",  name:"Hungría",              flag:"🇭🇺" },
  { dial:"+40",  name:"Rumania",              flag:"🇷🇴" },
  { dial:"+420", name:"Rep. Checa",           flag:"🇨🇿" },
  { dial:"+81",  name:"Japón",               flag:"🇯🇵" },
  { dial:"+82",  name:"Corea del Sur",        flag:"🇰🇷" },
  { dial:"+86",  name:"China",                flag:"🇨🇳" },
  { dial:"+91",  name:"India",                flag:"🇮🇳" },
  { dial:"+61",  name:"Australia",            flag:"🇦🇺" },
  { dial:"+64",  name:"Nueva Zelanda",        flag:"🇳🇿" },
  { dial:"+27",  name:"Sudáfrica",            flag:"🇿🇦" },
  { dial:"+20",  name:"Egipto",               flag:"🇪🇬" },
  { dial:"+212", name:"Marruecos",            flag:"🇲🇦" },
  { dial:"+90",  name:"Turquía",              flag:"🇹🇷" },
  { dial:"+972", name:"Israel",               flag:"🇮🇱" },
  { dial:"+971", name:"Emiratos Árabes",      flag:"🇦🇪" },
  { dial:"+966", name:"Arabia Saudí",         flag:"🇸🇦" },
  { dial:"+65",  name:"Singapur",             flag:"🇸🇬" },
  { dial:"+66",  name:"Tailandia",            flag:"🇹🇭" },
  { dial:"+62",  name:"Indonesia",            flag:"🇮🇩" },
  { dial:"+60",  name:"Malasia",              flag:"🇲🇾" },
  { dial:"+63",  name:"Filipinas",            flag:"🇵🇭" },
  { dial:"+84",  name:"Vietnam",              flag:"🇻🇳" },
  { dial:"+92",  name:"Pakistán",             flag:"🇵🇰" },
];

/* ─────────────────────────────────────────
   Styles
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
    position: relative;
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    padding: 56px 48px; overflow-y: auto;
  }
  .auth-lang-btn {
    position: absolute; top: 20px; right: 20px;
  }
  .lang-btn { display:inline-flex !important; align-items:center; gap:6px; background:none; border:1px solid rgba(201,168,76,0.35); color:#e8c97a; cursor:pointer; font-family:inherit; font-size:0.72rem; letter-spacing:0.1em; padding:6px 10px; white-space:nowrap; flex-shrink:0; line-height:1; outline:none; transition:border-color 0.22s,color 0.22s; }
  .lang-btn:hover { border-color:#c9a84c; color:#c9a84c; }
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
  .auth-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
  .auth-link {
    background: none; border: none; color: #c9a84c; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 0.78rem; font-weight: 500;
    padding: 0; transition: color 0.25s;
  }
  .auth-link:hover { color: #e8c97a; }
  .auth-link:disabled { opacity: 0.4; cursor: not-allowed; }
  .auth-muted { font-size: 0.78rem; color: rgba(245,240,232,0.3); }

  /* ── Phone step ── */
  .auth-phone-row {
    display: flex; gap: 8px; margin-bottom: 16px;
  }
  .auth-cc-sel {
    width: 128px; flex-shrink: 0;
    background: rgba(245,240,232,0.04);
    border: 1px solid rgba(201,168,76,0.18); color: #f5f0e8;
    padding: 13px 10px; font-family: 'DM Sans', sans-serif;
    font-size: 0.84rem; font-weight: 300; outline: none; cursor: pointer;
    transition: border-color 0.3s;
  }
  .auth-cc-sel option { background: #141209; }
  .auth-cc-sel:focus { border-color: #c9a84c; }
  .auth-phone-inp {
    flex: 1;
    background: rgba(245,240,232,0.04);
    border: 1px solid rgba(201,168,76,0.18); color: #f5f0e8;
    padding: 13px 16px; font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem; font-weight: 300; outline: none;
    transition: border-color 0.3s; min-width: 0;
  }
  .auth-phone-inp::placeholder { color: rgba(245,240,232,0.18); }
  .auth-phone-inp:focus { border-color: #c9a84c; }

  .auth-phone-note {
    font-size: 0.73rem; color: rgba(245,240,232,0.28);
    margin-bottom: 20px; line-height: 1.5;
  }

  /* ── SMS code boxes ── */
  .auth-code-row {
    display: flex; gap: 10px; justify-content: center;
    margin: 8px 0 24px;
  }
  .auth-code-box {
    width: 52px; height: 64px; flex-shrink: 0;
    background: rgba(245,240,232,0.04);
    border: 1px solid rgba(201,168,76,0.18); color: #f5f0e8;
    font-family: 'Cormorant Garamond', serif;
    font-size: 2rem; font-weight: 300;
    text-align: center; outline: none;
    transition: border-color 0.2s, background 0.2s;
    caret-color: #c9a84c;
  }
  .auth-code-box:focus { border-color: #c9a84c; background: rgba(201,168,76,0.06); }
  .auth-code-box.filled { border-color: rgba(201,168,76,0.45); }
  @media (max-width: 400px) {
    .auth-code-box { width: 42px; height: 54px; font-size: 1.6rem; gap: 7px; }
    .auth-code-row { gap: 7px; }
  }

  .auth-code-dest {
    font-size: 0.82rem; color: rgba(245,240,232,0.45);
    text-align: center; margin-bottom: 8px;
  }
  .auth-code-dest strong { color: #e8c97a; }

  /* ── Step indicator ── */
  .auth-steps {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 32px;
  }
  .auth-step-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: rgba(201,168,76,0.2);
    transition: background 0.25s;
  }
  .auth-step-dot.active { background: #c9a84c; }
  .auth-step-dot.done { background: rgba(201,168,76,0.45); }
  .auth-step-line { flex: 1; height: 1px; background: rgba(201,168,76,0.12); }

  /* ── Security badge ── */
  .auth-secure-badge {
    display: flex; align-items: center; gap: 8px;
    background: rgba(201,168,76,0.06); border: 1px solid rgba(201,168,76,0.15);
    padding: 10px 14px; margin-bottom: 24px; font-size: 0.77rem;
    color: rgba(245,240,232,0.45); line-height: 1.5;
  }
  .auth-secure-badge span { color: #c9a84c; font-size: 1rem; }
`;

/* ─────────────────────────────────────────
   Error maps
───────────────────────────────────────── */
const AUTH_ERRORS = {
  "auth/invalid-credential":                        "Email o contraseña incorrectos.",
  "auth/user-not-found":                            "No existe cuenta con ese email.",
  "auth/wrong-password":                            "Contraseña incorrecta.",
  "auth/email-already-in-use":                      "Este email ya está registrado.",
  "auth/weak-password":                             "La contraseña debe tener al menos 6 caracteres.",
  "auth/invalid-email":                             "El formato del email no es válido.",
  "auth/too-many-requests":                         "Demasiados intentos. Espera un momento.",
  "auth/popup-closed-by-user":                      "Ventana cerrada. Inténtalo de nuevo.",
  "auth/cancelled-popup-request":                   "Solicitud cancelada.",
  "auth/account-exists-with-different-credential":  "Ya existe una cuenta con ese email usando otro método de inicio de sesión.",
  "auth/popup-blocked":                             "El navegador bloqueó el popup. Permite popups para este sitio.",
  "auth/credential-already-in-use":                "Esta cuenta de X ya está vinculada a otro usuario.",
  "auth/invalid-credential":                        "Credencial inválida. Vuelve a intentarlo.",
};

const PHONE_ERRORS = {
  "auth/invalid-phone-number":        "Número de teléfono inválido. Incluye el código de país correcto.",
  "auth/too-many-requests":           "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
  "auth/invalid-verification-code":   "Código incorrecto. Verifícalo e inténtalo de nuevo.",
  "auth/code-expired":                "El código ha expirado. Solicita uno nuevo.",
  "auth/credential-already-in-use":   "Este número ya está vinculado a otra cuenta.",
  "auth/provider-already-linked":     "Tu cuenta ya tiene un teléfono verificado.",
  "auth/missing-phone-number":        "Por favor ingresa tu número de teléfono.",
  "auth/captcha-check-failed":        "Error de verificación. Recarga la página e inténtalo de nuevo.",
  "auth/quota-exceeded":              "Límite de SMS superado. Inténtalo más tarde.",
  "auth/missing-verification-code":   "Ingresa el código de verificación.",
  "auth/missing-verification-id":     "Error de sesión. Solicita un nuevo código.",
  "auth/network-request-failed":      "Error de red. Verifica tu conexión.",
  "auth/user-disabled":               "Esta cuenta ha sido deshabilitada.",
  "auth/operation-not-allowed":       "El inicio de sesión con teléfono no está habilitado. Contacta con soporte.",
  "auth/internal-error":              "Error interno de Firebase. Recarga la página e inténtalo de nuevo.",
  "auth/missing-app-credential":      "Error de verificación de la app. Recarga la página e inténtalo de nuevo.",
  "auth/requires-recent-login":       "Tu sesión ha expirado. Vuelve a iniciar sesión e inténtalo de nuevo.",
};

const getAuthError  = (err) => AUTH_ERRORS[err.code]  || `Error: ${err.message}`;
const getPhoneError = (code) => PHONE_ERRORS[code]     || "Error inesperado. Inténtalo de nuevo.";

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

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L2.25 2.25h6.906l4.256 5.637 4.832-5.637zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
  </svg>
);

/* ─────────────────────────────────────────
   Component
───────────────────────────────────────── */
export default function Auth({ onAuthSuccess }) {
  const showTwitterLogin = true;

  const { t } = useTranslation();
  const [mode, setMode]         = useState("login"); // login | register | reset | phone | phone-code

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [info, setInfo]         = useState("");
  const [loading, setLoading]   = useState(false);

  const [pendingEmail, setPendingEmail]       = useState("");
  const [pendingPassword, setPendingPassword] = useState("");

  const [countryCode, setCountryCode]     = useState("+34");
  const [phoneNumber, setPhoneNumber]     = useState("");
  const [confirmResult, setConfirmResult] = useState(null);
  const [codeDigits, setCodeDigits]       = useState(["","","","","",""]);
  const [phoneLoading, setPhoneLoading]   = useState(false);
  const [phoneError, setPhoneError]       = useState("");
  const recaptchaRef = useRef(null);

  useEffect(() => {
    return () => {
      if (recaptchaRef.current) {
        try { recaptchaRef.current.clear(); } catch (_) {}
        recaptchaRef.current = null;
      }
    };
  }, []);

  const switchMode = (next) => {
    setMode(next); setError(""); setInfo("");
    setPhoneError("");
  };

  const loginWithSocial = async (provider) => {
    setError(""); setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const info   = getAdditionalUserInfo(result);
      if (info?.isNewUser) {
        setMode("phone");
      } else {
        onAuthSuccess();
      }
    } catch (err) {
      setError(getAuthError(err));
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setInfo("");
    if (mode === "login") {
      setLoading(true);
      try {
        await signInWithEmailAndPassword(auth, email, password);
        onAuthSuccess();
      } catch (err) {
        setError(getAuthError(err));
      }
      setLoading(false);
    } else {
      setLoading(true);
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        setPendingEmail(email);
        setPendingPassword(password);
        setMode("phone");
      } catch (err) {
        setError(getAuthError(err));
      }
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError(t("auth.emailLabel") + " required"); return; }
    setError(""); setInfo(""); setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setInfo(t("auth.sendResetBtn") + " ✓");
    } catch (err) {
      setError(getAuthError(err));
    }
    setLoading(false);
  };

  const getOrCreateVerifier = () => {
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {},
        "expired-callback": () => {
          try { recaptchaRef.current?.clear(); } catch (_) {}
          recaptchaRef.current = null;
        },
      });
    }
    return recaptchaRef.current;
  };

  const sendSMS = async () => {
    const digits = phoneNumber.replace(/\D/g, "");
    if (digits.length < 6) {
      setPhoneError(t("auth.phoneNote"));
      return;
    }
    const fullPhone = countryCode + digits;
    setPhoneLoading(true);
    setPhoneError("");
    try {
      const verifier = getOrCreateVerifier();
      const result   = auth.currentUser
        ? await linkWithPhoneNumber(auth.currentUser, fullPhone, verifier)
        : await signInWithPhoneNumber(auth, fullPhone, verifier);
      // Limpiar el verifier antes de que React re-renderice al cambiar de paso;
      // si no, reCAPTCHA intenta limpiar sus nodos DOM de forma asíncrona y
      // encuentra nulls → "Cannot read properties of null (reading 'style')"
      try { recaptchaRef.current?.clear(); } catch (_) {}
      recaptchaRef.current = null;
      setConfirmResult(result);
      setMode("phone-code");
    } catch (err) {
      console.error("[sendSMS] err.code:", err.code, "| err.message:", err.message, err);
      try { recaptchaRef.current?.clear(); } catch (_) {}
      recaptchaRef.current = null;
      setPhoneError(getPhoneError(err.code));
    }
    setPhoneLoading(false);
  };

  const verifyCode = async (codeStr) => {
    const code = codeStr ?? codeDigits.join("");
    if (code.length !== 6 || !confirmResult) return;
    setPhoneLoading(true);
    setPhoneError("");
    try {
      let uid;
      if (pendingEmail) {
        await confirmResult.confirm(code);
        await auth.currentUser.getIdToken(true);
        uid = auth.currentUser.uid;
      } else {
        if (!auth.currentUser) { setPhoneError("Sesión expirada. Vuelve a intentarlo."); setPhoneLoading(false); return; }
        const phoneCred = PhoneAuthProvider.credential(confirmResult.verificationId, code);
        await linkWithCredential(auth.currentUser, phoneCred);
        uid = auth.currentUser.uid;
      }
      await setDoc(doc(db, "users", uid), {
        phone: countryCode + phoneNumber.replace(/\D/g, ""),
        phoneVerified: true,
        isVerified: false,
      }, { merge: true });
      onAuthSuccess();
    } catch (err) {
      console.error("[verifyCode] err.code:", err.code, "| err.message:", err.message, err);
      const phoneMsg = getPhoneError(err.code);
      setPhoneError(
        phoneMsg !== "Error inesperado. Inténtalo de nuevo." ? phoneMsg : getAuthError(err)
      );
      if (err.code === "auth/invalid-verification-code" || err.code === "auth/code-expired") {
        setCodeDigits(["","","","","",""]);
        setTimeout(() => document.getElementById("code-0")?.focus(), 50);
      }
    }
    setPhoneLoading(false);
  };

  const handleDigit = (i, val) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next  = [...codeDigits];
    next[i]     = digit;
    setCodeDigits(next);
    if (digit && i < 5) document.getElementById(`code-${i + 1}`)?.focus();
    if (digit && i === 5) {
      const full = next.join("");
      if (full.length === 6) verifyCode(full);
    }
  };

  const handleDigitKey = (i, e) => {
    if (e.key === "Backspace") {
      if (!codeDigits[i] && i > 0) {
        const next = [...codeDigits];
        next[i - 1] = "";
        setCodeDigits(next);
        document.getElementById(`code-${i - 1}`)?.focus();
      }
    } else if (e.key === "ArrowLeft"  && i > 0) document.getElementById(`code-${i - 1}`)?.focus();
    else if   (e.key === "ArrowRight" && i < 5) document.getElementById(`code-${i + 1}`)?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = ["","","","","",""];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] || "";
    setCodeDigits(next);
    document.getElementById(`code-${Math.min(pasted.length, 5)}`)?.focus();
    if (pasted.length === 6) verifyCode(pasted);
  };

  const resendSMS = async () => {
    setCodeDigits(["","","","","",""]);
    setPhoneError("");
    setMode("phone");
  };

  const isPhoneStep = mode === "phone" || mode === "phone-code";

  return (
    <>
      <style>{style}</style>
      <div id="recaptcha-container" />

      <div className="auth-root">

        {/* ── Left decorative panel ── */}
        <div className="auth-panel">
          <div className="auth-panel-logo">Globe<span>Mate</span></div>
          <h2 className="auth-panel-h2">
            {isPhoneStep
              ? t("auth.almostReady")
              : <>{t("auth.whereJourneys")}<br /><em>{t("auth.becomeConnections")}</em></>
            }
          </h2>
          <p className="auth-panel-sub">
            {isPhoneStep
              ? t("auth.panelSubtitlePhone")
              : t("auth.panelSubtitle")
            }
          </p>
          <div className="auth-panel-stats">
            {[
              { num: "124K", lbl: t("auth.travelers") },
              { num: "89",   lbl: t("auth.countries") },
              { num: "4.2K", lbl: t("auth.matchesPerMonth") },
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
          <div className="auth-lang-btn">
            <LangButton align="right" />
          </div>
          <div className="auth-form-box">

            {isPhoneStep && (
              <div className="auth-steps">
                <div className="auth-step-dot done" />
                <div className="auth-step-line" />
                <div className={`auth-step-dot ${mode === "phone" ? "active" : "done"}`} />
                <div className="auth-step-line" />
                <div className={`auth-step-dot ${mode === "phone-code" ? "active" : ""}`} />
              </div>
            )}

            {/* ── Title ── */}
            <h2 className="auth-title">
              {mode === "login"      && t("auth.welcomeBack")}
              {mode === "register"   && t("auth.createAccount")}
              {mode === "reset"      && t("auth.resetPassword")}
              {mode === "phone"      && t("auth.verifyPhone")}
              {mode === "phone-code" && t("auth.enterCode")}
            </h2>
            <p className="auth-subtitle">
              {mode === "login"      && t("auth.signInSubtitle")}
              {mode === "register"   && t("auth.registerSubtitle")}
              {mode === "reset"      && t("auth.resetSubtitle")}
              {mode === "phone"      && t("auth.phoneSubtitle")}
              {mode === "phone-code" && t("auth.codeSubtitle", { phone: `${countryCode} ${phoneNumber}` })}
            </p>

            {/* ── MODE: login / register ── */}
            {(mode === "login" || mode === "register") && (
              <>
                <button className="social-btn" disabled={loading} onClick={() => loginWithSocial(googleProvider)}>
                  <GoogleIcon /> {t("auth.continueGoogle")}
                </button>
                <button className="social-btn" disabled={loading} onClick={() => loginWithSocial(facebookProvider)}>
                  <FacebookIcon /> {t("auth.continueFacebook")}
                </button>
                {showTwitterLogin && (
                  <button className="social-btn" disabled={loading} onClick={() => loginWithSocial(twitterProvider)}>
                    <XIcon /> Continuar con X
                  </button>
                )}
                <div className="auth-divider">{t("auth.orEmail")}</div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                  <label className="auth-label">{t("auth.emailLabel")}</label>
                  <input
                    className="auth-input"
                    type="email"
                    placeholder={t("auth.emailPlaceholder")}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                  <label className="auth-label">{t("auth.passwordLabel")}</label>
                  <input
                    className="auth-input"
                    type="password"
                    placeholder={t("auth.passwordPlaceholder")}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button className="auth-submit" type="submit" disabled={loading}>
                    {loading
                      ? t("common.pleaseWait")
                      : mode === "login" ? t("auth.signInBtn") : t("auth.createAccountBtn")
                    }
                  </button>
                </form>

                <div className="auth-row">
                  {mode === "login" ? (
                    <>
                      <button className="auth-link" onClick={() => switchMode("reset")}>
                        {t("auth.forgotPassword")}
                      </button>
                      <span className="auth-muted">
                        {t("auth.noAccount")}{" "}
                        <button className="auth-link" onClick={() => switchMode("register")}>
                          {t("auth.signUp")}
                        </button>
                      </span>
                    </>
                  ) : (
                    <span className="auth-muted">
                      {t("auth.alreadyAccount")}{" "}
                      <button className="auth-link" onClick={() => switchMode("login")}>
                        {t("auth.signInBtn")}
                      </button>
                    </span>
                  )}
                </div>
              </>
            )}

            {/* ── MODE: reset ── */}
            {mode === "reset" && (
              <>
                {error && <div className="auth-error">{error}</div>}
                {info  && <div className="auth-info">{info}</div>}
                <form onSubmit={handleReset}>
                  <label className="auth-label">{t("auth.emailLabel")}</label>
                  <input
                    className="auth-input"
                    type="email"
                    placeholder={t("auth.emailPlaceholder")}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                  <button className="auth-submit" type="submit" disabled={loading}>
                    {loading ? t("common.pleaseWait") : t("auth.sendResetBtn")}
                  </button>
                </form>
                <div className="auth-row">
                  <button className="auth-link" onClick={() => switchMode("login")}>
                    {t("auth.backToSignIn")}
                  </button>
                </div>
              </>
            )}

            {/* ── MODE: phone (enter number) ── */}
            {mode === "phone" && (
              <>
                <div className="auth-secure-badge">
                  <span>🔒</span>
                  {t("auth.securityBadge")}
                </div>

                {phoneError && <div className="auth-error">{phoneError}</div>}

                <label className="auth-label">{t("auth.phoneLabel")}</label>
                <div className="auth-phone-row">
                  <select
                    className="auth-cc-sel"
                    value={countryCode}
                    onChange={e => setCountryCode(e.target.value)}
                  >
                    {COUNTRY_CODES.map(c => (
                      <option key={c.dial} value={c.dial}>
                        {c.flag} {c.dial}
                      </option>
                    ))}
                  </select>
                  <input
                    className="auth-phone-inp"
                    type="tel"
                    placeholder={t("auth.phonePlaceholder")}
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendSMS()}
                    autoFocus
                  />
                </div>
                <p className="auth-phone-note">{t("auth.phoneNote")}</p>

                <button
                  className="auth-submit"
                  onClick={sendSMS}
                  disabled={phoneLoading || phoneNumber.replace(/\D/g, "").length < 6}
                >
                  {phoneLoading ? t("auth.sending") : t("auth.sendSmsBtn")}
                </button>
              </>
            )}

            {/* ── MODE: phone-code (enter 6-digit code) ── */}
            {mode === "phone-code" && (
              <>
                <p className="auth-code-dest">
                  {t("auth.codeSubtitle", { phone: `${countryCode} ${phoneNumber}` })}
                </p>

                {phoneError && <div className="auth-error">{phoneError}</div>}

                <div className="auth-code-row">
                  {codeDigits.map((d, i) => (
                    <input
                      key={i}
                      id={`code-${i}`}
                      className={`auth-code-box${d ? " filled" : ""}`}
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      maxLength={2}
                      value={d}
                      onChange={e => handleDigit(i, e.target.value)}
                      onKeyDown={e => handleDigitKey(i, e)}
                      onPaste={i === 0 ? handlePaste : undefined}
                      autoFocus={i === 0}
                      disabled={phoneLoading}
                    />
                  ))}
                </div>

                <button
                  className="auth-submit"
                  onClick={() => verifyCode(undefined)}
                  disabled={phoneLoading || codeDigits.join("").length !== 6}
                >
                  {phoneLoading ? t("auth.verifying") : t("auth.verifyBtn")}
                </button>

                <div className="auth-row" style={{ justifyContent:"center", gap:16 }}>
                  <button className="auth-link" onClick={resendSMS} disabled={phoneLoading}>
                    {t("auth.changeNumber")}
                  </button>
                  <button className="auth-link" onClick={sendSMS} disabled={phoneLoading}>
                    {t("auth.resendCode")}
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
