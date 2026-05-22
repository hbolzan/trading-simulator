# Motor do Simulador (Sprint 2)

Base inicial do motor em Deno com:

- arquitetura por camadas,
- contratos validados com Zod,
- casos de uso de sessão (`create/start/stop`),
- seed e tick lógico,
- loop de simulação por tick,
- book simplificado com matching,
- persistência append-only de eventos (`jsonl`),
- export de trades (`csv`),
- resumo técnico via CLI.

## Comandos

- `deno task check`
- `deno task test`
- `deno task test:contract`
- `deno task dev`

## Saídas do `deno task dev`

- `output/<session_id>/events.jsonl`
- `output/<session_id>/trades.csv`
- `output/<session_id>/candles.csv`
