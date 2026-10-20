import type { SensorSample } from './validation';
export const RULE_VERSION='EMBER-DETECT 0.2-prototype';
// Bench-demo constants, not certified smoke/CO alarm thresholds or safe exposure limits.
export const RULES={particleWatch:75,coReview:25,temperatureRise:8,particleSeconds:20,combinedSeconds:8,staleSeconds:15,gapSeconds:6};
export type DetectionSample={at:number;sample:SensorSample};
export type Detection={state:'no_trigger'|'collecting'|'watch'|'warning'|'alarm'|'fault'|'offline';details:string[];rise:number|null};
export function evaluateDetection(history:DetectionSample[],now:number):Detection{
  const sorted=history.filter(r=>r.at<=now).sort((a,b)=>a.at-b.at);const last=sorted.at(-1);
  if(!last||now-last.at>RULES.staleSeconds*1000)return{state:'offline',details:['No recent sensor sample. Monitoring coverage is unknown.'],rise:null};
  const s=last.sample;
  // Independent alarm inputs are never delayed by warm-up, corroboration, or a fault.
  if(s.smoke_alarm===true||s.co_alarm===true)return{state:'alarm',details:[s.smoke_alarm?'Device reports an active smoke-alarm contact.':'Device reports an active CO-alarm contact.','Leave the building if an alarm sounds or smoke/fire is present. Call local emergency services from a safe place.'],rise:null};
  if(s.guardian_state==='discharging'||s.guardian_state==='cooldown')return{state:'alarm',details:['Ember Guardian reports a confirmed pre-fire pattern and a suppressant release.','Leave the area. Call emergency services if smoke or fire is present.'],rise:null};
  if(s.sensor_fault===true)return{state:'fault',details:['Device reports a sensor fault. This is not an all-clear.'],rise:null};
  if(s.guardian_state==='warning')return{state:'warning',details:['Ember Guardian: two independent sensor types agree on a possible pre-fire pattern.','These signals do not identify a fire, its origin, or its cause.'],rise:null};
  if(s.warming_up===true)return{state:'collecting',details:['The sensor is warming up (about 30 to 60 seconds). Monitoring starts when it finishes.'],rise:null};
  let start=sorted.length-1;while(start>0&&sorted[start].at-sorted[start-1].at<=RULES.gapSeconds*1000&&now-sorted[start-1].at<120000)start--;
  const recent=sorted.slice(start);const past=recent.find(r=>r.sample.sensor_fault!==true&&typeof r.sample.ambient_c==='number'&&last.at-r.at>=10000&&last.at-r.at<=60000);
  const rise=past&&typeof s.ambient_c==='number'?((s.ambient_c-past.sample.ambient_c!)/((last.at-past.at)/60000)):null;
  function sustained(predicate:(x:SensorSample)=>boolean,seconds:number){let first=recent.length;for(let i=recent.length-1;i>=0&&predicate(recent[i].sample);i--)first=i;return recent.length-first>=3&&last!.at-(recent[first]?.at??last!.at)>=seconds*1000;}
  const particleHigh=(x:SensorSample)=>x.sensor_fault!==true&&typeof x.pm25_ugm3==='number'&&x.pm25_ugm3>=RULES.particleWatch;
  const gasHigh=(x:SensorSample)=>x.sensor_fault!==true&&typeof x.co_ppm==='number'&&x.co_ppm>=RULES.coReview;
  const details:string[]=[];
  if(sustained(x=>particleHigh(x)&&gasHigh(x),RULES.combinedSeconds)||(sustained(particleHigh,RULES.combinedSeconds)&&rise!==null&&rise>=RULES.temperatureRise)){
    details.push('Persistent particle elevation with a second sensor change reached the prototype warning rule.');
    if(typeof s.humidity_pct==='number'&&s.humidity_pct>80)details.push('High humidity is present; steam or other nuisance aerosols may influence the particle measurement. Do not dismiss an alarm on that basis.');
    details.push('These signals do not identify a fire, its origin, or its cause.');return{state:'warning',details,rise};
  }
  if(sustained(particleHigh,RULES.particleSeconds)||sustained(gasHigh,10))return{state:'watch',details:['A persistent particle or CO reading reached a prototype review rule. The source is unknown.','Smoke, dust, cooking aerosols and other conditions require context; the app cannot establish that the area is safe.'],rise};
  const hasSignal=typeof s.pm25_ugm3==='number'||typeof s.co_ppm==='number'||typeof s.smoke_alarm==='boolean'||typeof s.co_alarm==='boolean';
  if(!hasSignal)return{state:'collecting',details:['No particle, CO, or independent alarm channel is supplied. Fire-monitoring coverage is incomplete.'],rise};
  if(particleHigh(s)||gasHigh(s))return{state:'collecting',details:['Elevated reading received; collecting a continuous history for the prototype rule. Independent alarm contacts remain immediate.'],rise};
  return{state:'no_trigger',details:['No prototype rule is active. This is not a safety certification or an all-clear.'],rise};
}

// Closing a record is an administrative action, never a declaration of safety.
export function canCloseIncident(history:DetectionSample[],original:SensorSample,now:number):boolean{
  if(evaluateDetection(history,now).state!=='no_trigger')return false;
  const sorted=history.filter(r=>r.at<=now).sort((a,b)=>a.at-b.at),last=sorted.at(-1);
  if(!last)return false;
  const okay=(s:SensorSample)=>s.sensor_fault!==true&&s.smoke_alarm!==true&&s.co_alarm!==true
    &&(typeof original.pm25_ugm3!=='number'||(typeof s.pm25_ugm3==='number'&&s.pm25_ugm3<RULES.particleWatch))
    &&(typeof original.co_ppm!=='number'||(typeof s.co_ppm==='number'&&s.co_ppm<RULES.coReview))
    &&(!original.smoke_alarm||s.smoke_alarm===false)&&(!original.co_alarm||s.co_alarm===false);
  let first=sorted.length;
  for(let i=sorted.length-1;i>=0;i--){
    if(!okay(sorted[i].sample)||(i<sorted.length-1&&sorted[i+1].at-sorted[i].at>RULES.gapSeconds*1000))break;
    first=i;
  }
  return sorted.length-first>=3&&last.at-(sorted[first]?.at??last.at)>=30000;
}
