# Guia de Estrutura de Pastas v1 (Deno + Arquitetura Funcional)

## 1) Objetivo
Definir uma estrutura de pastas simples e escalável para iniciar o simulador com:
- domínio funcional e imutável,
- UI desacoplada por contratos,
- separação clara entre regras de negócio e I/O.

---

## 2) Estrutura proposta (v1)

```text
trading-simulator/
  documentos/
    ...

  motor/
    deno.json
    deps.js

    src/
      core/
        domain/
          entities/
          value-objects/
          rules/
          services/
        application/
          use-cases/
          ports/

      adapters/
        inbound/
          http/
          websocket/
          cli/
        outbound/
          event-store/
          projections-store/
          logger/
          random/
          clock/

      projections/
        builders/
        views/

      contracts/
        schemas/
        mappers/

      simulation/
        engine/
        scenarios/
        seeds/

      shared/
        errors/
        result/
        utils/

      main.js

    tests/
      unit/
      integration/
      contract/
      replay/
```

---

## 3) Responsabilidades por camada

## 3.1 `core/domain`
- Regras de mercado puras.
- Entidades e regras de evolução de estado.
- Sem acesso a rede, arquivo, banco, relógio real ou random global.

## 3.2 `core/application`
- Orquestra casos de uso.
- Coordena chamadas do domínio e portas.
- Mantém fluxo de comando/evento sem lógica de infraestrutura.

## 3.3 `adapters/inbound`
- Traduz entrada externa para comandos internos.
- Exemplos: endpoint HTTP, conexão WebSocket, CLI de manutenção.

## 3.4 `adapters/outbound`
- Implementa portas de saída: persistência, logging, clock, random, stream.
- Local de efeitos colaterais permitidos.

## 3.5 `contracts`
- Schemas de validação com Zod.
- Contratos de payload HTTP/WS e eventos internos.
- Conversão entre formato externo e modelo de domínio.

## 3.6 `projections`
- Constrói views materializadas a partir de eventos imutáveis.
- Exemplo: preço atual, OHLCV, posição e PnL consolidados.

## 3.7 `simulation`
- Loop por tick.
- Configuração de cenário e seed.
- Coordenação entre geração de decisões, ordens e matching.

---

## 4) Regras de implementação (obrigatórias)
1. Domínio com funções puras.
2. Estado imutável no core (sem mutação de arrays/objetos compartilhados).
3. Não usar métodos mutáveis como `Array.push` no estado de domínio.
4. Toda fronteira externa validada com Zod.
5. Eventos append-only como fonte da verdade.
6. Projeções descartáveis e reconstruíveis por replay.

---

## 5) Convenções de arquivos
- Um módulo por responsabilidade principal.
- Nomes descritivos e estáveis (ex.: `submit-order.use-case.js`).
- Evitar arquivos “genéricos demais” como `helpers.js` para regra de domínio.
- Dependências fluem de fora para dentro:
  - adapters -> application -> domain
  - domain não importa adapters.

---

## 6) Estratégia de testes por pasta
- `tests/unit`: regras puras do domínio.
- `tests/integration`: casos de uso com adapters fake.
- `tests/contract`: validação de payloads HTTP/WS/eventos.
- `tests/replay`: reconstrução de estado e determinismo com seed.

Critério central:
- Mesmo cenário + mesma seed deve produzir mesma sequência de eventos.

---

## 7) Sequência sugerida para implementação
1. Criar contratos (`contracts/schemas`) de Ativo, Participante, Ordem, Negócio, Candle.
2. Implementar núcleo do domínio (ordens, book simplificado, execução).
3. Implementar loop de simulação por tick.
4. Persistir eventos append-only.
5. Gerar projeções OHLCV e posição/PnL.
6. Expor API HTTP de sessão + stream WS de eventos.

---

## 8) Definição de pronto para “começar código”
Pode iniciar implementação quando:
- Contratos v1 estiverem congelados para MVP.
- Estrutura de pastas acima for aceita.
- Primeiros casos de uso forem definidos (`create-session`, `start-session`, `submit-order`).

Status atual:
- Documentação base já cobre os três pontos.

Conclusão:
- O projeto está pronto para começar a implementação do MVP.
