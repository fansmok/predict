import { db } from './db.js';
import { getTeam, flagUrl } from './data/matches.js';
import { getSquadPlayer, type SquadPlayer } from './data/squad-players.js';
import { buildSquadStatsFromEvents, getMatchFantasyDraft, type GoalEventInput } from './admin.js';
import { getSingleMatchPredictionStats } from './match-stats.js';
import { rankedStagesSqlIn } from './match-stages.js';
import {
  calculatePlayerMatchPoints,
  calculateSquadPoints,
  type PlayerMatchStat,
} from './squad-scoring.js';

const POS_ORDER: Record<string, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3 };

export interface MatchProfilePlayer {
  id: string;
  name: string;
  position: string;
  goals: number;
  assists: number;
  sentOff: boolean;
  teamWon: boolean;
  cleanSheet: boolean;
  goalsConceded: number;
  played: boolean;
  fantasyPoints: number;
}

export interface MatchProfileTopUser {
  rank: number;
  id: number;
  firstName: string;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
  predictionPoints: number;
  fantasyPoints: number;
  totalPoints: number;
}

export interface MatchProfileGoal {
  side: 'home' | 'away';
  scorerName: string;
  assistName: string | null;
}

export interface MatchProfileScoreStat {
  homeScore: number;
  awayScore: number;
  count: number;
  percent: number;
  isExactResult: boolean;
}

export interface MatchProfile {
  match: {
    id: number;
    kickoff: string;
    stage: string;
    group: string | null;
    homeScore: number;
    awayScore: number;
    homeTeam: ReturnType<typeof enrichTeam>;
    awayTeam: ReturnType<typeof enrichTeam>;
  };
  goals: MatchProfileGoal[];
  lineups: {
    home: MatchProfilePlayer[];
    away: MatchProfilePlayer[];
  };
  predictions: {
    total: number;
    scored: number;
    consensus: ReturnType<typeof getSingleMatchPredictionStats>;
    exactHits: number;
    outcomeHits: number;
    differenceHits: number;
    topScores: MatchProfileScoreStat[];
  };
  topUsers: MatchProfileTopUser[];
  userPrediction: {
    homeScore: number;
    awayScore: number;
    points: number | null;
  } | null;
}

function enrichTeam(teamId: string) {
  const t = getTeam(teamId);
  return { id: t.id, name: t.name, code: t.code, flag: flagUrl(t.code) };
}

function playerName(player: SquadPlayer | undefined, id: string): string {
  return player?.name ?? id;
}

function sortByPosition(a: MatchProfilePlayer, b: MatchProfilePlayer): number {
  const pa = POS_ORDER[a.position] ?? 9;
  const pb = POS_ORDER[b.position] ?? 9;
  return pa - pb || a.name.localeCompare(b.name, 'ru');
}

type DbStatRow = {
  player_id: string;
  goals: number;
  assists: number;
  team_won: number;
  clean_sheet: number;
  goals_conceded: number;
  sent_off: number;
  played: number;
};

function dbRowToStat(row: DbStatRow, matchId: number): PlayerMatchStat {
  return {
    playerId: row.player_id,
    matchId,
    goals: row.goals,
    assists: row.assists,
    teamWon: row.team_won === 1,
    cleanSheet: row.clean_sheet === 1,
    goalsConceded: row.goals_conceded,
    sentOff: row.sent_off > 0,
    played: row.played === 1,
  };
}

function squadInputToMatchStat(
  s: {
    playerId: string;
    goals?: number;
    assists?: number;
    teamWon?: boolean;
    cleanSheet?: boolean;
    goalsConceded?: number;
    sentOff?: boolean;
    played?: boolean;
  },
  matchId: number
): PlayerMatchStat {
  return {
    playerId: s.playerId,
    matchId,
    goals: s.goals ?? 0,
    assists: s.assists ?? 0,
    teamWon: !!s.teamWon,
    cleanSheet: !!s.cleanSheet,
    goalsConceded: s.goalsConceded ?? 0,
    sentOff: !!s.sentOff,
    played: s.played !== false,
  };
}

function loadProfileMatchStats(
  matchId: number,
  homeTeamId: string,
  awayTeamId: string,
  homeScore: number,
  awayScore: number,
  fantasyEventsJson: string | null,
  statRows: DbStatRow[]
): PlayerMatchStat[] {
  if (fantasyEventsJson) {
    try {
      const stored = JSON.parse(fantasyEventsJson) as {
        homeGoals: GoalEventInput[];
        awayGoals: GoalEventInput[];
        playedPlayerIds: string[];
        sentOffPlayerIds: string[];
      };
      const built = buildSquadStatsFromEvents(
        homeTeamId,
        awayTeamId,
        homeScore,
        awayScore,
        stored.homeGoals ?? [],
        stored.awayGoals ?? [],
        stored.playedPlayerIds ?? [],
        stored.sentOffPlayerIds ?? []
      );
      if (typeof built !== 'string') {
        return built.map(s => squadInputToMatchStat(s, matchId));
      }
    } catch {
      /* use DB rows */
    }
  }

  return statRows.map(r => dbRowToStat(r, matchId));
}

function buildLineup(matchStats: PlayerMatchStat[], teamId: string): MatchProfilePlayer[] {
  const players: MatchProfilePlayer[] = [];

  for (const stat of matchStats) {
    const p = getSquadPlayer(stat.playerId);
    if (!p || p.teamId !== teamId) continue;
    if (!stat.played && !stat.sentOff) continue;

    players.push({
      id: stat.playerId,
      name: p.name,
      position: p.position,
      goals: stat.goals,
      assists: stat.assists,
      sentOff: stat.sentOff,
      teamWon: stat.teamWon,
      cleanSheet: stat.cleanSheet,
      goalsConceded: stat.goalsConceded,
      played: stat.played,
      fantasyPoints: calculatePlayerMatchPoints(p.position, stat),
    });
  }

  return players.sort(
    (a, b) => b.fantasyPoints - a.fantasyPoints || sortByPosition(a, b)
  );
}

function getUserFantasyPointsForMatch(
  userId: number,
  kickoffMs: number,
  matchStats: PlayerMatchStat[],
  squadCache: Map<number, { playerIds: string[]; confirmedAt: string | null }>
): number {
  const entry = squadCache.get(userId);
  if (!entry?.confirmedAt || entry.playerIds.length === 0) return 0;
  if (new Date(entry.confirmedAt).getTime() >= kickoffMs) return 0;
  return calculateSquadPoints(entry.playerIds, matchStats);
}

function buildMatchTopUsers(
  matchId: number,
  kickoff: string,
  matchStats: PlayerMatchStat[]
): MatchProfileTopUser[] {
  const kickoffMs = new Date(kickoff).getTime();

  const preds = db.prepare(`
    SELECT p.user_id, p.points, u.first_name, u.last_name, u.username, u.photo_url
    FROM predictions p
    JOIN users u ON u.id = p.user_id
    WHERE p.match_id = ?
  `).all(matchId) as Array<{
    user_id: number;
    points: number | null;
    first_name: string;
    last_name: string | null;
    username: string | null;
    photo_url: string | null;
  }>;

  if (preds.length === 0) return [];

  const userIds = preds.map(p => p.user_id);
  const placeholders = userIds.map(() => '?').join(',');

  const squadRows = db.prepare(`
    SELECT us.user_id, us.player_id, u.squad_confirmed_at
    FROM user_squad us
    JOIN users u ON u.id = us.user_id
    WHERE us.user_id IN (${placeholders})
    ORDER BY us.user_id, us.slot
  `).all(...userIds) as Array<{
    user_id: number;
    player_id: string;
    squad_confirmed_at: string | null;
  }>;

  const squadCache = new Map<number, { playerIds: string[]; confirmedAt: string | null }>();
  for (const row of squadRows) {
    let entry = squadCache.get(row.user_id);
    if (!entry) {
      entry = { playerIds: [], confirmedAt: row.squad_confirmed_at };
      squadCache.set(row.user_id, entry);
    }
    entry.playerIds.push(row.player_id);
  }

  const ranked = preds
    .map(p => {
      const predictionPoints = p.points ?? 0;
      const fantasyPoints = getUserFantasyPointsForMatch(
        p.user_id,
        kickoffMs,
        matchStats,
        squadCache
      );
      return {
        id: p.user_id,
        firstName: p.first_name,
        lastName: p.last_name,
        username: p.username,
        photoUrl: p.photo_url,
        predictionPoints,
        fantasyPoints,
        totalPoints: predictionPoints + fantasyPoints,
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints || b.predictionPoints - a.predictionPoints)
    .slice(0, 3);

  return ranked.map((u, i) => ({ rank: i + 1, ...u }));
}

export function buildMatchProfile(matchId: number, userId?: number): MatchProfile | null {
  const row = db.prepare(`
    SELECT id, kickoff, stage, group_name, status, home_team_id, away_team_id, home_score, away_score, fantasy_events
    FROM matches WHERE id = ? AND stage IN (${rankedStagesSqlIn()})
  `).get(matchId) as {
    id: number;
    kickoff: string;
    stage: string;
    group_name: string | null;
    status: string;
    home_team_id: string;
    away_team_id: string;
    home_score: number | null;
    away_score: number | null;
    fantasy_events: string | null;
  } | undefined;

  if (!row || row.status !== 'finished' || row.home_score == null || row.away_score == null) {
    return null;
  }

  const fantasy = getMatchFantasyDraft(matchId);
  const statRows = db.prepare(`
    SELECT player_id, goals, assists, team_won, clean_sheet, goals_conceded, sent_off, played
    FROM player_match_stats WHERE match_id = ?
  `).all(matchId) as DbStatRow[];

  const matchStats = loadProfileMatchStats(
    matchId,
    row.home_team_id,
    row.away_team_id,
    row.home_score,
    row.away_score,
    row.fantasy_events,
    statRows
  );

  const goals: MatchProfileGoal[] = [];

  if (fantasy) {
    for (const g of fantasy.homeGoals) {
      goals.push({
        side: 'home',
        scorerName: playerName(getSquadPlayer(g.scorerId), g.scorerId),
        assistName: g.assistId ? playerName(getSquadPlayer(g.assistId), g.assistId) : null,
      });
    }
    for (const g of fantasy.awayGoals) {
      goals.push({
        side: 'away',
        scorerName: playerName(getSquadPlayer(g.scorerId), g.scorerId),
        assistName: g.assistId ? playerName(getSquadPlayer(g.assistId), g.assistId) : null,
      });
    }
  }

  const scoreRows = db.prepare(`
    SELECT home_score, away_score, COUNT(*) as cnt
    FROM predictions
    WHERE match_id = ?
    GROUP BY home_score, away_score
    ORDER BY cnt DESC, home_score DESC, away_score DESC
    LIMIT 8
  `).all(matchId) as Array<{ home_score: number; away_score: number; cnt: number }>;

  const predSummary = db.prepare(`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN points IS NOT NULL THEN 1 END) as scored,
      SUM(CASE WHEN points IN (5, 10) THEN 1 ELSE 0 END) as exact_hits,
      SUM(CASE WHEN points IN (3, 6) THEN 1 ELSE 0 END) as difference_hits,
      SUM(CASE WHEN points IN (2, 4) THEN 1 ELSE 0 END) as outcome_hits
    FROM predictions
    WHERE match_id = ?
  `).get(matchId) as {
    total: number;
    scored: number;
    exact_hits: number | null;
    outcome_hits: number | null;
    difference_hits: number | null;
  };

  const totalPreds = predSummary.total;
  const topScores: MatchProfileScoreStat[] = scoreRows.map(r => ({
    homeScore: r.home_score,
    awayScore: r.away_score,
    count: r.cnt,
    percent: totalPreds > 0 ? Math.round((r.cnt / totalPreds) * 100) : 0,
    isExactResult: r.home_score === row.home_score && r.away_score === row.away_score,
  }));

  let userPrediction: MatchProfile['userPrediction'] = null;
  if (userId != null) {
    const pred = db.prepare(`
      SELECT home_score, away_score, points FROM predictions
      WHERE user_id = ? AND match_id = ?
    `).get(userId, matchId) as { home_score: number; away_score: number; points: number | null } | undefined;
    if (pred) {
      userPrediction = {
        homeScore: pred.home_score,
        awayScore: pred.away_score,
        points: pred.points,
      };
    }
  }

  return {
    match: {
      id: row.id,
      kickoff: row.kickoff,
      stage: row.stage,
      group: row.group_name,
      homeScore: row.home_score,
      awayScore: row.away_score,
      homeTeam: enrichTeam(row.home_team_id),
      awayTeam: enrichTeam(row.away_team_id),
    },
    goals,
    lineups: {
      home: buildLineup(matchStats, row.home_team_id),
      away: buildLineup(matchStats, row.away_team_id),
    },
    predictions: {
      total: totalPreds,
      scored: predSummary.scored,
      consensus: getSingleMatchPredictionStats(matchId),
      exactHits: predSummary.exact_hits ?? 0,
      differenceHits: predSummary.difference_hits ?? 0,
      outcomeHits: predSummary.outcome_hits ?? 0,
      topScores,
    },
    topUsers: buildMatchTopUsers(matchId, row.kickoff, matchStats),
    userPrediction,
  };
}
