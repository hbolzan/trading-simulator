import { z } from '../../../deps.js';

export const eventTypeSchema = z.enum([
  'SessionCreated',
  'SessionStarted',
  'SessionStopped',
]);

export const eventSchema = z.object({
  event_id: z.string().uuid(),
  event_type: eventTypeSchema,
  session_id: z.string().uuid(),
  tick: z.number().int().nonnegative(),
  occurred_at: z.string().datetime(),
  version: z.literal('v1'),
  payload: z.record(z.string(), z.unknown()),
});
