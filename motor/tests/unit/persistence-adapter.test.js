import { assertEquals, assertThrows } from '../../deps.js';
import { createPersistenceAdapter } from '../../src/adapters/outbound/persistence/create-persistence-adapter.js';

Deno.test('persistence adapter defaults to file mode', () => {
  const adapter = createPersistenceAdapter({
    mode: undefined,
    databaseUrl: undefined,
  });

  assertEquals(adapter.mode, 'file');
});

Deno.test('postgres mode without DATABASE_URL should throw', () => {
  assertThrows(() => {
    createPersistenceAdapter({ mode: 'postgres', databaseUrl: '' });
  });
});

Deno.test('both mode without DATABASE_URL should throw', () => {
  assertThrows(() => {
    createPersistenceAdapter({ mode: 'both', databaseUrl: '' });
  });
});

Deno.test('invalid mode should throw', () => {
  assertThrows(() => {
    createPersistenceAdapter({ mode: 'invalid', databaseUrl: '' });
  });
});
