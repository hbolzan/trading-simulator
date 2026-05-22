import { DomainError } from '../../../shared/errors/domain-error.js';
import { createFilePersistenceAdapter } from './file-persistence-adapter.js';
import { createPostgresPersistenceAdapter } from './postgres-persistence-adapter.js';

const createCombinedAdapter = ({ fileAdapter, postgresAdapter }) => ({
  mode: 'both',
  persist: async ({ sessionId, events, trades, candles }) => {
    const fileResult = await fileAdapter.persist({
      sessionId,
      events,
      trades,
      candles,
    });

    const postgresResult = await postgresAdapter.persist({
      sessionId,
      events,
      trades,
      candles,
    });

    return {
      eventsPath: `${fileResult.eventsPath} | ${postgresResult.eventsPath}`,
      tradesPath: `${fileResult.tradesPath} | ${postgresResult.tradesPath}`,
      candlesPath: `${fileResult.candlesPath} | ${postgresResult.candlesPath}`,
    };
  },
});

export const createPersistenceAdapter = ({ mode, databaseUrl }) => {
  const safeMode = mode ?? 'file';
  const fileAdapter = createFilePersistenceAdapter();

  if (safeMode === 'file') {
    return fileAdapter;
  }

  if (safeMode === 'postgres') {
    if (!databaseUrl) {
      throw new DomainError('DATABASE_URL is required when PERSISTENCE_MODE=postgres.');
    }

    return createPostgresPersistenceAdapter({ databaseUrl });
  }

  if (safeMode === 'both') {
    if (!databaseUrl) {
      throw new DomainError('DATABASE_URL is required when PERSISTENCE_MODE=both.');
    }

    return createCombinedAdapter({
      fileAdapter,
      postgresAdapter: createPostgresPersistenceAdapter({ databaseUrl }),
    });
  }

  throw new DomainError('Invalid PERSISTENCE_MODE. Use file, postgres, or both.');
};
