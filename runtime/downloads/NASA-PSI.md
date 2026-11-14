# NASA Physical Science Informatics (PSI) & Spaceflight Combustion Research

This document provides complete technical documentation of the low-gravity combustion science investigations, flight experiments, historical case studies, and terrestrial spinoffs integrated into Ember.

Data is curated from the **NASA Glenn Research Center (GRC) Combustion Science Program** and the **NASA Physical Science Informatics (PSI) repository** (`https://psi.nasa.gov/`).

---

## 1. Flight Investigations Aboard the International Space Station (ISS)

Investigations conducted inside the ISS **Combustion Integrated Rack (CIR)** explore combustion in the absence of buoyant natural convection ($10^{-5}\,g$). Without buoyant upward flow, flames burn as spherical diffusion envelopes where heat loss is dominated by radiation.

### 1.1 ACME (Advanced Combustion via Microgravity Experiments)
- **Facility**: ISS Combustion Integrated Rack (CIR)
- **Sponsor**: NASA Glenn Research Center
- **Fuel**: Methane ($\text{CH}_4$) gaseous diffusion burner
- **Regime**: Microgravity ($0\,g$)
- **Target Habitats**: Spacecraft, Space Station
- **Flammability Metrics**:
  - Limiting Oxygen Index (LOI): $13.4\%\,\text{O}_2$
  - Effective Quench Diameter ($d_q$): $19.4\text{ mm}$
  - Radiative Heat Loss Fraction ($\chi_{\text{rad}}$): $0.32$
  - Extinction Strain Rate: $12.4\text{ s}^{-1}$
- **Scientific Summary**:
  In microgravity, methane diffusion flames form spherical envelopes around the burner nozzle. Because hot exhaust gases do not rise, the flame volume expands, radiating substantially more thermal energy and reaching radiative extinction at lower strain rates than in normal Earth gravity.
- **Fire Safety Insight**:
  Establishes the absolute lower limit of oxygen concentration ($13.4\%$) needed to sustain a methane flame in zero gravity, defining the inerting threshold for spacecraft cabin gas leak scenarios.

### 1.2 FLEX-2 (Flame Extinguishment Experiment 2)
- **Facility**: ISS Multi-user Droplet Combustion Apparatus (MDCA)
- **Sponsor**: NASA Glenn Research Center / Princeton / UC San Diego
- **Fuel**: Propane ($\text{C}_3\text{H}_8$), Decane, Heptane droplets
- **Regime**: Microgravity ($0\,g$)
- **Flammability Metrics**:
  - Limiting Oxygen Index (LOI): $12.8\%\,\text{O}_2$
  - Quench Diameter ($d_q$): $21.2\text{ mm}$
  - Radiative Heat Loss Fraction ($\chi_{\text{rad}}$): $0.38$
  - Cool Flame Temperature: $\sim 600 - 800\text{ K}$
- **Discovery of "Cool Flames"**:
  FLEX-2 demonstrated that after the visible high-temperature flame ($\sim 1600\text{ K}$) extinguishes due to radiative heat loss, the droplet can continue burning invisibly via low-temperature chemical kinetics at temperatures between $600$ and $800\text{ K}$ with zero visible soot or luminosity.
- **Fire Safety Insight**:
  Visible flame extinction in microgravity does **not** guarantee fire termination. Smoldering and cool flame reactions can persist undetected without buoyant evacuation, requiring advanced dual-criteria aerosol and CO detection.

### 1.3 BASS-II (Burning and Suppression of Solids)
- **Facility**: ISS Microgravity Science Glovebox (MSG)
- **Sponsor**: NASA Glenn Research Center
- **Fuel**: Polymethyl methacrylate (PMMA / Acrylic), Nomex, Cotton
- **Regime**: Microgravity ($0\,g$) with low-velocity forced airflow ($0 - 10\text{ cm/s}$)
- **Flammability Metrics**:
  - Limiting Oxygen Index (LOI): $14.2\%\,\text{O}_2$
  - Quench Thickness: $3.2\text{ mm}$
  - Flame Spread Rate: $0.4 - 1.8\text{ mm/s}$
- **Scientific Summary**:
  BASS-II tested how solid polymer slabs burn when exposed to very low forced ventilation airspeeds. Counterintuitively, slow ventilation ($2 - 5\text{ cm/s}$) provides just enough oxidizer to enhance burning without blowing out the flame, making cabin ventilation ducts primary fire propagation vectors.

### 1.4 BRE (Burning Rate Emulator)
- **Facility**: ISS CIR
- **Fuel**: Gaseous hydrocarbon blends through flat porous burners
- **Insight**:
  Simulates solid fuel burning without solid fuel complexity, measuring the heat flux required to maintain steady gasification in zero gravity.

### 1.5 SOFIE (Solid Fuel Ignition and Extinction)
- **Facility**: ISS CIR
- **Focus**:
  Investigates how materials selected for the Artemis Moon and Mars missions ignite and extinguish in partial gravities ($0.166\,g$ Moon, $0.38\,g$ Mars) under reduced cabin pressures ($8.2\text{ psia}$) and elevated oxygen fractions ($34\%\,\text{O}_2$).

### 1.6 S-Flame (Structure and Extinction Limit of Stretched Flames)
- **Facility**: ISS CIR & 2.2-Second Drop Tower
- **Focus**:
  Measures flame extinction strain rates across varying gravity vectors, establishing predictive scaling laws between Earth 1g testing and extraterrestrial habitats.

---

## 2. Historical Spaceflight Fire Investigations

### 2.1 Apollo 1 (AS-204) Launch Pad Fire (January 27, 1967)
- **Environment**: $100\%$ Pure Oxygen at $16.7\text{ psia}$ ($115\text{ kPa}$)
- **Root Cause**: Electrical arcing from damaged Teflon insulation on wire harness beneath astronaut couch, igniting adjacent flammable materials in pure oxygen.
- **Combustion Physics**:
  In high-pressure pure oxygen, materials that are flame-retardant in standard Earth air (nylon, Velcro, polyurethane foam) lose their ignition barriers. Flashover occurred in less than 15 seconds, with flame spread rates exceeding $300\text{ mm/s}$.
- **NASA Standards Established**:
  - Elimination of pure $\text{O}_2$ pre-launch cabin atmospheres (transition to $60/40\ \text{O}_2/\text{N}_2$).
  - Creation of **NASA-STD-6001**: Mandatory upward flame propagation acceptance testing.
  - Complete redesign of spacecraft wiring harnesses and explosive outward-opening egress hatches.

### 2.2 Apollo 13 Cryogenic Oxygen Tank 2 Explosion (April 13, 1970)
- **Environment**: Supercritical Liquid Oxygen at $\sim 1,000\text{ psi}$ in deep space
- **Root Cause**: Damaged insulation on thermostatic switch wires inside Cryo Tank 2 sparked during routine cryo-stir, burning Teflon in pure oxygen.
- **Combustion Physics**:
  Combustion inside a high-pressure oxygen container produced rapid thermal runaway, blowing off the tank dome and rupturing Service Module Panel 4.
- **NASA Standards Established**:
  - Removal of internal mechanical stirrers and submerged electrical contacts in oxidizer tanks.
  - Addition of a third independent cryogenic oxygen tank located in a segregated bay.
  - Standardized **NASA SP-5080** for high-pressure oxygen systems.

### 2.3 Mir Space Station Kvant-1 Module Fire (February 23, 1997)
- **Environment**: Microgravity ($10^{-5}\,g$) in standard habitable atmosphere ($21\%\,\text{O}_2$ at $14.7\text{ psia}$)
- **Root Cause**: Mechanical casing rupture of solid chemical oxygen generator canister (Vika / TGK "candle") during routine ignition.
- **Combustion Physics**:
  The burning iron-chlorate core vented a blowtorch-like open flame for over 90 seconds. Crucially, in zero gravity, hot smoke **did not rise to the ceiling**; instead, it stagnated into an opaque, oily aerosol cloud that blinded the 6 crew members and blocked access to the Soyuz escape spacecraft.
- **NASA Standards Established**:
  - Emergency escape paths to return vehicles must never be blocked by high-risk equipment.
  - Ceiling smoke detectors are ineffective in zero-g; sensors must be placed along forced ventilation intake lines.
  - Spurred development of fine water mist extinguishers that do not disperse burning debris in zero-g.

---

## 3. NASA Earth Fire Safety Spinoffs

### 3.1 NASA Spinoff #9582: Fine-Water-Mist Fire Extinguishers
- **NASA Origin**: Developed by NASA and ADA Technologies for the ISS to eliminate toxic Halon 1301.
- **Physical Mechanism**: Droplets under $50\ \mu\text{m}$ flash-vaporize upon entering the flame zone, expanding by a factor of 1,700 to suffocate the fire and extract thermal energy without dispersing burning liquids.
- **Terrestrial Commercialization**: Deployed in data centers, aircraft cabins, naval vessels, and historic archives. Safe for human occupancy, zero ozone depletion, zero PFAS chemicals.

### 3.2 NASA Spinoff #9407: Multi-Criteria Intelligent Smoke Detection
- **NASA Origin**: Derived from ISS CIR low-convection aerosol transport research. NASA needed sensors that could differentiate true smoldering smoke from benign dust and cooking aerosols in stagnant microgravity atmospheres.
- **Physical Mechanism**: Pairs multi-angle optical scatter with electrochemical carbon monoxide sensing.
- **Terrestrial Commercialization**: Modern residential and commercial smoke detectors that eliminate cooking false alarms while detecting electrical fires up to 15 minutes faster than legacy ionization detectors. Directly informs the **Ember Guardian** IoT multi-sensor node.

### 3.3 NASA Spinoff #9918: Advanced Firefighter Turnout Gear & Textiles
- **NASA Origin**: Evolved from Apollo spacesuit thermal micrometeoroid garments, Space Shuttle heat shield tiles, and microgravity fabric flammability studies (BASS).
- **Physical Mechanism**: Multi-layer thermal barrier textiles (PBI, aluminized polyimide films, aerogel insulations) that withstand flashover temperatures exceeding $1,000^\circ\text{C}$.
- **Terrestrial Commercialization**: Standard turnout coats, hoods, and carbon-composite breathing tanks for municipal firefighters worldwide.
