import { createSession } from './core/application/use-cases/create-session.use-case.js';
import { startSession } from './core/application/use-cases/start-session.use-case.js';
import { stopSession } from './core/application/use-cases/stop-session.use-case.js';
import { runSimulationUseCase } from './core/application/use-cases/run-simulation.use-case.js';
import { renderSessionSummary } from './adapters/inbound/cli/render-session-summary.js';
import { persistEventsAsJsonl } from './adapters/outbound/event-store/file-event-store.js';
import { writeTradesCsv } from './adapters/outbound/projections-store/write-trades-csv.js';
import { writeCandlesCsv } from './adapters/outbound/projections-store/write-candles-csv.js';
import { buildCandlesFromTrades } from './projections/builders/build-candles-from-trades.js';

const created = createSession({
  session_id: crypto.randomUUID(),
  seed: 42,
  max_ticks: 200,
});

const started = startSession(created.session, {
  started_at: new Date().toISOString(),
});

const simulated = runSimulationUseCase(started.session, {
  participantsCount: 60,
  initialPrice: 100,
  tickSize: 0.5,
});

const stopped = stopSession(simulated.session, {
  reason: 'max_ticks_reached',
  stopped_at: new Date().toISOString(),
});

const allEvents = [
  ...created.events,
  ...started.events,
  ...simulated.events,
  ...stopped.events,
];

const outputDirectory = `./output/${stopped.session.session_id}`;
const eventsPath = `${outputDirectory}/events.jsonl`;
const tradesPath = `${outputDirectory}/trades.csv`;
const candlesPath = `${outputDirectory}/candles.csv`;

const candles = buildCandlesFromTrades({
  sessionId: stopped.session.session_id,
  maxTicks: stopped.session.max_ticks,
  timeframeTicks: 10,
  trades: simulated.trades,
  initialPrice: 100,
});

await persistEventsAsJsonl({ events: allEvents, filePath: eventsPath });
await writeTradesCsv({ trades: simulated.trades, filePath: tradesPath });
await writeCandlesCsv({ candles, filePath: candlesPath });

console.log(
  renderSessionSummary(stopped.session, allEvents, {
    ordersCount: simulated.ordersCount,
    tradesCount: simulated.trades.length,
    lastPrice: simulated.lastPrice,
    eventsPath,
    tradesPath,
    candlesPath,
  }),
);
