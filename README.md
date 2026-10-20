# Ember 0.2 — Building Safety & Combustion Lab

A portable local project combining room-photo surveys, prototype sensor monitoring, incident review and the gravity/flame laboratory. No GitHub account or deployment is needed. This is a research prototype; keep approved smoke/CO alarms working independently.

## Start the included app

1. Extract the ZIP completely on a desktop computer.
2. Install Node.js 22.13 or newer from https://nodejs.org/ if needed.
3. Windows: open `START-LAB.cmd`. macOS: open `Start-Lab.command` (or run `sh start-lab.sh`). Linux: run `sh start-lab.sh`.
4. The first run installs dependencies and builds the app (internet needed once, about a minute). Then open http://localhost:3000, create an account and sign in.

The app runs on a computer, not directly inside iPhone Files. Phone photos can be transferred to the computer for upload. Browser camera access depends on browser/device support.

## Expanded building workflow

- Add home, commercial or other buildings and their rooms.
- Upload up to four photos per room, inspect views, and record manual observations immediately.
- Configure a local vision model for AI-assisted observations, then confirm, resolve or dismiss findings with human review notes. See `docs/AI-SETUP.md`. Model weights are a separate download; no live model is bundled.
- Pair device IDs to installed rooms and connect USB/WebSocket telemetry or the authenticated background USB gateway.
- Review particle/CO/temperature changes, independent alarm contacts, missing channels, faults and offline states. Optional browser notifications work while Ember stays open.
- Exercise labeled demo scenarios. Demo/import readings do not affect real-device monitoring.
- Review incidents with sensor evidence and snapshots of earlier room observations, then export JSON records. Earlier observations do not establish fire cause or blame.

Start with **Buildings & alerts → Add a room**. See `docs/SMOKE-NODE.md` for the ESP32/PMS5003 starter and `docs/SAFETY-MODEL.md` for implemented rules. A full house survey consists of room records and photos; no automatic 3D reconstruction or code-compliance certification is implemented.

The early-warning rules are unvalidated bench constants. They cannot guarantee detection before flaming. Photos cannot reveal hidden wiring or determine fire origin. A kitchen beside a bathroom is not automatically a hazard. During an alarm or visible smoke/fire, leave and contact local emergency services from safety; do not stay to diagnose or photograph it. The project never controls physical suppression equipment.

Local Ollama is the default AI provider. OpenAI is an optional paid alternative requiring your own key and per-analysis consent; `.env.example` documents configuration. AI API behavior was tested with mocks; live AI accuracy and physical hardware remain unvalidated.

## What is included

- Earth, Moon, Mars and microgravity presets, plus a 0–2 g slider.
- Methane, propane and ethanol-vapor scenarios; oxygen, temperature and fuel-supply controls.
- A live schematic flame and illustrative temperature, oxygen and fuel fields.
- Gas-temperature, heat-release/loss and species-inventory time histories.
- Fuel-cutoff, oxygen-dilution and enhanced-cooling experiments, with a model extinction indicator.
- Local SQLite experiment saving, two-run comparison, CSV/JSON export and event timelines.
- Real USB serial / WebSocket sensor ingestion, strict input validation, stale-data indicators, an explicitly labeled demo feed, and local telemetry records.
- ESP32 sensor firmware, optional Python serial-to-WebSocket bridge and setup instructions.
- Editable source code, automated tests and a documented model.

## First experiment

Let the Earth reference run settle. Save it. Choose Microgravity and press the reset/ignite arrow to start a new run with those conditions. Save the second run. Open **Experiments** and select **Compare** on both cards. Inspect the timeline when a parameter changes during a run. Use the suppression controls in the virtual lab to observe the energy balance; nothing is sent to physical actuators.

## Scientific status

This is **EMBER-ROM 0.1, an unvalidated educational reduced-order model**. It integrates a lumped heat balance and fuel/oxygen inventories. Its coefficients and reconstructed geometry were selected for teaching; they were not fitted to published experimental data. Numerical checks are not physical validation.

Spatial concentration and temperature visuals are schematic, not CFD solutions. “Flame size” is an illustrative geometric estimate. The temperature is one lumped gas value, not a resolved peak. Burn-state and extinction thresholds are heuristic and do not establish real flammability limits or fire-safety decisions. Microgravity does not imply a flame must go out.

Moon/Mars presets alter gravity only; they do not reproduce lunar vacuum or the Martian atmosphere. The model assumes a quiescent atmosphere near 1 atm. Pressure, detailed chemistry, soot, cool flames, turbulent/forced flow, radiation spectra and geometry-specific transport are not solved.

Read `docs/MODEL.md`, the app's **Model & science** page, and the source `lib/model.ts` for equations and limitations. For research use, a validated transport/chemistry solver, defined experimental geometry, calibrated sensors and independent experimental comparisons are still required.

## IoT

Read `docs/IOT-SETUP.md`. USB serial requires a supporting desktop browser and a compatible board producing newline-delimited JSON. The original environmental starter targets a classic ESP32 DevKit + BME280 + MPU6050. The additional particulate node targets an ESP32 + PMS5003, with optional BME280. The source was prepared from the sensor library interfaces; it was not compiled on an Arduino toolchain or tested on physical hardware here.

Ambient and oxygen measurements may be explicitly applied to the model's inputs. Accelerometer readings do not automatically become a gravity setting. Missing sensors remain missing. The firmware never actuates fuel, heat or suppression equipment.

## Develop from source

With Node 22.13+ and npm installed:

```sh
npm install
npm run dev
```

Open http://localhost:3000. Vite provides development updates through the same local server.

```sh
npm run build
npm test
npm start
```

`npm run build` type-checks the client, builds `dist/`, and bundles a dependency-free production server in `runtime/`. `npm test` runs model and API integration tests; build first for the integration tests. The integration suite uses a temporary copy with no node_modules and a temporary SQLite database. Vision tests use mocked provider responses, not a live model. The package pins direct dependency versions; the prebuilt runtime is the reproducible handoff supplied here.

## Project map

| Path | Purpose |
|---|---|
| app/ | React interface, canvas flame renderer, SVG plots and styles |
| lib/model.ts | Educational heat/species model |
| lib/validation.ts | Shared input validation |
| server/server.mjs | Local HTTP API, SQLite records and static serving |
| dist/ | Prebuilt browser app |
| runtime/server.js | Prebuilt self-contained server; only Node is needed |
| firmware/ | ESP32 starter and optional serial gateway |
| docs/ | Model and IoT setup documentation |
| tests/ | Model checks and real HTTP/persistence tests |
| data/ | Created at first run; your local experiments and telemetry |

## Data and deployment

Surveys, photos, findings, devices, incidents and experiments persist in `data/ember.sqlite`. Raw monitoring samples are pruned after 24 hours on ingestion; see `docs/SAFETY-MODEL.md` for record behavior. Saved runs are not deleted automatically; the notebook displays the most recent 100. The telemetry archive displays the most recent 100 samples; samples older than 7 days are removed on new writes. Stop the app before copying `data/` for backup.

This is a single-user local app. It listens only on 127.0.0.1, validates Host/Origin on writes, and does not have multiuser accounts or cloud synchronization. A public deployment would need authentication, user isolation, device credentials, TLS and operational controls. No deployment or GitHub connection is required for this ZIP.

## Troubleshooting

- **node is not recognized:** install Node and reopen the terminal.
- **Port already in use:** stop the earlier app window or set EMBER_PORT to another port.
- **No sensor port appears:** check that your cable supports data, install the board's USB driver if required, and close the Arduino serial monitor.
- **USB unsupported:** use a supported desktop browser or the optional WebSocket bridge.
- **Blank oxygen/probe field:** those sensors are not implemented by the starter; no reading is invented.
- **Slow or missing data:** inspect stale status, rejected packet count and JSON format.

Verification completed: TypeScript checks, production builds, 29 passing automated model, detection, vision-adapter and local-server integration tests. No visual browser automation or physical hardware validation was available in the build environment.

## Ember 0.3 additions
- **Landing page** at `/` with a waitlist form; **sign up / sign in** pages; the lab opens at `#app` after sign-in. Accounts are stored on this computer (scrypt-hashed passwords, HttpOnly SameSite=Strict session cookie, 7-day sessions, login rate limit). All accounts on one installation share the same data; `EMBER_CLOSED_SIGNUP=1` closes sign-up after the first account.
- **Hazard scanner** tab: map a room and get rule-based fire-hazard findings (screening only, not an inspection).
- **Guardian** tab, `firmware/guardian/` and `docs/GUARDIAN.md`: pre-fire detection logic, simulator, USB live view, limited suppressant release. Guardian states feed the existing alert pipeline.
- **Waitlist**: signed-in users download it at `/api/waitlist?format=csv`. For public hosting of the landing page only: `EMBER_PUBLIC=1 EMBER_ADMIN_TOKEN=<secret> npm start` (everything else stays closed; read sign-ups with `curl -H "X-Admin-Token: <secret>" "https://your-host/api/waitlist?format=csv"`).
- Fixes: findings queries are bounded (state returns the newest 500), malformed URLs return 400, request bodies are decoded as UTF-8 safely, telemetry rate limit is per device (aligned with the safety path), and the smoke node reports `warming_up` instead of a fault for the first seconds.
