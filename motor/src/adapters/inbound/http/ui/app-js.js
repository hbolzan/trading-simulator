export const uiAppJs = `const byId = (id) => document.getElementById(id);

const state = {
  sessionId: null,
  socket: null,
  wsEvents: 0,
};

const setStatus = (value) => {
  byId('status').textContent = value;
};

const setSessionView = ({ sessionId, status, tick, metrics }) => {
  byId('sessionId').textContent = sessionId;
  byId('sessionStatus').textContent = status;
  byId('sessionTick').textContent = tick;
  byId('lastPrice').textContent = metrics?.last_price ?? '-';
  byId('ordersSubmitted').textContent = metrics?.orders_submitted ?? '-';
  byId('ordersRejected').textContent = metrics?.orders_rejected ?? '-';
  byId('tradesCount').textContent = metrics?.trades_count ?? '-';
};

const appendEvent = (line) => {
  const el = byId('events');
  const previous = el.textContent === '-' ? '' : \`${'${el.textContent}'}\\n\`;
  el.textContent = \`${'${previous}${line}'}\`.split('\\n').slice(-40).join('\\n');
  el.scrollTop = el.scrollHeight;
};

const drawCandles = (candles) => {
  const canvas = byId('chart');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  if (!candles.length) {
    ctx.fillStyle = '#93a1c7';
    ctx.fillText('Sem candles para exibir.', 20, 30);
    return;
  }

  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const maxPrice = Math.max(...highs);
  const minPrice = Math.min(...lows);
  const range = Math.max(0.0001, maxPrice - minPrice);

  const padX = 20;
  const padY = 20;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const step = innerW / candles.length;
  const candleW = Math.max(2, step * 0.6);

  const y = (price) => padY + ((maxPrice - price) / range) * innerH;

  ctx.strokeStyle = '#2a3556';
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i += 1) {
    const gy = padY + (innerH / 5) * i;
    ctx.beginPath();
    ctx.moveTo(padX, gy);
    ctx.lineTo(width - padX, gy);
    ctx.stroke();
  }

  candles.forEach((candle, index) => {
    const x = padX + index * step + (step - candleW) / 2;
    const openY = y(candle.open);
    const closeY = y(candle.close);
    const highY = y(candle.high);
    const lowY = y(candle.low);
    const isUp = candle.close >= candle.open;

    ctx.strokeStyle = isUp ? '#1ecb81' : '#f45b69';
    ctx.beginPath();
    ctx.moveTo(x + candleW / 2, highY);
    ctx.lineTo(x + candleW / 2, lowY);
    ctx.stroke();

    ctx.fillStyle = isUp ? '#1ecb81' : '#f45b69';
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.max(1, Math.abs(closeY - openY));
    ctx.fillRect(x, bodyTop, candleW, bodyHeight);
  });
};

const loadSessionData = async (sessionId, timeframeTicks) => {
  const [sessionRes, candlesRes] = await Promise.all([
    fetch(\`/sessions/${'${sessionId}'}\`),
    fetch(\`/sessions/${'${sessionId}'}/candles?tf=${'${timeframeTicks}'}\`),
  ]);

  const sessionJson = await sessionRes.json();
  const candlesJson = await candlesRes.json();

  setSessionView({
    sessionId,
    status: sessionJson.session?.status ?? '-',
    tick: sessionJson.session?.tick ?? '-',
    metrics: sessionJson.metrics,
  });

  drawCandles(candlesJson.candles ?? []);
};

const attachWs = (sessionId) => {
  if (state.socket) {
    state.socket.close();
  }

  state.wsEvents = 0;
  byId('wsEvents').textContent = '0';
  byId('events').textContent = '-';

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const socket = new WebSocket(\`${'${protocol}'}://${'${window.location.host}'}/ws/sessions/${'${sessionId}'}\`);

  socket.onmessage = (event) => {
    state.wsEvents += 1;
    byId('wsEvents').textContent = String(state.wsEvents);

    try {
      const data = JSON.parse(event.data);
      appendEvent(\`${'${data.type}'} | tick=${'${data.tick}'} | ${'${data.timestamp}'}\`);
    } catch {
      appendEvent(event.data);
    }
  };

  socket.onopen = () => appendEvent('ws connected');
  socket.onclose = () => appendEvent('ws closed');
  socket.onerror = () => appendEvent('ws error');

  state.socket = socket;
};

const runSession = async () => {
  const runBtn = byId('runBtn');
  runBtn.disabled = true;

  try {
    const seed = Number(byId('seed').value);
    const maxTicks = Number(byId('maxTicks').value);
    const participantsCount = Number(byId('participantsCount').value);
    const timeframeTicks = Number(byId('timeframeTicks').value);

    setStatus('Criando sessão...');

    const response = await fetch('/sessions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ seed, maxTicks, participantsCount, timeframeTicks }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error?.message ?? 'Erro ao criar sessão');
    }

    state.sessionId = payload.session_id;

    setSessionView({
      sessionId: payload.session_id,
      status: payload.status,
      tick: payload.tick,
      metrics: payload.metrics,
    });

    await loadSessionData(payload.session_id, timeframeTicks);
    attachWs(payload.session_id);

    setStatus(\`Sessão ${'${payload.session_id}'} pronta.\`);
  } catch (error) {
    setStatus(\`Falha: ${'${error.message}'}\`);
  } finally {
    runBtn.disabled = false;
  }
};

byId('runBtn').addEventListener('click', () => {
  runSession();
});
`;
