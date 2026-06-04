import { useState, useEffect, useRef } from "react";
import { db, storage } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";

const INTERESTS = [
  "🏔️ Mountains","🏖️ Beaches","🏛️ History","🍜 Food",
  "🎭 Culture","🌿 Nature","🎵 Music","📸 Photography",
  "🧘 Wellness","🎪 Festivals","🍷 Wine","🏄 Adventure",
  "🎨 Art","🌆 Cities","🚂 Train travel","🤿 Diving",
  "🧗 Escalada","🥘 Gastronomía local","🙏 Espiritual",
  "🚞 Rutas escénicas","🎬 Cine & locaciones","💪 Gimnasio",
  "⚽ Deportes","🏊 Natación","🎾 Tenis","🏀 Basketball",
  "⛷️ Esquí","🧘‍♀️ Yoga","🏋️ Crossfit","🥊 Kickboxing",
  "🍺 Craft beer","☕ Café culture","🦁 Safari","🌋 Volcanes",
];

const STYLES = [
  "🎒 Backpacker","✨ Luxury","🏕️ Camping","🏨 Boutique hotels",
  "🚐 Road trips","🛳️ Cruises","🌱 Eco-travel","⚡ Fast-paced",
];

const ALL_LANGS = [
  "English","Spanish","French","Portuguese","Italian",
  "German","Japanese","Mandarin","Arabic","Russian","Hindi","Korean",
];

const LEVELS = ["Basic","Conversational","Fluent","Native"];

const CONTINENTS = [
  { id:"europa", name:"Europa", emoji:"🏰", regions:[
    { name:"Europa Occidental", countries:[
      {code:"AT",name:"Austria",flag:"🇦🇹"},{code:"BE",name:"Bélgica",flag:"🇧🇪"},
      {code:"FR",name:"Francia",flag:"🇫🇷"},{code:"DE",name:"Alemania",flag:"🇩🇪"},
      {code:"IE",name:"Irlanda",flag:"🇮🇪"},{code:"LI",name:"Liechtenstein",flag:"🇱🇮"},
      {code:"LU",name:"Luxemburgo",flag:"🇱🇺"},{code:"MC",name:"Mónaco",flag:"🇲🇨"},
      {code:"NL",name:"Países Bajos",flag:"🇳🇱"},{code:"CH",name:"Suiza",flag:"🇨🇭"},
      {code:"ENG",name:"Inglaterra",flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿"},{code:"SCT",name:"Escocia",flag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿"},
      {code:"WLS",name:"Gales",flag:"🏴󠁧󠁢󠁷󠁬󠁳󠁿"},{code:"NIR",name:"Irlanda del Norte",flag:"🇬🇧"},
    ]},
    { name:"Europa del Norte", countries:[
      {code:"DK",name:"Dinamarca",flag:"🇩🇰"},{code:"EE",name:"Estonia",flag:"🇪🇪"},
      {code:"FI",name:"Finlandia",flag:"🇫🇮"},{code:"IS",name:"Islandia",flag:"🇮🇸"},
      {code:"LV",name:"Letonia",flag:"🇱🇻"},{code:"LT",name:"Lituania",flag:"🇱🇹"},
      {code:"NO",name:"Noruega",flag:"🇳🇴"},{code:"SE",name:"Suecia",flag:"🇸🇪"},
    ]},
    { name:"Europa del Sur", countries:[
      {code:"AL",name:"Albania",flag:"🇦🇱"},{code:"AD",name:"Andorra",flag:"🇦🇩"},
      {code:"BA",name:"Bosnia y Herzegovina",flag:"🇧🇦"},{code:"HR",name:"Croacia",flag:"🇭🇷"},
      {code:"CY",name:"Chipre",flag:"🇨🇾"},{code:"GR",name:"Grecia",flag:"🇬🇷"},
      {code:"IT",name:"Italia",flag:"🇮🇹"},{code:"XK",name:"Kosovo",flag:"🇽🇰"},
      {code:"MT",name:"Malta",flag:"🇲🇹"},{code:"ME",name:"Montenegro",flag:"🇲🇪"},
      {code:"MK",name:"Macedonia del Norte",flag:"🇲🇰"},{code:"PT",name:"Portugal",flag:"🇵🇹"},
      {code:"SM",name:"San Marino",flag:"🇸🇲"},{code:"RS",name:"Serbia",flag:"🇷🇸"},
      {code:"SI",name:"Eslovenia",flag:"🇸🇮"},{code:"ES",name:"España",flag:"🇪🇸"},
      {code:"VA",name:"Vaticano",flag:"🇻🇦"},
    ]},
    { name:"Europa del Este", countries:[
      {code:"BY",name:"Bielorrusia",flag:"🇧🇾"},{code:"BG",name:"Bulgaria",flag:"🇧🇬"},
      {code:"CZ",name:"Rep. Checa",flag:"🇨🇿"},{code:"HU",name:"Hungría",flag:"🇭🇺"},
      {code:"MD",name:"Moldavia",flag:"🇲🇩"},{code:"PL",name:"Polonia",flag:"🇵🇱"},
      {code:"RO",name:"Rumania",flag:"🇷🇴"},{code:"RU",name:"Rusia",flag:"🇷🇺"},
      {code:"SK",name:"Eslovaquia",flag:"🇸🇰"},{code:"UA",name:"Ucrania",flag:"🇺🇦"},
    ]},
  ]},
  { id:"asia", name:"Asia", emoji:"🏯", regions:[
    { name:"Asia del Este", countries:[
      {code:"CN",name:"China",flag:"🇨🇳"},{code:"HK",name:"Hong Kong",flag:"🇭🇰"},
      {code:"JP",name:"Japón",flag:"🇯🇵"},{code:"KP",name:"Corea del Norte",flag:"🇰🇵"},
      {code:"KR",name:"Corea del Sur",flag:"🇰🇷"},{code:"MO",name:"Macao",flag:"🇲🇴"},
      {code:"MN",name:"Mongolia",flag:"🇲🇳"},{code:"TW",name:"Taiwán",flag:"🇹🇼"},
    ]},
    { name:"Asia del Sudeste", countries:[
      {code:"BN",name:"Brunéi",flag:"🇧🇳"},{code:"KH",name:"Camboya",flag:"🇰🇭"},
      {code:"TL",name:"Timor-Leste",flag:"🇹🇱"},{code:"ID",name:"Indonesia",flag:"🇮🇩"},
      {code:"LA",name:"Laos",flag:"🇱🇦"},{code:"MY",name:"Malasia",flag:"🇲🇾"},
      {code:"MM",name:"Myanmar",flag:"🇲🇲"},{code:"PH",name:"Filipinas",flag:"🇵🇭"},
      {code:"SG",name:"Singapur",flag:"🇸🇬"},{code:"TH",name:"Tailandia",flag:"🇹🇭"},
      {code:"VN",name:"Vietnam",flag:"🇻🇳"},
    ]},
    { name:"Asia del Sur", countries:[
      {code:"AF",name:"Afganistán",flag:"🇦🇫"},{code:"BD",name:"Bangladesh",flag:"🇧🇩"},
      {code:"BT",name:"Bután",flag:"🇧🇹"},{code:"IN",name:"India",flag:"🇮🇳"},
      {code:"MV",name:"Maldivas",flag:"🇲🇻"},{code:"NP",name:"Nepal",flag:"🇳🇵"},
      {code:"PK",name:"Pakistán",flag:"🇵🇰"},{code:"LK",name:"Sri Lanka",flag:"🇱🇰"},
    ]},
    { name:"Asia Central", countries:[
      {code:"KZ",name:"Kazajistán",flag:"🇰🇿"},{code:"KG",name:"Kirguistán",flag:"🇰🇬"},
      {code:"TJ",name:"Tayikistán",flag:"🇹🇯"},{code:"TM",name:"Turkmenistán",flag:"🇹🇲"},
      {code:"UZ",name:"Uzbekistán",flag:"🇺🇿"},
    ]},
    { name:"Oriente Medio", countries:[
      {code:"AM",name:"Armenia",flag:"🇦🇲"},{code:"AZ",name:"Azerbaiyán",flag:"🇦🇿"},
      {code:"BH",name:"Baréin",flag:"🇧🇭"},{code:"GE",name:"Georgia",flag:"🇬🇪"},
      {code:"IQ",name:"Irak",flag:"🇮🇶"},{code:"IR",name:"Irán",flag:"🇮🇷"},
      {code:"IL",name:"Israel",flag:"🇮🇱"},{code:"JO",name:"Jordania",flag:"🇯🇴"},
      {code:"KW",name:"Kuwait",flag:"🇰🇼"},{code:"LB",name:"Líbano",flag:"🇱🇧"},
      {code:"OM",name:"Omán",flag:"🇴🇲"},{code:"PS",name:"Palestina",flag:"🇵🇸"},
      {code:"QA",name:"Qatar",flag:"🇶🇦"},{code:"SA",name:"Arabia Saudí",flag:"🇸🇦"},
      {code:"SY",name:"Siria",flag:"🇸🇾"},{code:"TR",name:"Turquía",flag:"🇹🇷"},
      {code:"AE",name:"Emiratos Árabes",flag:"🇦🇪"},{code:"YE",name:"Yemen",flag:"🇾🇪"},
    ]},
  ]},
  { id:"africa", name:"África", emoji:"🌍", regions:[
    { name:"África del Norte", countries:[
      {code:"DZ",name:"Argelia",flag:"🇩🇿"},{code:"EG",name:"Egipto",flag:"🇪🇬"},
      {code:"LY",name:"Libia",flag:"🇱🇾"},{code:"MA",name:"Marruecos",flag:"🇲🇦"},
      {code:"MR",name:"Mauritania",flag:"🇲🇷"},{code:"SD",name:"Sudán",flag:"🇸🇩"},
      {code:"TN",name:"Túnez",flag:"🇹🇳"},
    ]},
    { name:"África Occidental", countries:[
      {code:"BJ",name:"Benín",flag:"🇧🇯"},{code:"BF",name:"Burkina Faso",flag:"🇧🇫"},
      {code:"CV",name:"Cabo Verde",flag:"🇨🇻"},{code:"CI",name:"Costa de Marfil",flag:"🇨🇮"},
      {code:"GM",name:"Gambia",flag:"🇬🇲"},{code:"GH",name:"Ghana",flag:"🇬🇭"},
      {code:"GN",name:"Guinea",flag:"🇬🇳"},{code:"GW",name:"Guinea-Bissau",flag:"🇬🇼"},
      {code:"LR",name:"Liberia",flag:"🇱🇷"},{code:"ML",name:"Mali",flag:"🇲🇱"},
      {code:"NE",name:"Níger",flag:"🇳🇪"},{code:"NG",name:"Nigeria",flag:"🇳🇬"},
      {code:"SN",name:"Senegal",flag:"🇸🇳"},{code:"SL",name:"Sierra Leona",flag:"🇸🇱"},
      {code:"ST",name:"Santo Tomé y Príncipe",flag:"🇸🇹"},{code:"TG",name:"Togo",flag:"🇹🇬"},
    ]},
    { name:"África Central", countries:[
      {code:"AO",name:"Angola",flag:"🇦🇴"},{code:"CM",name:"Camerún",flag:"🇨🇲"},
      {code:"CF",name:"Rep. Centroafricana",flag:"🇨🇫"},{code:"TD",name:"Chad",flag:"🇹🇩"},
      {code:"CG",name:"Congo",flag:"🇨🇬"},{code:"CD",name:"Rep. Dem. del Congo",flag:"🇨🇩"},
      {code:"GQ",name:"Guinea Ecuatorial",flag:"🇬🇶"},{code:"GA",name:"Gabón",flag:"🇬🇦"},
    ]},
    { name:"África Oriental", countries:[
      {code:"BI",name:"Burundi",flag:"🇧🇮"},{code:"KM",name:"Comoras",flag:"🇰🇲"},
      {code:"DJ",name:"Djibouti",flag:"🇩🇯"},{code:"ER",name:"Eritrea",flag:"🇪🇷"},
      {code:"ET",name:"Etiopía",flag:"🇪🇹"},{code:"KE",name:"Kenia",flag:"🇰🇪"},
      {code:"MG",name:"Madagascar",flag:"🇲🇬"},{code:"MW",name:"Malaui",flag:"🇲🇼"},
      {code:"MU",name:"Mauricio",flag:"🇲🇺"},{code:"MZ",name:"Mozambique",flag:"🇲🇿"},
      {code:"RW",name:"Ruanda",flag:"🇷🇼"},{code:"SC",name:"Seychelles",flag:"🇸🇨"},
      {code:"SO",name:"Somalia",flag:"🇸🇴"},{code:"SS",name:"Sudán del Sur",flag:"🇸🇸"},
      {code:"TZ",name:"Tanzania",flag:"🇹🇿"},{code:"UG",name:"Uganda",flag:"🇺🇬"},
      {code:"ZM",name:"Zambia",flag:"🇿🇲"},{code:"ZW",name:"Zimbabue",flag:"🇿🇼"},
    ]},
    { name:"África del Sur", countries:[
      {code:"BW",name:"Botsuana",flag:"🇧🇼"},{code:"SZ",name:"Eswatini",flag:"🇸🇿"},
      {code:"LS",name:"Lesoto",flag:"🇱🇸"},{code:"NA",name:"Namibia",flag:"🇳🇦"},
      {code:"ZA",name:"Sudáfrica",flag:"🇿🇦"},
    ]},
  ]},
  { id:"americas", name:"Américas", emoji:"🌎", regions:[
    { name:"América del Norte", countries:[
      {code:"CA",name:"Canadá",flag:"🇨🇦"},{code:"US",name:"Estados Unidos",flag:"🇺🇸"},
      {code:"MX",name:"México",flag:"🇲🇽"},
    ]},
    { name:"Centroamérica", countries:[
      {code:"BZ",name:"Belice",flag:"🇧🇿"},{code:"CR",name:"Costa Rica",flag:"🇨🇷"},
      {code:"SV",name:"El Salvador",flag:"🇸🇻"},{code:"GT",name:"Guatemala",flag:"🇬🇹"},
      {code:"HN",name:"Honduras",flag:"🇭🇳"},{code:"NI",name:"Nicaragua",flag:"🇳🇮"},
      {code:"PA",name:"Panamá",flag:"🇵🇦"},
    ]},
    { name:"El Caribe", countries:[
      {code:"AG",name:"Antigua y Barbuda",flag:"🇦🇬"},{code:"BS",name:"Bahamas",flag:"🇧🇸"},
      {code:"BB",name:"Barbados",flag:"🇧🇧"},{code:"CU",name:"Cuba",flag:"🇨🇺"},
      {code:"DM",name:"Dominica",flag:"🇩🇲"},{code:"GD",name:"Granada",flag:"🇬🇩"},
      {code:"HT",name:"Haití",flag:"🇭🇹"},{code:"JM",name:"Jamaica",flag:"🇯🇲"},
      {code:"DO",name:"Rep. Dominicana",flag:"🇩🇴"},{code:"LC",name:"Santa Lucía",flag:"🇱🇨"},
      {code:"KN",name:"San Cristóbal y Nieves",flag:"🇰🇳"},{code:"VC",name:"San Vicente y Granadinas",flag:"🇻🇨"},
      {code:"TT",name:"Trinidad y Tobago",flag:"🇹🇹"},
    ]},
    { name:"América del Sur", countries:[
      {code:"AR",name:"Argentina",flag:"🇦🇷"},{code:"BO",name:"Bolivia",flag:"🇧🇴"},
      {code:"BR",name:"Brasil",flag:"🇧🇷"},{code:"CL",name:"Chile",flag:"🇨🇱"},
      {code:"CO",name:"Colombia",flag:"🇨🇴"},{code:"EC",name:"Ecuador",flag:"🇪🇨"},
      {code:"GY",name:"Guyana",flag:"🇬🇾"},{code:"PY",name:"Paraguay",flag:"🇵🇾"},
      {code:"PE",name:"Perú",flag:"🇵🇪"},{code:"SR",name:"Surinam",flag:"🇸🇷"},
      {code:"UY",name:"Uruguay",flag:"🇺🇾"},{code:"VE",name:"Venezuela",flag:"🇻🇪"},
    ]},
  ]},
  { id:"oceania", name:"Oceanía", emoji:"🌊", regions:[
    { name:"Australia y Nueva Zelanda", countries:[
      {code:"AU",name:"Australia",flag:"🇦🇺"},{code:"NZ",name:"Nueva Zelanda",flag:"🇳🇿"},
    ]},
    { name:"Melanesia", countries:[
      {code:"FJ",name:"Fiyi",flag:"🇫🇯"},{code:"PG",name:"Papúa Nueva Guinea",flag:"🇵🇬"},
      {code:"SB",name:"Islas Salomón",flag:"🇸🇧"},{code:"VU",name:"Vanuatu",flag:"🇻🇺"},
    ]},
    { name:"Micronesia", countries:[
      {code:"FM",name:"Micronesia",flag:"🇫🇲"},{code:"KI",name:"Kiribati",flag:"🇰🇮"},
      {code:"MH",name:"Islas Marshall",flag:"🇲🇭"},{code:"NR",name:"Nauru",flag:"🇳🇷"},
      {code:"PW",name:"Palau",flag:"🇵🇼"},
    ]},
    { name:"Polinesia", countries:[
      {code:"WS",name:"Samoa",flag:"🇼🇸"},{code:"TO",name:"Tonga",flag:"🇹🇴"},
      {code:"TV",name:"Tuvalu",flag:"🇹🇻"},
    ]},
  ]},
];

const TOTAL_COUNTRIES = CONTINENTS.reduce((s,c) => c.regions.reduce((rs,r) => rs + r.countries.length, s), 0);

const DEF = {
  displayName: "",
  location: "",
  bio: "",
  photoURL: "",
  coverURL: "",
  visitedCountries: [],
  upcoming: [],
  interests: [],
  travelStyles: [],
  languages: [],
  socials: { instagram: "", twitter: "", linkedin: "" },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --black: #0a0905; --dark: #100f0a; --card: #141209;
    --gold: #c9a84c; --gold-light: #e8c97a; --gold-dim: rgba(201,168,76,0.15);
    --cream: #f5f0e8; --cream-dim: rgba(245,240,232,0.55); --muted: rgba(245,240,232,0.35);
    --serif: 'Cormorant Garamond', Georgia, serif;
    --sans: 'DM Sans', sans-serif;
  }

  body { background: var(--black); color: var(--cream); font-family: var(--sans); font-weight: 300; }

  .pr-root { min-height: 100vh; background: var(--black); font-family: var(--sans); font-weight: 300; color: var(--cream); padding-bottom: 120px; }

  /* cover */
  .pr-cover-section { position: relative; }
  .pr-cover { position: relative; height: 260px; background: linear-gradient(135deg,#1a1508 0%,#2a1f0a 40%,#0a0905 100%); overflow: hidden; }
  .pr-cover-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.55; }
  .pr-cover-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 30%, rgba(10,9,5,0.85) 100%); }
  .pr-cover-edit { position: absolute; top: 20px; right: 20px; background: rgba(10,9,5,0.7); border: 1px solid rgba(201,168,76,0.3); color: var(--gold); padding: 8px 18px; font-family: var(--sans); font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase; cursor: pointer; transition: all 0.25s; }
  .pr-cover-edit:hover { background: rgba(201,168,76,0.15); }

  .pr-avatar-wrap { position: absolute; bottom: -52px; left: 56px; z-index: 10; }
  .pr-avatar { width: 108px; height: 108px; border-radius: 50%; border: 3px solid var(--gold); object-fit: cover; background: #1a1508; display: block; }
  .pr-avatar-placeholder { width: 108px; height: 108px; border-radius: 50%; border: 3px solid var(--gold); background: #1a1508; display: flex; align-items: center; justify-content: center; font-size: 2.6rem; color: var(--gold-dim); }
  .pr-avatar-btn { position: absolute; bottom: 4px; right: 4px; width: 28px; height: 28px; border-radius: 50%; background: var(--gold); border: none; color: var(--black); font-size: 0.7rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; line-height: 1; }
  .pr-avatar-btn:hover { background: var(--gold-light); }

  /* header */
  .pr-header { padding: 68px 56px 28px; display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
  @media (max-width: 680px) {
    /* dar espacio arriba para los botones fijos */
    .pr-root { padding-top: 64px; }
    .pr-header { padding: 68px 24px 24px; }
    .pr-avatar-wrap { left: 24px; }
    /* back fijo arriba-izquierda, simétrico a la campanita */
    .pr-back {
      position: fixed;
      top: 16px; left: 16px; z-index: 301;
      background: rgba(10,9,5,0.88);
      border: 1px solid rgba(201,168,76,0.25);
      padding: 9px 16px;
      backdrop-filter: blur(6px);
    }
    /* stats wrappean si no caben */
    .pr-stats { flex-wrap: wrap; gap: 18px 28px; }
  }

  .pr-name-input { font-family: var(--serif); font-size: clamp(1.7rem, 3vw, 2.5rem); font-weight: 300; color: var(--cream); background: transparent; border: none; border-bottom: 1px solid transparent; outline: none; width: 100%; transition: border-color 0.25s; padding: 4px 0; }
  .pr-name-input:focus { border-bottom-color: var(--gold); }
  .pr-name-input::placeholder { color: var(--muted); }

  .pr-loc-row { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
  .pr-loc-input { background: transparent; border: none; border-bottom: 1px solid transparent; color: var(--cream-dim); font-family: var(--sans); font-size: 0.85rem; font-weight: 300; outline: none; transition: border-color 0.25s; padding: 2px 0; min-width: 160px; }
  .pr-loc-input:focus { border-bottom-color: var(--gold); }
  .pr-loc-input::placeholder { color: var(--muted); }

  .pr-badge { display: inline-flex; align-items: center; gap: 4px; background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.25); color: var(--gold); padding: 3px 10px; font-size: 0.65rem; letter-spacing: 0.15em; text-transform: uppercase; }

  .pr-stats { display: flex; gap: 36px; margin-top: 18px; }
  .pr-stat-n { font-family: var(--serif); font-size: 1.7rem; font-weight: 300; color: var(--gold-light); line-height: 1; }
  .pr-stat-l { font-size: 0.64rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); margin-top: 4px; }

  .pr-back { background: none; border: none; color: var(--gold); font-family: var(--sans); font-size: 0.74rem; letter-spacing: 0.14em; text-transform: uppercase; cursor: pointer; padding: 0; transition: color 0.25s; display: inline-flex; align-items: center; gap: 8px; align-self: flex-start; }
  .pr-back:hover { color: var(--gold-light); }
  .pr-desktop-actions { position: fixed; top: 16px; right: 16px; z-index: 300; display: flex; align-items: center; gap: 10px; }
  .pr-top-btn { background: none; border: 1px solid rgba(201,168,76,0.3); font-family: var(--sans); font-size: 0.68rem; letter-spacing: 0.14em; text-transform: uppercase; cursor: pointer; padding: 7px 14px; transition: all 0.22s; }
  .pr-top-btn.gold { color: var(--gold); border-color: rgba(201,168,76,0.4); }
  .pr-top-btn.gold:hover { background: rgba(201,168,76,0.1); border-color: var(--gold); }
  .pr-bell-mobile { display: none; }
  @media (max-width: 680px) {
    .pr-desktop-actions { display: none; }
    .pr-bell-mobile { display: inline-flex !important; }
  }
  .bell-btn { position:relative; background:none; border:1px solid rgba(201,168,76,0.25); color:var(--gold); padding:6px 10px; cursor:pointer; transition:all 0.22s; font-size:1rem; display:inline-flex; align-items:center; justify-content:center; line-height:1; flex-shrink:0; }
  .bell-btn:hover { border-color:var(--gold); background:rgba(201,168,76,0.1); }
  .bell-badge { position:absolute; top:-6px; right:-6px; background:#d32f2f; color:#fff; border-radius:50%; min-width:17px; height:17px; display:flex; align-items:center; justify-content:center; font-size:0.58rem; font-weight:700; font-family:var(--sans); border:1.5px solid var(--black); padding:0 2px; pointer-events:none; }

  /* body grid */
  .pr-body { padding: 0 56px; display: grid; grid-template-columns: 1fr 340px; gap: 28px; max-width: 1200px; }
  @media (max-width: 920px) { .pr-body { grid-template-columns: 1fr; padding: 0 24px; } }

  /* sections */
  .pr-section { background: var(--card); border: 1px solid rgba(201,168,76,0.1); padding: 28px 30px; margin-bottom: 20px; }
  .pr-section-title { font-family: var(--serif); font-size: 1.05rem; font-weight: 300; letter-spacing: 0.08em; color: var(--cream); margin-bottom: 18px; padding-bottom: 12px; border-bottom: 1px solid rgba(201,168,76,0.12); }

  /* bio */
  .pr-bio { width: 100%; background: transparent; border: 1px solid rgba(201,168,76,0.15); color: var(--cream); font-family: var(--sans); font-size: 0.87rem; font-weight: 300; line-height: 1.78; padding: 14px 16px; resize: vertical; outline: none; min-height: 115px; transition: border-color 0.25s; }
  .pr-bio:focus { border-color: var(--gold); }
  .pr-bio::placeholder { color: var(--muted); }

  /* chips */
  .pr-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .pr-chip { padding: 7px 14px; border: 1px solid rgba(201,168,76,0.2); background: transparent; color: var(--cream-dim); font-family: var(--sans); font-size: 0.78rem; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
  .pr-chip:hover { border-color: rgba(201,168,76,0.5); color: var(--cream); }
  .pr-chip.on { background: rgba(201,168,76,0.15); border-color: var(--gold); color: var(--gold-light); }

  .pr-tag { display: inline-flex; align-items: center; gap: 6px; background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.25); color: var(--gold); padding: 5px 10px; font-family: var(--sans); font-size: 0.78rem; cursor: pointer; transition: all 0.2s; }
  .pr-tag:hover { background: rgba(180,60,60,0.12); border-color: rgba(180,60,60,0.35); color: #f5a0a0; }

  /* destinations */
  .pr-dest-list { display: flex; flex-direction: column; gap: 9px; margin-bottom: 14px; }
  .pr-dest-row { display: flex; align-items: center; gap: 10px; background: rgba(245,240,232,0.02); padding: 10px 14px; border: 1px solid rgba(201,168,76,0.1); }
  .pr-dest-input { flex: 1; background: transparent; border: none; color: var(--cream); font-family: var(--sans); font-size: 0.85rem; font-weight: 300; outline: none; }
  .pr-status-btn { padding: 3px 11px; font-family: var(--sans); font-size: 0.64rem; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; border: 1px solid; background: transparent; transition: all 0.2s; white-space: nowrap; }
  .pr-status-btn.confirmed { color: #6fcf97; border-color: rgba(111,207,151,0.4); }
  .pr-status-btn.planning  { color: var(--gold); border-color: rgba(201,168,76,0.35); }
  .pr-rm-btn { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 1rem; padding: 2px 4px; transition: color 0.2s; line-height: 1; }
  .pr-rm-btn:hover { color: #f5a0a0; }

  /* add row */
  .pr-add-row { display: flex; gap: 8px; align-items: stretch; flex-wrap: wrap; }
  .pr-inp { background: rgba(245,240,232,0.04); border: 1px solid rgba(201,168,76,0.18); color: var(--cream); padding: 9px 14px; font-family: var(--sans); font-size: 0.82rem; font-weight: 300; outline: none; flex: 1; min-width: 0; transition: border-color 0.25s; }
  .pr-inp:focus { border-color: var(--gold); }
  .pr-inp::placeholder { color: var(--muted); }
  .pr-sel { background: rgba(245,240,232,0.04); border: 1px solid rgba(201,168,76,0.18); color: var(--cream); padding: 9px 12px; font-family: var(--sans); font-size: 0.82rem; font-weight: 300; outline: none; cursor: pointer; }
  .pr-sel option { background: #141209; }
  .pr-add-btn { background: transparent; border: 1px solid var(--gold); color: var(--gold); padding: 9px 18px; font-family: var(--sans); font-size: 0.71rem; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; transition: all 0.25s; white-space: nowrap; }
  .pr-add-btn:hover { background: rgba(201,168,76,0.15); }

  /* languages */
  .pr-lang-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
  .pr-lang-row { display: flex; align-items: center; gap: 10px; padding: 9px 14px; background: rgba(245,240,232,0.02); border: 1px solid rgba(201,168,76,0.1); }
  .pr-lang-name { flex: 1; font-size: 0.85rem; }
  .pr-lang-sel { background: transparent; border: 1px solid rgba(201,168,76,0.22); color: var(--gold); padding: 3px 10px; font-family: var(--sans); font-size: 0.67rem; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; outline: none; }
  .pr-lang-sel option { background: #141209; }

  /* social */
  .pr-social-grid { display: flex; flex-direction: column; gap: 12px; }
  .pr-social-row { display: flex; align-items: center; gap: 12px; }
  .pr-social-lbl { width: 80px; font-size: 0.67rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--muted); flex-shrink: 0; }

  /* save bar */
  .pr-save-bar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 200; background: rgba(10,9,5,0.97); border-top: 1px solid rgba(201,168,76,0.2); padding: 16px 56px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  @media (max-width: 680px) { .pr-save-bar { padding: 14px 24px; } }
  .pr-save-note { font-size: 0.78rem; color: var(--muted); }
  .pr-save-note.ok { color: #6fcf97; }
  .pr-save-note.err { color: #f5a0a0; }
  .pr-save-btn { background: var(--gold); color: var(--black); border: none; padding: 12px 44px; font-family: var(--sans); font-size: 0.75rem; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; cursor: pointer; transition: background 0.25s; }
  .pr-save-btn:hover:not(:disabled) { background: var(--gold-light); }
  .pr-save-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  /* country explorer */
  .cv-counter { display:flex; align-items:baseline; gap:10px; margin-bottom:14px; flex-wrap:wrap; }
  .cv-n { font-family:var(--serif); font-size:clamp(2rem,4vw,2.8rem); font-weight:300; color:var(--gold-light); line-height:1; }
  .cv-n.total { font-size:clamp(1.3rem,2.5vw,1.8rem); color:var(--cream-dim); }
  .cv-sep { font-family:var(--serif); font-size:1.6rem; color:rgba(201,168,76,0.35); font-weight:300; }
  .cv-label { font-size:0.68rem; letter-spacing:0.17em; text-transform:uppercase; color:var(--muted); align-self:center; }
  .cv-pct { font-size:0.77rem; color:var(--gold); letter-spacing:0.08em; }
  .cv-bar { height:3px; background:rgba(201,168,76,0.12); border-radius:2px; overflow:hidden; margin:6px 0 22px; }
  .cv-bar-fill { height:100%; background:linear-gradient(90deg,var(--gold),var(--gold-light)); border-radius:2px; transition:width 0.5s ease; }

  .cv-cont-btn { width:100%; background:none; border:none; border-bottom:1px solid rgba(201,168,76,0.1); color:var(--cream); font-family:var(--sans); font-size:0.8rem; letter-spacing:0.07em; text-transform:uppercase; text-align:left; padding:11px 0; cursor:pointer; display:flex; justify-content:space-between; align-items:center; gap:8px; transition:color 0.2s; }
  .cv-cont-btn:hover { color:var(--gold-light); }
  .cv-cont-name { display:flex; align-items:center; gap:8px; }
  .cv-cont-meta { display:flex; align-items:center; gap:8px; flex-shrink:0; }
  .cv-badge { font-size:0.62rem; color:var(--gold); background:rgba(201,168,76,0.12); border:1px solid rgba(201,168,76,0.25); padding:2px 8px; border-radius:20px; white-space:nowrap; }
  .cv-arrow { color:var(--gold); font-size:0.62rem; transition:transform 0.25s; display:inline-block; }
  .cv-arrow.open { transform:rotate(90deg); }

  .cv-body { overflow:hidden; max-height:0; opacity:0; transition:max-height 0.38s ease, opacity 0.28s ease; }
  .cv-body.open { max-height:3000px; opacity:1; }

  .cv-region { font-size:0.58rem; letter-spacing:0.2em; text-transform:uppercase; color:var(--muted); margin:13px 0 7px; }
  .cv-chips { display:flex; flex-wrap:wrap; gap:5px; margin-bottom:4px; }
  .cv-chip { background:none; border:1px solid rgba(245,240,232,0.1); color:var(--cream-dim); font-family:var(--sans); font-size:0.72rem; padding:4px 9px; cursor:pointer; transition:all 0.16s; display:inline-flex; align-items:center; gap:4px; white-space:nowrap; }
  .cv-chip:hover { border-color:rgba(201,168,76,0.38); color:var(--cream); background:rgba(245,240,232,0.03); }
  .cv-chip.on { background:rgba(201,168,76,0.14); border-color:var(--gold); color:var(--gold-light); }

  /* hamburger — fixed top-right area, shown below 860 px */
  .pr-hamburger { display:none; }
  @media (max-width: 860px) {
    .pr-hamburger {
      display:flex; flex-direction:column; gap:5px;
      position:fixed; top:16px; right:70px; z-index:302;
      background:rgba(10,9,5,0.88); border:1px solid rgba(201,168,76,0.25);
      cursor:pointer; padding:10px 12px; backdrop-filter:blur(6px);
    }
    .pr-hamburger span { display:block; width:18px; height:1.5px; background:var(--gold); transition:transform 0.3s; }
  }

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

export default function Profile({ user, onBack, onNotif, notifCount, onExplore, onMatches, onChat, onMap, onSignOut, onSettings, onPricing }) {
  const [profile, setProfile] = useState(DEF);
  const [loading, setLoading]   = useState(true);
  const [dirty, setDirty]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState({ text: "", type: "" });

  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile]       = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [coverFile, setCoverFile]       = useState(null);

  const [newDest, setNewDest]           = useState("");
  const [newDestStatus, setNewDestStatus] = useState("planning");
  const [openContinents, setOpenContinents] = useState(new Set());
  const [newLang, setNewLang]           = useState("");
  const [newLangLevel, setNewLangLevel] = useState("Conversational");
  const [menuOpen, setMenuOpen]         = useState(false);

  const photoRef = useRef();
  const coverRef = useRef();

  useEffect(() => {
    getDoc(doc(db, "users", user.uid))
      .then(snap => {
        if (snap.exists()) {
          setProfile({ ...DEF, ...snap.data() });
        } else {
          setProfile({ ...DEF, displayName: user.displayName || "", photoURL: user.photoURL || "" });
        }
      })
      .catch(() => {
        setProfile({ ...DEF, displayName: user.displayName || "", photoURL: user.photoURL || "" });
      })
      .finally(() => setLoading(false));
  }, [user]);

  const upd = (key, val) => {
    setProfile(p => ({ ...p, [key]: val }));
    setDirty(true);
    setMsg({ text: "", type: "" });
  };

  const updSocial = (key, val) => {
    setProfile(p => ({ ...p, socials: { ...p.socials, [key]: val } }));
    setDirty(true);
    setMsg({ text: "", type: "" });
  };

  const toggle = (key, val) => {
    setProfile(p => {
      const arr = p[key];
      return { ...p, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });
    setDirty(true);
    setMsg({ text: "", type: "" });
  };

  const handlePhoto = e => {
    const f = e.target.files[0];
    if (!f) return;
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
    setDirty(true);
  };

  const handleCover = e => {
    const f = e.target.files[0];
    if (!f) return;
    setCoverFile(f);
    setCoverPreview(URL.createObjectURL(f));
    setDirty(true);
  };

  const addDest = () => {
    if (!newDest.trim()) return;
    upd("upcoming", [...profile.upcoming, { name: newDest.trim(), status: newDestStatus }]);
    setNewDest("");
  };

  const addLang = () => {
    if (!newLang || profile.languages.find(l => l.lang === newLang)) return;
    upd("languages", [...profile.languages, { lang: newLang, level: newLangLevel }]);
    setNewLang("");
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg({ text: "", type: "" });
    try {
      let photoURL = profile.photoURL;
      let coverURL = profile.coverURL;

      if (photoFile) {
        try {
          const r = sRef(storage, `profile-photos/${user.uid}`);
          await uploadBytes(r, photoFile);
          photoURL = await getDownloadURL(r);
        } catch (_) {}
      }
      if (coverFile) {
        try {
          const r = sRef(storage, `cover-photos/${user.uid}`);
          await uploadBytes(r, coverFile);
          coverURL = await getDownloadURL(r);
        } catch (_) {}
      }

      await setDoc(doc(db, "users", user.uid), { ...profile, photoURL, coverURL, updatedAt: new Date().toISOString() }, { merge: true });
      setProfile(p => ({ ...p, photoURL, coverURL }));
      setPhotoFile(null);
      setCoverFile(null);
      setDirty(false);
      setMsg({ text: "Profile saved ✓", type: "ok" });
      setTimeout(() => setMsg({ text: "", type: "" }), 3000);
    } catch {
      setMsg({ text: "Error saving. Try again.", type: "err" });
    }
    setSaving(false);
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#0a0905", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", color:"rgba(245,240,232,0.4)", fontSize:"0.85rem", letterSpacing:"0.15em", textTransform:"uppercase" }}>
      Loading profile…
    </div>
  );

  const availLangs       = ALL_LANGS.filter(l => !profile.languages.find(x => x.lang === l));
  const avatarSrc        = photoPreview || profile.photoURL;
  const coverSrc         = coverPreview || profile.coverURL;

  return (
    <>
      <style>{css}</style>

      {/* mobile nav overlay */}
      <div className={`mob-nav${menuOpen ? " open" : ""}`}>
        <div className="mob-nav-top">
          <div className="mob-nav-logo">Globe<span>Mate</span></div>
          <button className="mob-nav-close" onClick={() => setMenuOpen(false)}>✕</button>
        </div>
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onBack(); }}>← Home</button>
        <div className="mob-nav-divider" />
        <button className="mob-nav-link gold" onClick={() => { setMenuOpen(false); onExplore(); }}>Explore</button>
        <button className="mob-nav-link gold" onClick={() => { setMenuOpen(false); onMatches(); }}>Matches</button>
        <button className="mob-nav-link gold" onClick={() => { setMenuOpen(false); onChat(); }}>Messages</button>
        <button className="mob-nav-link gold" onClick={() => { setMenuOpen(false); onMap(); }}>Map</button>
        <div className="mob-nav-divider" />
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onNotif(); }}>
          Notifications{notifCount > 0 ? ` (${notifCount})` : ""}
        </button>
        <div className="mob-nav-divider" />
        <button className="mob-nav-link gold" onClick={() => { setMenuOpen(false); onPricing?.(); }}>✦ Planes</button>
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onSettings?.(); }}>⚙ Configuración</button>
        <div className="mob-nav-divider" />
        <button className="mob-nav-link" onClick={() => { setMenuOpen(false); onSignOut(); }}>Sign out</button>
      </div>

      <div className="pr-root">

        {/* hamburger — mobile only, fixed between back and bell */}
        <button className="pr-hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <span /><span /><span />
        </button>

        {/* desktop top-right actions — hidden on mobile (hamburger takes over) */}
        <div className="pr-desktop-actions">
          {onPricing && <button className="pr-top-btn gold" onClick={onPricing}>✦ Planes</button>}
          {onNotif && (
            <button className="bell-btn" onClick={onNotif}>
              🔔{notifCount > 0 && <span className="bell-badge">{notifCount > 9 ? "9+" : notifCount}</span>}
            </button>
          )}
        </div>
        {/* bell — fixed top-right on mobile only */}
        {onNotif && (
          <button className="bell-btn pr-bell-mobile" style={{ position:"fixed", top:"18px", right:"18px", zIndex:300 }} onClick={onNotif}>
            🔔{notifCount > 0 && <span className="bell-badge">{notifCount > 9 ? "9+" : notifCount}</span>}
          </button>
        )}

        {/* cover */}
        <div className="pr-cover-section">
          <div className="pr-cover">
            {coverSrc && <img className="pr-cover-img" src={coverSrc} alt="" />}
            <div className="pr-cover-overlay" />
            <button className="pr-cover-edit" onClick={() => coverRef.current.click()}>
              📷 Edit cover
            </button>
            <input ref={coverRef} type="file" accept="image/*" hidden onChange={handleCover} />
          </div>
          <div className="pr-avatar-wrap">
            {avatarSrc
              ? <img className="pr-avatar" src={avatarSrc} alt="avatar" />
              : <div className="pr-avatar-placeholder">👤</div>
            }
            <button className="pr-avatar-btn" onClick={() => photoRef.current.click()}>✎</button>
            <input ref={photoRef} type="file" accept="image/*" hidden onChange={handlePhoto} />
          </div>
        </div>

        {/* header */}
        <div className="pr-header">
          <div style={{ flex: 1 }}>
            <input
              className="pr-name-input"
              placeholder="Your name"
              value={profile.displayName}
              onChange={e => upd("displayName", e.target.value)}
            />
            <div className="pr-loc-row">
              <span style={{ color:"var(--muted)", fontSize:"0.9rem" }}>📍</span>
              <input
                className="pr-loc-input"
                placeholder="City, Country"
                value={profile.location}
                onChange={e => upd("location", e.target.value)}
              />
              <span className="pr-badge">✓ Verified traveler</span>
            </div>
            <div className="pr-stats">
              <div>
                <div className="pr-stat-n">{profile.visitedCountries.length}</div>
                <div className="pr-stat-l">Countries</div>
              </div>
              <div>
                <div className="pr-stat-n">{profile.upcoming.filter(d => d.status === "confirmed").length}</div>
                <div className="pr-stat-l">Confirmed trips</div>
              </div>
              <div>
                <div className="pr-stat-n">{profile.interests.length}</div>
                <div className="pr-stat-l">Interests</div>
              </div>
            </div>
          </div>
          <button className="pr-back" onClick={onBack}>← Back</button>
        </div>

        {/* body */}
        <div className="pr-body">

          {/* left column */}
          <div>
            {/* bio */}
            <div className="pr-section">
              <div className="pr-section-title">About me</div>
              <textarea
                className="pr-bio"
                placeholder="Your travel philosophy, most unforgettable trip, what kind of connection you're looking for…"
                value={profile.bio}
                onChange={e => upd("bio", e.target.value)}
              />
            </div>

            {/* visited countries */}
            <div className="pr-section">
              <div className="pr-section-title">Países visitados</div>

              {/* big counter */}
              <div className="cv-counter">
                <span className="cv-n">{profile.visitedCountries.length}</span>
                <span className="cv-sep">/</span>
                <span className="cv-n total">{TOTAL_COUNTRIES}</span>
                <span className="cv-label">países visitados</span>
              </div>
              <div className="cv-pct">{(profile.visitedCountries.length / TOTAL_COUNTRIES * 100).toFixed(1)}% del mundo visitado</div>
              <div className="cv-bar">
                <div className="cv-bar-fill" style={{ width:`${(profile.visitedCountries.length / TOTAL_COUNTRIES * 100).toFixed(2)}%` }} />
              </div>

              {/* continent accordions */}
              {CONTINENTS.map(cont => {
                const isOpen = openContinents.has(cont.id);
                const visitedInCont = cont.regions.reduce((s,r) => s + r.countries.filter(c => profile.visitedCountries.includes(c.code)).length, 0);
                const totalInCont   = cont.regions.reduce((s,r) => s + r.countries.length, 0);
                return (
                  <div key={cont.id}>
                    <button
                      className="cv-cont-btn"
                      onClick={() => setOpenContinents(prev => { const n = new Set(prev); n.has(cont.id) ? n.delete(cont.id) : n.add(cont.id); return n; })}
                    >
                      <span className="cv-cont-name">{cont.emoji} {cont.name}</span>
                      <span className="cv-cont-meta">
                        {visitedInCont > 0 && <span className="cv-badge">{visitedInCont}/{totalInCont}</span>}
                        <span className={`cv-arrow${isOpen ? " open" : ""}`}>▶</span>
                      </span>
                    </button>
                    <div className={`cv-body${isOpen ? " open" : ""}`}>
                      {cont.regions.map(region => (
                        <div key={region.name}>
                          <div className="cv-region">{region.name}</div>
                          <div className="cv-chips">
                            {region.countries.map(c => {
                              const visited = profile.visitedCountries.includes(c.code);
                              return (
                                <button
                                  key={c.code}
                                  className={`cv-chip${visited ? " on" : ""}`}
                                  onClick={() => upd("visitedCountries", visited
                                    ? profile.visitedCountries.filter(x => x !== c.code)
                                    : [...profile.visitedCountries, c.code]
                                  )}
                                >
                                  {c.flag} {c.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* upcoming */}
            <div className="pr-section">
              <div className="pr-section-title">Upcoming destinations</div>
              <div className="pr-dest-list">
                {profile.upcoming.map((d, i) => (
                  <div key={i} className="pr-dest-row">
                    <span style={{ fontSize:"1rem" }}>✈️</span>
                    <input
                      className="pr-dest-input"
                      value={d.name}
                      onChange={e => {
                        const next = profile.upcoming.map((x, xi) => xi === i ? { ...x, name: e.target.value } : x);
                        upd("upcoming", next);
                      }}
                    />
                    <button
                      className={`pr-status-btn ${d.status}`}
                      onClick={() => {
                        const next = profile.upcoming.map((x, xi) => xi === i ? { ...x, status: x.status === "confirmed" ? "planning" : "confirmed" } : x);
                        upd("upcoming", next);
                      }}
                    >
                      {d.status === "confirmed" ? "✓ Confirmed" : "Planning"}
                    </button>
                    <button className="pr-rm-btn" onClick={() => upd("upcoming", profile.upcoming.filter((_, xi) => xi !== i))}>×</button>
                  </div>
                ))}
              </div>
              <div className="pr-add-row">
                <input
                  className="pr-inp"
                  placeholder="e.g. Kyoto, Japan"
                  value={newDest}
                  onChange={e => setNewDest(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addDest()}
                />
                <select className="pr-sel" value={newDestStatus} onChange={e => setNewDestStatus(e.target.value)}>
                  <option value="planning">Planning</option>
                  <option value="confirmed">Confirmed</option>
                </select>
                <button className="pr-add-btn" onClick={addDest}>Add</button>
              </div>
            </div>

            {/* interests */}
            <div className="pr-section">
              <div className="pr-section-title">Interests</div>
              <div className="pr-chips">
                {INTERESTS.map(item => (
                  <button
                    key={item}
                    className={`pr-chip${profile.interests.includes(item) ? " on" : ""}`}
                    onClick={() => toggle("interests", item)}
                  >{item}</button>
                ))}
              </div>
            </div>

            {/* travel style */}
            <div className="pr-section">
              <div className="pr-section-title">Travel style</div>
              <div className="pr-chips">
                {STYLES.map(s => (
                  <button
                    key={s}
                    className={`pr-chip${profile.travelStyles.includes(s) ? " on" : ""}`}
                    onClick={() => toggle("travelStyles", s)}
                  >{s}</button>
                ))}
              </div>
            </div>
          </div>

          {/* right column */}
          <div>
            {/* languages */}
            <div className="pr-section">
              <div className="pr-section-title">Languages</div>
              <div className="pr-lang-list">
                {profile.languages.map(l => (
                  <div key={l.lang} className="pr-lang-row">
                    <span className="pr-lang-name">{l.lang}</span>
                    <select
                      className="pr-lang-sel"
                      value={l.level}
                      onChange={e => upd("languages", profile.languages.map(x => x.lang === l.lang ? { ...x, level: e.target.value } : x))}
                    >
                      {LEVELS.map(lv => <option key={lv} value={lv}>{lv}</option>)}
                    </select>
                    <button className="pr-rm-btn" onClick={() => upd("languages", profile.languages.filter(x => x.lang !== l.lang))}>×</button>
                  </div>
                ))}
              </div>
              <div className="pr-add-row">
                <select className="pr-sel" style={{ flex: 1 }} value={newLang} onChange={e => setNewLang(e.target.value)}>
                  <option value="">Language…</option>
                  {availLangs.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <select className="pr-sel" value={newLangLevel} onChange={e => setNewLangLevel(e.target.value)}>
                  {LEVELS.map(lv => <option key={lv} value={lv}>{lv}</option>)}
                </select>
                <button className="pr-add-btn" onClick={addLang}>Add</button>
              </div>
            </div>

            {/* social */}
            <div className="pr-section">
              <div className="pr-section-title">Social links</div>
              <div className="pr-social-grid">
                {[
                  { key: "instagram", label: "Instagram", ph: "@username" },
                  { key: "twitter",   label: "Twitter",   ph: "@username" },
                  { key: "linkedin",  label: "LinkedIn",  ph: "Profile URL" },
                ].map(({ key, label, ph }) => (
                  <div key={key} className="pr-social-row">
                    <span className="pr-social-lbl">{label}</span>
                    <input
                      className="pr-inp"
                      placeholder={ph}
                      value={profile.socials[key]}
                      onChange={e => updSocial(key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* save bar */}
        {(dirty || msg.text) && (
          <div className="pr-save-bar">
            <span className={`pr-save-note ${msg.type}`}>
              {msg.text || "You have unsaved changes"}
            </span>
            {dirty && (
              <button className="pr-save-btn" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            )}
          </div>
        )}

      </div>
    </>
  );
}
