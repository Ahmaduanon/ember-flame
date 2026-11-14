import http from 'node:http';
import { loadEnvFile } from 'node:process';
import { DatabaseSync } from 'node:sqlite';
import { readFile, stat } from 'node:fs/promises';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, timingSafeEqual } from 'node:crypto';
import { experimentSchema, waitlistSchema } from '../lib/validation.ts';
import { NASA_FLIGHT_DATASETS, compareWithNasa, matchNasaDataset } from '../lib/nasa-data.ts';
import { installAuth } from './auth.mjs';
import { installSafety } from './safety/routes.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
try { loadEnvFile(path.join(root,'.env')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const port = Number(process.env.EMBER_PORT || process.env.PORT || 3000);
// EMBER_PUBLIC=1 serves only the landing page and waitlist; lab and account APIs stay closed.
const publicMode = process.env.EMBER_PUBLIC === '1';
const rate = new Map();
const same = (a,b) => timingSafeEqual(createHash('sha256').update(String(a)).digest(), createHash('sha256').update(String(b)).digest());
const dataDir = process.env.EMBER_DATA_DIR || path.join(root,'data');
mkdirSync(dataDir,{recursive:true});
const db = new DatabaseSync(path.join(dataDir,'ember.sqlite'));
db.exec(`PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS experiments(id TEXT PRIMARY KEY,title TEXT NOT NULL,createdAt INTEGER NOT NULL,payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS waitlist(id TEXT PRIMARY KEY,createdAt INTEGER NOT NULL,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,role TEXT NOT NULL,note TEXT NOT NULL DEFAULT '');
DROP TABLE IF EXISTS telemetry;`);
const safety=installSafety(db);
const auth=installAuth(db,{secureCookie:process.env.EMBER_SECURE_COOKIE==='1'});
const dev=process.argv.includes('--dev');
const vite=dev?await (await import('vite')).createServer({root,server:{middlewareMode:true},appType:'spa'}):null;
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
async function body(req,limit){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>limit)throw Object.assign(new Error('Request is too large.'),{status:413});chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Object.assign(new Error('Invalid JSON.'),{status:400});}}
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.ino':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
  try {
    // This is a single-user localhost application, not a public multiuser server.
    const validHosts=[`localhost:${port}`,`127.0.0.1:${port}`,`[::1]:${port}`];
    if(!publicMode&&!validHosts.includes(req.headers.host||''))return json(res,403,{error:'This application accepts localhost connections only.'});
    const url=new URL(req.url,`http://${req.headers.host}`);
    if(req.method!=='GET' && req.method!=='HEAD'){
      const origin=req.headers.origin;
      if(origin && (publicMode?!(()=>{try{return new URL(origin).host===req.headers.host;}catch{return false;}})():!validHosts.map(h=>'http://'+h).includes(origin)))return json(res,403,{error:'Cross-origin write rejected.'});
      if(req.headers['sec-fetch-site']==='cross-site')return json(res,403,{error:'Cross-site request rejected.'});
    }
    if(publicMode&&url.pathname.startsWith('/api/')&&!['/api/health','/api/waitlist'].includes(url.pathname))return json(res,403,{error:'Not available on the public site.'});
    const session=publicMode?null:auth.getSession(req);
    if(url.pathname==='/api/waitlist'){
      if(req.method==='POST'){
        const raw=await body(req,4000);
        if(raw&&typeof raw.website==='string'&&raw.website)return json(res,201,{ok:true});
        const ip=req.socket.remoteAddress||'?',now=Date.now(),hits=(rate.get(ip)||[]).filter(t=>now-t<3600000);
        if(hits.length>=5)return json(res,429,{error:'Too many sign-ups from this connection. Try again later.'});
        hits.push(now);rate.set(ip,hits);if(rate.size>2000)rate.clear();
        const parsed=waitlistSchema.safeParse(raw);
        if(!parsed.success)return json(res,400,{error:'Enter your name and a valid email address.'});
        const {name,email,role,note}=parsed.data;
        const r=db.prepare('INSERT OR IGNORE INTO waitlist(id,createdAt,name,email,role,note) VALUES(?,?,?,?,?,?)').run(crypto.randomUUID(),now,name,email,role,note||'');
        return json(res,201,{ok:true,already:r.changes===0});
      }
      if(req.method==='GET'){
        const token=process.env.EMBER_ADMIN_TOKEN;
        const allowed=(token&&same(req.headers['x-admin-token']||'',token))||(!publicMode&&!!session);
        if(!allowed)return json(res,403,{error:'Sign in (or send the X-Admin-Token header) to read the waitlist.'});
        const rows=db.prepare('SELECT createdAt,name,email,role,note FROM waitlist ORDER BY createdAt DESC').all();
        if(url.searchParams.get('format')!=='csv')return json(res,200,rows);
        const q=v=>'"'+String(v).replace(/^[=+\-@]/,"'$&").replace(/"/g,'""')+'"';
        res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="waitlist.csv"'});
        return res.end(['date,name,email,role,note',...rows.map(r=>[new Date(r.createdAt).toISOString(),r.name,r.email,r.role,r.note].map(q).join(','))].join('\n'));
      }
    }
    if(await auth.handle(req,res,url,{json,body}))return;
    if(url.pathname.startsWith('/api/')&&!['/api/health','/api/nasa/benchmarks','/api/nasa/calibrate'].includes(url.pathname)&&!session)return json(res,401,{error:'Sign in required.'});
    if(await safety(req,res,url,{json,body}))return;
    if(url.pathname==='/api/health')return json(res,200,{ok:true,storage:'SQLite',mode:publicMode?'public':'local'});
    if(url.pathname==='/api/nasa/benchmarks'){
      const id = url.searchParams.get('id');
      if (id) {
        const ds = NASA_FLIGHT_DATASETS[id];
        if (!ds) return json(res, 404, { error: 'NASA benchmark dataset not found.' });
        return json(res, 200, ds);
      }
      return json(res, 200, Object.values(NASA_FLIGHT_DATASETS));
    }
    if(url.pathname==='/api/nasa/calibrate'){
      if(req.method!=='POST') return json(res, 405, { error: 'POST required for calibration comparison.' });
      const raw = await body(req, 100000);
      if(!raw || typeof raw !== 'object') return json(res, 400, { error: 'Invalid payload.' });
      const dataset = raw.datasetId ? NASA_FLIGHT_DATASETS[raw.datasetId] : matchNasaDataset(raw.settings || raw);
      if(!dataset) return json(res, 404, { error: 'No matching NASA dataset found.' });
      const temp = Number(raw.temperature) || 1600;
      const size = Number(raw.size) || 18;
      const time = Number(raw.time) || 30;
      const comparison = compareWithNasa(temp, size, time, dataset);
      return json(res, 200, { dataset: { id: dataset.id, name: dataset.name, mission: dataset.mission, radFrac: dataset.radiationFraction }, comparison });
    }
    if(url.pathname==='/api/runs'){
      if(req.method==='GET')return json(res,200,db.prepare('SELECT * FROM experiments ORDER BY createdAt DESC LIMIT 100').all().map(r=>({...r,payload:JSON.parse(r.payload)})));
      if(req.method==='POST'){
        const parsed=experimentSchema.safeParse(await body(req,500000));
        if(!parsed.success)return json(res,400,{error:'Invalid experiment data.'});
        const {title,payload}=parsed.data,id=crypto.randomUUID(),createdAt=Date.now();
        db.prepare('INSERT INTO experiments VALUES(?,?,?,?)').run(id,title,createdAt,JSON.stringify(payload));
        return json(res,201,{id,createdAt});
      }
      if(req.method==='DELETE'){
        const id=url.searchParams.get('id');if(!id)return json(res,400,{error:'Missing experiment ID.'});
        db.prepare('DELETE FROM experiments WHERE id=?').run(id);return json(res,200,{ok:true});
      }
    }
    if(url.pathname.startsWith('/api/'))return json(res,404,{error:'Endpoint not found.'});
    if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'Method not allowed.'});
    if(vite)return vite.middlewares(req,res,()=>json(res,404,{error:'Not found.'}));
    const base=path.join(root,'dist');
    let rel;try{rel=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);}catch{return json(res,400,{error:'Invalid path.'});}
    const file=path.resolve(base,'.'+rel);
    if(!file.startsWith(base+path.sep))return json(res,403,{error:'Invalid path.'});
    try{
      if(!(await stat(file)).isFile())throw new Error('not a file');
      const content=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:content);
    }catch{return json(res,404,{error:'File not found. Run npm run build before starting the app.'});}
  }catch(error){json(res,error.status||500,{error:error.status?error.message:'The local server could not complete this request.'});console.error(error.message);}
});
server.listen(port,publicMode?'0.0.0.0':'127.0.0.1',()=>console.log(`\n  EMBER — Building Safety & Combustion Lab\n  Open http://localhost:${port}\n  Surveys, sensor events and experiments are stored on this computer.\n  Press Ctrl+C to stop.\n`));
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
function shutdown(){server.close(()=>{db.close();process.exit(0);});}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
