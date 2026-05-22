# Stack Tecnológica v1

## 1) Decisão oficial
A stack do MVP será baseada em **Deno**.

Escolha definida:
- Runtime: **Deno**
- Linguagem base: **JavaScript (JS-first)**
- Tipagem progressiva: `JSDoc` + contratos críticos
- Validação de contratos: **Zod**
- Estilo de domínio: **funcional com dados imutáveis**

---

## 2) Por que Deno faz sentido aqui
1. Setup simples para começar rápido.
2. Ferramentas integradas de runtime (test/lint/format) sem excesso de configuração.
3. Boa experiência para APIs HTTP e streaming de eventos.
4. Opção de deploy integrada, alinhada ao plano de evolução do produto.

---

## 3) Desvantagens relevantes (sem dramatização)
1. Ecossistema menor que Node.js em algumas bibliotecas específicas.
2. Alguns exemplos/comunidade ainda são mais abundantes em Node.
3. Pode haver ajuste em libs que assumem APIs específicas de Node.

Conclusão prática:
- Para este MVP, as desvantagens são administráveis.
- A arquitetura desacoplada reduz lock-in: se necessário, migração futura é viável.

---

## 4) Stack por camada (v1)

Domínio e simulação:
- JavaScript puro
- Funções puras
- Estruturas imutáveis

Contratos e validação:
- Zod para validar payloads de entrada/saída

Interface de integração do motor:
- HTTP para comando/consulta
- WebSocket para eventos em tempo real

Persistência inicial:
- Event log append-only (arquivo/local no início)
- Projeções materializadas para leitura rápida

---

## 5) Regras de implementação obrigatórias
1. Não usar mutação em estado de domínio compartilhado.
2. Não usar métodos mutáveis como `Array.push` no core.
3. Separar domínio puro de adapters de I/O.
4. Toda fronteira externa passa por validação de contrato.
5. Reprodutibilidade por `seed` e `tick` lógico.

---

## 6) Critério de revisão de PR (quando começarmos código)
Um PR do core só será aceito se:
- Mantiver função pura no domínio.
- Preservar imutabilidade de estado.
- Não introduzir acoplamento de UI no motor.
- Passar validação de contratos nas fronteiras.

---

## 7) Resumo executivo
A decisão por **Deno + JS-first + Zod + arquitetura funcional imutável** equilibra:
- velocidade de construção,
- clareza de código,
- segurança de contratos,
- e preparação para escalar o produto.
