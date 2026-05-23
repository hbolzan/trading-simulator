const formatEventTypeCount = (events, type) =>
  events.filter((event) => event.event_type === type).length;

export const renderSessionSummary = (session, events, details = {}) => {
  const sessionStartedCount = formatEventTypeCount(events, 'SessionStarted');
  const sessionStoppedCount = formatEventTypeCount(events, 'SessionStopped');
  const orderSubmittedCount = formatEventTypeCount(events, 'OrderSubmitted');
  const orderRejectedCount = formatEventTypeCount(events, 'OrderRejected');
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
    `orders_rejected: ${details.rejectedOrdersCount ?? orderRejectedCount}`,
    `trades_executed: ${details.tradesCount ?? tradeExecutedCount}`,
    `last_price: ${details.lastPrice ?? 'n/a'}`,
    `events_jsonl: ${details.eventsPath ?? 'n/a'}`,
    `trades_csv: ${details.tradesPath ?? 'n/a'}`,
    `candles_csv: ${details.candlesPath ?? 'n/a'}`,
    `viewer_html: ${details.viewerPath ?? 'n/a'}`,
    `ticker_snapshot_json: ${details.tickerSnapshotPath ?? 'n/a'}`,
    `positions_json: ${details.positionsPath ?? 'n/a'}`,
    `replay_summary_json: ${details.replaySummaryPath ?? 'n/a'}`,
    `replay_deterministic_match: ${details.replayDeterministicMatch ?? 'n/a'}`,
  ].join('\n');
};
