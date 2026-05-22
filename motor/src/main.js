import { createSession } from './core/application/use-cases/create-session.use-case.js';
import { startSession } from './core/application/use-cases/start-session.use-case.js';
import { stopSession } from './core/application/use-cases/stop-session.use-case.js';
import { renderSessionSummary } from './adapters/inbound/cli/render-session-summary.js';

const created = createSession({
  session_id: crypto.randomUUID(),
  seed: 42,
  max_ticks: 1000,
});

const started = startSession(created.session, {
  started_at: new Date().toISOString(),
});

const stopped = stopSession(started.session, {
  reason: 'manual_stop',
  stopped_at: new Date().toISOString(),
});

const allEvents = [...created.events, ...started.events, ...stopped.events];
console.log(renderSessionSummary(stopped.session, allEvents));
