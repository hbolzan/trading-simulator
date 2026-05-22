import { createSession } from './core/application/use-cases/create-session.use-case.js';
import { startSession } from './core/application/use-cases/start-session.use-case.js';
import { stopSession } from './core/application/use-cases/stop-session.use-case.js';
import { runSimulationUseCase } from './core/application/use-cases/run-simulation.use-case.js';
import { renderSessionSummary } from './adapters/inbound/cli/render-session-summary.js';
import { createPersistenceAdapter } from './adapters/outbound/persistence/create-persistence-adapter.js';
import { buildCandlesFromTrades } from './projections/builders/build-candles-from-trades.js';

const persistenceMode = Deno.env.get('PERSISTENCE_MODE') ?? 'file';
const databaseUrl = Deno.env.get('DATABASE_URL') ?? '';

const persistenceAdapter = createPersistenceAdapter({
  mode: persistenceMode,
  databaseUrl,
});

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

const candles = buildCandlesFromTrades({
  sessionId: stopped.session.session_id,
  maxTicks: stopped.session.max_ticks,
  timeframeTicks: 10,
  trades: simulated.trades,
  initialPrice: 100,
});

const persisted = await persistenceAdapter.persist({
  sessionId: stopped.session.session_id,
  events: allEvents,
  trades: simulated.trades,
  candles,
});

console.log(
  renderSessionSummary(stopped.session, allEvents, {
    ordersCount: simulated.ordersCount,
    tradesCount: simulated.trades.length,
    lastPrice: simulated.lastPrice,
    eventsPath: persisted.eventsPath,
    tradesPath: persisted.tradesPath,
    candlesPath: persisted.candlesPath,
  }),
);
