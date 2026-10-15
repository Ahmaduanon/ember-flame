import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateDetection, canCloseIncident } from '../lib/detection.ts';
import { sensorSchema } from '../lib/validation.ts';
const now=100000;
const packet=fields=>({device_id:'test-node',...fields});
const history=(seconds,fields)=>Array.from({length:seconds/2+1},(_,i)=>({at:now-seconds*1000+i*2000,sample:packet(typeof fields==='function'?fields(i):fields)}));
test('new smoke and CO alarm inputs bypass continuity, startup and reported faults',()=>{
  for(const field of ['smoke_alarm','co_alarm'])assert.equal(evaluateDetection(history(0,{[field]:true,sensor_fault:true}),now).state,'alarm');
});
test('absent or stale readings are offline, and absent fire channels are incomplete',()=>{
  assert.equal(evaluateDetection([],now).state,'offline');
  assert.equal(evaluateDetection([{at:now-16000,sample:packet({pm25_ugm3:0})}],now).state,'offline');
  assert.equal(evaluateDetection(history(0,{ambient_c:25}),now).state,'collecting');
  assert.equal(evaluateDetection(history(0,{pm25_ugm3:1,sensor_fault:true}),now).state,'fault');
  assert.equal(evaluateDetection(history(0,{pm25_ugm3:1}),now).state,'no_trigger');
});
test('short particle pulses do not become persistent events; gaps and faults restart continuity',()=>{
  assert.equal(evaluateDetection(history(18,{pm25_ugm3:100}),now).state,'collecting');
  const gapped=history(30,{pm25_ugm3:100}).filter(x=>x.at<now-16000||x.at>now-10000);
  assert.equal(evaluateDetection(gapped,now).state,'collecting');
  const faulted=history(30,{pm25_ugm3:100});faulted.at(-4).sample.sensor_fault=true;
  assert.equal(evaluateDetection(faulted,now).state,'collecting');
});
test('sustained particles and CO reach review rules without invented missing channels',()=>{
  const pm=history(20,{pm25_ugm3:75});assert.equal(evaluateDetection(pm,now).state,'watch');
  assert.equal(pm.at(-1).sample.co_ppm,undefined);
  assert.equal(evaluateDetection(history(10,{co_ppm:25}),now).state,'watch');
});
test('corroboration produces warning and high humidity never vetoes it',()=>{
  assert.equal(evaluateDetection(history(8,{pm25_ugm3:100,co_ppm:30}),now).state,'warning');
  const warm=history(20,i=>({pm25_ugm3:100,ambient_c:20+i*.4,humidity_pct:90}));
  const result=evaluateDetection(warm,now);assert.equal(result.state,'warning');assert.ok(result.rise>=8);assert.match(result.details.join(' '),/humidity/);
});
test('closing requires sustained fresh measurements and explicit cleared alarm channels',()=>{
  const original=packet({pm25_ugm3:100,smoke_alarm:true});
  assert.equal(canCloseIncident(history(30,{pm25_ugm3:1,smoke_alarm:false}),original,now),true);
  assert.equal(canCloseIncident(history(28,{pm25_ugm3:1,smoke_alarm:false}),original,now),false);
  assert.equal(canCloseIncident(history(30,{pm25_ugm3:1}),original,now),false);
  assert.equal(canCloseIncident(history(30,{smoke_alarm:false}),original,now),false);
  assert.equal(canCloseIncident(history(30,{pm25_ugm3:1,smoke_alarm:false}),original,now+16000),false);
  const gap=history(40,{pm25_ugm3:1,smoke_alarm:false}).filter(x=>x.at<now-22000||x.at>now-14000);
  assert.equal(canCloseIncident(gap,original,now),false);
  const newAlarm=history(30,{pm25_ugm3:1,smoke_alarm:false,co_alarm:true});
  assert.equal(canCloseIncident(newAlarm,original,now),false);
});
test('sensor schema validates physical units and permits alarm-only and fault-only packets',()=>{
  for(const p of [{pm25_ugm3:12.5,co_ppm:0,humidity_pct:51},{smoke_alarm:false},{sensor_fault:true}])assert.ok(sensorSchema.safeParse(packet(p)).success);
  for(const p of [{pm25_ugm3:-1},{co_ppm:'20'},{co_ppm:1001},{humidity_pct:101},{smoke_alarm:1},{battery_pct:50},{pm25_ugm3:20,unexpected:true}])assert.equal(sensorSchema.safeParse(packet(p)).success,false);
});
