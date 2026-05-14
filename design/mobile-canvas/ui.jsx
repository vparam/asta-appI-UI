/* Mobile clinical prototype — shared UI primitives. Loaded as Babel JSX. */
const { useState, useEffect, useRef, useMemo } = React;

// ─────────────────────────────────────────────────────────
// Tokens (mirrored from CSS for inline usage)
// ─────────────────────────────────────────────────────────
const T = {
  bg: '#F7F6F2',
  card: '#FFFFFF',
  ink: '#0F1419',
  ink2: '#3D4248',
  muted: '#6B7178',
  line: '#E7E5DE',
  lineSoft: '#EFEDE6',
  accent: 'var(--accent, #0D5A66)',
  accentSoft: 'var(--accent-soft, #E1F0F1)',
  crit: '#C2362E', critSoft: '#FCE9E6',
  warn: '#B5751A', warnSoft: '#FAEFDC',
  ok:   '#2E7D4F', okSoft:   '#E3F1E6',
};

const BAND = {
  crit:   { fg: T.crit, bg: T.critSoft, label: 'Critical' },
  watch:  { fg: T.warn, bg: T.warnSoft, label: 'Watch' },
  live:   { fg: T.accent, bg: T.accentSoft, label: 'Live' },
  stable: { fg: T.ok,   bg: T.okSoft,   label: 'Stable' },
  ok:     { fg: T.ok,   bg: T.okSoft,   label: 'OK' },
};

// ─────────────────────────────────────────────────────────
// Sparkline
// ─────────────────────────────────────────────────────────
function Sparkline({ data, color = T.accent, width = 80, height = 28, fill = false, dotted = false }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = Math.max(0.5, max - min);
  const stepX = width / (data.length - 1);
  const pts = data.map((v, i) => [i * stepX, height - ((v - min) / range) * (height - 4) - 2]);
  const d = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const fillD = fill ? d + ` L ${width} ${height} L 0 ${height} Z` : null;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {fillD && <path d={fillD} fill={color} fillOpacity="0.08" />}
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dotted ? '3 3' : undefined} />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2" fill={color} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────
// Risk badge (large numeric ring)
// ─────────────────────────────────────────────────────────
function RiskRing({ score, band = 'live', size = 72, thick = 6, mini = false }) {
  const b = BAND[band] || BAND.live;
  const r = (size - thick) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - score / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} stroke={T.line} strokeWidth={thick} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke={b.fg} strokeWidth={thick} fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', lineHeight: 1,
      }}>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: mini ? 16 : 22, fontWeight: 600, color: T.ink, letterSpacing: '-0.02em' }}>{score}</div>
        {!mini && <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: T.muted, marginTop: 1, letterSpacing: '0.06em' }}>/100</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Status chip
// ─────────────────────────────────────────────────────────
function Chip({ kind = 'live', children, size = 'sm' }) {
  const b = BAND[kind] || BAND.live;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: size === 'sm' ? '2px 8px' : '4px 10px',
      borderRadius: 999, background: b.bg, color: b.fg,
      fontSize: size === 'sm' ? 11 : 12, fontWeight: 600,
      letterSpacing: '0.02em', lineHeight: 1.4,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: 99, background: b.fg }}></span>
      {children || b.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────
// Vital tile (mobile-optimised, ~ half-width)
// ─────────────────────────────────────────────────────────
function VitalTile({ label, value, second, unit, trend = 'flat', status = 'ok', spark, color }) {
  const arrows = { up: '↑', down: '↓', flat: '→' };
  const s = BAND[status] || BAND.ok;
  return (
    <div style={{
      background: T.card, borderRadius: 14, padding: '11px 13px',
      border: `1px solid ${T.line}`, display: 'flex', flexDirection: 'column', gap: 4,
      minHeight: 100, position: 'relative',
    }}>
      {/* status dot, top-right */}
      <span style={{
        position: 'absolute', top: 12, right: 12,
        width: 6, height: 6, borderRadius: 6, background: s.fg,
      }} />
      <span style={{
        fontSize: 10.5, color: T.muted, fontWeight: 600, letterSpacing: '0.04em',
        textTransform: 'uppercase', whiteSpace: 'nowrap',
      }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 2 }}>
        <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 26, fontWeight: 600, color: T.ink, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</span>
        {second !== undefined && <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 15, color: T.ink2, fontWeight: 500 }}>/{second}</span>}
        <span style={{ fontSize: 10.5, color: T.muted, marginLeft: 2 }}>{unit}</span>
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'flex-end', gap: 6, justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: s.fg, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 2, whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: 12 }}>{arrows[trend]}</span>{trend}
        </span>
        <Sparkline data={spark} color={color || s.fg} width={90} height={20} fill />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Section + Card
// ─────────────────────────────────────────────────────────
function Section({ title, sub, action, children, tone, style }) {
  return (
    <section style={{ padding: '0 16px', ...style }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10, gap: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 11, color: tone || T.muted, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{title}</div>
          {sub && <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2 }}>{sub}</div>}
        </div>
        <div style={{ flexShrink: 0 }}>{action}</div>
      </div>
      {children}
    </section>
  );
}

function Card({ children, style, onClick, accent }) {
  return (
    <div onClick={onClick} style={{
      background: T.card, borderRadius: 14, border: `1px solid ${T.line}`,
      padding: 14, position: 'relative', overflow: 'hidden',
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}>
      {accent && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: accent }} />}
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Top bar (with optional back)
// ─────────────────────────────────────────────────────────
function TopBar({ title, eyebrow, onBack, right }) {
  return (
    <div style={{
      padding: '8px 16px 12px', display: 'flex', alignItems: 'center', gap: 10,
      background: T.bg, position: 'sticky', top: 0, zIndex: 5,
    }}>
      {onBack && (
        <button onClick={onBack} aria-label="Back" style={{
          width: 36, height: 36, borderRadius: 12, border: `1px solid ${T.line}`,
          background: T.card, color: T.ink, display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', padding: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {eyebrow && <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{eyebrow}</div>}
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: T.ink, letterSpacing: '-0.02em', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h1>
      </div>
      {right}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Bottom nav
// ─────────────────────────────────────────────────────────
const NAV_ICONS = {
  triage: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h3l2-6 4 12 2-6h7"/></svg>,
  wards:  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h6"/></svg>,
  search: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
  me:     <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/></svg>,
};

function BottomNav({ active, onChange }) {
  const items = [
    { id: 'triage', label: 'Patients' },
    { id: 'wards',  label: 'Wards' },
    { id: 'search', label: 'Search' },
    { id: 'me',     label: 'Me' },
  ];
  return (
    <nav style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      paddingBottom: 28, paddingTop: 8, background: 'rgba(247,246,242,0.92)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      borderTop: `1px solid ${T.line}`,
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', zIndex: 4,
    }}>
      {items.map(it => {
        const on = it.id === active;
        return (
          <button key={it.id} onClick={() => onChange && onChange(it.id)} style={{
            background: 'none', border: 'none', padding: '6px 4px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            color: on ? T.accent : T.muted, cursor: 'pointer',
          }}>
            {NAV_ICONS[it.id]}
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.02em' }}>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────
// Sheet (bottom modal)
// ─────────────────────────────────────────────────────────
function Sheet({ open, onClose, children, snap = 'tall' }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (open) {
      setMounted(false);
      const id = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(id);
    } else {
      setMounted(false);
    }
  }, [open]);
  if (!open) return null;
  const height = snap === 'short' ? '50%' : snap === 'tall' ? '88%' : '70%';
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 30 }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(15,20,25,0.32)', backdropFilter: 'blur(2px)',
        opacity: mounted ? 1 : 0, transition: 'opacity 200ms ease',
      }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height,
        background: T.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22,
        boxShadow: '0 -10px 40px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        transform: mounted ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 280ms cubic-bezier(.22,.61,.36,1)',
      }}>
        <div style={{ padding: '10px 0 6px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 38, height: 4, borderRadius: 4, background: T.line }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Reusable: KV row, Pill button
// ─────────────────────────────────────────────────────────
function PillBtn({ children, onClick, primary, mono, style }) {
  return (
    <button onClick={onClick} style={{
      padding: '10px 14px', borderRadius: 999,
      border: primary ? 'none' : `1px solid ${T.line}`,
      background: primary ? T.accent : T.card,
      color: primary ? '#fff' : T.ink,
      fontWeight: 600, fontSize: 13, cursor: 'pointer',
      fontFamily: mono ? 'IBM Plex Mono, monospace' : 'inherit',
      ...style,
    }}>{children}</button>
  );
}

Object.assign(window, { T, BAND, Sparkline, RiskRing, Chip, VitalTile, Section, Card, TopBar, BottomNav, Sheet, PillBtn });
