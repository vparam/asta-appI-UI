/* Mobile clinical prototype — app shell + tweaks. Loaded as Babel JSX. */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#0D5A66",
  "density": "comfortable",
  "showAlerts": true,
  "fontPair": "plex"
}/*EDITMODE-END*/;

const ACCENT_SOFT = {
  '#0D5A66': '#E1F0F1',
  '#3344A8': '#E6E8F6',
  '#1F5A3D': '#DCEBE2',
  '#334155': '#E6E9EF',
};

const FONT_MAP = {
  plex:   { body: '"IBM Plex Sans", system-ui, sans-serif', mono: '"IBM Plex Mono", monospace' },
  geist:  { body: '"Geist", "Plus Jakarta Sans", system-ui, sans-serif', mono: '"Geist Mono", "IBM Plex Mono", monospace' },
  system: { body: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif', mono: 'ui-monospace, SFMono-Regular, monospace' },
};

function applyTokens(t) {
  const c = t.accent || '#0D5A66';
  const s = ACCENT_SOFT[c] || '#E1F0F1';
  const f = FONT_MAP[t.fontPair] || FONT_MAP.plex;
  document.documentElement.style.setProperty('--accent', c);
  document.documentElement.style.setProperty('--accent-soft', s);
  document.documentElement.style.setProperty('--font-body', f.body);
  document.documentElement.style.setProperty('--font-mono', f.mono);
}

// ─────────────────────────────────────────────────────────
// App shell
// ─────────────────────────────────────────────────────────
function App({ initialScreen = 'triage', initialPatient = null, initialSheet = null, frameless = false }) {
  const [tweaks, setTweak] = (window.useTweaks || (d => [d, () => {}]))(TWEAK_DEFAULTS);
  useEffect(() => { applyTokens(tweaks); }, [tweaks]);

  const [nav, setNav] = useState({ tab: initialScreen, patientId: initialPatient, sheet: initialSheet });
  const [filter, setFilter] = useState('all');

  const openPatient = (id) => setNav({ tab: 'triage', patientId: id, sheet: null });
  const backFromPatient = () => setNav(n => ({ ...n, patientId: null, sheet: null }));
  const openSheet = (kind) => setNav(n => ({ ...n, sheet: kind }));
  const closeSheet = () => setNav(n => ({ ...n, sheet: null }));
  const changeTab = (tab) => setNav({ tab, patientId: null, sheet: null });

  const content = (() => {
    if (nav.patientId) return <PatientScreen patientId={nav.patientId} onBack={backFromPatient} openSheet={openSheet} />;
    if (nav.tab === 'wards') return <WardsScreen onOpenPatient={openPatient} />;
    if (nav.tab === 'search') return <PlaceholderScreen title="Search" eyebrow="Find a patient" />;
    if (nav.tab === 'me') return <PlaceholderScreen title="Me" eyebrow="Sign-in · shift" />;
    return <TriageScreen onOpenPatient={openPatient} filter={filter} setFilter={setFilter} />;
  })();

  return (
    <div style={{
      position: 'absolute', inset: 0, background: T.bg, color: T.ink,
      fontFamily: 'var(--font-body, "IBM Plex Sans", system-ui, sans-serif)',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {content}
      </div>
      <BottomNav active={nav.patientId ? 'triage' : nav.tab} onChange={changeTab} />
      <Sheet open={nav.sheet === 'decision'} onClose={closeSheet} snap="tall">
        <DecisionSheet patientId={nav.patientId} onClose={closeSheet} />
      </Sheet>
      <Sheet open={nav.sheet === 'judgement'} onClose={closeSheet} snap="mid">
        <JudgementSheet patientId={nav.patientId} onClose={closeSheet} />
      </Sheet>
      <Sheet open={nav.sheet === 'forecast'} onClose={closeSheet} snap="tall">
        <ForecastSheet patientId={nav.patientId} />
      </Sheet>

      {/* Tweaks panel */}
      {window.TweaksPanel && (
        <window.TweaksPanel title="Tweaks">
          <window.TweakSection label="Accent">
            <window.TweakColor
              label="Clinical accent"
              value={tweaks.accent}
              options={['#0D5A66', '#3344A8', '#1F5A3D', '#334155']}
              onChange={v => setTweak('accent', v)}
            />
          </window.TweakSection>
          <window.TweakSection label="Typography">
            <window.TweakRadio
              label="Font pair"
              value={tweaks.fontPair}
              options={[{ value: 'plex', label: 'Plex' }, { value: 'geist', label: 'Geist' }, { value: 'system', label: 'System' }]}
              onChange={v => setTweak('fontPair', v)}
            />
          </window.TweakSection>
          <window.TweakSection label="Layout">
            <window.TweakRadio
              label="Density"
              value={tweaks.density}
              options={[{ value: 'comfortable', label: 'Comfortable' }, { value: 'compact', label: 'Compact' }]}
              onChange={v => setTweak('density', v)}
            />
            <window.TweakToggle
              label="Show AI alerts"
              value={tweaks.showAlerts}
              onChange={v => setTweak('showAlerts', v)}
            />
          </window.TweakSection>
        </window.TweaksPanel>
      )}
    </div>
  );
}

function PlaceholderScreen({ title, eyebrow }) {
  return (
    <div>
      <TopBar eyebrow={eyebrow} title={title} />
      <div style={{ padding: '40px 24px', textAlign: 'center', color: T.muted, fontSize: 13 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: T.card, border: `1px solid ${T.line}`, margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="4"/></svg>
        </div>
        Section scaffold — wire to your data source.
      </div>
    </div>
  );
}

window.App = App;
