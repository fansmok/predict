import { db } from './db.js';
import {
  SQUAD_PLAYERS,
  SQUAD_SIZE,
  MAX_PLAYERS_PER_TEAM,
  getSquadPlayer,
  SQUAD_SCORING,
  SLOT_POSITIONS,
  FORMATION,
  getRequiredPosition,
  compareByPositionThenName,
  type PlayerPosition,
} from './data/squad-players.js';
import {
  calculateSquadPoints,
  getSquadPointsBreakdown,
  getPlayerPointsSummary,
  type PlayerMatchStat,
} from './squad-scoring.js';
import { TOURNAMENT_DEADLINE, LATE_SQUAD_DEADLINE } from './data/players.js';
import { rankedStagesSqlIn } from './match-stages.js';
import { hasWorldCupStarted } from './tournament.js';
import { getTeam, flagUrl } from './data/matches.js';
import {
  getTeamFifaGroup,
  getFifaGroupRulesForClient,
  validateFifaGroupLimits,
} from './data/squad-groups.js';

let matchKickoffMsCache: Map<number, number> | null = null;

function getMatchKickoffMs(matchId: number): number | undefined {
  if (!matchKickoffMsCache) {
    matchKickoffMsCache = new Map();
    const rows = db.prepare('SELECT id, kickoff FROM matches').all() as Array<{ id: number; kickoff: string }>;
    for (const m of rows) {
      matchKickoffMsCache.set(m.id, new Date(m.kickoff).getTime());
    }
  }
  return matchKickoffMsCache.get(matchId);
}

/** Сброс кэша kickoff (тесты / симуляция). */
export function resetSquadScoringCache(): void {
  matchKickoffMsCache = null;
}

export function getUserSquadConfirmedAt(userId: number): string | null {
  const row = db.prepare('SELECT squad_confirmed_at FROM users WHERE id = ?').get(userId) as
    | { squad_confirmed_at: string | null }
    | undefined;
  return row?.squad_confirmed_at ?? null;
}

export function setUserSquadConfirmedAt(userId: number, at: string = new Date().toISOString()): void {
  db.prepare('UPDATE users SET squad_confirmed_at = ? WHERE id = ?').run(at, userId);
}

/**
 * Редактирование состава:
 * - до старта ЧМ — свободно;
 * - после старта — один раз для опоздавших без состава до 24 июня 20:00 МСК;
 * - после дедлайна или при уже сохранённом составе — только просмотр.
 */
export function isLateSquadDeadlinePassed(now = new Date()): boolean {
  return now >= new Date(LATE_SQUAD_DEADLINE);
}

export function isSquadLockedForUser(userId: number): boolean {
  if (!hasWorldCupStarted()) return false;

  const playerIds = getUserSquadPlayerIds(userId);
  if (playerIds.length === SQUAD_SIZE) return true;

  if (getUserSquadConfirmedAt(userId) !== null) return true;

  return isLateSquadDeadlinePassed();
}

export function isLateSquadConfirmation(confirmedAt: string | null): boolean {
  if (!confirmedAt) return false;
  return new Date(confirmedAt).getTime() >= new Date(TOURNAMENT_DEADLINE).getTime();
}

export function getUserSquadPlayerIds(userId: number): string[] {
  const rows = db.prepare(`
    SELECT player_id FROM user_squad WHERE user_id = ? ORDER BY slot ASC
  `).all(userId) as Array<{ player_id: string }>;
  return rows.map(r => r.player_id);
}

let cachedAllPlayerMatchStats: PlayerMatchStat[] | null = null;

export function invalidatePlayerMatchStatsCache(): void {
  cachedAllPlayerMatchStats = null;
}

export function getAllPlayerMatchStats(): PlayerMatchStat[] {
  if (cachedAllPlayerMatchStats) return cachedAllPlayerMatchStats;

  const rows = db.prepare(`
    SELECT pms.match_id as matchId, pms.player_id as playerId, pms.goals, pms.assists,
           pms.team_won as teamWon, pms.clean_sheet as cleanSheet,
           pms.goals_conceded as goalsConceded, pms.sent_off as sentOff,
           pms.played
    FROM player_match_stats pms
    INNER JOIN matches m ON m.id = pms.match_id AND m.stage IN (${rankedStagesSqlIn()})
  `).all() as Array<Omit<PlayerMatchStat, 'teamWon' | 'cleanSheet' | 'sentOff' | 'played'> & {
    teamWon: number;
    cleanSheet: number;
    sentOff: number;
    played: number;
  }>;

  cachedAllPlayerMatchStats = rows.map(r => ({
    ...r,
    teamWon: r.teamWon === 1,
    cleanSheet: r.cleanSheet === 1,
    sentOff: r.sentOff === 1,
    played: r.played === 1,
  }));
  return cachedAllPlayerMatchStats;
}

/** Статистика только за матчи, начавшиеся после подтверждения состава. */
export function getPlayerMatchStatsForUser(userId: number): PlayerMatchStat[] {
  const all = getAllPlayerMatchStats();
  const confirmedAt = getUserSquadConfirmedAt(userId);
  if (!confirmedAt) return [];

  const cutoff = new Date(confirmedAt).getTime();
  return all.filter(s => {
    const kickoff = getMatchKickoffMs(s.matchId);
    return kickoff !== undefined && kickoff > cutoff;
  });
}

export function getUserSquadPoints(userId: number): number {
  const playerIds = getUserSquadPlayerIds(userId);
  if (playerIds.length === 0) return 0;
  return calculateSquadPoints(playerIds, getPlayerMatchStatsForUser(userId));
}

/** Пакетный расчёт очков состава для всех пользователей (1 загрузка stats). */
export function getAllUserSquadPointsMap(): Map<number, number> {
  const allStats = getAllPlayerMatchStats();
  const rows = db.prepare(`
    SELECT us.user_id, us.player_id, u.squad_confirmed_at
    FROM user_squad us
    JOIN users u ON u.id = us.user_id
    ORDER BY us.user_id, us.slot
  `).all() as Array<{ user_id: number; player_id: string; squad_confirmed_at: string | null }>;

  const byUser = new Map<number, { playerIds: string[]; confirmedAt: string | null }>();
  for (const row of rows) {
    let entry = byUser.get(row.user_id);
    if (!entry) {
      entry = { playerIds: [], confirmedAt: row.squad_confirmed_at };
      byUser.set(row.user_id, entry);
    }
    entry.playerIds.push(row.player_id);
  }

  const result = new Map<number, number>();
  for (const [userId, { playerIds, confirmedAt }] of byUser) {
    if (!confirmedAt) {
      result.set(userId, 0);
      continue;
    }
    const cutoff = new Date(confirmedAt).getTime();
    const stats = allStats.filter(s => {
      const kickoff = getMatchKickoffMs(s.matchId);
      return kickoff !== undefined && kickoff > cutoff;
    });
    result.set(userId, calculateSquadPoints(playerIds, stats));
  }
  return result;
}

export function validateSquad(playerIds: string[]): string | null {
  if (playerIds.length !== SQUAD_SIZE) {
    return `Заполните все ${SQUAD_SIZE} позиций на поле`;
  }
  if (new Set(playerIds).size !== playerIds.length) {
    return 'Один игрок не может занимать две позиции';
  }

  const teamCounts: Record<string, number> = {};
  for (let slot = 0; slot < playerIds.length; slot++) {
    const id = playerIds[slot];
    const player = getSquadPlayer(id);
    if (!player) return 'Неизвестный игрок';
    const required = getRequiredPosition(slot);
    if (player.position !== required) {
      const labels: Record<PlayerPosition, string> = {
        GK: 'вратаря', DEF: 'защитника', MID: 'полузащитника', FWD: 'нападающего',
      };
      return `На позиции нужен ${labels[required]}`;
    }
    teamCounts[player.teamId] = (teamCounts[player.teamId] ?? 0) + 1;
    if (teamCounts[player.teamId] > MAX_PLAYERS_PER_TEAM) {
      return `Максимум ${MAX_PLAYERS_PER_TEAM} игрока из одной сборной`;
    }
  }

  return validateFifaGroupLimits(playerIds, getSquadPlayer);
}

export function enrichSquadResponse(userId: number) {
  const playerIds = getUserSquadPlayerIds(userId);
  const confirmedAt = getUserSquadConfirmedAt(userId);
  const stats = getPlayerMatchStatsForUser(userId);
  const breakdown = getSquadPointsBreakdown(playerIds, stats);

  const players = playerIds.map((id, slot) => {
    const p = getSquadPlayer(id)!;
    const team = getTeam(p.teamId);
    return {
      id: p.id,
      name: p.name,
      position: p.position,
      slot,
      teamId: p.teamId,
      teamName: team.name,
      flag: flagUrl(team.code),
      fifaGroup: getTeamFifaGroup(p.teamId),
      points: getPlayerPointsSummary(id, stats),
    };
  });

  return {
    locked: isSquadLockedForUser(userId),
    tournamentStarted: hasWorldCupStarted(),
    lateSquadDeadline: LATE_SQUAD_DEADLINE,
    lateSquadWindowClosed: isLateSquadDeadlinePassed(),
    deadline: TOURNAMENT_DEADLINE,
    formation: FORMATION,
    slotPositions: SLOT_POSITIONS,
    size: SQUAD_SIZE,
    maxPerTeam: MAX_PLAYERS_PER_TEAM,
    groupRules: getFifaGroupRulesForClient(),
    scoring: SQUAD_SCORING,
    squadConfirmedAt: confirmedAt,
    lateSquad: isLateSquadConfirmation(confirmedAt),
    players,
    points: breakdown,
    complete: playerIds.length === SQUAD_SIZE,
  };
}

export interface GlobalSquadPlayerRank {
  id: string;
  name: string;
  position: PlayerPosition;
  teamId: string;
  teamName: string;
  flag: string;
  fifaGroup: ReturnType<typeof getTeamFifaGroup>;
  points: ReturnType<typeof getPlayerPointsSummary>;
  /** Сколько подтверждённых составов включили игрока */
  pickedCount: number;
}

const GLOBAL_SQUAD_RANKING_TOP = 20;
const GLOBAL_SQUAD_RANKING_LOSERS = 5;

export interface GlobalSquadPlayerRanking {
  top: GlobalSquadPlayerRank[];
  losers: GlobalSquadPlayerRank[];
}

function buildGlobalSquadPlayerRows(allStats: PlayerMatchStat[], pickedMap: Map<string, number>): GlobalSquadPlayerRank[] {
  return SQUAD_PLAYERS.map(p => {
    const team = getTeam(p.teamId);
    const points = getPlayerPointsSummary(p.id, allStats);
    return {
      id: p.id,
      name: p.name,
      position: p.position,
      teamId: p.teamId,
      teamName: team.name,
      flag: flagUrl(team.code),
      fifaGroup: getTeamFifaGroup(p.teamId),
      points,
      pickedCount: pickedMap.get(p.id) ?? 0,
    };
  }).filter(row => row.points.total !== 0 || row.pickedCount > 0);
}

/** Топ-20 по очкам и топ-5 неудачников с отрицательным балансом (групповой этап). */
export function getGlobalSquadPlayerRanking(): GlobalSquadPlayerRanking {
  const allStats = getAllPlayerMatchStats();

  const pickedRows = db.prepare(`
    SELECT us.player_id, COUNT(DISTINCT us.user_id) as pickedCount
    FROM user_squad us
    INNER JOIN users u ON u.id = us.user_id AND u.squad_confirmed_at IS NOT NULL
    GROUP BY us.player_id
  `).all() as Array<{ player_id: string; pickedCount: number }>;

  const pickedMap = new Map(pickedRows.map(r => [r.player_id, r.pickedCount]));
  const rows = buildGlobalSquadPlayerRows(allStats, pickedMap);

  const top = [...rows]
    .filter(row => row.points.total > 0)
    .sort(
      (a, b) =>
        b.points.total - a.points.total ||
        b.pickedCount - a.pickedCount ||
        compareByPositionThenName(a, b)
    )
    .slice(0, GLOBAL_SQUAD_RANKING_TOP);

  const losers = [...rows]
    .filter(row => row.points.total < 0)
    .sort(
      (a, b) =>
        a.points.total - b.points.total ||
        b.pickedCount - a.pickedCount ||
        compareByPositionThenName(a, b)
    )
    .slice(0, GLOBAL_SQUAD_RANKING_LOSERS);

  return { top, losers };
}

function buildSquadOptionsList() {
  return SQUAD_PLAYERS.map(p => {
    const team = getTeam(p.teamId);
    return {
      id: p.id,
      name: p.name,
      position: p.position,
      teamId: p.teamId,
      teamName: team.name,
      flag: flagUrl(team.code),
      fifaGroup: getTeamFifaGroup(p.teamId),
    };
  }).sort(
    (a, b) =>
      a.teamName.localeCompare(b.teamName, 'ru') ||
      compareByPositionThenName(a, b)
  );
}

let cachedSquadOptions: ReturnType<typeof buildSquadOptionsList> | null = null;

export function getSquadOptions() {
  if (!cachedSquadOptions) {
    cachedSquadOptions = buildSquadOptionsList();
  }
  return cachedSquadOptions;
}
