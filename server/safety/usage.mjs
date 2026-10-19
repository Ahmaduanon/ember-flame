import { DEFAULT_POLICY, usagePolicySchema } from '../../lib/usage.ts';
export function installUsage(db){
  db.exec(`CREATE TABLE IF NOT EXISTS ai_policy(id INTEGER PRIMARY KEY CHECK(id=1),payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS ai_attempts(id TEXT PRIMARY KEY,at INTEGER NOT NULL,provider TEXT NOT NULL,status TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS ai_attempts_time ON ai_attempts(at);`);
  db.prepare('INSERT OR IGNORE INTO ai_policy VALUES(1,?)').run(JSON.stringify(DEFAULT_POLICY));
  const policy=()=>usagePolicySchema.parse(JSON.parse(db.prepare('SELECT payload FROM ai_policy WHERE id=1').get().payload));
  function status(now=Date.now()){
    const day=new Date(now).toISOString().slice(0,10),month=day.slice(0,7);
    const today=db.prepare("SELECT count(*) AS n FROM ai_attempts WHERE provider='openai' AND at>=?").get(Date.parse(day+'T00:00:00Z')).n;
    const thisMonth=db.prepare("SELECT count(*) AS n FROM ai_attempts WHERE provider='openai' AND at>=?").get(Date.parse(month+'-01T00:00:00Z')).n;
    return{policy:policy(),day,month,today,thisMonth,localAttempts:db.prepare("SELECT count(*) AS n FROM ai_attempts WHERE provider='ollama'").get().n,recent:db.prepare('SELECT at,provider,status FROM ai_attempts ORDER BY at DESC LIMIT 12').all()};
  }
  function reserve(provider,count,now=Date.now()){
    const s=status(now),p=s.policy;
    const fail=message=>{throw Object.assign(new Error(message),{status:429});};
    if(count>p.maxPhotos)fail(`Select at most ${p.maxPhotos} photos per request in Usage settings.`);
    if(provider==='openai'){
      if(!p.cloudEnabled)fail('Cloud AI is paused. Enable it and choose request limits in Usage & settings.');
      if(s.today>=p.dailyLimit||s.thisMonth>=p.monthlyLimit)fail('Cloud request allowance reached. Use manual review or a local model.');
      const last=db.prepare("SELECT at FROM ai_attempts WHERE provider='openai' ORDER BY at DESC LIMIT 1").get();
      if(last&&now-last.at<p.cooldownSeconds*1000)fail('Please wait for the cloud-request cooldown before trying again.');
    }
    const id=crypto.randomUUID();db.prepare('INSERT INTO ai_attempts VALUES(?,?,?,?)').run(id,now,provider,'started');return id;
  }
  return{status,policy,reserve,finish:(id,state)=>db.prepare('UPDATE ai_attempts SET status=? WHERE id=?').run(state,id),save:value=>{const p=usagePolicySchema.parse(value);db.prepare('UPDATE ai_policy SET payload=? WHERE id=1').run(JSON.stringify(p));return status();}};
}
