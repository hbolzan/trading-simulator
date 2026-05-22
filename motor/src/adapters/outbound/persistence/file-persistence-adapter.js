import { persistEventsAsJsonl } from '../event-store/file-event-store.js';
import { writeTradesCsv } from '../projections-store/write-trades-csv.js';
import { writeCandlesCsv } from '../projections-store/write-candles-csv.js';

export const createFilePersistenceAdapter = () => ({
  mode: 'file',
  persist: async ({ sessionId, events, trades, candles }) => {
    const outputDirectory = `./output/${sessionId}`;
    const eventsPath = `${outputDirectory}/events.jsonl`;
    const tradesPath = `${outputDirectory}/trades.csv`;
    const candlesPath = `${outputDirectory}/candles.csv`;

    await persistEventsAsJsonl({ events, filePath: eventsPath });
    await writeTradesCsv({ trades, filePath: tradesPath });
    await writeCandlesCsv({ candles, filePath: candlesPath });

    return {
      eventsPath,
      tradesPath,
      candlesPath,
    };
  },
});
