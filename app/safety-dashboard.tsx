import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowRight, Beaker, Bell, Building2, Camera, Check, ChevronRight, ClipboardCheck, Download, Eye, FileSearch, Flame, Home, ImagePlus, Layers, Plus, RefreshCw, Rocket, RotateCcw, ScanSearch, Shield, SwitchCamera, Trash2, X } from 'lucide-react';
import { CATEGORIES, type AIStatus, type Finding, type Photo, type Room, type SafetyState } from '@/lib/safety';
import { auditFindingsWithNasa, evaluateFindingNasaBenchmark, type NasaAuditReport, type NasaFindingBenchmark } from '@/lib/nasa-safety-audit';

const blank: SafetyState = { rooms: [], findings: [], assessments: [], photoCounts: {}, at: 0 };

async function api(path: string, method = 'GET', data?: unknown) {
  const response = await fetch('/api/safety/' + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify(data)
  });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || 'Request failed.');
  return value;
}

function downloadJSON(name: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function useSafety() {
  const [data, setData] = useState<SafetyState>(blank);
  const [error, setError] = useState('');
  const mounted = useRef(false);
  const busy = useRef(false);

  const reload = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const d: SafetyState = await api('state');
      if (!mounted.current) return;
      setData(d);
      setError('');
    } catch (e) {
      if (mounted.current) setError((e as Error).message);
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void reload();
    const timer = setInterval(reload, 4000);
    return () => {
      mounted.current = false;
      clearInterval(timer);
    };
  }, [reload]);

  return { data, error, reload };
}

export function SafetyBanner({ data, error, onOpen }: { data: SafetyState; error: string; onOpen: () => void }) {
  if (error) {
    return (
      <button className="global-alert fault" onClick={onOpen}>
        <AlertTriangle size={17} />
        <span>Monitoring connection unavailable. Open Room Safety to check local server.</span>
        <ArrowRight size={16} />
      </button>
    );
  }
  const openFindings = data.findings.filter(f => !['resolved', 'dismissed'].includes(f.status));
  const urgentFindings = openFindings.filter(f => f.priority === 'urgent_review');
  if (urgentFindings.length > 0) {
    return (
      <button className="global-alert danger" onClick={onOpen}>
        <AlertTriangle size={18} />
        <span>
          <b>ACTION NEEDED: {urgentFindings.length} urgent fire hazard(s) flagged.</b> Review recommended fixes for your spaces.
        </span>
        <ArrowRight size={16} />
      </button>
    );
  }
  if (openFindings.length > 0) {
    return (
      <button className="global-alert watch" onClick={onOpen}>
        <AlertTriangle size={18} />
        <span>
          <b>{openFindings.length} safety item(s) to review.</b> Check recent room survey findings.
        </span>
        <ArrowRight size={16} />
      </button>
    );
  }
  return null;
}

function Modal({ title, children, close }: { title: string; children: React.ReactNode; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog ref={ref} className="modal safety-modal" onCancel={close} aria-label={title}>
      <div className="modal-inner">
        <button className="modal-close icon-button" aria-label="Close dialog" onClick={close}>
          <X size={18} />
        </button>
        <h2>{title}</h2>
        {children}
      </div>
    </dialog>
  );
}

async function prepareImage(file: File): Promise<string> {
  if (file.size > 12000000) throw new Error('Use a photo smaller than 12 MB.');
  const mime = (file.type || '').toLowerCase();
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const isImage = mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(ext);
  if (!isImage) throw new Error('Use JPEG, PNG or WebP format.');
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    if (!img.width || !img.height) throw new Error('Could not read image.');
    const scale = Math.min(1, 1400 / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Image conversion unavailable.');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.83);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function CameraCaptureModal({
  roomId,
  roomName,
  onSave,
  onClose,
  notify
}: {
  roomId: string;
  roomName: string;
  onSave: (dataUrl: string, label: string) => Promise<void>;
  onClose: () => void;
  notify: (msg: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceIndex, setDeviceIndex] = useState(0);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async (devIdx = 0) => {
    stopStream();
    setLoading(true);
    setErrorMsg(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access (getUserMedia) is not supported in this browser.');
      }

      let currentDevices = videoDevices;
      if (!currentDevices.length) {
        const allDevices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
        currentDevices = allDevices.filter(d => d.kind === 'videoinput');
        setVideoDevices(currentDevices);
      }

      const specificDevice = currentDevices[devIdx];
      const constraints: MediaStreamConstraints = {
        video: specificDevice?.deviceId
          ? { deviceId: { exact: specificDevice.deviceId } }
          : { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      const msg = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
        ? 'Camera permission was denied. Please allow camera access in your browser settings.'
        : err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError'
        ? 'No camera hardware found on this device.'
        : err.message || 'Could not start camera.';
      setErrorMsg(msg);
    }
  }, [stopStream, videoDevices]);

  useEffect(() => {
    dialogRef.current?.showModal();
    void startCamera(deviceIndex);
    return () => {
      stopStream();
      dialogRef.current?.close();
    };
  }, []);

  function switchCamera() {
    if (videoDevices.length <= 1) return;
    const nextIdx = (deviceIndex + 1) % videoDevices.length;
    setDeviceIndex(nextIdx);
    void startCamera(nextIdx);
  }

  function snapPhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    const maxDim = 1400;
    const w = video.videoWidth;
    const h = video.videoHeight;
    const scale = Math.min(1, maxDim / Math.max(w, h));
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCaptured(dataUrl);
  }

  function retake() {
    setCaptured(null);
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => {});
    }
  }

  async function handleSave() {
    if (!captured) return;
    setSaving(true);
    try {
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      await onSave(captured, `Camera View (${timestamp})`);
      stopStream();
      onClose();
    } catch (err: any) {
      notify(err.message || 'Could not save captured photo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="modal safety-modal camera-modal" onCancel={() => { stopStream(); onClose(); }}>
      <div className="modal-inner" style={{ maxWidth: '640px', width: '92vw' }}>
        <button className="modal-close icon-button" onClick={() => { stopStream(); onClose(); }} aria-label="Close camera">
          <X size={18} />
        </button>

        <h2>Take Room Photo</h2>
        <p style={{ margin: '0 0 14px', fontSize: '13px', color: 'var(--muted)' }}>
          Position heating equipment, electrical strips, cooktops, or doors clearly in frame for {roomName}.
        </p>

        {errorMsg ? (
          <div className="camera-error-box">
            <AlertTriangle size={24} style={{ color: 'var(--danger)', flexShrink: 0 }} />
            <div>
              <b style={{ color: 'var(--danger)', display: 'block', fontSize: '13px', marginBottom: '4px' }}>Camera Unavailable</b>
              <p style={{ fontSize: '12px', margin: 0, color: 'var(--muted)' }}>{errorMsg}</p>
            </div>
          </div>
        ) : (
          <div className="camera-viewfinder-container">
            {captured ? (
              <img src={captured} alt="Captured room view preview" className="camera-preview-image" />
            ) : (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="camera-live-video" />
                {loading && (
                  <div className="camera-overlay-loader">
                    <RefreshCw size={24} className="spin" />
                    <span>Connecting camera…</span>
                  </div>
                )}
                <div className="camera-reticle">
                  <span className="reticle-tl" />
                  <span className="reticle-tr" />
                  <span className="reticle-bl" />
                  <span className="reticle-br" />
                </div>
              </>
            )}
          </div>
        )}

        <div className="camera-actions-bar">
          {errorMsg ? (
            <button className="secondary" onClick={() => { stopStream(); onClose(); }}>
              Close
            </button>
          ) : captured ? (
            <>
              <button className="secondary" onClick={retake} disabled={saving}>
                <RotateCcw size={14} /> Retake
              </button>
              <button className="primary" onClick={() => void handleSave()} disabled={saving}>
                <Check size={14} /> {saving ? 'Saving…' : 'Save Photo to Room'}
              </button>
            </>
          ) : (
            <>
              {videoDevices.length > 1 && (
                <button className="quiet" onClick={switchCamera} title="Switch camera" disabled={loading}>
                  <SwitchCamera size={16} /> Switch Camera
                </button>
              )}
              <div style={{ flex: 1 }} />
              <button className="quiet" onClick={() => { stopStream(); onClose(); }}>
                Cancel
              </button>
              <button className="camera-shutter-btn" onClick={snapPhoto} disabled={loading} title="Capture Photo" aria-label="Snap Photo">
                <span className="camera-shutter-inner" />
              </button>
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}

export default function SafetyDashboard({
  data,
  error,
  reload,
  notify,
  onOpenScanner,
  selectedRoomId,
  onSelectRoom,
  onSimulatePreset,
  onOpenPsi
}: {
  data: SafetyState;
  error: string;
  reload: () => Promise<void>;
  notify: (s: string) => void;
  onOpenScanner?: () => void;
  selectedRoomId?: string;
  onSelectRoom?: (id: string) => void;
  onSimulatePreset?: (presetId: string) => void;
  onOpenPsi?: (investigationId?: string) => void;
}) {
  const [roomId, setRoomIdState] = useState(selectedRoomId || '');
  const [building, setBuilding] = useState('all');

  const setRoomId = (id: string) => {
    setRoomIdState(id);
    onSelectRoom?.(id);
  };

  useEffect(() => {
    if (selectedRoomId && selectedRoomId !== roomId) {
      setRoomIdState(selectedRoomId);
      const targetRoom = data.rooms.find(r => r.id === selectedRoomId);
      if (targetRoom && building !== 'all' && targetRoom.building !== building) {
        setBuilding('all');
      }
    }
  }, [selectedRoomId]);

  useEffect(() => {
    if (!roomId && data.rooms.length > 0) {
      const initial = selectedRoomId || data.rooms[0].id;
      setRoomIdState(initial);
      onSelectRoom?.(initial);
    }
  }, [data.rooms]);
  const [newRoom, setNewRoom] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [review, setReview] = useState<Finding | null>(null);
  const [note, setNote] = useState('');
  const [reviewState, setReviewState] = useState('confirmed');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [ai, setAi] = useState<AIStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [cloudConsent, setCloudConsent] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState<Photo | null>(null);
  const [refreshingAI, setRefreshingAI] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const activeRoom = useRef(roomId);
  activeRoom.current = roomId;

  const selected = data.rooms.find(r => r.id === roomId);
  const rooms = data.rooms.filter(r => building === 'all' || r.building === building);
  const buildings = [...new Set(data.rooms.map(r => r.building))];
  const openFindings = data.findings.filter(f => !['resolved', 'dismissed'].includes(f.status));
  const urgentFindings = openFindings.filter(f => f.priority === 'urgent_review');
  const findings = data.findings.filter(f => f.roomId === roomId);
  const assessments = data.assessments.filter(a => a.roomId === roomId);
  const totalPhotos = Object.values(data.photoCounts).reduce((a, b) => a + b, 0);

  const latestAssessment = assessments[0];
  const auditReport: NasaAuditReport | undefined =
    latestAssessment?.nasaAudit ||
    (findings.length > 0 && selected ? auditFindingsWithNasa(findings, selected).auditReport : undefined);

  function handleTakePhotoClick() {
    if (photos.length >= 4) {
      notify('Maximum of 4 photos per room allowed.');
      return;
    }
    if (typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function') {
      setCameraOpen(true);
    } else {
      cameraRef.current?.click();
    }
  }

  async function loadPhotos(id = roomId) {
    if (!id) {
      setPhotos([]);
      return;
    }
    try {
      const p = await api('photos?roomId=' + encodeURIComponent(id));
      if (activeRoom.current === id) setPhotos(p);
    } catch (e) {
      notify((e as Error).message);
    }
  }

  async function checkAI() {
    setRefreshingAI(true);
    try {
      const [status] = await Promise.all([api('ai-status'), new Promise(r => setTimeout(r, 600))]);
      setAi(status);
      const name = status.provider === 'gemini' ? 'Google Gemini Flash' : status.provider === 'deepseek' ? 'DeepSeek' : status.provider === 'ollama' ? 'Ollama' : status.provider;
      notify(`AI provider checked: ${name} (${status.configured ? 'Ready' : 'Not configured'})`);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setRefreshingAI(false);
    }
  }

  useEffect(() => {
    void checkAI();
  }, []);

  useEffect(() => {
    setPhotos([]);
    if (roomId) void loadPhotos(roomId);
    setCloudConsent(false);
  }, [roomId]);

  async function mutate(path: string, method: string, value: unknown, success: string) {
    setBusy(true);
    try {
      const result = await api(path, method, value);
      await reload();
      notify(success);
      return result;
    } catch (e) {
      notify((e as Error).message);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function createRoom(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const result = await mutate('rooms', 'POST', Object.fromEntries(form.entries()), 'Room added to building survey.');
    if (result) {
      setRoomId(result.id);
      setNewRoom(false);
      setBuilding(result.building);
    }
  }

  async function upload(files: FileList | null) {
    if (!files || !selected) return;
    const id = selected.id;
    setBusy(true);
    try {
      const picked = Array.from(files);
      if (photos.length + picked.length > 4) throw new Error('Maximum of 4 photos per room allowed.');
      for (const file of picked) {
        const dataUrl = await prepareImage(file);
        await api('photos', 'POST', { roomId: id, label: file.name.slice(0, 80) || 'Room view', dataUrl });
      }
      await loadPhotos(id);
      await reload();
      notify('Photos saved locally.');
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
      if (cameraRef.current) cameraRef.current.value = '';
    }
  }

  async function analyze() {
    setAnalyzing(true);
    try {
      await api('analyze', 'POST', { roomId, cloudConsent });
      await reload();
      notify('AI survey observations generated for review.');
      setCloudConsent(false);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function addFinding(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    const result = await mutate('findings', 'POST', { ...f, roomId, photoId: f.photoId || null, uncertainty: 'Manual observation; requires verification.' }, 'Observation recorded.');
    if (result) setManualOpen(false);
  }

  async function enableNotifications() {
    if (typeof Notification === 'undefined') {
      notify('Browser notifications are unavailable here.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem('ember-notify', 'yes');
      notify('Local browser notifications enabled.');
    } else {
      notify('Notification permission not granted.');
    }
  }

  const hasAlarm = urgentFindings.length > 0;
  const hasWarning = openFindings.length > 0;

  return (
    <div className="guard-page">
      <div className="section-intro">
        <div>
          <div className="eyebrow"><Shield size={14} /> EMBER SAFETY · SPACE HABITAT SURVEYS & AI</div>
          <h1>Space Safety & Prevention</h1>
          <p>Photograph habitable crew volumes, rovers, and space habitats to identify fire hazards with AI, review plain-English fixes, and audit against NASA flight standards.</p>
        </div>
        <div className="intro-actions">
          <button className="secondary" onClick={enableNotifications}>
            <Bell size={14} /> Enable alerts
          </button>
          <button className="primary" onClick={() => setNewRoom(true)}>
            <Plus size={14} /> Add a room
          </button>
        </div>
      </div>

      <div className={`status-summary-card ${hasAlarm ? 'alarm' : hasWarning ? 'warning' : 'ok'}`}>
        <div className="status-summary-left">
          <span className="status-indicator-dot" />
          <div>
            <b>
              {hasAlarm
                ? `Action Needed: ${urgentFindings.length} urgent fire hazard(s) flagged!`
                : hasWarning
                ? `${openFindings.length} Safety items need your attention`
                : 'All Clear: No unresolved fire hazards flagged in your spaces'}
            </b>
            <p>
              {hasAlarm
                ? 'Review the urgent findings below and follow the recommended step-by-step actions.'
                : hasWarning
                ? 'Review open findings below and follow the recommended guidance to maintain safety.'
                : 'Your spaces are currently clear and all recorded action items have been addressed.'}
            </p>
          </div>
        </div>
        <div className="status-summary-pills">
          <span><b>{data.rooms.length}</b> Spaces</span>
          <span><b>{totalPhotos}</b> Photos</span>
          <span><b>{openFindings.length}</b> Open Fixes</span>
        </div>
      </div>

      <div className="guard-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-heading)', fontWeight: 600, fontSize: '14px' }}>
          <Camera size={16} />
          <span>Room Checklists & Photo Inspections</span>
        </div>
        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
          {onOpenScanner && (
            <button className="secondary" onClick={onOpenScanner} title="Open 2D Floorplan Hazard Map">
              <Layers size={14} /> <span>2D Hazard Map</span>
            </button>
          )}
          <button className="quiet" onClick={reload} title="Refresh space data">
            <RefreshCw size={13} /> <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="global-alert fault" role="alert" style={{ marginBottom: '18px' }}>
          <AlertTriangle size={16} />
          <span>Could not refresh room data: {error}.</span>
        </div>
      )}

      <div className={`survey-layout ${selected ? 'has-selected-room' : ''}`}>
        <aside className="panel room-list">
          <div className="panel-heading">
            <h2>Your spaces</h2>
            <Building2 size={16} />
          </div>
          <label className="field-label" htmlFor="building-filter">Filter by Vehicle / Facility</label>
          <select id="building-filter" value={building} onChange={e => { setBuilding(e.target.value); setRoomId(''); }}>
            <option value="all">All vehicles & facilities ({data.rooms.length})</option>
            {buildings.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          {!rooms.length ? (
            <p className="muted no-rooms" style={{ fontSize: '12px', padding: '12px', textAlign: 'center' }}>
              Add a space to document a rover, habitat, or laboratory module.
            </p>
          ) : (
            rooms.map(r => (
              <button className={'room-option ' + (roomId === r.id ? 'active' : '')} onClick={() => setRoomId(r.id)} key={r.id}>
                <Home size={16} className="shrink-0" />
                <span>
                  <b>{r.name}</b>
                  <small>{r.building} · {r.floor || 'Floor not set'}</small>
                  <em>{data.photoCounts[r.id] || 0} photos · {data.findings.filter(f => f.roomId === r.id && !['resolved', 'dismissed'].includes(f.status)).length} open items</em>
                </span>
                <ChevronRight size={14} className="muted" />
              </button>
            ))
          )}

          <button className="secondary add-space" onClick={() => setNewRoom(true)}>
            <Plus size={14} /> Add room / area
          </button>

          {onOpenScanner && (
            <button className="text-button" style={{ marginTop: '14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={onOpenScanner}>
              <Layers size={13} /> Model in 2D Hazard Scanner →
            </button>
          )}

          <p className="room-group-note">
            Room inspection checklist. Photos do not uncover hidden structural or concealed wiring hazards.
          </p>
        </aside>

        <div className="survey-content">
          {!selected ? (
            <div className="empty-state">
              <Camera size={38} />
              <h2>Check your rooms for fire hazards.</h2>
              <p>Select a space on the left or add a new room to upload photos of appliances, cords, heaters, and doors for AI inspection.</p>
              <button className="primary" onClick={() => setNewRoom(true)}>
                Add your first room <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <>
              <div className="survey-mobile-room-banner">
                <button className="quiet survey-back-btn" onClick={() => setRoomId('')}>
                  ← All spaces
                </button>
                <span className="survey-mobile-room-title">{selected.name}</span>
              </div>
              <section className="panel survey-photos">
                <div className="panel-heading">
                  <div>
                    <div className="eyebrow">{selected.building} / {selected.kind}</div>
                    <h2>{selected.name}</h2>
                    <p style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {selected.floor}{selected.adjacent ? ` · Adjacent: ${selected.adjacent}` : ''}
                    </p>
                  </div>
                  <span className="tag">{photos.length} / 4 PHOTOS</span>
                </div>
                {selected.notes && <p style={{ fontSize: '12px', color: 'var(--text)', background: 'var(--chip-bg)', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px' }}>{selected.notes}</p>}

                <div className="photo-grid">
                  {photos.map((p, i) => (
                    <figure key={p.id}>
                      <button onClick={() => setExpandedPhoto(p)} aria-label={'Enlarge ' + p.label}>
                        <img src={p.dataUrl} alt={`${selected.name}: ${p.label}`} />
                        <span>{i + 1}</span>
                      </button>
                      <figcaption>
                        <span style={{ fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.label}</span>
                        <button
                          className="icon-button"
                          aria-label={'Delete ' + p.label}
                          onClick={async () => {
                            if (!confirm('Delete this photo?')) return;
                            try {
                              await api('photos?id=' + p.id, 'DELETE');
                              await loadPhotos();
                              await reload();
                            } catch (e) {
                              notify((e as Error).message);
                            }
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </figcaption>
                    </figure>
                  ))}
                  {photos.length < 4 && (
                    <button className="photo-placeholder" onClick={() => fileRef.current?.click()} disabled={busy}>
                      <ImagePlus size={24} />
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>Add room photo</span>
                      <small>JPEG, PNG or WebP</small>
                    </button>
                  )}
                </div>

                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/*" multiple hidden onChange={e => void upload(e.target.files)} />
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={e => void upload(e.target.files)} />

                <div className="photo-actions">
                  <button className="secondary" onClick={() => fileRef.current?.click()} disabled={busy || photos.length >= 4}>
                    <ImagePlus size={14} /> {busy ? 'Saving…' : 'Upload photos'}
                  </button>
                  <button className="quiet" onClick={handleTakePhotoClick} disabled={busy || photos.length >= 4}>
                    <Camera size={14} /> Take photo
                  </button>
                </div>
                <small className="muted" style={{ display: 'block', marginTop: '10px' }}>Photos are stored privately on this computer.</small>
              </section>

              <section className="panel ai-card">
                <div className="panel-heading">
                  <h2><ScanSearch size={16} /> Visual Hazard Inspection</h2>
                  <button className={`icon-button ${refreshingAI ? 'spin' : ''}`} aria-label="Refresh AI configuration" onClick={checkAI} disabled={refreshingAI} title="Refresh AI configuration">
                    <RefreshCw size={14} className={refreshingAI ? 'spin' : ''} />
                  </button>
                </div>
                <div className="ai-status">
                  <i className={ai?.configured ? 'ready' : ''} />
                  <span>{ai ? `${ai.provider === 'gemini' ? 'Google Gemini Flash' : ai.provider === 'deepseek' ? 'DeepSeek Cloud AI' : ai.provider === 'ollama' ? 'Ollama Local AI' : ai.provider === 'openai' ? 'OpenAI Vision' : 'Disabled'} · ${ai.model}` : 'Checking configuration…'}</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--muted)' }}>{ai?.message || 'Checking AI readiness.'}</p>

                {!ai?.configured && (
                  <div className="setup-hint">
                    <code>{ai?.provider === 'gemini' ? 'Set GEMINI_API_KEY in .env' : ai?.provider === 'deepseek' ? 'Set DEEPSEEK_API_KEY in .env' : 'ollama pull gemma3:4b'}</code>
                    <a href="/downloads/AI-SETUP.md" download style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--mint)', fontWeight: 600 }}>
                      AI setup guide <Download size={13} />
                    </a>
                  </div>
                )}

                {ai?.external && (
                  <label className="consent">
                    <input type="checkbox" checked={cloudConsent} onChange={e => setCloudConsent(e.target.checked)} />
                    Send this room’s photos to {ai.provider === 'gemini' ? 'Google Gemini' : ai.provider === 'deepseek' ? 'DeepSeek' : 'OpenAI'} for analysis.
                  </label>
                )}

                <div className="photo-actions">
                  <button className="primary" disabled={!photos.length || !ai?.configured || analyzing || (ai.external && !cloudConsent)} onClick={analyze}>
                    <ScanSearch size={14} /> {analyzing ? 'Scanning photos for hazards…' : 'Scan photos for hazards'}
                  </button>
                  <button className="secondary" onClick={() => setManualOpen(true)}>
                    <Plus size={14} /> Record manual observation
                  </button>
                </div>
                <p className="ai-boundary">
                  AI flags visible spatial concerns (e.g. heaters near curtains, overloaded sockets) to review. It cannot verify hidden wiring or replace certified inspection.
                </p>
              </section>

              {auditReport && (
                <section className="panel nasa-audit-panel">
                  <div className="panel-heading">
                    <div className="nasa-audit-title-group">
                      <span className="nasa-audit-badge-icon"><Rocket size={17} /></span>
                      <div>
                        <h2>NASA Spaceflight Fire Safety Compliance</h2>
                        <small className="muted">Audited per NASA-STD-6001, Apollo 1/13, Mir 1997 & ISS Spinoffs</small>
                      </div>
                    </div>
                    <div className="nasa-audit-status-pills">
                      <span className={'nasa-overall-status ' + (auditReport.overallStatus === 'Flight Certified' ? 'certified' : auditReport.overallStatus === 'Conditional Flight Waiver' ? 'conditional' : 'failed')}>
                        {auditReport.overallStatus}
                      </span>
                      <span className="nasa-score-pill">Score: {auditReport.overallScore}/100</span>
                    </div>
                  </div>

                  <div className="nasa-audit-callout">
                    <AlertTriangle size={18} className={auditReport.urgentViolationsCount > 0 ? 'text-danger' : 'text-watch'} />
                    <div>
                      <p className="nasa-risk-summary"><b>Spaceflight Hazard Assessment:</b> {auditReport.criticalRisksSummary}</p>
                      <p className="nasa-mitigation"><b>Recommended Countermeasure:</b> {auditReport.primaryMitigationRecommendation}</p>
                    </div>
                  </div>

                  <div className="nasa-mission-checklist">
                    <div className="mission-checklist-header">
                      <b>Mission Habitat Certification Checklist</b>
                      <span className="muted">Operational spaceflight thresholds per crewed environment</span>
                    </div>
                    <div className="mission-grid">
                      {auditReport.missionCertifications.map(m => (
                        <div key={m.missionId} className={'mission-card ' + m.status}>
                          <div className="mission-card-top">
                            <div>
                              <span className="mission-name">{m.name}</span>
                              <span className="mission-env">{m.environment}</span>
                            </div>
                            <span className={'mission-status-pill ' + m.status}>
                              {m.status === 'certified' ? '✓ CERTIFIED' : m.status === 'conditional' ? '⚠ CONDITIONAL' : '✕ NON-COMPLIANT'}
                            </span>
                          </div>
                          <p className="mission-summary">{m.summary}</p>
                          {m.reasons.length > 0 && (
                            <ul className="mission-reasons">
                              {m.reasons.map((r, i) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {assessments.length > 0 && (
                <section className="panel assessment-summary">
                  <div className="panel-heading">
                    <h2>Latest AI Hazard Summary</h2>
                    <span className="tag">REVIEW RECOMMENDED</span>
                  </div>
                  <p style={{ fontSize: '13px', marginBottom: '10px' }}>{assessments[0].result.summary}</p>
                  <ul className="method-list">
                    {assessments[0].result.limitations.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                  {assessments[0].result.follow_up_views.length > 0 && (
                    <details style={{ margin: '10px 0', fontSize: '12px' }}>
                      <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--mint)' }}>Suggested follow-up views</summary>
                      <ul className="method-list" style={{ marginTop: '6px' }}>
                        {assessments[0].result.follow_up_views.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </details>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                    <small className="muted">{assessments[0].model} · {new Date(assessments[0].createdAt).toLocaleString()}</small>
                    <button className="text-button" onClick={() => downloadJSON('ember-room-assessments.json', { room: selected, assessments, findings })}>
                      Export history <Download size={13} />
                    </button>
                  </div>
                </section>
              )}

              <section className="panel findings-panel">
                <div className="panel-heading">
                  <h2>Action Items & Hazard Fixes</h2>
                  <span className="tag">{findings.length} item{findings.length === 1 ? '' : 's'}</span>
                </div>
                {!findings.length ? (
                  <p style={{ fontSize: '13px' }}>No fire hazards or concerns recorded in this room. Keep spaces clear of combustibles.</p>
                ) : (
                  findings.map(f => (
                    <article className="finding" key={f.id}>
                      <div className="finding-top">
                        <span className={'finding-priority ' + f.priority}>
                          {f.priority === 'urgent_review' ? 'PROMPT REVIEW' : 'CHECK RECOMMENDED'}
                        </span>
                        <span className={'finding-state ' + f.status}>
                          {f.status === 'resolved' ? 'Fixed / Resolved' : f.status === 'dismissed' ? 'Dismissed' : f.status === 'confirmed' ? 'Confirmed' : 'Unreviewed'}
                        </span>
                      </div>
                      <h3>{f.title}</h3>
                      <div className="finding-location"><Eye size={13} /> {f.location}</div>
                      <p style={{ fontSize: '12px' }}><b>Evidence:</b> {f.evidence}</p>
                      <p style={{ fontSize: '12px', color: 'var(--muted)' }}><b>Uncertainty:</b> {f.uncertainty}</p>

                      <div className="corrective-action">
                        <ClipboardCheck size={16} />
                        <div>
                          <b style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>How to fix this:</b>
                          <p>{f.action}</p>
                        </div>
                      </div>

                      {f.reviewNote && <p style={{ fontSize: '12px', color: 'var(--muted)', background: 'var(--chip-bg)', padding: '6px 10px', borderRadius: '4px', margin: '4px 0' }}>Note: {f.reviewNote}</p>}

                      {(() => {
                        const benchmark: NasaFindingBenchmark = f.nasaBenchmark || evaluateFindingNasaBenchmark(f);
                        return (
                          <div className="finding-nasa-section">
                            <div className="finding-nasa-header">
                              <span className={'nasa-tag ' + benchmark.complianceLevel}>
                                <Rocket size={12} /> {benchmark.standard}
                              </span>
                              {benchmark.historicalIncident && (
                                <span className="nasa-incident-tag">{benchmark.historicalIncident.split(':')[0]}</span>
                              )}
                            </div>

                            <div className="finding-nasa-body">
                              <div className="nasa-risk-box">
                                <b className="nasa-section-label">Spaceflight Risk Physics:</b>
                                <p>{benchmark.spaceRisk}</p>
                              </div>
                              <div className="nasa-spinoff-box">
                                <b className="nasa-section-label">Earth Spinoff Mitigation:</b>
                                <p>{benchmark.earthSpinoffMitigation}</p>
                              </div>
                            </div>

                            <div className="finding-nasa-actions">
                              {onSimulatePreset && (
                                <button
                                  type="button"
                                  className="nasa-action-btn simulate"
                                  title="Load this microgravity or elevated-O2 flammability condition into the Combustion Lab"
                                  onClick={() => onSimulatePreset(benchmark.simPresetId)}
                                >
                                  <Flame size={13} />
                                  <span>Simulate in Combustion Lab</span>
                                </button>
                              )}
                              {onOpenPsi && (
                                <button
                                  type="button"
                                  className="nasa-action-btn psi"
                                  title="Explore empirical NASA ISS PSI repository data and spinoff research"
                                  onClick={() => onOpenPsi(benchmark.psiInvestigationId)}
                                >
                                  <Beaker size={13} />
                                  <span>Inspect in NASA PSI</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      <div className="finding-bottom">
                        <div className="quick-finding-actions">
                          {f.status !== 'resolved' && (
                            <button className="quick-fix-btn resolved" onClick={async () => await mutate('findings', 'PATCH', { id: f.id, status: 'resolved', note: 'Resolved by occupant.' }, 'Marked as resolved.')}>
                              ✓ Mark Fixed
                            </button>
                          )}
                          {f.status !== 'dismissed' && (
                            <button className="quick-fix-btn dismissed" onClick={async () => await mutate('findings', 'PATCH', { id: f.id, status: 'dismissed', note: 'Dismissed as safe.' }, 'Dismissed.')}>
                              Dismiss
                            </button>
                          )}
                          <button className="text-button" onClick={() => { setReview(f); setNote(f.reviewNote || ''); setReviewState(f.status === 'unreviewed' ? 'confirmed' : f.status); }}>
                            Add custom note <ArrowRight size={13} />
                          </button>
                        </div>
                        {f.photoId && (
                          photos.some(p => p.id === f.photoId) ? (
                            <button className="quiet" onClick={() => setExpandedPhoto(photos.find(p => p.id === f.photoId)!)}>View photo</button>
                          ) : (
                            <small className="muted">Photo removed</small>
                          )
                        )}
                      </div>
                    </article>
                  ))
                )}
              </section>
            </>
          )}
        </div>
      </div>

      <div className="guard-endnote">
        <FileSearch size={16} className="shrink-0" />
        <span>Ensure certified smoke alarms and fire extinguishers are installed and maintained. Ember provides supplemental visual hazard screening and plain-English recommendations.</span>
      </div>

      {newRoom && (
        <Modal title="Document a habitat, rover, or laboratory" close={() => setNewRoom(false)}>
          <p>Group crew spaces under a mission, vehicle, or facility complex.</p>
          <form onSubmit={createRoom} className="guard-form">
            <label>Mission / Facility name<input name="building" required maxLength={80} defaultValue={building === 'all' ? 'Artemis Surface Fleet' : building} placeholder="Artemis Surface Fleet, ISS, Lunar Gateway…" /></label>
            <div className="form-row">
              <label>Space Category<select name="kind"><option value="other">Spacecraft / Rover / Habitat</option><option value="commercial">Science / Payload Module</option><option value="home">Crew Quarters / Hab</option></select></label>
              <label>Deck / Level<input name="floor" maxLength={40} placeholder="Mobile Cabin, Node 2, Deck 1…" /></label>
            </div>
            <label>Space name<input name="name" required maxLength={80} placeholder="Pressurized Rover Cockpit, Destiny Science Lab…" /></label>
            <label>Adjacent compartments (optional)<input name="adjacent" maxLength={200} placeholder="Rear Suitport, Node 2 Forward, Airlock…" /></label>
            <label>Notes<textarea name="notes" maxLength={1000} placeholder="Atmospheric pressure, O₂ %, lithium equipment, heat sources…" /></label>
            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setNewRoom(false)}>Cancel</button>
              <button className="primary" disabled={busy}>Add space</button>
            </div>
          </form>
        </Modal>
      )}

      {manualOpen && (
        <Modal title="Record an observed concern" close={() => setManualOpen(false)}>
          <p>This record will be saved as human observation.</p>
          <form className="guard-form" onSubmit={addFinding}>
            <label>Category<select name="category">{Object.entries(CATEGORIES).map(([k, v]) => <option value={k} key={k}>{v.name}</option>)}</select></label>
            <label>Title<input name="title" required maxLength={120} placeholder="Describe visible concern" /></label>
            <div className="form-row">
              <label>Priority<select name="priority"><option value="review">Review</option><option value="urgent_review">Prompt review</option></select></label>
              <label>Photo evidence<select name="photoId"><option value="">No photo linked</option>{photos.map(p => <option value={p.id} key={p.id}>{p.label}</option>)}</select></label>
            </div>
            <label>Location in room<input name="location" required maxLength={200} placeholder="Near west wall, behind microwave" /></label>
            <label>What you observed<textarea name="evidence" required maxLength={700} placeholder="Describe visible facts without inferring fire cause." /></label>
            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setManualOpen(false)}>Cancel</button>
              <button className="primary" disabled={busy}>Save observation</button>
            </div>
          </form>
        </Modal>
      )}

      {review && (
        <Modal title="Review observation" close={() => setReview(null)}>
          <p><b>{review.title}</b></p>
          <div className="guard-form">
            <label>Status<select value={reviewState} onChange={e => setReviewState(e.target.value)}><option value="unreviewed">Unreviewed</option><option value="confirmed">Confirmed</option><option value="resolved">Action completed (resolved)</option><option value="dismissed">Dismissed</option></select></label>
            <label>Review note<textarea value={note} maxLength={1000} onChange={e => setNote(e.target.value)} placeholder="Action taken or checked..." /></label>
            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setReview(null)}>Cancel</button>
              <button className="primary" disabled={busy || note.trim().length < 3} onClick={async () => { const r = await mutate('findings', 'PATCH', { id: review.id, status: reviewState, note }, 'Review saved.'); if (r) setReview(null); }}>
                Save review
              </button>
            </div>
          </div>
        </Modal>
      )}

      {expandedPhoto && (
        <Modal title={expandedPhoto.label} close={() => setExpandedPhoto(null)}>
          <img className="large-room-photo" src={expandedPhoto.dataUrl} alt={expandedPhoto.label} />
          <p className="muted" style={{ fontSize: '12px' }}>Image evidence only. No hidden conditions are inferred.</p>
        </Modal>
      )}

      {cameraOpen && selected && (
        <CameraCaptureModal
          roomId={selected.id}
          roomName={selected.name}
          onSave={async (dataUrl, label) => {
            await api('photos', 'POST', { roomId: selected.id, label, dataUrl });
            await loadPhotos(selected.id);
            await reload();
            notify('Photo captured and saved locally.');
          }}
          onClose={() => setCameraOpen(false)}
          notify={notify}
        />
      )}
    </div>
  );
}
