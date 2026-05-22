const formatEventTypeCount = (events, type) =>
  events.filter((event) => event.event_type === type).length;

export const renderSessionSummary = (session, events, details = {}) => {
  const sessionStartedCount = formatEventTypeCount(events, 'SessionStarted');
  const sessionStoppedCount = formatEventTypeCount(events, 'SessionStopped');
  const orderSubmittedCount = formatEventTypeCount(events, 'OrderSubmitted');
  const tradeExecutedCount = formatEventTypeCount(events, 'TradeExecuted');

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
    `orders_submitted: ${details.ordersCount ?? orderSubmittedCount}`,
    `trades_executed: ${details.tradesCount ?? tradeExecutedCount}`,
    `last_price: ${details.lastPrice ?? 'n/a'}`,
    `events_jsonl: ${details.eventsPath ?? 'n/a'}`,
    `trades_csv: ${details.tradesPath ?? 'n/a'}`,
    `candles_csv: ${details.candlesPath ?? 'n/a'}`,
  ].join('\n');
};
