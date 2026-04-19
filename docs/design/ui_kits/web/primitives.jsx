// primitives.jsx — Buttons · Inputs · Badges · Checkbox · Switch · Label

function KitSection({ title, subtitle, children }) {
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
function KitRow({ label, children, gap = 12 }) {
  return (
    <div style={{ marginBottom: 20 }}>
      {label && <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.075em', color: 'var(--color-text-tertiary)', margin: '0 0 10px', fontFamily: 'var(--font-sans)' }}>{label}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap }}>{children}</div>
    </div>
  );
}

// ── Shared base styles ───────────────────────────────────────────────────────
const BASE_BTN = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
  border: 'none', transition: 'all 200ms', whiteSpace: 'nowrap', lineHeight: 1,
  letterSpacing: 'normal',
};

// ── Button component ─────────────────────────────────────────────────────────
const BTN_VARIANTS = {
  default:     { background: 'hsl(212 43% 23%)', color: 'hsl(40 22% 96%)', boxShadow: '0 4px 6px -4px rgba(0,0,0,0.1), 0 10px 15px -3px rgba(0,0,0,0.1)' },
  destructive: { background: 'hsl(0 84% 60%)', color: '#fff' },
  outline:     { background: 'transparent', color: 'hsl(212 43% 23%)', border: '1.5px solid hsl(210 16% 80%)' },
  secondary:   { background: 'hsl(38 52% 50%)', color: '#fff' },
  ghost:       { background: 'transparent', color: 'hsl(212 43% 23%)' },
};
const BTN_SIZES = {
  sm:      { height: 40, padding: '0 12px', borderRadius: 8, fontSize: 13 },
  default: { height: 48, padding: '0 16px', borderRadius: 12 },
  lg:      { height: 56, padding: '0 32px', borderRadius: 12, fontSize: 16 },
};

function Btn({ variant = 'default', size = 'default', children, disabled, icon }) {
  const v = BTN_VARIANTS[variant];
  const s = BTN_SIZES[size];
  return (
    <button style={{ ...BASE_BTN, ...v, ...s, opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer', pointerEvents: 'none' }} disabled={disabled}>
      {icon && <span style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>}
      {children}
    </button>
  );
}

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const LoaderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.25"/>
    <path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const FbIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/>
  </svg>
);

// ── Badge component ──────────────────────────────────────────────────────────
const BADGE_VARIANTS = {
  default:          { bg: 'hsl(212 43% 23%)', color: 'hsl(40 22% 96%)', border: 'transparent' },
  secondary:        { bg: 'hsl(40 72% 31%)', color: '#fff', border: 'transparent' },
  outline:          { bg: 'transparent', color: 'hsl(212 43% 23%)', border: 'hsl(210 16% 80%)' },
  destructive:      { bg: 'hsl(0 84% 60%)', color: '#fff', border: 'transparent' },
  verified:         { bg: 'hsl(160 34% 42%)', color: '#fff', border: 'transparent' },
  statusOpen:       { bg: 'hsl(35 15% 90%)', color: 'hsl(210 12% 45%)', border: 'transparent', caps: true },
  statusAssigned:   { bg: 'hsl(212 43% 23%)', color: '#fff', border: 'transparent', caps: true },
  statusCompleted:  { bg: 'hsl(160 34% 42%)', color: '#fff', border: 'transparent', caps: true },
  statusCancelled:  { bg: 'hsl(36 20% 94%)', color: 'hsl(210 13% 39%)', border: 'transparent', caps: true },
  noShow:           { bg: 'hsl(0 84% 60%)', color: '#fff', border: 'transparent', caps: true },
};

function Badge({ variant = 'default', children }) {
  const v = BADGE_VARIANTS[variant];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', borderRadius: 9999,
      padding: '3px 10px', fontSize: 11, fontWeight: 600,
      fontFamily: 'var(--font-sans)', lineHeight: 1.4,
      background: v.bg, color: v.color,
      border: `1px solid ${v.border}`,
      textTransform: v.caps ? 'uppercase' : 'none',
      letterSpacing: v.caps ? '0.075em' : 'normal',
    }}>{children}</span>
  );
}

// ── Input component ──────────────────────────────────────────────────────────
function KitInput({ placeholder, label, state, helper, type = 'text', value }) {
  const borderColor = state === 'focus' ? 'hsl(212 43% 23%)' : state === 'error' ? 'hsl(0 84% 60%)' : 'hsl(210 16% 80%)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 280 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-foreground)', fontFamily: 'var(--font-sans)' }}>{label}</label>}
      <input
        readOnly
        type={type}
        defaultValue={value}
        placeholder={placeholder}
        style={{
          height: 48, borderRadius: 6, border: `1.5px solid ${borderColor}`,
          background: 'hsl(40 22% 96%)', padding: '0 16px', fontSize: 16,
          fontFamily: 'var(--font-sans)', color: 'hsl(212 43% 23%)',
          outline: 'none', boxSizing: 'border-box', width: '100%',
          opacity: state === 'disabled' ? 0.5 : 1, pointerEvents: 'none',
        }}
      />
      {helper && <p style={{ fontSize: 12, margin: 0, color: state === 'error' ? 'hsl(0 84% 60%)' : 'var(--color-text-tertiary)', fontFamily: 'var(--font-sans)' }}>{helper}</p>}
    </div>
  );
}

function KitTextarea({ placeholder, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 280 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-foreground)', fontFamily: 'var(--font-sans)' }}>{label}</label>}
      <textarea readOnly placeholder={placeholder} style={{
        minHeight: 100, borderRadius: 12, border: '1.5px solid hsl(210 16% 80%)',
        background: 'hsl(40 22% 96%)', padding: '12px 16px', fontSize: 14,
        fontFamily: 'var(--font-sans)', color: 'hsl(212 43% 23%)',
        resize: 'none', outline: 'none', pointerEvents: 'none',
      }} />
    </div>
  );
}

// ── Checkbox ─────────────────────────────────────────────────────────────────
function KitCheckbox({ checked, label, disabled }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', opacity: disabled ? 0.4 : 1, pointerEvents: 'none' }}>
      <div style={{
        width: 18, height: 18, borderRadius: 4, border: `2px solid ${checked ? 'hsl(212 43% 23%)' : 'hsl(210 16% 80%)'}`,
        background: checked ? 'hsl(212 43% 23%)' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      <span style={{ fontSize: 14, color: 'var(--color-foreground)', fontFamily: 'var(--font-sans)' }}>{label}</span>
    </label>
  );
}

// ── Switch ────────────────────────────────────────────────────────────────────
function KitSwitch({ on, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', pointerEvents: 'none' }}>
      <div style={{
        width: 42, height: 24, borderRadius: 12, background: on ? 'hsl(212 43% 23%)' : 'hsl(210 16% 80%)',
        position: 'relative', transition: 'background 200ms',
      }}>
        <div style={{
          position: 'absolute', top: 3, left: on ? 21 : 3, width: 18, height: 18,
          borderRadius: '50%', background: '#fff', transition: 'left 200ms',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </div>
      <span style={{ fontSize: 14, color: 'var(--color-foreground)', fontFamily: 'var(--font-sans)' }}>{label}</span>
    </label>
  );
}

// ── Filter Chip ───────────────────────────────────────────────────────────────
function FilterChip({ label, active }) {
  return (
    <button style={{
      flexShrink: 0, borderRadius: 9999, padding: '6px 16px', fontSize: 12,
      fontWeight: 600, fontFamily: 'var(--font-sans)', border: `1px solid ${active ? 'hsl(212 43% 23%)' : 'hsl(210 16% 80%)'}`,
      background: active ? 'hsl(212 43% 23%)' : 'hsl(0 0% 100%)',
      color: active ? 'hsl(40 22% 96%)' : 'hsl(210 13% 39%)',
      cursor: 'pointer', pointerEvents: 'none',
      boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
    }}>{label}</button>
  );
}

// ── Select / Dropdown ─────────────────────────────────────────────────────────
function DistanceSelector() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: 'hsl(0 0% 100%)', border: '1px solid hsl(210 16% 80%)',
      padding: '6px 16px', borderRadius: 9999, boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(212 43% 23%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
      </svg>
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.075em', color: 'hsl(210 13% 39%)', fontFamily: 'var(--font-sans)' }}>Distance:</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: 'hsl(212 43% 23%)', fontFamily: 'var(--font-sans)' }}>10 km ▾</span>
    </div>
  );
}

function PrimitivesSection() {
  return (
    <div>
      <KitSection title="Buttons" subtitle="5 variants · 3 sizes · disabled state · with icons">
        <KitRow label="Variants">
          <Btn variant="default">Post new task</Btn>
          <Btn variant="secondary">Continue with Facebook</Btn>
          <Btn variant="outline">Cancel</Btn>
          <Btn variant="ghost">Sign out</Btn>
          <Btn variant="destructive">Delete task</Btn>
        </KitRow>
        <KitRow label="Sizes">
          <Btn variant="default" size="lg">Large — h-14</Btn>
          <Btn variant="default" size="default">Default — h-12</Btn>
          <Btn variant="default" size="sm">Small — h-10</Btn>
        </KitRow>
        <KitRow label="With icons">
          <Btn variant="default" icon={<PlusIcon/>}>Post new task</Btn>
          <Btn variant="secondary" icon={<FbIcon/>}>Continue with Facebook <ArrowIcon/></Btn>
          <Btn variant="outline" icon={<LoaderIcon/>}>Applying…</Btn>
        </KitRow>
        <KitRow label="Disabled state">
          <Btn variant="default" disabled>Post new task</Btn>
          <Btn variant="secondary" disabled>Phone verification</Btn>
          <Btn variant="outline" disabled>Cancel</Btn>
        </KitRow>
        <KitRow label="Full-width (auth card style)">
          <div style={{ width: 360 }}>
            <Btn variant="default" size="lg">{null}</Btn>
            <div style={{
              width: '100%', height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'linear-gradient(to right, hsl(210 55% 14%), hsl(212 43% 23%))',
              color: 'hsl(40 22% 96%)', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 16,
              boxShadow: '0 4px 6px -4px rgba(0,0,0,0.1), 0 10px 15px -3px rgba(0,0,0,0.1)',
              cursor: 'pointer', pointerEvents: 'none',
            }}>
              <FbIcon/> Continue with Facebook <ArrowIcon/>
            </div>
          </div>
        </KitRow>
      </KitSection>

      <KitSection title="Badges" subtitle="9 variants — brand, status lifecycle, verified">
        <KitRow label="Brand">
          <Badge variant="default">Primary</Badge>
          <Badge variant="secondary">Secondary · Gold</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </KitRow>
        <KitRow label="Task status lifecycle">
          <Badge variant="statusOpen">Open</Badge>
          <Badge variant="statusAssigned">Assigned</Badge>
          <Badge variant="statusCompleted">Completed</Badge>
          <Badge variant="statusCancelled">Cancelled</Badge>
          <Badge variant="noShow">No-show</Badge>
        </KitRow>
        <KitRow label="Trust & verification">
          <Badge variant="verified">✓ Verified</Badge>
          <Badge variant="default">Category</Badge>
        </KitRow>
      </KitSection>

      <KitSection title="Form Inputs" subtitle="Text, password, textarea — 3 states: default · focus · error · disabled">
        <KitRow label="Text input states" gap={20}>
          <KitInput label="Full name" placeholder="Б. Болд" state="default" />
          <KitInput label="Phone number" placeholder="+976 9900 0000" state="focus" helper="Focus — border becomes foreground" />
          <KitInput label="Location" placeholder="Хан-Уул дүүрэг" state="error" helper="This field is required" />
          <KitInput label="Disabled" value="Read-only value" state="disabled" />
        </KitRow>
        <KitRow label="Textarea" gap={20}>
          <KitTextarea label="Task description" placeholder="Explain why you are the best fit for this task..." />
          <KitTextarea label="Application message" placeholder="Describe the task in detail..." />
        </KitRow>
      </KitSection>

      <KitSection title="Selection Controls">
        <KitRow label="Checkbox">
          <KitCheckbox checked label="I agree to the terms" />
          <KitCheckbox label="Send me notifications" />
          <KitCheckbox checked disabled label="Verified (read-only)" />
        </KitRow>
        <KitRow label="Switch">
          <KitSwitch on label="Notifications enabled" />
          <KitSwitch label="Dark mode" />
        </KitRow>
      </KitSection>

      <KitSection title="Filter Chips &amp; Selectors" subtitle="Category filter row on the Tasker Feed page">
        <KitRow label="Category chips" gap={8}>
          <FilterChip label="All" active />
          <FilterChip label="Cleaning" />
          <FilterChip label="Repair" />
          <FilterChip label="Moving" />
          <FilterChip label="Childcare" />
          <FilterChip label="Logistics" />
        </KitRow>
        <KitRow label="Distance selector">
          <DistanceSelector />
        </KitRow>
      </KitSection>
    </div>
  );
}

Object.assign(window, { PrimitivesSection });
