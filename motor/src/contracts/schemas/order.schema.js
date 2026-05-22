import { z } from '../../../deps.js';

export const orderSideSchema = z.enum(['buy', 'sell']);

export const orderSchema = z.object({
  order_id: z.string().uuid(),
  session_id: z.string().uuid(),
  participant_id: z.string().uuid(),
  tick: z.number().int().nonnegative(),
  side: orderSideSchema,
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  remaining_quantity: z.number().int().positive(),
  sequence: z.number().int().nonnegative(),
});

export const bookStateSchema = z.object({
  bids: z.array(orderSchema),
  asks: z.array(orderSchema),
  last_price: z.number().positive(),
});
