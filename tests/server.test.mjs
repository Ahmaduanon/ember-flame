import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, copyFile, cp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DEFAULTS, initialState, sample } from '../lib/model.ts';
const port=33671,origin=`http://127.0.0.1:${port}`;
let dir,child;
async function start(){
  child=spawn(process.execPath,['runtime/server.js'],{cwd:dir,env:{...process.env,EMBER_PORT:String(port),EMBER_AI_PROVIDER:'disabled'},stdio:['ignore','pipe','pipe']});
  await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Server startup timeout')),8000);child.stdout.on('data',d=>{if(d.toString().includes('Open http://')){clearTimeout(timeout);resolve();}});child.once('exit',c=>{clearTimeout(timeout);reject(new Error(`Server exited ${c}`));});});
}
async function stop(){if(!child||child.exitCode!==null)return;await new Promise(resolve=>{child.once('exit',resolve);child.kill('SIGTERM');});}
async function request(url,method='GET',data,headers={}){return fetch(origin+url,{method,headers:{'Content-Type':'application/json',...headers},body:data===undefined?undefined:JSON.stringify(data)});}
before(async()=>{dir=await mkdtemp(path.join(tmpdir(),'ember-test-'));await cp('runtime',path.join(dir,'runtime'),{recursive:true});await cp('dist',path.join(dir,'dist'),{recursive:true});await writeFile(path.join(dir,'package.json'),'{"type":"module"}');await start();});
after(async()=>{await stop();await rm(dir,{recursive:true,force:true});});
test('prebuilt app runs without node_modules and serves static assets',async()=>{assert.equal((await request('/api/health')).status,200);const r=await request('/');assert.equal(r.status,200);const html=await r.text();assert.match(html,/Ember/);const asset=html.match(/src="([^"]+\.js)"/)[1];assert.equal((await request(asset)).status,200);assert.equal((await request('/downloads/ember_esp32.ino')).status,200);assert.equal((await request('/downloads/IOT-SETUP.md')).status,200);});
test('experiment persists across restart and can be deleted',async()=>{
  const data={title:'Persistence check',payload:{model:'EMBER-ROM 0.1',settings:DEFAULTS,initialSettings:DEFAULTS,intervention:'none',points:[sample(initialState())],events:[{time:0,text:'Started'}],status:'stable'}};
  const create=await request('/api/runs','POST',data);assert.equal(create.status,201);const {id}=await create.json();
  await stop();await start();let runs=await(await request('/api/runs')).json();assert.equal(runs.find(r=>r.id===id).title,data.title);
  assert.equal((await request('/api/runs?id='+id,'DELETE')).status,200);runs=await(await request('/api/runs')).json();assert.equal(runs.length,0);
});
test('server rejects bad telemetry and preserves the demo provenance',async()=>{
  assert.equal((await request('/api/telemetry','POST',{source:'usb',sample:{device_id:'x',oxygen_pct:120}})).status,400);
  const saved=await request('/api/telemetry','POST',{source:'demo',sample:{device_id:'demo-01',ambient_c:25}});assert.equal(saved.status,201);
  const records=await(await request('/api/telemetry')).json();assert.equal(records[0].source,'demo');assert.equal(records[0].sample.ambient_c,25);
});
test('cross-origin writes and invalid experiment payloads are rejected',async()=>{
  assert.equal((await request('/api/runs','POST',{}, {Origin:'https://untrusted.example'})).status,403);
  assert.equal((await request('/api/runs','POST',{})).status,400);
  assert.equal((await request('/api/runs','DELETE')).status,400);
});

const roomData=name=>({building:'Test building',kind:'home',name,floor:'Ground',notes:'',adjacent:''});
const findingData=roomId=>({roomId,photoId:null,category:'blocked_exit',priority:'review',title:'Doorway observation',evidence:'Boxes appear in an exit route.',location:'Doorway',uncertainty:'Requires in-person review.'});
const pixel='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6RZ0AAAAASUVORK5CYII=';
async function createRoom(name){const response=await request('/api/safety/rooms','POST',roomData(name));assert.equal(response.status,201);return response.json();}
async function state(){return (await request('/api/safety/state')).json();}

test('room photos validate types, retain findings after deletion and fail clearly with AI disabled',async()=>{
  const room=await createRoom('Photo room');
  assert.equal((await request('/api/safety/photos','POST',{roomId:room.id,label:'Bad image',dataUrl:'data:image/png;base64,QUFBQUFBQUFBQUFBQUFBQUFB'})).status,400);
  const p=await request('/api/safety/photos','POST',{roomId:room.id,label:'Tiny test fixture',dataUrl:pixel});assert.equal(p.status,201);const photo=await p.json();
  const manual=await request('/api/safety/findings','POST',{...findingData(room.id),photoId:photo.id});assert.equal(manual.status,201);const {id}=await manual.json();
  const other=await createRoom('Other photo room');assert.equal((await request('/api/safety/findings','POST',{...findingData(other.id),photoId:photo.id})).status,400);
  const ai=await request('/api/safety/analyze','POST',{roomId:room.id});assert.equal(ai.status,503);assert.match((await ai.json()).error,/disabled/);assert.equal((await state()).assessments.length,0);
  assert.equal((await request('/api/safety/findings','PATCH',{id,status:'confirmed',note:'Checked manually.'})).status,200);
  assert.equal((await request('/api/safety/photos?id='+photo.id,'DELETE')).status,200);
  assert.equal((await state()).findings.find(f=>f.id===id).photoId,photo.id);
  assert.equal((await(await request('/api/safety/photos?roomId='+room.id)).json()).length,0);
});

test('paired devices isolate demos, authenticate gateways and preserve incident evidence across restart',async()=>{
  const room=await createRoom('Sensor room'),other=await createRoom('Unrelated room');
  const saved=await(await request('/api/safety/findings','POST',findingData(room.id))).json();
  await request('/api/safety/findings','POST',findingData(other.id));
  const pair=await request('/api/safety/devices','POST',{id:'test-node',name:'Test sensor',roomId:room.id});assert.equal(pair.status,201);const {token}=await pair.json();assert.equal(token.length,64);
  assert.equal((await request('/api/safety/devices','POST',{id:'test-node',name:'Duplicate',roomId:other.id})).status,409);
  let s=await state();assert.equal(s.devices.find(d=>d.id==='test-node').state,'offline');assert.ok(!JSON.stringify(s).includes(token));assert.ok(!JSON.stringify(s).includes('tokenHash'));
  const demo=await request('/api/safety/demo','POST',{roomId:room.id,scenario:'alarm'});assert.equal(demo.status,201);
  const isolated=await request('/api/safety/samples','POST',{source:'demo',sample:{device_id:'test-node',smoke_alarm:true}});assert.equal((await isolated.json()).accepted,false);
  const imported=await request('/api/safety/samples','POST',{source:'import',sample:{device_id:'test-node',smoke_alarm:true}});assert.equal((await imported.json()).accepted,false);
  s=await state();assert.equal(s.devices.find(d=>d.id==='test-node').lastSeen,null);assert.ok(s.incidents.some(i=>i.source==='demo'));assert.ok(!s.incidents.some(i=>i.source==='live'));
  const sample={device_id:'test-node',smoke_alarm:true,sensor_fault:true};
  assert.equal((await request('/api/safety/device-telemetry','POST',sample)).status,401);
  assert.equal((await request('/api/safety/device-telemetry','POST',sample,{Authorization:'Bearer wrong'})).status,401);
  const real=await request('/api/safety/device-telemetry','POST',sample,{Authorization:'Bearer '+token});assert.equal(real.status,200);const result=await real.json();assert.equal(result.state,'alarm');
  s=await state();let incident=s.incidents.find(i=>i.id===result.incidentId);assert.equal(incident.source,'live');assert.equal(incident.related.length,1);assert.equal(incident.related[0].id,saved.id);assert.match(incident.cause,/Not established/);
  assert.equal((await request('/api/safety/incidents','PATCH',{id:incident.id,status:'acknowledged',note:'Test acknowledgement.'})).status,200);
  assert.equal((await request('/api/safety/incidents','PATCH',{id:incident.id,status:'closed',note:'Attempt to close without clearing.'})).status,409);
  const ph=await request('/api/safety/photos','POST',{roomId:room.id,label:'Test fixture',dataUrl:pixel});assert.equal(ph.status,201);
  assert.equal((await request('/api/safety/analyze','POST',{roomId:room.id})).status,409);
  await stop();await start();s=await state();incident=s.incidents.find(i=>i.id===result.incidentId);assert.equal(incident.status,'acknowledged');assert.equal(s.devices.find(d=>d.id==='test-node').state,'alarm');assert.ok(s.rooms.some(r=>r.id===room.id));assert.equal(incident.related[0].id,saved.id);
});

test('a browser USB sample can trigger a paired device and setup downloads are packaged',async()=>{
  const room=await createRoom('USB room');await request('/api/safety/devices','POST',{id:'usb-node',name:'USB sensor',roomId:room.id});
  const r=await request('/api/safety/samples','POST',{source:'usb',sample:{device_id:'usb-node',co_alarm:true}});assert.equal((await r.json()).state,'alarm');
  for(const path of ['AI-SETUP.md','SMOKE-NODE.md','ember_smoke_node.ino','monitor_gateway.py'])assert.equal((await request('/downloads/'+path)).status,200);
});

test('manual layouts persist and the usage policy API validates hard request limits',async()=>{
  const room=await createRoom('Planner room');const layout={width:6,depth:4,items:[{id:'marker-1',type:'exit',x:5,y:3}]};
  assert.equal((await request('/api/safety/layouts','PUT',{roomId:room.id,layout})).status,200);
  assert.deepEqual((await(await request('/api/safety/layouts?roomId='+room.id)).json()).layout,layout);
  assert.equal((await request('/api/safety/layouts','PUT',{roomId:room.id,layout:{...layout,items:[{id:'bad',type:'exit',x:7,y:3}]}})).status,400);
  const initial=await(await request('/api/safety/ai-usage')).json();assert.equal(initial.policy.cloudEnabled,false);
  assert.equal((await request('/api/safety/ai-usage','PUT',{...initial.policy,dailyLimit:-1})).status,400);
  const policy={...initial.policy,dailyLimit:0,monthlyLimit:0};assert.equal((await request('/api/safety/ai-usage','PUT',policy)).status,200);
  await stop();await start();assert.deepEqual((await(await request('/api/safety/ai-usage')).json()).policy,policy);assert.deepEqual((await(await request('/api/safety/layouts?roomId='+room.id)).json()).layout,layout);
});
