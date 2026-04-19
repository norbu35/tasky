// compositions.jsx — Cards · Tabs · Alert · Avatar · Dialog · Skeleton · Toast

function CompSection({ title, subtitle, children }) {
  return (
    <section style={{ marginBottom: 64 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--color-foreground)', margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 4, margin: '4px 0 0' }}>{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
function CompRow({ label, children, gap = 20 }) {
  return (
    <div style={{ marginBottom: 28 }}>
      {label && <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.075em', color: 'var(--color-text-tertiary)', margin: '0 0 12px', fontFamily: 'var(--font-sans)' }}>{label}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap }}>{children}</div>
    </div>
  );
}

// Shared Badge
function Bdg({ variant = 'default', children }) {
  const variants = {
    default:        { bg: 'hsl(212 43% 23%)', color: 'hsl(40 22% 96%)' },
    secondary:      { bg: 'hsl(40 72% 31%)', color: '#fff' },
    verified:       { bg: 'hsl(160 34% 42%)', color: '#fff' },
    statusOpen:     { bg: 'hsl(35 15% 90%)', color: 'hsl(210 12% 45%)', caps: true },
    statusAssigned: { bg: 'hsl(212 43% 23%)', color: '#fff', caps: true },
    statusCompleted:{ bg: 'hsl(160 34% 42%)', color: '#fff', caps: true },
    outline:        { bg: 'transparent', color: 'hsl(160 50% 40%)', border: '1px solid hsl(160 40% 60%)' },
  };
  const v = variants[variant] || variants.default;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 9999, padding: '3px 10px', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-sans)', background: v.bg, color: v.color, border: v.border || 'none', textTransform: v.caps ? 'uppercase' : 'none', letterSpacing: v.caps ? '0.075em' : 'normal', whiteSpace: 'nowrap' }}>{children}</span>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ initials, size = 40, verified }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <div style={{ width: size, height: size, borderRadius: '50%', background: 'hsl(212 43% 23% / 0.1)', border: '1px solid hsl(210 16% 80%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: size * 0.38, color: 'hsl(212 43% 23%)' }}>{initials}</div>
      {verified && (
        <div style={{ position: 'absolute', bottom: -1, right: -1, width: size * 0.38, height: size * 0.38, borderRadius: '50%', background: 'hsl(160 34% 42%)', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={size * 0.18} height={size * 0.18} viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skel({ w, h = 16, radius = 4 }) {
  return <div style={{ width: w, height: h, borderRadius: radius, background: 'hsl(36 20% 94%)', animation: 'shimmer 1.5s ease-in-out infinite', backgroundImage: 'linear-gradient(90deg, hsl(36 20% 94%) 25%, hsl(36 20% 97%) 50%, hsl(36 20% 94%) 75%)', backgroundSize: '200% 100%' }} />;
}

// ── Card — Task (Customer Dashboard) ─────────────────────────────────────────
function TaskCard({ status, description, location, budget, date }) {
  const statusVariant = { OPEN: 'statusOpen', ASSIGNED: 'statusAssigned', COMPLETED: 'statusCompleted' }[status] || 'statusOpen';
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, background: 'hsl(0 0% 100%)', borderRadius: 12, border: '1px solid hsl(210 16% 80%)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', width: 320, cursor: 'pointer' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: 4 }}><Bdg variant={statusVariant}>{status}</Bdg></div>
        <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'hsl(212 43% 23%)', fontFamily: 'var(--font-sans)' }}>{description}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'hsl(210 13% 39%)', fontSize: 12 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)' }}>{location}</span>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 2px', color: 'hsl(212 43% 23%)', fontFamily: 'var(--font-sans)' }}>₮{budget}</p>
        <p style={{ fontSize: 12, color: 'hsl(210 13% 39%)', margin: 0, fontFamily: 'var(--font-sans)' }}>{date}</p>
      </div>
    </div>
  );
}

// ── Card — Task Feed (Tasker) ─────────────────────────────────────────────────
function FeedCard({ category, description, budget, location, applicants }) {
  return (
    <div style={{ background: 'hsl(0 0% 100%)', borderRadius: 12, border: '1px solid hsl(210 16% 80%)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)', width: 300, display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'all 300ms' }}>
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid hsl(210 16% 80% / 0.3)', background: 'hsl(36 20% 94% / 0.4)' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <Bdg variant="secondary">{category}</Bdg>
          <Bdg variant="outline">Open</Bdg>
        </div>
        <p style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.35, margin: '0 0 8px', color: 'hsl(212 43% 23%)', fontFamily: 'var(--font-display)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{description}</p>
        <p style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'hsl(212 43% 23%)', fontFamily: 'var(--font-display)' }}>{budget} <span style={{ fontSize: 13, fontWeight: 400, color: 'hsl(210 13% 39%)' }}>MNT</span></p>
      </div>
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[{ icon: 'pin', label: location }, { icon: 'coin', label: 'Fixed price' }].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'hsl(36 20% 94% / 0.5)', borderRadius: 8, border: '1px solid hsl(210 16% 80% / 0.3)', fontSize: 13, fontWeight: 500, color: 'hsl(212 43% 23%)', fontFamily: 'var(--font-sans)' }}>
            {item.icon === 'pin'
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(212 43% 23%)" strokeWidth="2" opacity="0.7"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(212 43% 23%)" strokeWidth="2" opacity="0.7"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 3"/></svg>
            }
            {item.label}
          </div>
        ))}
      </div>
      <div style={{ padding: '12px 16px', borderTop: '1px solid hsl(210 16% 80% / 0.4)', background: 'hsl(36 20% 94% / 0.3)' }}>
        <button style={{ width: '100%', height: 44, borderRadius: 12, background: 'hsl(212 43% 23%)', color: 'hsl(40 22% 96%)', border: 'none', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, cursor: 'pointer', pointerEvents: 'none', boxShadow: '0 4px 6px -4px rgba(0,0,0,0.1), 0 10px 15px -3px rgba(0,0,0,0.1)' }}>
          View Details &amp; Apply
        </button>
      </div>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
function KitTabs({ tabs, active = 0 }) {
  return (
    <div style={{ display: 'inline-flex', background: 'hsl(36 20% 94%)', borderRadius: 8, padding: 4, gap: 2 }}>
      {tabs.map((t, i) => (
        <div key={t} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-sans)', cursor: 'pointer', pointerEvents: 'none', background: i === active ? '#fff' : 'transparent', color: i === active ? 'hsl(212 43% 23%)' : 'hsl(210 13% 39%)', boxShadow: i === active ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}>{t}</div>
      ))}
    </div>
  );
}

// ── Alert ────────────────────────────────────────────────────────────────────
function KitAlert({ variant = 'default', title, description }) {
  const styles = {
    default: { bg: 'hsl(36 20% 94%)', border: 'hsl(210 16% 80%)', color: 'hsl(212 43% 23%)', iconColor: 'hsl(212 43% 23%)' },
    destructive: { bg: 'hsl(0 84% 60% / 0.05)', border: 'hsl(0 84% 60% / 0.3)', color: 'hsl(0 84% 50%)', iconColor: 'hsl(0 84% 60%)' },
    info: { bg: 'hsl(212 43% 23% / 0.05)', border: 'hsl(212 43% 23% / 0.2)', color: 'hsl(212 43% 23%)', iconColor: 'hsl(200 34% 58%)' },
  };
  const s = styles[variant];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 12, background: s.bg, border: `1px solid ${s.border}`, width: 360 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s.iconColor} strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px', color: s.color, fontFamily: 'var(--font-sans)' }}>{title}</p>
        <p style={{ fontSize: 13, color: 'hsl(210 13% 39%)', margin: 0, fontFamily: 'var(--font-sans)' }}>{description}</p>
      </div>
    </div>
  );
}

// ── Dialog / Modal ────────────────────────────────────────────────────────────
function KitDialog() {
  return (
    <div style={{ position: 'relative', width: 480, background: 'hsl(0 0% 100%)', borderRadius: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid hsl(210 16% 80% / 0.6)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '24px 24px 16px' }}>
        <p style={{ fontSize: 11, color: 'hsl(210 13% 39%)', margin: '0 0 4px', fontFamily: 'var(--font-sans)' }}>Task Details &amp; Application</p>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, margin: 0, color: 'hsl(212 43% 23%)' }}>Apply to task</h3>
        <p style={{ fontSize: 13, color: 'hsl(210 13% 39%)', margin: '6px 0 0', fontFamily: 'var(--font-sans)' }}>Review the details before submitting your application.</p>
      </div>
      {/* Customer row */}
      <div style={{ margin: '0 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'hsl(36 20% 94% / 0.5)', borderRadius: 12, border: '1px solid hsl(210 16% 80% / 0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar initials="Б" size={48} verified />
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 2px', fontFamily: 'var(--font-sans)', color: 'hsl(212 43% 23%)' }}>Б. Болдбаатар</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#F59E0B', fontSize: 13, fontWeight: 500 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              4.8
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'hsl(212 43% 23%)', fontFamily: 'var(--font-display)' }}>180,000</p>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.075em', color: 'hsl(210 13% 39%)', margin: '2px 0 0', fontFamily: 'var(--font-sans)' }}>MNT</p>
        </div>
      </div>
      {/* Meta chips */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, margin: '0 24px 16px' }}>
        {[{ icon: 'pin', label: 'Location', val: 'Хан-Уул, 4-р хороо' }, { icon: 'cal', label: 'Date', val: 'Apr 22, 10:00' }, { icon: 'users', label: 'Applicants', val: '3 applied' }].map(m => (
          <div key={m.label} style={{ padding: '10px 12px', background: 'hsl(36 20% 94% / 0.4)', borderRadius: 12, border: '1px solid hsl(210 16% 80% / 0.3)' }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.075em', color: 'hsl(210 13% 39%)', margin: '0 0 4px', fontFamily: 'var(--font-sans)' }}>{m.label}</p>
            <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: 'hsl(212 43% 23%)', fontFamily: 'var(--font-sans)' }}>{m.val}</p>
          </div>
        ))}
      </div>
      {/* Application form */}
      <div style={{ padding: '16px 24px 24px', background: 'hsl(36 20% 94% / 0.4)', borderTop: '1px solid hsl(210 16% 80% / 0.6)' }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.075em', color: 'hsl(212 43% 23%)', margin: '0 0 8px', fontFamily: 'var(--font-sans)' }}>Application message</p>
        <div style={{ minHeight: 80, borderRadius: 12, border: '1.5px solid hsl(210 16% 80%)', background: '#fff', padding: '12px 16px', fontSize: 14, color: 'hsl(210 13% 39%)', fontFamily: 'var(--font-sans)', marginBottom: 16 }}>Explain why you are the best fit for this task...</div>
        <button style={{ width: '100%', height: 52, borderRadius: 12, background: 'hsl(212 43% 23%)', color: 'hsl(40 22% 96%)', border: '1px solid hsl(212 43% 23% / 0.2)', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 16, cursor: 'pointer', pointerEvents: 'none', boxShadow: '0 4px 6px -4px rgba(0,0,0,0.1), 0 10px 15px -3px rgba(0,0,0,0.1)' }}>Apply to task</button>
      </div>
    </div>
  );
}

// ── Skeleton Loading ───────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, background: '#fff', borderRadius: 12, border: '1px solid hsl(210 16% 80%)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', width: 320 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skel w={60} h={20} radius={9999} />
        <Skel w="75%" h={14} />
        <Skel w="50%" h={12} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
        <Skel w={64} h={14} />
        <Skel w={48} h={12} />
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function KitToast({ type = 'success', message }) {
  const styles = {
    success: { bg: '#fff', border: 'hsl(210 16% 80%)', dot: 'hsl(160 34% 42%)' },
    error:   { bg: '#fff', border: 'hsl(0 84% 60% / 0.3)', dot: 'hsl(0 84% 60%)' },
    info:    { bg: '#fff', border: 'hsl(210 16% 80%)', dot: 'hsl(200 34% 58%)' },
  };
  const s = styles[type];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: s.bg, borderRadius: 12, border: `1px solid ${s.border}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', minWidth: 280, maxWidth: 380 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: 'hsl(212 43% 23%)', fontFamily: 'var(--font-sans)', flex: 1 }}>{message}</p>
      <button style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: 'hsl(210 13% 39%)', cursor: 'pointer', pointerEvents: 'none', fontSize: 16 }}>×</button>
    </div>
  );
}

function CompositionsSection() {
  return (
    <div>
      <CompSection title="Avatar" subtitle="Initials fallback with optional verified badge">
        <CompRow label="Sizes">
          {[32, 40, 48, 56, 72].map(sz => <Avatar key={sz} initials="Б" size={sz} />)}
        </CompRow>
        <CompRow label="Verified state">
          <Avatar initials="Б" size={48} verified />
          <Avatar initials="С" size={48} verified />
          <Avatar initials="Т" size={48} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar initials="А" size={48} verified />
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 2px', fontFamily: 'var(--font-sans)', color: 'hsl(212 43% 23%)' }}>А. Анхбаяр</p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'hsl(160 34% 42%)', fontWeight: 600, fontFamily: 'var(--font-sans)' }}>
                <svg width="10" height="10" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="hsl(160 34% 42%)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Verified
              </span>
            </div>
          </div>
        </CompRow>
      </CompSection>

      <CompSection title="Task Cards" subtitle="Customer Dashboard — horizontal list row layout">
        <CompRow label="Status variants">
          <TaskCard status="OPEN" description="Гэрийн цэвэрлэгээ" location="Хан-Уул дүүрэг, 4-р хороо" budget="80,000" date="Apr 22" />
          <TaskCard status="ASSIGNED" description="Угаалгын машины засвар" location="Баянгол дүүрэг" budget="150,000" date="Apr 23" />
          <TaskCard status="COMPLETED" description="Нүүлгэн шилжүүлэх ажил" location="Чингэлтэй дүүрэг" budget="200,000" date="Apr 18" />
        </CompRow>
        <CompRow label="Skeleton loading">
          <SkeletonCard />
          <SkeletonCard />
        </CompRow>
      </CompSection>

      <CompSection title="Feed Cards" subtitle="Tasker Feed — vertical card with apply CTA">
        <CompRow>
          <FeedCard category="Cleaning" description="Гэрийн цэвэрлэгээ — 3 өрөө байр, долоо хоногт нэг удаа" budget="80,000" location="Хан-Уул, 4-р хороо" applicants={3} />
          <FeedCard category="Repair" description="Угаалгын машин засварлах, Bosch машин" budget="150,000" location="Баянгол дүүрэг" applicants={1} />
          <FeedCard category="Moving" description="Нүүлгэн шилжүүлэх — 2-р давхраас 5-р давхарт" budget="200,000" location="Чингэлтэй, 8-р хороо" applicants={5} />
        </CompRow>
      </CompSection>

      <CompSection title="Tabs" subtitle="Used on Customer Dashboard — Open · Active · Past">
        <CompRow label="Variants">
          <KitTabs tabs={['Open Requests', 'Active Bookings', 'Past']} active={0} />
          <KitTabs tabs={['Open Requests', 'Active Bookings', 'Past']} active={1} />
        </CompRow>
      </CompSection>

      <CompSection title="Alerts" subtitle="Informational, destructive, and generic">
        <CompRow gap={16} label="Variants">
          <KitAlert variant="info" title="Facebook login initializing" description="Connect with Facebook to log in or create your account." />
          <KitAlert variant="destructive" title="Facebook login temporarily unavailable" description="We're working on it — try again in a few minutes." />
          <KitAlert variant="default" title="No open tasks in this area" description="Try a wider radius or a different time." />
        </CompRow>
      </CompSection>

      <CompSection title="Dialog — Apply to Task" subtitle="Max-width 600px · rounded-2xl · deep shadow · scrollable body">
        <KitDialog />
      </CompSection>

      <CompSection title="Toast Notifications" subtitle="Sonner-based toasts — success · error · info">
        <CompRow gap={12} label="States">
          <KitToast type="success" message="Application sent — the customer will review shortly." />
          <KitToast type="error" message="Facebook login was canceled. Please try again." />
          <KitToast type="info" message="Your payment is held safely until the job is done." />
        </CompRow>
      </CompSection>
    </div>
  );
}

Object.assign(window, { CompositionsSection });
