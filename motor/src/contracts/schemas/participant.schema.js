import { z } from '../../../deps.js';

export const participantTypeSchema = z.enum([
  'retail',
  'institutional',
  'market_maker',
]);

export const participantSchema = z.object({
  participant_id: z.string().uuid(),
  type: participantTypeSchema,
  capital: z.number().positive(),
  activity_level: z.number().min(0).max(1),
});

export const participantsSchema = z.array(participantSchema);
