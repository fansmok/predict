/**
 * Стресс-тест: 100 виртуальных пользователей, первые N матчей ЧМ.
 *
 * Запуск:
 *   npm run stress --workspace=server
 *   npm run stress --workspace=server -- --matches=40 --users=100
 *
 * Сбрасывает пользователей 100001–100100 и симулируемые матчи (не трогает остальных users в БД).
 */
import { performance } from 'node:perf_hooks';
import { initDatabase, db, upsertUser } from './db.js';
import { MATCHES, TEAMS } from './data/matches.js';
import { calculatePoints } from './scoring.js';
import { getGameDay, canPredictMatch } from './game-day.js';
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
  resetSquadScoringCache,
} from './squad.js';
import { getUserTournamentPoints, isTournamentLocked } from './tournament.js';
import { getUserTotalPoints, getMatchPoints, buildRankedLeaderboard, getTournamentRow } from './ranking.js';
import { applyMatchResult, settleTournamentResults } from './admin.js';
import { recordReferral, acceptInviteOnJoin } from './friends.js';
import {
  createLeague,
  joinLeagueByCode,
  getLeagueLeaderboard,
  getLeaguesRanking,
  isLeagueMember,
} from './leagues.js';
import { LEAGUE_EMOJI_OPTIONS } from './data/league-emojis.js';

const FIRST_NAMES = [
  'Алексей', 'Мария', 'Иван', 'Анна', 'Дмитрий', 'Елена', 'Сергей', 'Ольга', 'Никита', 'Татьяна',
  'Павел', 'Юлия', 'Артём', 'Ксения', 'Максим', 'Виктория', 'Андрей', 'Наталья', 'Кирилл', 'София',
  'Роман', 'Алина', 'Егор', 'Полина', 'Влад', 'Дарья', 'Илья', 'Катя', 'Олег', 'Лиза',
];

const LAST_NAMES = [
  'Иванов', 'Петров', 'Сидоров', 'Козлов', 'Новиков', 'Морозов', 'Волков', 'Соколов', 'Лебедев', 'Кузнецов',
  'Попов', 'Васильев', 'Смирнов', 'Михайлов', 'Фёдоров', 'Андреев', 'Алексеев', 'Романов', 'Орлов', 'Соловьёв',
];

type UserProfile = 'superfan' | 'regular' | 'casual' | 'social' | 'minimal';

interface VirtualUser {
  id: number;
  profile: UserProfile;
  rnd: () => number;
  firstName: string;
  lastName: string;
}

interface Bug {
  severity: 'critical' | 'high' | 'medium';
  area: string;
  message: string;
}

interface Metrics {
  users: number;
  matches: number;
  predictions: number;
  squads: number;
  tournamentPicks: number;
  leaguesCreated: number;
  leagueJoins: number;
  referrals: number;
  friendInvitesAccepted: number;
  doublePicks: number;
  msTotal: number;
}

const bugs: Bug[] = [];
const metrics: Metrics = {
  users: 0,
  matches: 0,
  predictions: 0,
  squads: 0,
  tournamentPicks: 0,
  leaguesCreated: 0,
  leagueJoins: 0,
  referrals: 0,
  friendInvitesAccepted: 0,
  doublePicks: 0,
  msTotal: 0,
};

function parseArg(name: string, fallback: number): number {
  const arg = process.argv.find(a => a.startsWith(`--${name}=`));
  if (arg) {
    const n = parseInt(arg.split('=')[1], 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  const env = process.env[`STRESS_${name.toUpperCase()}`];
  if (env) {
    const n = parseInt(env, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return fallback;
}

const USER_COUNT = Math.min(parseArg('users', 100), 500);
const MATCH_LIMIT = Math.min(parseArg('matches', 40), MATCHES.length);
const STRESS_IDS = Array.from({ length: USER_COUNT }, (_, i) => 100_001 + i);
const SIM_MATCHES = MATCHES.slice(0, MATCH_LIMIT);
const SIM_MATCH_IDS = new Set(SIM_MATCHES.map(m => m.id));
const EARLY_SQUAD_CONFIRM = '2026-06-10T12:00:00+03:00';

function log(msg: string) {
  console.log(msg);
}

function bug(severity: Bug['severity'], area: string, message: string) {
  bugs.push({ severity, area, message });
}

function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function pickProfile(rnd: () => number): UserProfile {
  const x = rnd();
  if (x < 0.12) return 'superfan';
  if (x < 0.45) return 'regular';
  if (x < 0.68) return 'casual';
  if (x < 0.82) return 'social';
  return 'minimal';
}

function predictParticipation(profile: UserProfile, rnd: () => number): boolean {
  const base: Record<UserProfile, number> = {
    superfan: 0.96,
    regular: 0.82,
    casual: 0.52,
    social: 0.72,
    minimal: 0.22,
  };
  return rnd() < base[profile];
}

function squadChance(profile: UserProfile): number {
  return { superfan: 0.98, regular: 0.9, casual: 0.65, social: 0.85, minimal: 0.15 }[profile];
}

function tournamentChance(profile: UserProfile): number {
  return { superfan: 0.99, regular: 0.92, casual: 0.58, social: 0.88, minimal: 0.25 }[profile];
}

function createLeagueChance(profile: UserProfile): number {
  return { superfan: 0.14, regular: 0.06, casual: 0.03, social: 0.38, minimal: 0.01 }[profile];
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
    if (candidates.length === 0) throw new Error(`No squad slot ${slot}`);
    const player = candidates[Math.floor(rnd() * candidates.length)];
    squad.push(player.id);
    used.add(player.id);
    teamCounts[player.teamId] = (teamCounts[player.teamId] ?? 0) + 1;
    const group = getTeamFifaGroup(player.teamId);
    if (group) groupCounts[group] = (groupCounts[group] ?? 0) + 1;
  }

  const err = validateSquad(squad);
  if (err) throw new Error(err);
  return squad;
}

function saveSquad(userId: number, confirmedAt: string) {
  const squad = buildValidSquad(userId);
  db.prepare('DELETE FROM user_squad WHERE user_id = ?').run(userId);
  const ins = db.prepare('INSERT INTO user_squad (user_id, player_id, slot) VALUES (?, ?, ?)');
  squad.forEach((pid, slot) => ins.run(userId, pid, slot));
  setUserSquadConfirmedAt(userId, confirmedAt);
  resetSquadScoringCache();
  metrics.squads++;
}

function matchScore(matchId: number): { home: number; away: number } {
  return { home: (matchId * 3 + 1) % 4, away: (matchId * 7 + 2) % 3 };
}

function cleanupStressData() {
  const ph = STRESS_IDS.map(() => '?').join(',');

  db.prepare(`DELETE FROM league_members WHERE user_id IN (${ph})`).run(...STRESS_IDS);
  db.prepare(`DELETE FROM leagues WHERE owner_id IN (${ph})`).run(...STRESS_IDS);
  db.prepare(`DELETE FROM friend_invites WHERE inviter_id IN (${ph}) OR invitee_id IN (${ph})`).run(...STRESS_IDS, ...STRESS_IDS);
  db.prepare(`DELETE FROM user_referrals WHERE referrer_id IN (${ph}) OR referred_id IN (${ph})`).run(...STRESS_IDS, ...STRESS_IDS);
  db.prepare(`DELETE FROM double_picks WHERE user_id IN (${ph})`).run(...STRESS_IDS);
  db.prepare(`DELETE FROM tournament_picks WHERE user_id IN (${ph})`).run(...STRESS_IDS);
  db.prepare(`DELETE FROM user_squad WHERE user_id IN (${ph})`).run(...STRESS_IDS);
  db.prepare(`DELETE FROM predictions WHERE user_id IN (${ph})`).run(...STRESS_IDS);
  db.prepare(`DELETE FROM users WHERE id IN (${ph})`).run(...STRESS_IDS);

  for (const m of SIM_MATCHES) {
    db.prepare(`
      UPDATE matches SET kickoff = ?, status = 'scheduled', home_score = NULL, away_score = NULL
      WHERE id = ?
    `).run(m.kickoff, m.id);
    db.prepare(`UPDATE predictions SET points = NULL WHERE match_id = ?`).run(m.id);
    db.prepare(`DELETE FROM player_match_stats WHERE match_id = ?`).run(m.id);
  }

  db.prepare(`DELETE FROM player_match_stats WHERE match_id IN (${[...SIM_MATCH_IDS].map(() => '?').join(',')})`).run(
    ...SIM_MATCH_IDS
  );
  db.prepare(`DELETE FROM tournament_results`).run();
}

function setupUsers(): VirtualUser[] {
  const users: VirtualUser[] = [];
  for (let i = 0; i < STRESS_IDS.length; i++) {
    const id = STRESS_IDS[i];
    const rnd = seededRandom(id * 7919);
    const profile = pickProfile(rnd);
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i * 7) % LAST_NAMES.length];
    upsertUser({
      id,
      first_name: firstName,
      last_name: lastName,
      username: `stress_${id}`,
    });
    users.push({ id, profile, rnd, firstName, lastName });
  }
  metrics.users = users.length;
  return users;
}

function setupSocialGraph(users: VirtualUser[]) {
  const insertInvite = db.prepare(`
    INSERT INTO friend_invites (inviter_id, invitee_id, status)
    VALUES (?, ?, ?)
    ON CONFLICT(inviter_id, invitee_id) DO UPDATE SET status = excluded.status
  `);

  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    const friendCount =
      u.profile === 'social' ? 4 + Math.floor(u.rnd() * 6) :
      u.profile === 'superfan' ? 2 + Math.floor(u.rnd() * 4) :
      u.profile === 'regular' ? 1 + Math.floor(u.rnd() * 3) :
      Math.floor(u.rnd() * 2);

    for (let f = 0; f < friendCount; f++) {
      const targetIdx = Math.floor(u.rnd() * users.length);
      if (targetIdx === i) continue;
      const target = users[targetIdx];
      if (u.rnd() < 0.55 && recordReferral(u.id, target.id)) {
        metrics.referrals++;
      }
      if (u.rnd() < 0.35) {
        const status = u.rnd() < 0.65 ? 'accepted' : 'pending';
        insertInvite.run(u.id, target.id, status);
        if (status === 'accepted') {
          acceptInviteOnJoin(target.id);
          metrics.friendInvitesAccepted++;
        }
      }
    }
  }
}

function setupLeagues(users: VirtualUser[]): Array<{ id: number; code: string; ownerId: number }> {
  const leagues: Array<{ id: number; code: string; ownerId: number }> = [];

  for (const u of users) {
    if (u.rnd() >= createLeagueChance(u.profile)) continue;
    const emoji = LEAGUE_EMOJI_OPTIONS[Math.floor(u.rnd() * LEAGUE_EMOJI_OPTIONS.length)];
    const name = `Лига ${u.firstName} ${Math.floor(u.rnd() * 900) + 100}`;
    try {
      const league = createLeague(u.id, name, emoji);
      if (league.code) {
        leagues.push({ id: league.id, code: league.code, ownerId: u.id });
        metrics.leaguesCreated++;
      }
    } catch (e) {
      bug('medium', 'leagues', `createLeague failed for ${u.id}: ${e instanceof Error ? e.message : e}`);
    }
  }

  for (const u of users) {
    if (leagues.length === 0) break;
    const joins = u.profile === 'superfan' ? 2 + Math.floor(u.rnd() * 3) :
      u.profile === 'social' ? 2 + Math.floor(u.rnd() * 2) :
      u.profile === 'regular' ? 1 + Math.floor(u.rnd() * 2) :
      Math.floor(u.rnd() * 2);

    for (let j = 0; j < joins; j++) {
      const league = leagues[Math.floor(u.rnd() * leagues.length)];
      if (league.ownerId === u.id) continue;
      if (isLeagueMember(league.id, u.id)) continue;
      try {
        joinLeagueByCode(u.id, league.code);
        metrics.leagueJoins++;
      } catch {
        /* already member or bad code */
      }
    }
  }

  return leagues;
}

function setupTournamentAndSquads(users: VirtualUser[]) {
  const teamList = Object.keys(TEAMS);
  const playerList = PLAYERS.filter(p => p.id !== 'other');
  const insTour = db.prepare(`
    INSERT INTO tournament_picks (user_id, winner_team_id, second_team_id, third_team_id, top_scorer_player_id)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      winner_team_id=excluded.winner_team_id,
      second_team_id=excluded.second_team_id,
      third_team_id=excluded.third_team_id,
      top_scorer_player_id=excluded.top_scorer_player_id
  `);

  for (const u of users) {
    if (u.rnd() < tournamentChance(u.profile)) {
      insTour.run(
        u.id,
        teamList[Math.floor(u.rnd() * teamList.length)],
        teamList[Math.floor(u.rnd() * teamList.length)],
        teamList[Math.floor(u.rnd() * teamList.length)],
        playerList[Math.floor(u.rnd() * playerList.length)].id
      );
      metrics.tournamentPicks++;
    }

    if (u.rnd() < squadChance(u.profile) && u.profile !== 'minimal') {
      saveSquad(u.id, EARLY_SQUAD_CONFIRM);
    }
  }
}

function upsertPrediction(userId: number, matchId: number, home: number, away: number) {
  db.prepare(`
    INSERT INTO predictions (user_id, match_id, home_score, away_score)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, match_id) DO UPDATE SET home_score=excluded.home_score, away_score=excluded.away_score
  `).run(userId, matchId, home, away);
  metrics.predictions++;
}

function setupDoublePicks(users: VirtualUser[], upToMatchIndex: number) {
  const seenDays = new Set<string>();
  for (const u of users) {
    if (u.rnd() > 0.42) continue;
    const match = SIM_MATCHES[Math.floor(u.rnd() * Math.min(upToMatchIndex + 1, SIM_MATCHES.length))];
    const day = getGameDay(match.kickoff);
    if (seenDays.has(`${u.id}:${day}`)) continue;
    seenDays.add(`${u.id}:${day}`);
    db.prepare(`
      INSERT INTO double_picks (user_id, game_day, match_id) VALUES (?, ?, ?)
      ON CONFLICT(user_id, game_day) DO UPDATE SET match_id = excluded.match_id
    `).run(u.id, day, match.id);
    metrics.doublePicks++;
  }
}

/** Прогнозы только на ещё не сыгранные матчи в диапазоне [fromIndex, toIndex). */
function predictForMatchRange(users: VirtualUser[], fromIndex: number, toIndex: number) {
  for (let mi = fromIndex; mi < toIndex; mi++) {
    const m = SIM_MATCHES[mi];
    const status = db.prepare('SELECT status FROM matches WHERE id = ?').get(m.id) as { status: string };
    if (status.status !== 'scheduled') continue;

    for (const u of users) {
      if (!predictParticipation(u.profile, u.rnd)) continue;
      const exists = db.prepare(
        'SELECT 1 FROM predictions WHERE user_id = ? AND match_id = ?'
      ).get(u.id, m.id);
      if (exists) continue;
      if (!canPredictMatch(m.stage, m.kickoff, status.status)) continue;
      upsertPrediction(u.id, m.id, Math.floor(u.rnd() * 4), Math.floor(u.rnd() * 4));
    }
  }
}

function addFantasyStatsForMatch(matchId: number, homeScore: number, awayScore: number) {
  const match = db.prepare('SELECT home_team_id, away_team_id FROM matches WHERE id = ?').get(matchId) as {
    home_team_id: string;
    away_team_id: string;
  };
  const homeWon = homeScore > awayScore;
  const awayWon = awayScore > homeScore;
  const upsert = db.prepare(`
    INSERT INTO player_match_stats (match_id, player_id, goals, assists, team_won, clean_sheet, goals_conceded, sent_off, played)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    ON CONFLICT(match_id, player_id) DO UPDATE SET
      goals=excluded.goals, assists=excluded.assists,
      team_won=excluded.team_won, clean_sheet=excluded.clean_sheet,
      goals_conceded=excluded.goals_conceded, sent_off=excluded.sent_off, played=1
  `);

  for (const p of SQUAD_PLAYERS) {
    if (p.teamId !== match.home_team_id && p.teamId !== match.away_team_id) continue;
    const isHome = p.teamId === match.home_team_id;
    const rnd = seededRandom(matchId * 997 + p.id.length);
    if (rnd() > 0.38) continue;
    const defOrGk = p.position === 'GK' || p.position === 'DEF';
    const conceded = isHome ? awayScore : homeScore;
    upsert.run(
      matchId,
      p.id,
      p.position === 'FWD' && rnd() > 0.55 ? 1 : 0,
      p.position === 'MID' && rnd() > 0.65 ? 1 : 0,
      isHome ? (homeWon ? 1 : 0) : (awayWon ? 1 : 0),
      defOrGk && (isHome ? awayScore === 0 : homeScore === 0) ? 1 : 0,
      defOrGk ? conceded : 0,
      defOrGk && rnd() > 0.96 ? 1 : 0
    );
  }
}

function playMatches(users: VirtualUser[]) {
  const results = new Map<number, { home: number; away: number }>();
  const batchSize = 5;

  for (let start = 0; start < SIM_MATCHES.length; start += batchSize) {
    const end = Math.min(start + batchSize, SIM_MATCHES.length);

    predictForMatchRange(users, start, end);

    for (let mi = start; mi < end; mi++) {
      const m = SIM_MATCHES[mi];
      const score = matchScore(m.id);
      results.set(m.id, score);
      applyMatchResult(m.id, score.home, score.away);
      addFantasyStatsForMatch(m.id, score.home, score.away);

      if (mi === Math.floor(SIM_MATCHES.length * 0.35) || mi === SIM_MATCHES.length - 3) {
        for (const u of users) {
          if (getUserSquadConfirmedAt(u.id)) continue;
          if (u.rnd() > 0.55) continue;
          const lateAt = new Date(new Date(m.kickoff).getTime() + 3600_000).toISOString();
          saveSquad(u.id, lateAt);
        }
      }
    }
  }

  return results;
}

function settleTournament() {
  settleTournamentResults('arg', 'fra', 'bra', 'mbappe');
}

function validateStress(users: VirtualUser[], leagues: Array<{ id: number; code: string; ownerId: number }>) {
  const simPh = [...SIM_MATCH_IDS].map(() => '?').join(',');

  const unfinished = db.prepare(`
    SELECT COUNT(*) as c FROM matches
    WHERE id IN (${simPh}) AND status != 'finished'
  `).get(...SIM_MATCH_IDS) as { c: number };
  if (unfinished.c > 0) {
    bug('high', 'matches', `${unfinished.c} матчей не finished после прогона`);
  }

  const nullPts = db.prepare(`
    SELECT COUNT(*) as c FROM predictions p
    JOIN matches m ON m.id = p.match_id AND m.status = 'finished'
    WHERE p.user_id IN (${STRESS_IDS.map(() => '?').join(',')})
      AND p.points IS NULL AND m.id IN (${simPh})
  `).get(...STRESS_IDS, ...SIM_MATCH_IDS) as { c: number };
  if (nullPts.c > 0) {
    bug('high', 'scoring', `${nullPts.c} прогнозов без очков на завершённых матчах`);
  }

  let pointsMismatches = 0;
  for (const u of users) {
    const expected = getUserTotalPoints(u.id);
    const match = getMatchPoints(u.id);
    const tour = getUserTournamentPoints(getTournamentRow(u.id));
    const squad = getUserSquadPoints(u.id);
    if (expected !== match + tour + squad) {
      pointsMismatches++;
      if (pointsMismatches <= 3) {
        bug('high', 'points', `user ${u.id}: total=${expected} != ${match}+${tour}+${squad}`);
      }
    }
  }
  if (pointsMismatches > 3) {
    bug('high', 'points', `ещё ${pointsMismatches - 3} пользователей с расхождением очков`);
  }

  if (SIM_MATCHES.length > 0 && !isTournamentLocked()) {
    bug('critical', 'tournament', 'Турнирные прогнозы не заблокированы после матчей');
  }

  const publicRanking = getLeaguesRanking(users[0].id);
  if (publicRanking.length < leagues.length) {
    bug('medium', 'leagues', `Публичный рейтинг лиг: ${publicRanking.length} < создано ${leagues.length}`);
  }

  for (const league of leagues.slice(0, 5)) {
    try {
      const lb = getLeagueLeaderboard(league.id, users[0].id);
      if (lb.leaders.length === 0) {
        bug('medium', 'leagues', `Пустой рейтинг лиги ${league.id}`);
      }
      const outsider = users.find(u => !isLeagueMember(league.id, u.id));
      if (outsider) {
        getLeagueLeaderboard(league.id, outsider.id);
      }
    } catch (e) {
      bug('high', 'leagues', `getLeagueLeaderboard: ${e instanceof Error ? e.message : e}`);
    }
  }

  const ranked = buildRankedLeaderboard().filter(e => STRESS_IDS.includes(e.id));
  if (ranked.length < 5) {
    bug('medium', 'leaderboard', 'Мало stress-пользователей в глобальном рейтинге');
  }

}

function printReport(users: VirtualUser[], t0: number) {
  metrics.msTotal = Math.round(performance.now() - t0);

  log('\n========== СТРЕСС-ТЕСТ ==========');
  log(`Пользователей: ${metrics.users}`);
  metrics.matches = MATCH_LIMIT;
  log(`Матчей: ${metrics.matches}`);
  log(`Время: ${(metrics.msTotal / 1000).toFixed(1)} с`);
  log('');
  log('Действия:');
  log(`  Прогнозов на матчи:     ${metrics.predictions}`);
  log(`  Турнирных прогнозов:    ${metrics.tournamentPicks}`);
  log(`  Fantasy-составов:       ${metrics.squads}`);
  log(`  Лиг создано:            ${metrics.leaguesCreated}`);
  log(`  Вступлений в лиги:      ${metrics.leagueJoins}`);
  log(`  Рефералов:              ${metrics.referrals}`);
  log(`  Дружба (принято):       ${metrics.friendInvitesAccepted}`);
  log(`  Ставки ×2:              ${metrics.doublePicks}`);

  const predCount = db.prepare(`
    SELECT COUNT(*) as c FROM predictions WHERE user_id IN (${STRESS_IDS.map(() => '?').join(',')})
  `).get(...STRESS_IDS) as { c: number };
  const avgPred = (predCount.c / metrics.users).toFixed(1);
  log(`  Среднее прогнозов/юзер:  ${avgPred}`);

  log('\n--- Топ-10 глобального рейтинга (stress users) ---');
  const top = buildRankedLeaderboard()
    .filter(e => STRESS_IDS.includes(e.id))
    .slice(0, 10);
  for (const e of top) {
    const u = users.find(x => x.id === e.id);
    log(`  #${e.rank} ${u?.firstName ?? e.id} ${u?.lastName ?? ''} — ${e.totalPoints} очков`);
  }

  log(`\n--- Баги: ${bugs.length} ---`);
  if (bugs.length === 0) {
    log('Критических расхождений не найдено.');
    return;
  }
  for (const b of bugs) {
    log(`  [${b.severity}] ${b.area}: ${b.message}`);
  }
}

function main() {
  const t0 = performance.now();
  log(`=== Стресс-тест: ${USER_COUNT} пользователей, ${MATCH_LIMIT} матчей ===\n`);

  initDatabase();
  log('Очистка данных прошлых прогонов…');
  cleanupStressData();

  log('1/7 Регистрация пользователей');
  const users = setupUsers();

  log('2/7 Социальный граф (друзья, рефералы)');
  setupSocialGraph(users);

  log('3/7 Лиги (создание + вступление по коду)');
  const leagues = setupLeagues(users);

  log('4/7 Турнирные прогнозы и ранние составы');
  setupTournamentAndSquads(users);

  log('5/7 Ставки ×2 и первые прогнозы');
  setupDoublePicks(users, Math.min(9, SIM_MATCHES.length - 1));
  predictForMatchRange(users, 0, Math.min(5, SIM_MATCHES.length));

  log(`6/7 Симуляция ${MATCH_LIMIT} матчей (волнами + догон прогнозов)`);
  playMatches(users);

  log('7/7 Итоги турнира + проверки');
  settleTournament();
  validateStress(users, leagues);

  printReport(users, t0);
  process.exit(bugs.some(b => b.severity === 'critical' || b.severity === 'high') ? 1 : 0);
}

main();
