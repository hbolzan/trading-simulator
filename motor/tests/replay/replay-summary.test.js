import { assertEquals } from '../../deps.js';
import { createSession } from '../../src/core/application/use-cases/create-session.use-case.js';
import { startSession } from '../../src/core/application/use-cases/start-session.use-case.js';
import { runSimulationUseCase } from '../../src/core/application/use-cases/run-simulation.use-case.js';
import { stopSession } from '../../src/core/application/use-cases/stop-session.use-case.js';
import { buildReplaySummary } from '../../src/projections/builders/build-replay-summary.js';

Deno.test('replay summary should match runtime deterministic metrics', () => {
  const created = createSession({
    session_id: crypto.randomUUID(),
    seed: 42,
    max_ticks: 120,
  });

  const started = startSession(created.session, {
    started_at: new Date().toISOString(),
  });

  const simulated = runSimulationUseCase(started.session, {
    participantsCount: 40,
    initialPrice: 100,
    tickSize: 0.5,
  });

  const stopped = stopSession(simulated.session, {
    reason: 'test_stop',
    stopped_at: new Date().toISOString(),
  });

  const allEvents = [...created.events, ...started.events, ...simulated.events, ...stopped.events];

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

  assertEquals(replay.replaySummary.deterministic_match, true);
  assertEquals(
    replay.replaySummary.compared_metrics.runtime_orders_submitted,
    simulated.ordersCount,
  );
  assertEquals(replay.replaySummary.compared_metrics.runtime_trades_count, simulated.trades.length);
});
