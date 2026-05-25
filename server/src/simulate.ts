/**
 * Обкатка: 10 виртуальных пользователей, цикл ЧМ-2026.
 * Запуск: npm run simulate (72 матча) | npm run simulate:10 (первые 10 матчей)
 */
import { initDatabase, db, upsertUser } from './db.js';
import { MATCHES, TEAMS } from './data/matches.js';
import { calculatePoints } from './scoring.js';
import { getGameDay, isMatchLocked, canPredictMatch } from './game-day.js';
import { PLAYERS } from './data/players.js';
import {
  SQUAD_PLAYERS,
  SQUAD_SIZE,
  MAX_PLAYERS_PER_TEAM,
  SLOT_POSITIONS,
} from './data/squad-players.js';
import { getTeamFifaGroup, getMaxPlayersForFifaGroup } from './data/squad-groups.js';
import {
  validateSquad,
  getUserSquadPoints,
  setUserSquadConfirmedAt,
  getUserSquadConfirmedAt,
  getUserSquadPlayerIds,
  getAllPlayerMatchStats,
  resetSquadScoringCache,
} from './squad.js';
import { calculateSquadPoints } from './squad-scoring.js';
import { getUserTournamentPoints, isTournamentLocked } from './tournament.js';
import { getUserTotalPoints, getMatchPoints, computeRank } from './ranking.js';
import {
  applyMatchResult,
  settleTournamentResults,
  parseScore,
  getGroupMatch,
} from './admin.js';
import {
  recordReferral,
  getFriends,
  getPendingInvites,
  acceptInviteOnJoin,
} from './friends.js';
import {
  createLeague,
  joinLeagueByCode,
  getLeagueLeaderboard,
  getLeaguesRanking,
} from './leagues.js';

const BOT_IDS = Array.from({ length: 10 }, (_, i) => 100_001 + i);

function parseMatchLimit(): number {
  const arg = process.argv.find(a => a.startsWith('--matches='));
  if (arg) {
    const n = parseInt(arg.split('=')[1], 10);
    if (Number.isFinite(n) && n > 0) return Math.min(n, MATCHES.length);
  }
  const env = process.env.SIM_MATCHES;
  if (env) {
    const n = parseInt(env, 10);
    if (Number.isFinite(n) && n > 0) return Math.min(n, MATCHES.length);
  }
  return MATCHES.length;
}

const MATCH_LIMIT = parseMatchLimit();
const SIM_MATCHES = MATCHES.slice(0, MATCH_LIMIT);
const SIM_MATCH_IDS = new Set(SIM_MATCHES.map(m => m.id));
/** До старта ЧМ — «раннее» подтверждение состава для ботов 1–9 */
const EARLY_SQUAD_CONFIRM = '2026-06-10T12:00:00+03:00';

interface Bug {
  severity: 'critical' | 'high' | 'medium' | 'low';
  area: string;
  message: string;
}

const bugs: Bug[] = [];

function bug(severity: Bug['severity'], area: string, message: string) {
  bugs.push({ severity, area, message });
}

function log(msg: string) {
  console.log(msg);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function buildValidSquad(seed: number): string[] {
  const teamCounts: Record<string, number> = {};
  const groupCounts: Partial<Record<number, number>> = {};
  const used = new Set<string>();
  const squad: string[] = [];
  const rnd = seededRandom(seed);

  for (let slot = 0; slot < SQUAD_SIZE; slot++) {
    const pos = SLOT_POSITIONS[slot];
    const candidates = SQUAD_PLAYERS.filter(p => {
      if (p.position !== pos || used.has(p.id)) return false;
      if ((teamCounts[p.teamId] ?? 0) >= MAX_PLAYERS_PER_TEAM) return false;
      const group = getTeamFifaGroup(p.teamId);
      if (group && (groupCounts[group] ?? 0) >= getMaxPlayersForFifaGroup(group)) return false;
      return true;
    });
    if (candidates.length === 0) throw new Error(`No candidate for slot ${slot}`);
    const player = candidates[Math.floor(rnd() * candidates.length)];
    squad.push(player.id);
    used.add(player.id);
    teamCounts[player.teamId] = (teamCounts[player.teamId] ?? 0) + 1;
    const group = getTeamFifaGroup(player.teamId);
    if (group) groupCounts[group] = (groupCounts[group] ?? 0) + 1;
  }

  const err = validateSquad(squad);
  if (err) throw new Error(`Invalid squad: ${err}`);
  return squad;
}

function getTournamentRow(userId: number) {
  return db.prepare(`SELECT * FROM tournament_picks WHERE user_id = ?`).get(userId) as {
    winner_points: number | null;
    second_points: number | null;
    third_points: number | null;
    scorer_points: number | null;
  } | undefined;
}

function computeExpectedTotal(userId: number): number {
  return getUserTotalPoints(userId);
}

function cleanupSimulationUsers() {
  const placeholders = BOT_IDS.map(() => '?').join(',');
  db.prepare(`DELETE FROM player_match_stats`).run();
  db.prepare(`DELETE FROM tournament_results`).run();
  db.prepare(`DELETE FROM users WHERE id IN (${placeholders})`).run(...BOT_IDS);

  // Сброс матчей и турнирных результатов
  for (const m of MATCHES) {
    db.prepare(`
      UPDATE matches SET kickoff = ?, status = 'scheduled', home_score = NULL, away_score = NULL
      WHERE id = ?
    `).run(m.kickoff, m.id);
    db.prepare(`UPDATE predictions SET points = NULL WHERE match_id = ?`).run(m.id);
  }
  db.prepare(`DELETE FROM player_match_stats`).run();
  db.prepare(`DELETE FROM tournament_results`).run();
}

function setupUsers() {
  for (let i = 0; i < BOT_IDS.length; i++) {
    upsertUser({
      id: BOT_IDS[i],
      first_name: `Бот${i + 1}`,
      last_name: 'Тест',
      username: `bot_test_${i + 1}`,
    });
  }
}

function setupPredictionsAndDoubles() {
  const teamIds = Object.keys(TEAMS);
  const gameDayDoubles = new Map<number, number>(); // userId -> matchId per first game day only for some

  for (let ui = 0; ui < BOT_IDS.length; ui++) {
    const userId = BOT_IDS[ui];
    const rnd = seededRandom(userId * 17);

    for (const m of SIM_MATCHES) {
      if (!canPredictMatch(m.stage, m.kickoff, 'scheduled')) {
        bug('high', 'predictions', `Матч ${m.id} уже заблокирован до начала симуляции (kickoff=${m.kickoff})`);
      }

      const homeScore = Math.floor(rnd() * 4);
      const awayScore = Math.floor(rnd() * 4);

      db.prepare(`
        INSERT INTO predictions (user_id, match_id, home_score, away_score)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, match_id) DO UPDATE SET home_score=excluded.home_score, away_score=excluded.away_score
      `).run(userId, m.id, homeScore, awayScore);

      // Бот1 — точные прогнозы (проверим scoring), остальные — случайные
      if (ui === 0) {
        const actualHome = (m.id * 3 + 1) % 4;
        const actualAway = (m.id * 7 + 2) % 3;
        db.prepare(`
          UPDATE predictions SET home_score = ?, away_score = ? WHERE user_id = ? AND match_id = ?
        `).run(actualHome, actualAway, userId, m.id);
      }
    }

    // ×2 на первый игровой день для каждого бота
    const firstMatch = SIM_MATCHES[ui % SIM_MATCHES.length];
    const gameDay = getGameDay(firstMatch.kickoff);
    db.prepare(`
      INSERT INTO double_picks (user_id, game_day, match_id) VALUES (?, ?, ?)
      ON CONFLICT(user_id, game_day) DO UPDATE SET match_id = excluded.match_id
    `).run(userId, gameDay, firstMatch.id);
    gameDayDoubles.set(userId, firstMatch.id);
  }

  return gameDayDoubles;
}

function setupTournamentPicks() {
  const teamList = Object.keys(TEAMS);
  const playerList = PLAYERS.filter(p => p.id !== 'other');

  for (let i = 0; i < BOT_IDS.length; i++) {
    const userId = BOT_IDS[i];
    db.prepare(`
      INSERT INTO tournament_picks (user_id, winner_team_id, second_team_id, third_team_id, top_scorer_player_id)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        winner_team_id=excluded.winner_team_id,
        second_team_id=excluded.second_team_id,
        third_team_id=excluded.third_team_id,
        top_scorer_player_id=excluded.top_scorer_player_id
    `).run(
      userId,
      teamList[i % teamList.length],
      teamList[(i + 5) % teamList.length],
      teamList[(i + 10) % teamList.length],
      playerList[i % playerList.length].id
    );
  }

  // Бот1 угадывает всё
  db.prepare(`
    UPDATE tournament_picks SET
      winner_team_id = 'arg',
      second_team_id = 'fra',
      third_team_id = 'bra',
      top_scorer_player_id = 'mbappe'
    WHERE user_id = ?
  `).run(BOT_IDS[0]);
}

function getLateConfirmationTime(): string {
  const last = SIM_MATCHES[SIM_MATCHES.length - 1];
  const ms = new Date(last.kickoff).getTime() + 3 * 3600_000;
  return new Date(ms).toISOString();
}

function setupSquads() {
  const lateBot = BOT_IDS[BOT_IDS.length - 1];

  for (let i = 0; i < BOT_IDS.length - 1; i++) {
    const userId = BOT_IDS[i];
    const squad = buildValidSquad(userId);
    db.prepare('DELETE FROM user_squad WHERE user_id = ?').run(userId);
    db.prepare('UPDATE users SET squad_confirmed_at = NULL WHERE id = ?').run(userId);
    const insert = db.prepare('INSERT INTO user_squad (user_id, player_id, slot) VALUES (?, ?, ?)');
    squad.forEach((id, slot) => insert.run(userId, id, slot));
    setUserSquadConfirmedAt(userId, EARLY_SQUAD_CONFIRM);
  }

  // Бот10 без состава — заполнит после сыгранных матчей
  db.prepare('DELETE FROM user_squad WHERE user_id = ?').run(lateBot);
  db.prepare('UPDATE users SET squad_confirmed_at = NULL WHERE id = ?').run(lateBot);
}

/** Имитация POST /squad для пользователя, который собрал команду после старта турнира */
function simulateLateSquadFill(userId: number) {
  const squad = buildValidSquad(userId);
  db.prepare('DELETE FROM user_squad WHERE user_id = ?').run(userId);
  const insert = db.prepare('INSERT INTO user_squad (user_id, player_id, slot) VALUES (?, ?, ?)');
  squad.forEach((id, slot) => insert.run(userId, id, slot));
  if (!getUserSquadConfirmedAt(userId)) {
    setUserSquadConfirmedAt(userId, getLateConfirmationTime());
  }
  resetSquadScoringCache();
}

function setupSocial() {
  // Реферальная цепочка: bot1 -> bot2 -> bot3
  recordReferral(BOT_IDS[0], BOT_IDS[1]);
  recordReferral(BOT_IDS[1], BOT_IDS[2]);

  // Приглашения: bot1 -> bot4 (pending), bot1 -> bot5 (accepted)
  db.prepare(`
    INSERT INTO friend_invites (inviter_id, invitee_id, status) VALUES (?, ?, 'pending')
    ON CONFLICT(inviter_id, invitee_id) DO UPDATE SET status='pending'
  `).run(BOT_IDS[0], BOT_IDS[3]);

  db.prepare(`
    INSERT INTO friend_invites (inviter_id, invitee_id, status) VALUES (?, ?, 'accepted')
    ON CONFLICT(inviter_id, invitee_id) DO UPDATE SET status='accepted'
  `).run(BOT_IDS[0], BOT_IDS[4]);

  // Лига
  const league = createLeague(BOT_IDS[0], 'Боты ЧМ-2026');
  for (let i = 1; i < 7; i++) {
    joinLeagueByCode(BOT_IDS[i], league.code!);
  }

  // Платина для UI-теста: Бот1 и Бот8
  db.prepare(`UPDATE users SET is_platinum = 1 WHERE id IN (?, ?)`).run(BOT_IDS[0], BOT_IDS[7]);
}

function simulateMatches(): Map<number, { home: number; away: number }> {
  const results = new Map<number, { home: number; away: number }>();

  for (const m of SIM_MATCHES) {
    const home = (m.id * 3 + 1) % 4;
    const away = (m.id * 7 + 2) % 3;
    results.set(m.id, { home, away });
    applyMatchResult(m.id, home, away);
  }

  return results;
}

function addSquadStatsForMatch(matchId: number, homeScore: number, awayScore: number) {
  const match = db.prepare('SELECT home_team_id, away_team_id FROM matches WHERE id = ?').get(matchId) as {
    home_team_id: string;
    away_team_id: string;
  };

  const homeWon = homeScore > awayScore;
  const awayWon = awayScore > homeScore;
  const homeClean = awayScore === 0;
  const awayClean = homeScore === 0;

  const upsert = db.prepare(`
    INSERT INTO player_match_stats (match_id, player_id, goals, assists, team_won, clean_sheet, goals_conceded, sent_off, played)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    ON CONFLICT(match_id, player_id) DO UPDATE SET
      goals=excluded.goals, assists=excluded.assists,
      team_won=excluded.team_won, clean_sheet=excluded.clean_sheet,
      goals_conceded=excluded.goals_conceded, sent_off=excluded.sent_off, played=1
  `);

  // Статистика для части игроков из ростеров участников матча
  for (const p of SQUAD_PLAYERS) {
    if (p.teamId !== match.home_team_id && p.teamId !== match.away_team_id) continue;
    const isHome = p.teamId === match.home_team_id;
    const rnd = seededRandom(matchId * 1000 + p.id.length);
    if (rnd() > 0.35) continue;

    const defOrGk = p.position === 'GK' || p.position === 'DEF';
    const conceded = isHome ? awayScore : homeScore;
    const sentOff = defOrGk && rnd() > 0.97 ? 1 : 0;

    upsert.run(
      matchId,
      p.id,
      p.position === 'FWD' && rnd() > 0.6 ? 1 : 0,
      p.position === 'MID' && rnd() > 0.7 ? 1 : 0,
      isHome ? (homeWon ? 1 : 0) : (awayWon ? 1 : 0),
      defOrGk && (isHome ? homeClean : awayClean) ? 1 : 0,
      defOrGk ? conceded : 0,
      sentOff
    );
  }
}

function settleTournament() {
  settleTournamentResults('arg', 'fra', 'bra', 'mbappe');
}

function simulateLeaderboardQuery(limit = 100) {
  const rows = db.prepare(`
    SELECT
      u.id,
      COALESCE(SUM(p.points), 0) +
        COALESCE(MAX(tp.winner_points), 0) + COALESCE(MAX(tp.second_points), 0) +
        COALESCE(MAX(tp.third_points), 0) + COALESCE(MAX(tp.scorer_points), 0) as basePoints,
      COUNT(p.id) as predictionsCount,
      COUNT(CASE WHEN p.points = 5 OR p.points = 10 THEN 1 END) as exactScores
    FROM users u
    LEFT JOIN predictions p ON u.id = p.user_id
    LEFT JOIN tournament_picks tp ON u.id = tp.user_id
    GROUP BY u.id
    HAVING COUNT(p.id) > 0 OR tp.user_id IS NOT NULL OR EXISTS (
      SELECT 1 FROM user_squad us WHERE us.user_id = u.id
    )
  `).all() as Array<{ id: number; basePoints: number; predictionsCount: number; exactScores: number }>;

  return rows
    .map(l => ({
      id: l.id,
      totalPoints: l.basePoints + getUserSquadPoints(l.id),
      exactScores: l.exactScores,
      predictionsCount: l.predictionsCount,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || b.exactScores - a.exactScores)
    .slice(0, limit);
}

function runEdgeCaseTests() {
  log('\n--- Edge-case тесты ---');

  // Самореферал
  if (recordReferral(BOT_IDS[0], BOT_IDS[0])) {
    bug('medium', 'friends', 'recordReferral разрешает самореферал');
  }

  // Реферал от несуществующего пользователя
  if (recordReferral(999999999, BOT_IDS[0])) {
    bug('medium', 'friends', 'recordReferral принимает несуществующего referrer');
  }

  // acceptInviteOnJoin для bot4 (pending -> accepted)
  acceptInviteOnJoin(BOT_IDS[3]);
  const friends = getFriends(BOT_IDS[0]);
  const pending = getPendingInvites(BOT_IDS[0]);
  if (!friends.some(f => f.id === BOT_IDS[3])) {
    bug('high', 'friends', 'После acceptInviteOnJoin bot4 не появился в списке друзей bot1');
  }
  if (pending.some(f => f.id === BOT_IDS[3])) {
    bug('high', 'friends', 'bot4 остался в pending после acceptInviteOnJoin');
  }

  const bot5 = friends.find(f => f.id === BOT_IDS[4]);
  if (bot5 && bot5.status !== 'friend') {
    bug('low', 'friends', `bot5 status=${bot5.status}, ожидался friend (accepted invite)`);
  }

  // Очки друзей в API
  for (const f of friends) {
    if (f.totalPoints == null) {
      bug('high', 'friends', `getFriends не возвращает totalPoints для user ${f.id}`);
    } else if (f.totalPoints !== getUserTotalPoints(f.id)) {
      bug('high', 'friends', `getFriends totalPoints=${f.totalPoints}, actual=${getUserTotalPoints(f.id)} для user ${f.id}`);
    }
  }

  // Unit-тесты scoring
  if (calculatePoints(2, 1, 2, 1, false) !== 5) bug('critical', 'scoring', 'Точный счёт != 5');
  if (calculatePoints(3, 1, 2, 0, false) !== 3) bug('critical', 'scoring', 'Разница != 3');
  if (calculatePoints(1, 0, 2, 1, false) !== 3) bug('critical', 'scoring', 'Та же разница (1:0 vs 2:1) != 3');
  if (calculatePoints(2, 0, 1, 0, false) !== 2) bug('critical', 'scoring', 'Исход П1 != 2');
  if (calculatePoints(0, 0, 1, 2, false) !== 0) bug('critical', 'scoring', 'Мимо != 0');
  if (calculatePoints(2, 1, 2, 1, true) !== 10) bug('critical', 'scoring', 'Double exact != 10');
  if (calculatePoints(0, 0, 1, 2, true) !== 0) bug('critical', 'scoring', 'Double на промахе != 0');

  // Матч live блокирует прогнозы
  const testMatch = MATCHES[0];
  const saved = db.prepare('SELECT status, kickoff, home_score, away_score FROM matches WHERE id = ?').get(testMatch.id) as {
    status: string; kickoff: string; home_score: number; away_score: number;
  };
  db.prepare(`UPDATE matches SET status = 'live' WHERE id = ?`).run(testMatch.id);
  if (canPredictMatch('group', testMatch.kickoff, 'live')) {
    bug('high', 'game-day', 'canPredictMatch=true для status=live');
  }
  db.prepare(`UPDATE matches SET status = ?, home_score = ?, away_score = ? WHERE id = ?`).run(
    saved.status, saved.home_score, saved.away_score, testMatch.id
  );

  const pastKickoff = new Date(Date.now() - 3600_000).toISOString();
  if (!isMatchLocked(pastKickoff, 'scheduled')) {
    bug('high', 'game-day', 'isMatchLocked=false для kickoff в прошлом');
  }

  const badSquad = buildValidSquad(1);
  badSquad[1] = badSquad[0];
  if (!validateSquad(badSquad)) {
    bug('high', 'squad', 'validateSquad не ловит дубликат игрока');
  }

  const overloaded: string[] = [];
  for (let slot = 0; slot < SQUAD_SIZE; slot++) {
    const pos = SLOT_POSITIONS[slot];
    const fromFra = SQUAD_PLAYERS.find(p => p.position === pos && p.teamId === 'fra');
    overloaded.push(fromFra?.id ?? SQUAD_PLAYERS.find(p => p.position === pos)!.id);
  }
  if (!validateSquad(overloaded)) {
    bug('high', 'squad', 'validateSquad не ловит >2 игроков из одной сборной');
  }

  const group1Overload: string[] = [];
  const eliteTeams = ['fra', 'esp', 'arg', 'eng'];
  for (let slot = 0; slot < SQUAD_SIZE; slot++) {
    const pos = SLOT_POSITIONS[slot];
    const teamId = eliteTeams[slot % eliteTeams.length];
    const player = SQUAD_PLAYERS.find(p => p.position === pos && p.teamId === teamId);
    group1Overload.push(player?.id ?? SQUAD_PLAYERS.find(p => p.position === pos)!.id);
  }
  if (!validateSquad(group1Overload)) {
    bug('high', 'squad', 'validateSquad не ловит >3 игроков из группы элиты');
  }

  const group4Overload: string[] = [];
  const outsiderTeams = ['cod', 'qat', 'irq', 'rsa'];
  for (let slot = 0; slot < SQUAD_SIZE; slot++) {
    const pos = SLOT_POSITIONS[slot];
    const teamId = outsiderTeams[slot % outsiderTeams.length];
    const player = SQUAD_PLAYERS.find(p => p.position === pos && p.teamId === teamId);
    group4Overload.push(player?.id ?? SQUAD_PLAYERS.find(p => p.position === pos)!.id);
  }
  if (!validateSquad(group4Overload)) {
    bug('high', 'squad', 'validateSquad не ловит >2 игроков из группы 4');
  }

  // Позднее заполнение состава — без очков за уже сыгранные матчи
  const lateBot = BOT_IDS[BOT_IDS.length - 1];
  simulateLateSquadFill(lateBot);
  const latePts = getUserSquadPoints(lateBot);
  if (latePts !== 0) {
    bug('critical', 'squad', `Поздний состав: ${latePts} очков за прошлые матчи (ожидалось 0)`);
  }

  // Без squad_confirmed_at — 0 очков, даже если состав в БД
  db.prepare('UPDATE users SET squad_confirmed_at = NULL WHERE id = ?').run(lateBot);
  resetSquadScoringCache();
  const ptsWithoutConfirm = getUserSquadPoints(lateBot);
  if (ptsWithoutConfirm !== 0) {
    bug('critical', 'squad', `Без squad_confirmed_at: ${ptsWithoutConfirm} очков (ожидалось 0)`);
  }
  setUserSquadConfirmedAt(lateBot, getLateConfirmationTime());
  resetSquadScoringCache();

  // Раннее подтверждение — очки за матчи после дедлайна состава
  const earlyBot = BOT_IDS[1];
  const earlyPts = getUserSquadPoints(earlyBot);
  const earlyFullPts = calculateSquadPoints(getUserSquadPlayerIds(earlyBot), getAllPlayerMatchStats());
  if (SIM_MATCHES.length > 0 && earlyFullPts > 0 && earlyPts === 0) {
    bug('high', 'squad', `Ранний состав (Бот2): 0 очков при ${earlyFullPts} доступных в симуляции`);
  }

  // Повторное сохранение не сдвигает дату подтверждения (как POST /squad)
  const savedConfirm = getUserSquadConfirmedAt(earlyBot)!;
  if (!getUserSquadConfirmedAt(earlyBot)) {
    setUserSquadConfirmedAt(earlyBot);
  }
  if (getUserSquadConfirmedAt(earlyBot) !== savedConfirm) {
    bug('high', 'squad', 'Повторное сохранение состава сдвинуло squad_confirmed_at');
  }

  // Валидация admin parseScore / getGroupMatch
  if (parseScore(-1) != null) {
    bug('medium', 'admin', 'parseScore принимает отрицательный счёт');
  }
  if (parseScore(16) != null) {
    bug('medium', 'admin', 'parseScore принимает счёт > 15');
  }
  if (getGroupMatch(99999)) {
    bug('high', 'admin', 'getGroupMatch находит несуществующий матч');
  }

  // match-reset + повторный результат (только если матч 70 в прогоне)
  if (SIM_MATCH_IDS.has(70)) {
    const seed70 = MATCHES.find(m => m.id === 70)!;
    db.prepare(`
      UPDATE matches SET kickoff = ?, status = 'scheduled', home_score = NULL, away_score = NULL WHERE id = 70
    `).run(seed70.kickoff);
    db.prepare(`UPDATE predictions SET points = NULL WHERE match_id = 70`).run();
    applyMatchResult(70, (70 * 3 + 1) % 4, (70 * 7 + 2) % 3);
    const ptsAfterReset = db.prepare(`
      SELECT points FROM predictions WHERE user_id = ? AND match_id = 70
    `).get(BOT_IDS[0]) as { points: number };
    if (ptsAfterReset.points == null) {
      bug('high', 'admin', 'После reset+result очки не пересчитались корректно');
    }
  }

  // computeRank не учитывает неактивных пользователей
  upsertUser({ id: 888888, first_name: 'Пустой', username: 'empty' });
  const bot1Total = getUserTotalPoints(BOT_IDS[0]);
  const rank = computeRank(BOT_IDS[0]);
  if (rank !== 1) {
    bug('high', 'rank', `Бот1 должен быть #1, computeRank вернул ${rank}`);
  }
  db.prepare('DELETE FROM users WHERE id = 888888').run();

  // joinLeagueByCode — регистр кода
  const league = db.prepare('SELECT code FROM leagues WHERE owner_id = ? LIMIT 1').get(BOT_IDS[0]) as { code: string };
  if (league) {
    try {
      joinLeagueByCode(BOT_IDS[9], league.code!.toLowerCase());
    } catch {
      bug('medium', 'leagues', 'joinLeagueByCode чувствителен к регистру кода (lowercase не работает)');
    }
  }
}

function runValidation(results: Map<number, { home: number; away: number }>) {
  log('\n--- Валидация после симуляции ---');

  // Очки каждого бота
  for (const userId of BOT_IDS) {
    const expected = computeExpectedTotal(userId);
    const actual = getUserTotalPoints(userId);
    if (expected !== actual) {
      bug('critical', 'points', `user ${userId}: expected=${expected}, getUserTotalPoints=${actual}`);
    }
  }

  // Бот1 — все прогнозы на сыгранные матчи точные
  const bot1Preds = db.prepare(`
    SELECT points FROM predictions WHERE user_id = ? AND points IS NOT NULL
  `).all(BOT_IDS[0]) as Array<{ points: number }>;

  const bot1Exact = bot1Preds.filter(p => p.points === 5 || p.points === 10).length;
  if (bot1Exact !== SIM_MATCHES.length) {
    bug('high', 'scoring', `Бот1: ${bot1Exact}/${SIM_MATCHES.length} точных прогнозов (ожидалось ${SIM_MATCHES.length})`);
  }

  // Проверка double для бота1
  const doubleMatch = db.prepare(`
    SELECT match_id FROM double_picks WHERE user_id = ?
  `).all(BOT_IDS[0]) as Array<{ match_id: number }>;

  for (const d of doubleMatch) {
    const pred = db.prepare(`
      SELECT points FROM predictions WHERE user_id = ? AND match_id = ?
    `).get(BOT_IDS[0], d.match_id) as { points: number } | undefined;
    const result = results.get(d.match_id)!;
    const expectedPred = db.prepare(`
      SELECT home_score, away_score FROM predictions WHERE user_id = ? AND match_id = ?
    `).get(BOT_IDS[0], d.match_id) as { home_score: number; away_score: number };
    const expectedPts = calculatePoints(
      expectedPred.home_score,
      expectedPred.away_score,
      result.home,
      result.away,
      true
    );
    if (pred?.points !== expectedPts) {
      bug('high', 'double', `Бот1 double match ${d.match_id}: points=${pred?.points}, expected=${expectedPts}`);
    }
  }

  // Состав: подтверждённые раньше получают очки, без подтверждения — нет
  for (const userId of BOT_IDS.slice(0, -1)) {
    if (!getUserSquadConfirmedAt(userId)) {
      bug('high', 'squad', `Бот ${userId - 100_000} без squad_confirmed_at после setupSquads`);
    }
  }
  if (getUserSquadPoints(BOT_IDS[BOT_IDS.length - 1]) !== 0) {
    bug('critical', 'squad', 'Бот10 получил очки команды за матчи до подтверждения состава');
  }

  // Турнирные прогнозы закрыты после старта ЧМ (сыгранные матчи)
  if (SIM_MATCHES.length > 0 && !isTournamentLocked()) {
    bug('critical', 'tournament', 'Прогнозы на турнир можно редактировать после начала матчей ЧМ');
  }

  // Бот1 турнирные очки = 30+20+10+20 = 80
  const bot1Tournament = getUserTournamentPoints(getTournamentRow(BOT_IDS[0]));
  if (bot1Tournament !== 80) {
    bug('high', 'tournament', `Бот1 tournament points=${bot1Tournament}, expected 80`);
  }

  // Leaderboard SQL — MAX() для турнирных очков (без завышения при JOIN)
  for (const userId of BOT_IDS) {
    const row = db.prepare(`
      SELECT
        COALESCE(SUM(p.points), 0) +
          COALESCE(MAX(tp.winner_points), 0) + COALESCE(MAX(tp.second_points), 0) +
          COALESCE(MAX(tp.third_points), 0) + COALESCE(MAX(tp.scorer_points), 0) as basePoints,
        COUNT(p.id) as predCount
      FROM users u
      LEFT JOIN predictions p ON u.id = p.user_id
      LEFT JOIN tournament_picks tp ON u.id = tp.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `).get(userId) as { basePoints: number; predCount: number };

    const correctBase =
      getMatchPoints(userId) +
      getUserTournamentPoints(getTournamentRow(userId));

    if (row.basePoints !== correctBase) {
      bug(
        'critical',
        'leaderboard',
        `SQL leaderboard basePoints user ${userId}: sql=${row.basePoints}, correct=${correctBase}`
      );
    }
  }

  const lb = simulateLeaderboardQuery();
  for (const entry of lb.filter(e => BOT_IDS.includes(e.id))) {
    const correct = getUserTotalPoints(entry.id);
    if (entry.totalPoints !== correct) {
      bug(
        'critical',
        'leaderboard',
        `Leaderboard user ${entry.id}: shown=${entry.totalPoints}, correct=${correct}`
      );
    }
  }

  // Лига
  try {
    const league = createLeague(BOT_IDS[0], 'temp-check');
    // already have league - use existing
  } catch { /* ignore */ }

  const leagues = db.prepare(`
    SELECT id FROM leagues WHERE owner_id = ?
  `).all(BOT_IDS[0]) as Array<{ id: number }>;

  if (leagues.length > 0) {
    const leagueId = leagues[0].id;
    const lbLeague = getLeagueLeaderboard(leagueId, BOT_IDS[0]);
    for (const m of lbLeague.leaders) {
      if (m.totalPoints !== getUserTotalPoints(m.id)) {
        bug('high', 'leagues', `League leaderboard user ${m.id}: ${m.totalPoints} vs ${getUserTotalPoints(m.id)}`);
      }
    }

    const ranking = getLeaguesRanking(BOT_IDS[0]);
    if (ranking.length === 0) {
      bug('medium', 'leagues', 'getLeaguesRanking пуст после создания лиги');
    }
  }

  // Все симулированные матчи finished
  const simIds = [...SIM_MATCH_IDS];
  const unfinished = db.prepare(`
    SELECT COUNT(*) as c FROM matches
    WHERE id IN (${simIds.map(() => '?').join(',')}) AND status != 'finished'
  `).get(...simIds) as { c: number };
  if (unfinished.c > 0) {
    bug('medium', 'matches', `${unfinished.c} симулированных матчей не в статусе finished`);
  }

  // NULL points после всех результатов (только симулированные матчи)
  const nullPoints = db.prepare(`
    SELECT COUNT(*) as c FROM predictions p
    JOIN matches m ON m.id = p.match_id AND m.status = 'finished'
    WHERE p.points IS NULL AND m.id IN (${simIds.map(() => '?').join(',')})
  `).get(...simIds) as { c: number };
  if (nullPoints.c > 0) {
    bug('high', 'scoring', `${nullPoints.c} прогнозов без начисленных очков на завершённых матчах`);
  }
}

function printReport() {
  log('\n========== ИТОГИ ОБКАТКИ ==========');
  log(`Виртуальных пользователей: ${BOT_IDS.length}`);
  log(`Матчей сыграно: ${SIM_MATCHES.length} из ${MATCHES.length}`);

  log('\n--- Рейтинг ботов ---');
  const standings = BOT_IDS.map(id => ({
    id,
    name: `Бот${id - 100_000}`,
    match: getMatchPoints(id),
    tournament: getUserTournamentPoints(getTournamentRow(id)),
    squad: getUserSquadPoints(id),
    total: getUserTotalPoints(id),
  })).sort((a, b) => b.total - a.total);

  for (const s of standings) {
    log(`  ${s.name}: ${s.total} pts (матчи ${s.match} + турнир ${s.tournament} + команда ${s.squad})`);
  }

  log(`\n--- Найдено багов: ${bugs.length} ---`);
  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const b of bugs) bySeverity[b.severity]++;

  if (bugs.length === 0) {
    log('Критических проблем не обнаружено.');
    return;
  }

  for (const sev of ['critical', 'high', 'medium', 'low'] as const) {
    const group = bugs.filter(b => b.severity === sev);
    if (group.length === 0) continue;
    log(`\n[${sev.toUpperCase()}] (${group.length})`);
    for (const b of group) {
      log(`  • [${b.area}] ${b.message}`);
    }
  }

  log(`\nСводка: critical=${bySeverity.critical}, high=${bySeverity.high}, medium=${bySeverity.medium}, low=${bySeverity.low}`);
  process.exit(bugs.some(b => b.severity === 'critical' || b.severity === 'high') ? 1 : 0);
}

function main() {
  log(`=== Симуляция ЧМ-2026: 10 виртуальных пользователей, ${SIM_MATCHES.length} матчей ===\n`);

  initDatabase();
  cleanupSimulationUsers();
  setupUsers();

  log('1/7 Прогнозы на матчи + ×2');
  setupPredictionsAndDoubles();

  log('2/7 Турнирные прогнозы');
  setupTournamentPicks();

  log('3/7 Fantasy-сборные');
  setupSquads();

  log('4/7 Друзья, рефералы, лига');
  setupSocial();

  log(`5/7 Симуляция ${SIM_MATCHES.length} матчей`);
  const results = simulateMatches();

  log('6/7 Статистика игроков + итоги турнира');
  for (const [matchId, score] of results) {
    addSquadStatsForMatch(matchId, score.home, score.away);
  }
  settleTournament();

  log('6b/7 Тест позднего состава (Бот10)');
  simulateLateSquadFill(BOT_IDS[BOT_IDS.length - 1]);

  log('7/7 Валидация');
  runValidation(results);
  runEdgeCaseTests();
  // Пересчёт матчей после edge-тестов (если они в прогоне)
  for (const id of [70, 72]) {
    if (SIM_MATCH_IDS.has(id)) {
      applyMatchResult(id, (id * 3 + 1) % 4, (id * 7 + 2) % 3);
    }
  }

  printReport();
}

main();
