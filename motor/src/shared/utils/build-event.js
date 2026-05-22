import { eventSchema } from '../../contracts/schemas/event.schema.js';

export const buildEvent = ({ eventType, sessionId, tick, occurredAt, payload }) => {
  const rawEvent = {
    event_id: crypto.randomUUID(),
    event_type: eventType,
    session_id: sessionId,
    tick,
    occurred_at: occurredAt,
    version: 'v1',
    payload,
  };

  return eventSchema.parse(rawEvent);
};
