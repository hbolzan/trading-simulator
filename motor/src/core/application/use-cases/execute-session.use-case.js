import { createSession } from './create-session.use-case.js';
import { startSession } from './start-session.use-case.js';
import { runSimulationUseCase } from './run-simulation.use-case.js';
import { stopSession } from './stop-session.use-case.js';
import { buildCandlesFromTrades } from '../../../projections/builders/build-candles-from-trades.js';
import { buildTickerSnapshotView } from '../../../projections/builders/build-ticker-snapshot-view.js';
import { buildParticipantPositionViews } from '../../../projections/builders/build-participant-position-views.js';
import { buildReplaySummary } from '../../../projections/builders/build-replay-summary.js';
import { writeViewerHtml } from '../../../adapters/outbound/projections-store/write-viewer-html.js';
import { writeJsonFile } from '../../../adapters/outbound/projections-store/write-json-file.js';

export const executeSession = async ({
  simulationConfig,
  persistenceAdapter,
  startedAt,
  stoppedAt,
  viewerOutputDirectory = './output',
}) => {
  const created = createSession({
    session_id: crypto.randomUUID(),
    seed: simulationConfig.seed ?? 42,
    max_ticks: simulationConfig.maxTicks ?? 200,
  });

  const started = startSession(created.session, {
    started_at: startedAt,
  });

  const simulated = runSimulationUseCase(started.session, {
    participantsCount: simulationConfig.participantsCount ?? 60,
    initialPrice: simulationConfig.initialPrice ?? 100,
    tickSize: simulationConfig.tickSize ?? 0.5,
  });

  const stopped = stopSession(simulated.session, {
    reason: 'max_ticks_reached',
    stopped_at: stoppedAt,
  });

  const events = [...created.events, ...started.events, ...simulated.events, ...stopped.events];

  const timeframeTicks = simulationConfig.timeframeTicks ?? 10;
  const initialPrice = simulationConfig.initialPrice ?? 100;

  const candles = buildCandlesFromTrades({
    sessionId: stopped.session.session_id,
    maxTicks: stopped.session.max_ticks,
    timeframeTicks,
    trades: simulated.trades,
    initialPrice,
  });

  const tickerSnapshot = buildTickerSnapshotView({
    session: stopped.session,
    events,
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
    events,
    runtimeMetrics: {
      orders_submitted: simulated.ordersCount,
      orders_rejected: simulated.rejectedOrdersCount,
      trades_count: simulated.trades.length,
      last_price: simulated.lastPrice,
    },
    initialPrice,
    timeframeTicks,
  });

  const persistence = await persistenceAdapter.persist({
    sessionId: stopped.session.session_id,
    events,
    trades: simulated.trades,
    candles,
  });

  const outputDirectory = `${viewerOutputDirectory}/${stopped.session.session_id}`;
  const viewerPath = `${outputDirectory}/viewer.html`;
  const tickerSnapshotPath = `${outputDirectory}/ticker-snapshot.json`;
  const positionsPath = `${outputDirectory}/positions.json`;
  const replaySummaryPath = `${outputDirectory}/replay-summary.json`;

  await writeViewerHtml({
    session: stopped.session,
    candles,
    ordersCount: simulated.ordersCount,
    rejectedOrdersCount: simulated.rejectedOrdersCount,
    tradesCount: simulated.trades.length,
    filePath: viewerPath,
  });

  await writeJsonFile({ value: tickerSnapshot, filePath: tickerSnapshotPath });
  await writeJsonFile({ value: participantPositionViews, filePath: positionsPath });
  await writeJsonFile({ value: replay.replaySummary, filePath: replaySummaryPath });

  return {
    session: stopped.session,
    events,
    trades: simulated.trades,
    candles,
    tickerSnapshot,
    participantPositionViews,
    replaySummary: replay.replaySummary,
    metrics: {
      orders_submitted: simulated.ordersCount,
      orders_rejected: simulated.rejectedOrdersCount,
      trades_count: simulated.trades.length,
      last_price: simulated.lastPrice,
    },
    paths: {
      eventsPath: persistence.eventsPath,
      tradesPath: persistence.tradesPath,
      candlesPath: persistence.candlesPath,
      viewerPath,
      tickerSnapshotPath,
      positionsPath,
      replaySummaryPath,
    },
  };
};
