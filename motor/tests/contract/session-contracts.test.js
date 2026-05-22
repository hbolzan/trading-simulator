import { assertEquals, assertExists } from '../../deps.js';
import {
  createSessionCommandSchema,
  sessionSchema,
  startSessionCommandSchema,
  stopSessionCommandSchema,
} from '../../src/contracts/schemas/session.schema.js';
import { eventSchema } from '../../src/contracts/schemas/event.schema.js';
import { createSession } from '../../src/core/application/use-cases/create-session.use-case.js';
import { startSession } from '../../src/core/application/use-cases/start-session.use-case.js';
import { stopSession } from '../../src/core/application/use-cases/stop-session.use-case.js';

Deno.test('create/start/stop session must satisfy contracts', () => {
  const command = createSessionCommandSchema.parse({
    session_id: crypto.randomUUID(),
    seed: 7,
    max_ticks: 500,
  });

  const created = createSession(command);
  const started = startSession(created.session, {
    started_at: new Date().toISOString(),
  });
  const stopped = stopSession(started.session, {
    reason: 'end_of_test',
    stopped_at: new Date().toISOString(),
  });

  const validCreatedSession = sessionSchema.parse(created.session);
  const validStartedSession = sessionSchema.parse(started.session);
  const validStoppedSession = sessionSchema.parse(stopped.session);

  created.events.forEach((event) => eventSchema.parse(event));
  started.events.forEach((event) => eventSchema.parse(event));
  stopped.events.forEach((event) => eventSchema.parse(event));

  assertEquals(validCreatedSession.status, 'CREATED');
  assertEquals(validCreatedSession.tick, 0);
  assertEquals(validStartedSession.status, 'RUNNING');
  assertEquals(validStoppedSession.status, 'STOPPED');

  assertExists(created.events[0].event_id);
  assertExists(started.events[0].event_id);
  assertExists(stopped.events[0].event_id);
});

Deno.test('start and stop command schemas must validate', () => {
  const startCommand = startSessionCommandSchema.parse({
    started_at: new Date().toISOString(),
  });

  const stopCommand = stopSessionCommandSchema.parse({
    reason: 'manual_stop',
    stopped_at: new Date().toISOString(),
  });

  assertExists(startCommand.started_at);
  assertExists(stopCommand.reason);
  assertExists(stopCommand.stopped_at);
});
