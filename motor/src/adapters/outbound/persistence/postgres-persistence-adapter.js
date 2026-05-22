import { Client } from 'jsr:@db/postgres@0.19.4';

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
  for (const event of events) {
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
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
        ON CONFLICT (event_id) DO NOTHING
      `,
      event.event_id,
      event.session_id,
      event.event_type,
      event.tick,
      event.occurred_at,
      event.version,
      JSON.stringify(event.payload),
    );
  }
};

const persistTrades = async ({ client, trades }) => {
  for (const trade of trades) {
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
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (trade_id) DO NOTHING
      `,
      trade.trade_id,
      trade.session_id,
      trade.tick,
      trade.price,
      trade.quantity,
      trade.aggressor_side,
      trade.buy_order_id,
      trade.sell_order_id,
    );
  }
};

const persistCandles = async ({ client, candles }) => {
  for (const candle of candles) {
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
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (candle_id) DO NOTHING
      `,
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
      await persistEvents({ client, events });
      await persistTrades({ client, trades });
      await persistCandles({ client, candles });
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
