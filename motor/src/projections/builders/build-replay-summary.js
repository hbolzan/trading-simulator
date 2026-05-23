import { replaySummarySchema } from '../../contracts/schemas/projection.schema.js';
import { buildCandlesFromTrades } from './build-candles-from-trades.js';

const countEvents = (events, eventType) =>
  events.filter((event) => event.event_type === eventType).length;

const extractReplayTrades = (events) =>
  events
    .filter((event) => event.event_type === 'TradeExecuted')
    .map((event) => ({
      tick: event.tick,
      price: Number(event.payload.price),
      quantity: Number(event.payload.quantity),
    }));

export const buildReplaySummary = ({
  session,
  events,
  runtimeMetrics,
  initialPrice,
  timeframeTicks,
}) => {
  const replayTrades = extractReplayTrades(events);

  const replayCandles = buildCandlesFromTrades({
    sessionId: session.session_id,
    maxTicks: session.max_ticks,
    timeframeTicks,
    trades: replayTrades,
    initialPrice,
  });

  const replayOrdersSubmitted = countEvents(events, 'OrderSubmitted');
  const replayOrdersRejected = countEvents(events, 'OrderRejected');
  const replayTradesCount = replayTrades.length;
  const replayLastPrice = replayTradesCount > 0
    ? replayTrades[replayTradesCount - 1].price
    : initialPrice;

  const deterministicMatch = runtimeMetrics.orders_submitted === replayOrdersSubmitted &&
    runtimeMetrics.orders_rejected === replayOrdersRejected &&
    runtimeMetrics.trades_count === replayTradesCount &&
    Number(runtimeMetrics.last_price.toFixed(6)) === Number(replayLastPrice.toFixed(6));

  return {
    replaySummary: replaySummarySchema.parse({
      session_id: session.session_id,
      deterministic_match: deterministicMatch,
      compared_metrics: {
        runtime_orders_submitted: runtimeMetrics.orders_submitted,
        replay_orders_submitted: replayOrdersSubmitted,
        runtime_orders_rejected: runtimeMetrics.orders_rejected,
        replay_orders_rejected: replayOrdersRejected,
        runtime_trades_count: runtimeMetrics.trades_count,
        replay_trades_count: replayTradesCount,
        runtime_last_price: runtimeMetrics.last_price,
        replay_last_price: replayLastPrice,
      },
    }),
    replayCandles,
  };
};
