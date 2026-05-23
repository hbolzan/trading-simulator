import { dirname } from 'jsr:@std/path@1.0.8';

const buildHtml = ({ session, candles, ordersCount, rejectedOrdersCount, tradesCount }) => {
  const candlesJson = JSON.stringify(candles);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Trading Simulator - Viewer</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #0f172a; color: #e2e8f0; }
    h1 { margin: 0 0 12px 0; font-size: 20px; }
    .metrics { display: grid; grid-template-columns: repeat(4, minmax(160px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; }
    .label { font-size: 12px; color: #94a3b8; margin-bottom: 6px; }
    .value { font-size: 16px; font-weight: 700; }
    canvas { width: 100%; height: 420px; background: #020617; border: 1px solid #334155; border-radius: 8px; }
    .hint { margin-top: 8px; color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Session ${session.session_id}</h1>

  <div class="metrics">
    <div class="card"><div class="label">Status</div><div class="value">${session.status}</div></div>
    <div class="card"><div class="label">Ticks</div><div class="value">${session.tick}/${session.max_ticks}</div></div>
    <div class="card"><div class="label">Ordens</div><div class="value">${ordersCount}</div></div>
    <div class="card"><div class="label">Rejeitadas</div><div class="value">${rejectedOrdersCount}</div></div>
    <div class="card"><div class="label">Trades</div><div class="value">${tradesCount}</div></div>
  </div>

  <canvas id="chart" width="1400" height="420"></canvas>
  <div class="hint">Visualização OHLC simplificada (close line + range high/low por candle).</div>

  <script>
    const candles = ${candlesJson};
    const canvas = document.getElementById('chart');
    const ctx = canvas.getContext('2d');

    if (!candles.length) {
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '16px Arial';
      ctx.fillText('Sem candles para exibir.', 20, 40);
    } else {
      const width = canvas.width;
      const height = canvas.height;
      const padding = 30;

      const highs = candles.map((c) => c.high);
      const lows = candles.map((c) => c.low);
      const minPrice = Math.min(...lows);
      const maxPrice = Math.max(...highs);
      const priceRange = Math.max(1e-6, maxPrice - minPrice);

      const xStep = (width - (padding * 2)) / Math.max(1, candles.length - 1);
      const toY = (price) => height - padding - (((price - minPrice) / priceRange) * (height - (padding * 2)));

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, height - padding);
      ctx.lineTo(width - padding, height - padding);
      ctx.stroke();

      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      candles.forEach((candle, index) => {
        const x = padding + (index * xStep);
        ctx.beginPath();
        ctx.moveTo(x, toY(candle.high));
        ctx.lineTo(x, toY(candle.low));
        ctx.stroke();
      });

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      candles.forEach((candle, index) => {
        const x = padding + (index * xStep);
        const y = toY(candle.close);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  </script>
</body>
</html>`;
};

export const writeViewerHtml = async (
  { session, candles, ordersCount, rejectedOrdersCount, tradesCount, filePath },
) => {
  const html = buildHtml({
    session,
    candles,
    ordersCount,
    rejectedOrdersCount,
    tradesCount,
  });

  await Deno.mkdir(dirname(filePath), { recursive: true });
  await Deno.writeTextFile(filePath, html);
};
