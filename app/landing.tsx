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
  const [heroGravity, setHeroGravity] = useState<number>(0);
  const [isScanning, setIsScanning] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Scroll Reveal Animations for sections and cards (animates both scrolling down & up)
  useEffect(() => {
    const targets = document.querySelectorAll('.lp-reveal, .lp-feature-card, .lp-stage-card, .lp-stat-item');
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
            <a className="lp-navlink" href="#features">Capabilities</a>
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
              <a className="lp-mobile-navlink" href="#features" onClick={() => setMobileMenuOpen(false)}>
                <Sliders size={18} />
                <div>
                  <b>Capabilities</b>
                  <small>System overview & modules</small>
                </div>
                <ChevronRight size={16} className="lp-mobile-arrow" />
              </a>
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
              <span className="lp-badge-text">NASA Space Apps & Microgravity Research · Proactive AI Fire Safety</span>
            </div>

            <h1>
              Spot fire hazards <span className="text-gradient-flame">before ignition.</span><br />
              Explore flame physics <span className="text-gradient-mint">without gravity.</span>
            </h1>

            <p className="lp-lead">
              Ember unifies multimodal AI visual hazard screening, 2D floorplan clearance planning, the Ember Guardian IoT
              hardware specification, and an interactive microgravity combustion simulator — running 100% locally with private
              SQLite storage.
            </p>

            <div className="lp-cta">
              <a className="lp-btn lp-btn-glow" href="#app">
                {user ? 'Open Dashboard' : 'Launch Ember Lab'} <ArrowRight size={16} />
              </a>
              <a className="lp-btn alt" href="#app?tab=scanner">
                <Layers size={15} /> 2D Hazard Map
              </a>
              {!user && (
                <a className="lp-btn alt" href="#signup">
                  Create Account
                </a>
              )}
            </div>

            <div className="lp-trust-note">
              <Lock size={13} style={{ color: 'var(--mint)' }} />
              <span>100% Private SQLite Storage · Runs Offline · NASA Flight Calibration Ready</span>
            </div>
          </div>

          {/* Hero Interactive 4-Pillar Product Preview */}
          <div className="hero-preview-card" role="region" aria-label="Ember Interactive Product Preview">
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

                    {/* SVG Room Representation */}
                    <svg viewBox="0 0 460 220" className="hero-room-svg" role="img" aria-label="Room Photo Inspection Viewport">
                      <defs>
                        <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--panel)" />
                          <stop offset="100%" stopColor="var(--panel-subtle)" />
                        </linearGradient>
                        <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--card-hover)" />
                          <stop offset="100%" stopColor="var(--chip-bg)" />
                        </linearGradient>
                      </defs>

                      {/* Room Perspective Lines */}
                      <rect x="0" y="0" width="460" height="150" fill="url(#wallGrad)" />
                      <polygon points="0,150 460,150 460,220 0,220" fill="url(#floorGrad)" />
                      <line x1="0" y1="150" x2="460" y2="150" stroke="var(--border)" strokeWidth="1" />

                      {/* Window with Drapery */}
                      <rect x="50" y="20" width="90" height="100" rx="3" fill="var(--panel-subtle)" stroke="var(--border)" />
                      <line x1="95" y1="20" x2="95" y2="120" stroke="var(--border)" strokeWidth="1" />
                      <line x1="50" y1="70" x2="140" y2="70" stroke="var(--border)" strokeWidth="1" />
                      {/* Hanging Drapes */}
                      <path d="M 46 20 Q 55 80 48 152 L 72 152 Q 62 80 68 20 Z" fill="#94a3b8" opacity="0.8" />
                      <path d="M 144 20 Q 135 80 142 152 L 118 152 Q 128 80 122 20 Z" fill="#94a3b8" opacity="0.8" />

                      {/* Space Heater on Floor (Near Drapes) */}
                      <rect x="80" y="132" width="38" height="42" rx="4" fill="#334155" stroke="#475569" strokeWidth="1.5" />
                      <line x1="86" y1="142" x2="112" y2="142" stroke="#ea580c" strokeWidth="2" />
                      <line x1="86" y1="150" x2="112" y2="150" stroke="#ea580c" strokeWidth="2" />
                      <line x1="86" y1="158" x2="112" y2="158" stroke="#ea580c" strokeWidth="2" />
                      <circle cx="99" cy="167" r="2" fill="#22c55e" />

                      {/* Proximity Distance Indicator Line */}
                      <line x1="68" y1="152" x2="80" y2="152" stroke="var(--danger)" strokeWidth="2" strokeDasharray="3 2" />
                      <text x="74" y="146" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--danger)">0.32m</text>

                      {/* Bounding Box 1: Space Heater Proximity */}
                      <rect x="42" y="118" width="86" height="66" rx="6" fill="rgba(220, 38, 38, 0.08)" stroke="var(--danger)" strokeWidth="2" strokeDasharray="4 4" className="hero-bbox-pulse" />

                      {/* Wooden Desk / Furniture on Right */}
                      <rect x="250" y="90" width="160" height="70" rx="3" fill="#cbd5e1" opacity="0.6" stroke="var(--border)" />
                      <rect x="260" y="160" width="10" height="40" fill="#94a3b8" />
                      <rect x="390" y="160" width="10" height="40" fill="#94a3b8" />

                      {/* Chained Power Strips on Carpet */}
                      <rect x="280" y="174" width="46" height="14" rx="2" fill="#ffffff" stroke="#64748b" />
                      <rect x="334" y="180" width="38" height="12" rx="2" fill="#ffffff" stroke="#64748b" />
                      <path d="M 326 181 Q 330 186 334 186" fill="none" stroke="#0f172a" strokeWidth="2" />
                      {/* Bounding Box 2: Electrical Chaining */}
                      <rect x="274" y="166" width="104" height="34" rx="6" fill="rgba(180, 83, 9, 0.08)" stroke="var(--amber)" strokeWidth="2" strokeDasharray="4 4" />
                    </svg>

                    {/* Overlay Badges */}
                    <div className="hero-scan-overlay">
                      <div className="hero-alert-chip danger">
                        <ShieldAlert size={12} />
                        <span><b>Heater Proximity:</b> 0.32m to drapes (NFPA: min 1.0m)</span>
                      </div>
                      <div className="hero-alert-chip warning">
                        <ScanSearch size={12} />
                        <span><b>Cord Hazard:</b> Power strip daisy chained on carpet</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Bar */}
                  <div className="hero-scan-footer">
                    <div className="hero-ai-status">
                      <Scan size={14} className="text-mint" />
                      <span><b>Gemini Flash 3.5</b> · Multimodal Vision Screening · 2 Urgent Items</span>
                    </div>
                    <button className="hero-rescan-btn" onClick={() => setIsScanning(!isScanning)}>
                      <RotateCcw size={11} /> {isScanning ? 'Pause' : 'Rescan'}
                    </button>
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

                      {/* Room Labels */}
                      <text x="30" y="36" fontSize="11" fontWeight="700" fill="var(--text-heading)">Living Room (West)</text>
                      <text x="320" y="36" fontSize="11" fontWeight="700" fill="var(--text-heading)">Kitchen Zone</text>

                      {/* Space Heater in Living Room */}
                      <circle cx="110" cy="105" r="18" fill="var(--flame-dim)" stroke="var(--flame)" strokeWidth="2" />
                      <text x="110" y="109" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--flame)">HEATER</text>

                      {/* 1m Clearance Safe Radius Circle (Dashed) */}
                      <circle cx="110" cy="105" r="54" fill="none" stroke="var(--flame)" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.7" className="hero-clearance-ring" />

                      {/* Long Window Curtains Object */}
                      <rect x="52" y="138" width="56" height="14" rx="3" fill="var(--danger-dim)" stroke="var(--danger)" strokeWidth="1.5" />
                      <text x="80" y="149" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--danger)">CURTAINS</text>

                      {/* Violation Connection Line */}
                      <line x1="100" y1="120" x2="88" y2="138" stroke="var(--danger)" strokeWidth="2" strokeDasharray="2 2" />
                      <circle cx="94" cy="129" r="3" fill="var(--danger)" />

                      {/* Violation Tag */}
                      <rect x="135" y="125" width="135" height="26" rx="4" fill="var(--danger-dim)" stroke="var(--danger)" strokeWidth="1" />
                      <text x="142" y="142" fontSize="9.5" fontWeight="700" fill="var(--danger)">
                        CLEARANCE CONFLICT (0.42m)
                      </text>

                      {/* Kitchen Stove & Extinguisher */}
                      <rect x="365" y="65" width="48" height="42" rx="4" fill="var(--chip-bg)" stroke="var(--border-strong)" strokeWidth="1.5" />
                      <text x="389" y="89" textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--text)">STOVE</text>

                      <circle cx="340" cy="145" r="14" fill="var(--mint-dim)" stroke="var(--mint)" strokeWidth="1.5" />
                      <text x="340" y="149" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--mint)">EXT</text>

                      {/* Safe Corridor Zone */}
                      <path d="M 230 15 L 230 195" stroke="var(--mint)" strokeWidth="1" strokeDasharray="4 4" />
                      <text x="235" y="185" fontSize="8.5" fill="var(--muted)">Exit Path Clear</text>
                    </svg>
                  </div>

                  <div className="hero-scan-footer">
                    <div className="hero-ai-status">
                      <Layers size={14} style={{ color: 'var(--amber)' }} />
                      <span><b>Spatial Risk Score: 78/100</b> · Relocate heater 0.6m East to achieve 100/100</span>
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
                      <span><b>Ember Guardian 1:1 Hardware Model</b> · 70×70×28 mm Enclosure · 7 Ventilation Gills</span>
                    </div>
                    <a href="#app?tab=guard" className="hero-rescan-btn" style={{ textDecoration: 'none' }}>
                      Inspect 3D Model <ArrowRight size={11} />
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
                        <b>0.8–2.5 mm/s</b>
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
        <div className="lp-stat-strip">
          <div className="lp-stat-item">
            <span className="lp-stat-num">100%</span>
            <span className="lp-stat-label">Local & Private (SQLite)</span>
          </div>
          <div className="lp-stat-divider" />
          <div className="lp-stat-item">
            <span className="lp-stat-num">&lt; 1.5s</span>
            <span className="lp-stat-label">Gemini Flash Multimodal Scan</span>
          </div>
          <div className="lp-stat-divider" />
          <div className="lp-stat-item">
            <span className="lp-stat-num">70×70mm</span>
            <span className="lp-stat-label">Ember Guardian IoT Node</span>
          </div>
          <div className="lp-stat-divider" />
          <div className="lp-stat-item">
            <span className="lp-stat-num">0 – 2.0 g</span>
            <span className="lp-stat-label">NASA Benchmark Ready</span>
          </div>
        </div>
      </section>

      {/* Proactive vs Reactive Timeline Infographic Strip */}
      <section className="lp-sec lp-timeline-sec lp-reveal">
        <div style={{ maxWidth: '980px', margin: '0 auto', textAlign: 'center' }}>
          <div className="lp-timeline-tag">
            <ShieldCheck size={14} />
            <span>The Power of Early Prevention</span>
          </div>
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Early Proactive Prevention vs. Delayed Reactive Alarms</h2>
          <p style={{ fontSize: '14.5px', color: 'var(--muted)', maxWidth: '64ch', margin: '0 auto 32px' }}>
            Ceiling smoke alarms only alert you after combustion particles have accumulated in the air. Ember visual
            inspections detect dangerous thermal clearance violations beforehand so hazards can be remediated for $0.
          </p>

          <figure className="lp-infographic-card">
            <svg viewBox="0 0 760 230" className="lp-timeline-svg" role="img" aria-label="Early hazard detection vs traditional smoke alarm timeline">
              <defs>
                <linearGradient id="curveGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--mint)" />
                  <stop offset="35%" stopColor="var(--amber)" />
                  <stop offset="85%" stopColor="var(--flame)" />
                  <stop offset="100%" stopColor="var(--danger)" />
                </linearGradient>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
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

              {/* Point 1: Ember Proactive Detection (T = 0, Pre-Ignition) */}
              <circle cx="180" cy="181" r="16" fill="none" stroke="var(--mint)" strokeWidth="1.5" className="beacon-ring" />
              <circle cx="180" cy="181" r="7" fill="var(--mint)" />
              <line x1="180" y1="36" x2="180" y2="174" stroke="var(--mint)" strokeWidth="2" strokeDasharray="4 4" />
              <rect x="75" y="32" width="210" height="48" rx="8" fill="var(--panel)" stroke="var(--mint)" strokeWidth="1.5" filter="drop-shadow(0 4px 12px rgba(5,150,105,0.15))" />
              <text x="180" y="52" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--mint)">
                Ember AI Visual Scan
              </text>
              <text x="180" y="68" textAnchor="middle" fontSize="10.5" fill="var(--muted)">
                Pre-ignition clearance violation spotted ($0 fix)
              </text>

              {/* Point 2: Traditional Smoke Alarm Trigger (T = +3 to 5 min) */}
              <circle cx="500" cy="100" r="7" fill="var(--danger)" />
              <line x1="500" y1="74" x2="500" y2="185" stroke="var(--danger)" strokeWidth="2" strokeDasharray="4 4" />
              <rect x="425" y="70" width="200" height="48" rx="8" fill="var(--panel)" stroke="var(--border)" strokeWidth="1.5" />
              <text x="525" y="90" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--text-heading)">
                Standard Smoke Alarm
              </text>
              <text x="525" y="106" textAnchor="middle" fontSize="10.5" fill="var(--muted)">
                Triggers when smoke reaches ceiling (seconds left)
              </text>

              {/* Point 3: Flashover / Rapid Flame Spread */}
              <circle cx="710" cy="18" r="6" fill="var(--danger)" />

              {/* Timeline Horizontal Axis Milestones */}
              <text x="40" y="210" fontSize="11" fill="var(--muted)" fontWeight="600">Setup & Normal Use</text>
              <text x="360" y="210" textAnchor="middle" fontSize="11" fill="var(--muted)">Smoldering & Heat Build-up</text>
              <text x="720" y="210" textAnchor="end" fontSize="11" fill="var(--danger)" fontWeight="700">Open Flaming / Flashover</text>
            </svg>
          </figure>
        </div>
      </section>

      {/* Four Integrated Pillars Grid */}
      <section className="lp-sec lp-reveal" id="features">
        <div className="lp-sec-header">
          <h2>Four Integrated Pillars of Fire Safety & Combustion Science</h2>
          <p>
            Whether inspecting a family living room, assessing habitat compartments, prototyping IoT early-warning
            hardware, or researching microgravity flame dynamics, Ember provides a unified, local-first platform.
          </p>
        </div>

        <div className="lp-features-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {/* Pillar 1: AI Room Photo Inspection */}
          <div className="lp-feature-card">
            <div className="lp-icon-box flame">
              <ScanSearch size={22} />
            </div>
            <span className="lp-feature-tag">Proactive AI</span>
            <h3>Multimodal Visual Room Inspections</h3>
            <p>
              Upload or snap room photos to run high-speed visual evaluations using Google Gemini Flash. Ember automatically
              spots space heaters near curtains, overloaded power strip daisy chains, and blocked emergency exits.
            </p>
            <a href="#app?tab=guard" className="lp-feature-link">
              Explore Room Safety Hub <ChevronRight size={14} />
            </a>
          </div>

          {/* Pillar 2: 2D Spatial Floorplan Planner */}
          <div className="lp-feature-card">
            <div className="lp-icon-box info">
              <Layers size={22} />
            </div>
            <span className="lp-feature-tag info">Spatial Physics</span>
            <h3>2D Floorplan Hazard Planner</h3>
            <p>
              Draw floorplans on an interactive canvas, place cooking appliances, heaters, and furniture, and instantly
              screen spatial clearance zones to calculate a quantitative fire safety score.
            </p>
            <a href="#app?tab=scanner" className="lp-feature-link">
              Launch Hazard Planner <ChevronRight size={14} />
            </a>
          </div>

          {/* Pillar 3: Ember Guardian IoT Hardware Device */}
          <div className="lp-feature-card">
            <div className="lp-icon-box amber">
              <Cpu size={22} />
            </div>
            <span className="lp-feature-tag amber">Hardware & 3D</span>
            <h3>Ember Guardian IoT Hardware Node</h3>
            <p>
              Inspect the 70×70×28 mm temperature and acoustic monitoring node. Features an interactive 1:1 3D WebGL
              model, OLED screen, tri-color beacon LED, 85 dB speaker matrix, and engineering blueprint.
            </p>
            <a href="#app?tab=guard" className="lp-feature-link">
              Inspect 3D Hardware Model <ChevronRight size={14} />
            </a>
          </div>

          {/* Pillar 4: Microgravity Combustion Chamber */}
          <div className="lp-feature-card">
            <div className="lp-icon-box mint">
              <Flame size={22} />
            </div>
            <span className="lp-feature-tag mint">Combustion Physics</span>
            <h3>Microgravity Combustion Laboratory</h3>
            <p>
              Simulate flame physics across variable gravity from 0 g microgravity up to 2 g hypergravity with fixed-center
              kinetics, multi-fuel thermodynamics, and NASA flight benchmark calibration endpoints.
            </p>
            <a href="#app?tab=lab" className="lp-feature-link">
              Open Flame Laboratory <ChevronRight size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* Visual Inspection Deep-Dive */}
      <section className="lp-sec lp-reveal" id="inspection">
        <div className="lp-sec-header">
          <h2>Specialized Residential Fire Hazard Detection</h2>
          <p>
            Trained on residential fire protection principles, Ember uses specialized vision rules to flag common
            ignition vulnerabilities before they cause harm.
          </p>
        </div>

        <div className="lp-features-grid">
          <div className="lp-feature-card">
            <div className="lp-icon-box flame">
              <ShieldAlert size={20} />
            </div>
            <h3>Space Heater Proximity</h3>
            <p>
              Space heaters cause a significant portion of home heating fire deaths. Ember verifies that electric
              heaters maintain at least 1 meter of clearance from curtains, rugs, bedding, and cardboard.
            </p>
            <span className="lp-rule-badge">Rule: NFPA 1m Radius Clearance</span>
          </div>

          <div className="lp-feature-card">
            <div className="lp-icon-box amber">
              <Activity size={20} />
            </div>
            <h3>Electrical Cord Arrangements</h3>
            <p>
              Identifies daisy-chained power strips, heavy appliances plugged into light-duty extension cords, and
              cables tangled under wooden furniture or high-traffic carpet.
            </p>
            <span className="lp-rule-badge">Rule: No Daisy Chaining on Carpet</span>
          </div>

          <div className="lp-feature-card">
            <div className="lp-icon-box mint">
              <Camera size={20} />
            </div>
            <h3>Cooking Area Clearance</h3>
            <p>
              Spots dish towels, oven mitts, wooden utensils, and food packaging resting dangerously close to stove
              burners, advising immediate clearance before cooking begins.
            </p>
            <span className="lp-rule-badge">Rule: Clear Stovetop Perimeter</span>
          </div>
        </div>
      </section>

      {/* 2D Hazard Scanner Section */}
      <section className="lp-sec lp-scanner-showcase lp-reveal" id="scanner-preview">
        <div className="lp-scanner-grid">
          <div>
            <span className="hero-tag info" style={{ marginBottom: '14px' }}>Interactive 2D Spatial Engine</span>
            <h2>Plan Room Geometry & Spatial Clearances</h2>
            <p className="lp-lead" style={{ fontSize: '15px', marginBottom: '20px' }}>
              Test your room layouts before arranging furniture. Place heaters, stoves, curtains, and escape routes to
              uncover dangerous spatial adjacencies with immediate rule-based clearance feedback.
            </p>
            <ul className="lp-checklist">
              <li>
                <CheckCircle2 size={16} className="text-mint shrink-0" />
                <span>Instant quantitative fire risk scoring from 0 to 100</span>
              </li>
              <li>
                <CheckCircle2 size={16} className="text-mint shrink-0" />
                <span>Clearance circle overlays showing safe thermal separation radii</span>
              </li>
              <li>
                <CheckCircle2 size={16} className="text-mint shrink-0" />
                <span>Actionable layout advice to resolve flagged conflicts in seconds</span>
              </li>
            </ul>
            <a className="lp-btn lp-btn-glow" href="#app?tab=scanner">
              Open 2D Hazard Scanner <ArrowRight size={14} />
            </a>
          </div>

          {/* SVG Floorplan Illustration */}
          <div className="lp-showcase-svg-wrap">
            <svg viewBox="0 0 420 310" className="lp-floorplan-showcase-svg" role="img" aria-label="Floorplan Hazard Scanner Simulation View">
              {/* Room perimeter */}
              <rect x="20" y="20" width="380" height="270" fill="var(--card-bg)" stroke="var(--border-strong)" strokeWidth="2" rx="6" />
              {/* Grid lines */}
              <line x1="20" y1="110" x2="400" y2="110" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="20" y1="200" x2="400" y2="200" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="145" y1="20" x2="145" y2="290" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="275" y1="20" x2="275" y2="290" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="3 3" />

              {/* Heater Item with Thermal Dispersion Halo */}
              <circle cx="105" cy="85" r="56" fill="rgba(224, 83, 28, 0.08)" stroke="var(--flame)" strokeWidth="1.5" strokeDasharray="4 4" className="hero-clearance-ring" />
              <circle cx="105" cy="85" r="18" fill="var(--flame-dim)" stroke="var(--flame)" strokeWidth="2" />
              <text x="105" y="89" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--flame)">HEAT</text>

              {/* Curtain Item (Violating Clearance) */}
              <circle cx="138" cy="116" r="16" fill="var(--danger-dim)" stroke="var(--danger)" strokeWidth="2" />
              <text x="138" y="120" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--danger)">CURT</text>

              {/* Red Line Connecting Proximity Fault */}
              <line x1="105" y1="85" x2="138" y2="116" stroke="var(--danger)" strokeWidth="2" strokeDasharray="3 2" />

              {/* Warning Callout Tag */}
              <rect x="165" y="102" width="180" height="28" rx="6" fill="var(--danger-dim)" stroke="var(--danger)" strokeWidth="1" />
              <text x="175" y="120" fontSize="10" fontWeight="700" fill="var(--danger)">
                CRITICAL: Curtain within 1m
              </text>

              {/* Stove & Extinguisher */}
              <circle cx="310" cy="215" r="18" fill="var(--chip-bg)" stroke="var(--border-strong)" strokeWidth="1.5" />
              <text x="310" y="219" textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--text)">STOVE</text>

              <circle cx="235" cy="215" r="16" fill="var(--mint-dim)" stroke="var(--mint)" strokeWidth="1.5" />
              <text x="235" y="219" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--mint)">EXT</text>

              {/* HUD Badge */}
              <rect x="32" y="32" width="145" height="26" rx="6" fill="var(--panel)" stroke="var(--border)" />
              <text x="42" y="49" fontSize="10.5" fontWeight="700" fill="var(--amber)">RISK: MODERATE (78/100)</text>
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
            <h2>Ember Guardian: Smart Temperature & Early Warning Node</h2>
            <p className="lp-lead" style={{ fontSize: '15px', marginBottom: '18px' }}>
              Designed around an authentic engineering blueprint, the Ember Guardian is a dedicated IoT environmental
              monitoring device. It continuously samples room air convection, gives immediate visual telemetry, and sounds
              an 85 dB audible alert when abnormal thermal escalation is spotted.
            </p>

            <div className="lp-guardian-specs-grid">
              <div className="lp-guardian-spec-item">
                <span className="lp-guardian-spec-label"><Sliders size={12} /> Dimensions</span>
                <span className="lp-guardian-spec-val">70 × 70 × 28 mm Squircle</span>
              </div>
              <div className="lp-guardian-spec-item">
                <span className="lp-guardian-spec-label"><Eye size={12} /> OLED Display</span>
                <span className="lp-guardian-spec-val">1.3" Monochrome (128×64)</span>
              </div>
              <div className="lp-guardian-spec-item">
                <span className="lp-guardian-spec-label"><ShieldCheck size={12} /> Status Beacon</span>
                <span className="lp-guardian-spec-val">Tri-Color RGB Early Warning</span>
              </div>
              <div className="lp-guardian-spec-item">
                <span className="lp-guardian-spec-label"><Activity size={12} /> Acoustic Alarm</span>
                <span className="lp-guardian-spec-val">85 dB Piezo Resonator Matrix</span>
              </div>
              <div className="lp-guardian-spec-item">
                <span className="lp-guardian-spec-label"><Flame size={12} /> Air Intake</span>
                <span className="lp-guardian-spec-val">Dual 7-Slot Convective Gills</span>
              </div>
              <div className="lp-guardian-spec-item">
                <span className="lp-guardian-spec-label"><Zap size={12} /> Telemetry & Power</span>
                <span className="lp-guardian-spec-val">USB-C Base + Wall Mount</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a className="lp-btn lp-btn-glow" href="#app?tab=guard">
                Launch Interactive 3D Model <ArrowRight size={14} />
              </a>
              <a className="lp-btn alt" href="#app?tab=guard">
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
          <span className="lp-brand-badge" style={{ marginBottom: '8px', display: 'inline-block' }}>NASA PSI Flight Data</span>
          <h2>NASA Physical Science Informatics & Habitat Fire Safety</h2>
          <p>
            Decades of low-gravity combustion science conducted aboard the International Space Station, drop towers, and
            parabolic flights synthesized into actionable flammability insights for crewed exploration missions and Earth spinoffs.
          </p>
        </div>

        <div className="lp-features-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <div className="lp-feature-card">
            <div className="lp-icon-box flame">
              <Database size={22} />
            </div>
            <span className="lp-feature-tag">Flight Repository</span>
            <h3>PSI Investigations & Flammability Ranking</h3>
            <p>
              Explore curated NASA experiments including ACME, FLEX-2, BASS-II, and SOFIE. Filter by habitat relevance
              across transit spacecraft, space stations, lunar bases (0.165 g), and Mars surface outposts (0.378 g).
            </p>
            <a href="#app?tab=psi" className="lp-feature-link">
              Browse NASA PSI Catalog <ChevronRight size={14} />
            </a>
          </div>

          <div className="lp-feature-card">
            <div className="lp-icon-box mint">
              <ShieldAlert size={22} />
            </div>
            <span className="lp-feature-tag">Safety Governance</span>
            <h3>Historical Spaceflight Fires & Lessons Learned</h3>
            <p>
              Analyze the combustion physics of Apollo 1 (hyper-oxygenated flashover), Apollo 13 (cryo tank electrical ignition),
              and the 1997 Mir Space Station fire (zero-g smoke stagnation) to understand modern exploration fire codes.
            </p>
            <a href="#app?tab=psi" className="lp-feature-link">
              Inspect Fire Case Studies <ChevronRight size={14} />
            </a>
          </div>

          <div className="lp-feature-card">
            <div className="lp-icon-box purple">
              <Globe size={22} />
            </div>
            <span className="lp-feature-tag">Earth Spinoffs</span>
            <h3>Terrestrial Fire Safety Innovations</h3>
            <p>
              Discover how NASA microgravity research delivered non-toxic fine-water-mist fire extinguishers (Spinoff #9582),
              multi-criteria smoke detection (Spinoff #9407 / Ember Guardian), and firefighter protective textiles (Spinoff #9918).
            </p>
            <a href="#app?tab=psi" className="lp-feature-link">
              View NASA Spinoff Lineage <ChevronRight size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* Microgravity Physics Section */}
      <section className="lp-sec lp-reveal" id="lab-preview">
        <div className="lp-sec-header">
          <h2>Combustion Physics in Variable Gravitational Fields</h2>
          <p>
            On Earth, buoyancy shapes flames into flickering teardrops. In microgravity, flames become spherical
            diffusion orbs dominated by molecular transport. EMBER-ROM 0.1 lets you explore this science interactively.
          </p>
        </div>

        <div className="lp-features-grid">
          <div className="lp-feature-card">
            <div className="lp-icon-box flame">
              <Sliders size={20} />
            </div>
            <h3>Gravity Presets & Continuous Slider</h3>
            <p>
              Switch between 0 g Microgravity, 0.165 g Moon, 0.378 g Mars, and 1.0 g Earth, or drag the gravity slider
              up to 2.0 g to observe buoyant velocity and convective cooling shifts.
            </p>
            <span className="lp-rule-badge">0 g to 2 g Continuous Sweep</span>
          </div>

          <div className="lp-feature-card">
            <div className="lp-icon-box info">
              <Atom size={20} />
            </div>
            <h3>Multi-Fuel & Atmospheric Controls</h3>
            <p>
              Simulate methane (CH₄), propane (C₃H₈), and ethanol vapor under atmospheric oxygen concentrations from 0%
              up to 30%, tracking gas temperature and heat release rate live.
            </p>
            <span className="lp-rule-badge">Lumped Energy Balance</span>
          </div>

          <div className="lp-feature-card">
            <div className="lp-icon-box mint">
              <Gauge size={20} />
            </div>
            <h3>Suppression Experiments & Comparison</h3>
            <p>
              Test fuel cutoff, oxygen dilution below flammability limits, and enhanced wall cooling. Save experimental
              runs to your local database and compare reaction histories side-by-side.
            </p>
            <span className="lp-rule-badge">Run Persist & Export (CSV/JSON)</span>
          </div>
        </div>
      </section>

      {/* 4-Step Systematic Workflow */}
      <section className="lp-sec lp-reveal" id="workflow">
        <div className="lp-sec-header">
          <h2>How AI Room Safety Works in Practice</h2>
          <p>A simple, systematic four-step workflow designed for homeowners, property managers, and safety auditors.</p>
        </div>

        <div className="lp-stages">
          <div className="lp-stage-card">
            <span className="lp-stage-num">Step 1</span>
            <div className="lp-icon-box flame" style={{ marginBottom: 0 }}>
              <Camera size={18} />
            </div>
            <b>Photograph Rooms</b>
            <p>Take wide, well-lit photos showing heating equipment, cooktops, power strips, and exit doorways.</p>
          </div>

          <div className="lp-stage-card">
            <span className="lp-stage-num">Step 2</span>
            <div className="lp-icon-box info" style={{ marginBottom: 0 }}>
              <ScanSearch size={18} />
            </div>
            <b>Multimodal Visual Scan</b>
            <p>Google Gemini Flash analyzes physical clearances, combustible placement, and cord chaining in seconds.</p>
          </div>

          <div className="lp-stage-card">
            <span className="lp-stage-num">Step 3</span>
            <div className="lp-icon-box amber" style={{ marginBottom: 0 }}>
              <ShieldCheck size={18} />
            </div>
            <b>Clear Action Steps</b>
            <p>Receive plain-English guidance: exact clearance distances, cord relocation instructions, and priority level.</p>
          </div>

          <div className="lp-stage-card">
            <span className="lp-stage-num">Step 4</span>
            <div className="lp-icon-box mint" style={{ marginBottom: 0 }}>
              <ClipboardCheck size={18} />
            </div>
            <b>Track & Resolve</b>
            <p>Mark findings as resolved, add personal inspection notes, and keep property safety records private.</p>
          </div>
        </div>
      </section>

      {/* Scope, Safeguards & Limitations */}
      <section className="lp-sec lp-limitations-sec lp-reveal">
        <div style={{ maxWidth: '880px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--flame)', marginBottom: '10px' }}>
            <Info size={18} />
            <b style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Scientific & Safety Boundaries</b>
          </div>
          <h2>What Ember Is — And What It Is Not</h2>
          <p style={{ fontSize: '14.5px', color: 'var(--muted)', marginBottom: '24px' }}>
            To maintain safety integrity, users must understand the capabilities and intentional boundaries of this platform.
          </p>

          <div className="lp-boundaries-grid">
            <div className="lp-boundary-card is-affirmative">
              <b style={{ color: 'var(--mint)', display: 'block', fontSize: '14px', marginBottom: '10px' }}>
                ✓ What Ember Is
              </b>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text)' }}>
                <li>• An educational reduced-order microgravity combustion simulator (EMBER-ROM 0.1).</li>
                <li>• A proactive visual screening assistant for identifying visible hazard conditions.</li>
                <li>• An IoT smart hardware specification and 3D digital twin (Ember Guardian).</li>
                <li>• A private, 100% local safety notebook stored on your computer.</li>
              </ul>
            </div>

            <div className="lp-boundary-card is-limitation">
              <b style={{ color: 'var(--danger)', display: 'block', fontSize: '14px', marginBottom: '10px' }}>
                ✕ What Ember Is Not
              </b>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--muted)' }}>
                <li>• Not a replacement for working, certified smoke and carbon monoxide detectors.</li>
                <li>• Cannot see inside walls, detect hidden electrical arcing, or inspect concealed spaces.</li>
                <li>• Does not connect to or control physical fire suppression equipment.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-Footer Action Banner */}
      <section className="lp-sec lp-reveal" style={{ borderTop: 'none', paddingBottom: 0 }}>
        <div className="lp-cta-card">
          <div className="lp-cta-card-content">
            <h2>Ready to inspect your space or explore flame science?</h2>
            <p>
              Launch Ember on your computer. All accounts, photos, room assessments, and simulation runs remain private
              in your local SQLite database.
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
              <span>Local Single-User Architecture</span>
            </div>
          </div>

          {/* Col 2: Space Safety & AI */}
          <div className="lp-footer-col">
            <h4>Space Safety & Hardware</h4>
            <ul>
              <li>
                <a href="#app?tab=guard">Room Photo Surveys</a>
              </li>
              <li>
                <a href="#app?tab=guard">Gemini Flash Inspection</a>
              </li>
              <li>
                <a href="#app?tab=scanner">2D Floorplan Hazard Map</a>
              </li>
              <li>
                <a href="#app?tab=guard">Ember Guardian 3D Node</a>
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
                <a href="#app?tab=lab">NASA Calibration Ready</a>
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
                <a href="#app">Local Dashboard</a>
              </li>
              <li>
                <a href="/downloads/AI-SETUP.md" download>
                  AI Vision Setup Guide
                </a>
              </li>
              <li>
                <a href="#login">Local Operator Sign In</a>
              </li>
              <li>
                <a href="#signup">Create Account</a>
              </li>
              <li>
                <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Offline SQLite Engine</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="lp-top lp-footer-bottom" style={{ height: 'auto', paddingTop: '24px' }}>
          <span>
            © 2026 Ember Research Project. Educational research prototype. Maintain approved smoke alarms independently.
          </span>
          <div className="lp-status-pill">
            <span className="lp-status-pill-dot" />
            <span>Local Storage Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
