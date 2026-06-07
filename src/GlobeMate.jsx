import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { LangButton } from "./LanguageSelector";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --black: #0a0905;
    --dark: #100f0a;
    --card: #141209;
    --gold: #c9a84c;
    --gold-light: #e8c97a;
    --gold-dim: rgba(201,168,76,0.15);
    --cream: #f5f0e8;
    --cream-dim: rgba(245,240,232,0.55);
    --muted: rgba(245,240,232,0.35);
    --serif: 'Cormorant Garamond', Georgia, serif;
    --sans: 'DM Sans', sans-serif;
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--black);
    color: var(--cream);
    font-family: var(--sans);
    font-weight: 300;
    overflow-x: hidden;
  }

  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 28px 56px;
    background: linear-gradient(to bottom, rgba(10,9,5,0.95), transparent);
  }
  .nav-logo {
    font-family: var(--serif);
    font-size: 1.45rem;
    font-weight: 300;
    letter-spacing: 0.12em;
    color: var(--gold-light);
  }
  .nav-logo span { font-style: italic; }
  .nav-links {
    display: flex; gap: 20px; list-style: none;
    flex: 1; min-width: 0; overflow: hidden;
  }
  .nav-links a {
    color: var(--cream-dim);
    text-decoration: none;
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    transition: color 0.3s;
    white-space: nowrap;
  }
  .nav-links a:hover { color: var(--gold-light); }
  .nav-cta {
    border: 1px solid var(--gold);
    color: var(--gold);
    background: transparent;
    padding: 8px 14px;
    font-family: var(--sans);
    font-size: 0.68rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.3s;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .nav-cta:hover { background: var(--gold); color: var(--black); }
  .nav-actions {
    display: flex; gap: 8px; align-items: center;
    flex-shrink: 0; margin-left: 12px;
  }
  .bell-btn { position:relative; background:none; border:1px solid rgba(201,168,76,0.25); color:var(--gold); padding:6px 10px; cursor:pointer; transition:all 0.22s; font-size:1rem; display:inline-flex; align-items:center; justify-content:center; line-height:1; flex-shrink:0; }
  .bell-btn:hover { border-color:var(--gold); background:rgba(201,168,76,0.1); }
  .lang-btn { display:inline-flex !important; align-items:center; gap:6px; background:none; border:1px solid rgba(201,168,76,0.35); color:#e8c97a; cursor:pointer; font-family:inherit; font-size:0.72rem; letter-spacing:0.1em; padding:6px 10px; white-space:nowrap; flex-shrink:0; line-height:1; outline:none; transition:border-color 0.22s,color 0.22s; }
  .lang-btn:hover { border-color:#c9a84c; color:#c9a84c; }
  .bell-badge { position:absolute; top:-6px; right:-6px; background:#d32f2f; color:#fff; border-radius:50%; min-width:17px; height:17px; display:flex; align-items:center; justify-content:center; font-size:0.58rem; font-weight:700; font-family:var(--sans); border:1.5px solid var(--black); padding:0 2px; pointer-events:none; }

  .hero {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    padding: 0 56px;
    position: relative;
    overflow: hidden;
  }
  .hero::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 60% 80% at 70% 50%, rgba(201,168,76,0.06) 0%, transparent 70%);
    pointer-events: none;
  }
  .hero-text {
    padding-top: 80px;
    animation: fadeUp 1.2s ease both;
  }
  .hero-eyebrow {
    font-size: 0.72rem;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 28px;
    display: flex; align-items: center; gap: 14px;
  }
  .hero-eyebrow::before {
    content: '';
    display: block; width: 36px; height: 1px;
    background: var(--gold);
  }
  .hero-h1 {
    font-family: var(--serif);
    font-size: clamp(3.2rem, 5vw, 5.5rem);
    font-weight: 300;
    line-height: 1.05;
    margin-bottom: 32px;
    color: var(--cream);
  }
  .hero-h1 em { font-style: italic; color: var(--gold-light); }
  .hero-sub {
    font-size: 1rem;
    line-height: 1.8;
    color: var(--cream-dim);
    max-width: 420px;
    margin-bottom: 48px;
  }
  .hero-actions { display: flex; gap: 20px; align-items: center; }
  .btn-primary {
    background: var(--gold);
    color: var(--black);
    border: none;
    padding: 16px 40px;
    font-family: var(--sans);
    font-size: 0.8rem;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.3s;
    position: relative; overflow: hidden;
  }
  .btn-primary::after {
    content: '';
    position: absolute; inset: 0;
    background: rgba(255,255,255,0.15);
    transform: translateX(-100%);
    transition: transform 0.4s ease;
  }
  .btn-primary:hover::after { transform: translateX(0); }
  .btn-ghost {
    background: transparent;
    color: var(--cream-dim);
    border: none;
    font-family: var(--sans);
    font-size: 0.8rem;
    letter-spacing: 0.1em;
    cursor: pointer;
    display: flex; align-items: center; gap: 8px;
    transition: color 0.3s;
  }
  .btn-ghost:hover { color: var(--cream); }
  .btn-ghost .arrow { font-size: 1.1rem; transition: transform 0.3s; }
  .btn-ghost:hover .arrow { transform: translateX(4px); }

  .hero-visual {
    display: flex; justify-content: center; align-items: center;
    position: relative;
    animation: fadeIn 1.6s ease both 0.4s;
  }
  .globe-wrap {
    position: relative; width: 480px; height: 480px;
  }
  .globe-wrap canvas {
    border-radius: 50%;
    box-shadow:
      0 0 80px rgba(201,168,76,0.12),
      0 0 160px rgba(201,168,76,0.06),
      inset 0 0 60px rgba(0,0,0,0.5);
  }
  .globe-label {
    position: absolute;
    font-family: var(--serif);
    font-size: 0.72rem;
    letter-spacing: 0.2em;
    color: var(--gold);
    text-transform: uppercase;
    white-space: nowrap;
  }
  .globe-label::before {
    content: '';
    display: inline-block; width: 20px; height: 1px;
    background: var(--gold); vertical-align: middle; margin-right: 8px;
  }
  .label-paris  { top: 28%; right: -10%; }
  .label-tokyo  { bottom: 32%; left: -12%; }
  .label-ny     { top: 44%; left: -14%; }

  .stats {
    display: flex; justify-content: center; gap: 0;
    border-top: 1px solid rgba(201,168,76,0.15);
    border-bottom: 1px solid rgba(201,168,76,0.15);
    padding: 0 56px;
    background: rgba(16,15,10,0.8);
  }
  .stat {
    flex: 1; padding: 36px 48px;
    border-right: 1px solid rgba(201,168,76,0.12);
    text-align: center;
  }
  .stat:last-child { border-right: none; }
  .stat-num {
    font-family: var(--serif);
    font-size: 2.8rem;
    font-weight: 300;
    color: var(--gold-light);
    line-height: 1;
    margin-bottom: 8px;
  }
  .stat-label {
    font-size: 0.72rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .section { padding: 120px 56px; }
  .section-tag {
    font-size: 0.7rem;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 20px;
  }
  .section-h2 {
    font-family: var(--serif);
    font-size: clamp(2.2rem, 3.5vw, 3.5rem);
    font-weight: 300;
    line-height: 1.1;
    color: var(--cream);
    margin-bottom: 64px;
    max-width: 520px;
  }
  .section-h2 em { font-style: italic; color: var(--gold-light); }

  .steps {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2px;
  }
  .step {
    padding: 48px 40px;
    background: var(--card);
    border: 1px solid rgba(201,168,76,0.08);
    position: relative;
    transition: border-color 0.4s;
    cursor: default;
  }
  .step:hover { border-color: rgba(201,168,76,0.3); }
  .step-num {
    font-family: var(--serif);
    font-size: 4.5rem;
    font-weight: 300;
    color: rgba(201,168,76,0.12);
    line-height: 1;
    margin-bottom: 24px;
    transition: color 0.4s;
  }
  .step:hover .step-num { color: rgba(201,168,76,0.25); }
  .step-icon { font-size: 2rem; margin-bottom: 16px; }
  .step-title {
    font-family: var(--serif);
    font-size: 1.4rem;
    font-weight: 400;
    margin-bottom: 14px;
    color: var(--cream);
  }
  .step-desc {
    font-size: 0.88rem;
    line-height: 1.8;
    color: var(--muted);
  }

  .dest-section { padding: 80px 56px 120px; }
  .dest-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    grid-template-rows: 280px 280px;
    gap: 3px;
    margin-top: 60px;
  }
  .dest-card {
    position: relative; overflow: hidden;
    background: var(--card);
    cursor: pointer;
  }
  .dest-card:first-child { grid-row: 1 / 3; }
  .dest-bg {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 6rem;
    opacity: 0.18;
    transition: opacity 0.4s, transform 0.6s;
  }
  .dest-card:hover .dest-bg { opacity: 0.28; transform: scale(1.08); }
  .dest-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(10,9,5,0.92) 0%, transparent 60%);
  }
  .dest-info {
    position: absolute; bottom: 0; left: 0; right: 0;
    padding: 28px 32px;
  }
  .dest-city {
    font-family: var(--serif);
    font-size: 1.6rem;
    font-weight: 300;
    color: var(--cream);
    margin-bottom: 4px;
  }
  .dest-card:first-child .dest-city { font-size: 2.4rem; }
  .dest-country {
    font-size: 0.72rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--gold);
  }
  .dest-matches {
    margin-top: 10px;
    font-size: 0.78rem;
    color: var(--muted);
  }
  .dest-matches span { color: var(--gold-light); }

  .testimonials { padding: 80px 56px 120px; }
  .testimonial-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2px;
    margin-top: 60px;
  }
  .testimonial {
    padding: 44px 40px;
    background: var(--card);
    border: 1px solid rgba(201,168,76,0.07);
  }
  .quote-mark {
    font-family: var(--serif);
    font-size: 4rem;
    line-height: 0.6;
    color: var(--gold);
    opacity: 0.4;
    margin-bottom: 24px;
  }
  .quote-text {
    font-family: var(--serif);
    font-size: 1.1rem;
    font-weight: 300;
    font-style: italic;
    line-height: 1.75;
    color: var(--cream-dim);
    margin-bottom: 28px;
  }
  .quote-author {
    display: flex; align-items: center; gap: 14px;
  }
  .author-avatar {
    width: 42px; height: 42px; border-radius: 50%;
    background: var(--gold-dim);
    border: 1px solid rgba(201,168,76,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.1rem;
  }
  .author-name {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--cream);
  }
  .author-trip {
    font-size: 0.72rem;
    color: var(--gold);
    letter-spacing: 0.1em;
    margin-top: 2px;
  }

  .cta-banner {
    margin: 0 56px 120px;
    padding: 80px;
    border: 1px solid rgba(201,168,76,0.2);
    background: linear-gradient(135deg, rgba(201,168,76,0.06) 0%, transparent 60%);
    display: flex; align-items: center; justify-content: space-between;
    gap: 40px;
    position: relative; overflow: hidden;
  }
  .cta-banner::before {
    content: '✦';
    position: absolute; right: 80px; top: 50%;
    transform: translateY(-50%);
    font-size: 10rem;
    color: rgba(201,168,76,0.04);
    pointer-events: none;
  }
  .cta-text { max-width: 560px; }
  .cta-h2 {
    font-family: var(--serif);
    font-size: clamp(2rem, 3vw, 3rem);
    font-weight: 300;
    color: var(--cream);
    margin-bottom: 16px;
    line-height: 1.15;
  }
  .cta-h2 em { font-style: italic; color: var(--gold-light); }
  .cta-p {
    font-size: 0.9rem;
    line-height: 1.7;
    color: var(--muted);
  }
  .cta-form { display: flex; gap: 0; flex-shrink: 0; }
  .cta-input {
    background: rgba(245,240,232,0.05);
    border: 1px solid rgba(201,168,76,0.25);
    border-right: none;
    color: var(--cream);
    padding: 16px 24px;
    font-family: var(--sans);
    font-size: 0.85rem;
    width: 260px;
    outline: none;
    transition: border-color 0.3s;
  }
  .cta-input::placeholder { color: var(--muted); }
  .cta-input:focus { border-color: var(--gold); }

  .footer {
    border-top: 1px solid rgba(201,168,76,0.12);
    padding: 56px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .footer-logo {
    font-family: var(--serif);
    font-size: 1.2rem;
    font-weight: 300;
    color: var(--gold-light);
    letter-spacing: 0.1em;
  }
  .footer-logo span { font-style: italic; }
  .footer-links {
    display: flex; gap: 32px; list-style: none;
  }
  .footer-links a {
    color: var(--muted);
    text-decoration: none;
    font-size: 0.78rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    transition: color 0.3s;
  }
  .footer-links a:hover { color: var(--gold); }
  .footer-copy {
    font-size: 0.75rem;
    color: rgba(245,240,232,0.2);
    letter-spacing: 0.05em;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes pulse-ring {
    0%   { transform: scale(1);   opacity: 0.4; }
    100% { transform: scale(1.6); opacity: 0; }
  }

  .pulse-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--gold);
    position: absolute;
  }
  .pulse-dot::before {
    content: '';
    position: absolute; inset: -4px;
    border-radius: 50%;
    border: 1px solid var(--gold);
    animation: pulse-ring 2s ease infinite;
  }

  /* ── Hamburger button (hidden on desktop) ── */
  .nav-hamburger {
    display: none;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px 4px;
    flex-shrink: 0;
  }
  .nav-hamburger span {
    display: block; width: 22px; height: 1.5px;
    background: var(--gold); border-radius: 1px; transition: all 0.3s;
  }

  /* ── Mobile fullscreen menu overlay ── */
  .mobile-nav {
    position: fixed; inset: 0; z-index: 300;
    background: rgba(10,9,5,0.98);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 0; opacity: 0; visibility: hidden;
    transition: opacity 0.28s, visibility 0.28s;
  }
  .mobile-nav.open { opacity: 1; visibility: visible; }
  .mobile-nav-top {
    position: absolute; top: 0; left: 0; right: 0;
    display: flex; align-items: center; justify-content: space-between;
    padding: 22px 28px;
    border-bottom: 1px solid rgba(201,168,76,0.1);
  }
  .mobile-nav-logo {
    font-family: var(--serif); font-size: 1.4rem; font-weight: 300;
    letter-spacing: 0.12em; color: var(--gold-light);
  }
  .mobile-nav-logo span { font-style: italic; }
  .mobile-nav-close {
    background: none; border: 1px solid rgba(201,168,76,0.28);
    color: var(--gold); cursor: pointer;
    width: 38px; height: 38px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.1rem; transition: all 0.2s;
  }
  .mobile-nav-close:hover { background: rgba(201,168,76,0.1); border-color: var(--gold); }
  .mobile-nav-link {
    font-family: var(--serif); font-size: 1.8rem; font-weight: 300;
    color: var(--cream-dim); text-decoration: none;
    background: none; border: none; cursor: pointer;
    padding: 14px 48px; letter-spacing: 0.04em;
    transition: color 0.25s; text-align: center; width: 100%; line-height: 1.2; display: block;
  }
  .mobile-nav-link:hover { color: var(--gold-light); }
  .mobile-nav-link.gold { color: var(--gold); }
  .mobile-nav-link.gold:hover { color: var(--gold-light); }
  .mobile-nav-divider { width: 44px; height: 1px; background: rgba(201,168,76,0.2); margin: 10px 0; }

  /* ── Responsive breakpoints ── */
  @media (max-width: 860px) {
    /* nav */
    .nav { padding: 20px 24px; }
    .nav-links { display: none; }
    .nav-desktop-only { display: none !important; }
    .nav-hamburger { display: flex; }

    /* hero */
    .hero {
      grid-template-columns: 1fr;
      padding: 100px 24px 48px;
      text-align: center; gap: 40px;
    }
    .hero::before { background: radial-gradient(ellipse 80% 50% at 50% 60%, rgba(201,168,76,0.06) 0%, transparent 70%); }
    .hero-eyebrow { justify-content: center; }
    .hero-sub { max-width: 100%; margin-left: auto; margin-right: auto; }
    .hero-actions { justify-content: center; flex-wrap: wrap; gap: 14px; }
    .hero-visual { justify-content: center; }
    .globe-wrap { width: 300px; height: 300px; margin: 0 auto; }
    .globe-wrap canvas { width: 300px !important; height: 300px !important; }
    .globe-label { display: none; }
    .pulse-dot { display: none; }

    /* stats 2×2 */
    .stats { flex-wrap: wrap; padding: 0; }
    .stat { flex: 0 0 50%; max-width: 50%; padding: 28px 16px; border-right: none; }
    .stat:nth-child(odd) { border-right: 1px solid rgba(201,168,76,0.12); }
    .stat:nth-child(-n+2) { border-bottom: 1px solid rgba(201,168,76,0.1); }

    /* how it works */
    .section { padding: 64px 24px; }
    .section-h2 { margin-bottom: 40px; max-width: 100%; }
    .steps { grid-template-columns: 1fr; gap: 2px; }

    /* destinations — 1 columna */
    .dest-section { padding: 40px 24px 64px; }
    .dest-grid {
      grid-template-columns: 1fr;
      grid-template-rows: repeat(5, 200px);
      margin-top: 32px;
    }
    .dest-card:first-child { grid-row: auto; grid-column: auto; }
    .dest-card:first-child .dest-city { font-size: 1.9rem; }

    /* testimonials — 1 columna */
    .testimonials { padding: 40px 24px 64px; }
    .testimonial-grid { grid-template-columns: 1fr; gap: 8px; margin-top: 32px; }

    /* CTA banner */
    .cta-banner {
      margin: 0 16px 80px; padding: 44px 28px;
      flex-direction: column; align-items: stretch; gap: 28px;
    }
    .cta-banner::before { display: none; }
    .cta-text { max-width: 100%; }
    .cta-form { flex-direction: column; gap: 0; width: 100%; }
    .cta-input {
      width: 100% !important;
      border-right: 1px solid rgba(201,168,76,0.25) !important;
      border-bottom: none;
      box-sizing: border-box;
    }

    /* footer */
    .footer { padding: 40px 24px; flex-direction: column; align-items: flex-start; gap: 24px; }
    .footer-links { flex-wrap: wrap; gap: 14px 24px; }
  }

  @media (max-width: 480px) {
    .hero { padding: 88px 20px 40px; }
    .globe-wrap { width: 240px; height: 240px; }
    .globe-wrap canvas { width: 240px !important; height: 240px !important; }
    .stat-num { font-size: 2.2rem; }
    .dest-grid { grid-template-rows: repeat(5, 180px); }
    .step { padding: 36px 24px; }
    .step-num { font-size: 3.5rem; }
    .cta-banner { padding: 36px 20px; }
    .btn-primary { padding: 14px 28px; font-size: 0.75rem; }
  }
`;

function GlobeCanvas() {
  const canvasRef = useRef(null);
  const rotRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const R = 220;
    const cx = 240, cy = 240;

    const cities = [
      { name:"Paris",    lat: 48.8,  lon:   2.3 },
      { name:"Tokyo",    lat: 35.7,  lon: 139.7 },
      { name:"New York", lat: 40.7,  lon: -74.0 },
      { name:"Sydney",   lat:-33.9,  lon: 151.2 },
      { name:"Nairobi",  lat: -1.3,  lon:  36.8 },
      { name:"Dubai",    lat: 25.2,  lon:  55.3 },
      { name:"London",   lat: 51.5,  lon:  -0.1 },
      { name:"Rio",      lat:-22.9,  lon: -43.2 },
      { name:"Mumbai",   lat: 19.1,  lon:  72.9 },
      { name:"Cairo",    lat: 30.0,  lon:  31.2 },
    ];

    const connections = [
      [0,1],[1,2],[2,7],[3,4],[5,6],[6,0],[7,8],[9,5],[0,3],[2,9]
    ];

    function project(lat, lon, rot) {
      const phi   = (90 - lat)  * Math.PI / 180;
      const theta = (lon + rot)  * Math.PI / 180;
      const x3 = R * Math.sin(phi) * Math.cos(theta);
      const y3 = R * Math.cos(phi);
      const z3 = R * Math.sin(phi) * Math.sin(theta);
      return { x: cx + x3, y: cy - y3, z: z3, visible: z3 > -20 };
    }

    function drawLatLon(rot) {
      for (let lat = -75; lat <= 75; lat += 15) {
        ctx.beginPath();
        let first = true;
        for (let lon = 0; lon <= 360; lon += 3) {
          const p = project(lat, lon, rot);
          if (p.z < -40) { first = true; continue; }
          first ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
          first = false;
        }
        ctx.strokeStyle = `rgba(201,168,76,${lat === 0 ? 0.18 : 0.06})`;
        ctx.lineWidth = lat === 0 ? 0.8 : 0.4;
        ctx.stroke();
      }
      for (let lon = 0; lon < 360; lon += 20) {
        ctx.beginPath();
        let first = true;
        for (let lat = -90; lat <= 90; lat += 3) {
          const p = project(lat, lon, rot);
          if (p.z < -40) { first = true; continue; }
          first ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
          first = false;
        }
        ctx.strokeStyle = "rgba(201,168,76,0.055)";
        ctx.lineWidth = 0.4;
        ctx.stroke();
      }
    }

    function drawConnections(rot, pts) {
      connections.forEach(([a, b]) => {
        const pa = pts[a], pb = pts[b];
        if (!pa.visible || !pb.visible) return;
        const grad = ctx.createLinearGradient(pa.x, pa.y, pb.x, pb.y);
        grad.addColorStop(0, "rgba(201,168,76,0.0)");
        grad.addColorStop(0.5, "rgba(201,168,76,0.35)");
        grad.addColorStop(1, "rgba(201,168,76,0.0)");
        ctx.beginPath();
        const mx = (pa.x + pb.x) / 2;
        const my = (pa.y + pb.y) / 2 - 30;
        ctx.moveTo(pa.x, pa.y);
        ctx.quadraticCurveTo(mx, my, pb.x, pb.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.9;
        ctx.stroke();
      });
    }

    function draw() {
      canvas.width = 480;
      canvas.height = 480;

      const bgGrad = ctx.createRadialGradient(cx - 60, cy - 60, 10, cx, cy, R);
      bgGrad.addColorStop(0, "#1a1710");
      bgGrad.addColorStop(0.6, "#0e0c08");
      bgGrad.addColorStop(1, "#060503");
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = bgGrad;
      ctx.fill();

      const atmGrad = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R * 1.05);
      atmGrad.addColorStop(0, "rgba(201,168,76,0.0)");
      atmGrad.addColorStop(1, "rgba(201,168,76,0.08)");
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.05, 0, Math.PI * 2);
      ctx.fillStyle = atmGrad;
      ctx.fill();

      const rot = rotRef.current;
      drawLatLon(rot);

      const pts = cities.map(c => project(c.lat, c.lon, rot));
      drawConnections(rot, pts);

      pts.forEach((p) => {
        if (!p.visible) return;
        const brightness = Math.max(0.3, (p.z + R) / (2 * R));
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,168,76,${brightness * 0.9})`;
        ctx.shadowColor = "#c9a84c";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      const spec = ctx.createRadialGradient(cx - 70, cy - 70, 0, cx - 40, cy - 40, 120);
      spec.addColorStop(0, "rgba(255,248,220,0.09)");
      spec.addColorStop(1, "rgba(255,248,220,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = spec;
      ctx.fill();

      rotRef.current = (rotRef.current + 0.12) % 360;
      rafRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="globe-wrap">
      <canvas ref={canvasRef} width={480} height={480} />
      <div className="pulse-dot" style={{ top: "28%", right: "18%" }} />
      <div className="pulse-dot" style={{ bottom: "30%", left: "22%", animationDelay: "0.8s" }} />
      <span className="globe-label label-paris">Paris</span>
      <span className="globe-label label-tokyo">Tokyo</span>
      <span className="globe-label label-ny">New York</span>
    </div>
  );
}

export default function GlobeMate({ user, onSignIn, onSignOut, onProfile, onExplore, onChat, onMatches, onMap, onNotif, notifCount, onSettings, onPricing }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleJoin = () => {
    if (email.trim()) { setJoined(true); }
  };

  return (
    <>
      <style>{style}</style>

      {/* ── Mobile nav overlay ── */}
      <div className={`mobile-nav${menuOpen ? " open" : ""}`}>
        <div className="mobile-nav-top">
          <div className="mobile-nav-logo">Globe<span>Mate</span></div>
          <button className="mobile-nav-close" onClick={() => setMenuOpen(false)} aria-label={t("common.close")}>✕</button>
        </div>
        <a href="#how" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>{t("landing.howItWorks")}</a>
        <a href="#destinations" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>{t("landing.destinations")}</a>
        <a href="#stories" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>{t("landing.stories")}</a>
        {user && (
          <>
            <div className="mobile-nav-divider" />
            <button className="mobile-nav-link gold" onClick={() => { setMenuOpen(false); onExplore(); }}>{t("nav.explore")}</button>
            <button className="mobile-nav-link gold" onClick={() => { setMenuOpen(false); onMatches(); }}>{t("nav.matches")}</button>
            <button className="mobile-nav-link gold" onClick={() => { setMenuOpen(false); onChat(); }}>{t("nav.messages")}</button>
            <button className="mobile-nav-link gold" onClick={() => { setMenuOpen(false); onMap(); }}>{t("nav.map")}</button>
          </>
        )}
        <div className="mobile-nav-divider" />
        <div style={{ padding: "10px 24px" }}>
          <LangButton align="left" />
        </div>
        <div className="mobile-nav-divider" />
        {user ? (
          <>
            <button className="mobile-nav-link" onClick={() => { setMenuOpen(false); onProfile(); }}>{t("nav.myProfile")}</button>
            <button className="mobile-nav-link gold" onClick={() => { setMenuOpen(false); onPricing?.(); }}>{t("nav.plans")}</button>
            <button className="mobile-nav-link" onClick={() => { setMenuOpen(false); onSettings?.(); }}>{t("nav.settings")}</button>
            <button className="mobile-nav-link" onClick={() => { setMenuOpen(false); onSignOut(); }}>{t("nav.signOut")}</button>
          </>
        ) : (
          <button className="mobile-nav-link gold" onClick={() => { setMenuOpen(false); onSignIn(); }}>{t("nav.signIn")}</button>
        )}
      </div>

      <nav className="nav">
        <button style={{position:'fixed', top:'200px', left:'20px', zIndex:99999, background:'red', color:'white', padding:'20px', fontSize:'20px'}} onClick={() => alert('funciona')}>TEST IDIOMA</button>
        <div className="nav-logo">Globe<span>Mate</span></div>
        <ul className="nav-links">
          <li><a href="#how">{t("landing.howItWorks")}</a></li>
          <li><a href="#destinations">{t("landing.destinations")}</a></li>
          <li><a href="#stories">{t("landing.stories")}</a></li>
          {user && <li><a href="#explore"  onClick={e => { e.preventDefault(); onExplore(); }}  style={{ color: "var(--gold-light)" }}>{t("nav.explore")}</a></li>}
          {user && <li><a href="#matches"  onClick={e => { e.preventDefault(); onMatches(); }} style={{ color: "var(--gold-light)" }}>{t("nav.matches")}</a></li>}
          {user && <li><a href="#messages" onClick={e => { e.preventDefault(); onChat(); }}    style={{ color: "var(--gold-light)" }}>{t("nav.messages")}</a></li>}
          {user && <li><a href="#map"      onClick={e => { e.preventDefault(); onMap(); }}     style={{ color: "var(--gold-light)" }}>{t("nav.map")}</a></li>}
        </ul>
        <div className="nav-actions">
          <LangButton align="right" />
          {user && (
            <button className="bell-btn" onClick={onNotif}>
              🔔{notifCount > 0 && <span className="bell-badge">{notifCount > 9 ? "9+" : notifCount}</span>}
            </button>
          )}
          <button className="nav-cta nav-desktop-only" onClick={onPricing}>{t("nav.plans")}</button>
          {user ? (
            <>
              <button className="nav-cta nav-desktop-only" onClick={onProfile}>{t("nav.myProfile")}</button>
              <button className="nav-cta nav-desktop-only" onClick={onSignOut}>{t("nav.signOut")}</button>
            </>
          ) : (
            <button className="nav-cta nav-desktop-only" onClick={onSignIn}>{t("nav.signIn")}</button>
          )}
          <button className="nav-hamburger" onClick={() => setMenuOpen(true)} aria-label={t("common.search")}>
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-text">
          <div className="hero-eyebrow">{t("landing.eyebrow")}</div>
          <h1 className="hero-h1">
            {t("landing.appHeroLine1")}<br />
            <em>{t("landing.appHeroLine2")}</em>
          </h1>
          <p className="hero-sub">{t("landing.heroSub")}</p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={onSignIn}>{t("landing.startJourney")}</button>
            <button className="btn-ghost">
              {t("landing.seeHowItWorks")} <span className="arrow">→</span>
            </button>
          </div>
        </div>
        <div className="hero-visual">
          <GlobeCanvas />
        </div>
      </section>

      <div className="stats">
        {[
          { num: "124K", label: t("landing.statTravelers") },
          { num: "89",   label: t("landing.statCountries") },
          { num: "4.2K", label: t("landing.statMatches") },
          { num: "96%",  label: t("landing.statSatisfaction") },
        ].map((s, i) => (
          <div key={i} className="stat">
            <div className="stat-num">{s.num}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <section className="section" id="how">
        <div className="section-tag">{t("landing.experienceTag")}</div>
        <h2 className="section-h2">{t("landing.experienceTitle")} <em>{t("landing.experienceTitleItalic")}</em></h2>
        <div className="steps">
          {[
            { n:"01", icon:"🌍", title: t("landing.step1Title"), desc: t("landing.step1Desc") },
            { n:"02", icon:"✦",  title: t("landing.step2Title"), desc: t("landing.step2Desc") },
            { n:"03", icon:"💬", title: t("landing.step3Title"), desc: t("landing.step3Desc") },
          ].map((step, i) => (
            <div key={i} className="step">
              <div className="step-num">{step.n}</div>
              <div className="step-icon">{step.icon}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="dest-section" id="destinations">
        <div className="section-tag">{t("landing.whereLoveTravels")}</div>
        <h2 className="section-h2">{t("landing.connectionsTitle")} <em>{t("landing.connectionsTitleItalic")}</em></h2>
        <div className="dest-grid">
          {[
            { city:"Kyoto",    country:"Japan",    emoji:"🏯", matches:"342" },
            { city:"Lisbon",   country:"Portugal", emoji:"🌊", matches:"198" },
            { city:"Marrakech",country:"Morocco",  emoji:"🕌", matches:"215" },
            { city:"Santorini",country:"Greece",   emoji:"⛵", matches:"167" },
            { city:"Medellín", country:"Colombia", emoji:"🌺", matches:"289" },
          ].map((d, i) => (
            <div key={i} className="dest-card">
              <div className="dest-bg">{d.emoji}</div>
              <div className="dest-overlay" />
              <div className="dest-info">
                <div className="dest-city">{d.city}</div>
                <div className="dest-country">{d.country}</div>
                <div className="dest-matches"><span>{d.matches}</span> {t("landing.activeTravelers")}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="testimonials" id="stories">
        <div className="section-tag">{t("landing.loveStories")}</div>
        <h2 className="section-h2">{t("landing.journeysTitle")} <em>{t("landing.journeysTitleItalic")}</em></h2>
        <div className="testimonial-grid">
          {[
            { text: t("landing.test1"), author: t("landing.test1Author"), trip: t("landing.test1Trip"), emoji:"✈️" },
            { text: t("landing.test2"), author: t("landing.test2Author"), trip: t("landing.test2Trip"), emoji:"🌸" },
            { text: t("landing.test3"), author: t("landing.test3Author"), trip: t("landing.test3Trip"), emoji:"🗺️" },
          ].map((item, i) => (
            <div key={i} className="testimonial">
              <div className="quote-mark">"</div>
              <p className="quote-text">{item.text}</p>
              <div className="quote-author">
                <div className="author-avatar">{item.emoji}</div>
                <div>
                  <div className="author-name">{item.author}</div>
                  <div className="author-trip">{item.trip}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="cta-banner">
        <div className="cta-text">
          <h2 className="cta-h2">{t("landing.ctaTitle")} <em>{t("landing.ctaTitleItalic")}</em></h2>
          <p className="cta-p">{t("landing.ctaSubtitle")}</p>
        </div>
        <div className="cta-form">
          {joined ? (
            <div style={{ padding:"16px 32px", border:"1px solid rgba(201,168,76,0.4)", color:"var(--gold-light)", fontFamily:"var(--serif)", fontSize:"1rem", fontStyle:"italic" }}>
              {t("landing.onTheList")}
            </div>
          ) : (
            <>
              <input
                className="cta-input"
                type="email"
                placeholder={t("auth.emailPlaceholder")}
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleJoin()}
              />
              <button className="btn-primary" onClick={handleJoin}>
                {t("landing.joinWaitlist")}
              </button>
            </>
          )}
        </div>
      </div>

      <footer className="footer">
        <div className="footer-logo">Globe<span>Mate</span></div>
        <ul className="footer-links">
          <li><a href="#">{t("landing.footerPrivacy")}</a></li>
          <li><a href="#">{t("landing.footerTerms")}</a></li>
          <li><a href="#">{t("landing.footerContact")}</a></li>
          <li><a href="#">Instagram</a></li>
        </ul>
        <div className="footer-copy">{t("landing.footerCopy")}</div>
      </footer>
    </>
  );
}
