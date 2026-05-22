import { z } from '../../../deps.js';

export const tradeSchema = z.object({
  trade_id: z.string().uuid(),
  session_id: z.string().uuid(),
  tick: z.number().int().nonnegative(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  aggressor_side: z.enum(['buy', 'sell']),
  buy_order_id: z.string().uuid(),
  sell_order_id: z.string().uuid(),
});

export const tradesSchema = z.array(tradeSchema);
