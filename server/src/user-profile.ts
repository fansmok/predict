import { db } from './db.js';
import { getTeam, flagUrl } from './data/matches.js';
import { getGameDay, isMatchLocked } from './game-day.js';
import { getMatchPoints, getTournamentRow, computeRank, getUserMatchPredictionBreakdown } from './ranking.js';
import { getUserTournamentPoints, isTournamentLocked, hasWorldCupStarted } from './tournament.js';
import { enrichSquadResponse, getUserSquadPoints } from './squad.js';
import { enrichFavoriteTeam, getUserFavoriteTeamId } from './favorite-team.js';
import { getPlatinumProgress } from './platinum.js';

export function parseUserId(value: unknown): number | null {
  const id = typeof value === 'string' ? parseInt(value, 10) : typeof value === 'number' ? value : NaN;
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

export function getUserPublicPredictions(userId: number) {
  const rows = db.prepare(`
    SELECT
      p.match_id,
      p.home_score AS pred_home,
      p.away_score AS pred_away,
      p.points,
      m.kickoff,
      m.stage,
      m.group_name,
      m.status,
      m.home_score,
      m.away_score,
      m.home_team_id,
      m.away_team_id
    FROM predictions p
    JOIN matches m ON m.id = p.match_id
    WHERE p.user_id = ?
    ORDER BY m.kickoff DESC
  `).all(userId) as Array<{
    match_id: number;
    pred_home: number;
    pred_away: number;
    points: number | null;
    kickoff: string;
    stage: string;
    group_name: string | null;
    status: string;
    home_score: number | null;
    away_score: number | null;
    home_team_id: string;
    away_team_id: string;
  }>;

  const doubleRows = db.prepare(`
    SELECT dp.match_id FROM double_picks dp WHERE dp.user_id = ?
  `).all(userId) as Array<{ match_id: number }>;
  const doubleMatchIds = new Set(doubleRows.map(r => r.match_id));

  return rows
    .map(row => {
    const home = getTeam(row.home_team_id);
    const away = getTeam(row.away_team_id);
    const kickoff = row.kickoff;
    const status = row.status;
    const locked = isMatchLocked(kickoff, status);
    return {
      id: row.match_id,
      kickoff,
      stage: row.stage,
      group: row.group_name,
      round: null,
      status,
      gameDay: getGameDay(kickoff),
      homeScore: row.home_score,
      awayScore: row.away_score,
      homeTeam: { ...home, flag: flagUrl(home.code) },
      awayTeam: { ...away, flag: flagUrl(away.code) },
      isLocked: locked,
      canPredict: false,
      isDouble: locked ? doubleMatchIds.has(row.match_id) : false,
      doublePickMatchId: null,
      prediction: {
        homeScore: row.pred_home,
        awayScore: row.pred_away,
        points: row.points,
      },
      consensus: { home: 0, draw: 0, away: 0, total: 0 },
    };
  })
    .filter(p => p.isLocked);
}

export function buildUserStats(userId: number) {
  const matchPoints = getMatchPoints(userId);
  const tournamentPoints = getUserTournamentPoints(getTournamentRow(userId));
  const squadPoints = getUserSquadPoints(userId);
  const totalPoints = matchPoints + tournamentPoints + squadPoints;
  const predictionBreakdown = getUserMatchPredictionBreakdown(userId);

  const stats = db.prepare(`
    SELECT COUNT(*) as totalPredictions
    FROM predictions WHERE user_id = ?
  `).get(userId) as { totalPredictions: number };

  return {
    totalPoints,
    matchPoints,
    tournamentPoints,
    squadPoints,
    totalPredictions: stats.totalPredictions,
    scoredPredictions: predictionBreakdown.scoredPredictions,
    exactScores: predictionBreakdown.exactCount,
    outcomeHits: predictionBreakdown.outcomeHits,
    differenceHits: predictionBreakdown.differenceHits,
    goodPredictions: predictionBreakdown.goodPredictions,
    predictionBreakdown: {
      outcomeCount: predictionBreakdown.outcomeCount,
      outcomePoints: predictionBreakdown.outcomePoints,
      differenceCount: predictionBreakdown.differenceCount,
      differencePoints: predictionBreakdown.differencePoints,
      exactCount: predictionBreakdown.exactCount,
      exactPoints: predictionBreakdown.exactPoints,
    },
    rank: computeRank(userId),
  };
}

export function getPublicUserProfile(
  userId: number,
  enrichTournament: (id: number) => unknown
) {
  const row = db.prepare(`
    SELECT id, first_name, last_name, username, photo_url
    FROM users WHERE id = ?
  `).get(userId) as {
    id: number;
    first_name: string;
    last_name: string | null;
    username: string | null;
    photo_url: string | null;
  } | undefined;

  if (!row) return null;

  const squadRaw = enrichSquadResponse(userId);
  const tournamentRaw = enrichTournament(userId) as {
    locked: boolean;
    deadline: string;
    picks: { winner: unknown; second: unknown; third: unknown; topScorer: unknown };
    points: unknown;
    results: unknown;
  };

  const tournament = isTournamentLocked()
    ? tournamentRaw
    : {
        ...tournamentRaw,
        picks: { winner: null, second: null, third: null, topScorer: null },
        picksHidden: true,
      };

  const squad = hasWorldCupStarted()
    ? squadRaw
    : {
        ...squadRaw,
        players: [],
        squadHidden: true,
        complete: squadRaw.complete,
      };

  return {
    user: {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      photoUrl: row.photo_url,
      favoriteTeam: enrichFavoriteTeam(getUserFavoriteTeamId(userId)),
      isPlatinum: getPlatinumProgress(userId).isPlatinum,
    },
    stats: buildUserStats(userId),
    squad,
    tournament,
    predictions: getUserPublicPredictions(userId),
  };
}
