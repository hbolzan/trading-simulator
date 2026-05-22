# Regras do Mercado v1 (MVP)

## 1) Objetivo deste documento
Definir as regras mínimas e claras do mercado simulado para a primeira versão funcional.

Princípios do v1:
- Simples o suficiente para implementar rápido.
- Coerente o suficiente para gerar comportamento plausível.
- Focado no objetivo educacional (dinâmica de preço e liquidez).

---

## 2) Escopo do v1
Ativos no MVP:
- Índice de referência sintético (`INDICE_REF`)
- Derivativo de mini índice (`MINI_IND`) vinculado ao índice
- (Opcional) 1 ação sintética para testes de correlação

Participantes no MVP:
- Varejo especulador
- Institucional genérico
- Market maker

Fora do v1:
- Arbitrador completo
- Derivativos com margem realista e ajuste diário completo
- Custos e tributos detalhados

---

## 3) Entidades obrigatórias

## 3.1 Ativo
Campos mínimos:
- `id`
- `ticker`
- `tipo` (`indice`, `derivativo`, `acao`)
- `preco_inicial`
- `tick_size`
- `lote_minimo`
- `liquidez_base`
- `volatilidade_base`
- `subjacente_id` (obrigatório para derivativo)

## 3.2 Participante
Campos mínimos:
- `id`
- `tipo` (`varejo`, `institucional`, `market_maker`)
- `capital`
- `posicoes` (por ativo)
- `apetite_risco`
- `medo`
- `euforia`
- `ansiedade`
- `nivel_conhecimento`
- `estrategia_base`

## 3.3 Ordem
Campos mínimos:
- `id`
- `participante_id`
- `ativo_id`
- `lado` (`compra`, `venda`)
- `tipo_ordem` (`mercado`, `limite`)
- `preco_limite` (obrigatório para limite)
- `quantidade`
- `timestamp_tick`

## 3.4 Negócio executado
Campos mínimos:
- `id`
- `ativo_id`
- `preco_execucao`
- `quantidade`
- `agressor_lado`
- `tick`

---

## 4) Sessão de mercado

## 4.1 Estrutura temporal
- A simulação roda em **ticks discretos**.
- Cada tick representa uma unidade de tempo sintético.
- Uma sessão padrão possui `N` ticks (ex.: 1.000).

## 4.2 Estado inicial
Regra v1:
- Todos os participantes começam **sem posição**.
- Todos começam com capital inicial definido por faixa do perfil.
- Preço inicial dos ativos vem de `preco_inicial`.

Justificativa:
- Facilita leitura causal do movimento de preço desde o início.

---

## 5) Geração de ordens por participante
Em cada tick, cada participante pode:
- Não agir
- Enviar ordem de compra
- Enviar ordem de venda

A decisão depende de:
- Tipo do participante
- Estado da carteira (capital/posição)
- Estado recente do mercado (retorno, volatilidade curta, spread)
- Atributos comportamentais (medo/euforia/ansiedade/conhecimento)

Restrições mínimas:
- Não vender além da posição (sem short no v1, salvo se habilitado explicitamente).
- Não comprar sem capital suficiente.
- Quantidade respeita `lote_minimo`.

---

## 6) Livro de ofertas e execução

## 6.1 Book simplificado
Para cada ativo, manter:
- Fila de compras por maior preço e prioridade de tempo.
- Fila de vendas por menor preço e prioridade de tempo.

## 6.2 Regras de matching
1. Ordem a mercado executa contra melhor preço disponível do lado oposto.
2. Ordem limite executa se cruzar spread atual.
3. Se não houver liquidez suficiente, executa parcial e restante fica no book (se limite) ou cancela restante (se mercado, no v1).
4. Preço do negócio = preço da ordem passiva no book (regra padrão de prioridade de livro).

## 6.3 Último preço
- O último preço negociado (`last`) é atualizado a cada negócio.
- Se não houver negócios no tick, `last` permanece.

---

## 7) Formação de candles

Janela de agregação definida por `candles_a_cada_X_ticks`.
Para cada janela e ativo:
- `open`: primeiro preço negociado da janela (ou último preço anterior se não houver negócio)
- `high`: maior preço negociado
- `low`: menor preço negociado
- `close`: último preço negociado (ou último preço anterior)
- `volume`: soma das quantidades executadas

Saída obrigatória por candle:
- OHLCV
- Tick inicial e final da janela

---

## 8) Regras comportamentais mínimas por tipo

## 8.1 Varejo
- Frequência de atuação maior em movimentos recentes fortes.
- Propensão a perseguir preço cresce com euforia/ansiedade.
- `nivel_conhecimento` baixo aumenta erros (entradas tardias e stops ruins).

## 8.2 Institucional
- Atua em blocos maiores, com objetivo de acumular/distribuir ao longo de faixa de preço.
- Evita impactar preço de forma extrema em um único tick.
- Pode fracionar ordens para reduzir impacto.

## 8.3 Market maker
Objetivo:
- Manter liquidez mínima e spread dentro de faixa alvo.

Regras v1:
1. Sempre que possível, manter simultaneamente 1 oferta de compra e 1 de venda.
2. Ajustar preços em torno de um preço de referência (último preço).
3. Aumentar spread quando volatilidade curta subir.
4. Reduzir tamanho de lote quando risco de inventário aumentar.
5. Limitar posição líquida (inventário máximo absoluto).

Resultado esperado:
- Menos “vazios” no book e continuidade da formação de preço.

---

## 9) Risco e limites (MVP)
Limites obrigatórios:
- Capital nunca pode ficar negativo.
- Sem alavancagem no v1 (a menos que cenário habilite explicitamente).
- Limite de posição por participante por ativo.
- Limite de ordem por tick para evitar explosão de atividade.

Tratamento de violação:
- Ordem inválida é rejeitada e registrada em log.

---

## 10) Métricas e saídas obrigatórias
Ao final da sessão, gerar:
- Série de candles por ativo
- Fita de negócios (time and sales sintético)
- Snapshot final do book (opcional no v1, recomendado)
- Posição final e PnL por participante
- Estatísticas agregadas:
  - volume total
  - número de negócios
  - volatilidade realizada
  - spread médio

---

## 11) Parâmetros padrão sugeridos (inicial)
- Participantes: 500 a 2.000
- Proporção: 88% varejo, 10% institucional, 2% market maker
- Ticks por sessão: 1.000
- Candle: 10 ticks
- Sem arbitrador
- Sem short selling
- Sem alavancagem

Observação:
Esses parâmetros são ponto de partida didático; serão calibrados por experimento.

---

## 12) Critérios de aceite do Mercado v1
Considerar v1 pronto quando:
1. O motor gera sessão completa sem inconsistência contábil.
2. Há candles coerentes (OHLCV) para todo o período.
3. Market maker evita book vazio na maior parte da sessão.
4. Diferenças de comportamento entre varejo e institucional são observáveis.
5. Usuário consegue interpretar narrativas de preço/liquidez no replay.

---

## 13) Limitações conhecidas do v1
- Realismo parcial da microestrutura.
- Sem modelagem completa de custos reais e regulamentação.
- Sem arbitragem robusta.
- Sem eventos macroeconômicos complexos.

Essas limitações são aceitáveis para o objetivo educacional da primeira versão.
