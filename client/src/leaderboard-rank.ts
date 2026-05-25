import type { Leader, LeaderboardMyRank } from './types';

export type PlayersRankKind = 'total' | 'predictions' | 'fantasy';

export const RANK_KIND_LABELS: Record<PlayersRankKind, string> = {
  total: 'Общий рейтинг',
  predictions: 'Топ прогнозистов',
  fantasy: 'Топ fantasy',
};

export function leaderPointsForKind(
  leader: Pick<Leader, 'totalPoints' | 'matchPoints' | 'tournamentPoints' | 'squadPoints'>,
  kind: PlayersRankKind
): number {
  if (kind === 'total') return leader.totalPoints;
  if (kind === 'predictions') return leader.matchPoints;
  return leader.squadPoints;
}

export function myPointsForKind(
  row: Pick<LeaderboardMyRank, 'totalPoints' | 'matchPoints' | 'tournamentPoints' | 'squadPoints'>,
  kind: PlayersRankKind
): number {
  return leaderPointsForKind(row, kind);
}

/** Места и порядок приходят с сервера для выбранного типа рейтинга. */
export function prepareLeadersForRankKind(leaders: Leader[]): Leader[] {
  return [...leaders].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
}
