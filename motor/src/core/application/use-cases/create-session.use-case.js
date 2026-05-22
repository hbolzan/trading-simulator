import {
  createSessionCommandSchema,
  sessionSchema,
} from '../../../contracts/schemas/session.schema.js';
import { buildEvent } from '../../../shared/utils/build-event.js';

export const createSession = (rawCommand) => {
  const command = createSessionCommandSchema.parse(rawCommand);

  const session = sessionSchema.parse({
    session_id: command.session_id,
    status: 'CREATED',
    seed: command.seed,
    tick: 0,
    max_ticks: command.max_ticks,
    started_at: null,
    stopped_at: null,
  });

  const events = [
    buildEvent({
      eventType: 'SessionCreated',
      sessionId: session.session_id,
      tick: session.tick,
      occurredAt: new Date().toISOString(),
      payload: {
        seed: session.seed,
        max_ticks: session.max_ticks,
      },
    }),
  ];

  return { session, events };
};
