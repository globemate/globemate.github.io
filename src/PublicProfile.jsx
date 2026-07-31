import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import {
  doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp,
} from "firebase/firestore";
import ReportModal from "./ReportModal";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  .pp-overlay {
    position: fixed; inset: 0; z-index: 900;
    background: rgba(10,9,5,0.88); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px; overflow-y: auto;
  }
  .pp-modal {
    background: #141209; border: 1px solid rgba(201,168,76,0.18);
    width: 100%; max-width: 520px; position: relative;
    max-height: 90vh; overflow-y: auto;
  }
  .pp-modal::-webkit-scrollbar { width: 3px; }
  .pp-modal::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.2); }

  /* close */
  .pp-close {
    position: absolute; top: 14px; right: 16px; z-index: 10;
    background: rgba(10,9,5,0.7); border: 1px solid rgba(201,168,76,0.25);
    color: rgba(245,240,232,0.6); font-size: 1rem; cursor: pointer;
    width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
  }
  .pp-close:hover { border-color: #c9a84c; color: #c9a84c; }

  /* carousel */
  .pp-carousel-section { position: relative; flex-shrink: 0; }
  .pp-carousel {
    height: 280px; background: linear-gradient(135deg,#1a1508,#100f0a);
    position: relative; overflow: hidden; user-select: none;
  }
  .pp-carousel-slide {
    position: absolute; inset: 0; transition: opacity 0.35s ease;
    display: flex; align-items: center; justify-content: center;
  }
  .pp-carousel-slide img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .pp-carousel-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, transparent 50%, rgba(20,18,9,0.82) 100%);
    pointer-events: none;
  }
  .pp-carousel-arrow {
    position: absolute; top: 50%; transform: translateY(-50%); z-index: 5;
    background: rgba(10,9,5,0.55); border: 1px solid rgba(201,168,76,0.3);
    color: rgba(245,240,232,0.75); width: 34px; height: 34px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 0.85rem; transition: all 0.2s;
    backdrop-filter: blur(4px);
  }
  .pp-carousel-arrow:hover { background: rgba(201,168,76,0.2); color: #e8c97a; border-color: #c9a84c; }
  .pp-carousel-arrow.left  { left: 10px; }
  .pp-carousel-arrow.right { right: 10px; }
  .pp-carousel-dots {
    position: absolute; bottom: 50px; left: 50%; transform: translateX(-50%);
    display: flex; gap: 6px; z-index: 5; pointer-events: none;
  }
  .pp-carousel-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: rgba(245,240,232,0.35); transition: background 0.25s, transform 0.25s;
  }
  .pp-carousel-dot.active { background: #c9a84c; transform: scale(1.3); }
  .pp-avatar-wrap {
    position: absolute; bottom: -36px; left: 24px; z-index: 6;
    width: 72px; height: 72px; border-radius: 50%;
    border: 2.5px solid #c9a84c; background: rgba(10,9,5,0.9);
    display: flex; align-items: center; justify-content: center;
    font-size: 2rem; overflow: hidden; flex-shrink: 0;
  }
  .pp-avatar-wrap img { width: 100%; height: 100%; object-fit: cover; }

  /* body */
  .pp-body { padding: 48px 24px 28px; display: flex; flex-direction: column; gap: 16px; }

  .pp-name { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.5rem; font-weight: 300; color: #f5f0e8; display: flex; align-items: center; gap: 8px; }
  .pp-verified { width: 14px; height: 14px; background: #c9a84c; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.55rem; color: #0a0905; flex-shrink: 0; }
  .pp-location { font-size: 0.8rem; color: rgba(245,240,232,0.55); display: flex; align-items: center; gap: 5px; margin-top: 2px; }

  .pp-bio { font-size: 0.85rem; color: rgba(245,240,232,0.7); line-height: 1.7; }

  .pp-section-label {
    font-size: 0.62rem; letter-spacing: 0.2em; text-transform: uppercase;
    color: #c9a84c; margin-bottom: 8px;
  }
  .pp-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .pp-chip {
    font-size: 0.72rem; padding: 4px 10px;
    background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.2);
    color: rgba(245,240,232,0.7); white-space: nowrap;
  }
  .pp-langs { display: flex; flex-direction: column; gap: 4px; }
  .pp-lang-row { font-size: 0.78rem; color: rgba(245,240,232,0.65); display: flex; gap: 8px; }
  .pp-lang-level { color: rgba(245,240,232,0.35); }

  .pp-stat-row { display: flex; gap: 28px; }
  .pp-stat { display: flex; flex-direction: column; }
  .pp-stat-n { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.5rem; font-weight: 300; color: #e8c97a; line-height: 1; }
  .pp-stat-l { font-size: 0.62rem; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(245,240,232,0.35); margin-top: 3px; }

  .pp-upcoming { display: flex; flex-direction: column; gap: 6px; }
  .pp-dest-row { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: rgba(245,240,232,0.65); background: rgba(245,240,232,0.03); border: 1px solid rgba(201,168,76,0.1); padding: 6px 10px; }
  .pp-dest-status { font-size: 0.6rem; letter-spacing: 0.1em; text-transform: uppercase; padding: 1px 6px; border: 1px solid; flex-shrink: 0; margin-left: auto; }
  .pp-dest-status.confirmed { color: #6fcf97; border-color: rgba(111,207,151,0.35); }
  .pp-dest-status.planning  { color: #c9a84c; border-color: rgba(201,168,76,0.35); }

  .pp-divider { height: 1px; background: rgba(201,168,76,0.1); }

  .pp-loading { padding: 60px; text-align: center; font-size: 0.8rem; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(245,240,232,0.3); }
  .pp-error   { padding: 60px; text-align: center; font-size: 0.82rem; color: rgba(245,240,232,0.4); }

  /* action buttons */
  .pp-actions { display: flex; gap: 8px; }
  .pp-act-btn {
    flex: 1; padding: 10px 0; font-family: 'DM Sans', sans-serif;
    font-size: 0.7rem; letter-spacing: 0.13em; text-transform: uppercase;
    cursor: pointer; transition: all 0.22s; border: 1px solid;
  }
  .pp-block-btn {
    background: rgba(245,240,232,0.03); border-color: rgba(245,240,232,0.18);
    color: rgba(245,240,232,0.55);
  }
  .pp-block-btn:hover:not(:disabled) {
    border-color: rgba(201,112,106,0.5); color: #e07070;
    background: rgba(201,112,106,0.08);
  }
  .pp-block-btn:disabled { opacity: 0.65; cursor: default; }
  .pp-report-btn {
    background: rgba(201,112,106,0.08); border-color: rgba(201,112,106,0.3);
    color: #e07070;
  }
  .pp-report-btn:hover { background: rgba(201,112,106,0.2); border-color: rgba(201,112,106,0.55); }

  .pp-connect-row { margin-bottom: 8px; }
  .pp-connect-main {
    width: 100%; padding: 11px 0; font-family: 'DM Sans', sans-serif;
    font-size: 0.72rem; letter-spacing: 0.15em; text-transform: uppercase;
    cursor: pointer; transition: all 0.22s; border: 1px solid #c9a84c;
    background: transparent; color: #c9a84c;
  }
  .pp-connect-main:hover:not(:disabled) { background: rgba(201,168,76,0.12); }
  .pp-connect-main.sent  { border-color: rgba(245,240,232,0.15); color: rgba(245,240,232,0.3); cursor: default; background: rgba(245,240,232,0.02); }
  .pp-connect-main.match { border-color: #c9a84c; color: #e8c97a; cursor: default; background: rgba(201,168,76,0.12); }
`;

export default function PublicProfile({ uid, currentUser, onClose, onBlockDone }) {
  const [profile, setProfile]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(false);
  const [blocking, setBlocking]         = useState(false);
  const [alreadyBlocked, setAlreadyBlocked] = useState(false);
  const [reporting, setReporting]       = useState(false);
  const [likeStatus, setLikeStatus]     = useState(null); // null | "sent" | "match"
  const [likeBusy,   setLikeBusy]       = useState(false);
  const [carouselIdx, setCarouselIdx]   = useState(0);
  const touchStartX = useRef(null);

  useEffect(() => {
    if (!uid) return;
    setLoading(true); setError(false);
    getDoc(doc(db, "users", uid))
      .then(snap => {
        if (snap.exists()) {
          const d = snap.data();
          setProfile({
            displayName:      d.displayName      || null,
            photoURL:         d.photoURL         || null,
            coverURL:         d.coverURL         || null,
            photos:           Array.isArray(d.photos) ? d.photos.filter(Boolean) : [],
            emoji:            d.emoji            || null,
            location:         d.location         || null,
            bio:              d.bio              || null,
            interests:        Array.isArray(d.interests)    ? d.interests.filter(Boolean)    : [],
            travelStyles:     Array.isArray(d.travelStyles)  ? d.travelStyles.filter(Boolean)  : [],
            languages:        Array.isArray(d.languages)     ? d.languages                      : [],
            visitedCountries: d.visitedCountries || [],
            upcoming:         d.upcoming         || [],
            isVerified:       d.isVerified       || false,
          });
          setCarouselIdx(0);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [uid]);

  // Record profile visit (max once per day per visitor, skip own profile)
  useEffect(() => {
    if (!currentUser?.uid || !uid || currentUser.uid === uid) return;
    const today      = new Date().toISOString().slice(0, 10);
    const storageKey = `gm_visit_${uid}_${currentUser.uid}`;
    if (localStorage.getItem(storageKey) === today) return;
    setDoc(doc(db, "users", uid, "profileVisits", currentUser.uid), {
      visitorId: currentUser.uid, visitedId: uid, date: today, timestamp: serverTimestamp(),
    }, { merge: true }).catch(() => {});
    try { localStorage.setItem(storageKey, today); } catch {}
  }, [uid, currentUser?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!currentUser?.uid || !uid || currentUser.uid === uid) return;
    // Check if I blocked them
    getDoc(doc(db, "blocks", `${currentUser.uid}_${uid}`))
      .then(snap => setAlreadyBlocked(snap.exists()))
      .catch(() => {});
    // Check if they blocked me — with updated rules, blockedId can read their own block docs.
    // Show "not found" silently, no mention of block (req. 5).
    getDoc(doc(db, "blocks", `${uid}_${currentUser.uid}`))
      .then(snap => { if (snap.exists()) setError(true); })
      .catch(() => {});
  }, [currentUser?.uid, uid]);

  useEffect(() => {
    if (!currentUser?.uid || !uid || currentUser.uid === uid) return;
    const fromUid = currentUser.uid;
    getDoc(doc(db, "likes", `${fromUid}_${uid}`)).then(snap => {
      if (!snap.exists()) return;
      const [uidA, uidB] = [fromUid, uid].sort();
      getDoc(doc(db, "matches", `${uidA}_${uidB}`))
        .then(m => setLikeStatus(m.exists() ? "match" : "sent"))
        .catch(() => setLikeStatus("sent"));
    }).catch(() => {});
  }, [currentUser?.uid, uid]);

  const handleConnect = async () => {
    if (!currentUser?.uid || !uid || likeBusy || likeStatus) return;
    const fromUid = currentUser.uid;
    const toUid   = uid;
    setLikeBusy(true);
    try {
      await setDoc(doc(db, "likes", `${fromUid}_${toUid}`), {
        fromUid, toUid, createdAt: serverTimestamp(),
      }, { merge: true });
      const inverseSnap = await getDoc(doc(db, "likes", `${toUid}_${fromUid}`));
      if (inverseSnap.exists()) {
        const [uidA, uidB] = [fromUid, toUid].sort();
        const matchId = `${uidA}_${uidB}`;
        await setDoc(doc(db, "matches", matchId), {
          users: [uidA, uidB], createdAt: serverTimestamp(),
        }, { merge: true });
        await setDoc(doc(db, "conversations", matchId), {
          participants: [uidA, uidB],
          participantProfiles: {
            [fromUid]: { uid: fromUid, displayName: currentUser.displayName || "Traveler", photoURL: currentUser.photoURL || null },
            [toUid]:   { uid: toUid,   displayName: profile.displayName || "Traveler",     photoURL: profile.photoURL || null, emoji: profile.emoji || null },
          },
          lastMessage: "", lastMessageAt: serverTimestamp(), lastMessageBy: null, matchId,
        }, { merge: true });
        setLikeStatus("match");
      } else {
        setLikeStatus("sent");
      }
    } catch (err) {
      console.error("Connect error:", err);
    }
    setLikeBusy(false);
  };

  const handleBlock = async () => {
    if (!currentUser?.uid || !uid || blocking) return;
    setBlocking(true);
    try {
      await setDoc(doc(db, "blocks", `${currentUser.uid}_${uid}`), {
        blockerId: currentUser.uid,
        blockedId: uid,
        createdAt: serverTimestamp(),
      });
      const [uidA, uidB] = [currentUser.uid, uid].sort();
      try {
        await updateDoc(doc(db, "conversations", `${uidA}_${uidB}`), {
          hiddenFor: arrayUnion(currentUser.uid, uid),
        });
      } catch { /* no conversation between them */ }
      setAlreadyBlocked(true);
      onBlockDone?.();
    } catch (err) {
      console.error("Block error:", err);
    } finally {
      setBlocking(false);
    }
  };

  const showActions = currentUser?.uid && uid && currentUser.uid !== uid;

  return (
    <>
      <style>{css}</style>
      <div className="pp-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="pp-modal">
          <button className="pp-close" onClick={onClose}>✕</button>

          {loading && <div className="pp-loading">Cargando…</div>}
          {error   && <div className="pp-error">Perfil no encontrado.</div>}

          {!loading && !error && profile && (() => {
            const slides = profile.photos?.length
              ? profile.photos
              : profile.coverURL ? [profile.coverURL] : [];
            const total = slides.length;
            const prev = () => setCarouselIdx(i => (i - 1 + total) % total);
            const next = () => setCarouselIdx(i => (i + 1) % total);
            return (
            <>
              {/* carousel + avatar wrapper — overflow visible so avatar is not clipped */}
              <div className="pp-carousel-section">
                <div
                  className="pp-carousel"
                  onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
                  onTouchEnd={e => {
                    if (touchStartX.current === null || !total) return;
                    const dx = e.changedTouches[0].clientX - touchStartX.current;
                    if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
                    touchStartX.current = null;
                  }}
                >
                  {total === 0 ? null : slides.map((src, i) => (
                    <div
                      key={i}
                      className="pp-carousel-slide"
                      style={{ opacity: i === carouselIdx ? 1 : 0, zIndex: i === carouselIdx ? 1 : 0 }}
                    >
                      <img src={src} alt={`Foto ${i + 1}`} />
                    </div>
                  ))}
                  <div className="pp-carousel-overlay" />
                  {total > 1 && (
                    <>
                      <button className="pp-carousel-arrow left" onClick={prev}>‹</button>
                      <button className="pp-carousel-arrow right" onClick={next}>›</button>
                      <div className="pp-carousel-dots">
                        {slides.map((_, i) => (
                          <div key={i} className={`pp-carousel-dot${i === carouselIdx ? " active" : ""}`} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div className="pp-avatar-wrap">
                  {profile.photoURL
                    ? <img src={profile.photoURL} alt={profile.displayName || "Viajero"} />
                    : <span>{profile.emoji || "👤"}</span>
                  }
                </div>
              </div>

              <div className="pp-body">
                {/* name + location */}
                <div>
                  <div className="pp-name">
                    {profile.displayName || "Traveler"}
                    {profile.isVerified && <span className="pp-verified">✓</span>}
                  </div>
                  {profile.location && (
                    <div className="pp-location">📍 {profile.location}</div>
                  )}
                </div>

                {/* stats */}
                {(profile.visitedCountries.length > 0 || profile.upcoming.length > 0) && (
                  <>
                    <div className="pp-divider" />
                    <div className="pp-stat-row">
                      {profile.visitedCountries.length > 0 && (
                        <div className="pp-stat">
                          <span className="pp-stat-n">{profile.visitedCountries.length}</span>
                          <span className="pp-stat-l">Países</span>
                        </div>
                      )}
                      {profile.upcoming.filter(d => d.status === "confirmed").length > 0 && (
                        <div className="pp-stat">
                          <span className="pp-stat-n">{profile.upcoming.filter(d => d.status === "confirmed").length}</span>
                          <span className="pp-stat-l">Viajes confirmados</span>
                        </div>
                      )}
                      {profile.interests.length > 0 && (
                        <div className="pp-stat">
                          <span className="pp-stat-n">{profile.interests.length}</span>
                          <span className="pp-stat-l">Intereses</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* bio */}
                {profile.bio && (
                  <>
                    <div className="pp-divider" />
                    <div className="pp-bio">{profile.bio}</div>
                  </>
                )}

                {/* interests */}
                {profile.interests.length > 0 && (
                  <>
                    <div className="pp-divider" />
                    <div>
                      <div className="pp-section-label">Intereses</div>
                      <div className="pp-chips">
                        {profile.interests.map((i, idx) => (
                          <span key={idx} className="pp-chip">
                            {typeof i === "string" ? i : (i?.name || i?.label || String(i))}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* travel styles */}
                {profile.travelStyles.length > 0 && (
                  <>
                    <div className="pp-divider" />
                    <div>
                      <div className="pp-section-label">Estilo de viaje</div>
                      <div className="pp-chips">
                        {profile.travelStyles.map((s, idx) => (
                          <span key={idx} className="pp-chip">
                            {typeof s === "string" ? s : (s?.name || s?.label || String(s))}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* upcoming trips */}
                {profile.upcoming.length > 0 && (
                  <>
                    <div className="pp-divider" />
                    <div>
                      <div className="pp-section-label">Próximos viajes</div>
                      <div className="pp-upcoming">
                        {profile.upcoming.map((d, i) => (
                          <div key={i} className="pp-dest-row">
                            <span>✈️</span>
                            <span>{d.name}</span>
                            {d.status && (
                              <span className={`pp-dest-status ${d.status}`}>{d.status}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* languages */}
                {profile.languages.length > 0 && (
                  <>
                    <div className="pp-divider" />
                    <div>
                      <div className="pp-section-label">Idiomas</div>
                      <div className="pp-langs">
                        {profile.languages.map((l, i) => (
                          <div key={i} className="pp-lang-row">
                            <span>🗣️ {l.lang}</span>
                            {l.level && <span className="pp-lang-level">— {l.level}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* connect / block / report */}
                {showActions && (
                  <>
                    <div className="pp-divider" />
                    <div className="pp-connect-row">
                      <button
                        className={`pp-connect-main${likeStatus ? " " + likeStatus : ""}`}
                        onClick={handleConnect}
                        disabled={!!likeStatus || likeBusy}
                      >
                        {likeStatus === "match" ? "Match ✓" : likeStatus === "sent" ? "Solicitud enviada" : likeBusy ? "Conectando…" : "Conectar"}
                      </button>
                    </div>
                    <div className="pp-actions">
                      <button
                        className="pp-act-btn pp-block-btn"
                        onClick={handleBlock}
                        disabled={blocking || alreadyBlocked}
                      >
                        {alreadyBlocked ? "✓ Bloqueado" : blocking ? "Bloqueando…" : "Bloquear"}
                      </button>
                      {!alreadyBlocked && (
                        <button
                          className="pp-act-btn pp-report-btn"
                          onClick={() => setReporting(true)}
                        >
                          Reportar
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          ); })()}
        </div>
      </div>

      {reporting && (
        <ReportModal
          reportedUid={uid}
          currentUser={currentUser}
          onClose={() => setReporting(false)}
          onBlockDone={() => {
            setAlreadyBlocked(true);
            setReporting(false);
            onBlockDone?.();
          }}
        />
      )}
    </>
  );
}
