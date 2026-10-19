import { z } from 'zod';
export const usagePolicySchema=z.object({cloudEnabled:z.boolean(),dailyLimit:z.number().int().min(0).max(100),monthlyLimit:z.number().int().min(0).max(1000),maxPhotos:z.number().int().min(1).max(4),cooldownSeconds:z.number().int().min(10).max(3600)}).strict();
export const DEFAULT_POLICY={cloudEnabled:false,dailyLimit:2,monthlyLimit:10,maxPhotos:2,cooldownSeconds:60};
export type UsagePolicy=z.infer<typeof usagePolicySchema>;
export type UsageStatus={policy:UsagePolicy;day:string;month:string;today:number;thisMonth:number;localAttempts:number;recent:{at:number;provider:string;status:string}[]};
