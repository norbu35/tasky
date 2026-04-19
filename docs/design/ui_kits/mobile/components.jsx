// Tasky Mobile UI Kit — Shared Components
// Exposes all components to window for use across scripts

const T = {
  canvas: '#F9F8F5', ink: '#1B3A5C', inkDeep: '#102638',
  surface: '#FFFFFF', sun: '#8B6914', sunLight: '#C49A3C',
  sky: '#6BA3BE', subtle: '#F3F1EC', line: '#C7D0D9',
  field: '#DBE0E5', muted: '#576473', textSec: '#5E6B78',
  textTert: '#808D99', verified: '#469178', trust: '#3568A1',
  trustMuted: '#B3C4D6', danger: '#EF4444', navInactive: '#6C7B89',
  chipInactive: '#D8DDE2', statusOpen: '#EDE9E2', statusOpenFg: '#657381',
};

const fonts = {
  display: "'Manrope', Roboto, sans-serif",
  sans: "'Plus Jakarta Sans', Roboto, sans-serif",
};

// ── Button ───────────────────────────────────────────────────────
function Button({ label, variant = 'primary', size = 'md', fullWidth, onClick, style, children }) {
  const [pressed, setPressed] = React.useState(false);
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, border: 'none', cursor: 'pointer', fontFamily: fonts.sans,
    fontWeight: 700, transition: 'transform 0.12s, opacity 0.12s',
    transform: pressed ? 'scale(0.97)' : 'scale(1)',
    opacity: pressed ? 0.88 : 1,
    borderRadius: 8, outline: 'none',
    width: fullWidth ? '100%' : undefined,
  };
  const sizes = { sm: { height: 40, fontSize: 14, padding: '0 14px' }, md: { height: 48, fontSize: 16, padding: '0 20px' }, lg: { height: 56, fontSize: 16, padding: '0 28px' } };
  const variants = {
    primary:   { background: T.ink, color: '#fff', boxShadow: '0 4px 6px -4px rgba(0,0,0,.1),0 10px 15px -3px rgba(0,0,0,.1)' },
    secondary: { background: T.sunLight, color: '#fff', boxShadow: '0 4px 6px -4px rgba(0,0,0,.1)' },
    outline:   { background: 'transparent', color: T.ink, border: `1.5px solid ${T.line}` },
    ghost:     { background: 'transparent', color: T.ink },
    danger:    { background: T.danger, color: '#fff' },
    dark:      { background: `linear-gradient(${T.inkDeep}, ${T.ink})`, color: '#fff', boxShadow: '0 4px 6px -4px rgba(0,0,0,.15),0 10px 15px -3px rgba(0,0,0,.12)' },
  };
  return (
    <button
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onClick={onClick}
    >
      {children || label}
    </button>
  );
}

// ── VerifiedBadge ────────────────────────────────────────────────
function VerifiedBadge({ status = 'verified', size = 'sm' }) {
  if (status === 'unverified') return null;
  const isV = status === 'verified';
  const bg = isV ? T.verified : T.sky;
  const pad = size === 'sm' ? '2px 8px' : '4px 10px';
  const fs = size === 'sm' ? 10 : 12;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: bg, color: '#fff', borderRadius: 9999, padding: pad, fontSize: fs, fontWeight: 700, fontFamily: fonts.sans }}>
      <svg width={fs} height={fs} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
      </svg>
      {size === 'md' && (isV ? 'Баталгаажсан' : 'Хянагдаж байна')}
    </span>
  );
}

// ── StatusBadge ──────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    open:      { bg: T.statusOpen,  fg: T.statusOpenFg, label: 'Нээлттэй' },
    assigned:  { bg: T.ink,         fg: '#fff',         label: 'Хуваарилагдсан' },
    completed: { bg: T.verified,    fg: '#fff',         label: 'Дууссан' },
    cancelled: { bg: T.subtle,      fg: T.muted,        label: 'Цуцлагдсан' },
    no_show:   { bg: T.danger,      fg: '#fff',         label: 'Ирээгүй' },
  };
  const s = map[status] || map.open;
  return (
    <span style={{ display: 'inline-block', background: s.bg, color: s.fg, borderRadius: 9999, padding: '3px 10px', fontSize: 10, fontWeight: 700, fontFamily: fonts.sans, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
      {s.label}
    </span>
  );
}

// ── ProfileAvatar ────────────────────────────────────────────────
function ProfileAvatar({ initials = '?', size = 40, showVerified, imageUrl, radius }) {
  const r = radius !== undefined ? radius : (size >= 80 ? 9999 : 12);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {imageUrl
        ? <img src={imageUrl} style={{ width: size, height: size, borderRadius: r, objectFit: 'cover', display: 'block' }} />
        : <div style={{ width: size, height: size, borderRadius: r, background: T.subtle, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.inkDeep, fontFamily: fonts.display, fontWeight: 700, fontSize: size * 0.35 }}>{initials}</div>
      }
      {showVerified && (
        <div style={{ position: 'absolute', bottom: -2, right: -2, width: size * 0.32 + 6, height: size * 0.32 + 6, borderRadius: 9999, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>
          <div style={{ width: size * 0.28, height: size * 0.28, borderRadius: 9999, background: T.verified, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={size * 0.18} height={size * 0.18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
        </div>
      )}
    </div>
  );
}

// ── RatingStars ──────────────────────────────────────────────────
function RatingStars({ value = 4.8, count, size = 14 }) {
  const stars = [1,2,3,4,5].map(s => (
    <svg key={s} width={size} height={size} viewBox="0 0 24 24" fill={s <= Math.round(value) ? T.sunLight : 'none'} stroke={s <= Math.round(value) ? T.sunLight : T.chipInactive} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ));
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {stars}
      {count !== undefined && <span style={{ fontSize: 12, color: T.textSec, fontFamily: fonts.sans, marginLeft: 4 }}>{value} ({count})</span>}
    </span>
  );
}

// ── FilterChip ───────────────────────────────────────────────────
function FilterChip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 9999, padding: '6px 14px', fontSize: 13, fontWeight: 600, fontFamily: fonts.sans, cursor: 'pointer', border: active ? 'none' : `1.5px solid ${T.line}`, background: active ? T.ink : T.subtle, color: active ? '#fff' : T.ink, transition: 'all 0.15s', outline: 'none' }}>
      {label}
    </button>
  );
}

// ── Input ────────────────────────────────────────────────────────
function Input({ placeholder, value, onChange, type = 'text', icon, invalid, style }) {
  return (
    <div style={{ position: 'relative' }}>
      {icon && <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>{icon}</span>}
      <input
        type={type} placeholder={placeholder} value={value} onChange={onChange}
        style={{ width: '100%', height: 48, borderRadius: 8, border: `1.5px solid ${invalid ? T.danger : T.line}`, background: T.surface, padding: icon ? '0 14px 0 42px' : '0 14px', fontSize: 16, fontFamily: fonts.sans, color: T.ink, outline: 'none', boxSizing: 'border-box', ...style }}
      />
    </div>
  );
}

// ── TopBar ───────────────────────────────────────────────────────
function TopBar({ title, onBack, rightEl, transparent }) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, background: transparent ? 'transparent' : T.canvas, display: 'flex', alignItems: 'center', padding: '0 20px', zIndex: 10, gap: 12 }}>
      {onBack && (
        <button onClick={onBack} style={{ width: 36, height: 36, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
      )}
      <span style={{ flex: 1, fontFamily: fonts.display, fontWeight: 700, fontSize: 18, color: T.inkDeep }}>{title}</span>
      {rightEl}
    </div>
  );
}

// ── BottomNav ────────────────────────────────────────────────────
function BottomNav({ active, onNavigate }) {
  const tabs = [
    { id: 'browse', label: 'Даалгавар', icon: (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
    { id: 'jobs',   label: 'Ажлууд',   icon: (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg> },
    { id: 'inbox',  label: 'Inbox',    icon: (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    { id: 'profile',label: 'Профайл',  icon: (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  ];
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, borderRadius: '12px 12px 0 0', background: 'rgba(249,248,245,0.92)', backdropFilter: 'blur(16px)', boxShadow: '0 -4px 20px rgba(26,28,26,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', zIndex: 20 }}>
      {tabs.map(t => {
        const isActive = active === t.id;
        const c = isActive ? T.ink : T.navInactive;
        return (
          <button key={t.id} onClick={() => onNavigate(t.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px' }}>
            {t.icon(c)}
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, color: c, fontFamily: fonts.sans }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── TaskCard ─────────────────────────────────────────────────────
function TaskCard({ title, price, category, posterName, posterInitials, timeAgo, status, onClick }) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)}
      style={{ background: T.surface, borderRadius: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.06)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer', transform: pressed ? 'scale(0.98)' : 'scale(1)', transition: 'transform 0.12s' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {status && <StatusBadge status={status} />}
          <span style={{ background: T.subtle, borderRadius: 9999, padding: '3px 9px', fontSize: 11, fontWeight: 600, fontFamily: fonts.sans, color: T.ink }}>{category}</span>
        </div>
        <span style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 16, color: T.sunLight, whiteSpace: 'nowrap' }}>{price}</span>
      </div>
      <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 15, color: T.inkDeep, lineHeight: 1.35 }}>{title}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ProfileAvatar initials={posterInitials || posterName?.split(' ').map(w=>w[0]).join('').slice(0,2) || '?'} size={24} radius={8} />
          <span style={{ fontSize: 12, fontFamily: fonts.sans, color: T.textSec, fontWeight: 500 }}>{posterName}</span>
        </div>
        <span style={{ fontSize: 11, color: T.textTert, fontFamily: fonts.sans }}>{timeAgo}</span>
      </div>
    </div>
  );
}

// ── TrustBanner ──────────────────────────────────────────────────
function TrustBanner({ title, description }) {
  return (
    <div style={{ background: 'rgba(171,201,242,0.25)', border: `1px solid rgba(107,163,190,0.3)`, borderRadius: 8, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: 8, background: T.trust, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.trustMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.trustMuted, fontFamily: fonts.sans }}>{title}</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: T.ink, fontFamily: fonts.sans, marginTop: 2, lineHeight: 1.4 }}>{description}</div>
      </div>
    </div>
  );
}

// ── Expose to window ─────────────────────────────────────────────
Object.assign(window, {
  T, fonts,
  Button, VerifiedBadge, StatusBadge, ProfileAvatar,
  RatingStars, FilterChip, Input, TopBar, BottomNav,
  TaskCard, TrustBanner,
});
