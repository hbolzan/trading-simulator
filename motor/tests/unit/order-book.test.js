import { assertEquals } from '../../deps.js';
import { createEmptyBook, processOrder } from '../../src/simulation/engine/order-book.js';

Deno.test('order book should match buy order against resting asks', () => {
  const initialBook = createEmptyBook(100);

  const restingAsk = {
    order_id: crypto.randomUUID(),
    session_id: crypto.randomUUID(),
    participant_id: crypto.randomUUID(),
    tick: 1,
    side: 'sell',
    price: 100,
    quantity: 3,
    remaining_quantity: 3,
    sequence: 1,
  };

  const withAsk = processOrder({
    book: initialBook,
    incomingOrder: restingAsk,
  });

  const incomingBuy = {
    order_id: crypto.randomUUID(),
    session_id: restingAsk.session_id,
    participant_id: crypto.randomUUID(),
    tick: 2,
    side: 'buy',
    price: 101,
    quantity: 2,
    remaining_quantity: 2,
    sequence: 2,
  };

  const matched = processOrder({
    book: withAsk.book,
    incomingOrder: incomingBuy,
  });

  assertEquals(matched.trades.length, 1);
  assertEquals(matched.trades[0].price, 100);
  assertEquals(matched.trades[0].quantity, 2);
  assertEquals(matched.book.asks.length, 1);
  assertEquals(matched.book.asks[0].remaining_quantity, 1);
  assertEquals(matched.book.bids.length, 0);
});
