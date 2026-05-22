# Contratos de Dados v1 (MVP)

## 1) Objetivo
Definir os contratos de dados do MVP para comunicação entre módulos, persistência de fatos e consumo da interface desacoplada.

Escopo do documento:
- Contratos de domínio (entidades e eventos)
- Contratos de API/stream para UI
- Contratos de projeções (views materializadas)

---

## 2) Convenções globais
- Todos os IDs em formato string.
- Valores monetários em número decimal (v1) com precisão definida por ativo.
- Timestamps em formato ISO 8601 UTC e `tick` lógico obrigatório.
- Campos obrigatórios explicitados em cada contrato.
- Eventos são **append-only** (imutáveis).

Campos comuns recomendados em eventos:
- `event_id`
- `event_type`
- `session_id`
- `tick`
- `occurred_at`
- `payload`
- `version` (ex.: `v1`)

---

## 3) Entidades de domínio (contratos base)

## 3.1 Ativo
Campos:
- `id` (obrigatório)
- `ticker` (obrigatório)
- `tipo` (`indice` | `derivativo` | `acao`) (obrigatório)
- `preco_inicial` (obrigatório)
- `tick_size` (obrigatório)
- `lote_minimo` (obrigatório)
- `liquidez_base` (obrigatório)
- `volatilidade_base` (obrigatório)
- `subjacente_id` (obrigatório para `derivativo`)

## 3.2 Participante
Campos:
- `id` (obrigatório)
- `tipo` (`varejo` | `institucional` | `market_maker`) (obrigatório)
- `capital_inicial` (obrigatório)
- `capital_disponivel` (obrigatório)
- `apetite_risco` (obrigatório)
- `medo` (obrigatório)
- `euforia` (obrigatório)
- `ansiedade` (obrigatório)
- `nivel_conhecimento` (obrigatório)
- `estrategia_base` (obrigatório)

## 3.3 Ordem
Campos:
- `id` (obrigatório)
- `session_id` (obrigatório)
- `tick` (obrigatório)
- `participant_id` (obrigatório)
- `ativo_id` (obrigatório)
- `lado` (`compra` | `venda`) (obrigatório)
- `tipo_ordem` (`mercado` | `limite`) (obrigatório)
- `quantidade` (obrigatório)
- `preco_limite` (obrigatório para `limite`)
- `origem` (`simulador` | `usuario`) (obrigatório)

## 3.4 Negócio executado
Campos:
- `id` (obrigatório)
- `session_id` (obrigatório)
- `tick` (obrigatório)
- `ativo_id` (obrigatório)
- `preco_execucao` (obrigatório)
- `quantidade` (obrigatório)
- `agressor_lado` (`compra` | `venda`) (obrigatório)
- `ordem_compra_id` (obrigatório)
- `ordem_venda_id` (obrigatório)

## 3.5 Candle (OHLCV)
Campos:
- `id` (obrigatório)
- `session_id` (obrigatório)
- `ativo_id` (obrigatório)
- `timeframe_ticks` (obrigatório)
- `start_tick` (obrigatório)
- `end_tick` (obrigatório)
- `open` (obrigatório)
- `high` (obrigatório)
- `low` (obrigatório)
- `close` (obrigatório)
- `volume` (obrigatório)

---

## 4) Eventos imutáveis (fatos do sistema)

## 4.1 Catálogo mínimo de eventos
- `SessionStarted`
- `TickAdvanced`
- `OrderSubmitted`
- `OrderRejected`
- `OrderBookUpdated`
- `TradeExecuted`
- `CandleClosed`
- `ParticipantPnLUpdated`
- `SessionFinished`

## 4.2 Regra de imutabilidade
- Eventos não são alterados nem removidos.
- Correções são novos eventos (ex.: `OrderCorrected`, `TradeCompensated`), quando necessário.

## 4.3 Ordenação
- Ordenação primária por `tick`.
- Desempate por sequência monotônica (`event_seq`) por sessão.

---

## 5) Projeções (views materializadas)

## 5.1 TickerSnapshotView
Objetivo: consulta rápida para UI.
Campos sugeridos:
- `session_id`
- `ativo_id`
- `last_price`
- `best_bid`
- `best_ask`
- `spread`
- `volume_acumulado`
- `updated_at_tick`

## 5.2 ParticipantPositionView
Objetivo: posição e risco por participante.
Campos sugeridos:
- `session_id`
- `participant_id`
- `capital_disponivel`
- `posicoes` (por ativo)
- `pnl_realizado`
- `pnl_nao_realizado`
- `updated_at_tick`

## 5.3 CandleSeriesView
Objetivo: série histórica para gráfico.
Campos sugeridos:
- `session_id`
- `ativo_id`
- `timeframe_ticks`
- `candles` (lista de OHLCV)

Observação:
- Projeções podem ser recalculadas a partir dos eventos.
- Projeções podem ser descartadas e reconstruídas sem perda histórica.

---

## 6) Contratos de API (UI desacoplada)

## 6.1 HTTP (comandos e consultas)
Comandos (exemplos):
- `POST /sessions` -> cria sessão
- `POST /sessions/{id}/start` -> inicia sessão
- `POST /sessions/{id}/pause` -> pausa
- `POST /sessions/{id}/resume` -> continua
- `POST /sessions/{id}/stop` -> encerra
- `POST /sessions/{id}/orders` -> envia ordem (futuro modo interativo)

Consultas (exemplos):
- `GET /sessions/{id}` -> estado da sessão
- `GET /sessions/{id}/ticker/{ativoId}` -> snapshot de preço/book
- `GET /sessions/{id}/candles/{ativoId}?tf=10` -> candles
- `GET /sessions/{id}/participants/{participantId}/position` -> posição/PnL

## 6.2 WebSocket (eventos para UI)
Canal de eventos por sessão:
- `session.{id}.events`

Eventos mínimos publicados:
- `tick_advanced`
- `trade_executed`
- `candle_closed`
- `order_rejected`
- `session_finished`

Formato sugerido de envelope:
- `type`
- `session_id`
- `tick`
- `timestamp`
- `data`

---

## 7) Versionamento de contratos
- Todo payload externo deve incluir `version`.
- Quebra de compatibilidade exige nova versão (`v2`, `v3`, ...).
- Compatibilidade retroativa é responsabilidade da camada de adaptação da API.

---

## 8) Validação e qualidade de contrato
- Validar entrada/saída com Zod nas fronteiras.
- Erros de contrato devem retornar diagnóstico objetivo (campo inválido, esperado vs recebido).
- Testes de contrato obrigatórios para:
  - comandos HTTP
  - eventos WS
  - replay de sessão

---

## 9) Critérios de aceite dos contratos v1
1. Todos os eventos mínimos podem ser serializados e persistidos.
2. UI consegue montar gráfico e métricas via HTTP + WS sem acessar estado interno do motor.
3. Replay de sessão reconstrói projeções essenciais com consistência.
4. Entradas inválidas são rejeitadas com erro legível.
