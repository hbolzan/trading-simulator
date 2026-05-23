# Trading Simulator

Simulador de mercado de ativos com foco educacional.

A proposta é modelar um mercado sintético com participantes autônomos (varejo, institucional e market maker), para estudar formação de preço, liquidez, risco e comportamento de mercado de forma prática e iterativa.

## Objetivos do projeto

- Simular formação de preço por interação entre agentes
- Estudar dinâmica de liquidez e spread
- Produzir artefatos de análise (eventos, trades, candles)
- Evoluir para modo interativo com usuário operando em tempo real
- Servir como base para explicações educacionais (incluindo análise de decisões)

## Status atual

Atualmente o projeto já possui:

- Motor de simulação em Deno
- Sessão determinística por seed e ticks lógicos
- Book simplificado com matching
- Persistência configurável por adapter (`file`, `postgres`, `both`)
- Geração de:
  - `events.jsonl`
  - `trades.csv`
  - `candles.csv`
  - `viewer.html` (visualização offline)
- Regras iniciais de risco/contabilidade
- Market maker com comportamento refinado por estados de risco

## Arquitetura (resumo)

- `motor/` → núcleo executável da simulação
- `documentos/` → especificações, roadmap e decisões de produto/arquitetura

No motor:

- `src/core` → regras de domínio e casos de uso
- `src/simulation` → engine de simulação por tick
- `src/contracts` → schemas/contratos de dados
- `src/adapters` → entrada/saída (persistência, CLI etc.)
- `src/projections` → geração de visões derivadas (candles, viewer)

## Stack

- Runtime: Deno
- Linguagem: JavaScript (JS-first)
- Validação de contratos: Zod
- Banco local: PostgreSQL (via Docker)

## Como rodar localmente

Pré-requisitos:

- Docker e Docker Compose
- Deno

Passo a passo:

1. Criar `.env` local:

   `cp .env.example .env`

2. Subir PostgreSQL local:

   `docker compose up -d postgres`

3. Rodar checks:

   `cd motor && deno task check`

4. Rodar simulação local com `.env` compartilhado:

   `deno task dev:local`

Ao final, o resumo da sessão mostra os caminhos dos artefatos gerados.

## Roadmap

O plano de execução por sprint está em:

- `documentos/todo-roadmap-v1.md`
- `documentos/roadmap-execucao-v1.md`

## Documentação importante

- Estado da ideia: `documentos/estado-atual.md`
- Regras de mercado v1: `documentos/regras-mercado-v1.md`
- Contratos de dados v1: `documentos/contratos-dados-v1.md`
- Princípios arquiteturais: `documentos/principios-arquiteturais.md`
- Padrão técnico JS-first: `documentos/padrao-tecnico-js-first.md`
- Guia de estrutura de pastas: `documentos/guia-estrutura-pastas-v1.md`
- Market maker para iniciantes: `documentos/market-maker-para-iniciantes.md`

## Próxima etapa

Sprint 4:

- projeções materializadas de leitura rápida
- replay determinístico de sessão
