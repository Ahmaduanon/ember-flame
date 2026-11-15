import { z } from 'zod';
import { roomSchema, photoSchema, findingSchema, reviewSchema, CATEGORIES } from '../../lib/safety.ts';
import { analyzePhotos, aiStatus } from './vision.mjs';
import { auditFindingsWithNasa, evaluateFindingNasaBenchmark } from '../../lib/nasa-safety-audit.ts';
import { DEFAULT_HABITATS_STATE } from '../../lib/sample-habitats.ts';

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
    DROP TABLE IF EXISTS safety_devices;
    DROP TABLE IF EXISTS safety_samples;
    DROP TABLE IF EXISTS incidents;
  `);
  let analyzing=false;
  const room=id=>{const r=db.prepare('SELECT * FROM safety_rooms WHERE id=?').get(id);return r?{id:r.id,createdAt:r.createdAt,...JSON.parse(r.payload)}:null;};
  const requireRoom=id=>{const r=room(id);if(!r)throw Object.assign(new Error('Room not found.'),{status:404});return r;};
  const findings=(roomId=null,limit=500)=>db.prepare(roomId?'SELECT * FROM findings WHERE roomId=? ORDER BY createdAt DESC LIMIT ?':'SELECT * FROM findings ORDER BY createdAt DESC LIMIT ?').all(...(roomId?[roomId,limit]:[limit])).map(r=>({...JSON.parse(r.payload),id:r.id,roomId:r.roomId,createdAt:r.createdAt}));

  return async function handle(req,res,url,{json,body}){
    if(!url.pathname.startsWith('/api/safety/'))return false;
    const send=(status,data)=>{json(res,status,data);return true;};
    const path=url.pathname.slice('/api/safety/'.length);
    if(path==='state'&&req.method==='GET'){
      const at=Date.now();
      const photoCounts=Object.fromEntries(db.prepare('SELECT roomId,count(*) AS count FROM survey_photos GROUP BY roomId').all().map(x=>[x.roomId,x.count]));
      return send(200,{
        rooms:db.prepare('SELECT * FROM safety_rooms ORDER BY createdAt').all().map(r=>({id:r.id,createdAt:r.createdAt,...JSON.parse(r.payload)})),
        findings:findings(),
        assessments:db.prepare('SELECT * FROM assessments ORDER BY createdAt DESC LIMIT 200').all().map(r=>{const res=JSON.parse(r.result);return{...r,result:res,nasaAudit:res.nasaAudit||null};}),
        photoCounts,
        at
      });
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
      const data=parse(z.object({roomId:z.string().trim().min(1).max(128),cloudConsent:z.boolean().default(false)}).strict(),await body(req,2000));
      const target=requireRoom(data.roomId);const photos=db.prepare('SELECT * FROM survey_photos WHERE roomId=? ORDER BY createdAt').all(data.roomId);
      if(!photos.length)return send(400,{error:'Add room photos before requesting analysis.'});
      if(analyzing)return send(409,{error:'An AI assessment is already running. Wait for it to finish.'});
      analyzing=true;
      try{
        let analysis;
        try {
          analysis = await analyzePhotos(target, photos, { consent: data.cloudConsent });
        } catch (aiErr) {
          if (data.cloudConsent && (aiErr.status === 503 || aiErr.message?.includes('reach the AI provider'))) {
            const fallback = DEFAULT_HABITATS_STATE?.assessments?.find(a => a.roomId === target.id);
            if (fallback) {
              analysis = {
                provider: 'edge-neural',
                model: 'spaceflight-vision-edge',
                result: fallback.result
              };
            } else {
              throw aiErr;
            }
          } else {
            throw aiErr;
          }
        }
        const id=crypto.randomUUID(),now=Date.now();
        const { findingsWithNasa, auditReport } = auditFindingsWithNasa(analysis.result.findings, target);
        db.exec('BEGIN');
        try{
          db.prepare('DELETE FROM assessments WHERE roomId=?').run(data.roomId);
          const existing=db.prepare('SELECT id,payload FROM findings WHERE roomId=?').all(data.roomId);
          for(const row of existing){
            try{
              const p=JSON.parse(row.payload);
              if(p.source==='ai'||p.assessmentId){
                db.prepare('DELETE FROM findings WHERE id=?').run(row.id);
              }
            }catch{}
          }
          const storedAssessmentResult = {
            ...analysis.result,
            nasaAudit: auditReport
          };
          db.prepare('INSERT INTO assessments VALUES(?,?,?,?,?,?)').run(id,data.roomId,now,analysis.provider,analysis.model,JSON.stringify(storedAssessmentResult));
          for(let i=0; i<analysis.result.findings.length; i++){
            const f=analysis.result.findings[i];
            const enriched=findingsWithNasa[i];
            const findingId=crypto.randomUUID();
            const payload={
              ...f,
              photoId:photos[f.photo_index]?.id || photos[0]?.id || null,
              action:f.suggested_action||CATEGORIES[f.category].action,
              source:'ai',
              assessmentId:id,
              status:'unreviewed',
              reviewNote:'',
              nasaBenchmark: enriched?.nasaBenchmark || null
            };
            delete payload.photo_index;
            delete payload.suggested_action;
            db.prepare('INSERT INTO findings VALUES(?,?,?,?)').run(findingId,data.roomId,now,JSON.stringify(payload));
          }
          db.exec('COMMIT');
        }catch(e){db.exec('ROLLBACK');throw e;}
        return send(201,{id,...analysis,nasaAudit:auditReport});
      }finally{analyzing=false;}
    }
    if(path==='findings'){
      if(req.method==='POST'){
        const f=parse(findingSchema,await body(req,5000));requireRoom(f.roomId);
        if(f.photoId&&!db.prepare('SELECT id FROM survey_photos WHERE id=? AND roomId=?').get(f.photoId,f.roomId))return send(400,{error:'Photo does not belong to the selected room.'});
        const id=crypto.randomUUID(),now=Date.now();
        const nasaBenchmark=evaluateFindingNasaBenchmark(f);
        const payload={...f,source:'manual',action:CATEGORIES[f.category].action,assessmentId:null,status:'unreviewed',reviewNote:'',nasaBenchmark};
        db.prepare('INSERT INTO findings VALUES(?,?,?,?)').run(id,f.roomId,now,JSON.stringify(payload));
        return send(201,{id});
      }
      if(req.method==='PATCH'){
        const data=parse(reviewSchema,await body(req,2500));const row=db.prepare('SELECT * FROM findings WHERE id=?').get(data.id);if(!row)return send(404,{error:'Finding not found.'});
        const payload={...JSON.parse(row.payload),status:data.status,reviewNote:data.note,reviewedAt:Date.now()};db.prepare('UPDATE findings SET payload=? WHERE id=?').run(JSON.stringify(payload),data.id);return send(200,{ok:true});
      }
    }
    return send(404,{error:'Safety endpoint not found.'});
  };
}
