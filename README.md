# Ember — NASA Spaceflight Fire Safety & Combustion Science Platform

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg)](https://vitejs.dev/)
[![Vercel](https://img.shields.io/badge/Vercel-Ready-black.svg?logo=vercel)](https://vercel.com)
[![Tests](https://img.shields.io/badge/Tests-34%20Passed-success.svg)](./tests)
[![License](https://img.shields.io/badge/License-MIT-orange.svg)](./THIRD-PARTY-NOTICES.txt)

Ember is an advanced, SI-powered web platform designed for space exploration fire safety and terrestrial habitat protection. It synthesizes empirical microgravity combustion science from NASA's **Physical Science Informatics (PSI)** repository, multimodal visual AI habitat inspections, automated spaceflight fire safety auditing (**NASA-STD-6001**, Apollo 1/13, Mir 1997), an interactive 2D spatial hazard planner with drag-and-drop item manipulation, a blueprint-accurate 3D hardware stage for the **Ember Guardian** multi-sensor node (**NASA Spinoff #9407** heritage), and a real-time microgravity flame simulation engine (**`EMBER-ROM 0.1`**).

---

## System Overview & Core Capabilities

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       EMBER FLAME LAB PLATFORM                              │
├──────────────────────────────────────┬──────────────────────────────────────┤
│        SPACE SAFETY & AUDITING       │       COMBUSTION SCIENCE & PSI       │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ • Multimodal AI Visual Survey        │ • NASA PSI Flight Explorer           │
│   (Google Gemini Flash & Ollama)     │   (ACME, FLEX-2, BASS-II, SOFIE)     │
│ • NASA Spaceflight Audit Engine      │ • Microgravity Flame Simulator       │
│   (NASA-STD-6001, Apollo, Mir)       │   (0g Flame Balls, 1g Teardrops)     │
│ • Mission Habitat Certifications     │ • Empirical Benchmark Calibration    │
│   (ISS, Lunar Artemis, Mars, Rover)  │   (LOI, Quench Dia, Heat Release)    │
│ • 2D Hazard Floorplan Scanner        │ • Historical Fire Incident Presets   │
│   (Drag-and-drop spatial clearances) │   (Apollo 1, Apollo 13, Mir 1997)    │
│ • Authentic Astronaut Spaces         │ • Earth Fire Safety Spinoffs         │
│   (Artemis Rover, ISS Lab, Moon Hab) │   (Water Mist #9582, Sensors #9407)  │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

---

### 1. NASA Physical Science Informatics (PSI) Explorer
A dedicated, interactive repository that summarizes, ranks, and interprets low-gravity combustion investigations conducted aboard the International Space Station (ISS):
- **Curated Flight Investigations**:
  - **ACME** (*Advanced Combustion via Microgravity Experiments*): Spherical gaseous diffusion flames and radiative heat loss envelopes.
  - **FLEX-2** (*Flame Extinguishment Experiment 2*): Droplet burning and low-temperature "cool flame" quasi-steady burning (~600–800 K).
  - **BASS-II** (*Burning and Suppression of Solids*): Solid fuel slab ignition and microgravity airflow suppression limits.
  - **BRE** (*Burning Rate Emulator*): Gaseous burners simulating solid fuel gasification rates.
  - **SOFIE** (*Solid Fuel Ignition and Extinction*): Flammability envelopes under elevated oxygen and variable low pressures.
  - **S-Flame** (*Stretched Diffusion Flames*): Flame stretch extinction limits across Earth, Lunar ($0.166\,g$), and Martian ($0.38\,g$) gravities.
- **Habitat Relevance Filtering**: Filter research benchmarks by crew environment:
  - 🛰️ **Spacecraft** (Transient vehicles & capsules)
  - 🌌 **Space Station** (ISS & commercial LEO outposts)
  - 🌕 **Lunar Habitats & Gateway** ($8.2\text{ psia} \cdot 34\%\,\text{O}_2 \cdot 0.166\,g$)
  - 🔴 **Mars Surface Bases & Rovers** ($8.0\text{ psia} \cdot 32\%\,\text{O}_2 \cdot 0.38\,g$)
- **Empirical Flammability Metrics**: Displays Limiting Oxygen Index (LOI), Quench Diameter ($d_q$), Radiative Heat Loss Fraction ($\chi_{\text{rad}}$), and Flame Spread Rate ($S_L$).
- **1-Click Simulation Loading**: Instantly transfers flight experiment parameters into the Ember Combustion Lab.
- **Dataset Export**: One-click download of the complete NASA PSI investigation dataset in structured JSON.

---

### 2. Spaceflight Fire Lessons & Earth Spinoffs
- **Historical Spaceflight Fire Governance**:
  - **Apollo 1 (AS-204)**: Hyper-oxygenated pure $\text{O}_2$ flashover, polymer inventory ignition, and mandatory NASA-STD-6001 upward flame propagation testing.
  - **Apollo 13**: High-pressure supercritical $\text{O}_2$ cryo-tank fan wiring ignition, Teflon insulation combustion, and wiring isolation controls.
  - **Mir Space Station (1997)**: Solid-fuel oxygen generator (Vika) thermal runaway, zero-$g$ smoke stagnation physics (hot particulate does not rise without natural buoyancy), and emergency module isolation.
  - *Each historical case includes a 1-click simulation preset loading its exact oxygen, pressure, and gravity parameters into the Combustion Lab.*
- **Earth Fire Safety Spinoffs**:
  - **NASA Spinoff #9582**: Fine-water-mist fire extinguishers replacing toxic Halon and PFAS chemicals in data centers, aircraft, and cultural archives.
  - **NASA Spinoff #9407**: Intelligent multi-criteria optical backscatter and electrochemical CO smoke detectors developed for non-buoyant zero-$g$ aerosol transport.
  - **NASA Spinoff #9918**: Space-age thermal protective textiles (PBI, polyimide, aluminized radiant barriers) evolved into municipal firefighter turnout gear.

---

### 3. Space Safety & NASA Habitat Audit Engine
- **Multimodal AI Visual Screening**: Upload high-resolution photographs of crew quarters, rovers, and experiment modules. Google Gemini Flash analyzes visible evidence without inferring speculative fire causes.
- **Post-Gemini Automated NASA Audit**: Cross-references every visual finding against NASA spaceflight standards:
  - *Combustibles near heat* $\rightarrow$ **NASA-STD-6001 Test 1** & Apollo 1 flashover warning.
  - *Electrical daisy-chaining & cord wear* $\rightarrow$ **NASA SP-5080** & Apollo 13 wiring harness protocol.
  - *Blocked exit pathways* $\rightarrow$ **ISS SSP 50005** & Mir 1997 smoke stagnation emergency egress standard.
  - *Lithium-ion charging* $\rightarrow$ **NASA JSC 20793** battery thermal containment regulations.
- **Mission Habitat Certification Checklist**: Evaluates crew spaces against 4 mission operational profiles:
  - 🌌 **ISS Space Station**: Zero-$g$ aerosol stagnation and emergency vehicle egress readiness.
  - 🌕 **Lunar Base (Artemis)**: Extreme flashover risks under elevated $34\%\,\text{O}_2$ atmospheres.
  - 🔴 **Mars Surface Habitat**: Low-gravity radiant heat zones and airlock isolation corridors.
  - 🚜 **Pressurized Exploration Rover**: Single-hatch emergency escape and battery containment in confined cabins.
- **Interactive Finding Actions**:
  - 🧪 **"Simulate in Combustion Lab"**: Loads the matching hyper-oxygenated or microgravity flammability condition into the physics engine.
  - 🔬 **"Inspect in NASA PSI"**: Deep-links directly to the corresponding flight experiment or spinoff in the PSI Explorer.
- **Pre-Populated Astronaut Operational Habitats**:
  1. *Artemis Pressurized Exploration Rover* (Mobile cabin, cockpit console, egress hatch).
  2. *ISS US Destiny Science Laboratory Module* (CIR combustion rack, suction intake grille).
  3. *Lunar Base Habitat & ECLSS Life Support Bay* (Sleep berth, high-temperature heater line).
  4. *Combustion Integrated Rack Ground Chamber* (NASA Glenn Research Center).

---

### 4. Interactive 2D Hazard Room Planner
- **Drag-and-Drop Floorplan Interaction**: Place items on the grid, click to select, and smoothly drag or tap to relocate them without accidental item placement.
- **Deterministic Proximity Rule Engine**: Evaluates centre-to-centre distances between heat sources, combustibles, fuels, power strips, and exit doors.
- **Dynamic Safety Scoring**: Real-time room safety score (0–100) and actionable step-by-step clearance fixes.

---

### 5. Ember Guardian 3D IoT Hardware Stage
- **Blueprint-Calibrated 3D WebGL Render**: Realistic, interactive 3D model of the Ember Guardian multi-sensor safety device built with Three.js.
- **NASA Spinoff #9407 Heritage**: Integrates dual-wavelength optical particulate scatter (PM2.5/PM10) and electrochemical carbon monoxide sensing.
- **Hardware Telemetry & Specifications**: Real-time virtual sensor readings, exploded internal layer inspections, and microgravity aerosol transport analysis.

---

### 6. Microgravity Flame Simulation Engine (`EMBER-ROM 0.1`)
- **Physics-Informed Reduced-Order Model**:
  - Lumped heat balance: $C \frac{dT}{dt} = Q_{\text{reaction}} - Q_{\text{radiation}} - Q_{\text{transfer}}$.
  - Variable gravitational convection: $k = 0.9 + 4\sqrt{g}$.
  - Fuel and oxidizer mass balances with finite reactant consumption gates.
- **Visual Flame Canvas**: Qualitative rendering transitioning between tall buoyant teardrop flames ($1\,g$) and large spherical blue diffusion envelopes ($0\,g$).
- **Controls & Fuels**: Supports methane ($\text{CH}_4$), propane ($\text{C}_3\text{H}_8$), and ethanol ($\text{C}_2\text{H}_5\text{OH}$) vapor, oxygen fraction (0–30%), ambient temperature, and fuel mass flow.
- **Virtual Interventions**: Fuel cutoff, oxygen dilution inerting, and enhanced heat extraction.
- **Run History & Overlays**: Side-by-side run comparisons with overlaid time series plots and CSV/JSON export.

---

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v20.0.0 or newer.

### Installation & Local Launch

```bash
# Clone the repository
git clone https://github.com/Ahmaduanon/ember-flame.git
cd ember-flame

# Install dependencies
npm install

# Start development server (Port 3001)
npm run dev
```

Open your browser at **http://localhost:3001**.

- **Windows Shortcut**: Double-click `START-LAB.cmd`.
- **macOS / Linux Shortcut**: Run `sh start-lab.sh`.

---

## Vercel Cloud Deployment

Ember is fully configured for continuous deployment on **[Vercel](https://vercel.com)**:

1. **Import Project**: In your Vercel Dashboard, click **Add New...** → **Project**, and select `Ahmaduanon/ember-flame`.
2. **Framework Preset**: Vercel automatically detects `Vite` and reads `vercel.json`.
3. **Build Command**: `npm run build:client` (Output Directory: `dist`).
4. **Environment Variables** (Optional for live Gemini Flash vision scans):
   - `GEMINI_API_KEY`: Your Google Gemini API key.
5. **Deploy**: Click **Deploy**. Vercel will generate your live production URL (e.g. `https://ember-flame.vercel.app`). All interactive modules (Landing, Space Habitats, 2D Scanner, 3D Guardian WebGL, NASA PSI Explorer, Combustion Lab) run seamlessly in the cloud.

---

## AI Configuration (Google Gemini Flash)

Ember uses Google's Gemini Flash multimodal vision model for rapid space habitat photo analysis:

1. Obtain a free API key from [Google AI Studio](https://aistudio.google.com/).
2. Create or edit `.env` in the project root:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-3.5-flash
   ```
3. Ember auto-detects `GEMINI_API_KEY` and features automatic fallback if primary model capacity is limited.

### Alternative AI Providers
- **Local Ollama (100% Offline & Private)**:
  ```env
  EMBER_AI_PROVIDER=ollama
  EMBER_OLLAMA_URL=http://127.0.0.1:11434
  EMBER_OLLAMA_MODEL=gemma3:4b
  ```
- **DeepSeek API**: `EMBER_AI_PROVIDER=deepseek` + `DEEPSEEK_API_KEY=your_key`.
- **OpenAI API**: `EMBER_AI_PROVIDER=openai` + `OPENAI_API_KEY=your_key`.

---

## Testing & Quality Assurance

Ember includes 34 automated unit and integration tests covering physics conservation, NASA audit mappings, AI vision schemas, 2D proximity rules, and local database persistence:

```bash
# Run full automated test suite
npm test

# Run TypeScript typechecks
npx tsc --noEmit

# Run production build (client bundle + SSR runtime)
npm run build
```

---

## Project Structure

```
├── app/
│   ├── auth.tsx                 # User authentication & session state
│   ├── chart.tsx                # SVG time-series charts for flame telemetry
│   ├── flame-view.tsx           # Canvas flame renderer (0g sphere vs 1g plume)
│   ├── globals.css              # Responsive styling, typography, theme tokens
│   ├── guardian-render.tsx      # Three.js 3D WebGL render of Guardian IoT node
│   ├── guardian-view.tsx        # Guardian 3D stage & Spinoff #9407 telemetry
│   ├── lab.tsx                  # Main app shell & Combustion Lab simulator
│   ├── landing.tsx              # Landing page hero, showcase & PSI previews
│   ├── main.tsx                 # Client entrypoint & React root
│   ├── method.tsx               # Scientific references & NASA bibliographies
│   ├── psi-explorer.tsx         # NASA PSI Explorer (Investigations, Lessons, Spinoffs)
│   ├── safety-dashboard.tsx     # Space Safety hub, AI surveys, Habitat Certifications
│   ├── scanner.tsx              # 2D Hazard Floorplan Scanner with item drag & drop
│   ├── theme.tsx                # Light/Dark theme provider
│   └── toast.tsx                # Toast notifications
├── lib/
│   ├── hazards.ts               # 2D spatial clearance rules & scoring
│   ├── model.ts                 # Reduced-order combustion physics (EMBER-ROM 0.1)
│   ├── nasa-data.ts             # Official NASA PSI benchmarks, case studies, spinoffs
│   ├── nasa-safety-audit.ts     # Post-Gemini NASA standards & habitat certification engine
│   ├── safety.ts                # Safety domain schemas, findings, and assessment types
│   └── validation.ts            # Input validation and boundary protections
├── server/
│   ├── auth.mjs                 # Session token issuance and verification
│   ├── password.mjs             # Salted scrypt password hashing
│   ├── safety/
│   │   ├── prompt.txt           # Structured multimodal hazard survey prompt
│   │   ├── routes.mjs           # Safety state, photo analysis, and NASA audit pipeline
│   │   └── vision.mjs           # Vision adapters (Gemini, Ollama, DeepSeek, OpenAI)
│   ├── seed_space_habitats.mjs  # Seeding astronaut spaces (Rover, ISS, Lunar Hab)
│   └── server.mjs               # Node.js HTTP server & static asset delivery
├── tests/
│   ├── hazards.test.mjs         # 2D hazard scanner proximity tests
│   ├── model.test.mjs           # Combustion physics conservation & energy balance
│   ├── nasa-audit.test.mjs      # NASA standards mapping & mission habitat checklist tests
│   ├── server.test.mjs          # Server endpoints, security, and SQLite persistence
│   └── vision.test.mjs          # AI vision formatting, fallback, and schema validation
├── docs/
│   ├── AI-SETUP.md              # Multimodal vision setup (Gemini, Ollama, DeepSeek)
│   ├── MODEL.md                 # EMBER-ROM 0.1 combustion equations & physics closures
│   ├── NASA-PSI.md              # Comprehensive NASA PSI investigations & flight reference
│   └── SAFETY-MODEL.md          # Spaceflight fire safety architecture & audit guidelines
├── data/photos/                 # High-resolution astronaut space survey photographs
├── dist/                        # Compiled production client web application
├── runtime/                     # Compiled production SSR Node.js runtime
├── package.json                 # Project dependencies & npm scripts
└── tsconfig.json                # TypeScript strict configuration
```

---

## Citation & NASA Resources

- **NASA Physical Science Informatics (PSI)**: [https://psi.nasa.gov/](https://psi.nasa.gov/)
- **NASA Glenn Research Center — Combustion Science**: [https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/](https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/)
- **NASA SMA Apollo 1 (AS-204) Investigation**: [https://sma.nasa.gov/sma-disciplines/accllp/apollo-1](https://sma.nasa.gov/sma-disciplines/accllp/apollo-1)
- **NASA SMA Apollo 13 Investigation**: [https://sma.nasa.gov/sma-disciplines/accllp/apollo-13](https://sma.nasa.gov/sma-disciplines/accllp/apollo-13)
- **NASA History — Mir Space Station Fire (1997)**: [https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/](https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/)
- **NASA Spinoff #9582 (Fine Water Mist)**: [https://spinoff.nasa.gov/node/9582](https://spinoff.nasa.gov/node/9582)
- **NASA Spinoff #9407 (Multi-Criteria Smoke Alarms)**: [https://spinoff.nasa.gov/node/9407](https://spinoff.nasa.gov/node/9407)
- **NASA Spinoff #9918 (Firefighter Turnout Gear)**: [https://spinoff.nasa.gov/node/9918](https://spinoff.nasa.gov/node/9918)

---

## License
MIT License. Built for the NASA Space Apps Challenge and open spaceflight fire safety research.
