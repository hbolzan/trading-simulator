import { bookStateSchema, orderSchema } from '../../contracts/schemas/order.schema.js';
import { tradeSchema } from '../../contracts/schemas/trade.schema.js';

const sortBids = (orders) =>
  [...orders].sort((left, right) => {
    if (right.price !== left.price) {
      return right.price - left.price;
    }

    return left.sequence - right.sequence;
  });

const sortAsks = (orders) =>
  [...orders].sort((left, right) => {
    if (left.price !== right.price) {
      return left.price - right.price;
    }

    return left.sequence - right.sequence;
  });

const appendTrade = (trades, trade) => [...trades, tradeSchema.parse(trade)];

export const createEmptyBook = (initialPrice) =>
  bookStateSchema.parse({
    bids: [],
    asks: [],
    last_price: initialPrice,
  });

export const processOrder = ({ book: rawBook, incomingOrder: rawIncomingOrder }) => {
  const book = bookStateSchema.parse(rawBook);
  const incomingOrder = orderSchema.parse(rawIncomingOrder);

  if (incomingOrder.side === 'buy') {
    let asks = [...book.asks];
    let remainingQuantity = incomingOrder.remaining_quantity;
    let lastPrice = book.last_price;
    let trades = [];

    while (
      remainingQuantity > 0 &&
      asks.length > 0 &&
      asks[0].price <= incomingOrder.price
    ) {
      const bestAsk = asks[0];
      const executedQuantity = Math.min(remainingQuantity, bestAsk.remaining_quantity);
      const nextBestAskRemaining = bestAsk.remaining_quantity - executedQuantity;

      const trade = {
        trade_id: crypto.randomUUID(),
        session_id: incomingOrder.session_id,
        tick: incomingOrder.tick,
        price: bestAsk.price,
        quantity: executedQuantity,
        aggressor_side: incomingOrder.side,
        buy_order_id: incomingOrder.order_id,
        sell_order_id: bestAsk.order_id,
      };

      trades = appendTrade(trades, trade);
      remainingQuantity = remainingQuantity - executedQuantity;
      lastPrice = trade.price;

      asks = nextBestAskRemaining > 0
        ? [{ ...bestAsk, remaining_quantity: nextBestAskRemaining }, ...asks.slice(1)]
        : asks.slice(1);
    }

    const restingBid = remainingQuantity > 0
      ? {
        ...incomingOrder,
        remaining_quantity: remainingQuantity,
      }
      : null;

    const bids = restingBid === null
      ? [...book.bids]
      : sortBids([...book.bids, orderSchema.parse(restingBid)]);

    const nextBook = bookStateSchema.parse({
      bids,
      asks: sortAsks(asks),
      last_price: lastPrice,
    });

    return {
      book: nextBook,
      trades,
    };
  }

  let bids = [...book.bids];
  let remainingQuantity = incomingOrder.remaining_quantity;
  let lastPrice = book.last_price;
  let trades = [];

  while (
    remainingQuantity > 0 &&
    bids.length > 0 &&
    bids[0].price >= incomingOrder.price
  ) {
    const bestBid = bids[0];
    const executedQuantity = Math.min(remainingQuantity, bestBid.remaining_quantity);
    const nextBestBidRemaining = bestBid.remaining_quantity - executedQuantity;

    const trade = {
      trade_id: crypto.randomUUID(),
      session_id: incomingOrder.session_id,
      tick: incomingOrder.tick,
      price: bestBid.price,
      quantity: executedQuantity,
      aggressor_side: incomingOrder.side,
      buy_order_id: bestBid.order_id,
      sell_order_id: incomingOrder.order_id,
    };

    trades = appendTrade(trades, trade);
    remainingQuantity = remainingQuantity - executedQuantity;
    lastPrice = trade.price;

    bids = nextBestBidRemaining > 0
      ? [{ ...bestBid, remaining_quantity: nextBestBidRemaining }, ...bids.slice(1)]
      : bids.slice(1);
  }

  const restingAsk = remainingQuantity > 0
    ? {
      ...incomingOrder,
      remaining_quantity: remainingQuantity,
    }
    : null;

  const asks = restingAsk === null
    ? [...book.asks]
    : sortAsks([...book.asks, orderSchema.parse(restingAsk)]);

  const nextBook = bookStateSchema.parse({
    bids: sortBids(bids),
    asks,
    last_price: lastPrice,
  });

  return {
    book: nextBook,
    trades,
  };
};
