import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { installUsage } from '../server/safety/usage.mjs';
import { layoutSchema, reviewLayout, SAMPLE_LAYOUT } from '../lib/layout.ts';
const now=Date.UTC(2026,9,19,12);
function setup(){const db=new DatabaseSync(':memory:');return{db,usage:installUsage(db)};}
test('cloud calls default to paused while local calls remain available',()=>{
  const {db,usage}=setup();assert.throws(()=>usage.reserve('openai',1,now),e=>e.status===429&&/paused/.test(e.message));
  const id=usage.reserve('ollama',1,now);usage.finish(id,'completed');assert.equal(usage.status(now).localAttempts,1);assert.equal(usage.status(now).today,0);db.close();
});
test('cloud limits count failed attempts, enforce cooldown and survive reinitialization',()=>{
  const {db,usage}=setup();usage.save({...usage.policy(),cloudEnabled:true,dailyLimit:2,monthlyLimit:3});
  const a=usage.reserve('openai',1,now);usage.finish(a,'failed');
  assert.throws(()=>usage.reserve('openai',1,now+1000),/cooldown/);
  usage.reserve('openai',1,now+61000);assert.equal(usage.status(now+61000).today,2);
  assert.throws(()=>usage.reserve('openai',1,now+121000),/allowance/);
  const restored=installUsage(db);assert.equal(restored.status(now+121000).today,2);
  assert.throws(()=>restored.reserve('openai',1,now+181000),/allowance/);db.close();
});
test('monthly allowance persists across days, resets by calendar month, and image limits reject before recording',()=>{
  const {db,usage}=setup();usage.save({...usage.policy(),cloudEnabled:true,dailyLimit:1,monthlyLimit:1,maxPhotos:1});
  assert.throws(()=>usage.reserve('openai',2,now),/at most 1/);assert.equal(usage.status(now).today,0);
  usage.reserve('openai',1,now);assert.throws(()=>usage.reserve('openai',1,now+86400000),/allowance/);
  assert.equal(usage.status(Date.UTC(2026,10,1)).thisMonth,0);
  assert.ok(usage.reserve('openai',1,Date.UTC(2026,10,1)));db.close();
});
test('layout validation rejects out-of-bounds markers and rule prompts never claim wiring or safety scores',()=>{
  assert.ok(layoutSchema.safeParse(SAMPLE_LAYOUT).success);
  assert.equal(layoutSchema.safeParse({...SAMPLE_LAYOUT,items:[{id:'a',type:'socket',x:40,y:1}]}).success,false);
  const plain={width:5,depth:4,items:[{id:'a',type:'socket',x:1,y:1},{id:'b',type:'paper',x:1.1,y:1},{id:'c',type:'detector',x:3,y:2}]};
  assert.deepEqual(reviewLayout(plain),[]);
  const prompts=reviewLayout(SAMPLE_LAYOUT);assert.ok(prompts.some(p=>p.title.includes('exit')));assert.ok(prompts.some(p=>/clearance instructions/.test(p.detail)));assert.equal(prompts.score,undefined);
});
