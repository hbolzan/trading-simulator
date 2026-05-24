import { renderSessionSummary } from './adapters/inbound/cli/render-session-summary.js';
import { createPersistenceAdapter } from './adapters/outbound/persistence/create-persistence-adapter.js';
import { executeSession } from './core/application/use-cases/execute-session.use-case.js';

const persistenceMode = Deno.env.get('PERSISTENCE_MODE') ?? 'file';
const databaseUrl = Deno.env.get('DATABASE_URL') ?? '';

const persistenceAdapter = createPersistenceAdapter({
  mode: persistenceMode,
  databaseUrl,
});

const result = await executeSession({
  simulationConfig: {
    seed: 42,
    maxTicks: 200,
    participantsCount: 60,
    initialPrice: 100,
    tickSize: 0.5,
    timeframeTicks: 10,
  },
  persistenceAdapter,
  startedAt: new Date().toISOString(),
  stoppedAt: new Date().toISOString(),
});

console.log(
  renderSessionSummary(result.session, result.events, {
    ordersCount: result.metrics.orders_submitted,
    rejectedOrdersCount: result.metrics.orders_rejected,
    tradesCount: result.metrics.trades_count,
    lastPrice: result.metrics.last_price,
    eventsPath: result.paths.eventsPath,
    tradesPath: result.paths.tradesPath,
    candlesPath: result.paths.candlesPath,
    viewerPath: result.paths.viewerPath,
    tickerSnapshotPath: result.paths.tickerSnapshotPath,
    positionsPath: result.paths.positionsPath,
    replaySummaryPath: result.paths.replaySummaryPath,
    replayDeterministicMatch: result.replaySummary.deterministic_match,
  }),
);
