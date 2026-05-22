import { dirname } from 'jsr:@std/path@1.0.8';

const tradeToCsvLine = (trade) =>
  [
    trade.trade_id,
    trade.session_id,
    trade.tick,
    trade.price,
    trade.quantity,
    trade.aggressor_side,
    trade.buy_order_id,
    trade.sell_order_id,
  ].join(',');

export const writeTradesCsv = async ({ trades, filePath }) => {
  const header = [
    'trade_id',
    'session_id',
    'tick',
    'price',
    'quantity',
    'aggressor_side',
    'buy_order_id',
    'sell_order_id',
  ].join(',');

  const lines = trades.map(tradeToCsvLine);
  const content = [header, ...lines].join('\n');

  await Deno.mkdir(dirname(filePath), { recursive: true });
  await Deno.writeTextFile(filePath, content);
};
