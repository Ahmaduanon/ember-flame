'use client';
import { useEffect, useRef, useState } from 'react';
import { Activity, AlertTriangle, ArrowDownToLine, ArrowRight, Beaker, BookOpen, Check, CheckCircle2, ChevronDown, ChevronRight, CircleHelp, Cpu, Database, Download, Earth, Flame, FolderOpen, Gauge, GitCompareArrows, Home, Layers, Menu, Moon, Orbit, PanelLeft, PanelLeftClose, PanelLeftOpen, Pause, Play, Radio, RotateCcw, Save, Settings2, Shield, ShieldAlert, SlidersHorizontal, Snowflake, Sun, Thermometer, Trash2, Waves, Wind, X, Zap } from 'lucide-react';
import { DEFAULTS, FUELS, PRESETS, MODEL_VERSION, computeInstantaneousState, gravityLabel, initialState, regime, sample, step, type Fuel, type Intervention, type Point, type Settings, type SimState } from '@/lib/model';
import { matchNasaDataset, HISTORICAL_FIRE_INCIDENTS, PSI_INVESTIGATIONS } from '@/lib/nasa-data';
import FlameView, {type Layer} from './flame-view';
import { Plot } from './chart';
import Method from './method';
import Scanner from './scanner';
import SafetyDashboard, { useSafety, SafetyBanner } from './safety-dashboard';
import GuardianView from './guardian-view';
import PsiExplorer from './psi-explorer';
import { useTheme } from './theme';
import { useToast } from './toast';
import { useAuth } from './auth';

type Tab = 'guard' | 'scanner' | 'guardian' | 'lab' | 'psi' | 'experiments' | 'method';
type Event = { time: number; text: string };
type Run = { id: string; title: string; createdAt: number; payload: { model: string; settings: Settings; initialSettings: Settings; intervention: Intervention; points: Point[]; events: Event[]; status: string } };

const homeNav = [
  { id: 'guard' as Tab, label: 'Safety / Rooms', shortLabel: 'Safety', icon: Shield, subtitle: 'Checklists, Photos & AI Fixes' },
  { id: 'scanner' as Tab, label: '2D Map', shortLabel: '2D Map', icon: Layers, subtitle: '2D Spatial Risk Planner' },
  { id: 'guardian' as Tab, label: 'Guardian 3D', shortLabel: 'Guardian', icon: Cpu, subtitle: '3D Guardian Blueprint & Specs' }
];

const scienceNav = [
  { id: 'lab' as Tab, label: 'Combustion Lab', shortLabel: 'Lab', icon: Beaker, subtitle: 'Microgravity Combustion' },
  { id: 'psi' as Tab, label: 'NASA PSI Explorer', shortLabel: 'PSI Data', icon: Database, subtitle: 'Investigations & Flammability' },
  { id: 'experiments' as Tab, label: 'Saved Runs', shortLabel: 'Saved', icon: FolderOpen, subtitle: 'Curves & Comparisons' },
  { id: 'method' as Tab, label: 'Method', shortLabel: 'Method', icon: BookOpen, subtitle: 'Physics & Equations' }
];

const allNav = [...homeNav, ...scienceNav];
const actionNames: Record<Intervention, string> = {
  none: 'No intervention',
  cutoff: 'Fuel supply cut off',
  dilution: 'Oxygen dilution to at most 9%',
  cooling: 'Enhanced cooling (4× transfer)'
};

function download(name: string, body: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Range({ label, value, min, max, step = 1, unit, onChange, display }: { label: string; value: number; min: number; max: number; step?: number; unit: string; onChange: (n: number) => void; display?: string }) {
  const id = 'range-' + label.toLowerCase().replace(/\W/g, '-');
  return (
    <div className="range-field">
      <div>
        <label htmlFor={id}>{label}</label>
        <span className="mono">{display ?? value.toString()} <small>{unit}</small></span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
      <div className="range-ends">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
}

function Dialog({ children, onClose, label }: { children: React.ReactNode; onClose: () => void; label: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog ref={ref} className="modal" aria-label={label} onCancel={onClose} onClick={e => { if (e.target === ref.current) onClose(); }}>
      <div className="modal-inner">
        <div className="modal-drag-handle" />
        <button className="modal-close icon-button" onClick={onClose} aria-label="Close dialog">
          <X size={18} />
        </button>
        {children}
      </div>
    </dialog>
  );
}

function getInitialTab(): Tab {
  const match = typeof location !== 'undefined' ? location.hash.match(/[?&]tab=([a-z]+)/) : null;
  const t = match ? (match[1] as Tab) : 'guard';
  return (['guard', 'scanner', 'guardian', 'lab', 'psi', 'experiments', 'method'] as Tab[]).includes(t) ? t : 'guard';
}

export default function Lab() {
  const [tab, setTabState] = useState<Tab>(getInitialTab);
  const [activeRoomId, setActiveRoomId] = useState('');
  const [safetyMenuOpen, setSafetyMenuOpen] = useState(false);
  const safetyMenuRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<Settings>({ ...DEFAULTS });
  const [sim, setSim] = useState<SimState>(() => initialState());
  const [running, setRunning] = useState(false);
  const [action, setAction] = useState<Intervention>('none');
  const [points, setPoints] = useState<Point[]>([]);
  const [events, setEvents] = useState<Event[]>([{ time: 0, text: 'Experiment ignited — Earth reference conditions' }]);
  const [layer, setLayer] = useState<Layer>('flame');
  const [showFlow, setShowFlow] = useState(true);
  const [chart, setChart] = useState<'temperature' | 'energy' | 'species'>('temperature');
  const [saveOpen, setSaveOpen] = useState(false);
  const [runTitle, setRunTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [viewRun, setViewRun] = useState<Run | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [moreNavOpen, setMoreNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('ember-sidebar-collapsed') === 'true';
    }
    return false;
  });

  const toggleSidebar = () => {
    setCollapsed(prev => {
      const next = !prev;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('ember-sidebar-collapsed', String(next));
      }
      return next;
    });
  };

  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const { user, logout } = useAuth();
  const safety = useSafety();

  const setTab = (nextTab: Tab) => {
    setTabState(nextTab);
    setMoreNavOpen(false);
    if (typeof location !== 'undefined' && location.hash.startsWith('#app')) {
      location.hash = '#app?tab=' + nextTab;
    }
  };

  useEffect(() => {
    if (!moreNavOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreNavOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [moreNavOpen]);

  useEffect(() => {
    const onHash = () => setTabState(getInitialTab());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (!safetyMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (safetyMenuRef.current && !safetyMenuRef.current.contains(e.target as Node)) {
        setSafetyMenuOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSafetyMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [safetyMenuOpen]);

  const simRef = useRef(sim);
  const pRef = useRef(settings);
  const aRef = useRef(action);
  const runRef = useRef(running);
  const initialRef = useRef({ ...DEFAULTS });

  pRef.current = settings;
  aRef.current = action;
  runRef.current = running;

  function notify(text: string) {
    toast.notify(text);
  }

  function event(text: string) {
    setEvents(old => [...old, { time: simRef.current.time, text }].slice(-200));
  }

  function change<K extends keyof Settings>(key: K, value: Settings[K]) {
    const nextSettings = { ...pRef.current, [key]: value };
    pRef.current = nextSettings;
    setSettings(nextSettings);
    event(`${key}: ${value}`);

    // Real-time instantaneous flame adaptation under the hood (auto-calibrated with NASA flight parameters)
    if (simRef.current.burning) {
      const autoNasa = matchNasaDataset(nextSettings);
      const adapted = computeInstantaneousState(simRef.current, nextSettings, aRef.current, autoNasa);
      simRef.current = adapted;
      setSim(adapted);
    }
  }

  useEffect(() => {
    let tick = 0;
    const timer = setInterval(() => {
      if (!runRef.current) return;
      let next = simRef.current;
      const autoNasa = matchNasaDataset(pRef.current);
      for (let i = 0; i < 2; i++) next = step(next, pRef.current, aRef.current, 0.025, autoNasa);
      if (next.burning !== simRef.current.burning) {
        setEvents(old => [...old, { time: next.time, text: 'Extinction criterion reached' }].slice(-200));
      }
      simRef.current = next;
      setSim(next);
      if (++tick % 10 === 0) setPoints(old => [...old, sample(next)].slice(-600));
      if (next.time >= 300) {
        setRunning(false);
        runRef.current = false;
        notify('Five-minute run complete. Save or export it, then start a new experiment.');
      }
    }, 50);
    return () => clearInterval(timer);
  }, []);

  function reset(p: Settings = settings) {
    const s = initialState(p);
    const autoNasa = matchNasaDataset(p);
    const adapted = computeInstantaneousState(s, p, 'none', autoNasa);
    simRef.current = adapted;
    pRef.current = p;
    initialRef.current = { ...p };
    aRef.current = 'none';
    setSettings({ ...p });
    setSim(adapted);
    setPoints([]);
    setAction('none');
    setEvents([{ time: 0, text: 'Experiment ignited with selected conditions' }]);
    setRunning(true);
    runRef.current = true;
  }

  function reignite() {
    const fresh = initialState(settings);
    const autoNasa = matchNasaDataset(settings);
    const adapted = computeInstantaneousState(fresh, settings, action, autoNasa);
    simRef.current = { ...adapted, time: simRef.current.time };
    setSim(simRef.current);
    event('Flame reignited under current conditions');
    setRunning(true);
    runRef.current = true;
  }

  function suppress(a: Intervention) {
    setAction(a);
    aRef.current = a;
    event(actionNames[a]);
    setRunning(true);
    runRef.current = true;
  }

  const payload = () => ({
    model: MODEL_VERSION,
    settings: { ...pRef.current },
    initialSettings: initialRef.current,
    intervention: aRef.current,
    points: [...points, sample(simRef.current)].slice(-600),
    events,
    status: simRef.current.status
  });

  async function loadRuns() {
    setLoading(true);
    setLoadError('');
    try {
      const r = await fetch('/api/runs');
      if (!r.ok) throw new Error((await r.json()).error || 'Cannot load experiments.');
      setRuns(await r.json());
    } catch {
      const local = typeof window !== 'undefined' ? localStorage.getItem('ember_saved_runs') : null;
      if (local) {
        try {
          setRuns(JSON.parse(local));
          return;
        } catch {}
      }
      setRuns([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tab === 'experiments') void loadRuns();
  }, [tab]);

  async function save() {
    if (!runTitle.trim()) return;
    setSaving(true);
    try {
      const r = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: runTitle.trim(), payload: payload() })
      });
      if (!r.ok) throw new Error((await r.json()).error || 'Could not save experiment.');
      setSaveOpen(false);
      notify('Experiment saved on this computer.');
      await loadRuns();
    } catch {
      // Offline / Vercel fallback
      const newRun: Run = {
        id: 'run-' + Date.now(),
        title: runTitle.trim(),
        createdAt: Date.now(),
        payload: payload()
      };
      const updated = [newRun, ...runs];
      setRuns(updated);
      if (typeof window !== 'undefined') localStorage.setItem('ember_saved_runs', JSON.stringify(updated));
      setSaveOpen(false);
      notify('Experiment saved locally.');
    } finally {
      setSaving(false);
    }
  }

  function exportCSV(data: { points: Point[] } = payload()) {
    const keys = ['time', 'temperature', 'release', 'loss', 'oxygenMass', 'fuelMass', 'size'] as const;
    download(
      'ember-experiment.csv',
      'time_s,gas_temperature_K,heat_release_W,heat_loss_W,oxygen_inventory_mg,fuel_inventory_mg,illustrative_size_mm\n' +
        data.points.map(p => keys.map(k => p[k].toFixed(4)).join(',')).join('\n'),
      'text/csv'
    );
  }

  async function remove(run: Run) {
    if (!window.confirm(`Delete “${run.title}” from this computer?`)) return;
    try {
      const r = await fetch('/api/runs?id=' + encodeURIComponent(run.id), { method: 'DELETE' });
      if (!r.ok) throw new Error('Could not delete experiment.');
      setRuns(old => old.filter(x => x.id !== run.id));
      setSelected(old => old.filter(x => x !== run.id));
      notify('Experiment deleted.');
    } catch {
      const updated = runs.filter(x => x.id !== run.id);
      setRuns(updated);
      setSelected(old => old.filter(x => x !== run.id));
      if (typeof window !== 'undefined') localStorage.setItem('ember_saved_runs', JSON.stringify(updated));
      notify('Experiment deleted.');
    }
  }

  const preset = PRESETS.find(x => x.gravity === settings.gravity);
  const comparison = runs.filter(r => selected.includes(r.id));
  const chartSeries = chart === 'temperature'
    ? [{ name: 'Gas temperature', color: '#00e5a3', values: points.map(p => ({ x: p.time, y: p.temperature })) }]
    : chart === 'energy'
    ? [
        { name: 'Heat release', color: '#ff5722', values: points.map(p => ({ x: p.time, y: p.release })) },
        { name: 'Heat loss', color: '#38bdf8', values: points.map(p => ({ x: p.time, y: p.loss })) }
      ]
    : [
        { name: 'Oxygen inventory', color: '#00e5a3', values: points.map(p => ({ x: p.time, y: p.oxygenMass })) },
        { name: 'Fuel inventory', color: '#a855f7', values: points.map(p => ({ x: p.time, y: p.fuelMass })) }
      ];

  const isScience = ['lab', 'psi', 'experiments', 'method'].includes(tab);
  const mode = isScience ? 'science' : 'home';
  const navList = isScience ? scienceNav : homeNav;
  const currentNav = allNav.find(n => n.id === tab);

  // Safety status derived from active room findings
  const openFindings = safety.data.findings.filter(f => !['resolved', 'dismissed'].includes(f.status));
  const urgentCount = openFindings.filter(f => f.priority === 'urgent_review').length;
  const hasUrgent = urgentCount > 0;
  const hasReview = openFindings.length > 0;

  const roomsWithHazards = safety.data.rooms
    .map(room => {
      const roomFindings = openFindings.filter(f => f.roomId === room.id);
      const urgent = roomFindings.filter(f => f.priority === 'urgent_review');
      const review = roomFindings.filter(f => f.priority === 'review');
      return {
        ...room,
        urgentCount: urgent.length,
        reviewCount: review.length,
        totalCount: roomFindings.length,
        topFinding: urgent[0] || review[0] || null
      };
    })
    .filter(r => r.totalCount > 0)
    .sort((a, b) => b.urgentCount - a.urgentCount || b.totalCount - a.totalCount);

  const userInitials = user?.name
    ? user.name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()
    : 'EM';

  const handleSimulatePreset = (presetId: string) => {
    const incident = HISTORICAL_FIRE_INCIDENTS.find(h => h.id === presetId);
    if (incident) {
      reset(incident.simulationSettings);
      setTab('lab');
      notify(`Loaded ${incident.title} simulation preset into Combustion Lab.`);
      setRunning(true);
      return;
    }
    const psi = PSI_INVESTIGATIONS.find(p => p.id === presetId);
    if (psi) {
      reset(psi.simulationPreset);
      setTab('lab');
      notify(`Loaded ${psi.acronym} microgravity flight preset into Combustion Lab.`);
      setRunning(true);
      return;
    }
    setTab('lab');
    setRunning(true);
  };

  const handleOpenPsi = (investigationId?: string) => {
    setTab('psi');
    notify('Opened NASA Physical Science Informatics (PSI) Explorer.');
  };

  return (
    <div className="app-shell">
      <aside className={'sidebar ' + (collapsed ? 'collapsed ' : '') + (mobileNav ? 'mobile-open' : '')}>
        <div className="sidebar-header">
          <a className="brand" href="#" onClick={e => { e.preventDefault(); setTab('guard'); }} title={collapsed ? "Ember Home Safety" : undefined}>
            <span className="brand-icon"><Flame size={24} /></span>
            {!collapsed && <span>ember</span>}
          </a>
          <button
            className="sidebar-collapse-btn icon-button"
            onClick={toggleSidebar}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        {/* Integrated Segmented Mode Switcher */}
        <div className="mode-switch-bar">
          <button
            className={'mode-pill-btn ' + (mode === 'home' ? 'active' : '')}
            onClick={() => { setTab('guard'); setMobileNav(false); }}
            title="Home Safety Workspace"
          >
            <Shield size={collapsed ? 16 : 13} />
            {!collapsed && <span>Home Safety</span>}
          </button>
          <button
            className={'mode-pill-btn ' + (mode === 'science' ? 'active' : '')}
            onClick={() => { setTab('lab'); setMobileNav(false); if (sim.time === 0) setRunning(true); }}
            title="Science Lab Workspace"
          >
            <Beaker size={collapsed ? 16 : 13} />
            {!collapsed && <span>Science Lab</span>}
          </button>
        </div>

        {!collapsed && (
          <div className="workspace-label">
            {mode === 'home' ? 'SPACE PROTECTION & AUDIT' : 'COMBUSTION & PHYSICS RESEARCH'}
          </div>
        )}

        <nav>
          {navList.map(n => (
            <button
              key={n.id}
              onClick={() => { setTab(n.id); setMobileNav(false); if (n.id === 'lab' && sim.time === 0) setRunning(true); }}
              className={tab === n.id ? 'active' : ''}
              aria-current={tab === n.id ? 'page' : undefined}
              title={collapsed ? `${n.label} — ${n.subtitle}` : undefined}
            >
              <n.icon size={17} />
              {!collapsed && (
                <div className="nav-text-group">
                  <span>{n.label}</span>
                  <small>{n.subtitle}</small>
                </div>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="local-storage" title={collapsed ? "Private Local Storage: Active" : undefined}>
            <Database size={13} />
            {!collapsed && <span>Private Local Storage</span>}
            <i />
          </div>
          {!collapsed && <small className="sidebar-version">RESEARCH PROTOTYPE / v0.2.1</small>}
        </div>
      </aside>

      <div className={'main-shell ' + (collapsed ? 'sidebar-collapsed' : '')}>
        <header className="topbar">
          <div className="topbar-title-section">
            <a className="mobile-brand-link" href="#" title="Back to Ember Home">
              <span className="mobile-brand-flame"><Flame size={18} /></span>
              <span className="mobile-brand-name">ember</span>
            </a>
            <span className="topbar-title-divider" />
            <h1 className="topbar-screen-title">{currentNav?.label || 'Overview'}</h1>
          </div>

          <div className="top-actions">
            {/* Topbar Safety Badge & Alerts Dropdown */}
            <div className="topbar-sentinel-wrap" ref={safetyMenuRef}>
              <button
                className={`topbar-sentinel ${hasUrgent ? 'alarm' : hasReview ? 'warning' : 'ok'} ${safetyMenuOpen ? 'menu-active' : ''}`}
                onClick={() => setSafetyMenuOpen(prev => !prev)}
                title="Click to view room hazard alerts"
                aria-expanded={safetyMenuOpen}
                aria-haspopup="dialog"
              >
                <span className="sentinel-pulse" />
                <span className="sentinel-label-desktop">
                  {hasUrgent ? `${urgentCount} Urgent Hazard${urgentCount === 1 ? '' : 's'}` : hasReview ? `${openFindings.length} Items To Review` : 'All Spaces Clear'}
                </span>
                <span className="sentinel-label-mobile">
                  {hasUrgent ? `${urgentCount} URGENT` : hasReview ? `${openFindings.length}` : 'OK'}
                </span>
                <ChevronDown size={13} className={`sentinel-caret ${safetyMenuOpen ? 'open' : ''}`} />
              </button>

              {safetyMenuOpen && (
                <div className="safety-dropdown-menu" role="dialog" aria-label="Room Hazard Alerts">
                  <div className="safety-dropdown-header">
                    <div className="safety-dropdown-header-title">
                      {hasUrgent ? (
                        <AlertTriangle size={16} className="text-danger shrink-0" />
                      ) : hasReview ? (
                        <ShieldAlert size={16} className="text-warning shrink-0" />
                      ) : (
                        <CheckCircle2 size={16} className="text-success shrink-0" />
                      )}
                      <div>
                        <b>Room Safety Alerts</b>
                        <small>{hasUrgent ? `${urgentCount} urgent room hazard${urgentCount === 1 ? '' : 's'}` : hasReview ? `${openFindings.length} pending review item${openFindings.length === 1 ? '' : 's'}` : 'All spaces clear'}</small>
                      </div>
                    </div>
                    <button
                      className="safety-dropdown-close icon-button"
                      onClick={() => setSafetyMenuOpen(false)}
                      title="Close alerts menu"
                      aria-label="Close alerts menu"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div className="safety-dropdown-body">
                    {roomsWithHazards.length > 0 ? (
                      <div className="safety-dropdown-rooms-list">
                        <div className="safety-dropdown-section-label">Rooms requiring attention:</div>
                        {roomsWithHazards.map(r => (
                          <button
                            key={r.id}
                            className={`safety-dropdown-room-item ${r.urgentCount > 0 ? 'is-urgent' : 'is-review'}`}
                            onClick={() => {
                              setActiveRoomId(r.id);
                              setTab('guard');
                              setSafetyMenuOpen(false);
                            }}
                            title={`Inspect ${r.name}`}
                          >
                            <div className="room-item-icon">
                              {r.urgentCount > 0 ? (
                                <AlertTriangle size={15} className="text-danger shrink-0" />
                              ) : (
                                <ShieldAlert size={15} className="text-warning shrink-0" />
                              )}
                            </div>
                            <div className="room-item-content">
                              <div className="room-item-title-row">
                                <span className="room-name">{r.name}</span>
                                <div className="room-hazard-badges">
                                  {r.urgentCount > 0 && (
                                    <span className="badge-pill badge-urgent">{r.urgentCount} Urgent</span>
                                  )}
                                  {r.reviewCount > 0 && (
                                    <span className="badge-pill badge-review">{r.reviewCount} Review</span>
                                  )}
                                </div>
                              </div>
                              <div className="room-meta-sub">{r.building} · {r.floor || 'Floor not set'}</div>
                              {r.topFinding && (
                                <div className="room-top-finding" title={r.topFinding.title}>
                                  <span className="finding-bullet">•</span> {r.topFinding.title}
                                </div>
                              )}
                            </div>
                            <ChevronRight size={14} className="room-item-chevron shrink-0" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="safety-dropdown-clear-state">
                        <CheckCircle2 size={32} className="text-success" />
                        <b>All Monitored Spaces Clear</b>
                        <p>No open hazards or pending reviews across your rooms.</p>
                        {safety.data.rooms.length > 0 && (
                          <div className="safety-dropdown-clear-rooms">
                            <span className="clear-rooms-label">Quick select room to inspect:</span>
                            <div className="clear-rooms-chips">
                              {safety.data.rooms.map(r => (
                                <button
                                  key={r.id}
                                  className="clear-room-chip"
                                  onClick={() => {
                                    setActiveRoomId(r.id);
                                    setTab('guard');
                                    setSafetyMenuOpen(false);
                                  }}
                                >
                                  <Home size={12} />
                                  <span>{r.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="safety-dropdown-footer">
                    <button
                      className="safety-dropdown-viewall"
                      onClick={() => {
                        setTab('guard');
                        setSafetyMenuOpen(false);
                      }}
                    >
                      <Shield size={13} />
                      <span>Open Room Safety Hub</span>
                    </button>
                    <button
                      className="safety-dropdown-maplink"
                      onClick={() => {
                        setTab('scanner');
                        setSafetyMenuOpen(false);
                      }}
                      title="Open 2D Hazard Map"
                    >
                      <Layers size={13} />
                      <span>Hazard Map</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>

            {/* Help Link */}
            <button
              className="icon-button"
              title="Model documentation & science"
              aria-label="Open model documentation"
              onClick={() => setTab('method')}
            >
              <CircleHelp size={17} />
            </button>

            {/* Integrated User Profile Menu (replaces floating chip) */}
            {user && (
              <div className="topbar-user">
                <div className="topbar-user-avatar" title={user.name}>
                  {userInitials}
                </div>
                <div className="topbar-user-info hidden sm:flex">
                  <span className="topbar-user-name">{user.name}</span>
                  <span className="topbar-user-role">Local Operator</span>
                </div>
                <button className="topbar-signout-btn" onClick={logout} title="Sign out of Ember">
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        <main>
          <SafetyBanner data={safety.data} error={safety.error} onOpen={() => setTab('guard')} />
          {tab === 'guard' ? (
            <SafetyDashboard
              data={safety.data}
              error={safety.error}
              reload={safety.reload}
              notify={notify}
              onOpenScanner={() => setTab('scanner')}
              selectedRoomId={activeRoomId}
              onSelectRoom={setActiveRoomId}
              onSimulatePreset={handleSimulatePreset}
              onOpenPsi={handleOpenPsi}
            />
          ) : tab === 'scanner' ? (
            <Scanner />
          ) : tab === 'guardian' ? (
            <GuardianView />
          ) : tab === 'lab' ? (
            <>
              <div className="section-intro lab-intro">
                <div>
                  <div className="eyebrow"><span /> VIRTUAL COMBUSTION LAB</div>
                  <h1>Gravity changes everything.</h1>
                  <p>One flame. Different worlds. Explore what happens in between.</p>
                </div>
                <div className="intro-actions">
                  <button className="secondary" onClick={() => exportCSV()} disabled={!points.length}>
                    <Download size={14} /> Export data
                  </button>
                  <button
                    className="primary"
                    onClick={() => { setRunTitle(`${preset?.name || 'Custom gravity'} · ${FUELS[settings.fuel].name}`); setSaveOpen(true); }}
                    disabled={!points.length}
                  >
                    <Save size={14} /> Save experiment
                  </button>
                </div>
              </div>

              <div className="preset-strip">
                <div className="preset-label"><Orbit size={16} /><span>CHOOSE YOUR WORLD</span></div>
                <div className="presets">
                  {PRESETS.map((p, i) => {
                    const Icon = [Earth, Moon, Orbit, Zap][i];
                    return (
                      <button
                        key={p.name}
                        className={settings.gravity === p.gravity ? 'selected' : ''}
                        onClick={() => change('gravity', p.gravity)}
                      >
                        <Icon size={16} />
                        <span>
                          <b>{p.name}</b>
                          <small>{p.label}</small>
                        </span>
                        {settings.gravity === p.gravity && <Check size={14} className="preset-check" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="lab-grid">
                <div className="simulation-column">
                  <section className="panel viewport">
                    <div className="viewport-heading">
                      <div>
                        <div className="eyebrow">SIMULATION CHAMBER</div>
                        <h2>{preset?.name || 'Custom gravity'} <span>/ {FUELS[settings.fuel].formula}</span></h2>
                      </div>
                      <span className={`status-pill ${running ? 'green' : ''}`}>
                        <i />{running ? 'RUNNING' : 'PAUSED'}
                      </span>
                    </div>
                    <div className="viewport-context">
                      <span>{regime(settings.gravity)}</span>
                      <span className="mono">g = {(settings.gravity * 9.80665).toFixed(settings.gravity < 0.001 ? 5 : 2)} m/s²</span>
                      <button
                        className="nasa-psi-pill-btn"
                        onClick={() => setTab('psi')}
                        title="Calibrated against NASA Physical Science Informatics (PSI) flight benchmark. Click to explore."
                      >
                        <Database size={11} />
                        <span>PSI: {matchNasaDataset(settings).mission.split('(')[0].trim()}</span>
                        <ArrowRight size={11} />
                      </button>
                    </div>
                    <div className="canvas-wrap">
                      <FlameView state={sim} settings={settings} layer={layer} flow={showFlow} />
                      <div className="canvas-tag">
                        {layer === 'flame' ? 'SCHEMATIC FLAME' : layer === 'temperature' ? 'ILLUSTRATIVE TEMPERATURE FIELD' : `RELATIVE ${layer.toUpperCase()} CONCENTRATION`}
                      </div>
                      {layer !== 'flame' && (
                        <div className={'color-scale ' + layer}>
                          <span>LOW</span><i /><span>HIGH</span>
                        </div>
                      )}
                      <button
                        className={'flow-toggle ' + (showFlow ? 'enabled' : '')}
                        aria-pressed={showFlow}
                        onClick={() => setShowFlow(!showFlow)}
                        title="Toggle schematic transport arrows"
                      >
                        <Wind size={14} />
                        <span>Transport</span>
                      </button>
                    </div>

                    <div className="view-layers" role="group" aria-label="Visualization layer">
                      {(['flame', 'temperature', 'oxygen', 'fuel'] as Layer[]).map(l => (
                        <button
                          key={l}
                          aria-pressed={layer === l}
                          className={layer === l ? 'active' : ''}
                          onClick={() => setLayer(l)}
                        >
                          {l === 'flame' ? <Flame size={13} /> : l === 'temperature' ? <Thermometer size={13} /> : <Layers size={13} />}
                          {' '}{l === 'oxygen' ? 'Oxygen' : l.charAt(0).toUpperCase() + l.slice(1)}
                        </button>
                      ))}
                    </div>

                    <div className="playback">
                      <div>
                        <button
                          className="play-button"
                          aria-label={running ? 'Pause simulation' : 'Resume simulation'}
                          disabled={!running && sim.time >= 300}
                          onClick={() => setRunning(!running)}
                        >
                          {running ? <Pause size={15} /> : <Play size={15} />}
                        </button>
                        <button className="icon-button" aria-label="Reset and ignite" title="Reset and ignite" onClick={() => reset()}>
                          <RotateCcw size={15} />
                        </button>
                        {!sim.burning && (
                          <button
                            className="primary"
                            style={{ padding: '3px 10px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 5, height: 28 }}
                            onClick={reignite}
                            title="Reignite flame under current conditions"
                          >
                            <Flame size={12} />
                            <span>Reignite</span>
                          </button>
                        )}
                        <span className="mono timer">{sim.time.toFixed(1)} <small>/ 300 s</small></span>
                      </div>
                      <div className="playback-track">
                        <span style={{ width: `${sim.time / 3}%` }} />
                      </div>
                      <span className="speed-label">1× SIM TIME</span>
                    </div>
                  </section>

                  <div className="metrics">
                    <div className="metric">
                      <div><Thermometer size={14} /><span>Gas temperature</span></div>
                      <strong>{Math.round(sim.temperature).toLocaleString()}<small>K</small></strong>
                      <span className="metric-caption">Lumped model estimate</span>
                      <div className="mini-line amber-line" />
                    </div>
                    <div className="metric">
                      <div><Flame size={14} /><span>Flame size</span></div>
                      <strong>{sim.size.toFixed(1)}<small>mm</small></strong>
                      <span className="metric-caption">Illustrative geometry</span>
                      <div className="mini-line purple-line" />
                    </div>
                    <div className="metric">
                      <div><Waves size={14} /><span>Heat loss</span></div>
                      <strong>{sim.loss.toFixed(1)}<small>W</small></strong>
                      <span className="metric-caption">Radiation + transfer</span>
                      <div className="mini-line blue-line" />
                    </div>
                    <div className="metric">
                      <div><Activity size={14} /><span>Burn state</span></div>
                      <strong className={'state-value ' + sim.status}>
                        <i />{sim.status === 'stable' ? 'Sustained' : sim.status === 'weak' ? 'Weak' : 'Extinguished'}
                      </strong>
                      <span className="metric-caption">Heuristic classification</span>
                      <div className="mini-line green-line" />
                    </div>
                  </div>

                  <section className="panel response-panel">
                    <div className="panel-heading">
                      <div>
                        <h2>Watch the response</h2>
                        <small className="muted">Calculated values over simulation time</small>
                      </div>
                      <div className="small-tabs">
                        {(['temperature', 'energy', 'species'] as const).map(c => (
                          <button key={c} className={chart === c ? 'active' : ''} onClick={() => setChart(c)}>
                            {c.charAt(0).toUpperCase() + c.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Plot height={155} series={chartSeries} labels unit={chart === 'temperature' ? 'K' : chart === 'energy' ? 'W' : 'mg'} />
                  </section>
                </div>

                <aside className="control-column">
                  <section className="panel conditions">
                    <div className="panel-heading">
                      <h2>Experiment conditions</h2>
                      <SlidersHorizontal size={16} />
                    </div>
                    <Range
                      label="Gravity"
                      value={settings.gravity}
                      min={0}
                      max={2}
                      step={0.001}
                      display={settings.gravity < 0.001 ? settings.gravity.toExponential(0) : settings.gravity.toFixed(3)}
                      unit="g"
                      onChange={v => change('gravity', v)}
                    />
                    <div className="control-divider" />
                    <label className="field-label" htmlFor="fuel-type">Fuel type</label>
                    <select id="fuel-type" value={settings.fuel} onChange={e => change('fuel', e.target.value as Fuel)}>
                      {Object.entries(FUELS).map(([id, f]) => (
                        <option key={id} value={id}>{f.name} ({f.formula})</option>
                      ))}
                    </select>
                    <Range label="Fuel supply" value={settings.flow} min={0.2} max={2} step={0.05} display={settings.flow.toFixed(2)} unit="mg/s" onChange={v => change('flow', v)} />
                    <Range label="Oxygen concentration" value={settings.oxygen} min={0} max={30} step={0.1} display={settings.oxygen.toFixed(1)} unit="%" onChange={v => change('oxygen', v)} />
                    <Range label="Ambient temperature" value={settings.ambient} min={0} max={100} step={1} display={settings.ambient.toFixed(0)} unit="°C" onChange={v => change('ambient', v)} />
                    <div className="input-note">
                      <CircleHelp size={14} />
                      <p>Gravity presets retain the same atmosphere. Changes take effect during the run.</p>
                    </div>
                    <button className="quiet reset-defaults" onClick={() => reset({ ...DEFAULTS })}>
                      <RotateCcw size={13} /> Reset to Earth defaults
                    </button>
                  </section>

                  <section className="panel suppression">
                    <div className="panel-heading">
                      <h2>Can we put it out?</h2>
                      <Snowflake size={16} />
                    </div>
                    <p>Test an intervention and watch the energy balance respond.</p>
                    <button className={action === 'cutoff' ? 'suppression-action chosen' : 'suppression-action'} onClick={() => suppress('cutoff')}>
                      <Flame size={15} />
                      <span>Cut fuel supply</span>
                      <ChevronRight size={13} />
                    </button>
                    <button className={action === 'dilution' ? 'suppression-action chosen' : 'suppression-action'} onClick={() => suppress('dilution')}>
                      <Wind size={15} />
                      <span>Dilute oxygen</span>
                      <ChevronRight size={13} />
                    </button>
                    <button className={action === 'cooling' ? 'suppression-action chosen' : 'suppression-action'} onClick={() => suppress('cooling')}>
                      <Snowflake size={15} />
                      <span>Increase cooling</span>
                      <ChevronRight size={13} />
                    </button>
                    {action !== 'none' && (
                      <div className="active-intervention">
                        <span>{actionNames[action]}</span>
                        <button onClick={() => suppress('none')} aria-label="Remove intervention"><X size={13} /></button>
                      </div>
                    )}
                    <small className="muted">Simulation only · no physical actuation</small>
                  </section>
                </aside>
              </div>

              <div className="bottom-note">
                <Beaker size={15} />
                <p>Explore the physics, question the numbers. This is an unvalidated educational model.</p>
                <button onClick={() => setTab('method')}>View assumptions <ArrowRight size={13} /></button>
              </div>

              <details className="event-log">
                <summary>Experiment timeline <span>{events.length} events</span></summary>
                {events.slice().reverse().map((e, i) => (
                  <div key={i}>
                    <span className="mono">{e.time.toFixed(1)}s</span>
                    <span>{e.text}</span>
                  </div>
                ))}
              </details>
            </>
          ) : tab === 'psi' ? (
            <PsiExplorer
              onLoadSimulation={(newSettings, presetName) => {
                reset(newSettings);
                setTab('lab');
                if (presetName) notify(`Loaded ${presetName} into Combustion Lab.`);
                setRunning(true);
              }}
              onNavigateToTab={t => setTab(t as Tab)}
            />
          ) : tab === 'method' ? (
            <Method />
          ) : (
            <>
              <div className="section-intro">
                <div>
                  <div className="eyebrow">YOUR RESEARCH NOTEBOOK</div>
                  <h1>Every run tells a story.</h1>
                  <p>Revisit saved experiments and compare their responses.</p>
                </div>
                <button className="primary" onClick={() => { reset(); setTab('lab'); }}>
                  <Beaker size={15} /> New experiment
                </button>
              </div>

              <div className="experiments-heading">
                <span>{runs.length} saved experiments · stored on this computer</span>
                <button className="quiet" onClick={loadRuns}><RotateCcw size={13} /> Refresh</button>
              </div>

              {loading ? (
                <div className="empty-state">Loading your experiments…</div>
              ) : loadError ? (
                <div className="empty-state">
                  <Database size={24} />
                  <h2>Couldn’t load your experiments</h2>
                  <p>{loadError}</p>
                  <button className="secondary" onClick={loadRuns}>Retry</button>
                </div>
              ) : !runs.length ? (
                <div className="empty-state">
                  <FolderOpen size={36} />
                  <h2>Your next discovery starts here.</h2>
                  <p>Run the laboratory, then save an experiment to build your notebook.</p>
                  <button className="primary" onClick={() => setTab('lab')}>
                    Open laboratory <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                <div className="run-grid">
                  {runs.map(run => (
                    <article className={'panel run-card ' + (selected.includes(run.id) ? 'selected' : '')} key={run.id}>
                      <div className="panel-heading">
                        <div className="run-icon"><Orbit size={18} /></div>
                        <label className="compare-check">
                          <input
                            type="checkbox"
                            checked={selected.includes(run.id)}
                            disabled={!selected.includes(run.id) && selected.length >= 2}
                            onChange={() => setSelected(old => old.includes(run.id) ? old.filter(id => id !== run.id) : [...old, run.id].slice(-2))}
                          />
                          Compare
                        </label>
                      </div>
                      <h2>{run.title}</h2>
                      <p>{new Date(run.createdAt).toLocaleString()}</p>
                      <div className="run-tags">
                        <span>{gravityLabel(run.payload.settings.gravity)}</span>
                        <span>{FUELS[run.payload.settings.fuel].name}</span>
                        <span>{run.payload.points.at(-1)?.time.toFixed(0)}s</span>
                      </div>
                      <Plot height={90} unit="K" series={[{ name: run.title, color: '#00e5a3', values: run.payload.points.map(p => ({ x: p.time, y: p.temperature })) }]} />
                      <div className="run-actions">
                        <button className="text-button" onClick={() => setViewRun(run)}>
                          View experiment <ArrowRight size={13} />
                        </button>
                        <button className="icon-button" onClick={() => remove(run)} aria-label={`Delete ${run.title}`}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {comparison.length > 0 && (
                <section className="panel comparison">
                  <div className="panel-heading">
                    <h2><GitCompareArrows size={17} /> Compare experiments</h2>
                    <button className="quiet" onClick={() => setSelected([])}>Clear selection</button>
                  </div>
                  {comparison.length === 1 ? (
                    <p>Select one more experiment to compare.</p>
                  ) : (
                    <>
                      <Plot
                        height={220}
                        unit="K"
                        labels
                        series={comparison.map((r, i) => ({
                          name: r.title,
                          color: i ? '#a855f7' : '#00e5a3',
                          values: r.payload.points.map(p => ({ x: p.time, y: p.temperature }))
                        }))}
                      />
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Final model value</th>
                              {comparison.map(r => <th key={r.id}>{r.title}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { label: 'Gas temperature', key: 'temperature', unit: 'K' },
                              { label: 'Heat loss', key: 'loss', unit: 'W' },
                              { label: 'Illustrative flame size', key: 'size', unit: 'mm' }
                            ].map(row => (
                              <tr key={row.key}>
                                <td>{row.label}</td>
                                {comparison.map(r => (
                                  <td key={r.id}>
                                    {(r.payload.points.at(-1)?.[row.key as keyof Point] || 0).toFixed(1)} {row.unit}
                                  </td>
                                ))}
                              </tr>
                            ))}
                            <tr>
                              <td>Intervention</td>
                              {comparison.map(r => <td key={r.id}>{actionNames[r.payload.intervention]}</td>)}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="muted">Conditions may change during each run. Inspect the saved timeline before attributing a difference to gravity alone.</p>
                    </>
                  )}
                </section>
              )}
            </>
          )}
        </main>

        {/* Mobile Bottom Navigation Bar (Screens <= 900px) */}
        <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
          {/* Primary 4 tabs */}
          {allNav.slice(0, 4).map(n => {
            const Icon = n.icon;
            const isActive = tab === n.id;
            return (
              <button
                key={n.id}
                onClick={() => {
                  setTab(n.id);
                  setMoreNavOpen(false);
                  if (n.id === 'lab' && sim.time === 0) setRunning(true);
                }}
                className={'mobile-bottom-tab ' + (isActive ? 'active' : '')}
                aria-current={isActive ? 'page' : undefined}
                title={n.label}
              >
                <div className="mobile-tab-icon-wrap">
                  <Icon size={19} />
                  {n.id === 'guard' && hasUrgent && <span className="nav-dot" />}
                </div>
                <span className="mobile-tab-label">{n.shortLabel}</span>
              </button>
            );
          })}

          {/* Secondary 2 tabs on tablet screens (641px - 900px) */}
          {allNav.slice(4).map(n => {
            const Icon = n.icon;
            const isActive = tab === n.id;
            return (
              <button
                key={n.id}
                onClick={() => {
                  setTab(n.id);
                  setMoreNavOpen(false);
                }}
                className={'mobile-bottom-tab tablet-nav-tab ' + (isActive ? 'active' : '')}
                aria-current={isActive ? 'page' : undefined}
                title={n.label}
              >
                <div className="mobile-tab-icon-wrap">
                  <Icon size={19} />
                  {n.id === 'guard' && hasUrgent && <span className="nav-dot" />}
                </div>
                <span className="mobile-tab-label">{n.shortLabel}</span>
              </button>
            );
          })}

          {/* More drawer toggle button for phone screens (<= 640px) */}
          <button
            onClick={() => setMoreNavOpen(prev => !prev)}
            className={
              'mobile-bottom-tab phone-more-tab ' +
              (moreNavOpen || tab === 'psi' || tab === 'experiments' || tab === 'method' ? 'active' : '')
            }
            aria-expanded={moreNavOpen}
            aria-label="More navigation tabs"
            title="More navigation options"
          >
            <div className="mobile-tab-icon-wrap">
              {moreNavOpen ? <X size={19} /> : <Menu size={19} />}
              {(tab === 'psi' || tab === 'experiments' || tab === 'method') && <span className="nav-dot" />}
            </div>
            <span className="mobile-tab-label">
              {tab === 'psi' ? 'PSI Data' : tab === 'experiments' ? 'Saved' : tab === 'method' ? 'Method' : 'More'}
            </span>
          </button>
        </nav>

        {/* Mobile More Navigation Drawer (Screens <= 640px) */}
        {moreNavOpen && (
          <div
            className="mobile-more-overlay"
            onClick={() => setMoreNavOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Additional Navigation"
          >
            <div className="mobile-more-drawer" onClick={e => e.stopPropagation()}>
              <div className="modal-drag-handle" />
              <div className="mobile-more-header">
                <div className="mobile-more-title">
                  <Menu size={16} />
                  <b>More Sections & Tools</b>
                </div>
                <button
                  className="mobile-more-close"
                  onClick={() => setMoreNavOpen(false)}
                  aria-label="Close drawer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mobile-more-list">
                <button
                  className={'mobile-more-item ' + (tab === 'psi' ? 'active' : '')}
                  onClick={() => {
                    setTab('psi');
                    setMoreNavOpen(false);
                  }}
                >
                  <div className="more-item-icon">
                    <Database size={20} />
                  </div>
                  <div className="more-item-text">
                    <b>NASA PSI Explorer & Flight Data</b>
                    <small>Microgravity experiments, flammability limits & spinoffs</small>
                  </div>
                  <ChevronRight size={16} className="more-item-arrow" />
                </button>

                <button
                  className={'mobile-more-item ' + (tab === 'experiments' ? 'active' : '')}
                  onClick={() => {
                    setTab('experiments');
                    setMoreNavOpen(false);
                  }}
                >
                  <div className="more-item-icon">
                    <FolderOpen size={20} />
                  </div>
                  <div className="more-item-text">
                    <b>Saved Runs & Comparisons</b>
                    <small>Curves, traces and local experiment notebook</small>
                  </div>
                  <ChevronRight size={16} className="more-item-arrow" />
                </button>

                <button
                  className={'mobile-more-item ' + (tab === 'method' ? 'active' : '')}
                  onClick={() => {
                    setTab('method');
                    setMoreNavOpen(false);
                  }}
                >
                  <div className="more-item-icon">
                    <BookOpen size={20} />
                  </div>
                  <div className="more-item-text">
                    <b>Model Science & Assumptions</b>
                    <small>Physics equations, energy balance & calibration</small>
                  </div>
                  <ChevronRight size={16} className="more-item-arrow" />
                </button>

                <a
                  href="#"
                  className="mobile-more-item"
                  onClick={() => setMoreNavOpen(false)}
                >
                  <div className="more-item-icon">
                    <Flame size={20} />
                  </div>
                  <div className="more-item-text">
                    <b>Ember Landing Page</b>
                    <small>System overview, capabilities & documentation</small>
                  </div>
                  <ChevronRight size={16} className="more-item-arrow" />
                </a>
              </div>

              <div className="mobile-more-footer">
                <div className="mobile-more-modes">
                  <span className="more-modes-label">QUICK SWITCH:</span>
                  <div className="more-modes-buttons">
                    <button
                      className={'more-mode-btn ' + (!isScience ? 'active' : '')}
                      onClick={() => {
                        setTab('guard');
                        setMoreNavOpen(false);
                      }}
                    >
                      <Shield size={13} />
                      <span>Home Safety</span>
                    </button>
                    <button
                      className={'more-mode-btn ' + (isScience ? 'active' : '')}
                      onClick={() => {
                        setTab('lab');
                        setMoreNavOpen(false);
                        if (sim.time === 0) setRunning(true);
                      }}
                    >
                      <Beaker size={13} />
                      <span>Combustion Lab</span>
                    </button>
                  </div>
                </div>

                <div className="mobile-more-account-row">
                  <button
                    className="mobile-more-action-btn"
                    onClick={() => {
                      toggleTheme();
                    }}
                    title="Toggle light and dark color theme"
                  >
                    {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                    <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
                  </button>

                  {user && (
                    <button
                      className="mobile-more-action-btn danger"
                      onClick={() => {
                        setMoreNavOpen(false);
                        void logout();
                      }}
                      title="Sign out of local account"
                    >
                      <span>Sign Out ({userInitials})</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {saveOpen && (
        <Dialog label="Save experiment" onClose={() => setSaveOpen(false)}>
          <div className="modal-symbol"><Save size={22} /></div>
          <h2>Save this discovery.</h2>
          <p>Keep the conditions, calculated traces and timeline in your local notebook.</p>
          <form onSubmit={e => { e.preventDefault(); void save(); }}>
            <label className="field-label" htmlFor="run-title">Experiment name</label>
            <input
              autoFocus
              id="run-title"
              value={runTitle}
              maxLength={80}
              required
              onChange={e => setRunTitle(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--text)', marginBottom: '14px' }}
            />
            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setSaveOpen(false)}>Cancel</button>
              <button className="primary" disabled={saving || !runTitle.trim()}>
                {saving ? 'Saving…' : 'Save experiment'}
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
