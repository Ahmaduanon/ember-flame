import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Atom,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Compass,
  Cpu,
  Database,
  ExternalLink,
  Eye,
  Flame,
  Gauge,
  Globe,
  Info,
  Layers,
  Lock,
  Menu,
  Orbit,
  Play,
  RotateCcw,
  ScanSearch,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Scan,
  X,
  Zap
} from 'lucide-react';

export default function Landing() {
  const [pub, setPub] = useState(false);
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [heroTab, setHeroTab] = useState<'vision' | 'chamber' | 'map' | 'guardian' | 'psi'>('vision');
  const [isHeroPaused, setIsHeroPaused] = useState(false);
  const [heroGravity, setHeroGravity] = useState<number>(0);
  const [isScanning, setIsScanning] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.style.colorScheme = 'dark';
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(j => setPub(j.mode === 'public'))
      .catch(() => {});
    fetch('/api/auth/me')
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (j?.user) setUser(j.user);
      })
      .catch(() => {});
  }, []);

  // Auto-cycle through the 5 hero preview sections automatically (pauses on user hover)
  useEffect(() => {
    if (isHeroPaused) return;
    const tabs: Array<'vision' | 'map' | 'guardian' | 'chamber' | 'psi'> = [
      'vision',
      'map',
      'guardian',
      'chamber',
      'psi'
    ];
    const timer = setInterval(() => {
      setHeroTab(prev => {
        const idx = tabs.indexOf(prev);
        const nextIdx = (idx + 1) % tabs.length;
        return tabs[nextIdx];
      });
    }, 4500);
    return () => clearInterval(timer);
  }, [isHeroPaused, heroTab]);

  // Scroll Reveal Animations for sections and cards (animates both scrolling down & up)
  useEffect(() => {
    const targets = document.querySelectorAll('.lp-reveal, .lp-feature-card, .lp-stage-card, .lp-stat-item, .lp-console-hero, .lp-console-module, .lp-matrix-row, .lp-orbital-cell, .lp-pipeline-step');
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    targets.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="lp">
      {/* Background Ambient Glow Lights */}
      <div className="lp-ambient-glow lp-glow-1" />
      <div className="lp-ambient-glow lp-glow-2" />

      {/* Sticky High-Performance Glassmorphic Header */}
      <div className={`lp-header-wrap ${isScrolled ? 'is-scrolled' : ''}`}>
        <header className="lp-top">
          <a className="lp-brand" href="#">
            <span className="lp-brand-flame-icon">
              <Flame size={24} />
            </span>
            <b className="lp-brand-name">ember</b>
          </a>

          <nav className="lp-nav-center">
            <a className="lp-navlink" href="#psi-preview">NASA PSI Data</a>
            <a className="lp-navlink" href="#inspection">Visual AI</a>
            <a className="lp-navlink" href="#scanner-preview">2D Hazard Map</a>
            <a className="lp-navlink" href="#guardian-preview">Guardian Device</a>
            <a className="lp-navlink" href="#lab-preview">Combustion Lab</a>
            <a className="lp-navlink" href="#workflow">How It Works</a>
          </nav>

          <div className="lp-nav-actions">
            {user ? (
              <a className="lp-btn lp-btn-sm lp-desktop-only" href="#app">
                Open Lab ({user.name}) <ArrowRight size={14} />
              </a>
            ) : (
              <>
                <a href="#login" className="lp-signin-btn lp-desktop-only">
                  Sign in
                </a>
                <a className="lp-btn lp-btn-sm lp-desktop-only" href="#app">
                  Launch Ember Lab <ArrowRight size={14} />
                </a>
              </>
            )}

            <button
              className="lp-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </header>
      </div>

      {/* Mobile Drawer Navigation Overlay */}
      {mobileMenuOpen && (
        <div
          className="lp-mobile-menu-overlay"
          onClick={() => setMobileMenuOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
        >
          <div className="lp-mobile-drawer" onClick={e => e.stopPropagation()}>
            <div className="lp-mobile-drawer-header">
              <a className="lp-brand" href="#" onClick={() => setMobileMenuOpen(false)}>
                <span className="lp-brand-flame-icon">
                  <Flame size={22} />
                </span>
                <b className="lp-brand-name">ember</b>
              </a>
              <button
                className="lp-mobile-close-btn"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="lp-mobile-nav-links">
              <a className="lp-mobile-navlink" href="#psi-preview" onClick={() => setMobileMenuOpen(false)}>
                <Database size={18} />
                <div>
                  <b>NASA PSI Data</b>
                  <small>Flight investigations & flammability</small>
                </div>
                <ChevronRight size={16} className="lp-mobile-arrow" />
              </a>
              <a className="lp-mobile-navlink" href="#inspection" onClick={() => setMobileMenuOpen(false)}>
                <Camera size={18} />
                <div>
                  <b>Visual AI</b>
                  <small>Multimodal room screening</small>
                </div>
                <ChevronRight size={16} className="lp-mobile-arrow" />
              </a>
              <a className="lp-mobile-navlink" href="#scanner-preview" onClick={() => setMobileMenuOpen(false)}>
                <Layers size={18} />
                <div>
                  <b>2D Hazard Map</b>
                  <small>Spatial clearances & proximity</small>
                </div>
                <ChevronRight size={16} className="lp-mobile-arrow" />
              </a>
              <a className="lp-mobile-navlink" href="#guardian-preview" onClick={() => setMobileMenuOpen(false)}>
                <Cpu size={18} />
                <div>
                  <b>Guardian Device</b>
                  <small>3D hardware node specifications</small>
                </div>
                <ChevronRight size={16} className="lp-mobile-arrow" />
              </a>
              <a className="lp-mobile-navlink" href="#lab-preview" onClick={() => setMobileMenuOpen(false)}>
                <Flame size={18} />
                <div>
                  <b>Combustion Lab</b>
                  <small>Microgravity flame physics</small>
                </div>
                <ChevronRight size={16} className="lp-mobile-arrow" />
              </a>
              <a className="lp-mobile-navlink" href="#workflow" onClick={() => setMobileMenuOpen(false)}>
                <Compass size={18} />
                <div>
                  <b>How It Works</b>
                  <small>Architecture & deployment pipeline</small>
                </div>
                <ChevronRight size={16} className="lp-mobile-arrow" />
              </a>
            </nav>

            <div className="lp-mobile-actions">
              {user ? (
                <a className="lp-btn lp-btn-glow lp-mobile-btn" href="#app" onClick={() => setMobileMenuOpen(false)}>
                  Open Lab ({user.name}) <ArrowRight size={15} />
                </a>
              ) : (
                <>
                  <a className="lp-btn lp-btn-glow lp-mobile-btn" href="#app" onClick={() => setMobileMenuOpen(false)}>
                    Launch Ember Lab <ArrowRight size={15} />
                  </a>
                  <div className="lp-mobile-auth-row">
                    <a className="lp-btn alt lp-mobile-auth-btn" href="#login" onClick={() => setMobileMenuOpen(false)}>
                      Sign In
                    </a>
                    <a className="lp-btn alt lp-mobile-auth-btn" href="#signup" onClick={() => setMobileMenuOpen(false)}>
                      Create Account
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero Section with Cinematic Atmospheric Image Background */}
      <section className="lp-hero-section">
        <div className="lp-hero">
          <div className="lp-hero-text">
            <div className="lp-badge">
              <span className="lp-badge-dot" />
              <span className="lp-badge-text">NASA Space Apps & Microgravity Research · Spaceflight Fire Safety Intelligence</span>
            </div>

            <h1>
              Spot habitat fire hazards <span className="text-gradient-flame">before ignition.</span><br />
              Master flame physics <span className="text-gradient-mint">without gravity.</span>
            </h1>

            <p className="lp-lead">
              Ember unifies autonomous visual hazard screening for pressurized spacecraft cabins and lunar outposts,
              2D habitat spatial clearance architecture, the Ember Guardian microgravity IoT sensor node, and an interactive
              orbital combustion simulator — backed by a persistent cloud-ready flight database.
            </p>

            <div className="lp-cta">
              <a className="lp-btn lp-btn-glow" href="#app">
                {user ? 'Open Flight Deck' : 'Launch Ember Lab'} <ArrowRight size={16} />
              </a>
              <a className="lp-btn alt" href="#app?tab=scanner">
                <Layers size={15} /> 2D Clearance Map
              </a>
              {!user && (
                <a className="lp-btn alt" href="#signup">
                  Create Account
                </a>
              )}
            </div>

            <div className="lp-trust-note">
              <Lock size={13} style={{ color: 'var(--mint)' }} />
              <span>Cloud & Edge Telemetry Synchronization · Mission Autonomous · NASA Flight Benchmark Calibrated</span>
            </div>
          </div>

          {/* Hero Interactive 4-Pillar Product Preview */}
          <div
            className="hero-preview-card"
            role="region"
            aria-label="Ember Interactive Product Preview"
            onMouseEnter={() => setIsHeroPaused(true)}
            onMouseLeave={() => setIsHeroPaused(false)}
            onTouchStart={() => setIsHeroPaused(true)}
          >
            <div className="hero-card-header">
              <div className="hero-dots">
                <span className="hero-dot" style={{ background: '#ef4444' }} />
                <span className="hero-dot" style={{ background: '#f59e0b' }} />
                <span className="hero-dot" style={{ background: '#10b981' }} />
              </div>

              {/* Interactive Module Tabs */}
              <div className="hero-tabs">
                <button
                  className={`hero-tab-btn ${heroTab === 'vision' ? 'active' : ''}`}
                  onClick={() => setHeroTab('vision')}
                  title="Multimodal Visual Inspection"
                >
                  <Camera size={13} />
                  <span>AI Vision</span>
                </button>
                <button
                  className={`hero-tab-btn ${heroTab === 'map' ? 'active' : ''}`}
                  onClick={() => setHeroTab('map')}
                  title="2D Spatial Hazard Map"
                >
                  <Layers size={13} />
                  <span>2D Hazard Map</span>
                </button>
                <button
                  className={`hero-tab-btn ${heroTab === 'guardian' ? 'active' : ''}`}
                  onClick={() => setHeroTab('guardian')}
                  title="Ember Guardian 3D Hardware Node"
                >
                  <Cpu size={13} />
                  <span>Guardian 3D</span>
                </button>
                <button
                  className={`hero-tab-btn ${heroTab === 'chamber' ? 'active' : ''}`}
                  onClick={() => setHeroTab('chamber')}
                  title="Microgravity Flame Chamber"
                >
                  <Flame size={13} />
                  <span>Zero-G Chamber</span>
                </button>
                <button
                  className={`hero-tab-btn ${heroTab === 'psi' ? 'active' : ''}`}
                  onClick={() => setHeroTab('psi')}
                  title="NASA Physical Science Informatics & Flight Benchmarks"
                >
                  <Database size={13} />
                  <span>NASA PSI</span>
                </button>
              </div>

              <span className="hero-tag ok">Live Engine</span>
            </div>

            <div className="hero-preview-body">
              {/* VIEW 1: AI Visual Inspection Simulator */}
              {heroTab === 'vision' && (
                <div className="hero-tab-content">
                  <div className="hero-scan-canvas">
                    {/* Scanning Laser Beam */}
                    {isScanning && <div className="hero-scan-laser" />}

                    {/* SVG Spacecraft Cabin Viewport */}
                    <svg viewBox="0 0 460 220" className="hero-room-svg" role="img" aria-label="Pressurized Spacecraft Module Inspection Viewport">
                      <defs>
                        <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0f172a" />
                          <stop offset="100%" stopColor="#1e293b" />
                        </linearGradient>
                        <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1e293b" />
                          <stop offset="100%" stopColor="#090d16" />
                        </linearGradient>
                      </defs>

                      {/* Cylindrical Bulkhead Shell & Ribs */}
                      <rect x="0" y="0" width="460" height="150" fill="url(#wallGrad)" />
                      <polygon points="0,150 460,150 460,220 0,220" fill="url(#floorGrad)" />
                      <line x1="0" y1="150" x2="460" y2="150" stroke="#334155" strokeWidth="1.5" />
                      {/* Bulkhead Structural Ribs */}
                      <line x1="80" y1="0" x2="80" y2="150" stroke="#334155" strokeWidth="1" strokeDasharray="4 2" />
                      <line x1="220" y1="0" x2="220" y2="150" stroke="#334155" strokeWidth="1" strokeDasharray="4 2" />
                      <line x1="360" y1="0" x2="360" y2="150" stroke="#334155" strokeWidth="1" strokeDasharray="4 2" />

                      {/* Emergency Scuttle Airlock Hatch */}
                      <rect x="42" y="16" width="94" height="106" rx="14" fill="#0b1119" stroke="#475569" strokeWidth="2" />
                      <circle cx="89" cy="69" r="24" fill="#0284c7" opacity="0.25" stroke="#38bdf8" strokeWidth="1.5" />
                      <line x1="89" y1="35" x2="89" y2="103" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
                      <text x="89" y="73" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#38bdf8" fontFamily="ui-monospace, monospace">SCUTTLE HATCH</text>

                      {/* Flammable MLI Thermal Insulation Blanket along bulkhead */}
                      <path d="M 40 22 Q 48 80 44 150 L 68 150 Q 60 80 64 22 Z" fill="#f59e0b" opacity="0.75" stroke="#d97706" strokeWidth="1" />
                      <path d="M 140 22 Q 132 80 138 150 L 116 150 Q 124 80 120 22 Z" fill="#f59e0b" opacity="0.75" stroke="#d97706" strokeWidth="1" />

                      {/* Auxiliary ECLSS Heat Exchanger Unit (Violating MLI clearance) */}
                      <rect x="76" y="128" width="42" height="46" rx="4" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
                      <line x1="82" y1="138" x2="112" y2="138" stroke="#ef4444" strokeWidth="2" />
                      <line x1="82" y1="146" x2="112" y2="146" stroke="#ef4444" strokeWidth="2" />
                      <line x1="82" y1="154" x2="112" y2="154" stroke="#ef4444" strokeWidth="2" />
                      <circle cx="97" cy="165" r="2.5" fill="#f97316" />

                      {/* Proximity Distance Indicator Line */}
                      <line x1="65" y1="150" x2="76" y2="150" stroke="var(--danger)" strokeWidth="2" strokeDasharray="3 2" />
                      <text x="70.5" y="144" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--danger)">0.28m</text>

                      {/* Bounding Box 1: Heat Exchanger Clearance Fault */}
                      <rect x="36" y="116" width="94" height="70" rx="6" fill="rgba(220, 38, 38, 0.10)" stroke="var(--danger)" strokeWidth="2" strokeDasharray="4 4" className="hero-bbox-pulse" />

                      {/* Science Payload Rack / Avionics Bay on Right */}
                      <rect x="245" y="24" width="170" height="135" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                      <rect x="255" y="34" width="150" height="24" rx="2" fill="#0f172a" stroke="#334155" />
                      <text x="262" y="49" fontSize="8" fontWeight="700" fill="#38bdf8" fontFamily="ui-monospace, monospace">AVIONICS BUS A · 120V DC</text>
                      <rect x="255" y="64" width="150" height="24" rx="2" fill="#0f172a" stroke="#334155" />
                      <text x="262" y="79" fontSize="8" fontWeight="700" fill="#6ee7b7" fontFamily="ui-monospace, monospace">ECLSS LOOP 2 · NOMINAL</text>

                      {/* Unanchored Umbilical Cables Daisy Chained */}
                      <path d="M 270 145 Q 295 195 325 185 T 375 180" fill="none" stroke="#f59e0b" strokeWidth="3" />
                      <rect x="315" y="176" width="46" height="14" rx="2" fill="#334155" stroke="#f59e0b" strokeWidth="1" />
                      <text x="338" y="186.5" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#fef08a" fontFamily="ui-monospace, monospace">UMBILICAL-2</text>
                      {/* Bounding Box 2: Umbilical Chaining */}
                      <rect x="265" y="160" width="125" height="42" rx="6" fill="rgba(180, 83, 9, 0.10)" stroke="var(--amber)" strokeWidth="2" strokeDasharray="4 4" />
                    </svg>

                    {/* Overlay Badges */}
                    <div className="hero-scan-overlay">
                      <div className="hero-alert-chip danger">
                        <ShieldAlert size={12} />
                        <span><b>Thermal Clearance:</b> 0.28m to MLI blanket (NASA-STD-6001: min 0.8m)</span>
                      </div>
                      <div className="hero-alert-chip warning">
                        <ScanSearch size={12} />
                        <span><b>Umbilical Hazard:</b> Daisy-chained jumper unanchored across cabin floor</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Bar */}
                  <div className="hero-scan-footer">
                    <div className="hero-ai-status">
                      <Scan size={14} className="text-mint" />
                      <span><b>AI Vision Model</b> · Pressurized Cabin Scan · 2 Critical Items</span>
                    </div>
                    <a href="#app?tab=guard" className="hero-rescan-btn" style={{ textDecoration: 'none' }}>
                      Inspect Cabin <ArrowRight size={11} />
                    </a>
                  </div>
                </div>
              )}

              {/* VIEW 2: 2D Spatial Hazard Map Preview */}
              {heroTab === 'map' && (
                <div className="hero-tab-content">
                  <div className="hero-map-viewport">
                    <svg viewBox="0 0 460 210" className="hero-floorplan-svg" role="img" aria-label="2D Spatial Hazard Clearance Simulation">
                      {/* Floor Area */}
                      <rect x="15" y="15" width="430" height="180" rx="6" fill="var(--card-bg)" stroke="var(--border-strong)" strokeWidth="2" />
                      {/* Grid Pattern */}
                      <line x1="15" y1="75" x2="445" y2="75" stroke="var(--border-subtle)" strokeDasharray="3 3" />
                      <line x1="15" y1="135" x2="445" y2="135" stroke="var(--border-subtle)" strokeDasharray="3 3" />
                      <line x1="155" y1="15" x2="155" y2="195" stroke="var(--border-subtle)" strokeDasharray="3 3" />
                      <line x1="305" y1="15" x2="305" y2="195" stroke="var(--border-subtle)" strokeDasharray="3 3" />

                      {/* Compartment Labels */}
                      <text x="30" y="36" fontSize="11" fontWeight="700" fill="var(--text-heading)">Port Avionics Bay (Zone A)</text>
                      <text x="310" y="36" fontSize="11" fontWeight="700" fill="var(--text-heading)">ECLSS Life Support Module</text>

                      {/* Auxiliary Heat Exchanger */}
                      <circle cx="110" cy="105" r="18" fill="var(--flame-dim)" stroke="var(--flame)" strokeWidth="2" />
                      <text x="110" y="109" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--flame)">HEAT EXCH</text>

                      {/* 0.8m Clearance Radius Halo (Dashed) */}
                      <circle cx="110" cy="105" r="54" fill="none" stroke="var(--flame)" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.7" className="hero-clearance-ring" />

                      {/* MLI Blanket Stowage */}
                      <rect x="52" y="138" width="56" height="14" rx="3" fill="var(--danger-dim)" stroke="var(--danger)" strokeWidth="1.5" />
                      <text x="80" y="149" textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--danger)">MLI BLANKET</text>

                      {/* Violation Connection Line */}
                      <line x1="100" y1="120" x2="88" y2="138" stroke="var(--danger)" strokeWidth="2" strokeDasharray="2 2" />
                      <circle cx="94" cy="129" r="3" fill="var(--danger)" />

                      {/* Violation Tag */}
                      <rect x="135" y="125" width="145" height="26" rx="4" fill="var(--danger-dim)" stroke="var(--danger)" strokeWidth="1" />
                      <text x="142" y="142" fontSize="9" fontWeight="700" fill="var(--danger)">
                        CLEARANCE CONFLICT (0.28m)
                      </text>

                      {/* Galley Rehydration & Water Mist Extinguisher */}
                      <rect x="365" y="65" width="52" height="42" rx="4" fill="var(--chip-bg)" stroke="var(--border-strong)" strokeWidth="1.5" />
                      <text x="391" y="89" textAnchor="middle" fontSize="8.5" fontWeight="600" fill="var(--text)">GALLEY</text>

                      <circle cx="340" cy="145" r="14" fill="var(--mint-dim)" stroke="var(--mint)" strokeWidth="1.5" />
                      <text x="340" y="149" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="var(--mint)">MIST EXT</text>

                      {/* Safe Corridor Zone */}
                      <path d="M 230 15 L 230 195" stroke="var(--mint)" strokeWidth="1" strokeDasharray="4 4" />
                      <text x="235" y="185" fontSize="8.5" fill="var(--muted)">Airlock Egress Clear</text>
                    </svg>
                  </div>

                  <div className="hero-scan-footer">
                    <div className="hero-ai-status">
                      <Layers size={14} style={{ color: 'var(--amber)' }} />
                      <span><b>Spatial Clearance Index: 78/100</b> · Relocate heat exchanger 0.52m forward to reach 100/100</span>
                    </div>
                    <a href="#app?tab=scanner" className="hero-rescan-btn" style={{ textDecoration: 'none' }}>
                      Open Planner <ArrowRight size={11} />
                    </a>
                  </div>
                </div>
              )}

              {/* VIEW 3: Ember Guardian Hardware Node Vector Preview */}
              {heroTab === 'guardian' && (
                <div className="hero-tab-content">
                  <div
                    className="hero-scan-canvas"
                    style={{
                      background: 'radial-gradient(circle at center, var(--card-bg) 0%, var(--panel) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}
                  >
                    <svg viewBox="0 0 460 215" className="hero-room-svg" role="img" aria-label="Ember Guardian Hardware Device 3D Preview">
                      <defs>
                        <filter id="chassisShadow" x="-10%" y="-10%" width="130%" height="130%">
                          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="rgba(15, 23, 42, 0.18)" />
                        </filter>
                        <radialGradient id="ledGlowGrad" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                        </radialGradient>
                      </defs>

                      {/* Outer Chassis Squircle (70x70mm 1:1 scale representation) */}
                      <rect x="145" y="14" width="170" height="170" rx="36" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2.5" filter="url(#chassisShadow)" />

                      {/* Left Ventilation Gills (7 Horizontal Slots) */}
                      {[-3, -2, -1, 0, 1, 2, 3].map(i => (
                        <rect key={'lv-' + i} x="141" y={99 + i * 11 - 3} width="7" height="6" rx="3" fill="#0f172a" />
                      ))}

                      {/* Right Ventilation Gills (7 Horizontal Slots) */}
                      {[-3, -2, -1, 0, 1, 2, 3].map(i => (
                        <rect key={'rv-' + i} x="312" y={99 + i * 11 - 3} width="7" height="6" rx="3" fill="#0f172a" />
                      ))}

                      {/* Top Status LED Beacon (Tri-color early warning beacon) */}
                      <circle cx="230" cy="28" r="14" fill="url(#ledGlowGrad)" />
                      <rect x="221" y="24" width="18" height="8" rx="4" fill="#22c55e" stroke="#16a34a" strokeWidth="1" />

                      {/* OLED Screen Bezel */}
                      <rect x="175" y="42" width="110" height="62" rx="7" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />

                      {/* OLED Display Active Pixels */}
                      <text x="183" y="55" fontSize="6.5" fontWeight="700" fill="#38bdf8" fontFamily="ui-monospace, monospace">EMBER GUARDIAN · N1</text>
                      <text x="183" y="77" fontSize="19" fontWeight="800" fill="#f8fafc" fontFamily="ui-monospace, monospace">26.8°C</text>
                      <rect x="183" y="86" width="94" height="11" rx="2" fill="#065f46" />
                      <text x="230" y="94.5" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#6ee7b7" fontFamily="ui-monospace, monospace">● STATUS: SAFE / NOMINAL</text>

                      {/* Speaker Array Grill on Front Bottom */}
                      <circle cx="230" cy="138" r="21" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
                      {/* Speaker Perforation Holes in concentric staggered matrix */}
                      {[-2, -1, 0, 1, 2].map(r => {
                        const counts = [5, 8, 9, 8, 5];
                        const count = counts[r + 2];
                        const y = 138 + r * 4.2;
                        const startX = 230 - ((count - 1) * 4.2) / 2;
                        return Array.from({ length: count }).map((_, c) => (
                          <circle key={`spk-${r}-${c}`} cx={startX + c * 4.2} cy={y} r="1.3" fill="#090d16" />
                        ));
                      })}

                      {/* Labeled Engineering Annotation Callout Badges */}
                      <line x1="175" y1="70" x2="68" y2="70" stroke="#94a3b8" strokeDasharray="3 2" />
                      <circle cx="68" cy="70" r="3" fill="#0284c7" />
                      <rect x="14" y="56" width="100" height="28" rx="6" fill="var(--panel)" stroke="var(--border)" />
                      <text x="64" y="69" textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--text-heading)">1.3" OLED DISPLAY</text>
                      <text x="64" y="79" textAnchor="middle" fontSize="7" fill="var(--muted)">Real-time °C + Alerts</text>

                      <line x1="285" y1="138" x2="365" y2="138" stroke="#94a3b8" strokeDasharray="3 2" />
                      <circle cx="365" cy="138" r="3" fill="#0284c7" />
                      <rect x="345" y="124" width="102" height="28" rx="6" fill="var(--panel)" stroke="var(--border)" />
                      <text x="396" y="137" textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--text-heading)">85dB SPEAKER</text>
                      <text x="396" y="147" textAnchor="middle" fontSize="7" fill="var(--muted)">Audible Siren Matrix</text>

                      <line x1="240" y1="28" x2="350" y2="28" stroke="#94a3b8" strokeDasharray="3 2" />
                      <circle cx="350" cy="28" r="3" fill="#22c55e" />
                      <rect x="340" y="14" width="108" height="28" rx="6" fill="var(--panel)" stroke="var(--border)" />
                      <text x="394" y="27" textAnchor="middle" fontSize="8" fontWeight="700" fill="#16a34a">RGB STATUS BEACON</text>
                      <text x="394" y="37" textAnchor="middle" fontSize="7" fill="var(--muted)">Safe · Elevated · Alarm</text>
                    </svg>
                  </div>

                  <div className="hero-scan-footer">
                    <div className="hero-ai-status">
                      <Cpu size={14} className="text-mint" />
                      <span><b>Ember Guardian 1:1 Hardware Model</b> · 70×70×28 mm Pressurized Enclosure · 14 Forced-Air Aspiration Gills</span>
                    </div>
                    <a href="#app?tab=guardian" className="hero-rescan-btn" style={{ textDecoration: 'none' }}>
                      Inspect 3D Node <ArrowRight size={11} />
                    </a>
                  </div>
                </div>
              )}

              {/* VIEW 4: Microgravity Combustion Chamber Simulator */}
              {heroTab === 'chamber' && (
                <div className="hero-tab-content">
                  <div className="hero-chamber-canvas">
                    <div className="hero-chamber-grid" />
                    <svg viewBox="0 0 460 215" className="hero-room-svg" role="img" aria-label="Microgravity Flame Simulator Viewport">
                      <defs>
                        <radialGradient id="zeroGGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
                          <stop offset="40%" stopColor="#0284c7" stopOpacity="0.45" />
                          <stop offset="75%" stopColor="#0369a1" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#0c4a6e" stopOpacity="0" />
                        </radialGradient>
                        <radialGradient id="zeroGCore" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                          <stop offset="35%" stopColor="#fef08a" stopOpacity="0.85" />
                          <stop offset="70%" stopColor="#fbbf24" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                        </radialGradient>
                        <linearGradient id="earthFlame" x1="0" y1="1" x2="0" y2="0">
                          <stop offset="0%" stopColor="#0284c7" stopOpacity="0.9" />
                          <stop offset="15%" stopColor="#ea580c" stopOpacity="0.95" />
                          <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.9" />
                          <stop offset="90%" stopColor="#fef08a" stopOpacity="0.85" />
                          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Burner Nozzle Stem */}
                      <rect x="227" y="160" width="6" height="50" fill="#475569" rx="1" />
                      <circle cx="230" cy="160" r="5" fill="#64748b" stroke="#94a3b8" strokeWidth="1" />

                      {heroGravity === 0 ? (
                        <g className="hero-flame-0g">
                          {/* Zero-G Spherical Diffusion Flame */}
                          <circle cx="230" cy="115" r="52" fill="url(#zeroGGlow)" />
                          <circle cx="230" cy="115" r="48" fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.6" strokeDasharray="3 3" />
                          <circle cx="230" cy="115" r="18" fill="url(#zeroGCore)" />
                          <text x="230" y="42" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#38bdf8" fontFamily="ui-monospace, monospace">
                            0.00 g · PURE SPHERICAL DIFFUSION (SOOT-FREE)
                          </text>
                        </g>
                      ) : (
                        <g className="hero-flame-1g">
                          {/* Earth 1G Buoyant Teardrop Flame */}
                          <path d="M 230 40 C 255 105 260 148 244 160 C 238 163 222 163 216 160 C 200 148 205 105 230 40 Z" fill="url(#earthFlame)" filter="drop-shadow(0 0 12px rgba(234, 88, 12, 0.4))" />
                          <text x="230" y="42" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--flame)" fontFamily="ui-monospace, monospace">
                            1.00 g · BUOYANT PLUME FLAME (NATURAL CONVECTION)
                          </text>
                        </g>
                      )}
                    </svg>
                  </div>

                  <div className="hero-scan-footer">
                    <div className="hero-ai-status">
                      <Flame size={14} style={{ color: 'var(--flame)' }} />
                      <span><b>EMBER-ROM 0.1</b> · Lumped ODE Energy Balance · Methane / Propane / Ethanol</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className={`hero-grav-btn ${heroGravity === 0 ? 'active' : ''}`} onClick={() => setHeroGravity(0)}>
                        0.0 g (Space)
                      </button>
                      <button className={`hero-grav-btn ${heroGravity === 1 ? 'active' : ''}`} onClick={() => setHeroGravity(1)}>
                        1.0 g (Earth)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 5: NASA PSI Flight Research Explorer Preview */}
              {heroTab === 'psi' && (
                <div className="hero-tab-content hero-psi-content">
                  <div className="hero-psi-preview-card">
                    <div className="hero-psi-header">
                      <div className="hero-psi-badges">
                        <span className="hero-psi-badge">NASA PSI REPOSITORY</span>
                        <span className="hero-psi-badge ok">6 FLIGHT INVESTIGATIONS</span>
                      </div>
                      <h3>NASA Combustion Integrated Rack (CIR) Flight Data</h3>
                      <p>
                        Empirical microgravity combustion benchmarks from the International Space Station, drop towers,
                        and parabolic flights calibrated for spacecraft, lunar, and Martian fire safety.
                      </p>
                    </div>

                    <div className="hero-psi-metrics-row">
                      <div className="hero-psi-metric">
                        <small>ACME Methane LOI</small>
                        <b>13.4% O₂</b>
                        <span>Spherical diffusion boundary</span>
                      </div>
                      <div className="hero-psi-metric">
                        <small>FLEX-2 Propane Quench</small>
                        <b>21.2 mm</b>
                        <span>Cool flame observed</span>
                      </div>
                      <div className="hero-psi-metric">
                        <small>BASS-II Solid Spread</small>
                        <b>0.4–1.8 mm/s</b>
                        <span>Low forced airflow drift</span>
                      </div>
                    </div>
                  </div>

                  <div className="hero-scan-footer">
                    <div className="hero-ai-status">
                      <Database size={14} style={{ color: 'var(--mint)' }} />
                      <span><b>NASA Physical Science Informatics</b> · Habitat Relevance Ranking & Earth Spinoffs</span>
                    </div>
                    <a className="lp-btn lp-btn-sm" href="#app?tab=psi">
                      Open PSI Explorer <ArrowRight size={14} />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Metrics & Impact Strip */}
      <section className="lp-metrics-section lp-reveal">
        <div className="lp-telemetry-ribbon">
          <div className="lp-telemetry-cell">
            <div className="lp-telemetry-tag"><span className="telemetry-dot mint" /> SYSTEM ARCHITECTURE</div>
            <div className="lp-telemetry-val">CLOUD & FLIGHT DB</div>
            <div className="lp-telemetry-sub">Multi-tenant synchronized flight database · Real-time ACID records with collaborative team access</div>
          </div>
          <div className="lp-telemetry-cell">
            <div className="lp-telemetry-tag"><span className="telemetry-dot amber" /> NEURAL INFERENCE</div>
            <div className="lp-telemetry-val">&lt; 1.5s / SCAN</div>
            <div className="lp-telemetry-sub">Multimodal vision screening · Automated NASA-STD-6001 audit</div>
          </div>
          <div className="lp-telemetry-cell">
            <div className="lp-telemetry-tag"><span className="telemetry-dot flame" /> HARDWARE TELEMETRY</div>
            <div className="lp-telemetry-val">70×70mm IOT SENSORS</div>
            <div className="lp-telemetry-sub">Ember Guardian IoT stage · Multi-criteria environmental sensing</div>
          </div>
          <div className="lp-telemetry-cell">
            <div className="lp-telemetry-tag"><span className="telemetry-dot info" /> NUMERICAL KINETICS</div>
            <div className="lp-telemetry-val">0.00 – 2.00 g SWEEP</div>
            <div className="lp-telemetry-sub">Differential energy equations · NASA PSI flight benchmark calibrated</div>
          </div>
        </div>
      </section>

      {/* Proactive vs Reactive Timeline Infographic Strip */}
      <section className="lp-sec lp-timeline-sec lp-reveal">
        <div style={{ maxWidth: '1080px', margin: '0 auto', textAlign: 'center' }}>
          <div className="lp-timeline-tag">
            <ShieldCheck size={14} />
            <span>Zero-G Fire Kinetics & Detection Phase Lag</span>
          </div>
          <h2 style={{ fontSize: '26px', marginBottom: '8px' }}>Why Stagnant Microgravity Smoke Demands Pre-Ignition Thermal Screening</h2>
          <p style={{ fontSize: '15px', color: 'var(--muted)', maxWidth: '72ch', margin: '0 auto 32px', lineHeight: 1.6 }}>
            In Earth’s 1 g gravity, buoyant convection drives hot gases and smoke upward into ceiling detectors.
            In microgravity (0 g), buoyancy is completely absent: smoke particulates stagnate in localized clouds
            until drawn by forced ventilation. Ember AI screening catches thermal clearance violations at Phase 0 before ignition occurs.
          </p>

          <figure className="lp-infographic-wrap" style={{ background: 'rgba(11, 17, 26, 0.6)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px 16px', backdropFilter: 'blur(10px)' }}>
            <svg viewBox="0 0 760 230" className="lp-timeline-svg" role="img" aria-label="Microgravity hazard detection vs traditional sensor lag timeline">
              <defs>
                <linearGradient id="curveGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--mint)" />
                  <stop offset="35%" stopColor="var(--amber)" />
                  <stop offset="85%" stopColor="var(--flame)" />
                  <stop offset="100%" stopColor="var(--danger)" />
                </linearGradient>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(224, 83, 28, 0.18)" />
                  <stop offset="100%" stopColor="rgba(224, 83, 28, 0.0)" />
                </linearGradient>
              </defs>

              {/* Baseline Timeline */}
              <line x1="40" y1="185" x2="720" y2="185" stroke="var(--border-strong)" strokeWidth="2" />

              {/* Fire Progression S-Curve Area Fill */}
              <path
                d="M 40 183 C 230 181 360 174 440 135 C 520 90 580 40 710 18 L 710 185 L 40 185 Z"
                fill="url(#areaGradient)"
              />

              {/* S-Curve Path */}
              <path
                d="M 40 183 C 230 181 360 174 440 135 C 520 90 580 40 710 18"
                fill="none"
                stroke="url(#curveGradient)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Point 1: Ember Proactive Detection (T = 0, Pre-Ignition Phase) */}
              <circle cx="180" cy="181" r="16" fill="none" stroke="var(--mint)" strokeWidth="1.5" className="beacon-ring" />
              <circle cx="180" cy="181" r="7" fill="var(--mint)" />
              <line x1="180" y1="36" x2="180" y2="174" stroke="var(--mint)" strokeWidth="2" strokeDasharray="4 4" />
              <rect x="75" y="32" width="210" height="48" rx="8" fill="var(--panel)" stroke="var(--mint)" strokeWidth="1.5" filter="drop-shadow(0 4px 12px rgba(5,150,105,0.15))" />
              <text x="180" y="52" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--mint)">
                Ember AI Multi-Spectral Scan
              </text>
              <text x="180" y="68" textAnchor="middle" fontSize="10" fill="var(--muted)">
                Pre-ignition clearance violation spotted (T = 0)
              </text>

              {/* Point 2: Traditional Ionization Sensor Trigger (Lagged by Zero-G Stagnation) */}
              <circle cx="500" cy="100" r="7" fill="var(--danger)" />
              <line x1="500" y1="74" x2="500" y2="185" stroke="var(--danger)" strokeWidth="2" strokeDasharray="4 4" />
              <rect x="425" y="70" width="215" height="48" rx="8" fill="var(--panel)" stroke="var(--border)" strokeWidth="1.5" />
              <text x="532" y="90" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--text-heading)">
                Standard Smoke Sensor
              </text>
              <text x="532" y="106" textAnchor="middle" fontSize="10" fill="var(--muted)">
                Delayed until forced flow pulls smoke (critical lag)
              </text>

              {/* Point 3: Thermal Runaway / Rapid Flame Spread */}
              <circle cx="710" cy="18" r="6" fill="var(--danger)" />

              {/* Timeline Horizontal Axis Milestones */}
              <text x="40" y="210" fontSize="11" fill="var(--muted)" fontWeight="600">Nominal Flight Operations</text>
              <text x="360" y="210" textAnchor="middle" fontSize="11" fill="var(--muted)">Smoldering & Thermal Escalation</text>
              <text x="720" y="210" textAnchor="end" fontSize="11" fill="var(--danger)" fontWeight="700">Open Flaming / Flashover</text>
            </svg>
          </figure>
        </div>
      </section>

      {/* Four Integrated Pillars Console */}
      <section className="lp-sec lp-reveal" id="features">
        <div className="lp-sec-header">
          <span className="lp-brand-badge" style={{ marginBottom: '8px', display: 'inline-block' }}>MISSION ARCHITECTURE</span>
          <h2>Integrated Flight Safety & Microgravity Combustion Systems</h2>
          <p>
            From pressurized spacecraft compartments and lunar surface outposts to IoT early warning telemetry and
            orbital combustion physics, Ember delivers a unified, mission-ready operational suite.
          </p>
        </div>

        <div className="lp-console-layout">
          {/* Main Featured Showcase Panel */}
          <div className="lp-console-hero">
            <div className="lp-console-hero-header">
              <div className="lp-console-subsystem">
                <ScanSearch size={18} className="text-flame" />
                <span>PRIMARY SYSTEM // OPTICAL HAZARD SCREENING</span>
              </div>
              <span className="lp-console-badge">NASA-STD-6001 READY</span>
            </div>

            <h3 className="lp-console-hero-title">
              Autonomous Visual Cabin & Compartment Hazard Screening
            </h3>
            <p className="lp-console-hero-desc">
              Audits wide-angle optical surveys of habitable crew volumes, avionics bays, and science experiment racks.
              Instantly detects high-temperature heat exchangers encroaching on combustible Multi-Layer Insulation (MLI),
              unanchored wire harness umbilical daisy chaining, and blocked emergency airlock scuttle paths.
            </p>

            <div className="lp-console-hud-matrix">
              <div className="lp-hud-indicator">
                <span className="hud-code">CHK-01</span>
                <b>Thermal Clearance Verification</b>
                <small>Enforces certified physical separation from MLI, Kapton, and stowage</small>
              </div>
              <div className="lp-hud-indicator">
                <span className="hud-code">CHK-02</span>
                <b>Avionics Bus & Umbilical Chaining</b>
                <small>Flags high-amp electrical jumpers and loose wire bundles near oxygen lines</small>
              </div>
              <div className="lp-hud-indicator">
                <span className="hud-code">CHK-03</span>
                <b>Egress & ECLSS Air Duct Access</b>
                <small>Guarantees unobstructed pathways to emergency airlocks and return grilles</small>
              </div>
            </div>

            <div className="lp-console-hero-footer">
              <a href="#app?tab=guard" className="lp-btn lp-btn-glow">
                Launch Habitat Safety Hub <ArrowRight size={15} />
              </a>
              <span className="lp-console-meta">High-throughput synchronized flight telemetry</span>
            </div>
          </div>

          {/* Complementary 3-Pillar Stack */}
          <div className="lp-console-stack">
            <div className="lp-console-module">
              <div className="lp-console-mod-meta">
                <span className="mod-id">MOD 01</span>
                <span className="mod-cat"><Layers size={13} /> SPATIAL KINETICS</span>
              </div>
              <h4>2D Orbital Clearance Architecture Planner</h4>
              <p>
                Interactive floorplan canvas to place avionics racks, life support ducting, thermal radiators, and egress
                hatches with real-time clearance halos and quantitative fire risk scoring (0–100).
              </p>
              <a href="#app?tab=scanner" className="lp-mod-link">
                Launch Clearance Planner <ChevronRight size={14} />
              </a>
            </div>

            <div className="lp-console-module">
              <div className="lp-console-mod-meta">
                <span className="mod-id">MOD 02</span>
                <span className="mod-cat"><Cpu size={13} /> HARDWARE BLUEPRINT</span>
              </div>
              <h4>Ember Guardian IoT Microgravity Sensor Node</h4>
              <p>
                70×70×28 mm squircle enclosure with dual 7-slot forced-convection intake gills, 1.3" OLED telemetry,
                tri-color beacon LED, and 85 dB acoustic siren to wake resting astronauts.
              </p>
              <a href="#app?tab=guardian" className="lp-mod-link">
                Inspect 3D Hardware Twin <ChevronRight size={14} />
              </a>
            </div>

            <div className="lp-console-module">
              <div className="lp-console-mod-meta">
                <span className="mod-id">MOD 03</span>
                <span className="mod-cat"><Flame size={13} /> FLIGHT SCIENCE</span>
              </div>
              <h4>Microgravity Combustion Kinetics Simulator</h4>
              <p>
                EMBER-ROM 0.1 lumped ODE energy balance across variable gravity (0 g micro-g, 0.165 g Moon, 0.378 g Mars,
                1.0 g Earth) with multi-fuel kinetics and NASA flight benchmark validation.
              </p>
              <a href="#app?tab=lab" className="lp-mod-link">
                Open Combustion Lab <ChevronRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Inspection Deep-Dive */}
      <section className="lp-sec lp-reveal" id="inspection">
        <div className="lp-sec-header">
          <span className="lp-brand-badge" style={{ marginBottom: '8px', display: 'inline-block' }}>SPACEFLIGHT FIRE CODES</span>
          <h2>Spacecraft Habitat Fire Vulnerability Matrix</h2>
          <p>
            Calibrated against NASA-STD-6001, NASA SP-5080, and ISS SSP 50005 flight safety criteria,
            Ember automates the identification of ignition precursors before thermal runaway.
          </p>
        </div>

        <div className="lp-matrix-table">
          <div className="lp-matrix-row">
            <div className="lp-matrix-col-id">
              <span className="lp-matrix-num">CRIT-01</span>
              <div className="lp-icon-box flame"><ShieldAlert size={20} /></div>
            </div>
            <div className="lp-matrix-col-content">
              <h3>Thermal Radiators & MLI Insulation Boundary Violations</h3>
              <p>
                In pressurized habitats, high-temperature avionics radiators and auxiliary heat exchangers can ignite
                combustible Multi-Layer Insulation (MLI), Kapton films, and crew stowage fabric. Ember verifies certified
                spatial separation from combustible polymers according to NASA-STD-6001 Test 1 criteria.
              </p>
            </div>
            <div className="lp-matrix-col-badge">
              <span className="lp-rule-badge">Standard: NASA-STD-6001 (Min 0.8m Buffer)</span>
            </div>
          </div>

          <div className="lp-matrix-row">
            <div className="lp-matrix-col-id">
              <span className="lp-matrix-num">CRIT-02</span>
              <div className="lp-icon-box amber"><Activity size={20} /></div>
            </div>
            <div className="lp-matrix-col-content">
              <h3>Wire Harness Umbilical Chaining & High-Amp Jumper Fatigue</h3>
              <p>
                Identifies non-conforming umbilical daisy chaining, high-current jumper cords crossing crew transit corridors,
                and unanchored wire harnesses vibrating against pressurized aluminum bulkhead ribs under acoustic and launch loads,
                preventing catastrophic electrical arc flashovers.
              </p>
            </div>
            <div className="lp-matrix-col-badge">
              <span className="lp-rule-badge">Standard: NASA SP-5080 Harness Guidelines</span>
            </div>
          </div>

          <div className="lp-matrix-row">
            <div className="lp-matrix-col-id">
              <span className="lp-matrix-num">CRIT-03</span>
              <div className="lp-icon-box mint"><Camera size={20} /></div>
            </div>
            <div className="lp-matrix-col-content">
              <h3>Emergency Scuttle Airlock & ECLSS Duct Restriction</h3>
              <p>
                Detects unanchored cargo bags, experiment hardware, or maintenance toolkits encroaching on emergency
                airlock scuttle doors and Environmental Control and Life Support System (ECLSS) emergency return air grilles,
                preventing oxygen accumulation and blocked crew escape paths.
              </p>
            </div>
            <div className="lp-matrix-col-badge">
              <span className="lp-rule-badge">Standard: ISS SSP 50005 Rapid Egress Code</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2D Hazard Scanner Section */}
      <section className="lp-sec lp-scanner-showcase lp-reveal" id="scanner-preview">
        <div className="lp-scanner-grid">
          <div>
            <span className="hero-tag info" style={{ marginBottom: '14px' }}>Interactive 2D Spatial Engine</span>
            <h2>Orbital Module & Rover 2D Spatial Clearance Architecture</h2>
            <p className="lp-lead" style={{ fontSize: '15px', marginBottom: '20px' }}>
              Map pressurized cabin layouts before mission launch. Position avionics bays, life support ducting, thermal
              radiators, and egress scuttles to eliminate localized oxygen pooling and critical thermal-combustion proximity.
            </p>
            <ul className="lp-checklist">
              <li>
                <CheckCircle2 size={16} className="text-mint shrink-0" />
                <span>Instant quantitative habitat clearance index scoring from 0 to 100</span>
              </li>
              <li>
                <CheckCircle2 size={16} className="text-mint shrink-0" />
                <span>Thermal dispersion halos showing certified physical separation radii</span>
              </li>
              <li>
                <CheckCircle2 size={16} className="text-mint shrink-0" />
                <span>Actionable equipment relocation trajectories to resolve flagged conflicts</span>
              </li>
            </ul>
            <a className="lp-btn lp-btn-glow" href="#app?tab=scanner">
              Open 2D Habitat Clearance Scanner <ArrowRight size={14} />
            </a>
          </div>

          {/* SVG Floorplan Illustration */}
          <div className="lp-showcase-svg-wrap">
            <svg viewBox="0 0 420 310" className="lp-floorplan-showcase-svg" role="img" aria-label="Spacecraft Compartment Spatial Clearance View">
              {/* Habitat perimeter */}
              <rect x="20" y="20" width="380" height="270" fill="var(--card-bg)" stroke="var(--border-strong)" strokeWidth="2" rx="6" />
              {/* Coordinate Grid */}
              <line x1="20" y1="110" x2="400" y2="110" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="20" y1="200" x2="400" y2="200" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="145" y1="20" x2="145" y2="290" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="275" y1="20" x2="275" y2="290" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="3 3" />

              {/* Heat Exchanger with Thermal Dispersion Halo */}
              <circle cx="105" cy="85" r="56" fill="rgba(224, 83, 28, 0.08)" stroke="var(--flame)" strokeWidth="1.5" strokeDasharray="4 4" className="hero-clearance-ring" />
              <circle cx="105" cy="85" r="18" fill="var(--flame-dim)" stroke="var(--flame)" strokeWidth="2" />
              <text x="105" y="89" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--flame)">HEAT</text>

              {/* Combustible MLI Blanket */}
              <circle cx="138" cy="116" r="16" fill="var(--danger-dim)" stroke="var(--danger)" strokeWidth="2" />
              <text x="138" y="120" textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--danger)">MLI</text>

              {/* Red Line Connecting Proximity Fault */}
              <line x1="105" y1="85" x2="138" y2="116" stroke="var(--danger)" strokeWidth="2" strokeDasharray="3 2" />

              {/* Warning Callout Tag */}
              <rect x="165" y="102" width="190" height="28" rx="6" fill="var(--danger-dim)" stroke="var(--danger)" strokeWidth="1" />
              <text x="175" y="120" fontSize="9.5" fontWeight="700" fill="var(--danger)">
                CRITICAL: MLI Blanket within 0.8m
              </text>

              {/* Galley & Fine Water Mist Suppression */}
              <circle cx="310" cy="215" r="18" fill="var(--chip-bg)" stroke="var(--border-strong)" strokeWidth="1.5" />
              <text x="310" y="219" textAnchor="middle" fontSize="8.5" fontWeight="600" fill="var(--text)">GALLEY</text>

              <circle cx="235" cy="215" r="16" fill="var(--mint-dim)" stroke="var(--mint)" strokeWidth="1.5" />
              <text x="235" y="219" textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--mint)">MIST</text>

              {/* HUD Badge */}
              <rect x="32" y="32" width="165" height="26" rx="6" fill="var(--panel)" stroke="var(--border)" />
              <text x="42" y="49" fontSize="10" fontWeight="700" fill="var(--amber)">HAB CLEARANCE: 78/100</text>
            </svg>
          </div>
        </div>
      </section>

      {/* Ember Guardian Hardware & 3D Twin Showcase */}
      <section className="lp-sec lp-guardian-showcase lp-reveal" id="guardian-preview">
        <div className="lp-guardian-grid">
          <div>
            <span className="hero-tag flame" style={{ marginBottom: '14px' }}>
              <Cpu size={12} /> Hardware Blueprint & 3D Twin
            </span>
            <h2>Ember Guardian: Microgravity Environmental Monitoring Node</h2>
            <p className="lp-lead" style={{ fontSize: '15px', marginBottom: '18px' }}>
              Designed around an authentic aerospace engineering blueprint, the Ember Guardian is an environmental
              monitoring device for spacecraft cabins and surface outposts. Because microgravity prevents natural
              convective buoyancy, the Guardian utilizes active forced-air intake gills, real-time thermal telemetry,
              and an 85 dB audible alert to wake resting crew in the event of thermal escalation.
            </p>

            <div className="lp-guardian-specs-grid">
              <div className="lp-guardian-spec-item">
                <span className="lp-guardian-spec-label"><Sliders size={12} /> Enclosure</span>
                <span className="lp-guardian-spec-val">70 × 70 × 28 mm Squircle</span>
              </div>
              <div className="lp-guardian-spec-item">
                <span className="lp-guardian-spec-label"><Eye size={12} /> OLED Telemetry</span>
                <span className="lp-guardian-spec-val">1.3" Monochrome (128×64)</span>
              </div>
              <div className="lp-guardian-spec-item">
                <span className="lp-guardian-spec-label"><ShieldCheck size={12} /> Status Beacon</span>
                <span className="lp-guardian-spec-val">Tri-Color RGB Warning LED</span>
              </div>
              <div className="lp-guardian-spec-item">
                <span className="lp-guardian-spec-label"><Activity size={12} /> Acoustic Alarm</span>
                <span className="lp-guardian-spec-val">85 dB Piezo Siren Matrix</span>
              </div>
              <div className="lp-guardian-spec-item">
                <span className="lp-guardian-spec-label"><Flame size={12} /> Forced Aspiration</span>
                <span className="lp-guardian-spec-val">Dual 7-Slot Micro-G Gills</span>
              </div>
              <div className="lp-guardian-spec-item">
                <span className="lp-guardian-spec-label"><Zap size={12} /> Telemetry & Power</span>
                <span className="lp-guardian-spec-val">USB-C + Bulkhead Mount</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a className="lp-btn lp-btn-glow" href="#app?tab=guardian">
                Launch Interactive 3D Model <ArrowRight size={14} />
              </a>
              <a className="lp-btn alt" href="#app?tab=guardian">
                <Eye size={14} /> View Blueprint Sketch
              </a>
            </div>
          </div>

          {/* Blueprint Card Visual */}
          <div className="lp-guardian-blueprint-card">
            <svg viewBox="0 0 380 320" className="lp-guardian-blueprint-svg" role="img" aria-label="Ember Guardian Engineering Schematic">
              {/* Blueprint Grid Background */}
              <defs>
                <pattern id="bpGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--border-subtle)" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect x="0" y="0" width="380" height="320" fill="var(--card-bg)" />
              <rect x="0" y="0" width="380" height="320" fill="url(#bpGrid)" opacity="0.6" />

              {/* Title Block */}
              <rect x="15" y="15" width="350" height="28" rx="4" fill="var(--panel)" stroke="var(--border)" />
              <text x="25" y="32" fontSize="9" fontWeight="700" fill="var(--flame)" fontFamily="ui-monospace, monospace">PROJECT: EMBER GUARDIAN</text>
              <text x="355" y="32" textAnchor="end" fontSize="8" fill="var(--muted)" fontFamily="ui-monospace, monospace">REV 1.0 · SCALE 1:1</text>

              {/* Front Elevation Chassis Squircle (W: 160, H: 160, R: 32) */}
              <rect x="110" y="65" width="160" height="160" rx="32" fill="var(--panel)" stroke="var(--text-heading)" strokeWidth="2" />

              {/* 7 Horizontal Vents (Left and Right) */}
              {[-3, -2, -1, 0, 1, 2, 3].map(i => (
                <rect key={'bp-lv-' + i} x="105" y={145 + i * 11 - 3} width="8" height="6" rx="3" fill="#0f172a" />
              ))}
              {[-3, -2, -1, 0, 1, 2, 3].map(i => (
                <rect key={'bp-rv-' + i} x="267" y={145 + i * 11 - 3} width="8" height="6" rx="3" fill="#0f172a" />
              ))}

              {/* Top LED */}
              <rect x="180" y="74" width="20" height="8" rx="4" fill="#22c55e" stroke="#16a34a" strokeWidth="1" />
              <text x="190" y="60" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#16a34a">STATUS LED</text>
              <line x1="190" y1="63" x2="190" y2="72" stroke="#16a34a" strokeWidth="1" />

              {/* OLED Screen */}
              <rect x="135" y="92" width="110" height="58" rx="6" fill="#0f172a" stroke="var(--border-strong)" strokeWidth="1.5" />
              <text x="190" y="125" textAnchor="middle" fontSize="16" fontWeight="800" fill="#38bdf8" fontFamily="ui-monospace, monospace">26.8°C</text>
              <text x="190" y="140" textAnchor="middle" fontSize="7" fontWeight="700" fill="#6ee7b7" fontFamily="ui-monospace, monospace">NOMINAL · SAFE</text>

              {/* Speaker Perforations */}
              <circle cx="190" cy="184" r="18" fill="var(--chip-bg)" stroke="var(--border-strong)" strokeWidth="1" />
              {[-2, -1, 0, 1, 2].map(r => {
                const counts = [5, 7, 9, 7, 5];
                const count = counts[r + 2];
                const y = 184 + r * 3.8;
                const startX = 190 - ((count - 1) * 3.8) / 2;
                return Array.from({ length: count }).map((_, c) => (
                  <circle key={`bp-spk-${r}-${c}`} cx={startX + c * 3.8} cy={y} r="1.1" fill="#090d16" />
                ));
              })}
              <text x="190" y="215" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="var(--muted)">SPEAKER (85dB ALARM)</text>

              {/* Dimensions Labels */}
              <line x1="95" y1="65" x2="95" y2="225" stroke="var(--muted)" strokeWidth="1" />
              <line x1="90" y1="65" x2="100" y2="65" stroke="var(--muted)" strokeWidth="1" />
              <line x1="90" y1="225" x2="100" y2="225" stroke="var(--muted)" strokeWidth="1" />
              <text x="82" y="148" textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--muted)" transform="rotate(-90 82 148)">70 mm</text>

              <line x1="110" y1="240" x2="270" y2="240" stroke="var(--muted)" strokeWidth="1" />
              <line x1="110" y1="235" x2="110" y2="245" stroke="var(--muted)" strokeWidth="1" />
              <line x1="270" y1="235" x2="270" y2="245" stroke="var(--muted)" strokeWidth="1" />
              <text x="190" y="255" textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--muted)">70 mm</text>

              {/* Callouts */}
              <text x="35" y="150" fontSize="7.5" fill="var(--muted)">7-Slot Vents</text>
              <line x1="72" y1="147" x2="102" y2="147" stroke="var(--muted)" strokeDasharray="2 2" />

              <text x="345" y="150" textAnchor="end" fontSize="7.5" fill="var(--muted)">Convective Air Flow</text>
              <line x1="275" y1="147" x2="300" y2="147" stroke="var(--muted)" strokeDasharray="2 2" />

              {/* Footer status */}
              <rect x="15" y="278" width="350" height="26" rx="4" fill="var(--panel)" stroke="var(--border)" />
              <text x="25" y="294" fontSize="8" fill="var(--muted)" fontFamily="ui-monospace, monospace">MATERIAL: Flame-Retardant Polycarbonate (UL94 V-0)</text>
              <text x="355" y="294" textAnchor="end" fontSize="8" fontWeight="700" fill="var(--mint)" fontFamily="ui-monospace, monospace">3D MODEL READY</text>
            </svg>
          </div>
        </div>
      </section>

      {/* NASA PSI Informatics & Spaceflight Fire Safety Section */}
      <section className="lp-sec lp-reveal" id="psi-preview">
        <div className="lp-sec-header">
          <span className="lp-brand-badge" style={{ marginBottom: '8px', display: 'inline-block' }}>NASA PSI FLIGHT DATA</span>
          <h2>NASA Physical Science Informatics & Habitat Fire Safety</h2>
          <p>
            Decades of low-gravity combustion science conducted aboard the International Space Station, drop towers, and
            parabolic flights synthesized into actionable flammability insights for crewed exploration missions and Earth spinoffs.
          </p>
        </div>

        <div className="lp-dossier-layout">
          {/* Flight Benchmarks Ribbon */}
          <div className="lp-dossier-metrics">
            <div className="lp-dossier-metric-item">
              <small>ACME (ISS CIR)</small>
              <b>13.4% O₂ LOI</b>
              <span>Spherical diffusion extinction limit</span>
            </div>
            <div className="lp-dossier-metric-item">
              <small>FLEX-2 (ISS CIR)</small>
              <b>21.2 mm QUENCH</b>
              <span>Cool flame phenomenon observed</span>
            </div>
            <div className="lp-dossier-metric-item">
              <small>BASS-II (MICRO-G)</small>
              <b>0.4–1.8 mm/s</b>
              <span>Solid fuel spread under low airflow</span>
            </div>
            <div className="lp-dossier-metric-item">
              <small>SOFIE (SAFFIRE)</small>
              <b>NASA-STD-6001</b>
              <span>Spacecraft material flammability index</span>
            </div>
          </div>

          {/* Asymmetric Split Dossier */}
          <div className="lp-dossier-split">
            <div className="lp-dossier-col">
              <div className="lp-dossier-col-header">
                <ShieldAlert size={20} className="text-danger" />
                <h3>Historical Spaceflight Fires & Zero-G Physics Lessons</h3>
              </div>
              <p>
                Analysis of real spaceflight combustion incidents reveals why fire in microgravity behaves completely
                differently than on Earth:
              </p>
              <ul className="lp-dossier-items">
                <li>
                  <b>Apollo 1 (1967):</b> 100% pure high-pressure oxygen caused hyper-accelerated solid fuel flashover in &lt;15 seconds.
                </li>
                <li>
                  <b>Apollo 13 (1970):</b> Cryogenic supercritical oxygen tank electrical short triggered thermochemical reaction in transit.
                </li>
                <li>
                  <b>Mir Space Station (1997):</b> Solid fuel oxygen generator (perchlorate candle) ignition in microgravity; smoke failed to rise and stagnated in module corridors for days.
                </li>
              </ul>
              <a href="#app?tab=psi" className="lp-feature-link" style={{ marginTop: 'auto' }}>
                Inspect Fire Case Studies <ChevronRight size={14} />
              </a>
            </div>

            <div className="lp-dossier-col">
              <div className="lp-dossier-col-header">
                <Globe size={20} className="text-mint" />
                <h3>Spaceflight Fire Safety Technology & Earth Spinoffs</h3>
              </div>
              <p>
                Crucial technologies developed for human spaceflight missions have revolutionized safety across commercial
                aerospace, mining, and terrestrial infrastructure:
              </p>
              <ul className="lp-dossier-items">
                <li>
                  <b>NASA Spinoff #9582:</b> Non-toxic fine-water-mist fire extinguishers replacing toxic Halon across spacecraft and hospitals.
                </li>
                <li>
                  <b>NASA Spinoff #9407:</b> Multi-criteria intelligent smoke detection (Ember Guardian lineage) eliminating false alarms.
                </li>
                <li>
                  <b>NASA Spinoff #9918:</b> Space-suit thermal insulating polymers transferred to modern firefighter protective garments.
                </li>
              </ul>
              <a href="#app?tab=psi" className="lp-feature-link" style={{ marginTop: 'auto' }}>
                View NASA Spinoff Lineage <ChevronRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Microgravity Physics Section */}
      <section className="lp-sec lp-reveal" id="lab-preview">
        <div className="lp-sec-header">
          <span className="lp-brand-badge" style={{ marginBottom: '8px', display: 'inline-block' }}>COMBUSTION DYNAMICS</span>
          <h2>Combustion Kinetics Across Variable Gravitational Regimes</h2>
          <p>
            On Earth, buoyancy shapes flames into flickering teardrops. In microgravity, flames become spherical
            diffusion orbs dominated by molecular transport. EMBER-ROM 0.1 lets you explore this science interactively.
          </p>
        </div>

        <div className="lp-orbital-lab-console">
          <div className="lp-orbital-cell">
            <span className="lp-orbital-cell-tag">REGIME SWEEP</span>
            <div className="lp-icon-box flame" style={{ marginBottom: '14px' }}>
              <Sliders size={20} />
            </div>
            <h3>Continuous Gravity Sweep (0 g to 2 g)</h3>
            <p>
              Transition dynamically between 0 g Microgravity (orbital station), 0.165 g Moon, 0.378 g Mars, and 1.0 g Earth reference.
              Observe instantaneous extinction boundary shifts and convective buoyant velocity collapse.
            </p>
            <span className="lp-rule-badge">0 g to 2.0 g Continuous Sweep</span>
          </div>

          <div className="lp-orbital-cell">
            <span className="lp-orbital-cell-tag">THERMODYNAMICS</span>
            <div className="lp-icon-box info" style={{ marginBottom: '14px' }}>
              <Atom size={20} />
            </div>
            <h3>Multi-Fuel Kinetics & Energy Balance</h3>
            <p>
              Simulate methane (CH₄), propane (C₃H₈), and ethanol vapor under variable oxygen concentrations (0% to 30%).
              Tracks gas enthalpy, instantaneous reaction temperature, and radiative heat release rate in real time.
            </p>
            <span className="lp-rule-badge">Lumped ODE Energy Balance</span>
          </div>

          <div className="lp-orbital-cell">
            <span className="lp-orbital-cell-tag">SUPPRESSION KINETICS</span>
            <div className="lp-icon-box mint" style={{ marginBottom: '14px' }}>
              <Gauge size={20} />
            </div>
            <h3>Active Habitat Fire Suppression Protocols</h3>
            <p>
              Execute and benchmark fuel supply cutoffs, nitrogen dilution below the Limiting Oxygen Index (LOI), and enhanced
              convective wall cooling. Export time-series reaction curves directly to JSON or CSV.
            </p>
            <span className="lp-rule-badge">Persist & Export Curves (CSV/JSON)</span>
          </div>
        </div>
      </section>

      {/* 4-Step Systematic Workflow */}
      <section className="lp-sec lp-reveal" id="workflow">
        <div className="lp-sec-header">
          <span className="lp-brand-badge" style={{ marginBottom: '8px', display: 'inline-block' }}>OPERATIONAL PROTOCOL</span>
          <h2>Autonomous Spacecraft Habitat Inspection Pipeline</h2>
          <p>A four-stage systematic verification cycle engineered for crewed space stations, lunar habitats, and exploration spacecraft.</p>
        </div>

        <div className="lp-pipeline-ribbon">
          <div className="lp-pipeline-step">
            <span className="lp-pipeline-phase">PHASE 01 // TELEMETRY</span>
            <div className="lp-icon-box flame" style={{ marginBottom: 0 }}>
              <Camera size={18} />
            </div>
            <b>Cabin Optical Capture</b>
            <p>Photograph wide-angle views of avionics bays, payload experiment racks, airlock doors, and ECLSS ducting.</p>
          </div>

          <div className="lp-pipeline-step">
            <span className="lp-pipeline-phase">PHASE 02 // NEURAL INFERENCE</span>
            <div className="lp-icon-box info" style={{ marginBottom: 0 }}>
              <ScanSearch size={18} />
            </div>
            <b>Multi-Spectral Neural Audit</b>
            <p>An edge AI vision model analyzes physical clearances, combustible MLI blankets, and umbilical chaining in &lt;1.5 seconds.</p>
          </div>

          <div className="lp-pipeline-step">
            <span className="lp-pipeline-phase">PHASE 03 // REMEDIATION</span>
            <div className="lp-icon-box amber" style={{ marginBottom: 0 }}>
              <ShieldCheck size={18} />
            </div>
            <b>Actionable Crew Trajectory</b>
            <p>Provides exact physical relocation distances, umbilical harness unchaining steps, and priority levels for crew action.</p>
          </div>

          <div className="lp-pipeline-step">
            <span className="lp-pipeline-phase">PHASE 04 // LOGGING</span>
            <div className="lp-icon-box mint" style={{ marginBottom: 0 }}>
              <ClipboardCheck size={18} />
            </div>
            <b>Flight Manifest & Sync</b>
            <p>Records all findings, hazard assessments, and resolution workflows into a secure, collaborative flight database for mission crews and ground control.</p>
          </div>
        </div>
      </section>

      {/* Scope, Safeguards & Limitations */}
      <section className="lp-sec lp-limitations-sec lp-reveal">
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--flame)', marginBottom: '10px' }}>
            <Info size={18} />
            <b style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Scientific & Flight Governance</b>
          </div>
          <h2>Operational Scope & Spacecraft Safety Boundaries</h2>
          <p style={{ fontSize: '14.5px', color: 'var(--muted)', marginBottom: '24px' }}>
            To maintain safety integrity during space exploration missions, operators must understand the capabilities and boundaries of this platform.
          </p>

          <div className="lp-boundaries-grid">
            <div className="lp-boundary-card is-affirmative">
              <b style={{ color: 'var(--mint)', display: 'block', fontSize: '14px', marginBottom: '10px' }}>
                ✓ What Ember Spacecraft Safety Is
              </b>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text)' }}>
                <li>• An educational reduced-order microgravity combustion simulator (EMBER-ROM 0.1) calibrated with NASA flight data.</li>
                <li>• An autonomous visual clearance screening assistant for identifying visible hazard conditions across habitats.</li>
                <li>• An IoT spaceflight monitoring hardware specification and interactive 3D digital twin (Ember Guardian).</li>
                <li>• A collaborative flight telemetry and experiment notebook synchronized for your mission team.</li>
              </ul>
            </div>

            <div className="lp-boundary-card is-limitation">
              <b style={{ color: 'var(--danger)', display: 'block', fontSize: '14px', marginBottom: '10px' }}>
                ✕ What Ember Spacecraft Safety Is Not
              </b>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--muted)' }}>
                <li>• Not a replacement for certified spacecraft ECLSS automated fire detection and suppression subsystems.</li>
                <li>• Cannot see inside sealed pressure hulls, inspect concealed wiring harnesses, or detect internal electrical arcing.</li>
                <li>• Does not actuate physical spacecraft fire suppression valves or flood nitrogen systems autonomously.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-Footer Action Banner */}
      <section className="lp-sec lp-reveal" style={{ borderTop: 'none', paddingBottom: 0 }}>
        <div className="lp-cta-card">
          <div className="lp-cta-card-content">
            <h2>Ready to audit your habitat or explore flame science?</h2>
            <p>
              Collaborate seamlessly with mission control and flight crews. All flight accounts, photos, compartment surveys, and combustion runs are securely synchronized
              in your dedicated flight database.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <a className="lp-btn lp-btn-glow" href="#app">
              Launch Ember Lab <ArrowRight size={15} />
            </a>
            {!user && (
              <a className="lp-btn alt" href="#login">
                Sign In
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Standard High-Quality Multi-Column Footer */}
      <footer className="lp-footer-wrap">
        <div className="lp-top lp-footer-grid" style={{ height: 'auto', paddingBottom: 0 }}>
          {/* Brand Col */}
          <div className="lp-footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="lp-brand-flame-icon">
                <Flame size={22} />
              </span>
              <b style={{ fontSize: '20px', color: 'var(--text-heading)' }}>ember</b>
            </div>
            <p>
              An educational fire safety and microgravity combustion laboratory built for the NASA Space Apps Challenge.
              Combining proactive visual inspection with reduced-order flame physics.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--muted)' }}>
              <span>Research Prototype · v0.2.2</span>
              <span>·</span>
              <span>Synchronized Flight Architecture</span>
            </div>
          </div>

          {/* Col 2: Space Safety & AI */}
          <div className="lp-footer-col">
            <h4>Space Safety & Hardware</h4>
            <ul>
              <li>
                <a href="#app?tab=guard">Habitat Compartment Surveys</a>
              </li>
              <li>
                <a href="#app?tab=guard">AI Visual Hazard Inspection</a>
              </li>
              <li>
                <a href="#app?tab=scanner">2D Habitat Clearance Map</a>
              </li>
              <li>
                <a href="#app?tab=guardian">Ember Guardian 3D Node</a>
              </li>
              <li>
                <a href="/downloads/SAFETY-MODEL.md" download>
                  Safety Model Spec
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Combustion Lab */}
          <div className="lp-footer-col">
            <h4>Combustion Lab</h4>
            <ul>
              <li>
                <a href="#app?tab=lab">Microgravity Chamber</a>
              </li>
              <li>
                <a href="#app?tab=lab">Variable Gravity (0–2g)</a>
              </li>
              <li>
                <a href="#app?tab=lab">NASA Flight Calibrated</a>
              </li>
              <li>
                <a href="#app?tab=experiments">Saved Experiment Runs</a>
              </li>
              <li>
                <a href="#app?tab=method">EMBER-ROM 0.1 Equations</a>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform & Privacy */}
          <div className="lp-footer-col">
            <h4>Platform & Privacy</h4>
            <ul>
              <li>
                <a href="#app">Mission Flight Deck</a>
              </li>
              <li>
                <a href="/downloads/AI-SETUP.md" download>
                  AI Vision Setup Guide
                </a>
              </li>
              <li>
                <a href="#login">Operator Sign In</a>
              </li>
              <li>
                <a href="#signup">Create Account</a>
              </li>
              <li>
                <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Cloud-Ready Database Engine</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="lp-top lp-footer-bottom" style={{ height: 'auto', paddingTop: '24px' }}>
          <span>
            © 2026 Ember Research Project. Educational research prototype. Maintain certified spacecraft ECLSS alarms independently.
          </span>
          <div className="lp-status-pill">
            <span className="lp-status-pill-dot" />
            <span>Flight Database Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
