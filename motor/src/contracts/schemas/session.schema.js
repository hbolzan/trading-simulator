import { z } from '../../../deps.js';

export const sessionStatusSchema = z.enum(['CREATED', 'RUNNING', 'STOPPED']);

export const sessionSchema = z.object({
  session_id: z.string().uuid(),
  status: sessionStatusSchema,
  seed: z.number().int().nonnegative(),
  tick: z.number().int().nonnegative(),
  max_ticks: z.number().int().positive(),
  started_at: z.string().datetime().nullable(),
  stopped_at: z.string().datetime().nullable(),
});

export const createSessionCommandSchema = z.object({
  session_id: z.string().uuid(),
  seed: z.number().int().nonnegative(),
  max_ticks: z.number().int().positive(),
});

export const startSessionCommandSchema = z.object({
  started_at: z.string().datetime(),
});

export const stopSessionCommandSchema = z.object({
  reason: z.string().min(1),
  stopped_at: z.string().datetime(),
});
