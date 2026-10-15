# EMBER-ROM 0.1 model specification

## Purpose and scope

This model makes gravity-related combustion concepts inspectable in a small interactive app. It is a demonstrator, not a validated combustion solver. Its precise-looking numbers are model outputs, not measured or validated physical predictions. Source references supply scientific context; they are not evidence that this model reproduces those experiments.

## State and units

State: time t (s), lumped temperature T (K), oxygen inventory mO (mg), fuel inventory mF (mg), burn flag and a weak-combustion timer. The ambient-temperature input is in °C and is converted to K. g is expressed relative to Earth gravity, 9.80665 m/s². Initial T=1300 K represents an imposed hot ignition state, not simulated ignition chemistry. Initial fuel inventory is 0.24 mg.

The ambient oxygen volume fraction is x. A reference gas mass of 8 mg and an O₂/N₂ mixture approximation define:

    mO,ambient = 8 × 32x / [32x + 28(1−x)] mg

There is no resolved volume, pressure field or local concentration solution. Inventories are not concentration measurements.

## Transport and reaction

Let b=√g. The illustrative exchange rate is k=0.9+4b s⁻¹. The nonzero baseline stands in for diffusion at zero gravity; it is not derived from a diffusion PDE.

    dmF/dt = fuel_supply − burn_rate − 0.12 k mF
    dmO/dt = k(mO,ambient − mO) − s × burn_rate

s is the complete-oxidation O₂/fuel mass ratio: 4 for methane, 3.636 for propane, 2.087 for ethanol vapor. A reaction timescale of 0.18 s and a linear thermal activation gate define:

    activation = clamp[(T−650)/550, 0, 1] when burning; otherwise 0
    burn_rate = min(mF/0.18, mO/(0.18s)) × activation

The explicit update caps reactant consumption at the inventory actually available in a timestep. Fuel outflow uses an exponential decay update. This is not an Arrhenius kinetics model.

## Energy balance

    C dT/dt = Qreaction − Qradiation − Qtransfer
    Qreaction = burn_rate × H
    Qradiation = ε σ A max(T⁴−Tambient⁴, 0)
    Qtransfer = [0.009 + A(7+7√g)] max(T−Tambient, 0)

C=0.045 J/K; ε=0.12; σ=5.670374419×10⁻⁸ W m⁻² K⁻⁴.

    A = 0.00020 × [1 + 0.65/(1+8√g)] × √(fuel_supply/0.85) m²

H is approximately 50, 46.4 or 26.8 MJ/kg for methane, propane or ethanol. With burn_rate in mg/s, the product is numerically in watts. Geometry, emissivity, capacity and transport coefficients are illustrative assumptions. Temperature is clamped at ambient to avoid unmodeled cooling below the environment.

## Geometry and fields

An assumed size closure is:

    size = 17 × √(burn_rate/0.65) × [1 + 0.45/(1+5√g)] mm

Size becomes zero when the burn flag switches off. The renderer separately interpolates a spherical shell and an upward-elongated teardrop around a porous fuel source. Flame color, transport particles and the reconstructed spatial fields are qualitative; they do not solve Navier–Stokes, species diffusion, radiative transfer or emission spectra. Displayed layers intentionally say “schematic”, “illustrative” or “relative”.

## Burn-state heuristics and interventions

“Extinguished” is latched when T<700 K or burn_rate<0.015 mg/s persists for at least 1.2 s. A new ignition/reset is then needed to burn again. “Weak” means T<1100 K or burn_rate<28% of the selected fuel supply. Otherwise the UI shows “Sustained”. These are model classifications, not validated stability or extinction limits.

- Fuel cutoff sets incoming fuel to zero; existing inventory continues to react and/or leave.
- Oxygen dilution uses min(selected oxygen, 9%) as the model boundary. It need not extinguish the model.
- Enhanced cooling multiplies Qtransfer by four. It need not extinguish the model.
- Removing an intervention restores the chosen input conditions but does not re-ignite an extinguished state.

These controls only modify software variables. They are not prescriptions for real fire suppression.

## Numerics and provenance

The app executes two 0.025 s integration steps on each 50 ms timer update. Simulation time can progress more slowly than wall time if a browser throttles the page. Traces are recorded every 0.5 simulated seconds, for at most 300 seconds. Saved JSON contains model version, initial/final settings, interventions, trace and up to 200 most recent input events. CSV contains numeric trace columns; export JSON as well when complete metadata matters. Rerunning a saved run restores its initial conditions but does not replay its intervention timeline.

Automated tests cover positive finite state across control limits, oxygen-free extinction, fuel-cutoff extinction, zero-gravity support, approximate steady energy balance and timestep refinement. Passing them demonstrates implementation consistency, not physical validation.

## Research path

Define a specific burner and atmosphere, select chemistry with validated transport data, solve the flow/species/energy/radiation problem with verified boundary conditions, assess grid/time convergence, and compare to independent calibrated experiments. Document uncertainty and test extreme operating conditions before interpreting numerical extinction boundaries.

## Scientific context

- NASA, Studying Combustion and Fire Safety: https://www.nasa.gov/missions/station/iss-research/studying-combustion-and-fire-safety/
- NASA, Structure and Response of Spherical Flames: https://science.nasa.gov/biological-physical/investigations/s-flame/
- NASA NTRS, Unsteady Spherical Diffusion Flames in Microgravity: https://ntrs.nasa.gov/citations/20010074022

The shared ChatGPT link provided with the original request was not retrievable; this implementation follows the user's written description.
