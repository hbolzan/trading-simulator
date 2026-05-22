import { sessionSchema } from '../../../contracts/schemas/session.schema.js';
import { DomainError } from '../../../shared/errors/domain-error.js';
import { runSimulation } from '../../../simulation/engine/run-simulation.js';

export const runSimulationUseCase = (rawSession, config) => {
  const session = sessionSchema.parse(rawSession);

  if (session.status !== 'RUNNING') {
    throw new DomainError('Session must be RUNNING before simulation.');
  }

  return runSimulation({
    session,
    occurredAt: new Date().toISOString(),
    config,
  });
};
