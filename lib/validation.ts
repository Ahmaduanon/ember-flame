import { z } from 'zod';
export const settingsSchema = z.object({gravity:z.number().finite().min(0).max(2),oxygen:z.number().finite().min(0).max(30),ambient:z.number().finite().min(0).max(100),flow:z.number().finite().min(0.2).max(2),fuel:z.enum(['methane','propane','ethanol'])});
export const sensorSchema = z.object({
  device_id: z.string().min(1).max(64).regex(/^[a-zA-Z0-9_.-]+$/),
  ambient_c: z.number().finite().min(-50).max(150).nullable().optional(),
  oxygen_pct: z.number().finite().min(0).max(100).nullable().optional(),
  acceleration_ms2: z.number().finite().min(0).max(200).nullable().optional(),
  probe_c: z.number().finite().min(-50).max(2000).nullable().optional(),
  pm25_ugm3: z.number().finite().min(0).max(5000).nullable().optional(),
  co_ppm: z.number().finite().min(0).max(1000).nullable().optional(),
  humidity_pct: z.number().finite().min(0).max(100).nullable().optional(),
  battery_pct: z.number().finite().min(0).max(100).nullable().optional(),
  smoke_alarm: z.boolean().optional(),
  co_alarm: z.boolean().optional(),
  sensor_fault: z.boolean().optional(),
  timestamp: z.string().datetime().optional(),
}).strict().refine(x=>[x.ambient_c,x.oxygen_pct,x.acceleration_ms2,x.probe_c,x.pm25_ugm3,x.co_ppm,x.humidity_pct].some(v=>typeof v==='number') || typeof x.smoke_alarm==='boolean' || typeof x.co_alarm==='boolean' || typeof x.sensor_fault==='boolean', 'At least one measurement, alarm contact or fault status is required.');
export type SensorSample = z.infer<typeof sensorSchema>;
export const telemetrySchema = z.object({source:z.enum(['usb','websocket','demo','import']),sample:sensorSchema});
const pointSchema = z.object({time:z.number().finite().min(0),temperature:z.number().finite().min(0).max(10000),release:z.number().finite().min(0).max(10000),loss:z.number().finite().min(0).max(10000),oxygenMass:z.number().finite().min(0),fuelMass:z.number().finite().min(0),size:z.number().finite().min(0)});
export const experimentSchema = z.object({
  title:z.string().trim().min(1).max(80),
  payload:z.object({model:z.literal('EMBER-ROM 0.1'),settings:settingsSchema,initialSettings:settingsSchema,intervention:z.enum(['none','cutoff','dilution','cooling']),points:z.array(pointSchema).min(1).max(1200),events:z.array(z.object({time:z.number().finite().min(0),text:z.string().max(200)})).max(200),status:z.enum(['stable','weak','extinguished'])})
});
