import {
  sessionSchema,
  startSessionCommandSchema,
} from '../../../contracts/schemas/session.schema.js';
import { buildEvent } from '../../../shared/utils/build-event.js';
import { DomainError } from '../../../shared/errors/domain-error.js';

export const startSession = (rawSession, rawCommand) => {
  const session = sessionSchema.parse(rawSession);
  const command = startSessionCommandSchema.parse(rawCommand);

  if (session.status !== 'CREATED') {
    throw new DomainError('Session must be CREATED before start.');
  }

  const nextSession = sessionSchema.parse({
    ...session,
    status: 'RUNNING',
    started_at: command.started_at,
  });

  const events = [
    buildEvent({
      eventType: 'SessionStarted',
      sessionId: nextSession.session_id,
      tick: nextSession.tick,
      occurredAt: command.started_at,
      payload: {
        previous_status: session.status,
        current_status: nextSession.status,
      },
    }),
  ];

  return { session: nextSession, events };
};
