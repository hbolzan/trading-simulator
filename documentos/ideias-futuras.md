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

## 9) Coach inteligente pós-trade (LLM mediado pelo backend)
- Objetivo: após operações do usuário (principalmente perdas relevantes), gerar feedback educacional objetivo sobre decisão, risco e contexto de mercado.
- Fluxo proposto:
  - Backend coleta dados da operação (entrada, saída, tamanho, risco, stop, contexto de execução).
  - Backend coleta contexto de mercado pertinente (tendência local, volatilidade, liquidez, eventos do período, posição do usuário).
  - Backend monta prompt estruturado e envia ao LLM.
  - Backend aplica validação/guardrails na resposta e retorna feedback didático para a UI.
- Regra de produto: usuário não conversa diretamente com o LLM; apenas recebe análises mediadas pelo sistema.
- Benefícios:
  - Controle de custo e janela de contexto.
  - Padronização de qualidade das respostas.
  - Menor risco de respostas fora de escopo.
- Casos de uso iniciais:
  - “Por que esta operação teve loss?”
  - “Qual foi o principal erro técnico/comportamental?”
  - “Como reduzir risco em operação semelhante no futuro?”
- Requisitos técnicos:
  - Pipeline de contexto (feature builder) com dados mínimos por trade.
  - Templates de prompt versionados por objetivo didático.
  - Cache de análises por trade/sessão para reduzir custo.
  - Telemetria de uso (latência, custo por análise, taxa de aceitação do feedback).
- Governança e segurança:
  - Não enviar segredos/chaves para a UI.
  - Anonimizar dados sensíveis quando aplicável.
  - Limites de orçamento por usuário/sessão.
- Estratégia de modelos:
  - Suportar provedor plugável (`provider adapter`) para trocar modelo sem acoplamento.
  - DeepSeek pode ser uma opção de custo competitivo; manter fallback para outro provedor.
- Critérios de qualidade da resposta:
  - Explicação baseada em evidências do trade e do mercado (não genérica).
  - Linguagem clara, acionável e educativa.
  - Indicação explícita de incerteza quando contexto for insuficiente.
