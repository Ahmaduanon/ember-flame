# Ember Space Safety & NASA Flight Audit Model

## Purpose and Scope

Ember's Space Safety module bridges multimodal visual AI inspections with official NASA spaceflight fire safety governance. It evaluates photographic evidence of habitable crew environments (such as rovers, space station modules, and planetary surface bases) and cross-references visual hazards against NASA standards, microgravity combustion physics, and historical spaceflight fire investigations.

No automated finding certifies a spacecraft or habitat as flight-ready. All assessments serve as decision-support tools requiring human astronaut and ground-control engineering review.

---

## 1. Visual Survey & Multimodal AI Architecture

1. **Photographic Ingestion**:
   - Captures up to four high-resolution photos per habitable space.
   - Preserves raw photographic evidence in secure database storage with unique UUIDs.
2. **AI Provider Interface**:
   - Primary: **AI Vision Cloud Model** (with automatic model fallback).
   - Local Offline: **Ollama** (`gemma3:4b` or `llama3.2-vision`) with zero external network transmission.
   - Cloud Alternatives: **DeepSeek** and **OpenAI**.
3. **Strict Structured Output Schema**:
   - `assessmentSchema`: Enforces typed fields (`summary`, `limitations`, `follow_up_views`, and `findings`).
   - Each finding is constrained to specific categories:
     - `combustibles_heat` (Combustibles near heat sources)
     - `power_strip_chain` (Electrical daisy-chaining & multi-tap overload)
     - `electrical_damage` (Visible wire jacket damage / arcing risk)
     - `blocked_exit` (Obstructed emergency egress corridors)
     - `cooking` (Food preparation and open burner hazards)
     - `battery_charging` (Lithium-ion charging on combustible surfaces)
     - `other_visible` (General uncharacterized fire concerns)
   - Guardrails prohibit speculative fire cause attribution or false certainty.

---

## 2. NASA Spaceflight Audit Pipeline (`lib/nasa-safety-audit.ts`)

Immediately upon receipt of the AI's visual findings, Ember executes the deterministic NASA Spaceflight Audit Engine:

```
┌────────────────────────────────────────────────────────┐
│           Raw Room Photographs & Notes                 │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             Multimodal AI Visual Survey                │
│             (AI Vision Model / Ollama)                 │
└───────────────────────────┬────────────────────────────┘
                            │ Parsed Findings
                            ▼
┌────────────────────────────────────────────────────────┐
│            NASA Spaceflight Audit Engine               │
│               lib/nasa-safety-audit.ts                 │
├────────────────────────────────────────────────────────┤
│ 1. Map to NASA-STD-6001, NASA SP-5080, ISS SSP 50005   │
│ 2. Analyze Microgravity Risk Physics (LOI, Stagnation) │
│ 3. Identify Terrestrial NASA Spinoff Countermeasures   │
│ 4. Evaluate Mission Habitat Certification Checklist    │
│ 5. Generate Simulation & PSI Explorer Deep-Links       │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│     Space Safety Dashboard & Mission Compliance UI     │
└────────────────────────────────────────────────────────┘
```

### Standards Mapping Table

| Finding Category | NASA Standard Code | Spaceflight Risk Physics | Historical Case Parallel | Earth Spinoff Mitigation |
|---|---|---|---|---|
| `combustibles_heat` | **NASA-STD-6001 Test 1** (*Upward Flame Propagation*) | Reduced convective cooling in microgravity causes thermal energy retention. In elevated $\text{O}_2$ (Lunar/Mars 32–34%), material Limiting Oxygen Index (LOI) margins drop, producing rapid flashover. | **Apollo 1 (AS-204)** (1967): Combustible nylon/Velcro inventory in 100% $\text{O}_2$ ignited into flashover in <15s. | Apply PBI/Nomex thermal barrier fabrics (**NASA Spinoff #9918**) and enforce 1m clearance. |
| `power_strip_chain` / `electrical_damage` | **NASA SP-5080** (*High-Pressure Wiring Systems*) | Confined spacecraft atmospheres lack natural convective air circulation. Wire cores experience double the thermal rise under nominal electrical load, leading to insulation breakdown and fluoropolymer pyrolysis. | **Apollo 13** (1970): Cryogenic $\text{O}_2$ tank fan wire insulation failure provoked explosive tank rupture. | Install intelligent dual-wavelength smoke detectors (**NASA Spinoff #9407**) and single-point breakers. |
| `blocked_exit` | **ISS SSP 50005** (*Flight Crew Emergency Egress*) | Without buoyancy, hot combustion particulate does not rise; smoke stagnates into an opaque, toxic aerosol cloud within 20 seconds. Blocked access to emergency return craft (Soyuz/Orion) is a Catastrophic Loss of Crew hazard. | **Mir Space Station** (1997): Burning Vika candle smoke blinded crew and blocked transit between modules. | Maintain 1.2m unobstructed egress corridors and deploy dual-channel suction air extraction. |
| `battery_charging` | **NASA JSC 20793** (*Crewed Battery Safety Protocol*) | Lithium-ion thermal runaway releases flammable offgassing ($\text{H}_2, \text{CO}, \text{CH}_4$) that can form explosive fuel clouds in spacecraft life-support ventilation circuits. | **ISS CIR Experiments**: Droplet energy concentration and localized vapor detonation. | Charge in flameproof containment bags equipped with fine water mist suppression (**NASA Spinoff #9582**). |
| `cooking` / `other_visible` | **NASA CIR Microgravity Aerosol Guideline** | Cooking aerosols and hot droplets disperse omnidirectionally in zero-g, saturating ECLSS filters and lowering surface ignition barriers. | **ACME Gaseous Burner Studies**: Diffusion envelopes without buoyant plume evacuation. | Deploy multi-criteria optical backscatter sensors that reject steam while catching smoldering fires (**NASA Spinoff #9407**). |

---

## 3. Mission Habitat Certification Scoring Framework

Every crewed space is evaluated across four operational mission profiles:

1. 🌌 **ISS Space Station** ($14.7\text{ psia} \cdot 21\%\,\text{O}_2 \cdot 10^{-5}\,g$):
   - Certified if zero blocked exits, zero unrated multi-tap daisy chains, and compliant clearance.
   - Fails if emergency egress corridors are blocked or combustibles are within heat radiative zones.
2. 🌕 **Lunar Base (Artemis Gateway)** ($8.2\text{ psia} \cdot 34\%\,\text{O}_2 \cdot 0.166\,g$):
   - Elevated $34\%\,\text{O}_2$ cabin atmosphere severely increases polymer flammability.
   - Fails if any urgent combustible hazard or unisolated electrical arrangement is present.
3. 🔴 **Mars Surface Habitat** ($8.0\text{ psia} \cdot 32\%\,\text{O}_2 \cdot 0.38\,g$):
   - Partial Martian gravity ($0.38\,g$) creates weak buoyant plumes with widened radiant heat envelopes.
   - Requires verified ECLSS thermal barriers and clear airlock transit paths.
4. 🚜 **Pressurized Exploration Rover** ($8.2\text{ psia} \cdot 34\%\,\text{O}_2 \cdot \text{Confined Cabin}$):
   - Extreme equipment packing density in a mobile cabin.
   - Fails if single-hatch egress is obstructed or uncontained battery charging is detected.

### Overall Compliance Status
- **Flight Certified**: All four mission habitats pass with zero active hazards.
- **Conditional Flight Waiver**: Minor review items present; acceptable with secondary engineering mitigations.
- **Non-Compliant / Flashover Threat**: One or more critical deficiencies violating NASA-STD-6001 or egress rules.

---

## 4. Privacy & Data Boundary

- **Database Storage**: All survey photographs, finding metadata, and NASA audit records are stored in the flight database.
- **Zero Third-Party Telemetry**: API keys stay strictly on the local Node.js server and are never delivered to the client browser.
- **Explicit Cloud Consent**: Image transmission to cloud providers (Cloud AI, DeepSeek, OpenAI) requires explicit per-request user consent.
