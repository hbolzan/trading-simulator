import { assertEquals } from '../../deps.js';
import { createSession } from '../../src/core/application/use-cases/create-session.use-case.js';
import { startSession } from '../../src/core/application/use-cases/start-session.use-case.js';
import { runSimulationUseCase } from '../../src/core/application/use-cases/run-simulation.use-case.js';

const runDeterministicSimulation = () => {
  const created = createSession({
    session_id: crypto.randomUUID(),
    seed: 99,
    max_ticks: 50,
  });

  const started = startSession(created.session, {
    started_at: new Date().toISOString(),
  });

  return runSimulationUseCase(started.session, {
    participantsCount: 30,
    initialPrice: 100,
    tickSize: 0.5,
  });
};

Deno.test('simulation with same seed must produce stable metrics', () => {
  const firstRun = runDeterministicSimulation();
  const secondRun = runDeterministicSimulation();

  assertEquals(firstRun.ordersCount, secondRun.ordersCount);
  assertEquals(firstRun.trades.length, secondRun.trades.length);
  assertEquals(firstRun.lastPrice, secondRun.lastPrice);
  assertEquals(firstRun.session.tick, secondRun.session.tick);
  assertEquals(firstRun.rejectedOrdersCount, secondRun.rejectedOrdersCount);
  assertEquals(firstRun.accountingConsistent, true);
  assertEquals(secondRun.accountingConsistent, true);
});
