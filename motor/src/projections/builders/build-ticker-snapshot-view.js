import { tickerSnapshotViewSchema } from '../../contracts/schemas/projection.schema.js';

const countEvents = (events, eventType) =>
  events.filter((event) => event.event_type === eventType).length;

export const buildTickerSnapshotView = ({ session, events, trades, book }) => {
  const bestBid = book.bids.length > 0 ? book.bids[0].price : null;
  const bestAsk = book.asks.length > 0 ? book.asks[0].price : null;
  const spread = bestBid !== null && bestAsk !== null
    ? Number((bestAsk - bestBid).toFixed(6))
    : null;

  const view = {
    session_id: session.session_id,
    updated_at_tick: session.tick,
    last_price: book.last_price,
    best_bid: bestBid,
    best_ask: bestAsk,
    spread,
    volume_total: trades.reduce((sum, trade) => sum + trade.quantity, 0),
    trades_total: trades.length,
    orders_submitted: countEvents(events, 'OrderSubmitted'),
    orders_rejected: countEvents(events, 'OrderRejected'),
  };

  return tickerSnapshotViewSchema.parse(view);
};
