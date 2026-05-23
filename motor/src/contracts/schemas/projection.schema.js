import { z } from '../../../deps.js';

export const tickerSnapshotViewSchema = z.object({
  session_id: z.string().uuid(),
  updated_at_tick: z.number().int().nonnegative(),
  last_price: z.number().positive(),
  best_bid: z.number().positive().nullable(),
  best_ask: z.number().positive().nullable(),
  spread: z.number().nonnegative().nullable(),
  volume_total: z.number().int().nonnegative(),
  trades_total: z.number().int().nonnegative(),
  orders_submitted: z.number().int().nonnegative(),
  orders_rejected: z.number().int().nonnegative(),
});

export const participantPositionViewSchema = z.object({
  session_id: z.string().uuid(),
  participant_id: z.string().uuid(),
  participant_type: z.enum(['retail', 'institutional', 'market_maker']),
  cash: z.number(),
  position: z.number().int(),
  position_value: z.number(),
  equity: z.number(),
  pnl: z.number(),
  updated_at_tick: z.number().int().nonnegative(),
});

export const participantPositionViewsSchema = z.array(participantPositionViewSchema);

export const replaySummarySchema = z.object({
  session_id: z.string().uuid(),
  deterministic_match: z.boolean(),
  compared_metrics: z.object({
    runtime_orders_submitted: z.number().int().nonnegative(),
    replay_orders_submitted: z.number().int().nonnegative(),
    runtime_orders_rejected: z.number().int().nonnegative(),
    replay_orders_rejected: z.number().int().nonnegative(),
    runtime_trades_count: z.number().int().nonnegative(),
    replay_trades_count: z.number().int().nonnegative(),
    runtime_last_price: z.number().positive(),
    replay_last_price: z.number().positive(),
  }),
});
