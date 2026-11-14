'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export interface Hotspot {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  blueprintCallout: string;
  position: [number, number, number]; // 3D coordinates in model space
  cameraTarget: [number, number, number]; // Camera position to view this hotspot
  specs: { label: string; value: string }[];
}

export const GUARDIAN_HOTSPOTS: Hotspot[] = [
  {
    id: 'display',
    name: 'OLED / LCD Telemetry Display',
    subtitle: 'High-contrast real-time status screen',
    description: 'Displays current ambient temperature reading in large high-contrast numerals alongside dynamic status glyphs and urgent heat warning banners.',
    blueprintCallout: 'Display (OLED/LCD) — 46mm × 25mm active area with scratch-resistant acrylic cover',
    position: [0, 0.2, 1.55],
    cameraTarget: [0, 0.2, 7.5],
    specs: [
      { label: 'Technology', value: '1.3" Monochrome OLED (128×64 px)' },
      { label: 'Refresh Rate', value: '1.0 Hz (ultra-low power)' },
      { label: 'Viewing Angle', value: '170° high-visibility' },
      { label: 'Display Logic', value: 'Temperature, Unit (°C), Alert Banner' }
    ]
  },
  {
    id: 'led',
    name: 'Tri-Color Status LED',
    subtitle: 'Capsule optical early warning beacon',
    description: 'Provides peripheral room visibility for safety status without needing to read the screen. Shines green during safe baseline, amber on elevation, and blinks red during critical heat events.',
    blueprintCallout: 'Status LED (Green/Amber/Red) — Top-mounted optical diffuser pill',
    position: [0, 2.05, 1.5],
    cameraTarget: [0, 2.8, 6.5],
    specs: [
      { label: 'Emitter', value: 'SMD 5050 Addressable RGB' },
      { label: 'States', value: 'Green (Nominal) · Amber (Elevated) · Red Flash (Alarm)' },
      { label: 'Luminance', value: '180 mcd wide dispersion' },
      { label: 'Night Mode', value: 'Ambient light sensor auto-dimming' }
    ]
  },
  {
    id: 'speaker',
    name: 'Acoustic Alert Speaker Array',
    subtitle: 'Perforated piezo alarm matrix',
    description: 'Multi-hole acoustic resonator chamber providing loud 85 dB audible warnings during rapid thermal escalation or when smoke/heat thresholds are exceeded.',
    blueprintCallout: 'Speaker (Alerts) — Front sound emission perforation matrix',
    position: [0, -1.8, 1.62],
    cameraTarget: [0, -1.8, 5.8],
    specs: [
      { label: 'Transducer', value: 'Piezoelectric Ceramic Resonator' },
      { label: 'Output Sound Level', value: '85 dB at 10 cm' },
      { label: 'Frequency', value: '2.4 kHz – 3.2 kHz resonant sweep' },
      { label: 'Alarm Tones', value: 'Chirp (elevation) · Continuous pulsed siren (alarm)' }
    ]
  },
  {
    id: 'vents',
    name: 'Convective Ventilation Gills',
    subtitle: '7-slot lateral air sampling intake',
    description: 'Seven precision-molded horizontal ventilation slots on both sides channel natural room air convection past the internal digital thermistor sensor.',
    blueprintCallout: 'Ventilation (Holes) — 7 horizontal slots per flank, 28mm depth (Side View)',
    position: [-3.68, 0, 0],
    cameraTarget: [-9.5, 0, 0.5],
    specs: [
      { label: 'Slot Dimensions', value: '7 slots × 11.5 mm width × 1.5 mm height' },
      { label: 'Internal Sensor', value: 'Sensirion SHTC3 Digital Temp/Humidity IC' },
      { label: 'Response Time', value: 'τ63% < 6 seconds in moving air' },
      { label: 'Thermal Accuracy', value: '±0.2°C (typ), ±0.5°C (-10°C to 60°C)' }
    ]
  },
  {
    id: 'usbc',
    name: 'USB-C Power & Diagnostic Port',
    subtitle: '5V DC continuous power and fast charging',
    description: 'Standard USB Type-C receptacle located on the rear lower casing for continuous wall-plug power or rapid recharging of internal battery.',
    blueprintCallout: 'USB-C Port — Rear-facing lower 5V DC power inlet (Back View)',
    position: [0, -2.1, -1.6],
    cameraTarget: [0, -2.1, -8.5],
    specs: [
      { label: 'Standard', value: 'USB Type-C (USB 2.0 PD 5V/1A)' },
      { label: 'Input Rating', value: '5.0V DC ± 5%, 500mA typical' },
      { label: 'Battery Backup', value: '1200 mAh Li-Po rechargeable cell' },
      { label: 'Battery Run Time', value: 'Up to 60 days on Wi-Fi sleep profile' }
    ]
  },
  {
    id: 'mount',
    name: 'Wall Mount & Battery Access',
    subtitle: 'Dual keyhole anchor and access door',
    description: 'Twin keyhole mounting slots allow secure single-action screw hanging. The recessed rear panel provides tool-less access to the battery compartment.',
    blueprintCallout: 'Wall Mount Holes & Battery / Access Panel — Rear enclosure (Back View)',
    position: [0, 0.5, -1.6],
    cameraTarget: [0, 0.5, -8.5],
    specs: [
      { label: 'Mounting Style', value: 'Dual Keyhole (40 mm center-to-center)' },
      { label: 'Hardware', value: 'Standard #6 / #8 pan-head screw compatibility' },
      { label: 'Enclosure Material', value: 'UL 94V-0 Flame-Retardant Polycarbonate/ABS' },
      { label: 'Chassis Dimensions', value: '70 mm (W) × 70 mm (H) × 28 mm (D)' }
    ]
  }
];

export type DeviceState = 'nominal' | 'warning' | 'alarm';

export default function GuardianRender({
  temperature = 32.4,
  deviceState = 'warning',
  selectedHotspotId,
  onSelectHotspot,
  cameraPreset = 'isometric'
}: {
  temperature?: number;
  deviceState?: DeviceState;
  selectedHotspotId?: string | null;
  onSelectHotspot?: (hotspot: Hotspot | null) => void;
  cameraPreset?: 'isometric' | 'front' | 'side' | 'back';
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const stateRef = useRef({ temperature, deviceState, cameraPreset, autoRotate, selectedHotspotId });
  stateRef.current = { temperature, deviceState, cameraPreset, autoRotate, selectedHotspotId };

  const sceneRefs = useRef<{
    screenCanvas?: HTMLCanvasElement;
    screenTexture?: THREE.CanvasTexture;
    ledMaterial?: THREE.MeshStandardMaterial;
    ledLight?: THREE.PointLight;
    camera?: THREE.PerspectiveCamera;
    scene?: THREE.Scene;
    renderer?: THREE.WebGLRenderer;
    rootGroup?: THREE.Group;
    targetCamPos?: THREE.Vector3;
    targetLookAt?: THREE.Vector3;
    currentLookAt?: THREE.Vector3;
  }>({});

  // Helper to redraw the 2D OLED screen texture
  const updateScreenCanvas = (temp: number, state: DeviceState) => {
    const canvas = sceneRefs.current.screenCanvas;
    const texture = sceneRefs.current.screenTexture;
    if (!canvas || !texture) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Background deep OLED black
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, W, H);

    // Subtle inner glowing border
    ctx.strokeStyle = state === 'alarm' ? '#ef4444' : state === 'warning' ? '#f59e0b' : '#10b981';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, W - 12, H - 12);

    // Subtle grid/scanline effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    for (let y = 10; y < H; y += 8) {
      ctx.fillRect(6, y, W - 12, 1);
    }

    // Thermometer Icon Graphic
    const tx = 60;
    const ty = 95;
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = state === 'alarm' ? '#ef4444' : state === 'warning' ? '#f59e0b' : '#38bdf8';
    ctx.lineWidth = 4;
    // Bulb
    ctx.beginPath();
    ctx.arc(tx, ty + 24, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Stem
    ctx.beginPath();
    ctx.roundRect(tx - 9, ty - 38, 18, 48, 8);
    ctx.stroke();
    ctx.fill();
    // Mercury core line
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(tx - 2, ty - 30, 4, 30);
    ctx.restore();

    // Large Temperature Display matching blueprint: "32.4°C"
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 86px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${temp.toFixed(1)}°C`, 110, 100);

    // Lower Warning / Status Pill
    const pillY = 195;
    const pillH = 50;
    const pillW = W - 48;
    const pillX = 24;

    ctx.save();
    const pillColor =
      state === 'alarm'
        ? 'rgba(239, 68, 68, 0.95)'
        : state === 'warning'
        ? 'rgba(245, 158, 11, 0.95)'
        : 'rgba(16, 185, 129, 0.9)';
    ctx.fillStyle = pillColor;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 10);
    ctx.fill();

    // Warning text & icon
    ctx.fillStyle = '#0f172a';
    ctx.font = '800 24px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const bannerText =
      state === 'alarm'
        ? '⚠️ CRITICAL HEAT ALARM'
        : state === 'warning'
        ? '⚠️ High Temperature'
        : '✓ Nominal Environment';
    ctx.fillText(bannerText, W / 2, pillY + pillH / 2);
    ctx.restore();

    texture.needsUpdate = true;
  };

  // Update LED and screen when props change
  useEffect(() => {
    updateScreenCanvas(temperature, deviceState);

    // Update LED Material and Light
    if (sceneRefs.current.ledMaterial && sceneRefs.current.ledLight) {
      const ledColor =
        deviceState === 'alarm' ? 0xef4444 : deviceState === 'warning' ? 0xf59e0b : 0x10b981;
      sceneRefs.current.ledMaterial.color.setHex(ledColor);
      sceneRefs.current.ledMaterial.emissive.setHex(ledColor);
      sceneRefs.current.ledLight.color.setHex(ledColor);
    }
  }, [temperature, deviceState]);

  // Camera presets change handler
  useEffect(() => {
    if (!sceneRefs.current.targetCamPos) return;
    if (selectedHotspotId) {
      const hs = GUARDIAN_HOTSPOTS.find(h => h.id === selectedHotspotId);
      if (hs) {
        sceneRefs.current.targetCamPos.set(...hs.cameraTarget);
        sceneRefs.current.targetLookAt?.set(...hs.position);
        return;
      }
    }

    sceneRefs.current.targetLookAt?.set(0, 0, 0);
    if (cameraPreset === 'isometric') {
      sceneRefs.current.targetCamPos.set(6.8, 5.5, 7.8);
    } else if (cameraPreset === 'front') {
      sceneRefs.current.targetCamPos.set(0, 0, 10.5);
    } else if (cameraPreset === 'side') {
      sceneRefs.current.targetCamPos.set(10.5, 0, 0);
    } else if (cameraPreset === 'back') {
      sceneRefs.current.targetCamPos.set(0, 0, -10.5);
    }
  }, [cameraPreset, selectedHotspotId]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRefs.current.scene = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(6.8, 5.5, 7.8);
    sceneRefs.current.camera = camera;

    const targetCamPos = new THREE.Vector3(6.8, 5.5, 7.8);
    const targetLookAt = new THREE.Vector3(0, 0, 0);
    const currentLookAt = new THREE.Vector3(0, 0, 0);
    sceneRefs.current.targetCamPos = targetCamPos;
    sceneRefs.current.targetLookAt = targetLookAt;
    sceneRefs.current.currentLookAt = currentLookAt;

    // 3. Renderer with high DPR and shadows
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    sceneRefs.current.renderer = renderer;

    // 4. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(8, 12, 10);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 1.1);
    fillLight.position.set(-8, -4, -6);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffedd5, 1.3);
    rimLight.position.set(0, 10, -10);
    scene.add(rimLight);

    // Root Group
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);
    sceneRefs.current.rootGroup = rootGroup;

    // 5. Construct Procedural Device Chassis (70mm x 70mm x 28mm)
    // Scale: 1 unit = 10mm (Chassis = 7.0 x 7.0 x 2.8 units)
    const W = 7.0;
    const H = 7.0;
    const D = 2.8;
    const R = 1.35; // Corner squircle radius

    // Chassis 2D Squircle Profile
    const shape = new THREE.Shape();
    shape.moveTo(-W / 2 + R, -H / 2);
    shape.lineTo(W / 2 - R, -H / 2);
    shape.quadraticCurveTo(W / 2, -H / 2, W / 2, -H / 2 + R);
    shape.lineTo(W / 2, H / 2 - R);
    shape.quadraticCurveTo(W / 2, H / 2, W / 2 - R, H / 2);
    shape.lineTo(-W / 2 + R, H / 2);
    shape.quadraticCurveTo(-W / 2, H / 2, -W / 2, H / 2 - R);
    shape.lineTo(-W / 2, -H / 2 + R);
    shape.quadraticCurveTo(-W / 2, -H / 2, -W / 2 + R, -H / 2);

    const extrudeSettings = {
      steps: 1,
      depth: D,
      bevelEnabled: true,
      bevelThickness: 0.18,
      bevelSize: 0.18,
      bevelSegments: 5
    };

    const chassisGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    chassisGeo.center();

    // Matte Polycarbonate Medical / Industrial White Material
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.28,
      metalness: 0.04
    });
    const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
    rootGroup.add(chassisMesh);

    // Front Face Plate & Bezel
    const frontBezelGeo = new THREE.BoxGeometry(5.0, 3.2, 0.08);
    const bezelMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.45,
      metalness: 0.2
    });
    const bezelMesh = new THREE.Mesh(frontBezelGeo, bezelMat);
    bezelMesh.position.set(0, 0.2, D / 2 + 0.17);
    rootGroup.add(bezelMesh);

    // OLED Display Canvas Texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 280;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    sceneRefs.current.screenCanvas = canvas;
    sceneRefs.current.screenTexture = texture;

    const screenGeo = new THREE.PlaneGeometry(4.6, 2.8);
    const screenMat = new THREE.MeshBasicMaterial({ map: texture });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, 0.2, D / 2 + 0.22);
    rootGroup.add(screenMesh);

    // Status LED Capsule on Front Top
    const ledGeo = new THREE.CapsuleGeometry(0.12, 0.45, 6, 12);
    ledGeo.rotateZ(Math.PI / 2);
    const ledColor =
      stateRef.current.deviceState === 'alarm'
        ? 0xef4444
        : stateRef.current.deviceState === 'warning'
        ? 0xf59e0b
        : 0x10b981;
    const ledMat = new THREE.MeshStandardMaterial({
      color: ledColor,
      emissive: ledColor,
      emissiveIntensity: 1.8,
      roughness: 0.1
    });
    const ledMesh = new THREE.Mesh(ledGeo, ledMat);
    ledMesh.position.set(0, 2.05, D / 2 + 0.16);
    rootGroup.add(ledMesh);
    sceneRefs.current.ledMaterial = ledMat;

    // Glowing point light from the LED
    const ledLight = new THREE.PointLight(ledColor, 1.2, 3.5);
    ledLight.position.set(0, 2.1, D / 2 + 0.35);
    rootGroup.add(ledLight);
    sceneRefs.current.ledLight = ledLight;

    // Speaker Micro-Perforation Array on Front Bottom (Prominent Acoustic Alarm Matrix)
    const speakerGroup = new THREE.Group();
    // Positioned strictly in front of chassis bevel (Z = 1.58 + 0.012 = 1.592)
    speakerGroup.position.set(0, -1.8, D / 2 + 0.192);

    // Subtle recessed speaker grill backing bezel
    const speakerBackingGeo = new THREE.CircleGeometry(0.72, 32);
    const speakerBackingMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
    const speakerBacking = new THREE.Mesh(speakerBackingGeo, speakerBackingMat);
    speakerGroup.add(speakerBacking);

    // Subtle acoustic chamber rim
    const speakerRimGeo = new THREE.RingGeometry(0.68, 0.72, 32);
    const speakerRimMat = new THREE.MeshBasicMaterial({ color: 0xcbd5e1 });
    const speakerRim = new THREE.Mesh(speakerRimGeo, speakerRimMat);
    speakerRim.position.z = 0.001;
    speakerGroup.add(speakerRim);

    // 37 High-contrast acoustic sound perforation holes in 5 staggered rows
    const dotGeo = new THREE.CircleGeometry(0.065, 16);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x090d16 });

    const rows = [5, 8, 9, 8, 5];
    rows.forEach((count, rIdx) => {
      const y = (rIdx - 2) * 0.15;
      const startX = -((count - 1) * 0.15) / 2;
      for (let i = 0; i < count; i++) {
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.position.set(startX + i * 0.15, y, 0.003);
        speakerGroup.add(dot);
      }
    });
    rootGroup.add(speakerGroup);

    // 7 Ventilation Gills on both left and right sides (Exact Blueprint Match: Horizontal Slots Stacked Vertically)
    const ventMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    // Horizontal capsule slot along Z (depth): width 1.15 units (11.5 mm), height 0.14 units (1.4 mm)
    const ventGeo = new THREE.CapsuleGeometry(0.07, 1.15, 4, 8);
    ventGeo.rotateX(Math.PI / 2); // Aligns the capsule along the Z axis (depth)

    // Subtle inner housing border for high realism
    const ventRecessGeo = new THREE.BoxGeometry(0.04, 0.17, 1.25);
    const ventRecessMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });

    [-1, 1].forEach(side => {
      const xPos = side * (W / 2 + 0.18);
      for (let i = -3; i <= 3; i++) {
        const yPos = i * 0.28; // Centered vertically around middle of side panel
        // Inner dark recess
        const recess = new THREE.Mesh(ventRecessGeo, ventRecessMat);
        recess.position.set(xPos - side * 0.02, yPos, 0);
        rootGroup.add(recess);

        // Rounded horizontal slit
        const vent = new THREE.Mesh(ventGeo, ventMat);
        vent.position.set(xPos, yPos, 0);
        rootGroup.add(vent);
      }
    });

    // Back Panel Features (Exact Blueprint Match: Wall Mounts, Battery Door, USB-C Port)
    // 1. Battery Access Panel: Centered rounded rectangular door (4.4 × 2.2 units)
    const hatchGeo = new THREE.BoxGeometry(4.4, 2.2, 0.05);
    const hatchMat = new THREE.MeshStandardMaterial({
      color: 0xedeef2,
      roughness: 0.42,
      metalness: 0.05
    });
    const hatchMesh = new THREE.Mesh(hatchGeo, hatchMat);
    hatchMesh.position.set(0, -0.3, -D / 2 - 0.16);
    rootGroup.add(hatchMesh);

    // Finger release notch on top edge of battery hatch
    const notchGeo = new THREE.CapsuleGeometry(0.06, 0.6, 4, 8);
    notchGeo.rotateZ(Math.PI / 2);
    const notchMat = new THREE.MeshBasicMaterial({ color: 0xcfd4dc });
    const notch = new THREE.Mesh(notchGeo, notchMat);
    notch.position.set(0, 0.78, -D / 2 - 0.17);
    rootGroup.add(notch);

    // 2. Wall Mount Keyhole Slots (Twin keyholes near top corners, 40mm center-to-center)
    const keyholeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    [-1.6, 1.6].forEach(x => {
      // Circle top
      const topCircle = new THREE.Mesh(new THREE.CircleGeometry(0.2, 12), keyholeMat);
      topCircle.position.set(x, 1.8, -D / 2 - 0.18);
      topCircle.rotation.y = Math.PI;
      rootGroup.add(topCircle);
      // Keyhole vertical slot bottom
      const slot = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.32), keyholeMat);
      slot.position.set(x, 1.6, -D / 2 - 0.18);
      slot.rotation.y = Math.PI;
      rootGroup.add(slot);
    });

    // 3. USB-C Port (Exact Blueprint Match: On the REAR / BACK face, below battery door)
    // Outer stadium port cutout bezel
    const usbcOuterGeo = new THREE.CapsuleGeometry(0.18, 0.72, 4, 8);
    usbcOuterGeo.rotateZ(Math.PI / 2); // Aligns along X (horizontal)
    const usbcOuterMat = new THREE.MeshBasicMaterial({ color: 0x090d16 });
    const usbcOuter = new THREE.Mesh(usbcOuterGeo, usbcOuterMat);
    usbcOuter.position.set(0, -2.1, -D / 2 - 0.18);
    rootGroup.add(usbcOuter);

    // Metallic center contact tongue inside the USB-C port
    const tongueGeo = new THREE.BoxGeometry(0.48, 0.05, 0.15);
    const tongueMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      metalness: 0.9,
      roughness: 0.18
    });
    const tongue = new THREE.Mesh(tongueGeo, tongueMat);
    tongue.position.set(0, -2.1, -D / 2 - 0.18);
    rootGroup.add(tongue);

    // Initial Screen Draw
    updateScreenCanvas(stateRef.current.temperature, stateRef.current.deviceState);

    // Mouse / Touch Drag Orbit Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotX = 0.25;
    let rotY = -0.55;
    let initialPinchDist = 0;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e) {
        if (e.touches.length >= 2) {
          isDragging = false;
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          initialPinchDist = Math.hypot(dx, dy);
          return;
        }
        if (e.touches.length === 1) {
          isDragging = true;
          prevMouseX = e.touches[0].clientX;
          prevMouseY = e.touches[0].clientY;
        }
      } else {
        isDragging = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e) {
        if (e.touches.length >= 2 && initialPinchDist > 0) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const currentDist = Math.hypot(dx, dy);
          if (sceneRefs.current.targetCamPos && currentDist > 10) {
            const diff = currentDist - initialPinchDist;
            const len = sceneRefs.current.targetCamPos.length();
            // Fingers spreading apart (diff > 0) zooms in, fingers together zooms out
            const nextLen = Math.max(5.0, Math.min(18.0, len - diff * 0.025));
            sceneRefs.current.targetCamPos.setLength(nextLen);
            initialPinchDist = currentDist;
          }
          return;
        }
        if (!isDragging || e.touches.length !== 1) return;
        const clientX = e.touches[0].clientX;
        const clientY = e.touches[0].clientY;
        const deltaX = clientX - prevMouseX;
        const deltaY = clientY - prevMouseY;
        prevMouseX = clientX;
        prevMouseY = clientY;

        // On touch screens with touch-action: pan-y, vertical swipes are reserved for native page scrolling.
        // Horizontal swipes orbit the turntable model smoothly.
        rotY += deltaX * 0.008;
        // Only apply vertical camera tilt if horizontal movement is dominant, avoiding jarring vertical tumbles during scroll
        if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
          rotX += deltaY * 0.004;
          rotX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, rotX));
        }
      } else {
        if (!isDragging) return;
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;

        rotY += deltaX * 0.008;
        rotX += deltaY * 0.008;
        rotX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, rotX));
      }
    };

    const onPointerUp = (e?: MouseEvent | TouchEvent) => {
      if (e && 'touches' in e) {
        if (e.touches.length === 1) {
          // One finger remaining after a pinch gesture: re-sync coordinate without sudden drag jumps
          prevMouseX = e.touches[0].clientX;
          prevMouseY = e.touches[0].clientY;
          isDragging = false;
        } else if (e.touches.length === 0) {
          isDragging = false;
          initialPinchDist = 0;
        }
      } else {
        isDragging = false;
        initialPinchDist = 0;
      }
    };

    // Zoom on wheel
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!sceneRefs.current.targetCamPos) return;
      const len = sceneRefs.current.targetCamPos.length();
      const nextLen = Math.max(5.0, Math.min(18.0, len + (e.deltaY > 0 ? 0.8 : -0.8)));
      sceneRefs.current.targetCamPos.setLength(nextLen);
    };

    const dom = renderer.domElement;
    dom.style.touchAction = 'pan-y';
    dom.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    dom.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Auto rotation when enabled and user isn't dragging
      if (stateRef.current.autoRotate && !isDragging) {
        rotY += 0.008;
      }

      // Smoothly apply rotation to rootGroup
      rootGroup.rotation.y += (rotY - rootGroup.rotation.y) * 0.12;
      rootGroup.rotation.x += (rotX - rootGroup.rotation.x) * 0.12;

      // Smooth camera interpolation towards target position and lookAt
      if (sceneRefs.current.targetCamPos && sceneRefs.current.targetLookAt) {
        camera.position.lerp(sceneRefs.current.targetCamPos, 0.08);
        currentLookAt.lerp(sceneRefs.current.targetLookAt, 0.08);
        camera.lookAt(currentLookAt);
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      dom.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      chassisGeo.dispose();
      chassisMat.dispose();
      screenGeo.dispose();
      screenMat.dispose();
      texture.dispose();
    };
  }, []);

  return (
    <div className="guardian-3d-wrapper">
      <div ref={mountRef} className="guardian-3d-canvas" />

      {/* Floating 3D Navigation Controls */}
      <div className="guardian-3d-controls">
        <div className="guardian-views-pill">
          <button
            className={cameraPreset === 'isometric' ? 'active' : ''}
            onClick={() => onSelectHotspot?.(null)}
            title="Isometric 3D Perspective"
          >
            Isometric
          </button>
          <button
            className={cameraPreset === 'front' ? 'active' : ''}
            onClick={() => onSelectHotspot?.(GUARDIAN_HOTSPOTS[0])}
            title="Front Face (Display & Speaker)"
          >
            Front
          </button>
          <button
            className={cameraPreset === 'side' ? 'active' : ''}
            onClick={() => onSelectHotspot?.(GUARDIAN_HOTSPOTS[3])}
            title="Side Face (Ventilation Gills)"
          >
            Side
          </button>
          <button
            className={cameraPreset === 'back' ? 'active' : ''}
            onClick={() => onSelectHotspot?.(GUARDIAN_HOTSPOTS[5])}
            title="Rear Face (Mount & USB-C)"
          >
            Back
          </button>
        </div>

        <button
          className={'guardian-autorotate-btn ' + (autoRotate ? 'active' : '')}
          onClick={() => setAutoRotate(!autoRotate)}
          title="Toggle 360° Studio Turntable Rotation"
        >
          {autoRotate ? 'Pause Rotation' : '360° Spin'}
        </button>
      </div>

      {/* Dimension watermark */}
      <div className="guardian-canvas-watermark">
        <span>EMBER GUARDIAN · 70 × 70 × 28 mm · 1:1 SCALE RENDER</span>
      </div>
    </div>
  );
}
