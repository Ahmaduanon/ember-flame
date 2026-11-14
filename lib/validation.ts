import { z } from 'zod';
export const settingsSchema = z.object({gravity:z.number().finite().min(0).max(2),oxygen:z.number().finite().min(0).max(30),ambient:z.number().finite().min(0).max(100),flow:z.number().finite().min(0.2).max(2),fuel:z.enum(['methane','propane','ethanol'])});
const pointSchema = z.object({time:z.number().finite().min(0),temperature:z.number().finite().min(0).max(10000),release:z.number().finite().min(0).max(10000),loss:z.number().finite().min(0).max(10000),oxygenMass:z.number().finite().min(0),fuelMass:z.number().finite().min(0),size:z.number().finite().min(0)});
export const experimentSchema = z.object({
  title:z.string().trim().min(1).max(80),
  payload:z.object({model:z.literal('EMBER-ROM 0.1'),settings:settingsSchema,initialSettings:settingsSchema,intervention:z.enum(['none','cutoff','dilution','cooling']),points:z.array(pointSchema).min(1).max(1200),events:z.array(z.object({time:z.number().finite().min(0),text:z.string().max(200)})).max(200),status:z.enum(['stable','weak','extinguished'])})
});
export const waitlistSchema = z.object({name:z.string().trim().min(1).max(80),email:z.string().trim().toLowerCase().email().max(120),role:z.enum(['home','business','student','researcher','other']),note:z.string().trim().max(500).optional(),website:z.string().max(200).optional()}).strict();
export const signupSchema = z.object({name:z.string().trim().min(1).max(80),email:z.string().trim().toLowerCase().email().max(120),password:z.string().min(10).max(128)}).strict();
export const loginSchema = z.object({email:z.string().trim().toLowerCase().email().max(120),password:z.string().min(1).max(128)}).strict();
