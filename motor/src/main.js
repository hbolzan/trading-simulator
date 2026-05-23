import { createSession } from './core/application/use-cases/create-session.use-case.js';
import { startSession } from './core/application/use-cases/start-session.use-case.js';
import { stopSession } from './core/application/use-cases/stop-session.use-case.js';
import { runSimulationUseCase } from './core/application/use-cases/run-simulation.use-case.js';
import { renderSessionSummary } from './adapters/inbound/cli/render-session-summary.js';
import { createPersistenceAdapter } from './adapters/outbound/persistence/create-persistence-adapter.js';
import { writeViewerHtml } from './adapters/outbound/projections-store/write-viewer-html.js';
import { writeJsonFile } from './adapters/outbound/projections-store/write-json-file.js';
import { buildCandlesFromTrades } from './projections/builders/build-candles-from-trades.js';
import { buildTickerSnapshotView } from './projections/builders/build-ticker-snapshot-view.js';
import { buildParticipantPositionViews } from './projections/builders/build-participant-position-views.js';
import { buildReplaySummary } from './projections/builders/build-replay-summary.js';

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

const tickerSnapshot = buildTickerSnapshotView({
  session: stopped.session,
  events: allEvents,
  trades: simulated.trades,
  book: simulated.book,
});

const participantPositionViews = buildParticipantPositionViews({
  session: stopped.session,
  participants: simulated.participants,
  participantLedger: simulated.participantLedger,
  lastPrice: simulated.lastPrice,
});

const replay = buildReplaySummary({
  session: stopped.session,
  events: allEvents,
  runtimeMetrics: {
    orders_submitted: simulated.ordersCount,
    orders_rejected: simulated.rejectedOrdersCount,
    trades_count: simulated.trades.length,
    last_price: simulated.lastPrice,
  },
  initialPrice: 100,
  timeframeTicks: 10,
});

const persisted = await persistenceAdapter.persist({
  sessionId: stopped.session.session_id,
  events: allEvents,
  trades: simulated.trades,
  candles,
});

const viewerPath = `./output/${stopped.session.session_id}/viewer.html`;
const tickerSnapshotPath = `./output/${stopped.session.session_id}/ticker-snapshot.json`;
const positionsPath = `./output/${stopped.session.session_id}/positions.json`;
const replaySummaryPath = `./output/${stopped.session.session_id}/replay-summary.json`;

await writeViewerHtml({
  session: stopped.session,
  candles,
  ordersCount: simulated.ordersCount,
  rejectedOrdersCount: simulated.rejectedOrdersCount,
  tradesCount: simulated.trades.length,
  filePath: viewerPath,
});

await writeJsonFile({
  value: tickerSnapshot,
  filePath: tickerSnapshotPath,
});

await writeJsonFile({
  value: participantPositionViews,
  filePath: positionsPath,
});

await writeJsonFile({
  value: replay.replaySummary,
  filePath: replaySummaryPath,
});

console.log(
  renderSessionSummary(stopped.session, allEvents, {
    ordersCount: simulated.ordersCount,
    rejectedOrdersCount: simulated.rejectedOrdersCount,
    tradesCount: simulated.trades.length,
    lastPrice: simulated.lastPrice,
    eventsPath: persisted.eventsPath,
    tradesPath: persisted.tradesPath,
    candlesPath: persisted.candlesPath,
    viewerPath,
    tickerSnapshotPath,
    positionsPath,
    replaySummaryPath,
    replayDeterministicMatch: replay.replaySummary.deterministic_match,
  }),
);
