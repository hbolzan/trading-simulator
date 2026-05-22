# Padrão Técnico — JS-first com Tipagem Progressiva

## 1) Objetivo
Definir um padrão de desenvolvimento que mantenha o código simples de ler (JavaScript), sem abrir mão de segurança nos pontos críticos do domínio.

Decisão:
- Base do projeto em **JavaScript (Node.js)**.
- Tipagem adicionada **progressivamente**, só onde gera valor real.
- Validação de entrada/saída em runtime com **Zod**.

---

## 2) O que é Zod?
**Zod** é uma biblioteca de validação de dados em runtime.

Em termos práticos:
- Você descreve o formato esperado de um objeto (schema).
- O Zod valida se os dados recebidos respeitam esse formato.
- Se os dados estiverem inválidos, ele retorna erros claros.

Por que isso importa no simulador:
- O motor vai receber muitos dados configuráveis (ativos, participantes, parâmetros de sessão).
- Sem validação, um campo errado pode quebrar a simulação no meio.
- Com Zod, erros aparecem cedo, com mensagens úteis.

Resumo curto:
- TypeScript protege em tempo de desenvolvimento.
- **Zod protege em tempo de execução**.
- Em JS-first, Zod vira a principal rede de segurança para fronteiras do sistema.

---

## 3) Por que este meio termo foi escolhido
Vantagens para este projeto:
- Código mais enxuto e legível para iteração rápida.
- Menos overhead inicial de tipos em tudo.
- Segurança concentrada onde há maior risco (input/configuração/eventos).
- Facilidade para evoluir para TypeScript mais estrito no futuro, se necessário.

Trade-off aceito:
- Menor cobertura de tipos estáticos global no início.
- Compensação com validação de runtime e disciplina de contratos.

---

## 4) Regra prática de uso de tipos

## 4.1 Onde tipar/validar obrigatoriamente
1. Entrada de configuração de simulação.
2. Entidades de domínio críticas:
   - Ativo
   - Participante
   - Ordem
   - Negócio executado
   - Candle
3. Eventos trocados entre módulos (motor -> agregador -> saída).
4. Persistência/replay (leitura e escrita de snapshots).

## 4.2 Onde manter flexível no início
- Scripts auxiliares.
- Ferramentas de análise exploratória.
- Transformações não críticas de visualização.

---

## 5) Convenções de qualidade para JS-first
1. Usar `JSDoc` em funções de domínio central.
2. Evitar objetos “soltos”; preferir fábricas/construtores com validação.
3. Não aceitar `any` implícito em fronteiras críticas.
4. Toda entrada externa deve passar por schema.
5. Mensagens de erro devem orientar correção (campo, valor recebido, valor esperado).

---

## 6) Padrão de fronteiras (importante)
Toda fronteira do sistema deve ter validação explícita.

Fronteiras no simulador:
- Arquivo de cenário -> motor
- Motor -> gerador de eventos
- Eventos -> agregador OHLCV
- Saída final -> armazenamento/replay

Se um payload falhar na validação:
- Rejeitar processamento daquele item.
- Registrar erro estruturado no log.
- Não corromper o estado global da sessão.

---

## 7) Fases de adoção

Fase 1 (MVP):
- JavaScript puro no core.
- Zod nos contratos de entrada/saída.
- JSDoc nos módulos de domínio.

Fase 2:
- Tipagem progressiva adicional em módulos críticos (book, matching, risco).
- Maior cobertura de testes de contrato.

Fase 3 (se necessário):
- Migração seletiva de arquivos críticos para TypeScript estrito.

---

## 8) Critérios de aceite deste padrão
- Time consegue iterar rápido sem inflar complexidade.
- Erros de configuração são detectados antes do loop principal.
- Contratos críticos permanecem estáveis entre módulos.
- Refatorações não quebram silenciosamente o motor.

---

## 9) Decisão oficial do projeto
Para o MVP do simulador de mercado, o padrão oficial é:
**JavaScript first + tipagem progressiva + validação de runtime com Zod.**
