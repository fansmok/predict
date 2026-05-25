import { db } from './db.js';

export const CONSENSUS_MIN_PREDICTIONS = 1;

export interface MatchConsensus {
  home: number;
  draw: number;
  away: number;
  total: number;
}

function toConsensus(homeWins: number, draws: number, awayWins: number, total: number): MatchConsensus {
  if (total < CONSENSUS_MIN_PREDICTIONS) {
    return { home: 0, draw: 0, away: 0, total: 0 };
  }
  const home = Math.round((homeWins / total) * 100);
  const draw = Math.round((draws / total) * 100);
  const away = 100 - home - draw;
  return { home, draw, away, total };
}

export function getMatchPredictionStats(matchIds: number[]): Map<number, MatchConsensus> {
  const map = new Map<number, MatchConsensus>();
  if (matchIds.length === 0) return map;

  const placeholders = matchIds.map(() => '?').join(',');
  const rows = db.prepare(`
    SELECT match_id,
      SUM(CASE WHEN home_score > away_score THEN 1 ELSE 0 END) as home_wins,
      SUM(CASE WHEN home_score = away_score THEN 1 ELSE 0 END) as draws,
      SUM(CASE WHEN home_score < away_score THEN 1 ELSE 0 END) as away_wins,
      COUNT(*) as total
    FROM predictions
    WHERE match_id IN (${placeholders})
    GROUP BY match_id
  `).all(...matchIds) as Array<{
    match_id: number;
    home_wins: number;
    draws: number;
    away_wins: number;
    total: number;
  }>;

  for (const row of rows) {
    map.set(
      row.match_id,
      toConsensus(row.home_wins, row.draws, row.away_wins, row.total)
    );
  }

  return map;
}

export function getSingleMatchPredictionStats(matchId: number): MatchConsensus {
  return getMatchPredictionStats([matchId]).get(matchId) ?? { home: 0, draw: 0, away: 0, total: 0 };
}
