# Market Maker para Iniciantes

## 1) O que é um market maker?
Um **market maker** é um participante do mercado que ajuda a manter a negociação fluindo.

Na prática, ele tenta deixar sempre duas ofertas no livro:
- uma oferta de **compra** (bid)
- uma oferta de **venda** (ask)

Isso melhora a liquidez e facilita que outras pessoas consigam comprar e vender sem “travar” o mercado.

---

## 2) O que ele ganha com isso?
De forma simples, ele busca ganhar no **spread**.

Spread é a diferença entre:
- preço que ele está disposto a comprar
- preço que ele está disposto a vender

Exemplo simples:
- Bid: 99,90
- Ask: 100,10
- Spread: 0,20

Se ele conseguir comprar perto de 99,90 e vender perto de 100,10, pode capturar parte dessa diferença.

---

## 3) Qual é o risco do market maker?
O principal risco é ficar com **inventário desequilibrado**.

Exemplo:
- Ele compra muito e vende pouco.
- Fica “comprado demais”.
- Se o preço cair forte, ele perde.

Por isso market maker não é “dinheiro fácil”.
Ele precisa controlar posição e risco o tempo todo.

---

## 4) Como ele se comporta no mercado real?
No dia a dia normal:
- mantém bid e ask ativos
- spread relativamente estável
- lotes razoáveis

Em estresse (mercado nervoso):
- aumenta spread
- reduz tamanho das ordens
- pode cotar de forma mais defensiva
- em casos extremos, pode pausar temporariamente para não quebrar o risco

---

## 5) Como modelamos no nosso simulador?
No simulador, o market maker tem estados simples:

1. **NORMAL**
- spread menor
- lote normal
- liquidez contínua

2. **DEFENSIVO**
- spread maior
- lote menor
- começa quando risco/inventário sobem

3. **STRESS**
- spread bem mais aberto
- lote pequeno
- se inventário passar limite crítico, entra em cooldown curto (pausa temporária)

Além disso:
- se estiver muito comprado, ele ajusta cotação para vender mais fácil
- se estiver muito vendido, ajusta para recomprar mais fácil

---

## 6) Exemplo didático
Imagine preço de referência em 100,00:

Cenário A (normal):
- compra em 99,90
- vende em 100,10

Cenário B (defensivo):
- compra em 99,80
- vende em 100,20

Cenário C (stress):
- compra em 99,60
- vende em 100,40
- se posição estourar limite, pausa por alguns ticks

Resultado esperado:
- em estresse, liquidez diminui e spread abre
- preço fica mais “escorregadio”
- depois que o risco cai, market maker volta a prover liquidez mais firme

---

## 7) Por que isso é importante para o aprendizado?
Porque ajuda a entender que:
- preço não se move “sozinho”
- liquidez muda com risco
- em momentos tensos, o mercado pode parecer “seco”
- spread e profundidade do book influenciam muito a execução

Esse comportamento deixa o simulador mais próximo da dinâmica real de mercado.
