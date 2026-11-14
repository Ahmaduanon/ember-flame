'use client';
import { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Battery,
  Bell,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Download,
  ExternalLink,
  Eye,
  Flame,
  Globe,
  Info,
  Maximize2,
  Radio,
  RotateCcw,
  Sliders,
  Thermometer,
  Volume2,
  Wifi,
  Wind,
  X,
  Zap
} from 'lucide-react';
import GuardianRender, {
  GUARDIAN_HOTSPOTS,
  type Hotspot,
  type DeviceState
} from './guardian-render';

export default function GuardianView() {
  const [temperature, setTemperature] = useState(32.4);
  const [deviceState, setDeviceState] = useState<DeviceState>('warning');
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(GUARDIAN_HOTSPOTS[0]);
  const [cameraPreset, setCameraPreset] = useState<'isometric' | 'front' | 'side' | 'back'>('isometric');
  const [blueprintModalOpen, setBlueprintModalOpen] = useState(false);

  // Apply state preset
  const setPreset = (temp: number, state: DeviceState, presetCam?: 'isometric' | 'front') => {
    setTemperature(temp);
    setDeviceState(state);
    if (presetCam) setCameraPreset(presetCam);
  };

  const handleSelectHotspot = (hs: Hotspot | null) => {
    setSelectedHotspot(hs);
    if (!hs) {
      setCameraPreset('isometric');
    }
  };

  return (
    <div className="guardian-page">
      {/* Page Header */}
      <div className="section-intro guardian-intro">
        <div>
          <div className="eyebrow">
            <Cpu size={14} /> HARDWARE BLUEPRINT & SPECIFICATION
          </div>
          <h1>Smart Temperature Monitoring Device</h1>
          <p className="guardian-tagline">“Monitor. Alert. Stay Safe.”</p>
        </div>
        <div className="intro-actions">
          <a
            href="https://spinoff.nasa.gov/node/9407"
            target="_blank"
            rel="noreferrer"
            className="secondary"
            title="NASA Spinoff #9407: Intelligent smoke & multi-criteria fire detection derived from ISS CIR research"
          >
            <Globe size={14} />
            <span>NASA Spinoff #9407</span>
            <ArrowUpRight size={13} />
          </a>
          <button
            className="secondary"
            onClick={() => setBlueprintModalOpen(true)}
            title="Inspect original engineering blueprint sketch"
          >
            <Eye size={14} />
            <span>View Blueprint Sketch</span>
          </button>
          <button
            className="quiet"
            onClick={() => {
              setPreset(32.4, 'warning', 'isometric');
              setSelectedHotspot(GUARDIAN_HOTSPOTS[0]);
            }}
            title="Reset model to blueprint reference state"
          >
            <RotateCcw size={13} />
            <span>Reset View</span>
          </button>
        </div>
      </div>

      {/* Main 3D Interactive Stage */}
      <div className="guardian-stage-grid">
        {/* Left Column: 3D WebGL Canvas */}
        <div className="guardian-stage-canvas-panel">
          <div className="guardian-stage-header">
            <div className="guardian-stage-title">
              <b>Interactive 3D Hardware Model</b>
              <span className="badge-mono">1:1 SCALE · 70×70×28 mm</span>
            </div>
            <div className="guardian-stage-badge">
              <span
                className={`led-indicator-dot ${
                  deviceState === 'alarm'
                    ? 'red'
                    : deviceState === 'warning'
                    ? 'amber'
                    : 'green'
                }`}
              />
              <span className="mono">{temperature.toFixed(1)}°C</span>
            </div>
          </div>

          <div className="guardian-stage-render-container">
            <GuardianRender
              temperature={temperature}
              deviceState={deviceState}
              selectedHotspotId={selectedHotspot?.id}
              onSelectHotspot={handleSelectHotspot}
              cameraPreset={cameraPreset}
            />
          </div>

          {/* Quick Camera Angle Bar */}
          <div className="guardian-cam-bar">
            <span className="cam-bar-label">CAMERA PRESETS:</span>
            <div className="cam-bar-buttons">
              <button
                className={cameraPreset === 'isometric' && !selectedHotspot ? 'active' : ''}
                onClick={() => {
                  setSelectedHotspot(null);
                  setCameraPreset('isometric');
                }}
              >
                Isometric 3D
              </button>
              <button
                className={selectedHotspot?.id === 'display' ? 'active' : ''}
                onClick={() => {
                  setSelectedHotspot(GUARDIAN_HOTSPOTS[0]);
                  setCameraPreset('front');
                }}
              >
                Front View
              </button>
              <button
                className={selectedHotspot?.id === 'vents' ? 'active' : ''}
                onClick={() => {
                  setSelectedHotspot(GUARDIAN_HOTSPOTS[3]);
                  setCameraPreset('side');
                }}
              >
                Side (Vents)
              </button>
              <button
                className={selectedHotspot?.id === 'mount' ? 'active' : ''}
                onClick={() => {
                  setSelectedHotspot(GUARDIAN_HOTSPOTS[5]);
                  setCameraPreset('back');
                }}
              >
                Rear (Mount & Port)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live State Simulator & Hotspot Inspector */}
        <div className="guardian-stage-sidebar">
          {/* Live Device State Simulator */}
          <div className="guardian-card simulator-card">
            <div className="card-header">
              <div className="card-title">
                <Sliders size={16} />
                <b>Simulate Device State</b>
              </div>
              <span className="status-chip">{deviceState.toUpperCase()}</span>
            </div>

            <div className="preset-toggle-group">
              <button
                className={'preset-btn ' + (deviceState === 'nominal' ? 'active nominal' : '')}
                onClick={() => setPreset(21.5, 'nominal')}
              >
                <span className="preset-dot green" />
                <div className="preset-info">
                  <b>Nominal</b>
                  <small>21.5°C · Safe</small>
                </div>
              </button>
              <button
                className={'preset-btn ' + (deviceState === 'warning' ? 'active warning' : '')}
                onClick={() => setPreset(32.4, 'warning')}
              >
                <span className="preset-dot amber" />
                <div className="preset-info">
                  <b>Warning</b>
                  <small>32.4°C · Blueprint</small>
                </div>
              </button>
              <button
                className={'preset-btn ' + (deviceState === 'alarm' ? 'active alarm' : '')}
                onClick={() => setPreset(54.0, 'alarm')}
              >
                <span className="preset-dot red" />
                <div className="preset-info">
                  <b>Critical Alarm</b>
                  <small>54.0°C · High Heat</small>
                </div>
              </button>
            </div>

            {/* Custom Temperature Slider */}
            <div className="guardian-temp-slider">
              <div className="temp-slider-header">
                <label htmlFor="guardian-temp">Thermal Setpoint</label>
                <span className="mono font-bold">{temperature.toFixed(1)} °C</span>
              </div>
              <input
                id="guardian-temp"
                type="range"
                min={-10}
                max={60}
                step={0.5}
                value={temperature}
                onChange={e => {
                  const val = Number(e.target.value);
                  setTemperature(val);
                  if (val >= 48) setDeviceState('alarm');
                  else if (val >= 28) setDeviceState('warning');
                  else setDeviceState('nominal');
                }}
              />
              <div className="slider-ticks">
                <span>-10°C (Min)</span>
                <span>28°C (Warn)</span>
                <span>48°C (Alarm)</span>
                <span>60°C (Max)</span>
              </div>
            </div>
          </div>

          {/* Hotspot & Component Inspector */}
          <div className="guardian-card hotspot-card">
            <div className="card-header">
              <div className="card-title">
                <Info size={16} />
                <b>Component Blueprint Callouts</b>
              </div>
              <small className="muted">Click to focus 3D camera</small>
            </div>

            <div className="hotspot-pill-grid">
              {GUARDIAN_HOTSPOTS.map(hs => (
                <button
                  key={hs.id}
                  className={`hotspot-pill-btn ${selectedHotspot?.id === hs.id ? 'active' : ''}`}
                  onClick={() => handleSelectHotspot(hs)}
                >
                  <span>{hs.name.split(' ')[0]}</span>
                  <ChevronRight size={13} />
                </button>
              ))}
            </div>

            {selectedHotspot && (
              <div className="hotspot-detail-pane">
                <div className="hotspot-detail-header">
                  <div>
                    <h3 className="hotspot-detail-title">{selectedHotspot.name}</h3>
                    <p className="hotspot-detail-sub">{selectedHotspot.subtitle}</p>
                  </div>
                </div>

                <div className="blueprint-callout-quote">
                  <span className="blueprint-tag">BLUEPRINT CALLOUT</span>
                  <p>{selectedHotspot.blueprintCallout}</p>
                </div>

                <p className="hotspot-description">{selectedHotspot.description}</p>

                <div className="hotspot-specs-list">
                  {selectedHotspot.specs.map((s, idx) => (
                    <div key={idx} className="spec-row">
                      <span className="spec-label">{s.label}</span>
                      <span className="spec-value mono">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Blueprint Technical Specifications Section */}
      <div className="guardian-bottom-grid">
        {/* Left: Technical Specifications Table (Exact Blueprint Match) */}
        <div className="guardian-card specs-card">
          <div className="card-header">
            <div className="card-title">
              <Activity size={18} />
              <div>
                <h2>Technical Specifications</h2>
                <small className="muted">Verified against engineering blueprint draft</small>
              </div>
            </div>
            <span className="badge-pill">REV 1.0</span>
          </div>

          <div className="specs-table">
            <div className="specs-table-row">
              <div className="specs-th">Dimensions</div>
              <div className="specs-td mono">70 mm × 70 mm × 28 mm</div>
            </div>
            <div className="specs-table-row">
              <div className="specs-th">Weight</div>
              <div className="specs-td mono">~80 g (with internal battery)</div>
            </div>
            <div className="specs-table-row">
              <div className="specs-th">Power Supply</div>
              <div className="specs-td">
                <b>5V DC (USB-C)</b> or Rechargeable Internal Li-Po Battery
              </div>
            </div>
            <div className="specs-table-row">
              <div className="specs-th">Connectivity</div>
              <div className="specs-td">
                <b>Wi-Fi (2.4 GHz, 802.11 b/g/n)</b> · REST & WebSocket
              </div>
            </div>
            <div className="specs-table-row">
              <div className="specs-th">Temperature Range</div>
              <div className="specs-td mono">-10°C to 60°C</div>
            </div>
            <div className="specs-table-row">
              <div className="specs-th">Accuracy</div>
              <div className="specs-td mono">±0.5°C (calibrated factory baseline)</div>
            </div>
            <div className="specs-table-row">
              <div className="specs-th">Alert Methods</div>
              <div className="specs-td">
                Tri-color Status LED, On-screen OLED, 85 dB Sounder & Cloud Push
              </div>
            </div>
          </div>
        </div>

        {/* Right: Key Features (from Blueprint) */}
        <div className="guardian-card features-card">
          <div className="card-header">
            <div className="card-title">
              <Cpu size={18} />
              <div>
                <h2>Key Hardware Features</h2>
                <small className="muted">Core functionality outlined in design draft</small>
              </div>
            </div>
          </div>

          <div className="features-icon-grid">
            <div className="feature-item">
              <div className="feature-icon-wrap">
                <Thermometer size={18} className="text-amber-500" />
              </div>
              <div>
                <b>Real-Time Temperature Monitoring</b>
                <p>Continuous thermal sensing with 1.0 Hz ambient updates.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-wrap">
                <AlertTriangle size={18} className="text-danger" />
              </div>
              <div>
                <b>High Heat Alerts</b>
                <p>Audible, visual, and screen warnings upon threshold breach.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-wrap">
                <Wifi size={18} className="text-sky-500" />
              </div>
              <div>
                <b>IoT Connectivity</b>
                <p>Seamless local LAN communication with Ember hub & cloud.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-wrap">
                <Zap size={18} className="text-emerald-500" />
              </div>
              <div>
                <b>Compact & Modern Design</b>
                <p>Squircle 70mm aesthetic with dual wall-mount holes.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-wrap">
                <Battery size={18} className="text-purple-500" />
              </div>
              <div>
                <b>Long Battery Life</b>
                <p>Ultra-low power deep sleep profile for multi-month runtime.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* "How It Works" 4-Step Technical Architecture */}
      <div className="guardian-card architecture-section">
        <div className="card-header">
          <div className="card-title">
            <Radio size={18} />
            <div>
              <h2>How The Ember Guardian Works</h2>
              <small className="muted">Four-stage autonomous physical edge architecture</small>
            </div>
          </div>
        </div>

        <div className="architecture-steps-grid">
          <div className="architecture-step-card">
            <div className="step-num">01</div>
            <div className="step-icon">
              <Wind size={20} />
            </div>
            <h3>Convective Sampling</h3>
            <p>
              Air passively enters the chassis through 7 lateral ventilation gills, passing
              directly over an isolated digital thermistor without thermal throttling from the MCU.
            </p>
          </div>

          <div className="architecture-step-card">
            <div className="step-num">02</div>
            <div className="step-icon">
              <Cpu size={20} />
            </div>
            <h3>Edge Rate-of-Rise Analysis</h3>
            <p>
              Onboard ESP32-S3 microcontroller computes local $dT/dt$ derivatives. Rapid thermal
              spikes trigger pre-emptive alarms before absolute temperature limits are reached.
            </p>
          </div>

          <div className="architecture-step-card">
            <div className="step-num">03</div>
            <div className="step-icon">
              <Volume2 size={20} />
            </div>
            <h3>Multi-Sensory Alerting</h3>
            <p>
              Simultaneously pulses the tri-color LED capsule, sounds the 85 dB acoustic
              piezo resonator, and updates the OLED display with explicit actionable directions.
            </p>
          </div>

          <div className="architecture-step-card">
            <div className="step-num">04</div>
            <div className="step-icon">
              <Bell size={20} />
            </div>
            <h3>Local & Cloud Synchronization</h3>
            <p>
              Transmits encrypted JSON telemetry over 2.4 GHz Wi-Fi to your local Ember Hub and
              pushes instant notifications to all connected devices.
            </p>
          </div>
        </div>
      </div>

      {/* Blueprint Sketch Modal */}
      {blueprintModalOpen && (
        <div className="blueprint-modal-backdrop" onClick={() => setBlueprintModalOpen(false)}>
          <div className="blueprint-modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="blueprint-modal-header">
              <div className="blueprint-modal-title">
                <Eye size={18} />
                <div>
                  <b>Original Engineering Blueprint Draft</b>
                  <small>Smart Temperature Monitoring Device · 70mm × 70mm × 28mm</small>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href="/blueprint-guardian.png"
                  download="ember-guardian-blueprint.png"
                  className="icon-button"
                  title="Download original blueprint image"
                >
                  <Download size={16} />
                </a>
                <button
                  className="icon-button"
                  onClick={() => setBlueprintModalOpen(false)}
                  title="Close blueprint modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="blueprint-modal-body">
              <img
                src="/blueprint-guardian.png"
                alt="Smart Temperature Monitoring Device Engineering Blueprint"
                className="blueprint-modal-img"
              />
            </div>

            <div className="blueprint-modal-footer">
              <span className="mono text-muted text-xs">
                SOURCE: User uploaded hardware blueprint · Ember Guardian Revision 1.0
              </span>
              <button className="primary" onClick={() => setBlueprintModalOpen(false)}>
                Back to 3D Render
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
