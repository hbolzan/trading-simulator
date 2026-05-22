import { z } from '../../../deps.js';

export const candleSchema = z.object({
  candle_id: z.string().uuid(),
  session_id: z.string().uuid(),
  start_tick: z.number().int().nonnegative(),
  end_tick: z.number().int().nonnegative(),
  timeframe_ticks: z.number().int().positive(),
  open: z.number().positive(),
  high: z.number().positive(),
  low: z.number().positive(),
  close: z.number().positive(),
  volume: z.number().int().nonnegative(),
});

export const candlesSchema = z.array(candleSchema);
