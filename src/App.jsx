import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Play, Star, Calendar, Clock, Film, Tv, TrendingUp,
  ChevronRight, X, Home, Grid, Flame, RefreshCw, Info,
  ChevronLeft, ChevronDown, ExternalLink, List, LayoutGrid,
  Globe, Subtitles, Shield, Zap, Heart, BookOpen, Eye
} from 'lucide-react';

// ─── JIKAN API BASE ───────────────────────────────────────────────
const BASE = 'https://api.jikan.moe/v4';

const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('API Error');
  return res.json();
};

const delay = (ms) => new Promise(r => setTimeout(r, ms));

// ─── GENRE LIST (semua genre tanpa filter) ─────────────────────────
const ALL_GENRES = [
  { id: 1, name: 'Action' }, { id: 2, name: 'Adventure' }, { id: 4, name: 'Comedy' },
  { id: 8, name: 'Drama' }, { id: 10, name: 'Fantasy' }, { id: 14, name: 'Horror' },
  { id: 7, name: 'Mystery' }, { id: 22, name: 'Romance' }, { id: 24, name: 'Sci-Fi' },
  { id: 36, name: 'Slice of Life' }, { id: 30, name: 'Sports' }, { id: 37, name: 'Supernatural' },
  { id: 41, name: 'Thriller' }, { id: 62, name: 'Isekai' }, { id: 17, name: 'Martial Arts' },
  { id: 18, name: 'Mecha' }, { id: 38, name: 'Military' }, { id: 19, name: 'Music' },
  { id: 6, name: 'Demons' }, { id: 23, name: 'School' }, { id: 27, name: 'Shounen' },
  { id: 42, name: 'Seinen' }, { id: 25, name: 'Shoujo' }, { id: 45, name: 'Psychological' },
];

// ─── SCORE COLOR ──────────────────────────────────────────────────
const scoreColor = (s) => {
  if (!s) return '#6b5f82';
  if (s >= 8.5) return '#f59e0b';
  if (s >= 7.5) return '#10b981';
  if (s >= 6.5) return '#a855f7';
  return '#6b7280';
};

// ─── ANIME CARD ───────────────────────────────────────────────────
function AnimeCard({ anime, onClick, style }) {
  const [imgErr, setImgErr] = useState(false);
  const img = anime?.images?.jpg?.large_image_url || anime?.images?.jpg?.image_url;
  const score = anime?.score;
  const episodes = anime?.episodes;
  const status = anime?.status;
  const type = anime?.type;

  return (
    <div
      onClick={() => onClick(anime)}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        animation: 'fadeIn 0.4s ease both',
        position: 'relative',
        ...style,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
        e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
        e.currentTarget.style.borderColor = 'var(--border-glow)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
      }}
    >
      {/* Poster */}
      <div style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden', background: '#0d0d1e' }}>
        {!imgErr && img ? (
          <img
            src={img}
            alt={anime.title}
            loading="lazy"
            onError={() => setImgErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.07)'}
            onMouseLeave={e => e.currentTarget.style.transform = ''}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f0f25, #1a0a35)',
            color: 'var(--text-muted)', fontSize: 36
          }}>
            <Film size={40} color="var(--purple-core)" />
          </div>
        )}

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(5,5,13,0.95) 0%, rgba(5,5,13,0.4) 50%, transparent 100%)',
        }} />

        {/* Score badge */}
        {score && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(5,5,13,0.85)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${scoreColor(score)}44`,
            borderRadius: 6, padding: '3px 7px',
            fontSize: 11, fontWeight: 700,
            color: scoreColor(score),
            display: 'flex', alignItems: 'center', gap: 3,
            animation: 'badge-pop 0.3s ease',
          }}>
            <Star size={9} fill={scoreColor(score)} color={scoreColor(score)} />
            {score.toFixed(1)}
          </div>
        )}

        {/* Status badge */}
        {status === 'Currently Airing' && (
          <div style={{
            position: 'absolute', top: 8, left: 8,
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.4)',
            borderRadius: 5, padding: '2px 6px',
            fontSize: 9, fontWeight: 700, color: '#10b981',
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            ● AIRING
          </div>
        )}

        {/* Play overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0, transition: 'opacity 0.2s ease',
        }}
          className="play-overlay"
          onMouseEnter={e => e.currentTarget.style.opacity = 1}
          onMouseLeave={e => e.currentTarget.style.opacity = 0}
        >
          <div style={{
            width: 52, height: 52,
            background: 'rgba(124,58,237,0.85)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(124,58,237,0.6)',
          }}>
            <Play size={22} fill="white" color="white" style={{ marginLeft: 3 }} />
          </div>
        </div>

        {/* Type badge */}
        {type && (
          <div style={{
            position: 'absolute', bottom: 8, left: 8,
            background: 'rgba(124,58,237,0.2)',
            border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: 4, padding: '2px 6px',
            fontSize: 9, fontWeight: 600, color: 'var(--purple-light)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>{type}</div>
        )}

        {episodes && (
          <div style={{
            position: 'absolute', bottom: 8, right: 8,
            background: 'rgba(5,5,13,0.8)',
            borderRadius: 4, padding: '2px 6px',
            fontSize: 9, fontWeight: 600, color: 'var(--text-secondary)',
          }}>{episodes} eps</div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px 12px' }}>
        <h3 style={{
          fontSize: 12, fontWeight: 600, color: 'var(--text-primary)',
          fontFamily: 'var(--font-title)',
          lineHeight: 1.4, letterSpacing: '0.02em',
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          marginBottom: 6,
        }}>{anime.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 9, padding: '2px 6px',
            background: 'var(--purple-soft)',
            border: '1px solid rgba(168,85,247,0.2)',
            borderRadius: 4, color: 'var(--purple-light)',
            fontWeight: 600, letterSpacing: '0.04em',
          }}>SUB INDO</span>
          {anime.year && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{anime.year}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ANIME MODAL ──────────────────────────────────────────────────
function AnimeModal({ anime, onClose }) {
  const [activeTab, setActiveTab] = useState('info');
  const [trailerOpen, setTrailerOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!anime) return null;
  const img = anime?.images?.jpg?.large_image_url || anime?.images?.jpg?.image_url;
  const genres = anime.genres || [];
  const trailer = anime.trailer?.embed_url;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-modal)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          maxWidth: 780, width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 25px 80px rgba(0,0,0,0.8), 0 0 60px rgba(124,58,237,0.15)',
          animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Hero */}
        <div style={{ position: 'relative', height: 260, overflow: 'hidden', flexShrink: 0 }}>
          {img && (
            <img
              src={img}
              alt={anime.title}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                filter: 'blur(2px) brightness(0.35)',
                transform: 'scale(1.05)',
              }}
            />
          )}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(5,5,13,0.3) 0%, rgba(5,5,13,0.98) 100%)',
          }} />

          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '0 28px 24px',
            display: 'flex', gap: 20, alignItems: 'flex-end',
          }}>
            {img && (
              <img
                src={img}
                alt=""
                style={{
                  width: 120, height: 170,
                  objectFit: 'cover',
                  borderRadius: 12,
                  border: '2px solid var(--border-glow)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                  flexShrink: 0,
                }}
              />
            )}
            <div style={{ flex: 1, paddingBottom: 4 }}>
              <h2 style={{
                fontFamily: 'var(--font-title)',
                fontSize: 22, fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '0.03em',
                marginBottom: 8, lineHeight: 1.3,
              }}>{anime.title}</h2>
              {anime.title_english && anime.title_english !== anime.title && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, fontStyle: 'italic' }}>
                  {anime.title_english}
                </p>
              )}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {anime.score && (
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: 'rgba(245,158,11,0.12)',
                    border: '1px solid rgba(245,158,11,0.3)',
                    borderRadius: 8, padding: '4px 10px',
                    fontSize: 13, fontWeight: 700, color: '#f59e0b',
                  }}>
                    <Star size={12} fill="#f59e0b" color="#f59e0b" />
                    {anime.score}
                  </span>
                )}
                {anime.type && (
                  <span style={{
                    background: 'var(--purple-soft)',
                    border: '1px solid rgba(168,85,247,0.3)',
                    borderRadius: 8, padding: '4px 10px',
                    fontSize: 11, fontWeight: 600, color: 'var(--purple-light)',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>{anime.type}</span>
                )}
                {anime.status === 'Currently Airing' && (
                  <span style={{
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: 8, padding: '4px 10px',
                    fontSize: 11, fontWeight: 600, color: '#10b981',
                  }}>● Sedang Tayang</span>
                )}
                <span style={{
                  background: 'rgba(124,58,237,0.15)',
                  border: '1px solid rgba(124,58,237,0.3)',
                  borderRadius: 8, padding: '4px 10px',
                  fontSize: 11, fontWeight: 600, color: 'var(--purple-light)',
                }}>SUB INDO</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(5,5,13,0.7)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '50%', width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)', transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(124,58,237,0.3)';
              e.currentTarget.style.borderColor = 'var(--purple-bright)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(5,5,13,0.7)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 0,
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 28px',
          flexShrink: 0,
        }}>
          {[['info', 'Info'], ['trailer', 'Trailer']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '14px 20px',
                fontSize: 13, fontWeight: 600,
                fontFamily: 'var(--font-title)',
                color: activeTab === key ? 'var(--purple-bright)' : 'var(--text-muted)',
                borderBottom: activeTab === key ? '2px solid var(--purple-bright)' : '2px solid transparent',
                marginBottom: -1,
                transition: 'all 0.2s',
                letterSpacing: '0.04em',
              }}
            >{label}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
          {activeTab === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Synopsis */}
              {anime.synopsis && (
                <div>
                  <h4 style={{ fontFamily: 'var(--font-title)', fontSize: 12, fontWeight: 600,
                    color: 'var(--purple-light)', textTransform: 'uppercase', letterSpacing: '0.1em',
                    marginBottom: 10 }}>Sinopsis</h4>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                    {anime.synopsis}
                  </p>
                </div>
              )}

              {/* Details grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  ['Studio', anime.studios?.map(s => s.name).join(', ') || '—'],
                  ['Episode', anime.episodes ? `${anime.episodes} eps` : 'Ongoing'],
                  ['Durasi', anime.duration || '—'],
                  ['Tahun', anime.year || anime.aired?.prop?.from?.year || '—'],
                  ['Rating', anime.rating || '—'],
                  ['Rank', anime.rank ? `#${anime.rank}` : '—'],
                  ['Popularity', anime.popularity ? `#${anime.popularity}` : '—'],
                  ['Members', anime.members ? anime.members.toLocaleString() : '—'],
                ].map(([key, val]) => (
                  <div key={key} style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 10, padding: '12px 14px',
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{key}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Genres */}
              {genres.length > 0 && (
                <div>
                  <h4 style={{ fontFamily: 'var(--font-title)', fontSize: 12, fontWeight: 600,
                    color: 'var(--purple-light)', textTransform: 'uppercase', letterSpacing: '0.1em',
                    marginBottom: 10 }}>Genre</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {genres.map(g => (
                      <span key={g.mal_id} style={{
                        background: 'var(--purple-soft)',
                        border: '1px solid rgba(168,85,247,0.25)',
                        borderRadius: 8, padding: '5px 12px',
                        fontSize: 12, color: 'var(--purple-light)', fontWeight: 500,
                      }}>{g.name}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'trailer' && (
            <div>
              {trailer ? (
                <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: 12, overflow: 'hidden' }}>
                  <iframe
                    src={trailer}
                    title="Trailer"
                    style={{
                      position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none',
                    }}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div style={{
                  textAlign: 'center', padding: '60px 20px',
                  color: 'var(--text-muted)',
                }}>
                  <Film size={48} color="var(--purple-core)" style={{ margin: '0 auto 16px' }} />
                  <p style={{ fontSize: 14 }}>Trailer tidak tersedia</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{
          padding: '16px 28px 24px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex', gap: 12, flexShrink: 0,
        }}>
          <a
            href={`https://myanimelist.net/anime/${anime.mal_id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'linear-gradient(135deg, var(--purple-core), var(--violet-edge))',
              border: 'none', borderRadius: 10, padding: '13px 20px',
              fontSize: 14, fontWeight: 700, color: 'white',
              fontFamily: 'var(--font-title)', letterSpacing: '0.05em',
              boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(124,58,237,0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.35)';
            }}
          >
            <ExternalLink size={16} />
            Lihat di MAL
          </a>
          <button
            onClick={onClose}
            style={{
              padding: '13px 20px',
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: 10, fontSize: 14, color: 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--border-glow)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── NAVBAR ───────────────────────────────────────────────────────
function Navbar({ page, setPage, searchQuery, setSearchQuery, onSearch }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const navLinks = [
    { key: 'home', label: 'Beranda', icon: <Home size={15} /> },
    { key: 'browse', label: 'Semua Anime', icon: <Grid size={15} /> },
    { key: 'trending', label: 'Trending', icon: <Flame size={15} /> },
    { key: 'ongoing', label: 'Ongoing', icon: <Tv size={15} /> },
  ];

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 64,
      background: scrolled ? 'rgba(5,5,13,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border-subtle)' : '1px solid transparent',
      transition: 'all 0.3s ease',
      display: 'flex', alignItems: 'center',
      padding: '0 clamp(16px, 4vw, 48px)',
      gap: 24,
    }}>
      {/* Logo */}
      <div
        onClick={() => setPage('home')}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(16px, 2vw, 22px)',
          fontWeight: 900,
          background: 'linear-gradient(135deg, #c084fc 0%, #a855f7 40%, #7c3aed 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          cursor: 'pointer',
          letterSpacing: '0.05em',
          flexShrink: 0,
          filter: 'drop-shadow(0 0 12px rgba(168,85,247,0.4))',
        }}
      >HillzNime</div>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 4, flex: 1 }}>
        {navLinks.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setPage(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: page === key ? 'var(--purple-soft)' : 'transparent',
              border: page === key ? '1px solid rgba(168,85,247,0.25)' : '1px solid transparent',
              borderRadius: 8, padding: '6px 12px',
              fontSize: 13, fontWeight: page === key ? 600 : 400,
              color: page === key ? 'var(--purple-bright)' : 'var(--text-secondary)',
              transition: 'all 0.2s', cursor: 'pointer', flexShrink: 0,
              fontFamily: 'var(--font-body)',
            }}
            onMouseEnter={e => {
              if (page !== key) {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }
            }}
            onMouseLeave={e => {
              if (page !== key) {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSearch()}
          placeholder="Cari anime..."
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 10, padding: '8px 36px 8px 14px',
            fontSize: 13, color: 'var(--text-primary)',
            width: 200, outline: 'none',
            transition: 'all 0.2s',
          }}
          onFocus={e => {
            e.target.style.borderColor = 'var(--purple-bright)';
            e.target.style.boxShadow = '0 0 0 3px rgba(168,85,247,0.12)';
          }}
          onBlur={e => {
            e.target.style.borderColor = 'var(--border-subtle)';
            e.target.style.boxShadow = '';
          }}
        />
        <button
          onClick={onSearch}
          style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            background: 'transparent', border: 'none',
            color: 'var(--text-muted)', cursor: 'pointer',
            display: 'flex', alignItems: 'center',
          }}
        >
          <Search size={15} />
        </button>
      </div>
    </nav>
  );
}

// ─── HERO SECTION ─────────────────────────────────────────────────
function Hero({ featured, onSelect, onBrowse }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!featured?.length) return;
    const t = setInterval(() => setIdx(i => (i + 1) % Math.min(featured.length, 5)), 6000);
    return () => clearInterval(t);
  }, [featured]);

  if (!featured?.length) return (
    <div style={{ height: 520, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );

  const anime = featured[idx];
  const img = anime?.images?.jpg?.large_image_url;

  return (
    <div style={{ position: 'relative', height: 520, overflow: 'hidden', marginBottom: 60 }}>
      {/* BG */}
      {img && (
        <img
          key={anime.mal_id}
          src={img}
          alt=""
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.25) saturate(0.8)',
            transition: 'opacity 0.8s ease',
            animation: 'fadeIn 0.8s ease',
          }}
        />
      )}

      {/* Gradients */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, transparent 50%), linear-gradient(to right, rgba(5,5,13,0.9) 0%, rgba(5,5,13,0.5) 50%, transparent 100%), linear-gradient(to top, rgba(5,5,13,1) 0%, transparent 60%)',
      }} />

      {/* Content */}
      <div style={{
        position: 'absolute', bottom: 60, left: 'clamp(24px, 5vw, 80px)',
        maxWidth: 520, animation: 'fadeIn 0.5s ease',
      }}>
        <div style={{
          display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center',
        }}>
          {anime.score && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(245,158,11,0.15)',
              border: '1px solid rgba(245,158,11,0.35)',
              borderRadius: 8, padding: '4px 10px',
              fontSize: 12, fontWeight: 700, color: '#f59e0b',
            }}>
              <Star size={11} fill="#f59e0b" color="#f59e0b" /> {anime.score}
            </span>
          )}
          <span style={{
            background: 'var(--purple-soft)',
            border: '1px solid rgba(168,85,247,0.3)',
            borderRadius: 8, padding: '4px 10px',
            fontSize: 11, fontWeight: 700, color: 'var(--purple-light)',
            textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>SUB INDO</span>
          {anime.status === 'Currently Airing' && (
            <span style={{
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 8, padding: '4px 10px',
              fontSize: 11, fontWeight: 700, color: '#10b981',
            }}>● SEDANG TAYANG</span>
          )}
        </div>

        <h1 style={{
          fontFamily: 'var(--font-title)',
          fontSize: 'clamp(24px, 4vw, 42px)',
          fontWeight: 800, lineHeight: 1.2,
          color: 'var(--text-primary)',
          letterSpacing: '0.02em',
          marginBottom: 14,
          textShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}>{anime.title}</h1>

        {anime.synopsis && (
          <p style={{
            fontSize: 14, color: 'var(--text-secondary)',
            lineHeight: 1.7, marginBottom: 24,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
          }}>{anime.synopsis}</p>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => onSelect(anime)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, var(--purple-core), var(--violet-edge))',
              border: 'none', borderRadius: 12, padding: '13px 28px',
              fontSize: 15, fontWeight: 700, color: 'white',
              fontFamily: 'var(--font-title)', letterSpacing: '0.05em',
              boxShadow: '0 4px 24px rgba(124,58,237,0.45)',
              transition: 'all 0.2s', cursor: 'pointer',
              animation: 'pulse-glow 3s infinite',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 8px 36px rgba(124,58,237,0.6)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(124,58,237,0.45)';
            }}
          >
            <Play size={18} fill="white" />
            Tonton Sekarang
          </button>
          <button
            onClick={onBrowse}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              borderRadius: 12, padding: '13px 24px',
              fontSize: 15, fontWeight: 600, color: 'var(--text-primary)',
              fontFamily: 'var(--font-title)',
              transition: 'all 0.2s', cursor: 'pointer',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
            }}
          >
            <Info size={16} />
            Detail
          </button>
        </div>
      </div>

      {/* Dots */}
      <div style={{
        position: 'absolute', bottom: 24, right: 'clamp(24px, 5vw, 80px)',
        display: 'flex', gap: 8,
      }}>
        {featured.slice(0, 5).map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            style={{
              width: i === idx ? 24 : 8, height: 8,
              background: i === idx ? 'var(--purple-bright)' : 'rgba(255,255,255,0.25)',
              border: 'none', borderRadius: 4, cursor: 'pointer',
              transition: 'all 0.3s ease',
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── ANIME GRID ───────────────────────────────────────────────────
function AnimeGrid({ title, animes, onSelect, loading, icon }) {
  if (!loading && !animes?.length) return null;

  return (
    <section style={{ marginBottom: 56 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 22,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 4, height: 24,
            background: 'linear-gradient(to bottom, var(--purple-bright), var(--violet-edge))',
            borderRadius: 2,
          }} />
          {icon && <span style={{ color: 'var(--purple-light)' }}>{icon}</span>}
          <h2 style={{
            fontFamily: 'var(--font-title)',
            fontSize: 18, fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '0.05em',
          }}>{title}</h2>
        </div>
      </div>

      {loading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 16,
        }}>
          {Array(8).fill(0).map((_, i) => (
            <div key={i} style={{ borderRadius: 12, overflow: 'hidden' }}>
              <div className="skeleton" style={{ aspectRatio: '2/3' }} />
              <div style={{ padding: '10px 12px', background: 'var(--bg-card)' }}>
                <div className="skeleton" style={{ height: 12, borderRadius: 6, marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 10, width: '60%', borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 16,
        }}>
          {animes.map((a, i) => (
            <AnimeCard
              key={a.mal_id}
              anime={a}
              onClick={onSelect}
              style={{ animationDelay: `${i * 0.05}s` }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── GENRE FILTER BAR ──────────────────────────────────────────────
function GenreBar({ selected, onSelect }) {
  const ref = useRef(null);

  return (
    <div style={{ position: 'relative', marginBottom: 32 }}>
      <div
        ref={ref}
        style={{
          display: 'flex', gap: 8, overflowX: 'auto',
          paddingBottom: 8,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <button
          onClick={() => onSelect(null)}
          style={{
            flexShrink: 0,
            background: !selected ? 'linear-gradient(135deg, var(--purple-core), var(--violet-edge))' : 'var(--bg-card)',
            border: !selected ? 'none' : '1px solid var(--border-subtle)',
            borderRadius: 20, padding: '7px 16px',
            fontSize: 12, fontWeight: 600,
            color: !selected ? 'white' : 'var(--text-secondary)',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >Semua</button>
        {ALL_GENRES.map(g => (
          <button
            key={g.id}
            onClick={() => onSelect(g.id)}
            style={{
              flexShrink: 0,
              background: selected === g.id ? 'linear-gradient(135deg, var(--purple-core), var(--violet-edge))' : 'var(--bg-card)',
              border: selected === g.id ? 'none' : '1px solid var(--border-subtle)',
              borderRadius: 20, padding: '7px 16px',
              fontSize: 12, fontWeight: 600,
              color: selected === g.id ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              if (selected !== g.id) {
                e.currentTarget.style.borderColor = 'var(--border-glow)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={e => {
              if (selected !== g.id) {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
          >{g.name}</button>
        ))}
      </div>
    </div>
  );
}

// ─── FEATURES BANNER ──────────────────────────────────────────────
function FeaturesBanner() {
  const features = [
    { icon: <Shield size={20} />, title: 'Bebas Iklan', desc: 'Streaming bersih tanpa gangguan' },
    { icon: <Globe size={20} />, title: 'Sub Indo', desc: 'Subtitle Indonesia lengkap' },
    { icon: <Zap size={20} />, title: 'HD Quality', desc: 'Kualitas terbaik hingga 1080p' },
    { icon: <BookOpen size={20} />, title: 'Lengkap', desc: 'Semua genre, semua era' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: 16, marginBottom: 60,
    }}>
      {features.map(({ icon, title, desc }) => (
        <div key={title} style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '20px 24px',
          display: 'flex', gap: 14, alignItems: 'center',
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--border-glow)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.12)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.boxShadow = '';
          }}
        >
          <div style={{
            width: 44, height: 44, flexShrink: 0,
            background: 'var(--purple-soft)',
            border: '1px solid rgba(168,85,247,0.25)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--purple-bright)',
          }}>{icon}</div>
          <div>
            <div style={{ fontFamily: 'var(--font-title)', fontSize: 14, fontWeight: 700,
              color: 'var(--text-primary)', marginBottom: 3 }}>{title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-subtle)',
      padding: '40px clamp(24px, 5vw, 80px)',
      marginTop: 80,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 24, fontWeight: 900,
              background: 'linear-gradient(135deg, #c084fc 0%, #a855f7 50%, #7c3aed 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              marginBottom: 8,
            }}>HillzNime</div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 280, lineHeight: 1.6 }}>
              Nonton anime terbaru dengan subtitle Indonesia. Data oleh Jikan API & MyAnimeList.
            </p>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>
            <p>Data: Jikan API (MyAnimeList)</p>
            <p style={{ marginTop: 4 }}>© 2025 HillzNime</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnime, setSelectedAnime] = useState(null);

  // Data states
  const [airingAnimes, setAiringAnimes] = useState([]);
  const [trendingAnimes, setTrendingAnimes] = useState([]);
  const [topAnimes, setTopAnimes] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [browseAnimes, setBrowseAnimes] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);

  // Loading states
  const [loadingAiring, setLoadingAiring] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingTop, setLoadingTop] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingBrowse, setLoadingBrowse] = useState(false);

  const [browsePage, setBrowsePage] = useState(1);
  const [browseTotalPages, setBrowseTotalPages] = useState(1);

  // Fetch on mount
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingAiring(true);
        const { data } = await fetcher(`${BASE}/seasons/now?limit=20`);
        setAiringAnimes(data || []);
      } catch (e) {}
      setLoadingAiring(false);
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingTrending(true);
        await delay(500);
        const { data } = await fetcher(`${BASE}/top/anime?filter=airing&limit=20`);
        setTrendingAnimes(data || []);
      } catch (e) {}
      setLoadingTrending(false);
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingTop(true);
        await delay(900);
        const { data } = await fetcher(`${BASE}/top/anime?limit=20`);
        setTopAnimes(data || []);
      } catch (e) {}
      setLoadingTop(false);
    };
    load();
  }, []);

  // Browse fetch
  const fetchBrowse = useCallback(async (genreId, p = 1) => {
    setLoadingBrowse(true);
    try {
      await delay(300);
      const url = genreId
        ? `${BASE}/anime?genres=${genreId}&page=${p}&limit=24&order_by=score&sort=desc`
        : `${BASE}/top/anime?page=${p}&limit=24`;
      const { data, pagination } = await fetcher(url);
      setBrowseAnimes(data || []);
      setBrowseTotalPages(pagination?.last_visible_page || 1);
    } catch (e) {}
    setLoadingBrowse(false);
  }, []);

  useEffect(() => {
    if (page === 'browse') {
      fetchBrowse(selectedGenre, browsePage);
    }
  }, [page, selectedGenre, browsePage]);

  const handleGenreSelect = (gId) => {
    setSelectedGenre(gId);
    setBrowsePage(1);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setPage('search');
    setLoadingSearch(true);
    try {
      const { data } = await fetcher(`${BASE}/anime?q=${encodeURIComponent(searchQuery)}&limit=24`);
      setSearchResults(data || []);
    } catch (e) {
      setSearchResults([]);
    }
    setLoadingSearch(false);
  };

  const pad = 'clamp(24px, 5vw, 80px)';
  const maxW = '1400px';

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-body)' }}>
      <Navbar
        page={page}
        setPage={setPage}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
      />

      {/* HOME */}
      {page === 'home' && (
        <main>
          <Hero
            featured={airingAnimes.slice(0, 5)}
            onSelect={setSelectedAnime}
            onBrowse={() => setPage('browse')}
          />
          <div style={{ padding: `0 ${pad}`, maxWidth: maxW, margin: '0 auto' }}>
            <FeaturesBanner />
            <AnimeGrid
              title="Sedang Tayang"
              animes={airingAnimes}
              onSelect={setSelectedAnime}
              loading={loadingAiring}
              icon={<Tv size={18} />}
            />
            <AnimeGrid
              title="Trending Sekarang"
              animes={trendingAnimes}
              onSelect={setSelectedAnime}
              loading={loadingTrending}
              icon={<Flame size={18} />}
            />
            <AnimeGrid
              title="Top Sepanjang Masa"
              animes={topAnimes}
              onSelect={setSelectedAnime}
              loading={loadingTop}
              icon={<Star size={18} />}
            />
          </div>
          <Footer />
        </main>
      )}

      {/* BROWSE */}
      {page === 'browse' && (
        <main style={{ paddingTop: 88 }}>
          <div style={{ padding: `0 ${pad}`, maxWidth: maxW, margin: '0 auto' }}>
            <div style={{ marginBottom: 32 }}>
              <h1 style={{
                fontFamily: 'var(--font-title)',
                fontSize: 28, fontWeight: 800,
                background: 'linear-gradient(135deg, var(--text-primary), var(--purple-light))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                marginBottom: 8,
              }}>Semua Anime</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                Seluruh koleksi anime dengan subtitle Indonesia
              </p>
            </div>

            <GenreBar selected={selectedGenre} onSelect={handleGenreSelect} />

            {loadingBrowse ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 16,
              }}>
                {Array(24).fill(0).map((_, i) => (
                  <div key={i} style={{ borderRadius: 12, overflow: 'hidden' }}>
                    <div className="skeleton" style={{ aspectRatio: '2/3' }} />
                    <div style={{ padding: '10px 12px', background: 'var(--bg-card)' }}>
                      <div className="skeleton" style={{ height: 12, borderRadius: 6, marginBottom: 8 }} />
                      <div className="skeleton" style={{ height: 10, width: '60%', borderRadius: 6 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 16,
              }}>
                {browseAnimes.map((a, i) => (
                  <AnimeCard
                    key={a.mal_id}
                    anime={a}
                    onClick={setSelectedAnime}
                    style={{ animationDelay: `${i * 0.04}s` }}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {browseTotalPages > 1 && (
              <div style={{
                display: 'flex', justifyContent: 'center', gap: 8,
                marginTop: 48, flexWrap: 'wrap',
              }}>
                <button
                  onClick={() => setBrowsePage(p => Math.max(1, p - 1))}
                  disabled={browsePage === 1}
                  style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                    borderRadius: 10, padding: '8px 16px', fontSize: 13,
                    color: browsePage === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                    cursor: browsePage === 1 ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                ><ChevronLeft size={15} /> Prev</button>

                {Array.from({ length: Math.min(5, browseTotalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(browsePage - 2 + i, browseTotalPages - 4 + i));
                  return (
                    <button
                      key={p}
                      onClick={() => setBrowsePage(p)}
                      style={{
                        background: browsePage === p ? 'var(--purple-core)' : 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 10, padding: '8px 14px', fontSize: 13,
                        color: browsePage === p ? 'white' : 'var(--text-secondary)',
                        cursor: 'pointer', fontWeight: browsePage === p ? 700 : 400,
                      }}
                    >{p}</button>
                  );
                })}

                <button
                  onClick={() => setBrowsePage(p => Math.min(browseTotalPages, p + 1))}
                  disabled={browsePage >= browseTotalPages}
                  style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                    borderRadius: 10, padding: '8px 16px', fontSize: 13,
                    color: browsePage >= browseTotalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                    cursor: browsePage >= browseTotalPages ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >Next <ChevronRight size={15} /></button>
              </div>
            )}
          </div>
          <Footer />
        </main>
      )}

      {/* TRENDING */}
      {page === 'trending' && (
        <main style={{ paddingTop: 88 }}>
          <div style={{ padding: `0 ${pad}`, maxWidth: maxW, margin: '0 auto' }}>
            <div style={{ marginBottom: 40 }}>
              <h1 style={{
                fontFamily: 'var(--font-title)',
                fontSize: 28, fontWeight: 800,
                background: 'linear-gradient(135deg, #f59e0b, var(--purple-light))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                marginBottom: 8,
              }}>Trending Anime</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Anime yang paling banyak ditonton sekarang</p>
            </div>
            <AnimeGrid
              title="Trending Sekarang"
              animes={trendingAnimes}
              onSelect={setSelectedAnime}
              loading={loadingTrending}
              icon={<TrendingUp size={18} />}
            />
            <AnimeGrid
              title="Top Rating"
              animes={topAnimes}
              onSelect={setSelectedAnime}
              loading={loadingTop}
              icon={<Star size={18} />}
            />
          </div>
          <Footer />
        </main>
      )}

      {/* ONGOING */}
      {page === 'ongoing' && (
        <main style={{ paddingTop: 88 }}>
          <div style={{ padding: `0 ${pad}`, maxWidth: maxW, margin: '0 auto' }}>
            <div style={{ marginBottom: 40 }}>
              <h1 style={{
                fontFamily: 'var(--font-title)',
                fontSize: 28, fontWeight: 800,
                background: 'linear-gradient(135deg, #10b981, var(--purple-light))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                marginBottom: 8,
              }}>Sedang Tayang</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Anime yang sedang update episode baru</p>
            </div>
            <AnimeGrid
              title="Musim Ini"
              animes={airingAnimes}
              onSelect={setSelectedAnime}
              loading={loadingAiring}
              icon={<Tv size={18} />}
            />
          </div>
          <Footer />
        </main>
      )}

      {/* SEARCH */}
      {page === 'search' && (
        <main style={{ paddingTop: 88 }}>
          <div style={{ padding: `0 ${pad}`, maxWidth: maxW, margin: '0 auto' }}>
            <div style={{ marginBottom: 40 }}>
              <h1 style={{
                fontFamily: 'var(--font-title)',
                fontSize: 22, fontWeight: 700,
                color: 'var(--text-primary)', marginBottom: 4,
              }}>
                Hasil pencarian: <span style={{ color: 'var(--purple-bright)' }}>"{searchQuery}"</span>
              </h1>
              {!loadingSearch && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  {searchResults.length} anime ditemukan
                </p>
              )}
            </div>

            {loadingSearch ? (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="spinner" style={{ margin: '0 auto 16px' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Mencari anime...</p>
                </div>
              </div>
            ) : searchResults.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 80 }}>
                <Search size={56} color="var(--purple-core)" style={{ margin: '0 auto 20px' }} />
                <h3 style={{ fontFamily: 'var(--font-title)', fontSize: 18,
                  color: 'var(--text-secondary)', marginBottom: 8 }}>Tidak ditemukan</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  Coba kata kunci yang berbeda
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 16,
              }}>
                {searchResults.map((a, i) => (
                  <AnimeCard
                    key={a.mal_id}
                    anime={a}
                    onClick={setSelectedAnime}
                    style={{ animationDelay: `${i * 0.04}s` }}
                  />
                ))}
              </div>
            )}
          </div>
          <Footer />
        </main>
      )}

      {/* MODAL */}
      {selectedAnime && (
        <AnimeModal anime={selectedAnime} onClose={() => setSelectedAnime(null)} />
      )}
    </div>
  );
}
