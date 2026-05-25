import { createPersistenceAdapter } from '../../outbound/persistence/create-persistence-adapter.js';
import { executeSession } from '../../../core/application/use-cases/execute-session.use-case.js';
import { buildUiIndexHtml } from './ui/index-html.js';
import { uiAppJs } from './ui/app-js.js';

const sessions = new Map();
const sessionEvents = new Map();
const wsSubscribers = new Map();

const telemetry = {
  requests_total: 0,
  requests_by_path: {},
  request_duration_ms_total: 0,
};

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  });

const htmlResponse = (html, status = 200) =>
  new Response(html, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
    },
  });

const javascriptResponse = (sourceCode, status = 200) =>
  new Response(sourceCode, {
    status,
    headers: {
      'content-type': 'text/javascript; charset=utf-8',
    },
  });

const errorResponse = ({ code, message, details, traceId, status = 400 }) =>
  jsonResponse(
    {
      error: {
        code,
        message,
        details,
        trace_id: traceId,
      },
    },
    status,
  );

const parseRequestBody = async (request) => {
  const text = await request.text();
  if (!text.trim()) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('invalid_json');
  }
};

const publishSessionEvents = (sessionId, events) => {
  const subscribers = wsSubscribers.get(sessionId) ?? new Set();

  for (const socket of subscribers) {
    if (socket.readyState !== WebSocket.OPEN) {
      continue;
    }

    for (const event of events) {
      socket.send(JSON.stringify({
        type: event.event_type,
        session_id: event.session_id,
        tick: event.tick,
        timestamp: event.occurred_at,
        data: event.payload,
      }));
    }
  }
};

const getPathParts = (url) => new URL(url).pathname.split('/').filter(Boolean);

const getPersistenceAdapter = () => {
  const mode = Deno.env.get('PERSISTENCE_MODE') ?? 'file';
  const databaseUrl = Deno.env.get('DATABASE_URL') ?? '';
  return createPersistenceAdapter({ mode, databaseUrl });
};

const handleCreateSessionAndStart = async ({ request, traceId }) => {
  const body = await parseRequestBody(request);

  const persistenceAdapter = getPersistenceAdapter();

  const startedAt = new Date().toISOString();
  const stoppedAt = new Date(Date.now() + 1).toISOString();

  const result = await executeSession({
    simulationConfig: {
      seed: body.seed ?? 42,
      maxTicks: body.maxTicks ?? 200,
      participantsCount: body.participantsCount ?? 60,
      initialPrice: body.initialPrice ?? 100,
      tickSize: body.tickSize ?? 0.5,
      timeframeTicks: body.timeframeTicks ?? 10,
    },
    persistenceAdapter,
    startedAt,
    stoppedAt,
  });

  sessions.set(result.session.session_id, result);
  sessionEvents.set(result.session.session_id, result.events);
  publishSessionEvents(result.session.session_id, result.events);

  return jsonResponse({
    trace_id: traceId,
    session_id: result.session.session_id,
    status: result.session.status,
    tick: result.session.tick,
    metrics: result.metrics,
    paths: result.paths,
  }, 201);
};

const handleGetSession = ({ sessionId, traceId }) => {
  const sessionData = sessions.get(sessionId);

  if (!sessionData) {
    return errorResponse({
      code: 'SESSION_NOT_FOUND',
      message: 'Session not found.',
      details: { session_id: sessionId },
      traceId,
      status: 404,
    });
  }

  return jsonResponse({
    trace_id: traceId,
    session: sessionData.session,
    metrics: sessionData.metrics,
    paths: sessionData.paths,
    replay_summary: sessionData.replaySummary,
  });
};

const handleGetTicker = ({ sessionId, traceId }) => {
  const sessionData = sessions.get(sessionId);

  if (!sessionData) {
    return errorResponse({
      code: 'SESSION_NOT_FOUND',
      message: 'Session not found.',
      details: { session_id: sessionId },
      traceId,
      status: 404,
    });
  }

  return jsonResponse({ trace_id: traceId, ticker: sessionData.tickerSnapshot });
};

const handleGetCandles = ({ request, sessionId, traceId }) => {
  const sessionData = sessions.get(sessionId);

  if (!sessionData) {
    return errorResponse({
      code: 'SESSION_NOT_FOUND',
      message: 'Session not found.',
      details: { session_id: sessionId },
      traceId,
      status: 404,
    });
  }

  const url = new URL(request.url);
  const tf = Number(url.searchParams.get('tf') ?? '10');

  const candles = tf === 10
    ? sessionData.candles
    : sessionData.candles.filter((candle) => candle.timeframe_ticks === tf);

  return jsonResponse({ trace_id: traceId, candles });
};

const handleGetPosition = ({ sessionId, participantId, traceId }) => {
  const sessionData = sessions.get(sessionId);

  if (!sessionData) {
    return errorResponse({
      code: 'SESSION_NOT_FOUND',
      message: 'Session not found.',
      details: { session_id: sessionId },
      traceId,
      status: 404,
    });
  }

  const position = sessionData.participantPositionViews.find((view) =>
    view.participant_id === participantId
  );

  if (!position) {
    return errorResponse({
      code: 'PARTICIPANT_NOT_FOUND',
      message: 'Participant not found in this session.',
      details: { session_id: sessionId, participant_id: participantId },
      traceId,
      status: 404,
    });
  }

  return jsonResponse({ trace_id: traceId, position });
};

const handleTelemetry = ({ traceId }) => {
  const averageDuration = telemetry.requests_total > 0
    ? telemetry.request_duration_ms_total / telemetry.requests_total
    : 0;

  return jsonResponse({
    trace_id: traceId,
    telemetry: {
      requests_total: telemetry.requests_total,
      requests_by_path: telemetry.requests_by_path,
      request_duration_ms_average: Number(averageDuration.toFixed(3)),
    },
  });
};

const handleWsUpgrade = ({ request, sessionId, traceId }) => {
  const { socket, response } = Deno.upgradeWebSocket(request);

  const subscribers = wsSubscribers.get(sessionId) ?? new Set();
  subscribers.add(socket);
  wsSubscribers.set(sessionId, subscribers);

  socket.onopen = () => {
    const bufferedEvents = sessionEvents.get(sessionId) ?? [];

    socket.send(JSON.stringify({
      type: 'connected',
      session_id: sessionId,
      tick: 0,
      timestamp: new Date().toISOString(),
      data: {
        buffered_events: bufferedEvents.length,
        trace_id: traceId,
      },
    }));

    for (const event of bufferedEvents) {
      socket.send(JSON.stringify({
        type: event.event_type,
        session_id: event.session_id,
        tick: event.tick,
        timestamp: event.occurred_at,
        data: event.payload,
      }));
    }
  };

  socket.onclose = () => {
    const existing = wsSubscribers.get(sessionId);
    if (!existing) return;
    existing.delete(socket);
    wsSubscribers.set(sessionId, existing);
  };

  return response;
};

const routeRequest = ({ request, traceId }) => {
  const pathParts = getPathParts(request.url);
  const [resource, firstId, secondResource, secondId, thirdResource] = pathParts;

  if (request.method === 'GET' && !resource) {
    return htmlResponse(buildUiIndexHtml());
  }

  if (request.method === 'GET' && resource === 'ui' && !firstId) {
    return htmlResponse(buildUiIndexHtml());
  }

  if (request.method === 'GET' && resource === 'ui' && firstId === 'app.js') {
    return javascriptResponse(uiAppJs);
  }

  if (request.method === 'POST' && resource === 'sessions' && !firstId) {
    return handleCreateSessionAndStart({ request, traceId });
  }

  if (request.method === 'GET' && resource === 'sessions' && firstId && !secondResource) {
    return handleGetSession({ sessionId: firstId, traceId });
  }

  if (
    request.method === 'GET' && resource === 'sessions' && firstId && secondResource === 'ticker'
  ) {
    return handleGetTicker({ sessionId: firstId, traceId });
  }

  if (
    request.method === 'GET' && resource === 'sessions' && firstId && secondResource === 'candles'
  ) {
    return handleGetCandles({ request, sessionId: firstId, traceId });
  }

  if (
    request.method === 'GET' &&
    resource === 'sessions' &&
    firstId &&
    secondResource === 'participants' &&
    secondId &&
    thirdResource === 'position'
  ) {
    return handleGetPosition({ sessionId: firstId, participantId: secondId, traceId });
  }

  if (request.method === 'GET' && resource === 'telemetry') {
    return handleTelemetry({ traceId });
  }

  if (request.method === 'GET' && resource === 'ws' && firstId === 'sessions' && secondResource) {
    return handleWsUpgrade({ request, sessionId: secondResource, traceId });
  }

  return errorResponse({
    code: 'ROUTE_NOT_FOUND',
    message: 'Route not found.',
    details: { method: request.method, path: new URL(request.url).pathname },
    traceId,
    status: 404,
  });
};

export const startSessionApiServer = ({ port = 8787 }) => {
  Deno.serve({ port }, async (request) => {
    const traceId = crypto.randomUUID();
    const startedAt = performance.now();
    const path = new URL(request.url).pathname;

    try {
      const response = await routeRequest({ request, traceId });

      telemetry.requests_total += 1;
      telemetry.requests_by_path[path] = (telemetry.requests_by_path[path] ?? 0) + 1;
      telemetry.request_duration_ms_total += performance.now() - startedAt;

      return response;
    } catch (error) {
      telemetry.requests_total += 1;
      telemetry.requests_by_path[path] = (telemetry.requests_by_path[path] ?? 0) + 1;
      telemetry.request_duration_ms_total += performance.now() - startedAt;

      if (error?.message === 'invalid_json') {
        return errorResponse({
          code: 'INVALID_JSON',
          message: 'Request body is not valid JSON.',
          details: {},
          traceId,
          status: 400,
        });
      }

      return errorResponse({
        code: 'INTERNAL_ERROR',
        message: 'Unhandled server error.',
        details: {
          message: error?.message ?? 'unknown_error',
        },
        traceId,
        status: 500,
      });
    }
  });

  console.log(`Session API listening on http://localhost:${port}`);
};
