# Simulador de Mercado de Ativos — Estado Atual da Ideia

## 1) Visão do produto
Criar uma plataforma de simulação de mercado com foco **educacional**, onde o usuário entende como preços se movem a partir da interação entre diferentes participantes.

Objetivo central:
- Simular formação de preço de forma orgânica.
- Permitir testar hipóteses de comportamento de mercado (ex.: ciclos de Wyckoff).
- Evoluir para um modo em que o usuário entra como trader em tempo real.

---

## 2) Viabilidade (resposta objetiva)
Sim, a ideia é viável.

É um problema complexo, mas perfeitamente construível em etapas:
1. **MVP fechado** (sem usuário operando): mercado sintético com agentes automatizados.
2. **MVP visual**: exibição de candles e book simplificado.
3. **Interação humana**: usuário envia ordens em tempo real.
4. **Refinamento comportamental**: emoções, regimes de mercado e padrões avançados.

---

## 3) Escopo inicial (MVP documental)
Nesta primeira fase, o simulador será focado em:
- **Ações**
- **Índices de referência**
- **Derivativos** (inicialmente com modelagem simples, ligados a ativo/índice subjacente)

Fora do MVP (por enquanto):
- Arbitragem sofisticada
- Investidor de longo prazo com carteira multiativos completa
- Microestrutura avançada de bolsa real

---

## 4) Catálogo de ativos (modelo inicial)

## 4.1 Tipos
1. **Ação**
   - Representa fração de empresa.
   - Oferta limitada de papéis em circulação.
   - Pode pagar dividendos (opcional no MVP).

2. **Índice de referência**
   - Cesta sintética (ex.: IBOV, S&P 500, NASDAQ).
   - No simulador pode funcionar como ativo negociável para simplificar o estudo.

3. **Derivativo**
   - Contrato associado a um subjacente (ação ou índice).
   - Exemplo foco inicial: contrato futuro de mini índice.
   - No começo, comportamento semelhante ao ativo comum, mas com campo obrigatório de vínculo ao subjacente.

## 4.2 Propriedades mínimas por ativo
- `id`
- `tipo_ativo` (acao, indice, derivativo)
- `ticker`
- `preco_referencia_inicial`
- `lote_minimo`
- `ativo_subjacente` (obrigatório para derivativo)
- `volatilidade_base`
- `liquidez_base`
- `paga_dividendo` (sim/não)

---

## 5) Participantes do mercado

## 5.1 Tipos iniciais
1. **Varejo (pessoa física especuladora)**
   - Muitos em quantidade.
   - Capital menor.
   - Objetivo: lucro de curto prazo (day trade).

2. **Institucional (genérico)**
   - Poucos em quantidade.
   - Capital alto.
   - Objetivos de montar/desmontar posição em faixas de preço e tempo.

3. **Market maker**
   - Provedor de liquidez.
   - Mantém ofertas de compra e venda com spread alvo.
   - Ajuda a reduzir “buracos” no book.

4. **Arbitrador**
   - Detecta distorções entre ativos correlacionados.
   - **Planejado para fase posterior** (não obrigatório no MVP).

## 5.2 Proporções iniciais sugeridas
(Parâmetros ajustáveis por cenário)
- 80% a 92% varejo
- 5% a 15% institucionais
- 2% a 5% market makers
- 0% arbitradores no MVP inicial

## 5.3 Atributos de participante
- `capital_disponivel`
- `apetite_risco`
- `horizonte_operacao`
- `nivel_conhecimento`
- `disciplina`
- `medo`
- `euforia`
- `ansiedade`
- `estrategia_base`

Observação: esses atributos devem influenciar frequência de trade, tamanho de posição, stop, perseguição de preço e propensão a erro.

---

## 6) Mecânica de simulação (versão simples)
1. Inicializar ativos e participantes.
2. Definir estado inicial:
   - Opção A: todos sem posição.
   - Opção B: pequena parcela com posições iniciais.
   - Recomendação para início: **Opção A** (mais simples e rastreável).
3. Rodar ciclos de tempo discretos (ticks).
4. Cada participante decide ação: comprar, vender, esperar.
5. Ordens entram no motor de execução (book simplificado).
6. Negócios fechados atualizam último preço.
7. Agregar negócios em candles por janela de tempo.
8. Repetir até encerrar sessão simulada.

---

## 7) Visualização e experiência
Saída mínima esperada no MVP:
- Série de candles em tempo de simulação.
- Volume por candle.
- Último preço e variação.

Evolução planejada:
- Usuário entrar como participante humano em tempo real.
- Painel de ordens (compra/venda), posição, PnL e risco.

---

## 8) Wyckoff no contexto do simulador
A proposta não é “desenhar Wyckoff artificialmente”, mas permitir que padrões apareçam por interação entre agentes com objetivos e limitações diferentes.

Hipótese de trabalho:
- Com combinação de liquidez, desequilíbrio entre agressão compradora/vendedora, atuação institucional e comportamento emocional do varejo, fases compatíveis com acumulação/distribuição podem emergir.

---

## 9) Critérios de sucesso da fase 1 (sem código ainda)
- Escopo inicial definido e documentado.
- Tipos de ativos e participantes definidos.
- Ciclo de simulação descrito de ponta a ponta.
- Premissas para implementação futura registradas.

---

## 10) Decisões atuais registradas
- Foco inicial em day trade de mini índice e ativos relacionados.
- Arbitradores ficam fora da primeira versão funcional.
- Market makers entram desde o início para sustentar liquidez.
- Começar com regras simples e evoluir por camadas.
- Padrão técnico do MVP: **JavaScript first com tipagem progressiva**.
- Validação de contratos e entradas críticas com **Zod**.
- Runtime oficial do MVP: **Deno**.
- Interface visual totalmente desacoplada do motor por contratos externos (HTTP + eventos via WebSocket).
- Dados históricos tratados como fatos imutáveis (append-only), com projeções/materialized views para leitura e performance.
- Lógica de domínio em funções puras, separada de controllers/adapters e infraestrutura.
- Regra de implementação: domínio com estruturas imutáveis; sem métodos mutáveis como `Array.push`.

## 11) Documentos de referência
- Regras operacionais do mercado v1: `regras-mercado-v1.md`
- Padrão técnico JS-first + tipagem progressiva: `padrao-tecnico-js-first.md`
- Princípios arquiteturais: `principios-arquiteturais.md`
- Contratos de dados v1: `contratos-dados-v1.md`
- Stack tecnológica v1: `stack-tecnologica-v1.md`
- Guia de estrutura de pastas v1: `guia-estrutura-pastas-v1.md`
- Roadmap de execução v1: `roadmap-execucao-v1.md`
- Todo list de execução v1: `todo-roadmap-v1.md`
