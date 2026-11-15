import { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Beaker,
  BookOpen,
  Check,
  Cpu,
  Database,
  Download,
  ExternalLink,
  Flame,
  Globe,
  Info,
  Layers,
  Orbit,
  Play,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  Thermometer,
  Video,
  Wind,
  Zap
} from 'lucide-react';
import {
  type HabitatEnvironment,
  type PsiInvestigation,
  type HistoricalFireIncident,
  type NasaEarthSpinoff,
  PSI_INVESTIGATIONS,
  HISTORICAL_FIRE_INCIDENTS,
  NASA_EARTH_SPINOFFS,
  filterInvestigationsByHabitat
} from '@/lib/nasa-data';
import type { Settings } from '@/lib/model';

interface PsiExplorerProps {
  onLoadSimulation?: (settings: Settings, presetName?: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export default function PsiExplorer({ onLoadSimulation, onNavigateToTab }: PsiExplorerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'investigations' | 'history' | 'spinoffs'>('investigations');
  const [habitatFilter, setHabitatFilter] = useState<HabitatEnvironment>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvestigation, setSelectedInvestigation] = useState<PsiInvestigation | null>(null);

  // Filter investigations
  const filteredInvestigations = useMemo(() => {
    let list = filterInvestigationsByHabitat(habitatFilter);
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(inv =>
        inv.acronym.toLowerCase().includes(q) ||
        inv.title.toLowerCase().includes(q) ||
        inv.scientificSummary.toLowerCase().includes(q) ||
        inv.facility.toLowerCase().includes(q) ||
        inv.fuel.toLowerCase().includes(q)
      );
    }
    return list;
  }, [habitatFilter, searchQuery]);

  const { loiRange, quenchRange } = useMemo(() => {
    const list = filteredInvestigations.length ? filteredInvestigations : PSI_INVESTIGATIONS;
    const lois = list.map(i => i.flammabilityMetrics.loi);
    const quenches = list.map(i => i.flammabilityMetrics.quenchDiameterMm);
    return {
      loiRange: `${Math.min(...lois)}% – ${Math.max(...lois)}%`,
      quenchRange: `${Math.min(...quenches).toFixed(1)} – ${Math.max(...quenches).toFixed(1)} mm`
    };
  }, [filteredInvestigations]);

  function exportInvestigationJSON(inv: PsiInvestigation) {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(inv, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nasa-psi-${inv.acronym.toLowerCase()}-data.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  function handleSimulate(inv: PsiInvestigation) {
    if (onLoadSimulation) {
      onLoadSimulation(inv.simulationPreset, `${inv.acronym} — ${inv.facility}`);
    }
  }

  function handleSimulateIncident(inc: HistoricalFireIncident) {
    if (onLoadSimulation) {
      onLoadSimulation(inc.simulationSettings, `${inc.title} Conditions`);
    }
  }

  return (
    <div className="psi-explorer-page">
      {/* Header / Intro */}
      <div className="section-intro">
        <div>
          <div className="eyebrow">
            <span /> NASA PHYSICAL SCIENCE INFORMATICS (PSI)
          </div>
          <h1>Combustion Science & Spaceflight Fire Safety</h1>
          <p>
            Summarize, rank, and interpret microgravity combustion investigations from NASA’s Physical Science
            Informatics (PSI) database. Extract empirical flammability metrics for exploration habitats and connect
            space research to terrestrial fire protection.
          </p>
        </div>
        <div className="intro-actions">
          <a
            href="https://psi.nasa.gov/physci/repo/search?q=combustion"
            target="_blank"
            rel="noreferrer"
            className="secondary"
            title="Browse official NASA PSI database"
          >
            <Database size={14} /> Official NASA PSI Repository <ArrowUpRight size={13} />
          </a>
          <a
            href="https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/"
            target="_blank"
            rel="noreferrer"
            className="quiet"
            title="NASA Glenn Research Center Combustion Science Program"
          >
            <ExternalLink size={14} /> GRC Combustion Program
          </a>
        </div>
      </div>

      {/* Sub-View Navigation Tabs */}
      <div className="psi-subnav">
        <button
          className={'psi-subnav-btn ' + (activeSubTab === 'investigations' ? 'active' : '')}
          onClick={() => setActiveSubTab('investigations')}
        >
          <Database size={15} />
          <span>PSI Flight Investigations ({PSI_INVESTIGATIONS.length})</span>
        </button>
        <button
          className={'psi-subnav-btn ' + (activeSubTab === 'history' ? 'active' : '')}
          onClick={() => setActiveSubTab('history')}
        >
          <ShieldAlert size={15} />
          <span>Spaceflight Fire Lessons ({HISTORICAL_FIRE_INCIDENTS.length})</span>
        </button>
        <button
          className={'psi-subnav-btn ' + (activeSubTab === 'spinoffs' ? 'active' : '')}
          onClick={() => setActiveSubTab('spinoffs')}
        >
          <Globe size={15} />
          <span>Earth Fire Safety Spinoffs ({NASA_EARTH_SPINOFFS.length})</span>
        </button>
      </div>

      {/* SUB-VIEW 1: NASA PSI INVESTIGATIONS */}
      {activeSubTab === 'investigations' && (
        <div className="psi-content-section">
          {/* Habitat Environment Filter Bar & Search */}
          <div className="psi-controls-bar">
            <div className="psi-habitat-filters" role="group" aria-label="Filter by Habitable Crew Environment">
              <span className="psi-filter-label">Target Habitat:</span>
              <button
                className={'psi-filter-pill ' + (habitatFilter === 'all' ? 'active' : '')}
                onClick={() => setHabitatFilter('all')}
              >
                All Environments
              </button>
              <button
                className={'psi-filter-pill ' + (habitatFilter === 'spacecraft' ? 'active' : '')}
                onClick={() => setHabitatFilter('spacecraft')}
              >
                🛰️ Spacecraft & Transit
              </button>
              <button
                className={'psi-filter-pill ' + (habitatFilter === 'station' ? 'active' : '')}
                onClick={() => setHabitatFilter('station')}
              >
                🌌 Space Station (0 g)
              </button>
              <button
                className={'psi-filter-pill ' + (habitatFilter === 'lunar' ? 'active' : '')}
                onClick={() => setHabitatFilter('lunar')}
              >
                🌕 Lunar Base (0.165 g)
              </button>
              <button
                className={'psi-filter-pill ' + (habitatFilter === 'mars' ? 'active' : '')}
                onClick={() => setHabitatFilter('mars')}
              >
                🔴 Martian Base (0.378 g)
              </button>
            </div>

            <div className="psi-search-wrap">
              <Search size={14} className="psi-search-icon" />
              <input
                type="text"
                className="psi-search-input"
                placeholder="Search by mission, fuel, facility..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                aria-label="Search NASA PSI investigations"
              />
              {searchQuery && (
                <button
                  className="psi-search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="psi-stats-strip">
            <div className="psi-stat-card">
              <span className="psi-stat-number">{filteredInvestigations.length}</span>
              <span className="psi-stat-desc">Curated PSI Investigations</span>
            </div>
            <div className="psi-stat-card">
              <span className="psi-stat-number">{loiRange}</span>
              <span className="psi-stat-desc">Limiting Oxygen Index (LOI) Range</span>
            </div>
            <div className="psi-stat-card">
              <span className="psi-stat-number">{quenchRange}</span>
              <span className="psi-stat-desc">Quenching Dimensions in Low-G</span>
            </div>
            <div className="psi-stat-card">
              <span className="psi-stat-number">FLEX-2</span>
              <span className="psi-stat-desc">Cool Flame Phenomenon Documented</span>
            </div>
          </div>

          {/* Investigation Cards Grid */}
          <div className="psi-cards-grid">
            {filteredInvestigations.map(inv => (
              <article key={inv.id} className="psi-inv-card">
                <div className="psi-card-top">
                  <div className="psi-badges-row">
                    <span className="psi-acronym-badge">{inv.acronym}</span>
                    <span className="psi-facility-badge">{inv.facility}</span>
                    <span className="psi-score-badge" title="Algorithmic relevance to habitable spaceflight safety">
                      {inv.relevanceScore}% Crew Relevance
                    </span>
                  </div>
                  <h2 className="psi-card-title">{inv.title}</h2>
                  <div className="psi-card-meta">
                    <span className="psi-meta-item">
                      <b>Fuel:</b> {inv.fuel.toUpperCase()}
                    </span>
                    <span className="psi-meta-item">
                      <b>Regime:</b> {inv.regime}
                    </span>
                    <span className="psi-meta-item">
                      <b>Sponsor:</b> {inv.sponsor}
                    </span>
                  </div>
                </div>

                {/* Target Habitats */}
                <div className="psi-habitats-row">
                  <span className="psi-habitats-label">Habitats:</span>
                  {inv.targetHabitats.map(h => (
                    <span key={h} className="psi-habitat-tag">
                      {h === 'spacecraft' && '🛰️ Spacecraft'}
                      {h === 'station' && '🌌 Station (0g)'}
                      {h === 'lunar' && '🌕 Lunar (0.165g)'}
                      {h === 'mars' && '🔴 Mars (0.378g)'}
                    </span>
                  ))}
                </div>

                {/* Extracted Flammability Metrics */}
                <div className="psi-metrics-box">
                  <div className="psi-metric-header">
                    <Activity size={14} />
                    <span>Extracted Flammability & Extinction Benchmarks</span>
                  </div>
                  <div className="psi-metrics-grid">
                    <div className="psi-metric-cell">
                      <small>Limiting O₂ (LOI)</small>
                      <b>{inv.flammabilityMetrics.loi}% O₂</b>
                    </div>
                    <div className="psi-metric-cell">
                      <small>{inv.acronym === 'BASS-II' ? 'Quench Thickness' : 'Quench Diameter'}</small>
                      <b>{inv.flammabilityMetrics.quenchDiameterMm} mm</b>
                    </div>
                    <div className="psi-metric-cell">
                      <small>Radiation Loss Fraction</small>
                      <b>{Math.round(inv.flammabilityMetrics.radiationFraction * 100)}%</b>
                    </div>
                    <div className="psi-metric-cell">
                      <small>Critical Strain Rate</small>
                      <b>{inv.flammabilityMetrics.extinctionStrainRate}</b>
                    </div>
                    <div className="psi-metric-cell psi-metric-cell-wide">
                      <small>Flame Spread Rate</small>
                      <b>{inv.flammabilityMetrics.flameSpreadRate}</b>
                    </div>
                  </div>
                  {inv.flammabilityMetrics.coolFlameObserved && (
                    <div className="psi-cool-flame-note">
                      <Flame size={13} />
                      <span>
                        <b>Cool Flame Observed:</b> Low-temperature quasi-steady burning continues invisibly at ~600–800 K
                        after luminous flame extinction.
                      </span>
                    </div>
                  )}
                </div>

                {/* SI Scientific Summary */}
                <div className="psi-summary-block">
                  <h3>Scientific Informatics Synthesis:</h3>
                  <p>{inv.scientificSummary}</p>
                </div>

                {/* Predictive Exploration Insights & Controls */}
                <div className="psi-insights-accordion">
                  <div className="psi-insight-item">
                    <b>Predictive Modeling Application:</b>
                    <p>{inv.predictiveInsight}</p>
                  </div>
                  <div className="psi-insight-item">
                    <b>Next-Generation Controls Impact:</b>
                    <p>{inv.nextGenControls}</p>
                  </div>
                </div>

                {/* Earth Spinoff Callout */}
                <div className="psi-spinoff-ribbon">
                  <Globe size={14} />
                  <div>
                    <b>Earth Application ({inv.earthSpinoff.spinoffId}):</b> {inv.earthSpinoff.title} —{' '}
                    <span>{inv.earthSpinoff.impact}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="psi-card-actions">
                  <button
                    className="primary psi-simulate-btn"
                    onClick={() => handleSimulate(inv)}
                    title={`Load ${inv.acronym} parameters into Combustion Lab`}
                  >
                    <Play size={14} /> Simulate in Combustion Lab
                  </button>
                  <button
                    className="secondary"
                    onClick={() => exportInvestigationJSON(inv)}
                    title="Export structured PSI dataset as JSON"
                  >
                    <Download size={14} /> Export JSON
                  </button>
                  <a
                    href={inv.psiUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="quiet psi-psi-link"
                    title="View on NASA PSI repository"
                  >
                    <ExternalLink size={13} /> PSI Repo
                  </a>
                  {inv.videoUrl && (
                    <a
                      href={inv.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="quiet psi-psi-link"
                      title="Watch NASA ISS Microgravity Flame Video"
                    >
                      <Video size={13} /> Video
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>

          {!filteredInvestigations.length && (
            <div className="empty-state">
              <Search size={36} />
              <h2>No NASA investigations found.</h2>
              <p>Try clearing your search query or selecting "All Environments".</p>
              <button
                className="secondary"
                onClick={() => {
                  setSearchQuery('');
                  setHabitatFilter('all');
                }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: HISTORICAL SPACEFLIGHT FIRE INCIDENTS */}
      {activeSubTab === 'history' && (
        <div className="psi-history-section">
          <div className="psi-history-banner">
            <ShieldAlert size={22} />
            <div>
              <h2>Spaceflight Fire Case Studies & Safety Governance</h2>
              <p>
                Spacecraft fire safety rules were forged through catastrophic accidents and near-misses. These case
                studies examine the fundamental combustion mechanisms, lessons learned, and NASA Safety & Mission
                Assurance protocols established to safeguard future exploration crews.
              </p>
            </div>
          </div>

          <div className="psi-history-cards">
            {HISTORICAL_FIRE_INCIDENTS.map(inc => (
              <article key={inc.id} className="psi-history-card">
                <div className="psi-hist-header">
                  <div className="psi-hist-badge-row">
                    <span className="psi-hist-badge danger">INCIDENT RECORD</span>
                    <span className="psi-hist-date">{inc.date}</span>
                    <span className="psi-hist-gravity">
                      {inc.gravity === 1.0 ? '1.0 g Ground' : '0.00001 g Deep Space'}
                    </span>
                  </div>
                  <h2>{inc.title}</h2>
                  <p className="psi-hist-mission">
                    <b>Mission / Vehicle:</b> {inc.mission}
                  </p>
                </div>

                <div className="psi-hist-env-box">
                  <div className="psi-hist-env-item">
                    <small>Atmospheric Environment:</small>
                    <b>{inc.environment}</b>
                  </div>
                  <div className="psi-hist-env-item">
                    <small>Crew Outcome:</small>
                    <b style={{ color: inc.id === 'apollo-1' ? 'var(--danger)' : 'var(--mint)' }}>
                      {inc.crewImpact}
                    </b>
                  </div>
                </div>

                <div className="psi-hist-body">
                  <div className="psi-hist-section">
                    <h3>Root Cause & Ignition:</h3>
                    <p>{inc.rootCause}</p>
                  </div>

                  <div className="psi-hist-section">
                    <h3>Combustion Physics & Mechanisms:</h3>
                    <p>{inc.combustionMechanisms}</p>
                  </div>

                  <div className="psi-hist-section">
                    <h3>Permanent NASA Engineering Standards Instituted:</h3>
                    <ul className="psi-hist-lessons">
                      {inc.lessonsLearned.map((l, i) => (
                        <li key={i}>{l}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="psi-hist-correlation">
                    <Activity size={14} />
                    <div>
                      <b>NASA PSI Research Correlation:</b>
                      <p>{inc.psiCorrelation}</p>
                    </div>
                  </div>
                </div>

                <div className="psi-hist-footer">
                  <button
                    className="primary psi-simulate-btn"
                    onClick={() => handleSimulateIncident(inc)}
                    title={`Simulate ${inc.title} atmospheric conditions in Lab`}
                  >
                    <Play size={14} /> Simulate Atmosphere in Combustion Lab
                  </button>
                  <a
                    href={inc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="secondary"
                    title="Read official NASA Safety & Mission Assurance Case Study"
                  >
                    NASA Safety Case Study <ExternalLink size={13} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: EARTH FIRE SAFETY SPINOFFS */}
      {activeSubTab === 'spinoffs' && (
        <div className="psi-spinoffs-section">
          <div className="psi-spinoffs-banner">
            <Globe size={22} />
            <div>
              <h2>From the Space Station to Terrestrial Fire Safety</h2>
              <p>
                NASA microgravity combustion research conducted aboard drop towers and the ISS has delivered critical
                innovations to Earth, replacing hazardous extinguishing chemicals, eliminating false alarms, and
                protecting municipal firefighters.
              </p>
            </div>
          </div>

          <div className="psi-spinoffs-grid">
            {NASA_EARTH_SPINOFFS.map(spin => (
              <article key={spin.id} className="psi-spinoff-card">
                <div className="psi-spinoff-top">
                  <div className="psi-spinoff-badges">
                    <span className="psi-spinoff-node">{spin.spinoffNode}</span>
                    <span className="psi-spinoff-tag">NASA Technology Transfer</span>
                  </div>
                  <h3>{spin.title}</h3>
                </div>

                <div className="psi-spinoff-content">
                  <div className="psi-spinoff-block">
                    <b>NASA Spaceflight Origin:</b>
                    <p>{spin.nasaOrigin}</p>
                  </div>

                  <div className="psi-spinoff-block">
                    <b>Terrestrial Commercial Application:</b>
                    <p>{spin.terrestrialApplication}</p>
                  </div>

                  <div className="psi-spinoff-block">
                    <b>Commercial & Safety Benefit:</b>
                    <p>{spin.commercialBenefit}</p>
                  </div>

                  <div className="psi-spinoff-ember-box">
                    <Shield size={16} />
                    <div>
                      <b>How Ember Integrates This Innovation:</b>
                      <p>{spin.emberRelation}</p>
                    </div>
                  </div>
                </div>

                <div className="psi-spinoff-footer">
                  {spin.id === 'spinoff-smoke-detection' && onNavigateToTab && (
                    <button
                      className="primary"
                      onClick={() => onNavigateToTab('guardian')}
                      title="Inspect Ember Guardian 3D IoT Hardware Node"
                    >
                      <Cpu size={14} /> Inspect Ember Guardian Node →
                    </button>
                  )}
                  {spin.id === 'spinoff-water-mist' && onNavigateToTab && (
                    <button
                      className="primary"
                      onClick={() => onNavigateToTab('lab')}
                      title="Test suppression physics in Virtual Combustion Lab"
                    >
                      <Flame size={14} /> Test Suppression in Lab →
                    </button>
                  )}
                  <a
                    href={spin.url}
                    target="_blank"
                    rel="noreferrer"
                    className="secondary psi-spinoff-link"
                    title="View official NASA Spinoff article"
                  >
                    Official NASA Spinoff Article <ExternalLink size={13} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
