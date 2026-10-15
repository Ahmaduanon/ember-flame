import { test } from 'node:test';
import assert from 'node:assert/strict';
import { configuration, aiStatus, analyzePhotos, validateAssessment, VISION_PROMPT } from '../server/safety/vision.mjs';
const room={name:'Kitchen',kind:'home',notes:'Visible surfaces only',adjacent:'Bathroom'};
const photos=[{label:'View 1',dataUrl:'data:image/jpeg;base64,VEVTVA=='}];
const assessment={summary:'An observation requires review.',limitations:['A photo cannot reveal hidden wiring.'],follow_up_views:[],findings:[{category:'blocked_exit',priority:'review',photo_index:0,title:'Items in doorway',evidence:'Boxes appear within the door opening.',location:'Left doorway',uncertainty:'Depth and alternate exits cannot be established from this view.'}]};
const response=data=>({ok:true,status:200,json:async()=>data});
test('local configuration rejects remote, credential-bearing and non-origin URLs',()=>{
  for(const url of ['http://example.com','https://localhost','http://user:pass@localhost','http://localhost/path'])assert.throws(()=>configuration({EMBER_OLLAMA_URL:url}));
  assert.equal(configuration({}).provider,'ollama');
  assert.equal(configuration({}).model,'gemma3:4b');
});
test('AI status reports missing local model and never invents readiness',async()=>{
  const absent=await aiStatus({},async()=>response({models:[]}));assert.equal(absent.configured,false);assert.equal(absent.reachable,true);
  const installed=await aiStatus({},async()=>response({models:[{name:'gemma3:4b'}]}));assert.equal(installed.configured,true);
  assert.equal((await aiStatus({},async()=>{throw new Error('offline');})).reachable,false);
});
test('local vision sends actual image payloads with strict output format and validates responses',async()=>{
  let called=false;
  const result=await analyzePhotos(room,photos,{env:{},fetcher:async(url,options)=>{
    called=true;assert.equal(url,'http://127.0.0.1:11434/api/chat');const body=JSON.parse(options.body);
    assert.deepEqual(body.messages[1].images,['VEVTVA==']);assert.equal(body.format.additionalProperties,false);assert.equal(body.stream,false);
    assert.match(body.messages[0].content,/untrusted/);return response({message:{content:JSON.stringify(assessment)}});
  }});
  assert.ok(called);assert.equal(result.provider,'ollama');assert.equal(result.result.findings[0].photo_index,0);
});
test('disabled, unconfigured and unconsented cloud requests make no network calls',async()=>{
  const fetcher=()=>{assert.fail('Unexpected network request');};
  for(const [env,expected] of [[{EMBER_AI_PROVIDER:'disabled'},503],[{EMBER_AI_PROVIDER:'openai'},503],[{EMBER_AI_PROVIDER:'openai',OPENAI_API_KEY:'test-placeholder'},400]]){
    await assert.rejects(analyzePhotos(room,photos,{env,fetcher}),e=>e.status===expected);
  }
  await assert.rejects(analyzePhotos(room,[],{env:{},fetcher}),e=>e.status===400);
});
test('explicit cloud consent uses Responses image input, no stored response and server-only credential',async()=>{
  const result=await analyzePhotos(room,photos,{consent:true,env:{EMBER_AI_PROVIDER:'openai',OPENAI_API_KEY:'test-placeholder',OPENAI_MODEL:'test-vision'},fetcher:async(url,options)=>{
    assert.equal(url,'https://api.openai.com/v1/responses');assert.equal(options.headers.Authorization,'Bearer test-placeholder');const body=JSON.parse(options.body);
    assert.equal(body.model,'test-vision');assert.equal(body.store,false);assert.equal(body.text.format.strict,true);assert.equal(body.input[0].content[1].image_url,photos[0].dataUrl);
    return response({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(assessment)}]}]});
  }});assert.equal(result.provider,'openai');
});
test('malformed, refused, incomplete, out-of-range or provider-failed output cannot become findings',async()=>{
  for(const data of [{message:{content:'not JSON'}},{message:{content:'{"findings":[]}'}}])await assert.rejects(analyzePhotos(room,photos,{env:{},fetcher:async()=>response(data)}),e=>e.status===502);
  for(const data of [{status:'incomplete'},{status:'completed',output:[{content:[{type:'refusal',refusal:'Cannot assess'}]}]}])await assert.rejects(analyzePhotos(room,photos,{consent:true,env:{EMBER_AI_PROVIDER:'openai',OPENAI_API_KEY:'test-placeholder'},fetcher:async()=>response(data)}),e=>e.status===502);
  await assert.rejects(analyzePhotos(room,photos,{env:{},fetcher:async()=>({ok:false,status:429})}),e=>e.status===502);
  await assert.rejects(analyzePhotos(room,photos,{env:{},fetcher:async()=>{throw new Error('offline');}}),e=>e.status===503);
  assert.throws(()=>validateAssessment({...assessment,findings:[{...assessment.findings[0],photo_index:2}]},1),e=>e.status===502);
  assert.throws(()=>validateAssessment({...assessment,findings:[{...assessment.findings[0],uncertainty:''}]},1));
});
test('prompt limits attribution and explicitly rejects adjacency-only inferences',()=>{
  assert.match(VISION_PROMPT,/kitchen and bathroom are adjacent/);assert.match(VISION_PROMPT,/assign blame/);assert.match(VISION_PROMPT,/empty findings array/);
});
