import { participantsSchema } from '../../contracts/schemas/participant.schema.js';
import { orderSchema } from '../../contracts/schemas/order.schema.js';
import { tradesSchema } from '../../contracts/schemas/trade.schema.js';
import { buildEvent } from '../../shared/utils/build-event.js';
import { nextRandom } from '../../adapters/outbound/random/seeded-rng.js';
import { createEmptyBook, processOrder } from './order-book.js';

const defaultConfig = {
  participantsCount: 50,
  initialPrice: 100,
  tickSize: 0.5,
};

const safeConfig = (rawConfig) => ({
  participantsCount: rawConfig?.participantsCount ?? defaultConfig.participantsCount,
  initialPrice: rawConfig?.initialPrice ?? defaultConfig.initialPrice,
  tickSize: rawConfig?.tickSize ?? defaultConfig.tickSize,
});

const chooseParticipantType = (value) => {
  if (value < 0.86) {
    return 'retail';
  }

  if (value < 0.96) {
    return 'institutional';
  }

  return 'market_maker';
};

const generateParticipant = ({ seedState }) => {
  const randomType = nextRandom(seedState);
  const randomActivity = nextRandom(randomType.nextSeed);
  const randomCapital = nextRandom(randomActivity.nextSeed);

  const type = chooseParticipantType(randomType.value);
  const activityBase = type === 'retail' ? 0.18 : type === 'institutional' ? 0.11 : 0.35;
  const capitalBase = type === 'retail' ? 20_000 : type === 'institutional' ? 1_200_000 : 300_000;

  const participant = {
    participant_id: crypto.randomUUID(),
    type,
    capital: capitalBase + Math.round(randomCapital.value * 10_000),
    activity_level: Math.min(0.95, activityBase + randomActivity.value * 0.12),
  };

  return {
    participant,
    nextSeed: randomCapital.nextSeed,
  };
};

const generateParticipants = ({ count, seed }) => {
  let nextSeed = seed;
  const participants = [];

  for (let index = 0; index < count; index += 1) {
    const created = generateParticipant({
      seedState: nextSeed,
    });

    participants[participants.length] = created.participant;
    nextSeed = created.nextSeed;
  }

  const validatedParticipants = participantsSchema.parse(participants);

  return {
    participants: validatedParticipants,
    nextSeed,
  };
};

const createOrderFromDecision = ({
  session,
  participant,
  tick,
  currentPrice,
  tickSize,
  randomSeed,
  sequence,
}) => {
  const randomSide = nextRandom(randomSeed);
  const randomPriceShift = nextRandom(randomSide.nextSeed);
  const randomQuantity = nextRandom(randomPriceShift.nextSeed);

  const side = randomSide.value < 0.5 ? 'buy' : 'sell';
  const shiftLevels = Math.floor(randomPriceShift.value * 5) - 2;
  const shiftedPrice = currentPrice + (shiftLevels * tickSize);
  const safePrice = Math.max(tickSize, Number(shiftedPrice.toFixed(2)));
  const quantity = Math.max(1, Math.floor(randomQuantity.value * 5));

  const order = orderSchema.parse({
    order_id: crypto.randomUUID(),
    session_id: session.session_id,
    participant_id: participant.participant_id,
    tick,
    side,
    price: safePrice,
    quantity,
    remaining_quantity: quantity,
    sequence,
  });

  return {
    order,
    nextSeed: randomQuantity.nextSeed,
  };
};

const participantLedgerFromParticipants = (participants) => {
  const ledger = new Map();

  for (const participant of participants) {
    const initialPosition = participant.type === 'market_maker'
      ? 200
      : participant.type === 'institutional'
      ? 50
      : 0;

    ledger.set(participant.participant_id, {
      participant_id: participant.participant_id,
      cash: participant.capital,
      position: initialPosition,
    });
  }

  return ledger;
};

const canSubmitOrder = ({ account, order }) => {
  if (order.side === 'buy') {
    return account.cash >= order.price * order.quantity;
  }

  return account.position >= order.quantity;
};

const getLedgerAccount = (ledger, participantId) => ledger.get(participantId);

const setLedgerAccount = (ledger, participantId, nextAccount) => {
  ledger.set(participantId, nextAccount);
};

const reserveForOrder = ({ ledger, order }) => {
  const account = getLedgerAccount(ledger, order.participant_id);

  if (order.side === 'buy') {
    setLedgerAccount(ledger, order.participant_id, {
      ...account,
      cash: account.cash - (order.price * order.quantity),
    });
    return;
  }

  setLedgerAccount(ledger, order.participant_id, {
    ...account,
    position: account.position - order.quantity,
  });
};

const updateOpenOrderEntry = (openOrders, order, originalOrder) => {
  openOrders.set(order.order_id, {
    order,
    originalOrder,
  });
};

const settleTradeForOrder = ({ ledger, openOrderEntry, trade, side }) => {
  const participantId = openOrderEntry.order.participant_id;
  const account = getLedgerAccount(ledger, participantId);
  const tradedQuantity = trade.quantity;

  if (side === 'buy') {
    const reservedAtOrderPrice = openOrderEntry.originalOrder.price * tradedQuantity;
    const executedAtTradePrice = trade.price * tradedQuantity;
    const refund = reservedAtOrderPrice - executedAtTradePrice;

    setLedgerAccount(ledger, participantId, {
      ...account,
      cash: account.cash + refund,
      position: account.position + tradedQuantity,
    });
    return;
  }

  setLedgerAccount(ledger, participantId, {
    ...account,
    cash: account.cash + (trade.price * tradedQuantity),
  });
};

const settleTrades = ({ ledger, openOrders, trades }) => {
  for (const trade of trades) {
    const buyEntry = openOrders.get(trade.buy_order_id);
    const sellEntry = openOrders.get(trade.sell_order_id);

    settleTradeForOrder({
      ledger,
      openOrderEntry: buyEntry,
      trade,
      side: 'buy',
    });

    settleTradeForOrder({
      ledger,
      openOrderEntry: sellEntry,
      trade,
      side: 'sell',
    });
  }
};

const releaseReservationsForRemovedOrders = ({ ledger, openOrders, activeOrderIds }) => {
  for (const [orderId, entry] of openOrders.entries()) {
    if (activeOrderIds.has(orderId)) {
      continue;
    }

    const account = getLedgerAccount(ledger, entry.order.participant_id);
    const remainingQuantity = entry.order.remaining_quantity;

    if (entry.order.side === 'buy') {
      setLedgerAccount(ledger, entry.order.participant_id, {
        ...account,
        cash: account.cash + (remainingQuantity * entry.originalOrder.price),
      });
      continue;
    }

    setLedgerAccount(ledger, entry.order.participant_id, {
      ...account,
      position: account.position + remainingQuantity,
    });
  }
};

const rebuildOpenOrders = ({ previousOpenOrders, book }) => {
  const activeOrders = [...book.bids, ...book.asks];
  const nextOpenOrders = new Map();

  for (const order of activeOrders) {
    const previous = previousOpenOrders.get(order.order_id);
    const originalOrder = previous ? previous.originalOrder : order;
    updateOpenOrderEntry(nextOpenOrders, order, originalOrder);
  }

  return nextOpenOrders;
};

const validateAccounting = (ledger) =>
  Array.from(ledger.values()).every((account) => account.cash >= 0 && account.position >= 0);

const appendEvent = (events, event) => {
  events[events.length] = event;
};

const appendEvents = (events, additionalEvents) => {
  for (const event of additionalEvents) {
    events[events.length] = event;
  }
};

const appendTrades = (trades, additionalTrades) => {
  for (const trade of additionalTrades) {
    trades[trades.length] = trade;
  }
};

export const runSimulation = ({ session, occurredAt, config }) => {
  const simulationConfig = safeConfig(config);

  const participantsResult = generateParticipants({
    count: simulationConfig.participantsCount,
    seed: session.seed,
  });

  const participants = participantsResult.participants;
  const events = [];
  const trades = [];

  let seed = participantsResult.nextSeed;
  let book = createEmptyBook(simulationConfig.initialPrice);
  let ordersCount = 0;
  let rejectedOrdersCount = 0;
  let sequence = 0;

  const participantLedger = participantLedgerFromParticipants(participants);
  let openOrders = new Map();

  for (let tick = 1; tick <= session.max_ticks; tick += 1) {
    const tickEvent = buildEvent({
      eventType: 'TickAdvanced',
      sessionId: session.session_id,
      tick,
      occurredAt,
      payload: { tick },
    });

    appendEvent(events, tickEvent);

    for (const participant of participants) {
      const randomDecision = nextRandom(seed);
      seed = randomDecision.nextSeed;

      const shouldSubmitOrder = randomDecision.value < participant.activity_level;
      if (!shouldSubmitOrder) {
        continue;
      }

      const createdOrder = createOrderFromDecision({
        session,
        participant,
        tick,
        currentPrice: book.last_price,
        tickSize: simulationConfig.tickSize,
        randomSeed: seed,
        sequence: sequence + 1,
      });

      seed = createdOrder.nextSeed;
      sequence += 1;

      const participantAccount = getLedgerAccount(
        participantLedger,
        createdOrder.order.participant_id,
      );

      if (!canSubmitOrder({ account: participantAccount, order: createdOrder.order })) {
        const rejectedEvent = buildEvent({
          eventType: 'OrderRejected',
          sessionId: session.session_id,
          tick,
          occurredAt,
          payload: {
            order_id: createdOrder.order.order_id,
            participant_id: createdOrder.order.participant_id,
            reason: createdOrder.order.side === 'buy'
              ? 'INSUFFICIENT_CASH'
              : 'INSUFFICIENT_POSITION',
            side: createdOrder.order.side,
            price: createdOrder.order.price,
            quantity: createdOrder.order.quantity,
          },
        });

        rejectedOrdersCount += 1;
        appendEvent(events, rejectedEvent);
        continue;
      }

      reserveForOrder({
        ledger: participantLedger,
        order: createdOrder.order,
      });

      updateOpenOrderEntry(openOrders, createdOrder.order, createdOrder.order);

      const orderEvent = buildEvent({
        eventType: 'OrderSubmitted',
        sessionId: session.session_id,
        tick,
        occurredAt,
        payload: {
          order_id: createdOrder.order.order_id,
          participant_id: createdOrder.order.participant_id,
          side: createdOrder.order.side,
          price: createdOrder.order.price,
          quantity: createdOrder.order.quantity,
        },
      });

      appendEvent(events, orderEvent);

      const processed = processOrder({
        book,
        incomingOrder: createdOrder.order,
      });

      settleTrades({
        ledger: participantLedger,
        openOrders,
        trades: processed.trades,
      });

      const activeOrderIds = new Set(
        [...processed.book.bids, ...processed.book.asks].map((order) => order.order_id),
      );

      releaseReservationsForRemovedOrders({
        ledger: participantLedger,
        openOrders,
        activeOrderIds,
      });

      openOrders = rebuildOpenOrders({
        previousOpenOrders: openOrders,
        book: processed.book,
      });

      const tradeEvents = processed.trades.map((trade) =>
        buildEvent({
          eventType: 'TradeExecuted',
          sessionId: session.session_id,
          tick,
          occurredAt,
          payload: {
            trade_id: trade.trade_id,
            price: trade.price,
            quantity: trade.quantity,
            aggressor_side: trade.aggressor_side,
          },
        })
      );

      appendEvents(events, tradeEvents);
      appendTrades(trades, processed.trades);

      book = processed.book;
      ordersCount += 1;
    }
  }

  const validatedTrades = tradesSchema.parse(trades);
  const accountingConsistent = validateAccounting(participantLedger);

  return {
    session: {
      ...session,
      tick: session.max_ticks,
    },
    events,
    trades: validatedTrades,
    participants,
    ordersCount,
    rejectedOrdersCount,
    lastPrice: book.last_price,
    book,
    participantLedger: Object.fromEntries(participantLedger.entries()),
    accountingConsistent,
  };
};
