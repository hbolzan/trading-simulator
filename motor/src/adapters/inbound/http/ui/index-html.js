export const buildUiIndexHtml = () =>
  `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Trading Simulator — Sprint 6 UI</title>
    <style>
      :root {
        color-scheme: dark;
        font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      }
      body {
        margin: 0;
        background: #0b1020;
        color: #e9ecf1;
      }
      .app {
        max-width: 1080px;
        margin: 0 auto;
        padding: 24px;
      }
      .panel {
        background: #131a2f;
        border: 1px solid #26304d;
        border-radius: 10px;
        padding: 16px;
        margin-bottom: 16px;
      }
      h1 {
        margin: 0 0 12px;
        font-size: 20px;
      }
      h2 {
        margin: 0 0 10px;
        font-size: 16px;
      }
      .row {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      label {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 13px;
      }
      input {
        background: #0e1428;
        color: #e9ecf1;
        border: 1px solid #2a3556;
        border-radius: 8px;
        padding: 8px;
        width: 150px;
      }
      button {
        background: #4e7cff;
        color: white;
        border: 0;
        border-radius: 8px;
        padding: 10px 14px;
        font-weight: 600;
        cursor: pointer;
        margin-top: 24px;
      }
      .kv {
        display: grid;
        grid-template-columns: repeat(4, minmax(120px, 1fr));
        gap: 10px;
      }
      .kv div {
        background: #0e1428;
        border: 1px solid #2a3556;
        border-radius: 8px;
        padding: 8px;
      }
      .kv small {
        color: #93a1c7;
        display: block;
        margin-bottom: 3px;
      }
      #status {
        color: #b8c4e8;
        font-size: 13px;
      }
      canvas {
        width: 100%;
        height: 360px;
        background: #0e1428;
        border: 1px solid #2a3556;
        border-radius: 8px;
      }
      #events {
        max-height: 150px;
        overflow: auto;
        font-size: 12px;
        color: #aac0ff;
        white-space: pre-line;
      }
    </style>
  </head>
  <body>
    <main class="app">
      <div class="panel">
        <h1>Sprint 6 — UI mínima desacoplada</h1>
        <p id="status">Pronto para iniciar sessão.</p>
        <div class="row">
          <label>Seed<input id="seed" type="number" value="42" /></label>
          <label>Max ticks<input id="maxTicks" type="number" value="120" /></label>
          <label>Participants<input id="participantsCount" type="number" value="60" /></label>
          <label>Timeframe<input id="timeframeTicks" type="number" value="10" /></label>
          <button id="runBtn">Criar sessão</button>
        </div>
      </div>

      <div class="panel">
        <h2>Estado da sessão</h2>
        <div class="kv">
          <div><small>Session</small><strong id="sessionId">-</strong></div>
          <div><small>Status</small><strong id="sessionStatus">-</strong></div>
          <div><small>Tick</small><strong id="sessionTick">-</strong></div>
          <div><small>Last price</small><strong id="lastPrice">-</strong></div>
          <div><small>Orders</small><strong id="ordersSubmitted">-</strong></div>
          <div><small>Rejected</small><strong id="ordersRejected">-</strong></div>
          <div><small>Trades</small><strong id="tradesCount">-</strong></div>
          <div><small>WS events</small><strong id="wsEvents">0</strong></div>
        </div>
      </div>

      <div class="panel">
        <h2>Candles</h2>
        <canvas id="chart" width="1000" height="360"></canvas>
      </div>

      <div class="panel">
        <h2>Eventos (WebSocket)</h2>
        <div id="events">-</div>
      </div>
    </main>

    <script src="/ui/app.js"></script>
  </body>
</html>
`;
