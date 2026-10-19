// Manual planning workflow inspired by the supplied Claude v0.3 scanner.
// Coordinates are illustrative markers, not measured clearances or a safety score.
import { z } from 'zod';
export const ITEMS=[{id:'stove',label:'Cooker',kind:'heat'},{id:'heater',label:'Heater',kind:'heat'},{id:'candle',label:'Candle',kind:'heat'},{id:'socket',label:'Socket',kind:'electrical'},{id:'strip',label:'Power strip',kind:'electrical'},{id:'charger',label:'Charger',kind:'electrical'},{id:'curtain',label:'Curtain',kind:'combustible'},{id:'sofa',label:'Furniture',kind:'combustible'},{id:'paper',label:'Paper / fabric',kind:'combustible'},{id:'fuel',label:'Fuel storage',kind:'fuel'},{id:'detector',label:'Smoke alarm',kind:'safety'},{id:'exit',label:'Exit',kind:'exit'}] as const;
export const layoutSchema=z.object({width:z.number().min(1).max(30),depth:z.number().min(1).max(30),items:z.array(z.object({id:z.string().min(1).max(50),type:z.enum(ITEMS.map(i=>i.id) as [string,...string[]]),x:z.number().min(0).max(30),y:z.number().min(0).max(30)}).strict()).max(80)}).strict().refine(r=>r.items.every(i=>i.x<=r.width&&i.y<=r.depth)&&new Set(r.items.map(i=>i.id)).size===r.items.length,'Markers must be unique and inside the room.');
export type Layout=z.infer<typeof layoutSchema>;
export type LayoutPrompt={id:string;title:string;detail:string;items:string[]};
export const SAMPLE_LAYOUT:Layout={width:6,depth:4,items:[{id:'a',type:'stove',x:1.1,y:.8},{id:'b',type:'curtain',x:1.6,y:.9},{id:'c',type:'sofa',x:4.3,y:1.5},{id:'d',type:'exit',x:5.4,y:3.4},{id:'e',type:'paper',x:4.9,y:3.1},{id:'f',type:'detector',x:3,y:2}]};
export function reviewLayout(room:Layout):LayoutPrompt[]{
  const result:LayoutPrompt[]=[];
  const def=(type:string)=>ITEMS.find(i=>i.id===type)!;
  for(let a=0;a<room.items.length;a++)for(let b=a+1;b<room.items.length;b++){
    const x=room.items[a],y=room.items[b],dx=def(x.type),dy=def(y.type),kinds=[dx.kind,dy.kind];
    if(Math.hypot(x.x-y.x,x.y-y.y)>Math.min(room.width,room.depth)*.24)continue;
    if(kinds.includes('heat')&&(kinds.includes('combustible')||kinds.includes('fuel')))result.push({id:x.id+'-'+y.id,title:`Review ${dx.label.toLowerCase()} and ${dy.label.toLowerCase()}`,detail:'These markers appear close on your sketch. Verify the actual arrangement and the equipment’s clearance instructions in person; marker distance is not a safety limit.',items:[x.id,y.id]});
    else if(kinds.includes('exit')&&!kinds.includes('safety'))result.push({id:x.id+'-'+y.id,title:'Check the marked exit route',detail:'An object is drawn near an exit. Confirm that the real door and escape route remain unobstructed. This sketch cannot prove an obstruction.',items:[x.id,y.id]});
  }
  if(room.items.length&&!room.items.some(i=>i.type==='detector'))result.push({id:'alarm-check',title:'Add alarm coverage to your review',detail:'No alarm is marked on this sketch. Check the actual building and approved placement guidance; an omitted marker does not establish that an alarm is missing.',items:[]});
  return result;
}
