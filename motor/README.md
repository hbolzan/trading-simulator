# Motor do Simulador (Sprint 5)

Base inicial do motor em Deno com:

- arquitetura por camadas,
- contratos validados com Zod,
- casos de uso de sessão (`create/start/stop`),
- seed e tick lógico,
- loop de simulação por tick,
- book simplificado com matching,
- persistência append-only de eventos (`jsonl`),
- export de trades (`csv`),
- resumo técnico via CLI,
- API HTTP de sessão (comando/consulta),
- stream WebSocket de eventos,
- envelope de erro e telemetria básica.

## Comandos

- `deno task check`
- `deno task test`
- `deno task test:contract`
- `deno task dev`
- `deno task dev:local`
- `deno task api:dev`
- `deno task api:dev:local`

## Endpoints da API (Sprint 5)

- `POST /sessions` cria e executa uma sessão completa.
- `GET /sessions/:sessionId` consulta estado e métricas da sessão.
- `GET /sessions/:sessionId/ticker` consulta snapshot de ticker.
- `GET /sessions/:sessionId/candles?tf=10` consulta candles.
- `GET /sessions/:sessionId/participants/:participantId/position` consulta posição/PnL de
  participante.
- `GET /telemetry` consulta telemetria básica de requisições.
- `GET /ws/sessions/:sessionId` abre stream de eventos via WebSocket.

Exemplo rápido:

- Subir API: `cd motor && deno task api:dev:local`
- Criar sessão:
  `curl -X POST http://localhost:8787/sessions -H 'content-type: application/json' -d '{"seed":42,"maxTicks":120}'`

## Rodar local com `.env` compartilhado

1. Na raiz do projeto, criar `.env` a partir do exemplo:

   - `cp .env.example .env`

2. Subir banco local com os mesmos parâmetros do `.env`:

   - `docker compose up -d postgres`

3. Rodar o motor usando esse mesmo `.env`:

   - `cd motor && deno task dev:local`

## Configuração de persistência

Variáveis de ambiente:

- `PERSISTENCE_MODE=file|postgres|both` (padrão: `file`)
- `DATABASE_URL` (obrigatória para `postgres` e `both`)

Exemplos:

- Apenas arquivos: `PERSISTENCE_MODE=file deno task dev`
- Apenas Postgres: `PERSISTENCE_MODE=postgres DATABASE_URL="postgres://..." deno task dev`
- Arquivos + Postgres: `PERSISTENCE_MODE=both DATABASE_URL="postgres://..." deno task dev`

Com `.env` compartilhado (recomendado local):

- `cd motor && deno task dev:local`

## Saídas do `deno task dev`

- `output/<session_id>/events.jsonl`
- `output/<session_id>/trades.csv`
- `output/<session_id>/candles.csv`

No modo `postgres`, o resumo de sessão aponta para:

- `postgres://simulation_events`
- `postgres://simulation_trades`
- `postgres://simulation_candles`
