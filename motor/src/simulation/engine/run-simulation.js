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
  const generation = Array.from({ length: count }).reduce(
    (accumulator) => {
      const created = generateParticipant({
        seedState: accumulator.seed,
      });

      return {
        participants: [...accumulator.participants, created.participant],
        seed: created.nextSeed,
      };
    },
    { participants: [], seed },
  );

  const validatedParticipants = participantsSchema.parse(
    generation.participants,
  );

  return {
    participants: validatedParticipants,
    nextSeed: generation.seed,
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

export const runSimulation = ({ session, occurredAt, config }) => {
  const simulationConfig = safeConfig(config);

  const participantsResult = generateParticipants({
    count: simulationConfig.participantsCount,
    seed: session.seed,
  });

  const simulationState = {
    seed: participantsResult.nextSeed,
    participants: participantsResult.participants,
    events: [],
    book: createEmptyBook(simulationConfig.initialPrice),
    trades: [],
    ordersCount: 0,
    sequence: 0,
  };

  const finalState = Array.from({ length: session.max_ticks }).reduce((accumulator, _, offset) => {
    const tick = offset + 1;

    const tickEvent = buildEvent({
      eventType: 'TickAdvanced',
      sessionId: session.session_id,
      tick,
      occurredAt,
      payload: { tick },
    });

    const tickInitial = {
      ...accumulator,
      events: [...accumulator.events, tickEvent],
    };

    return tickInitial.participants.reduce((tickAccumulator, participant) => {
      const randomDecision = nextRandom(tickAccumulator.seed);
      const shouldSubmitOrder = randomDecision.value < participant.activity_level;

      if (!shouldSubmitOrder) {
        return {
          ...tickAccumulator,
          seed: randomDecision.nextSeed,
        };
      }

      const createdOrder = createOrderFromDecision({
        session,
        participant,
        tick,
        currentPrice: tickAccumulator.book.last_price,
        tickSize: simulationConfig.tickSize,
        randomSeed: randomDecision.nextSeed,
        sequence: tickAccumulator.sequence + 1,
      });

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

      const processed = processOrder({
        book: tickAccumulator.book,
        incomingOrder: createdOrder.order,
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

      return {
        ...tickAccumulator,
        seed: createdOrder.nextSeed,
        sequence: tickAccumulator.sequence + 1,
        book: processed.book,
        events: [...tickAccumulator.events, orderEvent, ...tradeEvents],
        trades: [...tickAccumulator.trades, ...processed.trades],
        ordersCount: tickAccumulator.ordersCount + 1,
      };
    }, tickInitial);
  }, simulationState);

  const validatedTrades = tradesSchema.parse(finalState.trades);

  return {
    session: {
      ...session,
      tick: session.max_ticks,
    },
    events: finalState.events,
    trades: validatedTrades,
    participants: finalState.participants,
    ordersCount: finalState.ordersCount,
    lastPrice: finalState.book.last_price,
    book: finalState.book,
  };
};
