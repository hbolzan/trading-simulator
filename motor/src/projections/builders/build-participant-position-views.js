import { participantPositionViewsSchema } from '../../contracts/schemas/projection.schema.js';

export const buildParticipantPositionViews = ({
  session,
  participants,
  participantLedger,
  lastPrice,
}) => {
  const views = participants.map((participant) => {
    const account = participantLedger[participant.participant_id] ?? {
      cash: participant.capital,
      position: 0,
    };

    const positionValue = account.position * lastPrice;
    const equity = account.cash + positionValue;
    const pnl = equity - participant.capital;

    return {
      session_id: session.session_id,
      participant_id: participant.participant_id,
      participant_type: participant.type,
      cash: Number(account.cash.toFixed(6)),
      position: account.position,
      position_value: Number(positionValue.toFixed(6)),
      equity: Number(equity.toFixed(6)),
      pnl: Number(pnl.toFixed(6)),
      updated_at_tick: session.tick,
    };
  });

  return participantPositionViewsSchema.parse(views);
};
