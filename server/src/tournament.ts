import { db } from './db.js';
import { TOURNAMENT_DEADLINE } from './data/players.js';

/** ЧМ уже начался: есть live/finished матчи или наступил дедлайн (открытие). */
export function hasWorldCupStarted(): boolean {
  if (new Date() >= new Date(TOURNAMENT_DEADLINE)) return true;

  const row = db.prepare(`
    SELECT 1 FROM matches
    WHERE status IN ('live', 'finished')
    LIMIT 1
  `).get();
  return !!row;
}

export function isTournamentLocked(): boolean {
  return hasWorldCupStarted();
}

export type TournamentPickBody = {
  winnerTeamId?: string;
  secondTeamId?: string;
  thirdTeamId?: string;
  topScorerPlayerId?: string;
};

export type TournamentPickRow = {
  winner_team_id: string | null;
  second_team_id: string | null;
  third_team_id: string | null;
  top_scorer_player_id: string | null;
};

export function resolveTournamentPickFields(
  existing: TournamentPickRow | undefined,
  body: TournamentPickBody
) {
  const pick = (bodyKey: keyof TournamentPickBody, col: keyof TournamentPickRow) =>
    body[bodyKey] !== undefined ? body[bodyKey] || null : existing?.[col] ?? null;

  return {
    winnerTeamId: pick('winnerTeamId', 'winner_team_id'),
    secondTeamId: pick('secondTeamId', 'second_team_id'),
    thirdTeamId: pick('thirdTeamId', 'third_team_id'),
    topScorerPlayerId: pick('topScorerPlayerId', 'top_scorer_player_id'),
  };
}

export function getUserTournamentPoints(row: {
  winner_points: number | null;
  second_points: number | null;
  third_points: number | null;
  scorer_points: number | null;
} | undefined): number {
  if (!row) return 0;
  return (row.winner_points ?? 0) + (row.second_points ?? 0) + (row.third_points ?? 0) + (row.scorer_points ?? 0);
}
