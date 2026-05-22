# Princípios Arquiteturais do Simulador

## 1) Objetivo
Estabelecer regras de arquitetura para manter o sistema evolutivo, testável e desacoplado desde o início.

---

## 2) Regra 1 — UI totalmente desacoplada do motor
A interface visual (atual e futura interativa) **não conhece detalhes internos** do motor de simulação.

Diretriz:
- Comunicação somente por contrato externo (API/protocolo).
- O motor pode expor HTTP para comandos/consultas e WebSocket para eventos em tempo real.
- A UI funciona como cliente independente e substituível.

Consequências práticas:
- É possível trocar UI sem reescrever o motor.
- É possível ter múltiplos clientes (web, desktop, CLI, replayer).
- O motor pode rodar local, remoto ou em container sem mudar regra de domínio.

---

## 3) Regra 2 — Dados imutáveis e orientados a fatos
O estado do mercado deve ser reconstruível a partir de fatos imutáveis.

Definições:
- **Fato imutável**: evento registrado que nunca é alterado (ex.: ordem recebida, negócio executado, candle fechado).
- **Projeção/materialized view**: visão derivada dos fatos para leitura rápida (ex.: último preço, book atual, posição consolidada).

Diretriz:
- Nunca editar ou sobrescrever fatos históricos.
- Se houve erro de domínio, registrar evento corretivo (não “apagar” passado).
- Permitir reconstrução de estado via replay de eventos.
- Em memória, tratar estado de domínio como imutável (sem mutações diretas em objetos/arrays compartilhados).

Benefícios:
- Auditabilidade.
- Debug/replay determinístico.
- Melhor base para análise educacional do que aconteceu em cada tick.

---

## 4) Regra 3 — Lógica pura separada de interfaces
Separar claramente domínio, aplicação e infraestrutura.

Regra de ouro:
- Regras de negócio vivem em funções puras (entrada -> saída sem efeitos colaterais).
- Controllers/adapters apenas traduzem I/O (HTTP, WS, arquivo, banco) para comandos/eventos de domínio.
- Infraestrutura não decide regra de mercado.
- Métodos mutáveis como `Array.push` não são permitidos no estado de domínio.

Estrutura conceitual sugerida:
- `core/domain`: entidades, regras, validações de negócio, funções puras
- `core/application`: orquestração de casos de uso
- `adapters/inbound`: HTTP/WS/CLI
- `adapters/outbound`: armazenamento, filas, logs
- `views/projections`: materialized views para leitura rápida

---

## 5) Regra 4 — Contratos explícitos entre módulos
Toda fronteira precisa de contrato validado (Zod no padrão JS-first).

Fronteiras críticas:
- Cenário de entrada -> motor
- Comandos da UI -> aplicação
- Eventos do motor -> stream da UI
- Persistência -> replay

---

## 6) Regra 5 — Determinismo controlado
Para suportar teste e replay confiável:
- Controlar fonte de aleatoriedade por `seed`.
- Relógio de simulação definido por tick lógico (não por tempo de máquina).
- Mesmo cenário + mesma seed => mesmo resultado esperado.

---

## 7) Regra 6 — Observabilidade mínima desde o MVP
- Log estruturado por evento relevante.
- Correlação por `session_id`, `tick` e `participant_id` quando aplicável.
- Métricas mínimas: throughput de ordens, negócios por tick, spread médio, latência de processamento.

---

## 8) Não objetivos (por enquanto)
- Distribuição complexa em múltiplos serviços.
- Event sourcing “enterprise” completo com infraestrutura pesada.
- Otimização prematura de performance.

Foco inicial:
- Arquitetura limpa e pequena, com evolução segura.

---

## 9) Decisão oficial
Este projeto adota:
1. UI desacoplada por protocolo.
2. Fatos imutáveis + projeções derivadas.
3. Domínio puro e testável, separado de interfaces e infraestrutura.
