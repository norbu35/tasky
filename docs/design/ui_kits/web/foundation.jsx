// foundation.jsx — Colors · Typography · Spacing · Radius · Shadows · Motion

function Section({ title, subtitle, children }) {
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

function Row({ children, gap = 12, wrap = true }) {
  return <div style={{ display: 'flex', flexWrap: wrap ? 'wrap' : 'nowrap', gap }}>{children}</div>;
}

// ── Colors ──────────────────────────────────────────────────────────────────
const PALETTE = [
  { name: 'primary', token: '--color-primary', hex: '#1B3A5C', role: 'Brand authority, buttons, nav active' },
  { name: 'primary-deep', token: '--color-primary-deep', hex: '#102638', role: 'Hero text, logo wordmark' },
  { name: 'secondary', token: '--color-secondary', hex: '#8B6914', role: 'Steppe Gold — stars, warm CTAs' },
  { name: 'sun-light', token: '--color-sun-light', hex: '#C49A3C', role: 'Secondary button fill' },
  { name: 'sun-wash', token: '--color-sun-wash', hex: '#F8CB5A', role: 'Warm highlight tint' },
  { name: 'accent', token: '--color-accent', hex: '#6BA3BE', role: 'Open Sky — links, interactive accents' },
  { name: 'sky-soft', token: '--color-sky-soft', hex: '#A9CDE0', role: 'Soft sky tint' },
  { name: 'verified', token: '--color-verified', hex: '#469178', role: 'Verification badge, checkmark' },
  { name: 'trust', token: '--color-trust', hex: '#3568A1', role: 'Trust badges, authority indicators' },
  { name: 'trust-muted', token: '--color-trust-muted', hex: '#A8C0DA', role: 'Trust background tint' },
  { name: 'destructive', token: '--color-destructive', hex: '#EF4444', role: 'Errors, destructive actions' },
];
const NEUTRALS = [
  { name: 'background', token: '--color-background', hex: '#F5F3EF', role: 'Canvas — page background' },
  { name: 'card', token: '--color-card', hex: '#FFFFFF', role: 'Card / popover surface' },
  { name: 'foreground', token: '--color-foreground', hex: '#1B3A5C', role: 'Body text, icons' },
  { name: 'muted', token: '--color-muted', hex: '#F0EDE8', role: 'Subtle fills, chip inactive bg' },
  { name: 'muted-fg', token: '--color-muted-fg', hex: '#5A6878', role: 'Placeholder, label text' },
  { name: 'text-secondary', token: '--color-text-secondary', hex: '#5C6B7A', role: 'Secondary info' },
  { name: 'text-tertiary', token: '--color-text-tertiary', hex: '#7D8F9E', role: 'Timestamps, meta' },
  { name: 'border', token: '--color-border', hex: '#BEC8D2', role: 'Dividers, input stroke' },
  { name: 'input', token: '--color-input', hex: '#D9DFE5', role: 'Input fill background' },
  { name: 'nav-inactive', token: '--color-nav-inactive', hex: '#6E8191', role: 'Bottom nav icons, inactive' },
  { name: 'chip-inactive', token: '--color-chip-inactive', hex: '#D5DDE4', role: 'Chip/tag default bg' },
];
const STATUS_COLORS = [
  { name: 'status-open', hex: '#EDE9E3', fg: '#637080', label: 'OPEN' },
  { name: 'status-assigned', hex: '#1B3A5C', fg: '#FFFFFF', label: 'ASSIGNED' },
  { name: 'status-completed', hex: '#469178', fg: '#FFFFFF', label: 'COMPLETED' },
  { name: 'status-cancelled', hex: '#F0EDE8', fg: '#5A6878', label: 'CANCELLED' },
  { name: 'destructive (no-show)', hex: '#EF4444', fg: '#FFFFFF', label: 'NO-SHOW' },
];

function Swatch({ name, hex, role, token, dark = false }) {
  return (
    <div style={{ width: 148 }}>
      <div style={{ height: 72, borderRadius: 10, background: hex, border: '1px solid rgba(0,0,0,0.07)', marginBottom: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} />
      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-foreground)', margin: '0 0 2px', fontFamily: 'var(--font-display)' }}>{name}</p>
      <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: '0 0 2px', fontFamily: 'monospace' }}>{hex}</p>
      <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', margin: 0, lineHeight: 1.4 }}>{role}</p>
    </div>
  );
}

// ── Typography ───────────────────────────────────────────────────────────────
const TYPE_SCALE = [
  { role: 'Display XL', font: 'display', size: 48, weight: 700, sample: 'Танд найдвартай' },
  { role: 'Display L', font: 'display', size: 36, weight: 700, sample: 'Trust-first marketplace' },
  { role: 'Heading 1', font: 'display', size: 28, weight: 700, sample: 'Open task feed' },
  { role: 'Heading 2', font: 'display', size: 22, weight: 600, sample: 'Active Bookings' },
  { role: 'Heading 3', font: 'display', size: 18, weight: 600, sample: 'Task Details & Application' },
  { role: 'Body L', font: 'sans', size: 18, weight: 400, sample: 'Your trusted network for everyday tasks.' },
  { role: 'Body M (base)', font: 'sans', size: 16, weight: 400, sample: 'Connect with verified professionals securely.' },
  { role: 'Body S', font: 'sans', size: 14, weight: 400, sample: 'Find nearby opportunities in Ulaanbaatar.' },
  { role: 'Label / UI', font: 'sans', size: 13, weight: 600, sample: 'Post new task' },
  { role: 'Caption / Meta', font: 'sans', size: 12, weight: 500, sample: 'Monday, April 20' },
  { role: 'Overline / Caps', font: 'sans', size: 11, weight: 700, sample: 'TASK DESCRIPTION', caps: true },
];

function TypeRow({ role, font, size, weight, sample, caps }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 24, padding: '14px 0', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ width: 160, flexShrink: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-tertiary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{role}</p>
        <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', margin: '2px 0 0', fontFamily: 'monospace' }}>
          {font === 'display' ? 'Manrope' : 'Plus Jakarta Sans'} · {size}px · {weight}
        </p>
      </div>
      <p style={{
        fontFamily: font === 'display' ? 'var(--font-display)' : 'var(--font-sans)',
        fontSize: size,
        fontWeight: weight,
        color: 'var(--color-foreground)',
        margin: 0,
        lineHeight: 1.2,
        textTransform: caps ? 'uppercase' : 'none',
        letterSpacing: caps ? '0.075em' : 'normal',
      }}>{sample}</p>
    </div>
  );
}

// ── Spacing ──────────────────────────────────────────────────────────────────
const SPACING = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64];
const RADII = [
  { name: 'xs', value: '6px' }, { name: 'sm', value: '8px' },
  { name: 'md (default)', value: '12px' }, { name: 'lg', value: '16px' },
  { name: 'full', value: '9999px' },
];
const SHADOWS = [
  { name: 'card', val: '0 1px 2px rgba(0,0,0,0.05)', usage: 'Cards, list items' },
  { name: 'elevated', val: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.05)', usage: 'Dropdowns, tooltips' },
  { name: 'fab', val: '0 4px 6px -4px rgba(0,0,0,0.1), 0 10px 15px -3px rgba(0,0,0,0.1)', usage: 'Primary buttons' },
  { name: 'nav', val: '0 -4px 24px rgba(26,28,26,0.04)', usage: 'Bottom navigation bar' },
  { name: 'deep', val: '0 25px 50px -12px rgba(0,0,0,0.25)', usage: 'Auth card, modals' },
];
const MOTION = [
  { name: 'instant', duration: '80ms', easing: 'standard', usage: 'Active press feedback' },
  { name: 'fast', duration: '150ms', easing: 'standard', usage: 'Hover transitions, badges' },
  { name: 'normal', duration: '250ms', easing: 'standard', usage: 'Page transitions, modals' },
  { name: 'slow', duration: '400ms', easing: 'decelerate', usage: 'Enter animations' },
  { name: 'skeleton', duration: '1500ms', easing: 'standard', usage: 'Skeleton shimmer loop' },
];

function FoundationSection() {
  return (
    <div>
      <Section title="Brand Palette" subtitle="Тэнгэр (Sky) — four anchors: Deep Sky Blue · Steppe Gold · Open Sky · Off-White">
        <Row>{PALETTE.map(s => <Swatch key={s.name} {...s} />)}</Row>
      </Section>

      <Section title="Neutral Scale" subtitle="Surface, text, border, and input tokens">
        <Row>{NEUTRALS.map(s => <Swatch key={s.name} {...s} />)}</Row>
      </Section>

      <Section title="Status Colors" subtitle="Task lifecycle badge colors — background + foreground pairs">
        <Row>
          {STATUS_COLORS.map(s => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: '4px 14px', borderRadius: 9999, background: s.hex, color: s.fg, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-sans)', letterSpacing: '0.075em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{s.label}</div>
              <div style={{ width: 36, height: 24, borderRadius: 6, background: s.hex, border: '1px solid rgba(0,0,0,0.07)' }} />
            </div>
          ))}
        </Row>
      </Section>

      <Section title="Typography Scale" subtitle="Manrope for display/headings · Plus Jakarta Sans for body/UI · 16px hard floor on body">
        <div>{TYPE_SCALE.map(t => <TypeRow key={t.role} {...t} />)}</div>
      </Section>

      <Section title="Spacing Scale" subtitle="4px base unit">
        <Row gap={8}>
          {SPACING.map(n => (
            <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: n, height: n, background: 'var(--color-accent)', borderRadius: 2, minWidth: 4, minHeight: 4 }} />
              <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>{n}</span>
            </div>
          ))}
        </Row>
      </Section>

      <Section title="Border Radius">
        <Row>
          {RADII.map(r => (
            <div key={r.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 64, height: 64, background: 'var(--color-primary)', opacity: 0.15, borderRadius: r.value, border: '2px solid var(--color-primary)' }} />
              <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0, textAlign: 'center', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>{r.name}</p>
              <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', margin: 0, fontFamily: 'monospace' }}>{r.value}</p>
            </div>
          ))}
        </Row>
      </Section>

      <Section title="Shadows">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {SHADOWS.map(s => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ width: 64, height: 40, borderRadius: 10, background: '#fff', boxShadow: s.val, border: '1px solid rgba(0,0,0,0.04)' }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-foreground)', margin: '0 0 2px', fontFamily: 'var(--font-display)' }}>shadow-{s.name}</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', margin: '0 0 2px', fontFamily: 'monospace' }}>{s.val}</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0 }}>{s.usage}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Motion Tokens" subtitle="Easing: standard = cubic-bezier(0.4,0,0.2,1) · decelerate = cubic-bezier(0,0,0.2,1) · spring = cubic-bezier(0.34,1.56,0.64,1)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {MOTION.map(m => (
            <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '12px 16px', background: 'var(--color-card)', borderRadius: 10, border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ width: 80, flexShrink: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-foreground)', margin: 0, fontFamily: 'var(--font-display)' }}>{m.name}</p>
                <p style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--color-text-tertiary)', margin: '2px 0 0' }}>{m.duration}</p>
              </div>
              <div style={{ flex: 1, height: 4, background: 'var(--color-muted)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '60%', background: 'var(--color-accent)', borderRadius: 2 }} />
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0, width: 200, flexShrink: 0 }}>{m.usage}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

Object.assign(window, { FoundationSection });
