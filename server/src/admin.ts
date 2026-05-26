import { db } from './db.js';
import { calculatePoints } from './scoring.js';
import { isPredictableStage, rankedStagesSqlIn } from './match-stages.js';
import { isParticipantTeamId, MATCHES, TEAMS } from './data/matches.js';
import { getPlayer, TOURNAMENT_POINTS } from './data/players.js';
import { getSquadPlayer } from './data/squad-players.js';
import { invalidateLeaderboardCache } from './ranking.js';

export const MAX_SCORE = 15;

export function parseMatchId(value: unknown): number | null {
  if (typeof value === 'string' && value.trim() !== '') {
    const n = parseInt(value, 10);
    if (Number.isInteger(n) && n > 0) return n;
    return null;
  }
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) return null;
  return value;
}

export function parseScore(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value)) return null;
  if (value < 0 || value > MAX_SCORE) return null;
  return value;
}

export function getAdminMatch(matchId: number) {
  return db.prepare(`
    SELECT id, stage FROM matches WHERE id = ? AND stage IN (${rankedStagesSqlIn()})
  `).get(matchId) as { id: number; stage: string } | undefined;
}

/** @deprecated use getAdminMatch */
export function getGroupMatch(matchId: number) {
  return getAdminMatch(matchId);
}

/** Пересчёт очков прогнозов по итоговому счёту и актуальным ставкам ×2. */
export function recalculateMatchPredictionPoints(matchId: number): number {
  const match = db.prepare(`
    SELECT home_score, away_score, status FROM matches WHERE id = ?
  `).get(matchId) as { home_score: number | null; away_score: number | null; status: string } | undefined;

  if (
    !match ||
    match.status !== 'finished' ||
    match.home_score == null ||
    match.away_score == null
  ) {
    return 0;
  }

  const predictions = db.prepare(`
    SELECT p.id, p.user_id, p.home_score, p.away_score
    FROM predictions p WHERE p.match_id = ?
  `).all(matchId) as Array<{ id: number; user_id: number; home_score: number; away_score: number }>;

  const doubleUserIds = new Set(
    (db.prepare(`SELECT user_id FROM double_picks WHERE match_id = ?`).all(matchId) as Array<{ user_id: number }>)
      .map(r => r.user_id)
  );

  const updatePoints = db.prepare('UPDATE predictions SET points = ? WHERE id = ?');
  for (const p of predictions) {
    const pts = calculatePoints(
      p.home_score,
      p.away_score,
      match.home_score!,
      match.away_score!,
      doubleUserIds.has(p.user_id)
    );
    updatePoints.run(pts, p.id);
  }

  invalidateLeaderboardCache();
  return predictions.length;
}

/** Пересчёт очков по всем завершённым матчам (после деплоя или смены правил ×2). */
export function recalculateAllFinishedMatchPoints(): number {
  const rows = db.prepare(`
    SELECT id FROM matches
    WHERE status = 'finished' AND home_score IS NOT NULL AND away_score IS NOT NULL
  `).all() as Array<{ id: number }>;

  let total = 0;
  for (const row of rows) {
    total += recalculateMatchPredictionPoints(row.id);
  }
  return total;
}

export function applyMatchResult(matchId: number, homeScore: number, awayScore: number): number {
  const apply = db.transaction(() => {
    db.prepare(`
      UPDATE matches SET home_score = ?, away_score = ?, status = 'finished'
      WHERE id = ?
    `).run(homeScore, awayScore, matchId);
  });

  apply();
  return recalculateMatchPredictionPoints(matchId);
}

export function getAdminTournamentState() {
  const results = db.prepare(`SELECT * FROM tournament_results WHERE id = 1`).get() as {
    winner_team_id: string | null;
    second_team_id: string | null;
    third_team_id: string | null;
    top_scorer_player_id: string | null;
    settled_at: string | null;
  } | undefined;

  const picksCount = (
    db.prepare(`SELECT COUNT(*) as c FROM tournament_picks`).get() as { c: number }
  ).c;

  return {
    settled: !!(results?.settled_at && results.winner_team_id),
    settledAt: results?.settled_at ?? null,
    results: results
      ? {
          winnerTeamId: results.winner_team_id,
          secondTeamId: results.second_team_id,
          thirdTeamId: results.third_team_id,
          topScorerPlayerId: results.top_scorer_player_id,
        }
      : null,
    picksCount,
    points: TOURNAMENT_POINTS,
  };
}

export function settleTournamentResults(
  winnerTeamId: string,
  secondTeamId: string,
  thirdTeamId: string,
  topScorerPlayerId: string
): number {
  let updated = 0;

  const settle = db.transaction(() => {
    db.prepare(`
      INSERT INTO tournament_results (id, winner_team_id, second_team_id, third_team_id, top_scorer_player_id, settled_at)
      VALUES (1, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        winner_team_id = excluded.winner_team_id,
        second_team_id = excluded.second_team_id,
        third_team_id = excluded.third_team_id,
        top_scorer_player_id = excluded.top_scorer_player_id,
        settled_at = datetime('now')
    `).run(winnerTeamId, secondTeamId, thirdTeamId, topScorerPlayerId);

    const picks = db.prepare(`SELECT * FROM tournament_picks`).all() as Array<{
      user_id: number;
      winner_team_id: string | null;
      second_team_id: string | null;
      third_team_id: string | null;
      top_scorer_player_id: string | null;
    }>;

    const update = db.prepare(`
      UPDATE tournament_picks SET
        winner_points = ?,
        second_points = ?,
        third_points = ?,
        scorer_points = ?
      WHERE user_id = ?
    `);

    for (const p of picks) {
      update.run(
        p.winner_team_id === winnerTeamId ? TOURNAMENT_POINTS.winner : 0,
        p.second_team_id === secondTeamId ? TOURNAMENT_POINTS.second : 0,
        p.third_team_id === thirdTeamId ? TOURNAMENT_POINTS.third : 0,
        p.top_scorer_player_id === topScorerPlayerId ? TOURNAMENT_POINTS.topScorer : 0,
        p.user_id
      );
    }
    updated = picks.length;
  });

  settle();
  invalidateLeaderboardCache();
  return updated;
}

export function validateTournamentResults(body: {
  winnerTeamId?: unknown;
  secondTeamId?: unknown;
  thirdTeamId?: unknown;
  topScorerPlayerId?: unknown;
}): string | null {
  const { winnerTeamId, secondTeamId, thirdTeamId, topScorerPlayerId } = body;

  if (
    typeof winnerTeamId !== 'string' ||
    typeof secondTeamId !== 'string' ||
    typeof thirdTeamId !== 'string' ||
    typeof topScorerPlayerId !== 'string'
  ) {
    return 'Укажите winnerTeamId, secondTeamId, thirdTeamId, topScorerPlayerId';
  }

  const teamIds = [winnerTeamId, secondTeamId, thirdTeamId];
  if (new Set(teamIds).size !== teamIds.length) {
    return 'Команды на 1–3 место должны быть разными';
  }

  for (const id of teamIds) {
    if (!isParticipantTeamId(id)) return `Неизвестная команда: ${id}`;
  }

  if (!getPlayer(topScorerPlayerId)) {
    return `Неизвестный бомбардир: ${topScorerPlayerId}`;
  }

  return null;
}

export interface SquadStatInput {
  playerId: string;
  goals?: number;
  assists?: number;
  teamWon?: boolean;
  cleanSheet?: boolean;
  goalsConceded?: number;
  sentOff?: boolean;
  played?: boolean;
}

export interface GoalEventInput {
  scorerId: string;
  assistId?: string | null;
}

export function buildSquadStatsFromEvents(
  homeTeamId: string,
  awayTeamId: string,
  homeScore: number,
  awayScore: number,
  homeGoals: GoalEventInput[],
  awayGoals: GoalEventInput[],
  playedPlayerIds: string[],
  sentOffPlayerIds: string[] = []
): SquadStatInput[] | string {
  if (homeGoals.length !== homeScore) {
    return `Укажите ${homeScore} автор(ов) гола для хозяев (сейчас ${homeGoals.length})`;
  }
  if (awayGoals.length !== awayScore) {
    return `Укажите ${awayScore} автор(ов) гола для гостей (сейчас ${awayGoals.length})`;
  }

  const homeWon = homeScore > awayScore;
  const awayWon = awayScore > homeScore;
  const homeClean = awayScore === 0;
  const awayClean = homeScore === 0;

  const played = new Set(playedPlayerIds);
  const sentOff = new Set(sentOffPlayerIds);
  const agg = new Map<string, { goals: number; assists: number }>();

  const bump = (playerId: string, field: 'goals' | 'assists') => {
    const cur = agg.get(playerId) ?? { goals: 0, assists: 0 };
    cur[field]++;
    agg.set(playerId, cur);
    played.add(playerId);
  };

  const validateEvent = (ev: GoalEventInput, teamId: string, label: string) => {
    if (!ev.scorerId) return `${label}: выберите автора гола`;
    const scorer = getSquadPlayer(ev.scorerId);
    if (!scorer || scorer.teamId !== teamId) return `${label}: автор гола не из состава команды`;
    if (ev.assistId) {
      const assist = getSquadPlayer(ev.assistId);
      if (!assist || assist.teamId !== teamId) return `${label}: ассистент не из состава команды`;
      if (ev.assistId === ev.scorerId) return `${label}: автор и ассистент не могут совпадать`;
      bump(ev.assistId, 'assists');
    }
    bump(ev.scorerId, 'goals');
    return null;
  };

  for (let i = 0; i < homeGoals.length; i++) {
    const err = validateEvent(homeGoals[i], homeTeamId, `Гол хозяев #${i + 1}`);
    if (err) return err;
  }
  for (let i = 0; i < awayGoals.length; i++) {
    const err = validateEvent(awayGoals[i], awayTeamId, `Гол гостей #${i + 1}`);
    if (err) return err;
  }

  for (const id of played) {
    if (!getSquadPlayer(id)) return `Неизвестный игрок: ${id}`;
  }

  const stats: SquadStatInput[] = [];

  for (const playerId of played) {
    const player = getSquadPlayer(playerId)!;
    const isHome = player.teamId === homeTeamId;
    if (!isHome && player.teamId !== awayTeamId) continue;

    const totals = agg.get(playerId) ?? { goals: 0, assists: 0 };
    const teamWon = isHome ? homeWon : awayWon;
    const teamClean = isHome ? homeClean : awayClean;
    const defOrGk = player.position === 'GK' || player.position === 'DEF';
    const conceded = isHome ? awayScore : homeScore;

    stats.push({
      playerId,
      goals: totals.goals,
      assists: totals.assists,
      teamWon,
      cleanSheet: defOrGk && teamClean,
      goalsConceded: defOrGk ? conceded : 0,
      sentOff: sentOff.has(playerId),
      played: true,
    });
  }

  return stats;
}

export function getMatchTeams(matchId: number): { homeTeamId: string; awayTeamId: string } | null {
  const row = db.prepare(`
    SELECT home_team_id, away_team_id FROM matches WHERE id = ?
  `).get(matchId) as { home_team_id: string; away_team_id: string } | undefined;
  if (!row) return null;
  return { homeTeamId: row.home_team_id, awayTeamId: row.away_team_id };
}

export function validateSquadStats(
  matchId: unknown,
  stats: unknown
): { matchId: number; stats: SquadStatInput[] } | string {
  const id = parseMatchId(matchId);
  if (id == null) return 'Некорректный matchId';

  if (!getGroupMatch(id)) return 'Матч не найден';

  if (!Array.isArray(stats) || stats.length === 0) {
    return 'Укажите массив stats';
  }

  const parsed: SquadStatInput[] = [];
  for (const s of stats.slice(0, 200)) {
    if (!s || typeof s !== 'object' || typeof s.playerId !== 'string') {
      return 'Каждый элемент stats должен содержать playerId';
    }
    if (!getSquadPlayer(s.playerId)) {
      return `Неизвестный игрок: ${s.playerId}`;
    }

    const goals = s.goals ?? 0;
    const assists = s.assists ?? 0;
    if (
      typeof goals !== 'number' || !Number.isInteger(goals) || goals < 0 || goals > 10 ||
      typeof assists !== 'number' || !Number.isInteger(assists) || assists < 0 || assists > 10
    ) {
      return 'goals и assists должны быть целыми от 0 до 10';
    }

    parsed.push({
      playerId: s.playerId,
      goals,
      assists,
      teamWon: !!s.teamWon,
      cleanSheet: !!s.cleanSheet,
      goalsConceded: s.goalsConceded ?? 0,
      sentOff: !!s.sentOff,
      played: s.played !== false,
    });
  }

  return { matchId: id, stats: parsed };
}

export function upsertSquadStats(matchId: number, stats: SquadStatInput[]): number {
  db.prepare(`DELETE FROM player_match_stats WHERE match_id = ?`).run(matchId);

  const upsert = db.prepare(`
    INSERT INTO player_match_stats (match_id, player_id, goals, assists, team_won, clean_sheet, goals_conceded, sent_off, played)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const s of stats) {
    upsert.run(
      matchId,
      s.playerId,
      s.goals ?? 0,
      s.assists ?? 0,
      s.teamWon ? 1 : 0,
      s.cleanSheet ? 1 : 0,
      s.goalsConceded ?? 0,
      s.sentOff ? 1 : 0,
      s.played !== false ? 1 : 0
    );
  }

  invalidateLeaderboardCache();
  return stats.length;
}

export function applyMatchResultFull(
  matchId: number,
  homeScore: number,
  awayScore: number,
  homeGoals: GoalEventInput[],
  awayGoals: GoalEventInput[],
  playedPlayerIds: string[],
  sentOffPlayerIds: string[] = []
): { predictions: number; squadStats: number } | string {
  const teams = getMatchTeams(matchId);
  if (!teams) return 'Матч не найден';

  const squadStats = buildSquadStatsFromEvents(
    teams.homeTeamId,
    teams.awayTeamId,
    homeScore,
    awayScore,
    homeGoals,
    awayGoals,
    playedPlayerIds,
    sentOffPlayerIds
  );
  if (typeof squadStats === 'string') return squadStats;

  const predictions = applyMatchResult(matchId, homeScore, awayScore);
  const squadCount = upsertSquadStats(matchId, squadStats);

  db.prepare(`UPDATE matches SET fantasy_events = ? WHERE id = ?`).run(
    JSON.stringify({ homeGoals, awayGoals, playedPlayerIds, sentOffPlayerIds }),
    matchId
  );

  invalidateLeaderboardCache();
  return { predictions, squadStats: squadCount };
}

export function getMatchFantasyDraft(matchId: number): {
  homeScore: number;
  awayScore: number;
  homeGoals: GoalEventInput[];
  awayGoals: GoalEventInput[];
  playedPlayerIds: string[];
  sentOffPlayerIds: string[];
  statsCount: number;
} | null {
  const match = db.prepare(`
    SELECT id, home_score, away_score, home_team_id, away_team_id, fantasy_events
    FROM matches WHERE id = ? AND stage IN (${rankedStagesSqlIn()})
  `).get(matchId) as {
    id: number;
    home_score: number | null;
    away_score: number | null;
    home_team_id: string;
    away_team_id: string;
    fantasy_events: string | null;
  } | undefined;

  if (!match || match.home_score == null || match.away_score == null) return null;

  if (match.fantasy_events) {
    try {
      const stored = JSON.parse(match.fantasy_events) as {
        homeGoals: GoalEventInput[];
        awayGoals: GoalEventInput[];
        playedPlayerIds: string[];
        sentOffPlayerIds: string[];
      };
      const statRows = db.prepare(`
        SELECT player_id FROM player_match_stats WHERE match_id = ?
      `).all(matchId) as Array<{ player_id: string }>;
      return {
        homeScore: match.home_score,
        awayScore: match.away_score,
        homeGoals: stored.homeGoals ?? [],
        awayGoals: stored.awayGoals ?? [],
        playedPlayerIds: stored.playedPlayerIds ?? [],
        sentOffPlayerIds: stored.sentOffPlayerIds ?? [],
        statsCount: statRows.length,
      };
    } catch {
      /* fallback */
    }
  }

  const statRows = db.prepare(`
    SELECT player_id, goals, assists, sent_off, played
    FROM player_match_stats WHERE match_id = ?
  `).all(matchId) as Array<{
    player_id: string;
    goals: number;
    assists: number;
    sent_off: number;
    played: number;
  }>;

  const homeGoals: GoalEventInput[] = [];
  const awayGoals: GoalEventInput[] = [];

  for (const row of statRows) {
    const player = getSquadPlayer(row.player_id);
    if (!player || row.goals <= 0) continue;
    const target = player.teamId === match.home_team_id ? homeGoals : awayGoals;
    for (let i = 0; i < row.goals; i++) {
      target.push({ scorerId: row.player_id, assistId: null });
    }
  }

  for (const row of statRows) {
    if (row.assists <= 0) continue;
    const player = getSquadPlayer(row.player_id);
    if (!player) continue;
    const teamGoals = player.teamId === match.home_team_id ? homeGoals : awayGoals;
    let assigned = 0;
    for (const goal of teamGoals) {
      if (assigned >= row.assists) break;
      if (!goal.assistId && goal.scorerId !== row.player_id) {
        goal.assistId = row.player_id;
        assigned++;
      }
    }
    for (const goal of teamGoals) {
      if (assigned >= row.assists) break;
      if (!goal.assistId) {
        goal.assistId = row.player_id;
        assigned++;
      }
    }
  }

  return {
    homeScore: match.home_score,
    awayScore: match.away_score,
    homeGoals,
    awayGoals,
    playedPlayerIds: statRows.filter(r => r.played).map(r => r.player_id),
    sentOffPlayerIds: statRows.filter(r => r.sent_off).map(r => r.player_id),
    statsCount: statRows.length,
  };
}

export function resetMatch(matchId: number): { kickoff: string } | null {
  const seed = MATCHES.find(m => m.id === matchId);
  if (!seed) return null;

  db.prepare(`
    UPDATE matches SET
      home_team_id = ?, away_team_id = ?,
      kickoff = ?, status = 'scheduled',
      home_score = NULL, away_score = NULL,
      external_fixture_id = ?
    WHERE id = ?
  `).run(
    seed.homeTeamId,
    seed.awayTeamId,
    seed.kickoff,
    seed.externalFixtureId ?? null,
    matchId
  );

  db.prepare(`UPDATE predictions SET points = NULL WHERE match_id = ?`).run(matchId);
  db.prepare(`DELETE FROM player_match_stats WHERE match_id = ?`).run(matchId);
  db.prepare(`UPDATE matches SET fantasy_events = NULL WHERE id = ?`).run(matchId);

  return { kickoff: seed.kickoff };
}
