import { db } from './db.js';
import { rankedStagesSqlIn } from './match-stages.js';
import { getAllUserSquadPointsMap, getUserSquadPoints } from './squad.js';
import { getUserTournamentPoints } from './tournament.js';

const rankedPredictionsWhere = (extra = '') =>
  `FROM predictions p INNER JOIN matches m ON m.id = p.match_id AND m.stage IN (${rankedStagesSqlIn()}) ${extra}`;

const ACTIVE_USERS_SQL = `
  SELECT u.id, u.first_name, u.last_name, u.username, u.photo_url
  FROM users u
  WHERE EXISTS (SELECT 1 FROM predictions p WHERE p.user_id = u.id)
     OR EXISTS (SELECT 1 FROM tournament_picks tp WHERE tp.user_id = u.id)
     OR EXISTS (SELECT 1 FROM user_squad us WHERE us.user_id = u.id)
`;

export interface LeaderboardEntry {
  id: number;
  firstName: string;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
  totalPoints: number;
  matchPoints: number;
  tournamentPoints: number;
  squadPoints: number;
  predictionsCount: number;
  outcomeHits: number;
  differenceHits: number;
  exactScores: number;
  goodPredictions: number;
}

export interface RankedLeaderboardEntry extends LeaderboardEntry {
  rank: number;
}

export interface UserPointsTotals {
  totalPoints: number;
  matchPoints: number;
  tournamentPoints: number;
  squadPoints: number;
  predictionsCount: number;
  outcomeHits: number;
  differenceHits: number;
  exactScores: number;
  goodPredictions: number;
}

const EMPTY_TOTALS: UserPointsTotals = {
  totalPoints: 0,
  matchPoints: 0,
  tournamentPoints: 0,
  squadPoints: 0,
  predictionsCount: 0,
  outcomeHits: 0,
  differenceHits: 0,
  exactScores: 0,
  goodPredictions: 0,
};

export type LeaderboardRankKind = 'total' | 'predictions' | 'fantasy';

const LEADERBOARD_CACHE_TTL_MS = (() => {
  const raw = process.env.LEADERBOARD_CACHE_TTL_MS;
  if (!raw) return 60_000;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 60_000;
})();

let leaderboardCacheExpiresAt = 0;
let leaderboardCacheByKind = new Map<LeaderboardRankKind, RankedLeaderboardEntry[]>();

export function invalidateLeaderboardCache(): void {
  leaderboardCacheExpiresAt = 0;
  leaderboardCacheByKind.clear();
}

export function parseLeaderboardRankKind(value: unknown): LeaderboardRankKind {
  if (value === 'predictions' || value === 'fantasy') return value;
  return 'total';
}

export function compareLeaderboard(
  a: Pick<LeaderboardEntry, 'totalPoints' | 'exactScores' | 'predictionsCount' | 'id'>,
  b: Pick<LeaderboardEntry, 'totalPoints' | 'exactScores' | 'predictionsCount' | 'id'>
): number {
  return (
    b.totalPoints - a.totalPoints ||
    b.exactScores - a.exactScores ||
    b.predictionsCount - a.predictionsCount ||
    a.id - b.id
  );
}

export function compareLeaderboardByKind(
  kind: LeaderboardRankKind,
  a: LeaderboardEntry,
  b: LeaderboardEntry
): number {
  if (kind === 'predictions') {
    return (
      b.matchPoints - a.matchPoints ||
      b.exactScores - a.exactScores ||
      b.predictionsCount - a.predictionsCount ||
      a.id - b.id
    );
  }
  if (kind === 'fantasy') {
    return (
      b.squadPoints - a.squadPoints ||
      b.predictionsCount - a.predictionsCount ||
      a.id - b.id
    );
  }
  return compareLeaderboard(a, b);
}

/** Плотный рейтинг: при равных очках — одно место. */
export function assignLeaderRanksForKind(
  entries: LeaderboardEntry[],
  kind: LeaderboardRankKind
): RankedLeaderboardEntry[] {
  const sorted = [...entries].sort((a, b) => compareLeaderboardByKind(kind, a, b));
  const result: RankedLeaderboardEntry[] = [];
  for (let index = 0; index < sorted.length; index++) {
    const entry = sorted[index];
    const rank =
      index === 0 || compareLeaderboardByKind(kind, sorted[index - 1], entry) !== 0
        ? index + 1
        : result[index - 1].rank;
    result.push({ ...entry, rank });
  }
  return result;
}

export function assignLeaderRanks(entries: LeaderboardEntry[]): RankedLeaderboardEntry[] {
  return assignLeaderRanksForKind(entries, 'total');
}

export interface LeaderboardSlice {
  leaders: RankedLeaderboardEntry[];
  myEntry: RankedLeaderboardEntry | null;
  neighborhood: RankedLeaderboardEntry[];
}

export function sliceRankedLeaderboard(
  ranked: RankedLeaderboardEntry[],
  viewerId: number,
  limit: number
): LeaderboardSlice {
  const leaders = ranked.slice(0, limit);
  const myEntry = ranked.find(e => e.id === viewerId) ?? null;
  const myIndex = myEntry ? ranked.indexOf(myEntry) : -1;
  let neighborhood: RankedLeaderboardEntry[] = [];
  if (myIndex >= limit && myEntry) {
    const start = Math.max(0, myIndex - 2);
    neighborhood = ranked.slice(start, Math.min(ranked.length, myIndex + 3));
  }
  return { leaders, myEntry, neighborhood };
}

/** Пакетный расчёт очков для списка user id (3 SQL + кэш состава). */
export function getTotalsForUserIds(userIds: number[]): Map<number, UserPointsTotals> {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return new Map();

  const placeholders = unique.map(() => '?').join(',');
  const squadPoints = getAllUserSquadPointsMap();

  const predRows = db.prepare(`
    SELECT p.user_id,
      COALESCE(SUM(p.points), 0) as matchPoints,
      COUNT(CASE WHEN p.points IS NOT NULL THEN 1 END) as predictionsCount,
      COUNT(CASE WHEN p.points >= 2 THEN 1 END) as outcomeHits,
      COUNT(CASE WHEN p.points IN (3, 6) THEN 1 END) as differenceHits,
      COUNT(CASE WHEN p.points = 5 OR p.points = 10 THEN 1 END) as exactScores,
      COUNT(CASE WHEN p.points >= 3 THEN 1 END) as goodPredictions
    ${rankedPredictionsWhere(`WHERE p.user_id IN (${placeholders})`)}
    GROUP BY p.user_id
  `).all(...unique) as Array<{
    user_id: number;
    matchPoints: number;
    predictionsCount: number;
    outcomeHits: number;
    differenceHits: number;
    exactScores: number;
    goodPredictions: number;
  }>;

  const tourRows = db.prepare(`
    SELECT user_id,
      COALESCE(winner_points, 0) + COALESCE(second_points, 0) +
      COALESCE(third_points, 0) + COALESCE(scorer_points, 0) as tournamentPoints
    FROM tournament_picks
    WHERE user_id IN (${placeholders})
  `).all(...unique) as Array<{ user_id: number; tournamentPoints: number }>;

  const predMap = new Map(predRows.map(r => [r.user_id, r]));
  const tourMap = new Map(tourRows.map(r => [r.user_id, r.tournamentPoints]));

  const result = new Map<number, UserPointsTotals>();
  for (const id of unique) {
    const p = predMap.get(id);
    const matchPts = p?.matchPoints ?? 0;
    const tourPts = tourMap.get(id) ?? 0;
    const squadPts = squadPoints.get(id) ?? 0;
    result.set(id, {
      totalPoints: matchPts + tourPts + squadPts,
      matchPoints: matchPts,
      tournamentPoints: tourPts,
      squadPoints: squadPts,
      predictionsCount: p?.predictionsCount ?? 0,
      outcomeHits: p?.outcomeHits ?? 0,
      differenceHits: p?.differenceHits ?? 0,
      exactScores: p?.exactScores ?? 0,
      goodPredictions: p?.goodPredictions ?? 0,
    });
  }
  return result;
}

export function buildLeaderboardEntriesForUsers(
  members: Array<{
    id: number;
    firstName: string;
    lastName: string | null;
    username: string | null;
    photoUrl: string | null;
  }>,
  limit?: number
): LeaderboardEntry[] {
  const totals = getTotalsForUserIds(members.map(m => m.id));
  const entries = members.map(m => {
    const t = totals.get(m.id) ?? EMPTY_TOTALS;
    return { ...m, ...t };
  });
  entries.sort(compareLeaderboard);
  return limit != null ? entries.slice(0, limit) : entries;
}

export function getMatchPoints(userId: number): number {
  const row = db.prepare(`
    SELECT COALESCE(SUM(p.points), 0) as pts
    ${rankedPredictionsWhere('WHERE p.user_id = ?')}
  `).get(userId) as { pts: number };
  return row.pts;
}

export interface MatchPredictionBreakdown {
  outcomeCount: number;
  outcomePoints: number;
  differenceCount: number;
  differencePoints: number;
  exactCount: number;
  exactPoints: number;
  scoredPredictions: number;
  outcomeHits: number;
  differenceHits: number;
  goodPredictions: number;
}

export function getUserMatchPredictionBreakdown(userId: number): MatchPredictionBreakdown {
  const row = db.prepare(`
    SELECT
      COUNT(CASE WHEN p.points IN (2, 4) THEN 1 END) as outcomeCount,
      COALESCE(SUM(CASE WHEN p.points IN (2, 4) THEN p.points ELSE 0 END), 0) as outcomePoints,
      COUNT(CASE WHEN p.points IN (3, 6) THEN 1 END) as differenceCount,
      COALESCE(SUM(CASE WHEN p.points IN (3, 6) THEN p.points ELSE 0 END), 0) as differencePoints,
      COUNT(CASE WHEN p.points IN (5, 10) THEN 1 END) as exactCount,
      COALESCE(SUM(CASE WHEN p.points IN (5, 10) THEN p.points ELSE 0 END), 0) as exactPoints,
      COUNT(CASE WHEN p.points IS NOT NULL THEN 1 END) as scoredPredictions,
      COUNT(CASE WHEN p.points >= 2 THEN 1 END) as outcomeHits,
      COUNT(CASE WHEN p.points IN (3, 6) THEN 1 END) as differenceHits,
      COUNT(CASE WHEN p.points >= 3 THEN 1 END) as goodPredictions
    ${rankedPredictionsWhere('WHERE p.user_id = ?')}
  `).get(userId) as MatchPredictionBreakdown;

  return row ?? {
    outcomeCount: 0,
    outcomePoints: 0,
    differenceCount: 0,
    differencePoints: 0,
    exactCount: 0,
    exactPoints: 0,
    scoredPredictions: 0,
    outcomeHits: 0,
    differenceHits: 0,
    goodPredictions: 0,
  };
}

export function getTournamentRow(userId: number) {
  return db.prepare(`SELECT * FROM tournament_picks WHERE user_id = ?`).get(userId) as {
    winner_team_id: string | null;
    second_team_id: string | null;
    third_team_id: string | null;
    top_scorer_player_id: string | null;
    winner_points: number | null;
    second_points: number | null;
    third_points: number | null;
    scorer_points: number | null;
  } | undefined;
}

export function getUserTotalPoints(userId: number): number {
  return getMatchPoints(userId) + getUserTournamentPoints(getTournamentRow(userId)) + getUserSquadPoints(userId);
}

export function buildLeaderboardEntries(): LeaderboardEntry[] {
  const rows = db.prepare(ACTIVE_USERS_SQL).all() as Array<{
    id: number;
    first_name: string;
    last_name: string | null;
    username: string | null;
    photo_url: string | null;
  }>;

  const totals = getTotalsForUserIds(rows.map(r => r.id));

  return rows
    .map(row => {
      const t = totals.get(row.id) ?? EMPTY_TOTALS;
      return {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        username: row.username,
        photoUrl: row.photo_url,
        ...t,
      };
    })
    .sort(compareLeaderboard);
}

const RANK_KINDS: LeaderboardRankKind[] = ['total', 'predictions', 'fantasy'];

function rebuildRankedCache(): Map<LeaderboardRankKind, RankedLeaderboardEntry[]> {
  const entries = buildLeaderboardEntries();
  const map = new Map<LeaderboardRankKind, RankedLeaderboardEntry[]>();
  for (const kind of RANK_KINDS) {
    map.set(kind, assignLeaderRanksForKind(entries, kind));
  }
  return map;
}

export function buildRankedLeaderboardByKind(kind: LeaderboardRankKind = 'total'): RankedLeaderboardEntry[] {
  const now = Date.now();
  if (now >= leaderboardCacheExpiresAt || !leaderboardCacheByKind.has(kind)) {
    leaderboardCacheByKind = rebuildRankedCache();
    leaderboardCacheExpiresAt = now + LEADERBOARD_CACHE_TTL_MS;
  }
  return leaderboardCacheByKind.get(kind) ?? [];
}

export function buildRankedLeaderboard(): RankedLeaderboardEntry[] {
  return buildRankedLeaderboardByKind('total');
}

/** Снимок рейтинга для пакетных уведомлений (один rebuild на TTL). */
export function getLeaderboardSnapshot(kind: LeaderboardRankKind = 'total') {
  const ranked = buildRankedLeaderboardByKind(kind);
  const rankByUserId = new Map<number, number>();
  const totalPointsByUserId = new Map<number, number>();
  for (const entry of ranked) {
    rankByUserId.set(entry.id, entry.rank);
    totalPointsByUserId.set(entry.id, entry.totalPoints);
  }
  return { ranked, rankByUserId, totalPointsByUserId };
}

/** @deprecated Используйте buildLeaderboardEntries для пакетного расчёта. */
export function getAllActiveUserTotals(): Map<number, number> {
  const map = new Map<number, number>();
  for (const entry of buildLeaderboardEntries()) {
    map.set(entry.id, entry.totalPoints);
  }
  return map;
}

export function computeRank(userId: number, kind: LeaderboardRankKind = 'total'): number {
  const ranked = buildRankedLeaderboardByKind(kind);
  return ranked.find(e => e.id === userId)?.rank ?? ranked.length + 1;
}

export function getLeaderboardAvgPoints(entries: LeaderboardEntry[]): number {
  if (entries.length === 0) return 0;
  const sum = entries.reduce((acc, e) => acc + e.totalPoints, 0);
  return Math.round(sum / entries.length);
}
