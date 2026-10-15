import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { sensorSchema } from '../../lib/validation.ts';
import { roomSchema, photoSchema, findingSchema, reviewSchema, deviceSchema, CATEGORIES } from '../../lib/safety.ts';
import { evaluateDetection, canCloseIncident, RULE_VERSION } from '../../lib/detection.ts';
import { analyzePhotos, aiStatus } from './vision.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex');
const levels={watch:1,warning:2,alarm:3};
const titles={watch:'Sensor change needs review',warning:'Corroborating sensor changes',alarm:'Device alarm signal'};
const parse=(schema,input)=>{const r=schema.safeParse(input);if(!r.success)throw Object.assign(new Error('Invalid input. Check required fields, formats and ranges.'),{status:400});return r.data;};
export function validImage(url){
  const match=/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+=*)$/.exec(url);if(!match)return false;
  const b=Buffer.from(match[2],'base64');if(b.length>2200000||b.length<12)return false;
  return match[1]==='jpeg'?b[0]===255&&b[1]===216&&b[2]===255:match[1]==='png'?b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP';
}
export function installSafety(db){
  db.exec(`
    CREATE TABLE IF NOT EXISTS safety_rooms(id TEXT PRIMARY KEY,createdAt INTEGER NOT NULL,payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS survey_photos(id TEXT PRIMARY KEY,roomId TEXT NOT NULL,createdAt INTEGER NOT NULL,label TEXT NOT NULL,dataUrl TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS assessments(id TEXT PRIMARY KEY,roomId TEXT NOT NULL,createdAt INTEGER NOT NULL,provider TEXT NOT NULL,model TEXT NOT NULL,result TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS findings(id TEXT PRIMARY KEY,roomId TEXT NOT NULL,createdAt INTEGER NOT NULL,payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS safety_devices(id TEXT PRIMARY KEY,name TEXT NOT NULL,roomId TEXT NOT NULL,createdAt INTEGER NOT NULL,tokenHash TEXT NOT NULL,lastSeen INTEGER,lastSample TEXT);
    CREATE TABLE IF NOT EXISTS safety_samples(id INTEGER PRIMARY KEY AUTOINCREMENT,deviceId TEXT NOT NULL,at INTEGER NOT NULL,source TEXT NOT NULL,sample TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS safety_samples_device_time ON safety_samples(deviceId,at);
    CREATE TABLE IF NOT EXISTS incidents(id TEXT PRIMARY KEY,deviceId TEXT NOT NULL,roomId TEXT NOT NULL,source TEXT NOT NULL,level TEXT NOT NULL,openedAt INTEGER NOT NULL,lastAt INTEGER NOT NULL,status TEXT NOT NULL,payload TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS incidents_device_status ON incidents(deviceId,status);
  `);
  let analyzing=false;
  const room=id=>{const r=db.prepare('SELECT * FROM safety_rooms WHERE id=?').get(id);return r?{id:r.id,createdAt:r.createdAt,...JSON.parse(r.payload)}:null;};
  const requireRoom=id=>{const r=room(id);if(!r)throw Object.assign(new Error('Room not found.'),{status:404});return r;};
  const findings=()=>db.prepare('SELECT * FROM findings ORDER BY createdAt DESC').all().map(r=>({...JSON.parse(r.payload),id:r.id,roomId:r.roomId,createdAt:r.createdAt}));
  const incidents=()=>db.prepare("SELECT * FROM incidents WHERE status!='closed' OR id IN (SELECT id FROM incidents WHERE status='closed' ORDER BY openedAt DESC LIMIT 200) ORDER BY openedAt DESC").all().map(({payload,...r})=>({...r,...JSON.parse(payload)}));
  const history=(id,now)=>db.prepare('SELECT at,sample FROM safety_samples WHERE deviceId=? AND at>=? ORDER BY at DESC LIMIT 180').all(id,now-120000).reverse().map(r=>({at:r.at,sample:JSON.parse(r.sample)}));
  function addIncident(device,evaluation,evidence,now,source='live'){
    if(!levels[evaluation.state])return null;
    const row=db.prepare("SELECT * FROM incidents WHERE deviceId=? AND source=? AND status!='closed' ORDER BY openedAt DESC LIMIT 1").get(device.id,source);
    if(row){
      const p=JSON.parse(row.payload);const escalated=levels[evaluation.state]>levels[row.level];
      if(escalated){p.events.push({at:now,text:'Escalated to '+evaluation.state});p.details=evaluation.details;p.evidence=evidence;p.title=titles[evaluation.state];}
      db.prepare('UPDATE incidents SET lastAt=?,level=?,status=?,payload=? WHERE id=?').run(now,escalated?evaluation.state:row.level,escalated?'open':row.status,JSON.stringify(p),row.id);
      return row.id;
    }
    const id=crypto.randomUUID();
    const related=findings().filter(f=>f.roomId===device.roomId&&f.createdAt<=now&&f.status!=='dismissed').slice(0,30);
    const payload={title:titles[evaluation.state],note:'',details:evaluation.details,evidence,related,events:[{at:now,text:source==='demo'?'Demonstration incident created':'Sensor event recorded'}],ruleVersion:RULE_VERSION,cause:'Not established. Earlier observations are context, not proof of origin or cause.'};
    db.prepare('INSERT INTO incidents VALUES(?,?,?,?,?,?,?,?,?)').run(id,device.id,device.roomId,source,evaluation.state,now,now,'open',JSON.stringify(payload));return id;
  }
  function ingest(sample,source,now=Date.now()){
    if(source==='demo'||source==='import')return{accepted:false,reason:'Demo/import data never updates real-device monitoring.'};
    const device=db.prepare('SELECT * FROM safety_devices WHERE id=?').get(sample.device_id);
    if(!device)return{accepted:false,reason:'Pair this device to a room to enable prototype monitoring.'};
    // One accepted sample per 500 ms per device. Direct alarm transitions bypass this limit.
    const old=device.lastSample?JSON.parse(device.lastSample):{};
    const newAlarm=(sample.smoke_alarm===true&&old.smoke_alarm!==true)||(sample.co_alarm===true&&old.co_alarm!==true);
    if(device.lastSeen&&now-device.lastSeen<500&&!newAlarm)return{accepted:false,reason:'Sampling rate limited.'};
    db.prepare('INSERT INTO safety_samples(deviceId,at,source,sample) VALUES(?,?,?,?)').run(device.id,now,source,JSON.stringify(sample));
    db.prepare('UPDATE safety_devices SET lastSeen=?,lastSample=? WHERE id=?').run(now,JSON.stringify(sample),device.id);
    const samples=history(device.id,now);const evaluation=evaluateDetection(samples,now);
    const incidentId=addIncident(device,evaluation,{sample,receivedAt:now,source,temperatureRise: evaluation.rise},now);
    db.prepare('DELETE FROM safety_samples WHERE at < ?').run(now-86400000);
    return{accepted:true,state:evaluation.state,details:evaluation.details,incidentId};
  }
  return async function handle(req,res,url,{json,body}){
    if(!url.pathname.startsWith('/api/safety/'))return false;
    const send=(status,data)=>{json(res,status,data);return true;};
    const path=url.pathname.slice('/api/safety/'.length);
    if(path==='state'&&req.method==='GET'){
      const at=Date.now();
      const devices=db.prepare('SELECT id,name,roomId,createdAt,lastSeen,lastSample FROM safety_devices').all().map(d=>({...d,lastSample:d.lastSample?JSON.parse(d.lastSample):null,...evaluateDetection(history(d.id,at),at)}));
      const photoCounts=Object.fromEntries(db.prepare('SELECT roomId,count(*) AS count FROM survey_photos GROUP BY roomId').all().map(x=>[x.roomId,x.count]));
      return send(200,{rooms:db.prepare('SELECT * FROM safety_rooms ORDER BY createdAt').all().map(r=>({id:r.id,createdAt:r.createdAt,...JSON.parse(r.payload)})),devices,incidents:incidents(),findings:findings(),assessments:db.prepare('SELECT * FROM assessments ORDER BY createdAt DESC LIMIT 200').all().map(r=>({...r,result:JSON.parse(r.result)})),photoCounts,at,ruleVersion:RULE_VERSION});
    }
    if(path==='rooms'&&req.method==='POST'){
      const data=parse(roomSchema,await body(req,5000));const id=crypto.randomUUID(),createdAt=Date.now();db.prepare('INSERT INTO safety_rooms VALUES(?,?,?)').run(id,createdAt,JSON.stringify(data));return send(201,{id,createdAt,...data});
    }
    if(path==='photos'){
      if(req.method==='GET'){const id=url.searchParams.get('roomId');requireRoom(id);return send(200,db.prepare('SELECT * FROM survey_photos WHERE roomId=? ORDER BY createdAt').all(id));}
      if(req.method==='POST'){
        const data=parse(photoSchema,await body(req,3100000));requireRoom(data.roomId);
        if(!validImage(data.dataUrl))return send(400,{error:'Upload a valid JPEG, PNG or WebP image under 2.2 MB.'});
        if(db.prepare('SELECT count(*) AS n FROM survey_photos WHERE roomId=?').get(data.roomId).n>=4)return send(409,{error:'A room can contain four photos. Delete a photo to replace it with a new view.'});
        const id=crypto.randomUUID(),createdAt=Date.now();db.prepare('INSERT INTO survey_photos VALUES(?,?,?,?,?)').run(id,data.roomId,createdAt,data.label,data.dataUrl);return send(201,{id,createdAt,...data});
      }
      if(req.method==='DELETE'){const id=url.searchParams.get('id');if(!id)return send(400,{error:'Missing photo ID.'});db.prepare('DELETE FROM survey_photos WHERE id=?').run(id);return send(200,{ok:true,note:'Photo deleted. Previous findings retain their text and identify the deleted evidence by ID.'});}
    }
    if(path==='ai-status'&&req.method==='GET')return send(200,await aiStatus());
    if(path==='analyze'&&req.method==='POST'){
      const data=parse(z.object({roomId:z.string().uuid(),cloudConsent:z.boolean().default(false)}).strict(),await body(req,2000));
      const target=requireRoom(data.roomId);const photos=db.prepare('SELECT * FROM survey_photos WHERE roomId=? ORDER BY createdAt').all(data.roomId);
      if(!photos.length)return send(400,{error:'Add room photos before requesting analysis.'});
      if(incidents().some(i=>i.source==='live'&&i.level==='alarm'&&i.status!=='closed'))return send(409,{error:'An unresolved device alarm is recorded. Prioritize evacuation and emergency response; do not continue a photo survey during an incident.'});
      if(analyzing)return send(409,{error:'An AI assessment is already running. Wait for it to finish.'});
      analyzing=true;
      try{
        const analysis=await analyzePhotos(target,photos,{consent:data.cloudConsent});const id=crypto.randomUUID(),now=Date.now();
        db.exec('BEGIN');
        try{
          db.prepare('INSERT INTO assessments VALUES(?,?,?,?,?,?)').run(id,data.roomId,now,analysis.provider,analysis.model,JSON.stringify(analysis.result));
          for(const f of analysis.result.findings){const findingId=crypto.randomUUID();const payload={...f,photoId:photos[f.photo_index].id,action:CATEGORIES[f.category].action,source:'ai',assessmentId:id,status:'unreviewed',reviewNote:''};delete payload.photo_index;db.prepare('INSERT INTO findings VALUES(?,?,?,?)').run(findingId,data.roomId,now,JSON.stringify(payload));}
          db.exec('COMMIT');
        }catch(e){db.exec('ROLLBACK');throw e;}
        return send(201,{id,...analysis});
      }finally{analyzing=false;}
    }
    if(path==='findings'){
      if(req.method==='POST'){
        const f=parse(findingSchema,await body(req,5000));requireRoom(f.roomId);
        if(f.photoId&&!db.prepare('SELECT id FROM survey_photos WHERE id=? AND roomId=?').get(f.photoId,f.roomId))return send(400,{error:'Photo does not belong to the selected room.'});
        const id=crypto.randomUUID(),now=Date.now();const payload={...f,source:'manual',action:CATEGORIES[f.category].action,assessmentId:null,status:'unreviewed',reviewNote:''};db.prepare('INSERT INTO findings VALUES(?,?,?,?)').run(id,f.roomId,now,JSON.stringify(payload));return send(201,{id});
      }
      if(req.method==='PATCH'){
        const data=parse(reviewSchema,await body(req,2500));const row=db.prepare('SELECT * FROM findings WHERE id=?').get(data.id);if(!row)return send(404,{error:'Finding not found.'});
        const payload={...JSON.parse(row.payload),status:data.status,reviewNote:data.note,reviewedAt:Date.now()};db.prepare('UPDATE findings SET payload=? WHERE id=?').run(JSON.stringify(payload),data.id);return send(200,{ok:true});
      }
    }
    if(path==='devices'&&req.method==='POST'){
      const data=parse(deviceSchema,await body(req,3000));requireRoom(data.roomId);
      if(db.prepare('SELECT id FROM safety_devices WHERE id=?').get(data.id))return send(409,{error:'This device ID is already paired.'});
      const token=randomBytes(32).toString('hex');db.prepare('INSERT INTO safety_devices(id,name,roomId,createdAt,tokenHash) VALUES(?,?,?,?,?)').run(data.id,data.name,data.roomId,Date.now(),hash(token));
      return send(201,{...data,token,note:'Keep this token on your local gateway. It is shown only once.'});
    }
    if(path==='samples'&&req.method==='POST'){
      const data=parse(z.object({source:z.enum(['usb','websocket','demo','import']),sample:sensorSchema}).strict(),await body(req,5000));return send(200,ingest(data.sample,data.source));
    }
    if(path==='device-telemetry'&&req.method==='POST'){
      const sample=parse(sensorSchema,await body(req,5000));const d=db.prepare('SELECT tokenHash FROM safety_devices WHERE id=?').get(sample.device_id);
      const supplied=(req.headers.authorization||'').replace(/^Bearer /,'');
      if(!d||!supplied||!timingSafeEqual(Buffer.from(hash(supplied)),Buffer.from(d.tokenHash)))return send(401,{error:'Invalid device credential.'});
      return send(200,ingest(sample,'device'));
    }
    if(path==='demo'&&req.method==='POST'){
      const data=parse(z.object({roomId:z.string().uuid(),scenario:z.enum(['particles','combined','alarm'])}).strict(),await body(req,2000));requireRoom(data.roomId);
      const now=Date.now();const samples=[];for(let i=0;i<=15;i++)samples.push({at:now-(15-i)*2000,sample:{device_id:'demo-'+data.scenario,pm25_ugm3:100,ambient_c:25+i*.35,...(data.scenario==='combined'?{co_ppm:30}:{}),...(data.scenario==='alarm'?{smoke_alarm:true}:{})}});
      if(data.scenario==='particles')samples.forEach(r=>r.sample.ambient_c=25);
      const evaluated=evaluateDetection(samples,now);const device={id:'demo-'+data.roomId+'-'+data.scenario,roomId:data.roomId};
      const incidentId=addIncident(device,evaluated,{sample:samples.at(-1).sample,receivedAt:now,source:'demo',syntheticTimeline:true},now,'demo');return send(201,{incidentId,state:evaluated.state,demo:true});
    }
    if(path==='incidents'&&req.method==='PATCH'){
      const data=parse(z.object({id:z.string().uuid(),status:z.enum(['acknowledged','closed']),note:z.string().trim().min(3).max(1000)}).strict(),await body(req,2500));
      const row=db.prepare('SELECT * FROM incidents WHERE id=?').get(data.id);if(!row)return send(404,{error:'Incident not found.'});const p=JSON.parse(row.payload);
      if(data.status==='closed'&&row.source==='live'){
        const now=Date.now(),samples=history(row.deviceId,now),original=p.evidence.sample;
        if(!canCloseIncident(samples,original,now))return send(409,{error:'Closing requires 30 seconds of continuous, fresh readings below the prototype triggers and explicit cleared alarm contacts. Missing data is not an all-clear. Acknowledge instead.'});
      }
      p.note=data.note;p.events.push({at:Date.now(),text:data.status+': '+data.note});db.prepare('UPDATE incidents SET status=?,payload=? WHERE id=?').run(data.status,JSON.stringify(p),data.id);return send(200,{ok:true});
    }
    return send(404,{error:'Safety endpoint not found.'});
  };
}
