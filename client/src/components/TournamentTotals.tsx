import type { TournamentData } from '../types';
import { formatPoints } from '../utils';

interface Props {
  points: TournamentData['points'];
  resultsSettled: boolean;
}

export function TournamentTotals({ points, resultsSettled }: Props) {
  if (!resultsSettled) {
    return (
      <p className="tournament-totals-pending">
        Очки начислятся после ввода итогов турнира администратором
      </p>
    );
  }

  return (
    <div className="fantasy-breakdown tournament-totals">
      <div className="fantasy-breakdown-sum tournament-totals-only">
        <span>Итого за турнир</span>
        <span>{formatPoints(points.total)}</span>
      </div>
    </div>
  );
}
