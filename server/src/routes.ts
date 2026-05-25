import { Router, Request, Response, NextFunction } from 'express';
import { db, upsertUser, DbUser } from './db.js';
import { validateTelegramInitData, createDevUser } from './telegram-auth.js';
import { getGameDay, isMatchLocked, canPredictMatch, shouldAutoDoublePick } from './game-day.js';
import { getMatchPredictionStats, getSingleMatchPredictionStats, type MatchConsensus } from './match-stats.js';
import { buildMatchProfile } from './match-profile.js';
import { PLAYERS, getPlayer, TOURNAMENT_DEADLINE, TOURNAMENT_POINTS } from './data/players.js';
import { isTournamentLocked, getUserTournamentPoints, resolveTournamentPickFields } from './tournament.js';
import {
  enrichSquadResponse,
  getSquadOptions,
  getGlobalSquadPlayerRanking,
  getUserSquadPoints,
  isSquadLockedForUser,
  isLateSquadDeadlinePassed,
  getUserSquadPlayerIds,
  getUserSquadConfirmedAt,
  setUserSquadConfirmedAt,
  validateSquad,
} from './squad.js';
import { SQUAD_SIZE } from './data/squad-players.js';
import { getFifaGroupRulesForClient } from './data/squad-groups.js';
import {
  createLeague,
  getLeaguesPayload,
  getUserLeagues,
  joinLeagueByCode,
  getLeagueLeaderboard,
  getLeagueSummary,
  getLeaguesRanking,
  getLeagueAvgPoints,
  inviteLeagueMembers,
  removeLeagueMember,
} from './leagues.js';
import {
  getFriends,
  getPendingInvites,
  searchUsers,
  sendFriendInvites,
  acceptInviteOnJoin,
} from './friends.js';
import { parseLeagueStartParam, applyLeagueInvite, recordLeagueJoinReferral } from './invite-links.js';
import { buildAppInviteLink, buildLeagueInviteLink } from './telegram-send.js';
import { processStartParamForUser } from './bot-start.js';
import { getPlatinumProgress, getPlatinumFlags, syncReferrersPlatinumStatus } from './platinum.js';
import { enrichFavoriteTeam, getUserFavoriteTeamId, withFavoriteTeams } from './favorite-team.js';
import { getPublicUserProfile, parseUserId } from './user-profile.js';
import botRoutes from './bot-routes.js';
import { adminMiddleware, isAdminUser, logAdminAction } from './admins.js';
import {
  emptyConsensus,
  isDevAuthEnabled,
  parseLeagueCode,
  parseMatchesGroupFilter,
  parseSearchQuery,
  parseUserIdList,
} from './security.js';
import {
  getMatchPoints,
  getTournamentRow,
  getUserTotalPoints,
  computeRank,
  invalidateLeaderboardCache,
  getUserMatchPredictionBreakdown,
  buildLeaderboardEntries,
  buildRankedLeaderboardByKind,
  parseLeaderboardRankKind,
  sliceRankedLeaderboard,
  getTotalsForUserIds,
  type RankedLeaderboardEntry,
  filterGlobalRankedLeaderboard,
} from './ranking.js';
import {
  parseMatchId,
  parseScore,
  getGroupMatch,
  applyMatchResult,
  applyMatchResultFull,
  getAdminTournamentState,
  settleTournamentResults,
  validateTournamentResults,
  validateSquadStats,
  upsertSquadStats,
  resetMatch,
  getMatchFantasyDraft,
  MAX_SCORE,
} from './admin.js';
import { getParticipantTeams, getTeam, flagUrl, isParticipantTeamId, TEAMS } from './data/matches.js';
import { compareTeamsByElite } from './data/squad-groups.js';
import { isPredictableStage, stagesSqlIn } from './match-stages.js';
import {
  getFootballSyncStatus,
  linkMatchToApiFixture,
  syncMatchFromApi,
  syncPendingMatchesFromApi,
  unlinkMatchFromApi,
} from './football-sync.js';

const router = Router();

/** Минимальный интервал между изменениями уже сохранённого прогноза (сек). Новые прогнозы — без ограничения. */
const PREDICTION_UPDATE_COOLDOWN_SEC = 10;

router.use('/bot', botRoutes);

router.get('/config', (_req, res) => {
  res.json({
    tournamentDeadline: TOURNAMENT_DEADLINE,
  });
});

declare global {
  namespace Express {
    interface Request {
      user?: DbUser;
    }
  }
}

function processStartParam(userId: number, startParam: string) {
  processStartParamForUser(userId, startParam);
}

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const initData = req.headers['x-telegram-init-data'] as string | undefined;

  if (initData) {
    const botToken = process.env.BOT_TOKEN ?? '';
    const tgUser = validateTelegramInitData(initData, botToken);
    if (tgUser) {
      req.user = upsertUser(tgUser);
      const params = new URLSearchParams(initData);
      const startParam = params.get('start_param') ?? '';
      if (startParam) processStartParam(req.user.id, startParam);
      return next();
    }
    return res.status(401).json({ error: 'Invalid Telegram auth' });
  }

  if (isDevAuthEnabled()) {
    const devHeader = req.headers['x-dev-user-id'];
    if (devHeader != null && devHeader !== '') {
      const devId = parseInt(String(devHeader), 10);
      if (Number.isInteger(devId) && devId > 0) {
        const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(devId) as DbUser | undefined;
        req.user = existing ?? upsertUser({
          id: devId,
          first_name: `Dev ${devId}`,
          username: `dev_${devId}`,
        });
        return next();
      }
    }
    req.user = upsertUser(createDevUser());
    return next();
  }

  res.status(401).json({ error: 'Unauthorized' });
}

function getUserDoublePicks(userId: number): Record<string, number> {
  const rows = db.prepare(`
    SELECT game_day, match_id FROM double_picks WHERE user_id = ?
  `).all(userId) as Array<{ game_day: string; match_id: number }>;

  return Object.fromEntries(rows.map(r => [r.game_day, r.match_id]));
}

function getGameDayPredictionStates(userId: number, gameDay: string) {
  const rows = db.prepare(`
    SELECT m.id, m.stage, m.kickoff, m.status,
      EXISTS(
        SELECT 1 FROM predictions p
        WHERE p.user_id = ? AND p.match_id = m.id
      ) as has_prediction
    FROM matches m
    WHERE m.stage IN (${stagesSqlIn()})
  `).all(userId) as Array<{
    id: number;
    stage: string;
    kickoff: string;
    status: string;
    has_prediction: number;
  }>;

  return rows
    .filter(r => getGameDay(r.kickoff) === gameDay)
    .map(r => ({
      id: r.id,
      stage: r.stage,
      kickoff: r.kickoff,
      status: r.status,
      hasPrediction: r.has_prediction === 1,
    }));
}

function enrichMatch(row: Record<string, unknown>, doublePicks: Record<string, number>) {
  const home = getTeam(row.home_team_id as string);
  const away = getTeam(row.away_team_id as string);
  const kickoff = row.kickoff as string;
  const stage = row.stage as string;
  const status = row.status as string;
  const gameDay = getGameDay(kickoff);
  const locked = isMatchLocked(kickoff, status);

  return {
    id: row.id,
    kickoff,
    stage,
    group: row.group_name,
    round: row.round,
    status,
    gameDay,
    homeScore: row.home_score,
    awayScore: row.away_score,
    homeTeam: { ...home, flag: flagUrl(home.code) },
    awayTeam: { ...away, flag: flagUrl(away.code) },
    isLocked: locked,
    canPredict: canPredictMatch(stage, kickoff, status),
    isDouble: isPredictableStage(stage) && doublePicks[gameDay] === row.id,
    doublePickMatchId: isPredictableStage(stage) ? (doublePicks[gameDay] ?? null) : null,
    externalFixtureId: row.external_fixture_id ?? null,
  };
}

function attachPredictionsToMatches(
  userId: number,
  matches: ReturnType<typeof enrichMatch>[],
  consensusMap: Map<number, MatchConsensus>
) {
  const userPredictions = db.prepare(`
    SELECT match_id, home_score, away_score, points
    FROM predictions WHERE user_id = ?
  `).all(userId) as Array<{ match_id: number; home_score: number; away_score: number; points: number | null }>;

  const predMap = Object.fromEntries(userPredictions.map(p => [p.match_id, p]));

  return matches.map(m => {
    const id = m.id as number;
    const pred = predMap[id];
    return {
      ...m,
      consensus: consensusMap.get(id) ?? emptyConsensus(),
      prediction: pred
        ? { homeScore: pred.home_score, awayScore: pred.away_score, points: pred.points }
        : null,
    };
  });
}

function queryMatchesByStage(stage: string, group?: string | null) {
  let query = `SELECT * FROM matches WHERE stage = ?`;
  const params: (string | number)[] = [stage];
  if (group) {
    query += ' AND group_name = ?';
    params.push(group);
  }
  query += ' ORDER BY kickoff ASC';
  return db.prepare(query).all(...params) as Array<Record<string, unknown>>;
}

function queryAllPredictableMatches() {
  return db.prepare(`
    SELECT * FROM matches WHERE stage IN (${stagesSqlIn()})
    ORDER BY kickoff ASC
  `).all() as Array<Record<string, unknown>>;
}

function enrichTournamentPicks(userId: number) {
  const row = getTournamentRow(userId);
  const results = db.prepare(`SELECT * FROM tournament_results WHERE id = 1`).get() as {
    winner_team_id: string | null;
    second_team_id: string | null;
    third_team_id: string | null;
    top_scorer_player_id: string | null;
  } | undefined;

  const pick = (teamId: string | null | undefined) => {
    if (!teamId) return null;
    const t = getTeam(teamId);
    return { id: t.id, name: t.name, code: t.code, flag: flagUrl(t.code) };
  };

  const pickPlayer = (playerId: string | null | undefined) => {
    if (!playerId) return null;
    const p = getPlayer(playerId);
    if (!p) return { id: playerId, name: playerId, teamId: null, teamName: null };
    const team = p.teamId !== 'other' ? getTeam(p.teamId) : null;
    return {
      id: p.id,
      name: p.name,
      teamId: p.teamId,
      teamName: team?.name ?? null,
      flag: team ? flagUrl(team.code) : null,
    };
  };

  return {
    locked: isTournamentLocked(),
    deadline: TOURNAMENT_DEADLINE,
    picks: {
      winner: pick(row?.winner_team_id),
      second: pick(row?.second_team_id),
      third: pick(row?.third_team_id),
      topScorer: pickPlayer(row?.top_scorer_player_id),
    },
    points: results
      ? {
          winner: row?.winner_points ?? null,
          second: row?.second_points ?? null,
          third: row?.third_points ?? null,
          topScorer: row?.scorer_points ?? null,
          total: getUserTournamentPoints(row),
        }
      : {
          winner: null,
          second: null,
          third: null,
          topScorer: null,
          total: 0,
        },
    results: results
      ? {
          winner: pick(results.winner_team_id),
          second: pick(results.second_team_id),
          third: pick(results.third_team_id),
          topScorer: pickPlayer(results.top_scorer_player_id),
        }
      : null,
  };
}

router.get('/auth/me', authMiddleware, (req, res) => {
  const userId = req.user!.id;
  const matchPoints = getMatchPoints(userId);
  const tournamentPoints = getUserTournamentPoints(getTournamentRow(userId));
  const squadPoints = getUserSquadPoints(userId);
  const totalPoints = matchPoints + tournamentPoints + squadPoints;
  const predictionBreakdown = getUserMatchPredictionBreakdown(userId);

  const stats = db.prepare(`
    SELECT COUNT(*) as totalPredictions
    FROM predictions WHERE user_id = ?
  `).get(userId) as { totalPredictions: number };

  res.json({
    user: {
      ...req.user,
      isAdmin: isAdminUser(userId),
      isPlatinum: getPlatinumProgress(userId).isPlatinum,
      favoriteTeam: enrichFavoriteTeam(getUserFavoriteTeamId(userId)),
    },
    stats: {
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
    },
  });
});

router.post('/profile/favorite-team', authMiddleware, (req, res) => {
  const { teamId } = req.body as { teamId?: string | null };

  if (teamId != null && teamId !== '') {
    if (typeof teamId !== 'string' || !isParticipantTeamId(teamId)) {
      return res.status(400).json({ error: 'Неизвестная сборная' });
    }
  }

  const value = teamId || null;
  db.prepare(`UPDATE users SET favorite_team_id = ? WHERE id = ?`).run(value, req.user!.id);
  res.json({ favoriteTeam: enrichFavoriteTeam(value) });
});

router.get('/users/:id/profile', authMiddleware, (req, res) => {
  const userId = parseUserId(req.params.id);
  if (!userId) return res.status(400).json({ error: 'Некорректный id пользователя' });

  const profile = getPublicUserProfile(userId, enrichTournamentPicks);
  if (!profile) return res.status(404).json({ error: 'Пользователь не найден' });

  res.json(profile);
});

router.get('/matches', authMiddleware, (req, res) => {
  const group = parseMatchesGroupFilter(req.query.group);
  const rows = group ? queryMatchesByStage('group', group) : queryAllPredictableMatches();
  const doublePicks = getUserDoublePicks(req.user!.id);
  const matches = rows.map(r => enrichMatch(r, doublePicks));
  const matchIds = matches.map(m => m.id as number);
  const consensusMap = getMatchPredictionStats(matchIds);

  res.json({
    doublePicks,
    matches: attachPredictionsToMatches(req.user!.id, matches, consensusMap),
  });
});

router.get('/matches/:id/profile', authMiddleware, (req, res) => {
  const matchId = parseMatchId(req.params.id);
  if (matchId == null) return res.status(400).json({ error: 'Invalid match id' });

  const profile = buildMatchProfile(matchId, req.user!.id);
  if (!profile) {
    return res.status(404).json({ error: 'Профиль доступен только для завершённых матчей' });
  }

  res.json(profile);
});

router.get('/matches/:id', authMiddleware, (req, res) => {
  const row = db.prepare(`SELECT * FROM matches WHERE id = ? AND stage IN (${stagesSqlIn()})`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Match not found' });

  const doublePicks = getUserDoublePicks(req.user!.id);
  const match = enrichMatch(row as Record<string, unknown>, doublePicks);
  const matchId = Number(req.params.id);
  const consensus = getSingleMatchPredictionStats(matchId);
  const prediction = db.prepare(`
    SELECT home_score, away_score, points FROM predictions
    WHERE user_id = ? AND match_id = ?
  `).get(req.user!.id, req.params.id) as { home_score: number; away_score: number; points: number | null } | undefined;

  res.json({
    match: {
      ...match,
      consensus,
      prediction: prediction
        ? { homeScore: prediction.home_score, awayScore: prediction.away_score, points: prediction.points }
        : null,
    },
  });
});

router.post('/predictions', authMiddleware, (req, res) => {
  const matchId = parseMatchId(req.body.matchId);
  const homeScore = parseScore(req.body.homeScore);
  const awayScore = parseScore(req.body.awayScore);
  const { useDouble } = req.body;

  if (matchId == null || homeScore == null || awayScore == null) {
    return res.status(400).json({ error: 'Invalid prediction data' });
  }

  const match = db.prepare(`SELECT * FROM matches WHERE id = ? AND stage IN (${stagesSqlIn()})`).get(matchId) as Record<string, unknown> | undefined;
  if (!match) return res.status(404).json({ error: 'Match not found' });

  if (!canPredictMatch(match.stage as string, match.kickoff as string, match.status as string)) {
    return res.status(403).json({ error: 'Прогнозы закрыты — матч уже начался' });
  }

  const gameDay = getGameDay(match.kickoff as string);
  const userId = req.user!.id;
  const hadPrediction = db.prepare(`
    SELECT 1 FROM predictions WHERE user_id = ? AND match_id = ?
  `).get(userId, matchId);

  if (hadPrediction) {
    const tooSoon = db.prepare(`
      SELECT 1 FROM predictions
      WHERE user_id = ? AND match_id = ?
        AND updated_at > datetime('now', '-' || ? || ' seconds')
    `).get(userId, matchId, PREDICTION_UPDATE_COOLDOWN_SEC);
    if (tooSoon) {
      return res.status(429).json({
        error: `Подождите ${PREDICTION_UPDATE_COOLDOWN_SEC} сек. перед повторным изменением прогноза`,
      });
    }
  }

  const doublePicks = getUserDoublePicks(userId);
  const autoDouble =
    !hadPrediction &&
    shouldAutoDoublePick(matchId, getGameDayPredictionStates(userId, gameDay), doublePicks[gameDay]);

  db.prepare(`
    INSERT INTO predictions (user_id, match_id, home_score, away_score, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, match_id) DO UPDATE SET
      home_score = excluded.home_score,
      away_score = excluded.away_score,
      updated_at = datetime('now')
  `).run(userId, matchId, homeScore, awayScore);
  syncReferrersPlatinumStatus(userId);

  const applyDouble =
    isPredictableStage(match.stage as string) &&
    (useDouble === true || (useDouble !== false && autoDouble));
  if (applyDouble) {
    db.prepare(`
      INSERT INTO double_picks (user_id, game_day, match_id)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, game_day) DO UPDATE SET match_id = excluded.match_id
    `).run(userId, gameDay, matchId);
  } else if (useDouble === false) {
    db.prepare(`
      DELETE FROM double_picks WHERE user_id = ? AND game_day = ? AND match_id = ?
    `).run(userId, gameDay, matchId);
  }

  res.json({ success: true });
});

router.post('/double-picks', authMiddleware, (req, res) => {
  const matchId = parseMatchId(req.body?.matchId);
  if (matchId == null) {
    return res.status(400).json({ error: 'Invalid match id' });
  }

  const match = db.prepare(`SELECT * FROM matches WHERE id = ? AND stage IN (${stagesSqlIn()})`).get(matchId) as
    | Record<string, unknown>
    | undefined;
  if (!match) return res.status(404).json({ error: 'Match not found' });

  if (!canPredictMatch(match.stage as string, match.kickoff as string, match.status as string)) {
    return res.status(403).json({ error: '×2 недоступен — матч уже начался' });
  }

  const gameDay = getGameDay(match.kickoff as string);
  db.prepare(`
    INSERT INTO double_picks (user_id, game_day, match_id)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, game_day) DO UPDATE SET match_id = excluded.match_id
  `).run(req.user!.id, gameDay, matchId);

  res.json({ success: true, gameDay, matchId });
});

router.delete('/double-picks/:matchId', authMiddleware, (req, res) => {
  const matchId = parseMatchId(req.params.matchId);
  if (matchId == null) return res.status(400).json({ error: 'Invalid match id' });

  const match = db.prepare('SELECT kickoff, status, stage FROM matches WHERE id = ?').get(matchId) as {
    kickoff: string;
    status: string;
    stage: string;
  } | undefined;
  if (!match) return res.status(404).json({ error: 'Match not found' });

  if (!canPredictMatch(match.stage, match.kickoff, match.status)) {
    return res.status(403).json({ error: '×2 нельзя изменить — матч уже начался' });
  }

  const gameDay = getGameDay(match.kickoff);
  db.prepare(`DELETE FROM double_picks WHERE user_id = ? AND game_day = ? AND match_id = ?`).run(
    req.user!.id,
    gameDay,
    matchId
  );

  res.json({ success: true });
});

router.get('/tournament/options', authMiddleware, (_req, res) => {
  const teams = getParticipantTeams()
    .map(t => ({ id: t.id, name: t.name, code: t.code, flag: flagUrl(t.code) }))
    .sort((a, b) => compareTeamsByElite(a.id, b.id));

  const players = PLAYERS.map(p => {
    const team = p.teamId !== 'other' ? getTeam(p.teamId) : null;
    return {
      id: p.id,
      name: p.name,
      teamId: p.teamId,
      teamName: team?.name ?? null,
      flag: team ? flagUrl(team.code) : null,
    };
  });

  res.json({
    teams,
    players,
    points: TOURNAMENT_POINTS,
    deadline: TOURNAMENT_DEADLINE,
  });
});

router.get('/tournament/picks', authMiddleware, (req, res) => {
  res.json(enrichTournamentPicks(req.user!.id));
});

router.post('/tournament/picks', authMiddleware, (req, res) => {
  if (isTournamentLocked()) {
    return res.status(403).json({ error: 'Прогнозы на турнир закрыты — турнир уже начался' });
  }

  const { winnerTeamId, secondTeamId, thirdTeamId, topScorerPlayerId } = req.body;
  const existing = getTournamentRow(req.user!.id);
  const {
    winnerTeamId: finalWinner,
    secondTeamId: finalSecond,
    thirdTeamId: finalThird,
    topScorerPlayerId: finalScorer,
  } = resolveTournamentPickFields(existing, { winnerTeamId, secondTeamId, thirdTeamId, topScorerPlayerId });

  const teamIds = [finalWinner, finalSecond, finalThird].filter(Boolean);
  if (new Set(teamIds).size !== teamIds.length) {
    return res.status(400).json({ error: 'Команды на 1–3 место должны быть разными' });
  }

  for (const id of teamIds) {
    if (!isParticipantTeamId(id as string)) {
      return res.status(400).json({ error: 'Выберите сборную из списка участников ЧМ' });
    }
  }

  if (finalScorer && !getPlayer(finalScorer)) {
    return res.status(400).json({ error: 'Неизвестный игрок' });
  }

  db.prepare(`
    INSERT INTO tournament_picks (user_id, winner_team_id, second_team_id, third_team_id, top_scorer_player_id, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      winner_team_id = excluded.winner_team_id,
      second_team_id = excluded.second_team_id,
      third_team_id = excluded.third_team_id,
      top_scorer_player_id = excluded.top_scorer_player_id,
      updated_at = datetime('now')
  `).run(
    req.user!.id,
    finalWinner,
    finalSecond,
    finalThird,
    finalScorer
  );

  res.json(enrichTournamentPicks(req.user!.id));
});

router.get('/squad/options', authMiddleware, (_req, res) => {
  res.json({ players: getSquadOptions(), size: SQUAD_SIZE, groupRules: getFifaGroupRulesForClient() });
});

router.get('/squad/global-ranking', authMiddleware, (_req, res) => {
  res.json(getGlobalSquadPlayerRanking());
});

router.get('/squad', authMiddleware, (req, res) => {
  res.json(enrichSquadResponse(req.user!.id));
});

router.post('/squad', authMiddleware, (req, res) => {
  const userId = req.user!.id;
  if (isSquadLockedForUser(userId)) {
    const noSquad =
      getUserSquadPlayerIds(userId).length === 0 && !getUserSquadConfirmedAt(userId);
    if (noSquad && isLateSquadDeadlinePassed()) {
      return res.status(403).json({ error: 'Приём составов закрыт — собрать команду можно было до 24 июня 20:00 МСК' });
    }
    return res.status(403).json({ error: 'Состав зафиксирован — после старта турнира его нельзя изменить' });
  }

  const { playerIds } = req.body;
  if (!Array.isArray(playerIds)) {
    return res.status(400).json({ error: 'Неверный формат данных' });
  }

  const error = validateSquad(playerIds as string[]);
  if (error) return res.status(400).json({ error });

  const save = db.transaction((ids: string[]) => {
    db.prepare('DELETE FROM user_squad WHERE user_id = ?').run(userId);
    const insert = db.prepare('INSERT INTO user_squad (user_id, player_id, slot) VALUES (?, ?, ?)');
    ids.forEach((id, i) => insert.run(userId, id, i));
  });
  save(playerIds as string[]);
  if (!getUserSquadConfirmedAt(userId)) {
    setUserSquadConfirmedAt(userId);
  }
  invalidateLeaderboardCache();

  res.json(enrichSquadResponse(userId));
});

function leaderFromEntry(entry: RankedLeaderboardEntry, isPlatinum: boolean) {
  return {
    id: entry.id,
    firstName: entry.firstName,
    lastName: entry.lastName,
    username: entry.username,
    photoUrl: entry.photoUrl,
    totalPoints: entry.totalPoints,
    matchPoints: entry.matchPoints,
    tournamentPoints: entry.tournamentPoints,
    squadPoints: entry.squadPoints,
    predictionsCount: entry.predictionsCount,
    outcomeHits: entry.outcomeHits,
    differenceHits: entry.differenceHits,
    exactScores: entry.exactScores,
    goodPredictions: entry.goodPredictions,
    rank: entry.rank,
    isPlatinum,
  };
}

router.get('/leaderboard', authMiddleware, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const kind = parseLeaderboardRankKind(req.query.kind);
  const fullRanked = buildRankedLeaderboardByKind(kind);
  const ranked = filterGlobalRankedLeaderboard(fullRanked, kind);
  const { leaders: top, neighborhood: nbSlice } = sliceRankedLeaderboard(
    ranked,
    req.user!.id,
    limit
  );
  const myEntry = fullRanked.find(e => e.id === req.user!.id) ?? null;
  const platinumMap = getPlatinumFlags(top.map(l => l.id));

  const leaders = withFavoriteTeams(top.map(l => leaderFromEntry(l, platinumMap.get(l.id) ?? false)));

  const myTotal = myEntry?.totalPoints ?? getUserTotalPoints(req.user!.id);
  const myRankNum = myEntry?.rank ?? computeRank(req.user!.id, kind);

  let neighborhood: ReturnType<typeof leaderFromEntry>[] | undefined;
  if (nbSlice.length > 0) {
    const nbPlatinum = getPlatinumFlags(nbSlice.map(l => l.id));
    neighborhood = withFavoriteTeams(nbSlice.map(l => leaderFromEntry(l, nbPlatinum.get(l.id) ?? false)));
  }

  res.json({
    leaders,
    myRank: {
      rank: myRankNum,
      totalPoints: myTotal,
      matchPoints: myEntry?.matchPoints ?? getMatchPoints(req.user!.id),
      tournamentPoints: myEntry?.tournamentPoints ?? getUserTournamentPoints(getTournamentRow(req.user!.id)),
      squadPoints: myEntry?.squadPoints ?? getUserSquadPoints(req.user!.id),
      predictionsCount: myEntry?.predictionsCount ?? 0,
      outcomeHits: myEntry?.outcomeHits ?? 0,
      differenceHits: myEntry?.differenceHits ?? 0,
      exactScores: myEntry?.exactScores ?? 0,
      goodPredictions: myEntry?.goodPredictions ?? 0,
    },
    neighborhood,
  });
});

router.post('/bootstrap', authMiddleware, (req, res) => {
  const userId = req.user!.id;

  acceptInviteOnJoin(userId);

  const startParam =
    typeof req.body?.startParam === 'string' ? req.body.startParam.trim().slice(0, 256) : '';
  if (startParam) processStartParam(userId, startParam);

  res.json({ success: true });
});

router.get('/friends', authMiddleware, (req, res) => {
  const userId = req.user!.id;
  res.json({
    friends: getFriends(userId),
    pending: getPendingInvites(userId),
    inviteLink: buildAppInviteLink(userId),
    platinum: getPlatinumProgress(userId),
  });
});

router.get('/friends/search', authMiddleware, (req, res) => {
  const q = parseSearchQuery(req.query.q);
  const users = searchUsers(q, req.user!.id);
  res.json({ users });
});

router.post('/friends/invite', authMiddleware, async (req, res) => {
  const { userIds } = req.body;
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ error: 'Выберите друзей' });
  }

  const ids = parseUserIdList(userIds, 20);
  if (ids.length === 0) {
    return res.status(400).json({ error: 'Выберите друзей' });
  }
  const name = req.user!.first_name + (req.user!.last_name ? ` ${req.user!.last_name}` : '');

  try {
    const result = await sendFriendInvites(req.user!.id, ids, name);
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Ошибка отправки' });
  }
});

router.get('/leagues', authMiddleware, (req, res) => {
  res.json(getLeaguesPayload(req.user!.id));
});

router.get('/leagues/ranking', authMiddleware, (req, res) => {
  const leagues = getLeaguesRanking(req.user!.id);
  res.json({ leagues });
});

router.post('/leagues', authMiddleware, (req, res) => {
  const { name, emoji, emojiBg } = req.body;
  if (typeof name !== 'string') {
    return res.status(400).json({ error: 'Укажите название' });
  }

  try {
    const league = createLeague(req.user!.id, name, emoji, emojiBg);
    res.json({
      league,
      inviteLink: buildLeagueInviteLink(league.code!, req.user!.id),
    });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Ошибка создания' });
  }
});

router.post('/leagues/join', authMiddleware, (req, res) => {
  const code = parseLeagueCode(req.body?.code);
  if (!code) {
    return res.status(400).json({ error: 'Укажите код лиги' });
  }

  try {
    const bodyStartParam =
      typeof req.body?.startParam === 'string' ? req.body.startParam.trim().slice(0, 256) : '';
    const parsedFromParam = bodyStartParam ? parseLeagueStartParam(bodyStartParam) : null;

    if (parsedFromParam?.code && parsedFromParam.code === code) {
      const league = applyLeagueInvite(req.user!.id, bodyStartParam);
      res.json({ league });
      return;
    }

    const league = joinLeagueByCode(req.user!.id, code);
    recordLeagueJoinReferral(league.id, parsedFromParam?.inviterId, league.ownerId, req.user!.id);
    res.json({ league });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Лига не найдена' });
  }
});

router.post('/leagues/:id/invite', authMiddleware, async (req, res) => {
  const leagueId = parseInt(String(req.params.id), 10);
  if (Number.isNaN(leagueId)) {
    return res.status(400).json({ error: 'Invalid league id' });
  }

  const { userIds } = req.body;
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ error: 'Выберите участников' });
  }

  const ids = parseUserIdList(userIds, 20);
  if (ids.length === 0) {
    return res.status(400).json({ error: 'Выберите участников' });
  }
  const name = req.user!.first_name + (req.user!.last_name ? ` ${req.user!.last_name}` : '');

  try {
    const result = await inviteLeagueMembers(leagueId, req.user!.id, ids, name);
    res.json(result);
  } catch (e) {
    res.status(403).json({ error: e instanceof Error ? e.message : 'Ошибка' });
  }
});

router.delete('/leagues/:id/members/:userId', authMiddleware, (req, res) => {
  const leagueId = parseInt(String(req.params.id), 10);
  const targetUserId = parseInt(String(req.params.userId), 10);
  if (Number.isNaN(leagueId) || Number.isNaN(targetUserId)) {
    return res.status(400).json({ error: 'Некорректный запрос' });
  }

  try {
    removeLeagueMember(leagueId, req.user!.id, targetUserId);
    res.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Ошибка';
    const status = msg.includes('создатель') || msg.includes('не состоит') ? 400 : 403;
    res.status(status).json({ error: msg });
  }
});

router.get('/leagues/:id/leaderboard', authMiddleware, (req, res) => {
  const leagueId = parseInt(String(req.params.id), 10);
  if (Number.isNaN(leagueId)) {
    return res.status(400).json({ error: 'Invalid league id' });
  }

  try {
    const league = getLeagueSummary(leagueId, req.user!.id);
    if (!league) return res.status(404).json({ error: 'Лига не найдена' });

    const kind = parseLeaderboardRankKind(req.query.kind);
    const { leaders, myRank, neighborhood } = getLeagueLeaderboard(leagueId, req.user!.id, 50, kind);
    const avgPoints = getLeagueAvgPoints(leagueId);
    res.json({
      league: { ...league, avgPoints },
      leaders,
      myRank,
      neighborhood,
    });
  } catch (e) {
    res.status(403).json({ error: e instanceof Error ? e.message : 'Нет доступа' });
  }
});

router.get('/rules', (_req, res) => {
  res.json({
    rules: [
      { points: 5, label: 'Точный счёт', description: 'Угадали точный результат матча' },
      { points: 3, label: 'Разница мячей', description: 'Угадали разницу голов между командами' },
      { points: 2, label: 'Исход матча', description: 'Угадали победителя или ничью' },
      { points: 0, label: 'Мимо', description: 'Прогноз не совпал' },
      { points: 0, kind: 'double', label: '×2 бонус', description: 'Двойная ставка — один матч в игровой день с удвоением очков за угаданный прогноз' },
      { points: 30, label: 'Победитель ЧМ', description: 'Угадали чемпиона мира' },
      { points: 20, label: '2-е место', description: 'Угадали серебряного призёра' },
      { points: 10, label: '3-е место', description: 'Угадали бронзового призёра' },
      { points: 20, label: 'Бомбардир', description: 'Угадали лучшего бомбардира турнира' },
      { points: 1, label: 'Победа команды', description: 'Игрок принял участие в матче — сборная победила' },
      { points: 2, label: 'Гол', description: 'Игрок принял участие в матче и забил гол' },
      { points: 1, label: 'Голевая передача', description: 'Игрок принял участие в матче и отдал голевую передачу' },
      { points: 2, label: 'Сухой матч (ВР/ЗЩ)', description: 'Вратарь или защитник принял участие в матче — команда не пропустила' },
      {
        points: -1,
        kind: 'penalty',
        label: 'Пропущенный гол (ВР/ЗЩ)',
        description: 'Вратарь или защитник принял участие в матче — за каждый пропущенный гол команды',
      },
      {
        points: -2,
        kind: 'penalty',
        label: 'Удаление',
        description: 'Игрок принял участие в матче — красная карточка',
      },
    ],
  });
});

router.get('/admin/sync-status', authMiddleware, adminMiddleware, (_req, res) => {
  res.json(getFootballSyncStatus());
});

router.post('/admin/sync-results', authMiddleware, adminMiddleware, async (req, res) => {
  const userId = req.user!.id;
  try {
    const result = await syncPendingMatchesFromApi();
    logAdminAction(userId, 'sync-results', {
      updated: result.updated,
      processed: result.processed,
      configured: result.configured,
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Ошибка синхронизации' });
  }
});

router.post('/admin/sync-match/:matchId', authMiddleware, adminMiddleware, async (req, res) => {
  const userId = req.user!.id;
  const matchId = parseMatchId(req.params.matchId);
  if (matchId == null) return res.status(400).json({ error: 'Некорректный matchId' });

  const force = req.body?.force === true;

  try {
    const result = await syncMatchFromApi(matchId, force);
    if (result.ok) {
      logAdminAction(userId, 'sync-match', {
        matchId,
        mode: result.mode,
        homeScore: result.homeScore,
        awayScore: result.awayScore,
      });
      return res.json(result);
    }
    const status = result.error.includes('не настроен') ? 503 : 422;
    return res.status(status).json(result);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Ошибка синхронизации' });
  }
});

router.post('/admin/match-api-link', authMiddleware, adminMiddleware, async (req, res) => {
  const userId = req.user!.id;
  const matchId = parseMatchId(req.body.matchId);
  if (matchId == null) return res.status(400).json({ error: 'Некорректный matchId' });
  if (!getGroupMatch(matchId)) {
    return res.status(404).json({ error: 'Матч не найден' });
  }

  if (req.body.clear === true) {
    if (!unlinkMatchFromApi(matchId)) {
      return res.status(404).json({ error: 'Матч не найден' });
    }
    logAdminAction(userId, 'match-api-unlink', { matchId });
    return res.json({ success: true, cleared: true });
  }

  const fixtureId = parseMatchId(req.body.fixtureId);
  if (fixtureId == null) return res.status(400).json({ error: 'Некорректный fixture ID' });

  try {
    const result = await linkMatchToApiFixture(matchId, fixtureId);
    if (!result.ok) {
      const status = result.error.includes('не настроен') ? 503 : 422;
      return res.status(status).json(result);
    }
    logAdminAction(userId, 'match-api-link', {
      matchId,
      fixtureId,
      homeTeamId: result.homeTeamId,
      awayTeamId: result.awayTeamId,
      league: result.league,
    });
    return res.json(result);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Ошибка привязки' });
  }
});

router.post('/admin/match-result', authMiddleware, adminMiddleware, (req, res) => {
  const userId = req.user!.id;

  const matchId = parseMatchId(req.body.matchId);
  const homeScore = parseScore(req.body.homeScore);
  const awayScore = parseScore(req.body.awayScore);

  if (matchId == null) return res.status(400).json({ error: 'Некорректный matchId' });
  if (homeScore == null || awayScore == null) {
    return res.status(400).json({ error: `Счёт должен быть целым числом от 0 до ${MAX_SCORE}` });
  }
  if (!getGroupMatch(matchId)) {
    return res.status(404).json({ error: 'Матч не найден' });
  }

  const hasFantasy =
    Array.isArray(req.body.homeGoals) ||
    Array.isArray(req.body.awayGoals) ||
    Array.isArray(req.body.playedPlayerIds);

  if (hasFantasy) {
    const homeGoals = Array.isArray(req.body.homeGoals) ? req.body.homeGoals : [];
    const awayGoals = Array.isArray(req.body.awayGoals) ? req.body.awayGoals : [];
    const playedPlayerIds = Array.isArray(req.body.playedPlayerIds) ? req.body.playedPlayerIds : [];
    const sentOffPlayerIds = Array.isArray(req.body.sentOffPlayerIds) ? req.body.sentOffPlayerIds : [];

    const result = applyMatchResultFull(
      matchId,
      homeScore,
      awayScore,
      homeGoals,
      awayGoals,
      playedPlayerIds.filter((id: unknown) => typeof id === 'string'),
      sentOffPlayerIds.filter((id: unknown) => typeof id === 'string')
    );
    if (typeof result === 'string') return res.status(400).json({ error: result });

    logAdminAction(userId, 'match-result-full', { matchId, homeScore, awayScore });
    return res.json({
      success: true,
      updated: result.predictions,
      squadStats: result.squadStats,
    });
  }

  const updated = applyMatchResult(matchId, homeScore, awayScore);
  logAdminAction(userId, 'match-result', { matchId, homeScore, awayScore });
  res.json({ success: true, updated });
});

router.post('/admin/match-start', authMiddleware, adminMiddleware, (req, res) => {
  const userId = req.user!.id;

  const matchId = parseMatchId(req.body.matchId);
  if (matchId == null) return res.status(400).json({ error: 'Некорректный matchId' });
  if (!getGroupMatch(matchId)) {
    return res.status(404).json({ error: 'Матч не найден' });
  }

  const pastKickoff = new Date(Date.now() - 60_000).toISOString();
  db.prepare(`UPDATE matches SET kickoff = ?, status = 'live' WHERE id = ?`).run(pastKickoff, matchId);

  logAdminAction(userId, 'match-start', { matchId });
  res.json({ success: true, kickoff: pastKickoff });
});

router.get('/admin/match-fantasy/:matchId', authMiddleware, adminMiddleware, (req, res) => {
  const matchId = parseMatchId(req.params.matchId);
  if (matchId == null) return res.status(400).json({ error: 'Некорректный matchId' });
  if (!getGroupMatch(matchId)) return res.status(404).json({ error: 'Матч не найден' });

  const draft = getMatchFantasyDraft(matchId);
  if (!draft) return res.status(404).json({ error: 'Результат матча ещё не сохранён' });
  res.json(draft);
});

router.post('/admin/match-reset', authMiddleware, adminMiddleware, (req, res) => {
  const userId = req.user!.id;

  const matchId = parseMatchId(req.body.matchId);
  if (matchId == null) return res.status(400).json({ error: 'Некорректный matchId' });

  const result = resetMatch(matchId);
  if (!result) return res.status(404).json({ error: 'Матч не найден в seed-данных' });

  logAdminAction(userId, 'match-reset', { matchId });
  res.json({ success: true, kickoff: result.kickoff });
});

router.get('/admin/tournament-results', authMiddleware, adminMiddleware, (_req, res) => {
  res.json(getAdminTournamentState());
});

router.post('/admin/tournament-results', authMiddleware, adminMiddleware, (req, res) => {
  const userId = req.user!.id;

  const validationError = validateTournamentResults(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  const { winnerTeamId, secondTeamId, thirdTeamId, topScorerPlayerId } = req.body;
  const updated = settleTournamentResults(
    winnerTeamId,
    secondTeamId,
    thirdTeamId,
    topScorerPlayerId
  );

  logAdminAction(userId, 'tournament-results', {
    winnerTeamId,
    secondTeamId,
    thirdTeamId,
    topScorerPlayerId,
  });
  res.json({ success: true, updated });
});

router.post('/admin/squad-stats', authMiddleware, adminMiddleware, (req, res) => {
  const userId = req.user!.id;

  const validated = validateSquadStats(req.body.matchId, req.body.stats);
  if (typeof validated === 'string') {
    return res.status(400).json({ error: validated });
  }

  const updated = upsertSquadStats(validated.matchId, validated.stats);
  logAdminAction(userId, 'squad-stats', { matchId: validated.matchId, rows: updated });
  res.json({ success: true, updated });
});

export default router;
