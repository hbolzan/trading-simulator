# Simulador de Mercado de Ativos — Ideias Futuras

## 1) Evoluções de ativos
- Incluir FII e ETF com regras próprias.
- Dividendos e eventos corporativos (split, agrupamento, bonificação).
- Derivativos com vencimento, ajuste diário e margem.
- Curva de juros sintética para impactar derivativos.

## 2) Evoluções de participantes
- Separar varejo por perfis:
  - Scalper
  - Day trader discricionário
  - Swing trader
  - Investidor acumulador
- Institucionais especializados:
  - Fundo quantitativo
  - Fundo passivo indexado
  - Gestor de fluxo
- Arbitradores estatísticos e de basis (spot x futuro).

## 3) Comportamento e psicologia
- Modelar gatilhos emocionais por perdas sequenciais e ganhos sequenciais.
- Adicionar viés cognitivo (ex.: aversão à perda, efeito manada).
- Modo “novato” com maior taxa de erro operacional.
- Aprendizagem adaptativa simples dos agentes (ajuste de agressividade).

## 4) Microestrutura e execução
- Livro de ofertas com múltiplos níveis.
- Tipos de ordem: limite, mercado, stop, stop-limit.
- Slippage e latência.
- Custos: corretagem, emolumentos, spread efetivo.

## 5) Cenários de mercado
- Regimes parametrizáveis:
  - Tendência de alta
  - Tendência de baixa
  - Lateralização
  - Volatilidade extrema
- Eventos exógenos simulados (notícias e choques).
- Calendário de sessões (abertura, almoço, fechamento, leilão).

## 6) Experiência educacional
- Modo tutorial por etapas.
- Missões de leitura de contexto (ex.: identificar fase de mercado).
- Replay com explicações de decisões dos agentes.
- Painel de métricas didáticas (liquidez, agressão, absorção).

## 7) Análises e métricas
- PnL por perfil de participante.
- Heatmap de liquidez e volume.
- Eficiência de execução por tipo de ordem.
- Métricas de estabilidade do mercado simulado.

## 8) Perguntas para validar antes de implementar
- Qual granularidade de tempo do motor (tick, 1s, 5s)?
- Quais parâmetros devem ser configuráveis pelo usuário no MVP?
- Qual nível mínimo de realismo necessário para o objetivo educacional?
- Quais sinais vão indicar que o comportamento emergente está “plausível”?
