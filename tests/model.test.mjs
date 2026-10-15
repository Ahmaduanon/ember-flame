import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, FUELS, initialState, step, oxygenCapacity } from '../lib/model.ts';
import { sensorSchema, experimentSchema } from '../lib/validation.ts';
function evolve(p,seconds=60,action='none',dt=.025,s=initialState(p)){for(let i=0;i<Math.round(seconds/dt);i++)s=step(s,p,action,dt);return s;}

test('bounded mass, finite values, and nonnegative temperature across control limits',()=>{
  for(const fuel of Object.keys(FUELS))for(const gravity of [0,.00001,.165,.378,1,2])for(const oxygen of [0,3,20.9,30])for(const ambient of [0,100])for(const flow of [.2,2]){
    const p={fuel,gravity,oxygen,ambient,flow};const s=evolve(p,60);
    for(const [key,v]of Object.entries(s))if(typeof v==='number')assert.ok(Number.isFinite(v)&&v>=0,`${key}, ${JSON.stringify(p)}`);
    assert.ok(s.temperature>=ambient+273.15);assert.ok(s.oxygenMass<=oxygenCapacity(oxygen)+1e-9);
  }
});
test('oxygen-free environment extinguishes; an extinguished state does not self-reignite',()=>{
  const p={...DEFAULTS,oxygen:0};const s=evolve(p,60);assert.equal(s.status,'extinguished');assert.equal(s.rate,0);
  assert.equal(evolve(DEFAULTS,30,'none',.025,s).burning,false);
});
test('fuel cutoff extinguishes and removes reaction heat',()=>{
  const initial=evolve(DEFAULTS,15);assert.equal(initial.burning,true);
  const final=evolve(DEFAULTS,40,'cutoff',.025,initial);assert.equal(final.burning,false);assert.equal(final.release,0);assert.ok(final.fuelMass<1e-8);
});
test('default zero-g combustion remains diffusion-supported but differs from Earth',()=>{
  const micro=evolve({...DEFAULTS,gravity:0});const earth=evolve(DEFAULTS);
  assert.equal(micro.burning,true);assert.ok(micro.temperature<earth.temperature);assert.ok(micro.release<earth.release);
});
test('steady state closes the energy balance; timestep refinement changes temperature by less than 1%',()=>{
  const coarse=evolve(DEFAULTS,60,'none',.025);const fine=evolve(DEFAULTS,60,'none',.00625);
  assert.ok(Math.abs(coarse.release-coarse.loss)<.001);assert.ok(Math.abs(coarse.temperature-fine.temperature)/fine.temperature<.01);
});
test('one step never consumes more reactant than is present',()=>{
  const p={...DEFAULTS,flow:.2};const before={...initialState(p),fuelMass:.00001,oxygenMass:.00001};const after=step(before,p,'none',.025);
  const reacted=after.rate*.025;assert.ok(reacted<=before.fuelMass+p.flow*.025+1e-12);assert.ok(after.fuelMass>=0);assert.ok(after.oxygenMass>=0);
});
test('sensor input rejects malformed or ambiguous measurements',()=>{
  const base={device_id:'esp32-01',ambient_c:25};assert.equal(sensorSchema.safeParse(base).success,true);
  for(const invalid of [{device_id:'x'},{...base,oxygen_pct:101},{...base,ambient_c:'25'},{...base,ambient_c:NaN},{...base,acceleration_ms2:-1},{...base,gravity:0},{...base,device_id:'<script>'}])assert.equal(sensorSchema.safeParse(invalid).success,false);
  assert.equal(sensorSchema.safeParse({...base,probe_c:null}).success,true);
});
test('saved experiments require versioned, bounded model data',()=>{
  assert.equal(experimentSchema.safeParse({title:'test',payload:{}}).success,false);
});
