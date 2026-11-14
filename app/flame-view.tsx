'use client';
import { useEffect, useRef } from 'react';
import { clamp, type Settings, type SimState, FUELS } from '@/lib/model';
import { type NasaCalibrationDataset } from '@/lib/nasa-data';

export type Layer = 'flame' | 'temperature' | 'oxygen' | 'fuel';

export default function FlameView({
  state,
  settings,
  layer,
  flow,
  nasaDataset
}: {
  state: SimState;
  settings: Settings;
  layer: Layer;
  flow: boolean;
  nasaDataset?: NasaCalibrationDataset | null;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const latest = useRef({ state, settings, layer, flow, nasaDataset });
  latest.current = { state, settings, layer, flow, nasaDataset };

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;

    // Off-screen canvas for field rendering
    const fieldW = 200;
    const fieldH = 170;
    const field = document.createElement('canvas');
    field.width = fieldW;
    field.height = fieldH;
    const fx = field.getContext('2d');
    if (!fx) return;

    let frame = 0;
    let last = 0;

    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      // Throttle to ~30-40fps for high efficiency
      if (now - last < 28) return;
      last = now;

      const { state: s, settings: p, layer: l, flow: showFlow, nasaDataset: nasa } = latest.current;
      const w = el.clientWidth;
      const h = el.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      if (!w || !h) return;
      if (el.width !== Math.round(w * dpr) || el.height !== Math.round(h * dpr)) {
        el.width = Math.round(w * dpr);
        el.height = Math.round(h * dpr);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // 1. Off-white Laboratory Chamber Background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, w, h);

      // Technical Grid Lines
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.08)';
      const gridStep = 32;
      for (let x = gridStep; x < w; x += gridStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = gridStep; y < h; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Physics coordinate calculations
      const buoy = clamp(Math.sqrt(Math.max(0, p.gravity)), 0, 1.414);
      const b = buoy / (buoy + 0.22); // 0 at zero-g, ~0.82 at 1g
      const cx = w * 0.5;
      // Lower vertical center point a few points down so flame has comfortable headroom and visual balance
      const cyOffset = 22;
      const cy = h * (0.48 + 0.05 * b) + cyOffset;

      // Centerline symmetry axis
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.22)';
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(cx, 32);
      ctx.lineTo(cx, h - 34);
      ctx.stroke();
      ctx.setLineDash([]);

      // Millimeter Scale Rulers along left margin
      ctx.font = '9px ui-monospace, monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'right';
      const mmTicks = [
        { label: '+20mm', y: cy - 70 },
        { label: '+10mm', y: cy - 35 },
        { label: '0mm', y: cy },
        { label: '-10mm', y: cy + 35 }
      ];
      for (const tick of mmTicks) {
        if (tick.y > 20 && tick.y < h - 25) {
          ctx.beginPath();
          ctx.moveTo(28, tick.y);
          ctx.lineTo(34, tick.y);
          ctx.strokeStyle = '#cbd5e1';
          ctx.stroke();
          ctx.fillText(tick.label, 26, tick.y + 3);
        }
      }
      ctx.textAlign = 'left';

      // Real-time factor calculations based on Oxygen, Ambient Temp, Flow, Gravity
      const o2Ratio = clamp(p.oxygen / 20.9, 0, 1.5);
      const flowRatio = clamp(p.flow / 0.85, 0.2, 2.5);
      const o2Expansion = 1 + clamp((18 - p.oxygen) / 25, 0, 0.45); // Oxygen-seeking expansion in diffusion
      const tempK = s.temperature;
      const ambientK = p.ambient + 273.15;
      const effectiveHeat = clamp((tempK - ambientK) / 1400, 0, 1.8);
      const power = s.burning ? clamp(s.rate / 0.65, 0.06, 1.6) : 0;

      // STRICT CANVAS BOUNDARIES & FIXED ANCHORS
      // Ensures the flame never leaks off-frame or gets lost when expanding/scaling
      const fixedBurnerY = Math.round(h * 0.74);
      const burnerY = b < 0.15 ? cy + 32 : fixedBurnerY;
      const flameBaseY = burnerY - 3;

      // 0g Spherical flame bounds (margins: top >= 36px, bottom >= 34px, sides >= 36px)
      const maxSafeRadius0g = Math.min(
        (cx - 36) / 1.15,
        (cy - 38) / 1.15,
        (h - 34 - cy) / 1.15
      );

      const baseDim = nasa ? nasa.effectiveQuenchDiameterMm : 17;
      const rawRadius = Math.min(w * 0.17, h * 0.20) * Math.sqrt(flowRatio) * o2Expansion * (s.burning ? clamp(s.size / baseDim, 0.4, 1.45) : 0.25);
      const radius = clamp(rawRadius, 10, Math.max(16, maxSafeRadius0g));

      // 1g Buoyant Plume Height Clamp:
      // Flame rises upward from flameBaseY. Top tip must remain >= 36px from canvas top edge.
      const maxSafeFlameHeight = Math.max(30, flameBaseY - 38);
      const flameHeight = clamp(radius * (1.35 + 0.55 * b), 18, maxSafeFlameHeight);

      // Flame Width Clamp:
      const maxSafeFlameWidth = (cx - 36) / 1.15;
      const flameWidth = clamp(radius * (0.78 - 0.18 * b), 10, maxSafeFlameWidth);

      const flameCenterY = b < 0.2 ? cy : burnerY - flameHeight * 0.52;

      // 2. Saturated Thermal Glow Bloom on Off-White Canvas (Anchored to Fixed Center)
      if (s.burning && effectiveHeat > 0.05) {
        const glowRadius = Math.min(radius * 2.2, Math.min(cx - 15, cy - 15));
        const glow = ctx.createRadialGradient(cx, flameCenterY, radius * 0.1, cx, flameCenterY, Math.max(glowRadius, 20));
        if (b < 0.25) {
          // Microgravity: Vibrant sapphire/cyan luminescence bloom
          glow.addColorStop(0, 'rgba(14, 165, 233, 0.22)');
          glow.addColorStop(0.5, 'rgba(2, 132, 199, 0.08)');
          glow.addColorStop(1, 'rgba(248, 250, 252, 0)');
        } else {
          // Earth/Buoyant: Warm radiant amber/peach bloom
          glow.addColorStop(0, 'rgba(251, 146, 60, 0.24)');
          glow.addColorStop(0.5, 'rgba(234, 88, 12, 0.08)');
          glow.addColorStop(1, 'rgba(248, 250, 252, 0)');
        }
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);
      }

      // 3. High-Definition Pixel Field Computation (200x170 buffer)
      const img = fx.createImageData(fieldW, fieldH);
      const timeFlicker = s.time * 6.5;

      for (let y = 0; y < fieldH; y++) {
        for (let x = 0; x < fieldW; x++) {
          const px = (x / fieldW) * w;
          const py = (y / fieldH) * h;

          // 0g Spherical coordinate: Pure radial expansion/contraction from dead-center (cx, cy)
          const dx0 = (px - cx) / radius;
          const dy0 = (py - cy) / radius;
          const r0g = Math.sqrt(dx0 * dx0 + dy0 * dy0);

          // 1g Buoyant Plume coordinate: Pinned to fixed burner nozzle
          const dy1 = (flameBaseY - py) / flameHeight; // 0 at nozzle, 1 at flame tip
          const wave1 = Math.sin(dy1 * 6.5 + timeFlicker) * 0.04 * b;
          const taper1 = Math.sin(Math.pow(clamp(dy1, 0, 1), 0.58) * Math.PI) * (1 - 0.15 * dy1);
          const effectiveW1 = Math.max(0.12, taper1) * flameWidth;
          const dx1 = (px - cx - wave1 * flameWidth) / effectiveW1;
          const r1g = Math.sqrt(dx1 * dx1 + Math.pow(dy1 - 0.45, 2) * 2.2);

          // Smoothly blend radial coordinate based on gravity
          const r = (1 - b) * r0g + b * r1g;

          // Physical zones
          const rim = Math.exp(-Math.pow((r - 0.78) / (0.11 + 0.03 * b), 2));
          const core = Math.exp(-r * r * 4.2);
          const heat = (rim * 0.92 + core * 0.15) * effectiveHeat;

          let red = 0;
          let green = 0;
          let blue = 0;
          let alpha = 0;

          if (l === 'flame') {
            if (s.burning) {
              if (b < 0.25) {
                // MICROGRAVITY SPHERICAL DIFFUSION FLAME:
                // Fixed-center spherical envelope with luminous solar gold core
                const blueShell = rim;
                const innerGlow = core;
                red = Math.round(15 * blueShell + 250 * innerGlow);
                green = Math.round(145 * blueShell + 210 * innerGlow);
                blue = Math.round(245 * blueShell + 70 * innerGlow);

                // High alpha saturation for clean pop against off-white
                const opacity = clamp((blueShell * 0.95 + innerGlow * 0.7) * Math.min(power, 1.3) * effectiveHeat, 0, 0.98);
                alpha = Math.round(opacity * 255);
              } else {
                // BUOYANT PLUME FLAME (1g Earth):
                // Anchored to fixed nozzle base: Electric blue anchoring ring at nozzle,
                // rich cadmium orange & gold mantle, brilliant white-hot core
                const isBase = clamp(1.0 - dy1 * 4.0, 0, 1) * b; // Electric blue base near fixed nozzle
                const v = clamp(heat, 0, 1);

                // Saturated color blending
                const rFlam = (1 - isBase) * (235 + v * 20) + isBase * 15;
                const gFlam = (1 - isBase) * (90 + v * 145) + isBase * 130;
                const bFlam = (1 - isBase) * (15 + (1 - v) * 20) + isBase * 240;

                // Adjust for Oxygen: High O2 -> hotter whiter core; Low O2 -> sooty deeper orange
                const o2Shift = clamp((o2Ratio - 1) * 0.3, -0.2, 0.3);
                red = clamp(Math.round(rFlam + o2Shift * 20), 0, 255);
                green = clamp(Math.round(gFlam + o2Shift * 40), 0, 255);
                blue = clamp(Math.round(bFlam + o2Shift * 50), 0, 255);

                const opacity = clamp((rim * 0.94 + core * 0.5) * Math.min(power, 1.4) * effectiveHeat, 0, 0.98);
                // Cut off below burner nozzle
                const belowCutoff = dy1 < -0.05 ? 0 : 1;
                alpha = Math.round(opacity * belowCutoff * 255);
              }
            } else {
              alpha = 0;
            }
          } else if (l === 'temperature') {
            // High-contrast thermal colormap on off-white
            const v = clamp(heat, 0, 1);
            if (v < 0.25) {
              red = Math.round(30 + v * 400);
              green = Math.round(140 + v * 300);
              blue = Math.round(210);
            } else if (v < 0.6) {
              red = Math.round(230 + (v - 0.25) * 50);
              green = Math.round(140 + (v - 0.25) * 200);
              blue = Math.round(20);
            } else {
              red = 255;
              green = Math.round(180 + (v - 0.6) * 180);
              blue = Math.round(50 + (v - 0.6) * 450);
            }
            alpha = Math.round(clamp(v * 0.88, 0, 0.95) * 255);
            if (!s.burning) alpha = Math.round(alpha * clamp((s.temperature - ambientK) / 800, 0, 1));
          } else if (l === 'oxygen') {
            // Oxygen concentration field (depletion sink around flame)
            const v = clamp((r - 0.35) / 1.1, 0, 1) * (p.oxygen / 30);
            red = Math.round(20 + v * 40);
            green = Math.round(110 + v * 120);
            blue = Math.round(160 + v * 90);
            alpha = Math.round(clamp(0.25 + v * 0.55, 0, 0.8) * 255);
          } else if (l === 'fuel') {
            // Fuel vapor plume emanating from burner
            const v = clamp((1 - r) * 1.8, 0, 1) * clamp(s.fuelMass / 0.3, 0.1, 1);
            red = Math.round(120 + v * 110);
            green = Math.round(60 + v * 90);
            blue = Math.round(180 + v * 70);
            alpha = Math.round(clamp(v * 0.85, 0, 0.9) * 255);
          }

          const idx = (y * fieldW + x) * 4;
          img.data[idx] = red;
          img.data[idx + 1] = green;
          img.data[idx + 2] = blue;
          img.data[idx + 3] = alpha;
        }
      }

      fx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(field, 0, 0, w, h);

      // 4. Porous Sintered Spherical Burner
      ctx.beginPath();
      ctx.arc(cx, burnerY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#475569';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#94a3b8';
      ctx.stroke();

      // Burner Stem & Gas Feed
      ctx.beginPath();
      ctx.moveTo(cx, burnerY + 6);
      ctx.lineTo(cx, h - 35);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#64748b';
      ctx.stroke();
      ctx.lineWidth = 1;

      // Burner pores
      ctx.fillStyle = '#f8fafc';
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * 3, burnerY + Math.sin(a) * 3, 1, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. Dynamic Flow Transport Vectors (High contrast on off-white)
      if (showFlow) {
        ctx.strokeStyle = '#0284c7';
        ctx.fillStyle = '#0284c7';
        const numArrows = 18;
        for (let i = 0; i < numArrows; i++) {
          const a = (i * Math.PI * 2) / numArrows;
          const phase = (s.time * 0.12 + i * 0.18) % 1;
          const dr = radius * (2.2 - phase * 0.95);

          let xx = cx + Math.cos(a) * dr;
          let yy = flameCenterY + Math.sin(a) * dr;
          const vx = -Math.cos(a) * 11 * (1 - b) + Math.cos(a) * 3 * b;
          const vy = -Math.sin(a) * 11 * (1 - b) - 13 * b;

          if (b > 0.4) {
            xx = cx + ((i % 6) - 2.5) * radius * 0.45;
            yy = burnerY - phase * flameHeight * 1.3;
          }

          ctx.beginPath();
          ctx.moveTo(xx, yy);
          ctx.lineTo(xx + vx, yy + vy);
          ctx.stroke();

          // Arrowhead bead
          ctx.beginPath();
          ctx.arc(xx + vx, yy + vy, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 6. Real-time Live Dimension Caliper (Anchored to Fixed Flame Center)
      if (s.burning && s.size > 1) {
        const caliperX = cx + (b < 0.2 ? radius : flameWidth * 0.95) + 24;
        const caliperY1 = flameCenterY - (b < 0.2 ? radius * 0.6 : flameHeight * 0.45);
        const caliperY2 = flameCenterY + (b < 0.2 ? radius * 0.6 : flameHeight * 0.45);

        ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(caliperX, caliperY1);
        ctx.lineTo(caliperX, caliperY2);
        ctx.moveTo(caliperX - 4, caliperY1);
        ctx.lineTo(caliperX + 4, caliperY1);
        ctx.moveTo(caliperX - 4, caliperY2);
        ctx.lineTo(caliperX + 4, caliperY2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = '9.5px ui-monospace, monospace';
        ctx.fillStyle = '#334155';
        ctx.fillText(`⌀ ${s.size.toFixed(1)} mm`, caliperX + 8, (caliperY1 + caliperY2) / 2 + 3);
      }

      // 7. Status & Telemetry Labels
      ctx.font = '10px ui-monospace, monospace';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';

      if (s.burning) {
        ctx.fillText(
          b < 0.2
            ? '0 g SPHERICAL DIFFUSION FLAME (NASA CIR REFERENCE)'
            : 'BUOYANT CONVECTIVE FLAME · NATURAL CONVECTION',
          cx,
          h - 16
        );
      } else {
        ctx.fillStyle = '#dc2626';
        ctx.fillText('FLAME EXTINGUISHED — CLICK REIGNITE / RESET', cx, h - 16);
      }
      ctx.textAlign = 'left';
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas
      ref={canvas}
      className="flame-canvas"
      role="img"
      aria-label={`${layer} schematic at ${settings.gravity} Earth gravity; ${state.status}. Spatial fields are illustrative and calibrated.`}
    />
  );
}
