'use client';
import { useEffect, useRef, useState } from 'react';
import { Activity, ArrowRight, Cable, Check, CircleHelp, Copy, Download, Radio, Thermometer, Upload, Wifi, X } from 'lucide-react';
import { sensorSchema, type SensorSample } from '@/lib/validation';
import { Plot } from './chart';
type Source='usb'|'websocket'|'demo'|'import';
type Reading={sample:SensorSample;source:Source;receivedAt:number};
type SerialPortLike={open:(o:{baudRate:number})=>Promise<void>;close:()=>Promise<void>;readable:ReadableStream<Uint8Array>|null};
export default function IoTPanel({onApply,notify}:{onApply:(s:SensorSample)=>void;notify:(s:string)=>void}){
  const [mode,setMode]=useState<Source|null>(null),[connected,setConnected]=useState(false),[connecting,setConnecting]=useState(false),[readings,setReadings]=useState<Reading[]>([]),[now,setNow]=useState(Date.now()),[url,setUrl]=useState(''),[record,setRecord]=useState(false),[saved,setSaved]=useState(0),[invalid,setInvalid]=useState(0),[paste,setPaste]=useState(''),[showImport,setShowImport]=useState(false),[history,setHistory]=useState<Reading[]>([]),[saveError,setSaveError]=useState('');
  const recordRef=useRef(false);recordRef.current=record;
  const cleanup=useRef<(()=>Promise<void>|void)|null>(null),lastMonitor=useRef(0),monitorPending=useRef(false),lastSave=useRef(0),pending=useRef(false),lastDisplay=useRef(0),generation=useRef(0);
  const current=readings.at(-1);const stale=!current||now-current.receivedAt>5000;const live=connected&&!stale&&mode!=='demo';
  async function disconnect(){generation.current++;await cleanup.current?.();cleanup.current=null;setConnected(false);setConnecting(false);}
  const acceptRef=useRef<(s:unknown,source:Source)=>void>(()=>{});
  acceptRef.current=(raw,source)=>{
    const parsed=sensorSchema.safeParse(raw);if(!parsed.success){setInvalid(n=>n+1);return;}
    const at=Date.now();if(at-lastDisplay.current<100)return;lastDisplay.current=at;
    if((source==='usb'||source==='websocket')&&!monitorPending.current&&at-lastMonitor.current>1000){lastMonitor.current=at;monitorPending.current=true;fetch('/api/safety/samples',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source,sample:parsed.data})}).then(r=>{if(!r.ok)throw new Error('Guard could not evaluate the sensor stream. Check the server.');}).catch(e=>setSaveError(e.message)).finally(()=>monitorPending.current=false);}
    const r={sample:parsed.data,source,receivedAt:at};setReadings(old=>[...old,r].slice(-120));
    if(recordRef.current&&!pending.current&&at-lastSave.current>2000){
      pending.current=true;lastSave.current=at;
      fetch('/api/telemetry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source,sample:parsed.data})}).then(async res=>{if(!res.ok)throw new Error((await res.json()).error||'Could not save sample.');setSaved(n=>n+1);setSaveError('');}).catch(e=>{setSaveError(e.message);setRecord(false);}).finally(()=>pending.current=false);
    }
  };
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>{clearInterval(timer);generation.current++;void cleanup.current?.();};},[]);
  function startDemo(){void disconnect().then(()=>{setMode('demo');setReadings([]);setConnected(true);let t=0;const emit=()=>{t++;acceptRef.current({device_id:'demo-esp32',ambient_c:25+Math.sin(t*.13)*.6,oxygen_pct:20.9+Math.sin(t*.19)*.08,acceleration_ms2:9.81+Math.sin(t*.25)*.03},'demo');};emit();const id=setInterval(emit,1000);cleanup.current=()=>clearInterval(id);});}
  async function serial(){
    const nav=navigator as Navigator&{serial?:{requestPort:()=>Promise<SerialPortLike>}};
    if(!nav.serial){notify('USB serial needs a supported desktop browser, such as Chrome or Edge. Use the demo, JSON import, or WebSocket feed here.');return;}
    // Request the port immediately within this user gesture.
    let port:SerialPortLike;try{port=await nav.serial.requestPort();}catch(e){notify((e as Error).message||'No port selected.');return;}
    await disconnect();setMode('usb');setConnecting(true);setReadings([]);const gen=generation.current;
    try{
      await port.open({baudRate:115200});setConnecting(false);setConnected(true);
      const reader=port.readable?.getReader();if(!reader)throw new Error('This port has no readable stream.');
      let stopped=false;
      cleanup.current=async()=>{stopped=true;try{await reader.cancel();}catch{}try{reader.releaseLock();await port.close();}catch{}};
      const decoder=new TextDecoder();let buffer='';
      while(!stopped&&gen===generation.current){const {value,done}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});if(buffer.length>16000){buffer='';setInvalid(n=>n+1);continue;}let end;while((end=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,end).trim();buffer=buffer.slice(end+1);if(!line)continue;try{acceptRef.current(JSON.parse(line),'usb');}catch{setInvalid(n=>n+1);}}}
    }catch(e){notify('USB: '+(e as Error).message);}finally{if(gen===generation.current){setConnected(false);setConnecting(false);await cleanup.current?.();cleanup.current=null;}}
  }
  async function websocket(){
    let endpoint:URL;try{endpoint=new URL(url);if(endpoint.username||endpoint.password)throw new Error();if(endpoint.protocol!=='wss:'&&!(endpoint.protocol==='ws:'&&['localhost','127.0.0.1'].includes(endpoint.hostname)))throw new Error();}catch{notify('Enter a wss:// address, or ws://localhost for a local gateway.');return;}
    await disconnect();setMode('websocket');setConnecting(true);setReadings([]);const gen=generation.current;const socket=new WebSocket(endpoint.href);
    const timeout=setTimeout(()=>{if(socket.readyState!==WebSocket.OPEN){socket.close();notify('Connection timed out. Check the gateway address.');}},10000);
    socket.onopen=()=>{clearTimeout(timeout);if(gen===generation.current){setConnected(true);setConnecting(false);}};
    socket.onmessage=event=>{if(typeof event.data==='string'&&event.data.length<=5000){try{acceptRef.current(JSON.parse(event.data),'websocket');}catch{setInvalid(n=>n+1);}}else setInvalid(n=>n+1);};
    socket.onerror=()=>{if(gen===generation.current)notify('WebSocket connection failed. Check the address, certificate and gateway.');};
    socket.onclose=()=>{clearTimeout(timeout);if(gen===generation.current){setConnected(false);setConnecting(false);}};
    cleanup.current=()=>{clearTimeout(timeout);socket.onmessage=null;socket.close();};
  }
  function importSample(){try{const p=sensorSchema.parse(JSON.parse(paste));void disconnect().then(()=>{setMode('import');setReadings([]);lastDisplay.current=0;acceptRef.current(p,'import');setShowImport(false);notify('Sample imported. This is a snapshot, not a live connection.');});}catch{notify('Invalid sample. Use the JSON schema below with at least one numeric measurement.');}}
  async function loadHistory(){try{const r=await fetch('/api/telemetry');if(!r.ok)throw new Error('Cannot read sensor archive.');setHistory(await r.json());notify('Showing the latest 100 recorded samples.');}catch(e){notify((e as Error).message);}}
  const schemaExample='{"device_id":"esp32-01","ambient_c":25.1,"oxygen_pct":20.9,"acceleration_ms2":9.81}';
  return <div className="iot-page">
    <div className="section-intro"><div><div className="eyebrow">THE PHYSICAL CONNECTION</div><h1>From sensor to insight.</h1><p>Bring real measurements into your virtual laboratory.</p></div><span className={`status-pill ${live?'green':mode==='demo'&&connected?'amber':''}`}><i/>{mode==='demo'&&connected?'SIMULATED FEED':live?'RECEIVING DATA':connecting?'CONNECTING':connected?'WAITING FOR DATA':'NO DEVICE CONNECTED'}</span></div>
    <div className="iot-notice"><Radio size={18}/><span>Paired real-device streams feed Ember Guard automatically. The connection stays active across app tabs; sensor inputs change a flame experiment only when you apply them.</span></div>
    <div className="iot-grid"><section className="panel connection-panel"><div className="panel-heading"><h2>Connect a device</h2><Cable size={18}/></div><p>Choose a source for newline-delimited JSON telemetry.</p>
      <button className="connect-choice" onClick={serial} disabled={connecting}><Cable/><span><b>USB serial</b><small>ESP32 / Arduino · 115200 baud</small></span><ArrowRight size={18}/></button>
      <label className="field-label" htmlFor="ws-url">WebSocket gateway</label><div className="input-action"><input id="ws-url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="wss://your-gateway/telemetry"/><button onClick={websocket} disabled={connecting||!url} aria-label="Connect WebSocket"><ArrowRight size={17}/></button></div><small className="muted">For a networked sensor. WSS required except on localhost.</small>
      <div className="connection-actions"><button className="secondary" onClick={startDemo}><Activity size={15}/>Try demo feed</button><button className="quiet" onClick={()=>setShowImport(!showImport)}><Upload size={15}/>Import JSON</button></div>
      {showImport&&<div className="import-box"><label htmlFor="sensor-json">Sensor sample JSON</label><textarea id="sensor-json" value={paste} onChange={e=>setPaste(e.target.value)} placeholder={schemaExample}/><button className="primary" onClick={importSample}>Load sample</button></div>}
      {(connected||connecting)&&<button className="disconnect" onClick={()=>void disconnect()}><X size={14}/>Disconnect {mode==='demo'?'demo':'device'}</button>}
      <div className="record-row"><div><b>Record telemetry</b><small>Save every 2s while the app is open</small></div><button role="switch" aria-checked={record} aria-label="Record telemetry" className={'switch '+(record?'on':'')} onClick={()=>setRecord(!record)}><span/></button></div>
      <small className="muted">{saved} samples saved this session · {invalid} rejected packets</small>{saveError&&<p className="error-text">{saveError}</p>}
    </section><section className="panel readings-panel"><div className="panel-heading"><h2>Sensor readings</h2><span className="mono muted">{current?.sample.device_id||'AWAITING TELEMETRY'}</span></div>
      <div className="sensor-grid">{[{label:'Ambient temperature',value:current?.sample.ambient_c,unit:'°C',precision:1},{label:'Oxygen concentration',value:current?.sample.oxygen_pct,unit:'%',precision:1},{label:'Specific acceleration',value:current?.sample.acceleration_ms2,unit:'m/s²',precision:2},{label:'Temperature probe',value:current?.sample.probe_c,unit:'°C',precision:1},{label:'Particle concentration (PM₂.₅)',value:current?.sample.pm25_ugm3,unit:'µg/m³',precision:1},{label:'Carbon monoxide',value:current?.sample.co_ppm,unit:'ppm',precision:1}].map(s=><div className="sensor-card" key={s.label}><span>{s.label}</span><strong>{typeof s.value==='number'?s.value.toFixed(s.precision):'—'}<small>{s.unit}</small></strong><em>{typeof s.value!=='number'?'Sensor not supplied':mode==='demo'?'Simulated reading':mode==='import'?'Imported snapshot':stale?'Stale reading':'Measured'}</em></div>)}</div>
      <div className="reading-meta"><span>{current?`Received ${Math.max(0,Math.floor((now-current.receivedAt)/1000))}s ago`:'Connect a device to start'}</span><button className="text-button" disabled={!current||stale||!connected} onClick={()=>current&&onApply(current.sample)}>Use ambient + O₂ inputs <ArrowRight size={14}/></button></div>
      <Plot height={150} unit="°C" empty="Temperature history will appear when samples arrive." series={[{name:'Ambient temperature',color:'#8ee0c5',values:readings.filter(r=>typeof r.sample.ambient_c==='number').map(r=>({x:(r.receivedAt-(readings[0]?.receivedAt||0))/1000,y:r.sample.ambient_c!}))}]}/>
    </section></div>
    <div className="iot-grid lower"><section className="panel"><div className="panel-heading"><h2>Your hardware starting point</h2><CircleHelp size={17}/></div><div className="hardware-flow"><span>ESP32<br/><small>Sensors</small></span><ArrowRight/><span>USB / WSS<br/><small>JSON stream</small></span><ArrowRight/><span>Ember<br/><small>Read · Record · Compare</small></span></div><p>The included firmware reads a BME280 ambient sensor and MPU6050 accelerometer. Oxygen and flame-probe channels remain empty until suitable calibrated sensors are added. The expanded smoke-node starter adds particulate sensing; see Buildings & alerts for pairing and setup.</p><p className="muted">An accelerometer measures specific force. Its reading is not automatically a gravity estimate. The BME280 measures ambient conditions; keep it away from flame heat.</p><a className="secondary inline" href="/downloads/ember_esp32.ino" download><Download size={15}/>ESP32 starter</a><a className="quiet inline" href="/downloads/IOT-SETUP.md" download>Setup guide <ArrowRight size={14}/></a></section>
    <section className="panel"><div className="panel-heading"><h2>Telemetry contract</h2><button className="icon-button" aria-label="Copy example JSON" onClick={()=>navigator.clipboard.writeText(schemaExample).then(()=>notify('Example JSON copied.')).catch(()=>notify('Copy unavailable; select the example text.'))}><Copy size={16}/></button></div><p>One JSON object per line for USB; one object per WebSocket message. Measurements must be numbers. Missing channels may be omitted or set to null.</p><pre>{JSON.stringify(JSON.parse(schemaExample),null,2)}</pre><div className="info-line"><Check size={14}/>Invalid fields and out-of-range values are rejected.</div></section></div>
    <section className="panel archive"><div className="panel-heading"><div><h2>Recorded samples</h2><small className="muted">Latest 100 · retained for up to 7 days on this computer</small></div><button className="secondary" onClick={loadHistory}>Load archive</button></div>{history.length?<div className="table-wrap"><table><thead><tr><th>Received</th><th>Device</th><th>Source</th><th>Ambient</th><th>O₂</th><th>Acceleration</th></tr></thead><tbody>{history.map((r,i)=><tr key={i}><td>{new Date(r.receivedAt).toLocaleTimeString()}</td><td>{r.sample.device_id}</td><td>{r.source==='demo'?'DEMO':r.source}</td><td>{r.sample.ambient_c?.toFixed(1)??'—'} °C</td><td>{r.sample.oxygen_pct?.toFixed(1)??'—'} %</td><td>{r.sample.acceleration_ms2?.toFixed(2)??'—'} m/s²</td></tr>)}</tbody></table></div>:<p className="muted">Enable recording to store telemetry, then load the archive. Demo samples always retain their demo label.</p>}</section>
  </div>;
}
