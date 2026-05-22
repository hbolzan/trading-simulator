import {
  sessionSchema,
  stopSessionCommandSchema,
} from '../../../contracts/schemas/session.schema.js';
import { buildEvent } from '../../../shared/utils/build-event.js';
import { DomainError } from '../../../shared/errors/domain-error.js';

export const stopSession = (rawSession, rawCommand) => {
  const session = sessionSchema.parse(rawSession);
  const command = stopSessionCommandSchema.parse(rawCommand);

  if (session.status !== 'RUNNING') {
    throw new DomainError('Session must be RUNNING before stop.');
  }

  const nextSession = sessionSchema.parse({
    ...session,
    status: 'STOPPED',
    stopped_at: command.stopped_at,
  });

  const events = [
    buildEvent({
      eventType: 'SessionStopped',
      sessionId: nextSession.session_id,
      tick: nextSession.tick,
      occurredAt: command.stopped_at,
      payload: {
        reason: command.reason,
        previous_status: session.status,
        current_status: nextSession.status,
      },
    }),
  ];

  return { session: nextSession, events };
};
