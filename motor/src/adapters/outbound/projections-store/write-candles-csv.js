import { dirname } from 'jsr:@std/path@1.0.8';

const candleToCsvLine = (candle) =>
  [
    candle.candle_id,
    candle.session_id,
    candle.start_tick,
    candle.end_tick,
    candle.timeframe_ticks,
    candle.open,
    candle.high,
    candle.low,
    candle.close,
    candle.volume,
  ].join(',');

export const writeCandlesCsv = async ({ candles, filePath }) => {
  const header = [
    'candle_id',
    'session_id',
    'start_tick',
    'end_tick',
    'timeframe_ticks',
    'open',
    'high',
    'low',
    'close',
    'volume',
  ].join(',');

  const lines = candles.map(candleToCsvLine);
  const content = [header, ...lines].join('\n');

  await Deno.mkdir(dirname(filePath), { recursive: true });
  await Deno.writeTextFile(filePath, content);
};
