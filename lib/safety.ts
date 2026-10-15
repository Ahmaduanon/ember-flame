import { z } from 'zod';

export const CATEGORIES = {
  combustibles_heat: {name:'Combustibles near heat',action:'When there is no emergency and equipment is off and cool, keep combustible items clear of heat sources and follow the appliance clearance instructions.'},
  electrical_damage: {name:'Possible electrical damage',action:'Have a qualified electrician inspect the equipment or outlet. Do not open, repair, touch or keep using visibly damaged electrical equipment.'},
  power_strip_chain: {name:'Power-strip / cord arrangement',action:'Have the electrical arrangement reviewed. Avoid chaining power strips and do not use extension cords for major appliances; follow manufacturer instructions.'},
  blocked_exit: {name:'Obstructed exit route',action:'Keep escape routes and doors accessible. Agree an evacuation plan with the building occupants or manager.'},
  cooking: {name:'Cooking-area concern',action:'Keep combustible objects away from cooking equipment and supervise cooking. Review the layout with the building manager where appropriate.'},
  battery_charging: {name:'Charging-area concern',action:'Follow device and charger instructions, keep charging equipment uncovered and away from combustible materials, and have damaged batteries assessed by a qualified professional.'},
  other_visible: {name:'Other visible concern',action:'Arrange an in-person review by a qualified fire-safety professional. A photo alone cannot establish the hazard or the appropriate technical repair.'},
} as const;
export const categoryKeys=Object.keys(CATEGORIES) as [keyof typeof CATEGORIES,...(keyof typeof CATEGORIES)[]];
export const roomSchema=z.object({building:z.string().trim().min(1).max(80),kind:z.enum(['home','commercial','other']),name:z.string().trim().min(1).max(80),floor:z.string().max(40),notes:z.string().max(1000),adjacent:z.string().max(200)}).strict();
export const photoSchema=z.object({roomId:z.string().uuid(),label:z.string().trim().min(1).max(80),dataUrl:z.string().max(3000000).regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/)}).strict();
export const findingSchema=z.object({roomId:z.string().uuid(),photoId:z.string().uuid().nullable(),category:z.enum(categoryKeys),priority:z.enum(['review','urgent_review']),title:z.string().trim().min(1).max(120),evidence:z.string().trim().min(1).max(700),location:z.string().trim().min(1).max(200),uncertainty:z.string().max(500)}).strict();
export const reviewSchema=z.object({id:z.string().uuid(),status:z.enum(['unreviewed','confirmed','resolved','dismissed']),note:z.string().trim().min(3).max(1000)}).strict();
export const deviceSchema=z.object({id:z.string().min(1).max(64).regex(/^[a-zA-Z0-9_.-]+$/),name:z.string().trim().min(1).max(80),roomId:z.string().uuid()}).strict();
export const assessmentSchema=z.object({summary:z.string().max(1500),limitations:z.array(z.string().max(500)).max(12),follow_up_views:z.array(z.string().max(300)).max(10),findings:z.array(z.object({category:z.enum(categoryKeys),priority:z.enum(['review','urgent_review']),photo_index:z.number().int().min(0).max(3),title:z.string().max(120),evidence:z.string().min(1).max(700),location:z.string().min(1).max(200),uncertainty:z.string().min(1).max(500)}).strict()).max(16)}).strict();
export const assessmentJsonSchema={type:'object',additionalProperties:false,required:['summary','limitations','follow_up_views','findings'],properties:{summary:{type:'string'},limitations:{type:'array',items:{type:'string'}},follow_up_views:{type:'array',items:{type:'string'}},findings:{type:'array',items:{type:'object',additionalProperties:false,required:['category','priority','photo_index','title','evidence','location','uncertainty'],properties:{category:{type:'string',enum:categoryKeys},priority:{type:'string',enum:['review','urgent_review']},photo_index:{type:'integer'},title:{type:'string'},evidence:{type:'string'},location:{type:'string'},uncertainty:{type:'string'}}}}}};
export type Room=z.infer<typeof roomSchema>&{id:string;createdAt:number};
export type Photo={id:string;roomId:string;label:string;createdAt:number;dataUrl:string};
export type Finding=z.infer<typeof findingSchema>&{id:string;source:string;status:'unreviewed'|'confirmed'|'resolved'|'dismissed';reviewNote:string;action:string;createdAt:number;assessmentId:string|null};
export type Assessment={id:string;roomId:string;createdAt:number;provider:string;model:string;result:z.infer<typeof assessmentSchema>};
export type Device={id:string;name:string;roomId:string;createdAt:number;lastSeen:number|null;lastSample:Record<string,unknown>|null;state:string;details:string[]};
export type Incident={id:string;deviceId:string;roomId:string;level:string;source:string;title:string;openedAt:number;lastAt:number;status:'open'|'acknowledged'|'closed';note:string;details:string[];evidence:Record<string,unknown>;related:Finding[];events:{at:number;text:string}[]};
export type SafetyState={rooms:Room[];devices:Device[];incidents:Incident[];findings:Finding[];assessments:Assessment[];photoCounts:Record<string,number>;at:number;ruleVersion:string};
export type AIStatus={provider:'ollama'|'openai'|'disabled';model:string;configured:boolean;reachable:boolean;message:string;external:boolean};
