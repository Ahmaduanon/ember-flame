import http from 'node:http';
import { loadEnvFile } from 'node:process';
import { DatabaseSync } from 'node:sqlite';
import { readFile, stat } from 'node:fs/promises';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { experimentSchema, telemetrySchema } from '../lib/validation.ts';
import { installSafety } from './safety/routes.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
try { loadEnvFile(path.join(root,'.env')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const port = Number(process.env.EMBER_PORT || 3000);
const dataDir = process.env.EMBER_DATA_DIR || path.join(root,'data');
mkdirSync(dataDir,{recursive:true});
const db = new DatabaseSync(path.join(dataDir,'ember.sqlite'));
db.exec(`PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS experiments(id TEXT PRIMARY KEY,title TEXT NOT NULL,createdAt INTEGER NOT NULL,payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS telemetry(id TEXT PRIMARY KEY,receivedAt INTEGER NOT NULL,source TEXT NOT NULL,payload TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS telemetry_received ON telemetry(receivedAt);`);
const safety=installSafety(db);
const dev=process.argv.includes('--dev');
const vite=dev?await (await import('vite')).createServer({root,server:{middlewareMode:true},appType:'spa'}):null;
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
async function body(req,limit){let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>limit)throw Object.assign(new Error('Request is too large.'),{status:413});}try{return JSON.parse(text);}catch{throw Object.assign(new Error('Invalid JSON.'),{status:400});}}
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.ino':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
  try {
    // This is a single-user localhost application, not a public multiuser server.
    const validHosts=[`localhost:${port}`,`127.0.0.1:${port}`];
    if(!validHosts.includes(req.headers.host||''))return json(res,403,{error:'This application accepts localhost connections only.'});
    const url=new URL(req.url,`http://${req.headers.host}`);
    if(req.method!=='GET' && req.method!=='HEAD'){
      const origin=req.headers.origin;
      if(origin && !validHosts.map(h=>'http://'+h).includes(origin))return json(res,403,{error:'Cross-origin write rejected.'});
      if(req.headers['sec-fetch-site']==='cross-site')return json(res,403,{error:'Cross-site request rejected.'});
    }
    if(await safety(req,res,url,{json,body}))return;
    if(url.pathname==='/api/health')return json(res,200,{ok:true,storage:'SQLite',mode:'local'});
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
    if(url.pathname==='/api/telemetry'){
      if(req.method==='GET')return json(res,200,db.prepare('SELECT * FROM telemetry ORDER BY receivedAt DESC LIMIT 100').all().map(({payload,...r})=>({...r,sample:JSON.parse(payload)})));
      if(req.method==='POST'){
        const parsed=telemetrySchema.safeParse(await body(req,5000));
        if(!parsed.success)return json(res,400,{error:'Invalid sensor sample. Check the documented JSON format.'});
        const latest=db.prepare('SELECT receivedAt FROM telemetry ORDER BY receivedAt DESC LIMIT 1').get();
        const receivedAt=Date.now();
        if(latest&&receivedAt-Number(latest.receivedAt)<900)return json(res,429,{error:'Record at most one sample per second.'});
        const id=crypto.randomUUID();db.prepare('INSERT INTO telemetry VALUES(?,?,?,?)').run(id,receivedAt,parsed.data.source,JSON.stringify(parsed.data.sample));
        db.prepare('DELETE FROM telemetry WHERE receivedAt < ?').run(receivedAt-7*86400000);
        return json(res,201,{id,receivedAt});
      }
    }
    if(url.pathname.startsWith('/api/'))return json(res,404,{error:'Endpoint not found.'});
    if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'Method not allowed.'});
    if(vite)return vite.middlewares(req,res,()=>json(res,404,{error:'Not found.'}));
    const base=path.join(root,'dist');
    const file=path.resolve(base,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
    if(!file.startsWith(base+path.sep))return json(res,403,{error:'Invalid path.'});
    try{
      if(!(await stat(file)).isFile())throw new Error('not a file');
      const content=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Permissions-Policy':'serial=(self)'});res.end(req.method==='HEAD'?undefined:content);
    }catch{return json(res,404,{error:'File not found. Run npm run build before starting the app.'});}
  }catch(error){json(res,error.status||500,{error:error.status?error.message:'The local server could not complete this request.'});console.error(error.message);}
});
server.listen(port,'127.0.0.1',()=>console.log(`\n  EMBER — Building Safety & Combustion Lab\n  Open http://localhost:${port}\n  Surveys, sensor events and experiments are stored on this computer.\n  Press Ctrl+C to stop.\n`));
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
function shutdown(){server.close(()=>{db.close();process.exit(0);});}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
