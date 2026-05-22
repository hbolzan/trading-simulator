import { candlesSchema } from '../../contracts/schemas/candle.schema.js';

const buildRange = ({ from, to, step }) =>
  Array.from(
    { length: Math.ceil((to - from + 1) / step) },
    (_, index) => from + (index * step),
  );

const aggregateWindow = ({
  sessionId,
  startTick,
  endTick,
  timeframeTicks,
  windowTrades,
  previousClose,
}) => {
  const prices = windowTrades.map((trade) => trade.price);
  const open = windowTrades.length > 0 ? prices[0] : previousClose;
  const close = windowTrades.length > 0 ? prices[prices.length - 1] : previousClose;
  const high = windowTrades.length > 0 ? Math.max(...prices) : previousClose;
  const low = windowTrades.length > 0 ? Math.min(...prices) : previousClose;
  const volume = windowTrades.reduce((sum, trade) => sum + trade.quantity, 0);

  return {
    candle_id: crypto.randomUUID(),
    session_id: sessionId,
    start_tick: startTick,
    end_tick: endTick,
    timeframe_ticks: timeframeTicks,
    open,
    high,
    low,
    close,
    volume,
  };
};

export const buildCandlesFromTrades = ({
  sessionId,
  maxTicks,
  timeframeTicks,
  trades,
  initialPrice,
}) => {
  const starts = buildRange({
    from: 1,
    to: maxTicks,
    step: timeframeTicks,
  });

  const built = starts.reduce(
    (accumulator, startTick) => {
      const endTick = Math.min(maxTicks, startTick + timeframeTicks - 1);
      const windowTrades = trades.filter((trade) =>
        trade.tick >= startTick && trade.tick <= endTick
      );

      const candle = aggregateWindow({
        sessionId,
        startTick,
        endTick,
        timeframeTicks,
        windowTrades,
        previousClose: accumulator.previousClose,
      });

      return {
        previousClose: candle.close,
        candles: [...accumulator.candles, candle],
      };
    },
    { previousClose: initialPrice, candles: [] },
  );

  return candlesSchema.parse(built.candles);
};
