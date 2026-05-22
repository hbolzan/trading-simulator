# Roadmap de Execução v1 (Iterativo)

## 1) Objetivo
Organizar a execução do simulador em ciclos curtos, com entregas verificáveis, mantendo foco no MVP funcional.

Premissas:
- Stack: Deno + JavaScript first + Zod.
- Arquitetura: domínio funcional e imutável, UI desacoplada via HTTP/WS.
- Escopo inicial: mini índice, varejo/institucional/market maker, candles e replay.

---

## 2) Cadência de trabalho
- Ciclos quinzenais (sprints de 2 semanas).
- Revisão no fim de cada sprint com critérios de aceite.
- Ajuste de backlog orientado por risco e aprendizado.

---

## 3) Fases e cronograma estimado

## Fase 0 — Setup e contratos (Sprint 1)
Duração: 2 semanas

Entregas:
- Estrutura de pastas do motor seguindo arquitetura definida.
- Contratos Zod v1 (Ativo, Participante, Ordem, Negócio, Candle, Eventos).
- Casos de uso base definidos: criar/iniciar/parar sessão.
- Determinismo básico com `seed` e `tick` lógico.
- Primeira visualização técnica no terminal (resumo de sessão: trades, volume, último preço, rejeições).

Aceite:
- Contratos validados por testes de contrato.
- Sessão inicia e encerra sem inconsistência de estado.
- Resumo de sessão legível no terminal para inspeção rápida.

## Fase 1 — Núcleo de simulação (Sprint 2 e 3)
Duração: 4 semanas

Entregas:
- Loop de simulação por tick.
- Geração de decisões por tipo de participante.
- Book simplificado e matching básico.
- Registro de eventos append-only.
- Export de artefatos de análise (`events.jsonl`, `trades.csv`, `candles.csv`).
- Viewer offline inicial (HTML estático gerado por sessão) para candles e métricas básicas.

Aceite:
- Simulação completa roda por N ticks sem erro.
- Negócios executados e persistidos com consistência.
- Artefatos podem ser abertos sem UI backend em tempo real.

## Fase 2 — Projeções e leitura (Sprint 4)
Duração: 2 semanas

Entregas:
- Projeções materializadas: ticker snapshot, candle series, posição/PnL.
- Replay de sessão a partir de eventos.

Aceite:
- Replay reconstrói estado final de forma determinística.
- OHLCV e PnL conferem com os eventos da sessão.

## Fase 3 — API de integração (Sprint 5)
Duração: 2 semanas

Entregas:
- API HTTP para comandos e consultas de sessão.
- Stream WebSocket de eventos em tempo real.
- Envelope padrão de erro/diagnóstico.

Aceite:
- Cliente externo consome sessão sem acessar estado interno do motor.
- Eventos em tempo real entregues com contrato estável.

## Fase 4 — UI mínima desacoplada (Sprint 6)
Duração: 2 semanas

Entregas:
- Interface mínima de monitoramento: candles, preço, volume, estado da sessão.
- Replay visual básico.

Aceite:
- Sessão pode ser criada/iniciada/finalizada via UI.
- Candles e métricas atualizam por stream.

## Fase 5 — Interação do usuário (Sprint 7 e 8)
Duração: 4 semanas

Entregas:
- Usuário envia ordens no mercado simulado.
- Consolidação de posição, PnL e risco básico em tempo real.
- Regras de segurança operacional mínimas (limites e rejeições).

Aceite:
- Operações do usuário entram no mesmo fluxo de eventos do motor.
- Posição e PnL do usuário batem com execução registrada.

---

## 4) Marco de versão
- v0.1: motor fechado + visualização offline por artefatos (fim da Fase 1)
- v0.15: projeções e replay determinístico estáveis (fim da Fase 2)
- v0.2: API HTTP/WS estável para integração (fim da Fase 3)
- v0.3: UI mínima operacional (fim da Fase 4)
- v1.0: modo interativo com usuário operando (fim da Fase 5)

---

## 5) Riscos principais e mitigação
1. Complexidade de comportamento emergente
- Mitigar com regras simples no início e calibração por cenários controlados.

2. Acoplamento acidental entre UI e motor
- Mitigar com contrato versionado e testes de contrato.

3. Regressões por mutação de estado
- Mitigar com padrão funcional imutável e testes unitários de pureza.

4. Crescimento de custo técnico
- Mitigar com limites de escopo por sprint e critérios de aceite rígidos.

---

## 6) Critério para “seguir para próxima fase”
Uma fase só avança quando:
- Critérios de aceite da fase atual forem cumpridos.
- Testes mínimos da fase estiverem verdes.
- Contratos impactados forem versionados e documentados.

---

## 7) Próximo passo imediato
Iniciar Sprint 1 com foco em:
1. Estrutura do motor em Deno.
2. Contratos Zod v1.
3. Casos de uso de sessão.
4. Testes de contrato iniciais.
5. Saída de resumo técnico no terminal para leitura de resultado já no primeiro ciclo.
