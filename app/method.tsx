import { ArrowUpRight, Beaker, BookOpen, Check, Code2, Gauge, Info, Wind, ExternalLink } from 'lucide-react';

export default function Method() {
  return (
    <div className="method-page">
      <div className="section-intro">
        <div>
          <div className="eyebrow"><span /> UNDER THE HOOD</div>
          <h1>A model you can inspect.</h1>
          <p>Understand the physics, governing equations, and assumptions before interpreting numbers.</p>
        </div>
        <span className="tag" style={{ color: 'var(--mint)', borderColor: 'var(--mint)', fontSize: '11px', padding: '4px 10px' }}>
          EMBER-ROM 0.1 · REDUCED-ORDER MODEL
        </span>
      </div>

      <div className="model-banner">
        <Beaker size={24} />
        <div>
          <h2>Educational Reduced-Order Combustion Simulation</h2>
          <p>
            The app integrates an illustrative heat and species balance. It demonstrates fundamental mechanisms; it has not been calibrated or validated against experimental CFD and cannot establish real extinction limits or certified safety decisions.
          </p>
        </div>
      </div>

      <div className="method-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>01 / What is calculated</h2>
            <Code2 size={18} />
          </div>
          <p style={{ fontSize: '13px', marginBottom: '12px' }}>
            A small, well-mixed control volume tracks gas temperature and fuel / oxygen inventories. Fuel enters continuously; an illustrative exchange term supplies oxygen. Reaction consumes both inventories and releases heat.
          </p>
          <div className="equation">
            <code>C · dT/dt = Q̇reaction − Q̇radiation − Q̇transfer</code>
          </div>
          <div className="equation">
            <code>dmO₂/dt = k · (mO₂,ambient − mO₂) − s · ṁburn</code>
          </div>
          <div className="equation">
            <code>dmfuel/dt = ṁin − ṁburn − 0.12 k · mfuel</code>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '10px' }}>
            Radiation uses a Stefan–Boltzmann term. Heat transfer combines an illustrative linear loss and a gravity-dependent convection coefficient. The fixed timestep is 0.025s; traces sample every 0.5s.
          </p>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>02 / Where gravity enters</h2>
            <Wind size={18} />
          </div>
          <p style={{ fontSize: '13px', marginBottom: '12px' }}>
            Gravity alters an assumed mixing rate, heat-transfer coefficient, and geometric reconstruction. Near zero gravity the geometry becomes spherical, with diffusion-like supply remaining. At higher gravity it stretches upward into a buoyant plume.
          </p>
          <div className="equation">
            <code>k = 0.9 + 4 √(g / gEarth) s⁻¹</code>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '10px' }}>
            These are chosen teaching coefficients, not empirical correlations. The model assumes a quiescent ambient gas at approximately 1 atmosphere and a small porous fuel source. Moon and Mars presets alter gravity only.
          </p>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>03 / How to read the visuals</h2>
            <Gauge size={18} />
          </div>
          <p style={{ fontSize: '13px', marginBottom: '10px' }}>
            The flame boundary, flow arrows, and spatial temperature / concentration fields are schematic reconstructions. They are not a solved velocity field or a quantitative concentration map. Color is illustrative.
          </p>
          <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>
            • <b>Gas temperature:</b> Lumped volume estimate, not a resolved flame peak.
          </p>
          <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>
            • <b>Flame size:</b> Illustrative geometry based on power and buoyancy scaling.
          </p>
          <p style={{ fontSize: '12px', color: 'var(--muted)' }}>
            • <b>Burn state:</b> Extinction is triggered after 1.2s below 700 K or below 0.015 mg/s reaction rate.
          </p>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>04 / What is not represented</h2>
            <BookOpen size={18} />
          </div>
          <ul className="method-list">
            <li>Detailed chemical kinetics or premixed-flame limits</li>
            <li>Resolved Navier-Stokes flow, forced ventilation, or turbulent blowoff</li>
            <li>Soot formation, emission spectra, cool flames or toxic products</li>
            <li>Droplet evaporation, solid fuels, pressure variation or wall geometry</li>
            <li>Automatic control of any physical suppression equipment</li>
          </ul>
          <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '10px' }}>
            For research-grade engineering: choose geometry, implement a validated solver, and compare against calibrated NIST/NASA measurements.
          </p>
        </section>
      </div>

      <section className="panel">
        <div className="panel-heading">
          <h2>Model constants & experiment assumptions</h2>
          <span className="tag">ILLUSTRATIVE VALUES</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Quantity</th>
                <th>Value</th>
                <th>Physical Interpretation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>Thermal capacity (C)</b></td>
                <td><code className="mono">0.045 J/K</code></td>
                <td>Chosen lumped gas control-volume heat capacity</td>
              </tr>
              <tr>
                <td><b>Reference gas mass</b></td>
                <td><code className="mono">8 mg</code></td>
                <td>Used to establish ambient oxygen inventory baseline</td>
              </tr>
              <tr>
                <td><b>Effective emissivity (ε)</b></td>
                <td><code className="mono">0.12</code></td>
                <td>Chosen constant Stefan–Boltzmann emission term</td>
              </tr>
              <tr>
                <td><b>Fuel heats of combustion</b></td>
                <td><code className="mono">50 / 46.4 / 26.8 MJ/kg</code></td>
                <td>Approximate values for Methane / Propane / Ethanol</td>
              </tr>
              <tr>
                <td><b>O₂-to-fuel mass ratios</b></td>
                <td><code className="mono">4.000 / 3.636 / 2.087</code></td>
                <td>Stoichiometric complete-oxidation mass ratios</td>
              </tr>
              <tr>
                <td><b>Oxygen dilution experiment</b></td>
                <td><code className="mono">min(initial O₂, 9%)</code></td>
                <td>Boundary condition shift; tests suppression threshold</td>
              </tr>
              <tr>
                <td><b>Enhanced cooling experiment</b></td>
                <td><code className="mono">4 × transfer coeff</code></td>
                <td>Illustrative loss increase; simulates thermal quenching</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel sources">
        <div className="panel-heading">
          <h2>NASA Combustion Science, PSI Data & Spinoff References</h2>
          <Info size={16} />
        </div>
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '14px' }}>
          Official NASA flight research, Physical Science Informatics (PSI) data repositories, historical fire safety
          case studies, and commercial technology transfer articles:
        </p>

        <div className="sources-category-title">NASA Combustion Science Program & Research Repositories</div>
        <a href="https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/" target="_blank" rel="noreferrer">
          <span><b>NASA Glenn Research Center</b> · Physical Sciences Program: Combustion Science</span>
          <ArrowUpRight size={16} />
        </a>
        <a href="https://psi.nasa.gov/physci/repo/search?q=combustion" target="_blank" rel="noreferrer">
          <span><b>NASA Physical Science Informatics (PSI)</b> · Open Research Repository for Microgravity Combustion</span>
          <ArrowUpRight size={16} />
        </a>
        <a href="https://www.youtube.com/watch?v=W1oXykoz9zg" target="_blank" rel="noreferrer">
          <span><b>NASA Science</b> · Flames in Space — Spherical Diffusion & Cool Flames on the ISS (Video)</span>
          <ArrowUpRight size={16} />
        </a>
        <a href="https://science.nasa.gov/biological-physical/investigations/s-flame/" target="_blank" rel="noreferrer">
          <span><b>NASA Biological & Physical Sciences</b> · Structure and Response of Spherical Flames (S-Flame)</span>
          <ArrowUpRight size={16} />
        </a>
        <a href="https://ntrs.nasa.gov/citations/20010074022" target="_blank" rel="noreferrer">
          <span><b>NASA Technical Reports Server (NTRS)</b> · Unsteady Spherical Diffusion Flames in Microgravity</span>
          <ArrowUpRight size={16} />
        </a>

        <div className="sources-category-title" style={{ marginTop: '16px' }}>Historical Spaceflight Fire Safety Case Studies</div>
        <a href="https://sma.nasa.gov/sma-disciplines/accllp/apollo-1" target="_blank" rel="noreferrer">
          <span><b>NASA Safety & Mission Assurance</b> · Apollo 1 (AS-204) — Hyper-Oxygenated Flammability & Material Limits</span>
          <ArrowUpRight size={16} />
        </a>
        <a href="https://sma.nasa.gov/sma-disciplines/accllp/apollo-13" target="_blank" rel="noreferrer">
          <span><b>NASA Safety & Mission Assurance</b> · Apollo 13 — High-Pressure Cryogenic Oxygen Tank Ignition</span>
          <ArrowUpRight size={16} />
        </a>
        <a href="https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/" target="_blank" rel="noreferrer">
          <span><b>NASA History Office</b> · 25 Years Ago: The Fire Aboard Space Station Mir & Zero-G Smoke Stagnation</span>
          <ArrowUpRight size={16} />
        </a>

        <div className="sources-category-title" style={{ marginTop: '16px' }}>NASA Technology Spinoffs & Terrestrial Fire Safety</div>
        <a href="https://spinoff.nasa.gov/node/9582" target="_blank" rel="noreferrer">
          <span><b>NASA Spinoff #9582</b> · Fine-Water-Mist Fire Extinguishers (Halon & PFAS Replacement)</span>
          <ArrowUpRight size={16} />
        </a>
        <a href="https://spinoff.nasa.gov/node/9407" target="_blank" rel="noreferrer">
          <span><b>NASA Spinoff #9407</b> · Multi-Criteria Optical/Electrochemical Smoke Alarms (Ember Guardian Lineage)</span>
          <ArrowUpRight size={16} />
        </a>
        <a href="https://spinoff.nasa.gov/node/9918" target="_blank" rel="noreferrer">
          <span><b>NASA Spinoff #9918</b> · Firefighter Protective Turnout Gear & High-Temperature Textiles</span>
          <ArrowUpRight size={16} />
        </a>
      </section>
    </div>
  );
}
