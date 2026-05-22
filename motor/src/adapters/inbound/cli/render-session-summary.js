const formatEventTypeCount = (events, type) =>
  events.filter((event) => event.event_type === type).length;

export const renderSessionSummary = (session, events) => {
  const sessionStartedCount = formatEventTypeCount(events, 'SessionStarted');
  const sessionStoppedCount = formatEventTypeCount(events, 'SessionStopped');

  return [
    '=== Session Summary ===',
    `session_id: ${session.session_id}`,
    `status: ${session.status}`,
    `seed: ${session.seed}`,
    `tick: ${session.tick}`,
    `max_ticks: ${session.max_ticks}`,
    `events_total: ${events.length}`,
    `session_started_events: ${sessionStartedCount}`,
    `session_stopped_events: ${sessionStoppedCount}`,
  ].join('\n');
};
