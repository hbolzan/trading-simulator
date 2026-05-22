import { Client } from 'jsr:@db/postgres@0.19.4';

const BATCH_SIZE = 500;

const chunkItems = (items, chunkSize) =>
  Array.from(
    { length: Math.ceil(items.length / chunkSize) },
    (_, index) => items.slice(index * chunkSize, (index + 1) * chunkSize),
  );

const ensureSchema = async (client) => {
  await client.queryArray(`
    CREATE TABLE IF NOT EXISTS simulation_events (
      event_id UUID PRIMARY KEY,
      session_id UUID NOT NULL,
      event_type TEXT NOT NULL,
      tick INTEGER NOT NULL,
      occurred_at TIMESTAMPTZ NOT NULL,
      version TEXT NOT NULL,
      payload JSONB NOT NULL
    )
  `);

  await client.queryArray(`
    CREATE TABLE IF NOT EXISTS simulation_trades (
      trade_id UUID PRIMARY KEY,
      session_id UUID NOT NULL,
      tick INTEGER NOT NULL,
      price NUMERIC(18,6) NOT NULL,
      quantity INTEGER NOT NULL,
      aggressor_side TEXT NOT NULL,
      buy_order_id UUID NOT NULL,
      sell_order_id UUID NOT NULL
    )
  `);

  await client.queryArray(`
    CREATE TABLE IF NOT EXISTS simulation_candles (
      candle_id UUID PRIMARY KEY,
      session_id UUID NOT NULL,
      start_tick INTEGER NOT NULL,
      end_tick INTEGER NOT NULL,
      timeframe_ticks INTEGER NOT NULL,
      open NUMERIC(18,6) NOT NULL,
      high NUMERIC(18,6) NOT NULL,
      low NUMERIC(18,6) NOT NULL,
      close NUMERIC(18,6) NOT NULL,
      volume INTEGER NOT NULL
    )
  `);
};

const persistEvents = async ({ client, events }) => {
  const batches = chunkItems(events, BATCH_SIZE);

  for (const batch of batches) {
    const placeholders = batch
      .map(
        (_, index) =>
          `($${(index * 7) + 1}, $${(index * 7) + 2}, $${(index * 7) + 3}, $${(index * 7) + 4}, $${
            (index * 7) + 5
          }, $${(index * 7) + 6}, $${(index * 7) + 7}::jsonb)`,
      )
      .join(', ');

    const values = batch.flatMap((event) => [
      event.event_id,
      event.session_id,
      event.event_type,
      event.tick,
      event.occurred_at,
      event.version,
      JSON.stringify(event.payload),
    ]);

    await client.queryArray(
      `
        INSERT INTO simulation_events (
          event_id,
          session_id,
          event_type,
          tick,
          occurred_at,
          version,
          payload
        )
        VALUES ${placeholders}
        ON CONFLICT (event_id) DO NOTHING
      `,
      values,
    );
  }
};

const persistTrades = async ({ client, trades }) => {
  const batches = chunkItems(trades, BATCH_SIZE);

  for (const batch of batches) {
    const placeholders = batch
      .map(
        (_, index) =>
          `($${(index * 8) + 1}, $${(index * 8) + 2}, $${(index * 8) + 3}, $${(index * 8) + 4}, $${
            (index * 8) + 5
          }, $${(index * 8) + 6}, $${(index * 8) + 7}, $${(index * 8) + 8})`,
      )
      .join(', ');

    const values = batch.flatMap((trade) => [
      trade.trade_id,
      trade.session_id,
      trade.tick,
      trade.price,
      trade.quantity,
      trade.aggressor_side,
      trade.buy_order_id,
      trade.sell_order_id,
    ]);

    await client.queryArray(
      `
        INSERT INTO simulation_trades (
          trade_id,
          session_id,
          tick,
          price,
          quantity,
          aggressor_side,
          buy_order_id,
          sell_order_id
        )
        VALUES ${placeholders}
        ON CONFLICT (trade_id) DO NOTHING
      `,
      values,
    );
  }
};

const persistCandles = async ({ client, candles }) => {
  const batches = chunkItems(candles, BATCH_SIZE);

  for (const batch of batches) {
    const placeholders = batch
      .map(
        (_, index) =>
          `($${(index * 10) + 1}, $${(index * 10) + 2}, $${(index * 10) + 3}, $${
            (index * 10) + 4
          }, $${(index * 10) + 5}, $${(index * 10) + 6}, $${(index * 10) + 7}, $${
            (index * 10) + 8
          }, $${(index * 10) + 9}, $${(index * 10) + 10})`,
      )
      .join(', ');

    const values = batch.flatMap((candle) => [
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
    ]);

    await client.queryArray(
      `
        INSERT INTO simulation_candles (
          candle_id,
          session_id,
          start_tick,
          end_tick,
          timeframe_ticks,
          open,
          high,
          low,
          close,
          volume
        )
        VALUES ${placeholders}
        ON CONFLICT (candle_id) DO NOTHING
      `,
      values,
    );
  }
};

export const createPostgresPersistenceAdapter = ({ databaseUrl }) => ({
  mode: 'postgres',
  persist: async ({ events, trades, candles }) => {
    const client = new Client(databaseUrl);

    await client.connect();

    try {
      await ensureSchema(client);
      await client.queryArray('BEGIN');
      await persistEvents({ client, events });
      await persistTrades({ client, trades });
      await persistCandles({ client, candles });
      await client.queryArray('COMMIT');
    } catch (error) {
      await client.queryArray('ROLLBACK');
      throw error;
    } finally {
      await client.end();
    }

    return {
      eventsPath: 'postgres://simulation_events',
      tradesPath: 'postgres://simulation_trades',
      candlesPath: 'postgres://simulation_candles',
    };
  },
});
