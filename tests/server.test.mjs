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
let cookie='';
async function request(url,method='GET',data,headers={}){const r=await fetch(origin+url,{method,headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...headers},body:data===undefined?undefined:JSON.stringify(data)});const sc=(r.headers.getSetCookie?.()||[])[0];if(sc&&sc.startsWith('ember_session=')&&!sc.includes('Max-Age=0'))cookie=sc.split(';')[0];return r;}
async function signIn(){const r=await request('/api/auth/signup','POST',{name:'Test User',email:'test@example.com',password:'correct horse battery'});assert.equal(r.status,201);}
before(async()=>{dir=await mkdtemp(path.join(tmpdir(),'ember-test-'));await cp('runtime',path.join(dir,'runtime'),{recursive:true});await cp('dist',path.join(dir,'dist'),{recursive:true});await writeFile(path.join(dir,'package.json'),'{"type":"module"}');await start();await signIn();});
after(async()=>{await stop();await rm(dir,{recursive:true,force:true});});
test('prebuilt app runs without node_modules and serves static assets',async()=>{assert.equal((await request('/api/health')).status,200);const r=await request('/');assert.equal(r.status,200);const html=await r.text();assert.match(html,/Ember/);const asset=html.match(/src="([^"]+\.js)"/)[1];assert.equal((await request(asset)).status,200);assert.equal((await request('/downloads/AI-SETUP.md')).status,200);assert.equal((await request('/downloads/SAFETY-MODEL.md')).status,200);});
test('experiment persists across restart and can be deleted',async()=>{
  const data={title:'Persistence check',payload:{model:'EMBER-ROM 0.1',settings:DEFAULTS,initialSettings:DEFAULTS,intervention:'none',points:[sample(initialState())],events:[{time:0,text:'Started'}],status:'stable'}};
  const create=await request('/api/runs','POST',data);assert.equal(create.status,201);const {id}=await create.json();
  await stop();await start();let runs=await(await request('/api/runs')).json();assert.equal(runs.find(r=>r.id===id).title,data.title);
  assert.equal((await request('/api/runs?id='+id,'DELETE')).status,200);runs=await(await request('/api/runs')).json();assert.equal(runs.length,0);
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

test('rooms and safety findings persist across server restart and maintain integrity',async()=>{
  const room=await createRoom('Persistent safety room');
  const f1=await request('/api/safety/findings','POST',{...findingData(room.id),priority:'urgent_review'});assert.equal(f1.status,201);const f1Body=await f1.json();
  const f2=await request('/api/safety/findings','POST',{...findingData(room.id),priority:'review'});assert.equal(f2.status,201);const f2Body=await f2.json();
  let s=await state();
  assert.ok(s.rooms.some(r=>r.id===room.id));
  assert.ok(s.findings.some(f=>f.id===f1Body.id&&f.priority==='urgent_review'));
  assert.ok(s.findings.some(f=>f.id===f2Body.id&&f.priority==='review'));
  await stop();await start();
  s=await state();
  assert.ok(s.rooms.some(r=>r.id===room.id));
  assert.ok(s.findings.some(f=>f.id===f1Body.id&&f.priority==='urgent_review'));
  assert.ok(s.findings.some(f=>f.id===f2Body.id&&f.priority==='review'));
  assert.equal(s.devices,undefined);
  assert.equal(s.incidents,undefined);
});

test('findings workflow supports reviewing, resolving and dismissing hazards',async()=>{
  const room=await createRoom('Workflow room');
  const res=await request('/api/safety/findings','POST',findingData(room.id));assert.equal(res.status,201);const {id}=await res.json();
  assert.equal((await request('/api/safety/findings','PATCH',{id,status:'confirmed',note:'Verified hazard'})).status,200);
  let s=await state();assert.equal(s.findings.find(f=>f.id===id).status,'confirmed');
  assert.equal((await request('/api/safety/findings','PATCH',{id,status:'resolved',note:'Fixed issue'})).status,200);
  s=await state();assert.equal(s.findings.find(f=>f.id===id).status,'resolved');
  assert.equal((await request('/api/safety/findings','PATCH',{id,status:'dismissed',note:'False positive'})).status,200);
  s=await state();assert.equal(s.findings.find(f=>f.id===id).status,'dismissed');
});

test('accounts: API requires sign-in and rejects bad credentials',async()=>{
  const raw=(u,m='GET',d)=>fetch(origin+u,{method:m,headers:{'Content-Type':'application/json'},body:d?JSON.stringify(d):undefined});
  assert.equal((await raw('/api/runs')).status,401);
  assert.equal((await raw('/api/auth/login','POST',{email:'test@example.com',password:'wrong-password'})).status,401);
  assert.equal((await request('/api/auth/me')).status,200);
  assert.equal((await request('/api/auth/signup','POST',{name:'x',email:'new@example.com',password:'short'})).status,400);
});
test('waitlist accepts public sign-ups, de-duplicates and keeps the list private',async()=>{
  const body={name:'\u0198a\u0199a Musa',email:'Wait@Example.com',role:'home'};
  const post=()=>fetch(origin+'/api/waitlist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  assert.equal((await post()).status,201);assert.equal((await(await post()).json()).already,true);
  assert.equal((await fetch(origin+'/api/waitlist')).status,403);
  const rows=await(await request('/api/waitlist')).json();assert.equal(rows[0].email,'wait@example.com');assert.equal(rows[0].name,body.name);
});
