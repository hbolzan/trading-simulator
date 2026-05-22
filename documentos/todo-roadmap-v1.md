# Todo List — Execução v1

## Sprint 1 (em andamento)
- [x] Criar estrutura de pastas do motor em Deno.
- [x] Configurar `deno.json` e padrões de lint/format/test.
- [x] Implementar contratos Zod v1 (entidades e eventos).
- [x] Implementar casos de uso: `create-session`, `start-session`, `stop-session`.
- [x] Garantir `seed` e `tick` lógico no núcleo da sessão.
- [x] Criar testes de contrato para payloads base.
- [x] Implementar resumo técnico de sessão no terminal (trades, volume, preço, rejeições).

## Sprint 2
- [x] Implementar loop principal de simulação por tick.
- [x] Implementar geração de ordens por participantes.
- [x] Implementar book simplificado com matching.
- [x] Persistir eventos append-only.
- [x] Gerar artefatos de análise (`events.jsonl`, `trades.csv`, `candles.csv`).

## Sprint 3
- [ ] Refinar regras de market maker.
- [ ] Adicionar validações de risco/rejeição de ordens.
- [ ] Estabilizar consistência contábil por sessão.
- [ ] Entregar viewer offline inicial (HTML estático por sessão).

## Sprint 4
- [ ] Implementar projeções materializadas (ticker/candles/posição).
- [ ] Implementar replay determinístico de sessão.

## Sprint 5
- [ ] Expor API HTTP de sessão (comando/consulta).
- [ ] Expor stream WebSocket de eventos.
- [ ] Padronizar envelope de erro e telemetria básica.

## Sprint 6
- [ ] Entregar UI mínima desacoplada com candles e estado de sessão.
- [ ] Validar fluxo fim a fim motor + API + UI.

## Sprint 7-8
- [ ] Habilitar envio de ordens do usuário em tempo real.
- [ ] Exibir posição/PnL/risco do usuário.
- [ ] Fechar critérios de aceite v1.0.
