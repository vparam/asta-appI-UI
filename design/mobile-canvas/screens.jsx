/* Mobile clinical prototype — screens. Loaded as Babel JSX. */

// ─────────────────────────────────────────────────────────
// 1. Triage feed (home)
// ─────────────────────────────────────────────────────────
function TriageScreen({ onOpenPatient, filter, setFilter }) {
  const patients = window.PATIENTS;
  const sorted = useMemo(() => {
    let p = patients.slice();
    if (filter === 'critical') p = p.filter(x => x.band === 'crit' || x.band === 'watch');
    if (filter === 'mine')     p = p.slice(0, 3);
    p.sort((a, b) => b.risk - a.risk);
    return p;
  }, [filter, patients]);
  const counts = useMemo(() => ({
    total: patients.length,
    crit: patients.filter(p => p.band === 'crit').length,
    watch: patients.filter(p => p.band === 'watch').length,
  }), [patients]);

  return (
    <div style={{ paddingBottom: 96 }}>
      <TopBar
        eyebrow="Tuesday · 09:44"
        title="My patients"
        right={
          <button aria-label="Alerts" style={{
            width: 36, height: 36, borderRadius: 12, border: `1px solid ${T.line}`,
            background: T.card, position: 'relative', display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
            </svg>
            <span style={{ position: 'absolute', top: 6, right: 7, width: 7, height: 7, borderRadius: 7, background: T.crit, border: '1.5px solid ' + T.bg }}/>
          </button>
        }
      />

      {/* Summary strip */}
      <div style={{ padding: '0 16px 14px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <SummaryStat n={counts.total} label="Active" />
        <SummaryStat n={counts.crit + counts.watch} label="On watch" tone={T.warn} />
        <SummaryStat n={'1'} label="Sarathi alerts" tone={T.crit} />
      </div>

      {/* Filter chips */}
      <div style={{ padding: '0 16px 12px', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {[
          { id: 'all', label: 'All' },
          { id: 'critical', label: 'Watch · critical' },
          { id: 'mine', label: 'Recently seen' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: '7px 12px', borderRadius: 999,
            border: `1px solid ${filter === f.id ? T.ink : T.line}`,
            background: filter === f.id ? T.ink : T.card,
            color: filter === f.id ? '#fff' : T.ink2,
            fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>{f.label}</button>
        ))}
      </div>

      <Section title="Ranked by ASTA risk" sub="Updated 09:44">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sorted.map(p => <PatientRowCard key={p.id} p={p} onClick={() => onOpenPatient(p.id)} />)}
        </div>
      </Section>
    </div>
  );
}

function SummaryStat({ n, label, tone }) {
  return (
    <div style={{
      background: T.card, borderRadius: 12, border: `1px solid ${T.line}`,
      padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 2,
    }}>
      <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 22, fontWeight: 600, color: tone || T.ink, lineHeight: 1, letterSpacing: '-0.02em' }}>{n}</span>
      <span style={{ fontSize: 10.5, color: T.muted, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}

function PatientRowCard({ p, onClick }) {
  const band = BAND[p.band] || BAND.live;
  return (
    <Card onClick={onClick} accent={band.fg} style={{ padding: '12px 14px 12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <RiskRing score={p.risk} band={p.band} size={52} thick={4.5} mini />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {p.initials}
            </span>
            <Chip kind={p.band} />
          </div>
          <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {p.ageSex} · {p.bed} · {p.ward}
          </div>
          <div style={{ marginTop: 8, fontSize: 12.5, color: T.ink2, lineHeight: 1.35 }}>
            <span style={{ fontWeight: 600 }}>{p.topScenario.name}</span>
            <span style={{ color: T.muted }}> · {p.topScenario.prob}%</span>
          </div>
          <div style={{ marginTop: 6, display: 'flex', gap: 10, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: T.muted }}>
            <span>HR {p.vitals.hr.v}</span>
            <span>SpO₂ {p.vitals.spo2.v}</span>
            <span>BP {p.vitals.bps.v}/{p.vitals.bps.d}</span>
            <span>RR {p.vitals.rr.v}</span>
          </div>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────
// 2. Patient detail
// ─────────────────────────────────────────────────────────
function PatientScreen({ patientId, onBack, openSheet }) {
  const p = window.PATIENTS.find(x => x.id === patientId) || window.PATIENTS[0];
  const band = BAND[p.band] || BAND.live;

  return (
    <div style={{ paddingBottom: 130 }}>
      <TopBar
        eyebrow={`${p.bed} · ${p.ward}`}
        title={`${p.initials} · ${p.ageSex}`}
        onBack={onBack}
        right={
          <button aria-label="More" style={{
            width: 36, height: 36, borderRadius: 12, border: `1px solid ${T.line}`,
            background: T.card, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={T.ink} stroke="none"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>
          </button>
        }
      />

      {/* Risk hero */}
      <div style={{ padding: '0 16px 16px' }}>
        <Card style={{
          padding: 16, background: `linear-gradient(180deg, ${band.bg} 0%, ${T.card} 100%)`,
          border: `1px solid ${band.bg}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <RiskRing score={p.risk} band={p.band} size={78} thick={7} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Chip kind={p.band} />
                <span style={{ fontSize: 11, color: T.muted, whiteSpace: 'nowrap' }}>· admitted {p.admittedAgo}</span>
              </div>
              <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: band.fg, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Top scenario</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: T.ink, letterSpacing: '-0.01em', marginTop: 2, lineHeight: 1.25 }}>{p.topScenario.name}</div>
              <div style={{ fontSize: 12, color: T.ink2, marginTop: 4 }}>
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, color: band.fg }}>{p.topScenario.prob}%</span> decision-support probability
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Vitals 2x2 grid */}
      <Section title="Live vitals" action={
        <button style={{ background: 'none', border: 'none', color: T.accent, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>Trends ›</button>
      }>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <VitalTile label="Heart rate"  value={p.vitals.hr.v}   unit="bpm"  trend={p.vitals.hr.trend}   status={p.vitals.hr.status}   spark={p.vitals.hr.spark} />
          <VitalTile label="SpO₂"        value={p.vitals.spo2.v} unit="%"    trend={p.vitals.spo2.trend} status={p.vitals.spo2.status} spark={p.vitals.spo2.spark} />
          <VitalTile label="BP" value={p.vitals.bps.v} second={p.vitals.bps.d} unit="mmHg" trend={p.vitals.bps.trend} status={p.vitals.bps.status} spark={p.vitals.bps.spark} />
          <VitalTile label="Resp"   value={p.vitals.rr.v}   unit="/min" trend={p.vitals.rr.trend}   status={p.vitals.rr.status}   spark={p.vitals.rr.spark} />
        </div>
      </Section>

      {/* Sarathi */}
      <Section title="ASTA Sarathi" sub="Why we're watching" style={{ marginTop: 18 }} action={
        <button onClick={() => openSheet('decision')} style={{ background: 'none', border: 'none', color: T.accent, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0, whiteSpace: 'nowrap' }}>All scenarios ›</button>
      }>
        <Card>
          <p style={{ margin: 0, fontSize: 13.5, color: T.ink, lineHeight: 1.5, textWrap: 'pretty' }}>
            {p.topScenario.why}
          </p>
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.lineSoft}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <WhyRow label="BP" detail="147 mmHg ↓55/h" />
            <WhyRow label="HR" detail="75 bpm ↓6.9/h" />
          </div>
        </Card>
      </Section>

      {/* Checks */}
      <Section title="Recommended checks" sub="Tap a row to mark done" style={{ marginTop: 18 }}>
        <Card style={{ padding: 0 }}>
          {p.checks.map((c, i) => <CheckRow key={c.id} c={c} last={i === p.checks.length - 1} />)}
        </Card>
      </Section>

      {/* Forecast preview */}
      <Section title="Forecast · 2h" sub="TimesFM time-series model" style={{ marginTop: 18 }} action={
        <button onClick={() => openSheet('forecast')} style={{ background: 'none', border: 'none', color: T.accent, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>Expand ›</button>
      }>
        <Card style={{ padding: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {p.forecast.slice(0, 4).map(f => <ForecastMini key={f.name} f={f} />)}
          </div>
        </Card>
      </Section>

      {/* Sticky judgement bar */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 86,
        padding: '10px 14px', background: 'linear-gradient(180deg, transparent, rgba(247,246,242,0.95) 30%)',
        display: 'flex', gap: 8, zIndex: 3,
      }}>
        <button onClick={() => openSheet('judgement')} style={{
          flex: 1, height: 48, borderRadius: 14, border: 'none', background: T.ink, color: '#fff',
          fontWeight: 600, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          Record judgement
        </button>
        <button onClick={() => openSheet('decision')} aria-label="ASTA Sarathi" style={{
          width: 48, height: 48, borderRadius: 14, border: `1px solid ${T.line}`, background: T.card,
          color: T.accent, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>
    </div>
  );
}

function WhyRow({ label, detail }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', fontSize: 12, marginTop: 2 }}>
      <span style={{
        minWidth: 32, fontSize: 10, fontWeight: 700, color: T.muted,
        letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>{label}</span>
      <span style={{ color: T.ink2, fontSize: 12, lineHeight: 1.4, whiteSpace: 'nowrap' }}>{detail}</span>
    </div>
  );
}

function CheckRow({ c, last }) {
  const [done, setDone] = useState(false);
  const urg = c.urgency === 'now' ? { fg: T.crit, label: 'Now' } : c.urgency === 'priority' ? { fg: T.warn, label: 'Priority' } : { fg: T.muted, label: 'Next' };
  return (
    <button onClick={() => setDone(d => !d)} style={{
      width: '100%', padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer',
      borderBottom: last ? 'none' : `1px solid ${T.lineSoft}`,
      display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: 7, flexShrink: 0,
        border: `1.5px solid ${done ? T.accent : T.line}`,
        background: done ? T.accent : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
      </span>
      <span style={{ flex: 1, fontSize: 13.5, color: done ? T.muted : T.ink, textDecoration: done ? 'line-through' : 'none', fontWeight: 500 }}>{c.label}</span>
      <span style={{ fontSize: 10.5, fontWeight: 700, color: urg.fg, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{urg.label}</span>
    </button>
  );
}

function ForecastMini({ f }) {
  const dirArrow = f.dir === 'falling' ? '↓' : f.dir === 'rising' ? '↑' : '→';
  const riskColor = f.risk >= 60 ? T.warn : f.risk >= 45 ? T.accent : T.muted;
  return (
    <div style={{ padding: 8, borderRadius: 10, background: T.bg, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: T.ink2 }}>{f.name}</span>
        <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: riskColor, fontWeight: 700 }}>{f.risk}%</span>
      </div>
      <Sparkline data={f.spark} color={riskColor} width={120} height={22} fill dotted={f.dir==='flat'} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: T.muted }}>
        <span>{dirArrow} {f.dir}</span>
        <span>{f.end} @120m</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 3. Decision sheet — scenarios / checks / meds
// ─────────────────────────────────────────────────────────
function DecisionSheet({ patientId, onClose }) {
  const p = window.PATIENTS.find(x => x.id === patientId) || window.PATIENTS[0];
  const [tab, setTab] = useState('scenarios');
  const [open, setOpen] = useState(p.scenarios[0]?.rank);

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ padding: '4px 18px 14px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.accent, letterSpacing: '0.1em', textTransform: 'uppercase' }}>NICE-aligned decision support</div>
        <h2 style={{ margin: '4px 0 0', fontSize: 19, fontWeight: 600, color: T.ink, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
          ASTA Sarathi · {p.initials}
        </h2>
        <div style={{ marginTop: 6, fontSize: 12, color: T.muted }}>
          Audit d358101… · medgemma-27b · confidence 59%
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ padding: '0 16px 12px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, background: T.bg, position: 'sticky', top: 0, zIndex: 2 }}>
        {[
          { id: 'scenarios', label: 'Scenarios', count: p.scenarios.length },
          { id: 'checks', label: 'Checks', count: p.checks.length },
          { id: 'meds', label: 'Med safety' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '9px 8px', borderRadius: 10,
            background: tab === t.id ? T.card : 'transparent',
            border: `1px solid ${tab === t.id ? T.line : 'transparent'}`,
            color: tab === t.id ? T.ink : T.muted,
            fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
          }}>
            {t.label}{t.count !== undefined && <span style={{ color: T.muted, marginLeft: 4 }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {tab === 'scenarios' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {p.scenarios.map(s => (
            <ScenarioCard key={s.rank} s={s} open={open === s.rank} onToggle={() => setOpen(open === s.rank ? null : s.rank)} />
          ))}
          <GovBlock />
        </div>
      )}
      {tab === 'checks' && (
        <div style={{ padding: '0 16px' }}>
          <Card style={{ padding: 0 }}>
            {p.checks.map((c, i) => <CheckRow key={c.id} c={c} last={i === p.checks.length - 1} />)}
          </Card>
          <div style={{ fontSize: 11.5, color: T.muted, marginTop: 10, padding: '0 4px' }}>
            Local sepsis / cardiac protocols govern these — Sarathi proposes, clinician decides.
          </div>
        </div>
      )}
      {tab === 'meds' && (
        <div style={{ padding: '0 16px' }}>
          <Card>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.warn, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Medication lane</div>
            <p style={{ margin: '8px 0 0', fontSize: 13.5, color: T.ink, lineHeight: 1.5 }}>
              Antibiotic / vasopressor / fluid decisions require clinician diagnosis, local sepsis protocol, allergies, cultures, BP response, renal / cardiac context.
            </p>
            <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['Allergies: none','Renal: normal','Cardiac: stable','Cultures: pending'].map(t => (
                <span key={t} style={{ fontSize: 11, padding: '4px 9px', borderRadius: 999, background: T.bg, color: T.ink2, fontFamily: 'IBM Plex Mono, monospace' }}>{t}</span>
              ))}
            </div>
          </Card>
          <GovBlock />
        </div>
      )}
    </div>
  );
}

function ScenarioCard({ s, open, onToggle }) {
  const tone = s.rank === 1 ? T.warn : s.rank === 2 ? T.accent : T.muted;
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <button onClick={onToggle} style={{
        width: '100%', background: 'none', border: 'none', padding: '14px',
        display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10, background: T.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'IBM Plex Mono, monospace', fontSize: 14, fontWeight: 700, color: tone,
        }}>{s.rank}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, lineHeight: 1.25 }}>{s.name}</div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{s.checks.length} checks suggested</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 18, fontWeight: 600, color: tone, lineHeight: 1, letterSpacing: '-0.02em' }}>{s.prob}%</div>
          <div style={{ fontSize: 9, color: T.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>Probability</div>
        </div>
      </button>
      {open && (
        <div style={{ padding: '4px 14px 14px', borderTop: `1px solid ${T.lineSoft}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '12px 0 6px' }}>Why ranked</div>
          <p style={{ margin: 0, fontSize: 12.5, color: T.ink2, lineHeight: 1.5 }}>{s.why}</p>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '12px 0 6px' }}>Suggested checks</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {s.checks.map(c => (
              <span key={c} style={{ fontSize: 11.5, padding: '5px 10px', borderRadius: 8, background: T.accentSoft, color: T.accent, fontWeight: 500 }}>{c}</span>
            ))}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '12px 0 6px' }}>Medication context</div>
          <p style={{ margin: 0, fontSize: 12, color: T.ink2, lineHeight: 1.5 }}>{s.meds}</p>
        </div>
      )}
    </Card>
  );
}

function GovBlock() {
  return (
    <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12, background: T.bg, border: `1px dashed ${T.line}` }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: T.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Governance</div>
      <p style={{ margin: '4px 0 0', fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>
        Decision support only — not a diagnosis, treatment order, or regulatory endorsement. DCB0129 / DCB0160 / MHRA SaMD apply.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 4. Judgement sheet
// ─────────────────────────────────────────────────────────
function JudgementSheet({ patientId, onClose }) {
  const p = window.PATIENTS.find(x => x.id === patientId) || window.PATIENTS[0];
  const [choice, setChoice] = useState(null);
  const [note, setNote] = useState('');
  const options = [
    { id: 'agree',   label: 'Agree',        sub: 'Plan as suggested',              color: T.ok,   bg: T.okSoft },
    { id: 'partly',  label: 'Partly',       sub: 'Some elements correct',          color: T.accent, bg: T.accentSoft },
    { id: 'disagree',label: 'Disagree',     sub: 'Different working diagnosis',    color: T.warn, bg: T.warnSoft },
    { id: 'unsafe',  label: 'Unsafe',       sub: 'Reject — would cause harm',      color: T.crit, bg: T.critSoft },
    { id: 'missing', label: 'Missing data', sub: 'Cannot judge with this evidence',color: T.muted, bg: T.bg },
  ];
  return (
    <div style={{ padding: '0 18px 24px' }}>
      <div style={{ padding: '4px 0 14px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.accent, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Clinician judgement</div>
        <h2 style={{ margin: '4px 0 0', fontSize: 19, fontWeight: 600, color: T.ink, letterSpacing: '-0.02em', lineHeight: 1.25 }}>How does this match your assessment?</h2>
        <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.muted, lineHeight: 1.5 }}>
          Your call feeds real-world monitoring, calibration and safety review.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map(o => {
          const on = choice === o.id;
          return (
            <button key={o.id} onClick={() => setChoice(o.id)} style={{
              padding: '12px 14px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
              border: `1.5px solid ${on ? o.color : T.line}`,
              background: on ? o.bg : T.card,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: 22, flexShrink: 0,
                border: `1.5px solid ${on ? o.color : T.line}`,
                background: on ? o.color : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {on && <span style={{ width: 8, height: 8, borderRadius: 8, background: '#fff' }}/>}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{o.label}</div>
                <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2 }}>{o.sub}</div>
              </div>
            </button>
          );
        })}
      </div>
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note (free text)" rows={3} style={{
        marginTop: 12, width: '100%', resize: 'none', padding: 12, borderRadius: 12,
        border: `1px solid ${T.line}`, background: T.card, color: T.ink,
        fontFamily: 'inherit', fontSize: 13, lineHeight: 1.5, boxSizing: 'border-box',
      }} />
      <button disabled={!choice} onClick={onClose} style={{
        marginTop: 12, width: '100%', height: 50, borderRadius: 14, border: 'none',
        background: choice ? T.ink : T.line, color: choice ? '#fff' : T.muted,
        fontWeight: 600, fontSize: 14, cursor: choice ? 'pointer' : 'not-allowed',
      }}>Submit judgement</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 5. Forecast sheet (expanded)
// ─────────────────────────────────────────────────────────
function ForecastSheet({ patientId }) {
  const p = window.PATIENTS.find(x => x.id === patientId) || window.PATIENTS[0];
  return (
    <div style={{ padding: '4px 18px 24px' }}>
      <div style={{ padding: '0 0 14px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.accent, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Vital forecast · next 2h</div>
        <h2 style={{ margin: '4px 0 0', fontSize: 19, fontWeight: 600, color: T.ink, letterSpacing: '-0.02em' }}>TimesFM — 2.5 / 200M</h2>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: T.muted }}>Forecast model · active method HF time-series</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {p.forecast.map(f => <ForecastFullRow key={f.name} f={f} />)}
      </div>
    </div>
  );
}

function ForecastFullRow({ f }) {
  const riskColor = f.risk >= 60 ? T.warn : f.risk >= 45 ? T.accent : T.muted;
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{f.name}</div>
          <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2 }}>Projected {f.dir} · no critical breach</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 17, fontWeight: 600, color: riskColor, lineHeight: 1 }}>{f.risk}%</div>
          <div style={{ fontSize: 9, color: T.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>Confidence</div>
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        <Sparkline data={f.spark} color={riskColor} width={310} height={50} fill />
      </div>
      <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10.5, color: T.muted }}>
        <span>+30m {f.spark[2]}</span>
        <span>+60m {f.spark[4]}</span>
        <span>+120m {f.spark[7]}</span>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────
// 6. Wards screen
// ─────────────────────────────────────────────────────────
function WardsScreen({ onOpenPatient }) {
  return (
    <div style={{ paddingBottom: 96 }}>
      <TopBar eyebrow="Monitoring" title="Wards" />
      <div style={{ padding: '0 16px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <SummaryStat n={3} label="Wards" />
        <SummaryStat n={'29%'} label="Occupied" tone={T.accent} />
      </div>
      <Section title="Live status">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {window.WARDS.map(w => <WardCard key={w.id} w={w} />)}
        </div>
      </Section>
    </div>
  );
}

function WardCard({ w }) {
  const ratio = w.occupied / w.capacity;
  const tone = w.critical > 0 ? T.crit : ratio >= 0.9 ? T.warn : T.ok;
  return (
    <Card style={{ padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.ink }}>{w.name}</div>
          <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2 }}>{w.floor}</div>
        </div>
        {w.critical > 0 ? <Chip kind="crit">{w.critical} critical</Chip> : <Chip kind="ok">Stable</Chip>}
      </div>
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 22, fontWeight: 600, color: T.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>{w.occupied}<span style={{ color: T.muted, fontSize: 14 }}>/{w.capacity}</span></span>
        <span style={{ fontSize: 11, color: T.muted, fontWeight: 600, letterSpacing: '0.04em' }}>BEDS</span>
      </div>
      <div style={{ marginTop: 8, height: 6, background: T.bg, borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ width: `${ratio*100}%`, height: '100%', background: tone, borderRadius: 6 }} />
      </div>
    </Card>
  );
}

Object.assign(window, { TriageScreen, PatientScreen, DecisionSheet, JudgementSheet, ForecastSheet, WardsScreen });
