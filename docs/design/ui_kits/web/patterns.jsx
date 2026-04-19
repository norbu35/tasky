// patterns.jsx — Navigation · Auth Layout · Page Templates · Empty States

function PatSection({ title, subtitle, children }) {
  return (
    <section style={{ marginBottom: 64 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--color-foreground)', margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
function PatRow({ label, children, gap = 20 }) {
  return (
    <div style={{ marginBottom: 28 }}>
      {label && <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.075em', color: 'var(--color-text-tertiary)', margin: '0 0 12px', fontFamily: 'var(--font-sans)' }}>{label}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap }}>{children}</div>
    </div>
  );
}

// Icons
const icons = {
  home:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  tasks:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>,
  inbox:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  profile: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  search:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  work:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  shield:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  plus:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  check:   <svg width="14" height="11" viewBox="0 0 14 11" fill="none"><path d="M1.5 5.5L5.5 9.5L12.5 1.5" stroke="#469178" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

// ── Desktop Sidebar ───────────────────────────────────────────────────────────
function DesktopSidebar({ role = 'CUSTOMER', activeIdx = 0 }) {
  const customerNav = [
    { icon: icons.home,    label: 'Home' },
    { icon: icons.tasks,   label: 'Tasks' },
    { icon: icons.inbox,   label: 'Inbox' },
    { icon: icons.profile, label: 'Profile' },
  ];
  const taskerNav = [
    { icon: icons.search,  label: 'Find Work' },
    { icon: icons.work,    label: 'My Jobs' },
    { icon: icons.inbox,   label: 'Inbox' },
    { icon: icons.profile, label: 'Profile' },
  ];
  const nav = role === 'TASKER' ? taskerNav : customerNav;
  return (
    <aside style={{ width: 224, background: '#fff', borderRight: '1px solid hsl(210 16% 80%)', height: 420, display: 'flex', flexDirection: 'column', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', height: 64, borderBottom: '1px solid hsl(210 16% 80%)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 12, background: 'linear-gradient(135deg, hsl(210 55% 14%), hsl(212 43% 23%))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(40 22% 96%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'hsl(212 43% 23%)', letterSpacing: '-0.02em' }}>Tasky</span>
      </div>
      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 12, flex: 1 }}>
        {nav.map((item, i) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 8, fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-sans)', color: i === activeIdx ? 'hsl(212 43% 23%)' : 'hsl(210 13% 39%)', background: i === activeIdx ? 'hsl(212 43% 23% / 0.08)' : 'transparent', cursor: 'pointer', pointerEvents: 'none' }}>
            <span style={{ color: i === activeIdx ? 'hsl(212 43% 23%)' : 'hsl(207 12% 48%)' }}>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>
      {/* Footer */}
      <div style={{ padding: 12, borderTop: '1px solid hsl(210 16% 80%)', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: 'hsl(210 13% 39%)', fontFamily: 'var(--font-sans)', cursor: 'pointer', pointerEvents: 'none' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
          MN / EN
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: 'hsl(210 13% 39%)', fontFamily: 'var(--font-sans)', cursor: 'pointer', pointerEvents: 'none' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign out
        </div>
      </div>
    </aside>
  );
}

// ── Mobile Header ─────────────────────────────────────────────────────────────
function MobileHeader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 56, background: 'hsl(40 22% 96% / 0.7)', backdropFilter: 'blur(20px)', borderBottom: '1px solid hsl(210 16% 80%)', borderRadius: 12, boxShadow: '0 -4px 24px rgba(26,28,26,0.04)', maxWidth: 390 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 12, background: 'linear-gradient(135deg, hsl(210 55% 14%), hsl(212 43% 23%))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icons.shield}
        </div>
        <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'hsl(212 43% 23%)', letterSpacing: '-0.02em' }}>Tasky</span>
      </div>
      <button style={{ height: 36, padding: '0 16px', borderRadius: 12, background: 'hsl(212 43% 23%)', color: 'hsl(40 22% 96%)', border: 'none', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13, cursor: 'pointer', pointerEvents: 'none' }}>Login</button>
    </div>
  );
}

// ── Mobile Bottom Nav ─────────────────────────────────────────────────────────
function BottomNav({ activeIdx = 0 }) {
  const nav = [
    { icon: icons.home,    label: 'Home' },
    { icon: icons.tasks,   label: 'Tasks' },
    { icon: icons.inbox,   label: 'Inbox' },
    { icon: icons.profile, label: 'Profile' },
  ];
  return (
    <div style={{ display: 'flex', background: '#fff', borderTop: '1px solid hsl(210 16% 80%)', maxWidth: 390, borderRadius: 12, boxShadow: '0 -4px 24px rgba(26,28,26,0.04)', padding: '4px 0' }}>
      {nav.map((item, i) => (
        <div key={item.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 4px', gap: 4, cursor: 'pointer', pointerEvents: 'none' }}>
          <span style={{ color: i === activeIdx ? 'hsl(212 43% 23%)' : 'hsl(207 12% 48%)', display: 'flex' }}>{item.icon}</span>
          <span style={{ fontSize: 11, fontWeight: i === activeIdx ? 600 : 400, color: i === activeIdx ? 'hsl(212 43% 23%)' : 'hsl(207 12% 48%)', fontFamily: 'var(--font-sans)' }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Auth Split Layout ──────────────────────────────────────────────────────────
function AuthLayout() {
  return (
    <div style={{ display: 'flex', borderRadius: 16, overflow: 'hidden', width: 800, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid hsl(210 16% 80%)' }}>
      {/* Left hero panel */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, hsl(210 55% 14%) 0%, hsl(212 43% 23%) 100%)', padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-15%', left: '-30%', width: '60%', height: '60%', borderRadius: '50%', background: 'hsl(200 34% 58% / 0.3)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%', borderRadius: '50%', background: 'hsl(40 72% 31% / 0.2)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
          <div style={{ padding: 14, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.2)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="hsl(200 34% 58%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <span style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: '#fff', letterSpacing: '-0.02em' }}>Tasky</span>
        </div>
        <div style={{ position: 'relative' }}>
          <h1 style={{ fontSize: 36, fontWeight: 500, fontFamily: 'var(--font-display)', color: '#fff', lineHeight: 1.15, margin: '0 0 16px' }}>Your trusted network for everyday tasks.</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--font-sans)', fontWeight: 500, margin: 0, lineHeight: 1.5 }}>Connect with verified professionals securely.</p>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 24, position: 'relative' }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-sans)', margin: 0 }}>© 2026 Tasky Network</p>
        </div>
      </div>
      {/* Right login card */}
      <div style={{ width: 340, background: 'hsl(40 22% 96%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 28, padding: '40px 36px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.18)', border: '1px solid rgba(0,0,0,0.04)', width: '100%', boxSizing: 'border-box' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'hsl(212 43% 23%)', margin: '0 0 8px' }}>Welcome back</h2>
          <p style={{ fontSize: 14, color: 'hsl(210 13% 39%)', fontFamily: 'var(--font-sans)', margin: '0 0 28px', lineHeight: 1.5 }}>Continue with Facebook to log in or create your Tasky account.</p>
          <button style={{ width: '100%', height: 52, borderRadius: 20, background: 'linear-gradient(to right, hsl(210 55% 14%), hsl(212 43% 23%))', color: 'hsl(40 22% 96%)', border: 'none', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', pointerEvents: 'none', boxShadow: '0 4px 6px -4px rgba(0,0,0,0.1), 0 10px 15px -3px rgba(0,0,0,0.1)', marginBottom: 20 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/></svg>
            Continue with Facebook
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div style={{ position: 'relative', margin: '0 0 20px', textAlign: 'center' }}>
            <div style={{ height: 1, background: 'hsl(210 16% 80%)', position: 'absolute', top: '50%', left: 0, right: 0 }} />
            <span style={{ position: 'relative', background: 'rgba(255,255,255,0.92)', padding: '0 10px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.075em', color: 'hsl(210 13% 55%)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>Later</span>
          </div>
          <button style={{ width: '100%', height: 44, borderRadius: 14, background: 'transparent', color: 'hsl(210 13% 55%)', border: '1.5px solid hsl(210 16% 80%)', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 13, cursor: 'not-allowed', opacity: 0.5, pointerEvents: 'none' }}>Phone verification (disabled for MVP)</button>
        </div>
      </div>
    </div>
  );
}

// ── Empty States ──────────────────────────────────────────────────────────────
function EmptyState({ icon, title, description, cta }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 32px', textAlign: 'center', border: '1.5px dashed hsl(210 16% 80%)', borderRadius: 12, background: '#fff', width: 280 }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'hsl(212 43% 23% / 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: 'hsl(212 43% 23%)' }}>{icon}</div>
      <p style={{ fontSize: 15, fontWeight: 600, color: 'hsl(212 43% 23%)', margin: '0 0 8px', fontFamily: 'var(--font-sans)' }}>{title}</p>
      <p style={{ fontSize: 13, color: 'hsl(210 13% 39%)', margin: '0 0 20px', lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}>{description}</p>
      {cta && <button style={{ height: 40, padding: '0 20px', borderRadius: 12, background: 'hsl(212 43% 23%)', color: 'hsl(40 22% 96%)', border: 'none', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13, cursor: 'pointer', pointerEvents: 'none' }}>{cta}</button>}
    </div>
  );
}

// ── Screen Frame (ScreenFrame layout container) ────────────────────────────────
function ScreenFrameDemo() {
  return (
    <div>
      <p style={{ fontSize: 12, fontFamily: 'var(--font-sans)', color: 'hsl(210 13% 39%)', margin: '0 0 12px' }}>
        <code style={{ background: 'hsl(36 20% 94%)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>ScreenFrame</code> wraps all page content. maxWidth prop: <strong>normal</strong> (640px) · <strong>wide</strong> (1024px) · <strong>full</strong>.
        Padding: 16px mobile, 24px desktop. Centered with auto margins.
      </p>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[{ label: 'normal (640px)', w: 320 }, { label: 'wide (1024px)', w: 480 }, { label: 'full', w: 600 }].map(f => (
          <div key={f.label}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'hsl(210 13% 55%)', margin: '0 0 6px', fontFamily: 'var(--font-sans)' }}>{f.label}</p>
            <div style={{ width: f.w, height: 48, borderRadius: 8, border: '2px dashed hsl(200 34% 58%)', background: 'hsl(200 34% 58% / 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 12, color: 'hsl(200 34% 45%)', fontFamily: 'monospace' }}>max-w: {f.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Customer Dashboard (mini mockup) ──────────────────────────────────────────
function DashboardMockup() {
  const tasks = [
    { status: 'OPEN',      desc: 'Гэрийн цэвэрлэгээ — 3 өрөө байр', loc: 'Хан-Уул, 4-р хороо', budget: '80,000', date: 'Apr 22' },
    { status: 'ASSIGNED',  desc: 'Угаалгын машины засвар',             loc: 'Баянгол дүүрэг',    budget: '150,000', date: 'Apr 23' },
    { status: 'COMPLETED', desc: 'Нүүлгэн шилжүүлэх ажил',           loc: 'Чингэлтэй дүүрэг', budget: '200,000', date: 'Apr 18' },
  ];
  const statusStyle = { OPEN: { bg: 'hsl(35 15% 90%)', color: 'hsl(210 12% 45%)' }, ASSIGNED: { bg: 'hsl(212 43% 23%)', color: '#fff' }, COMPLETED: { bg: 'hsl(160 34% 42%)', color: '#fff' } };
  return (
    <div style={{ display: 'flex', background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid hsl(210 16% 80%)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)', width: 720 }}>
      <DesktopSidebar role="CUSTOMER" activeIdx={0} />
      <div style={{ flex: 1, padding: 28, background: 'hsl(40 22% 96%)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.075em', color: 'hsl(210 13% 39%)', margin: '0 0 4px', fontFamily: 'var(--font-sans)' }}>Sunday, April 20</p>
            <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'hsl(212 43% 23%)', margin: '0 0 4px' }}>Сайн байна уу, <span style={{ color: 'hsl(212 43% 23%)' }}>Болд</span>!</h1>
            <p style={{ fontSize: 13, color: 'hsl(210 13% 39%)', margin: 0, fontFamily: 'var(--font-sans)' }}>You have 2 active tasks today.</p>
          </div>
          <button style={{ height: 44, padding: '0 16px', borderRadius: 12, background: 'hsl(212 43% 23%)', color: 'hsl(40 22% 96%)', border: 'none', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', pointerEvents: 'none', boxShadow: '0 4px 6px -4px rgba(0,0,0,0.1), 0 10px 15px -3px rgba(0,0,0,0.1)' }}>
            {icons.plus} Post new task
          </button>
        </div>
        {/* Tabs */}
        <div style={{ display: 'inline-flex', background: 'hsl(36 20% 94%)', borderRadius: 8, padding: 4, gap: 2, marginBottom: 16 }}>
          {['Open Requests', 'Active Bookings', 'Past'].map((t, i) => (
            <div key={t} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-sans)', background: i === 0 ? '#fff' : 'transparent', color: i === 0 ? 'hsl(212 43% 23%)' : 'hsl(210 13% 39%)', boxShadow: i === 0 ? '0 1px 2px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', pointerEvents: 'none' }}>{t}</div>
          ))}
        </div>
        {/* Task list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tasks.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: '#fff', borderRadius: 10, border: '1px solid hsl(210 16% 80%)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', cursor: 'pointer', pointerEvents: 'none' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 9999, padding: '2px 10px', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-sans)', background: statusStyle[t.status].bg, color: statusStyle[t.status].color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{t.status}</span>
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'hsl(212 43% 23%)', fontFamily: 'var(--font-sans)' }}>{t.desc}</p>
                <p style={{ fontSize: 12, color: 'hsl(210 13% 39%)', margin: 0, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-sans)' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {t.loc}
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 2px', color: 'hsl(212 43% 23%)', fontFamily: 'var(--font-sans)' }}>₮{t.budget}</p>
                <p style={{ fontSize: 12, color: 'hsl(210 13% 39%)', margin: 0, fontFamily: 'var(--font-sans)' }}>{t.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PatternsSection() {
  return (
    <div>
      <PatSection title="Navigation — Desktop Sidebar" subtitle="Hidden on mobile (md:flex) · w-56 · sticky top-0 · border-right">
        <PatRow label="Customer role vs Tasker role">
          <DesktopSidebar role="CUSTOMER" activeIdx={0} />
          <DesktopSidebar role="TASKER" activeIdx={0} />
        </PatRow>
        <PatRow label="Different active states">
          <DesktopSidebar role="CUSTOMER" activeIdx={1} />
          <DesktopSidebar role="CUSTOMER" activeIdx={2} />
        </PatRow>
      </PatSection>

      <PatSection title="Navigation — Mobile" subtitle="Header (fixed, backdrop-blur, md:hidden) + Bottom Nav">
        <PatRow label="Mobile header">
          <MobileHeader />
        </PatRow>
        <PatRow label="Bottom navigation bar">
          <BottomNav activeIdx={0} />
          <BottomNav activeIdx={2} />
        </PatRow>
      </PatSection>

      <PatSection title="Auth Split Layout" subtitle="Left: hero panel (primary gradient + blurred light effects) · Right: login card · lg:flex">
        <AuthLayout />
      </PatSection>

      <PatSection title="ScreenFrame Layout Container" subtitle="Wrapper around every page — controls max-width and centering">
        <ScreenFrameDemo />
      </PatSection>

      <PatSection title="Empty States" subtitle="Used when lists have no data — dashed border card, icon, description, optional CTA">
        <PatRow>
          <EmptyState icon={icons.plus} title="No tasks posted yet" description="You haven't posted any tasks. Create your first task to find taskers." cta="Post your first task" />
          <EmptyState icon={icons.search} title="No open tasks found" description="No open tasks found in this area. Try a wider radius or different time." />
          <EmptyState icon={icons.inbox} title="No messages yet" description="You don't have any conversations. Post a task to start connecting." />
        </PatRow>
      </PatSection>

      <PatSection title="Customer Dashboard — Composed Page" subtitle="Sidebar + greeting + tabs + task list (1024px wide layout)">
        <DashboardMockup />
      </PatSection>
    </div>
  );
}

Object.assign(window, { PatternsSection });
