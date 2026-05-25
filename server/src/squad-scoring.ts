import { getSquadPlayer, SQUAD_SCORING, type PlayerPosition } from './data/squad-players.js';

export interface PlayerMatchStat {
  playerId: string;
  matchId: number;
  goals: number;
  assists: number;
  teamWon: boolean;
  cleanSheet: boolean;
  goalsConceded: number;
  sentOff: boolean;
  played: boolean;
}

export function calculatePlayerMatchPoints(
  position: PlayerPosition,
  stat: Omit<PlayerMatchStat, 'playerId' | 'matchId'>
): number {
  if (!stat.played) return 0;

  let pts = 0;
  if (stat.teamWon) pts += SQUAD_SCORING.win;
  pts += stat.goals * SQUAD_SCORING.goal;
  pts += stat.assists * SQUAD_SCORING.assist;
  if (stat.cleanSheet && (position === 'GK' || position === 'DEF')) {
    pts += SQUAD_SCORING.cleanSheet;
  }
  if (position === 'GK' || position === 'DEF') {
    pts += stat.goalsConceded * SQUAD_SCORING.goalConceded;
  }
  if (stat.sentOff) pts += SQUAD_SCORING.sentOff;
  return pts;
}

export function calculateSquadPoints(
  squadPlayerIds: string[],
  stats: PlayerMatchStat[]
): number {
  let total = 0;
  const squadSet = new Set(squadPlayerIds);

  for (const stat of stats) {
    if (!squadSet.has(stat.playerId)) continue;
    const player = getSquadPlayer(stat.playerId);
    if (!player) continue;
    total += calculatePlayerMatchPoints(player.position, stat);
  }

  return total;
}

export interface PlayerPointsSummary {
  wins: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  goalsConceded: number;
  sentOffs: number;
  total: number;
}

export function getPlayerPointsSummary(
  playerId: string,
  stats: PlayerMatchStat[]
): PlayerPointsSummary {
  const player = getSquadPlayer(playerId);
  if (!player) {
    return { wins: 0, goals: 0, assists: 0, cleanSheets: 0, goalsConceded: 0, sentOffs: 0, total: 0 };
  }

  let wins = 0;
  let goals = 0;
  let assists = 0;
  let cleanSheets = 0;
  let goalsConceded = 0;
  let sentOffs = 0;
  let total = 0;

  for (const stat of stats) {
    if (stat.playerId !== playerId) continue;
    if (!stat.played) continue;
    if (stat.teamWon) wins++;
    goals += stat.goals;
    assists += stat.assists;
    if (stat.cleanSheet && (player.position === 'GK' || player.position === 'DEF')) {
      cleanSheets++;
    }
    if (player.position === 'GK' || player.position === 'DEF') {
      goalsConceded += stat.goalsConceded;
    }
    if (stat.sentOff) sentOffs++;
    total += calculatePlayerMatchPoints(player.position, stat);
  }

  return { wins, goals, assists, cleanSheets, goalsConceded, sentOffs, total };
}

export function getSquadPointsBreakdown(
  squadPlayerIds: string[],
  stats: PlayerMatchStat[]
): PlayerPointsSummary {
  const squadSet = new Set(squadPlayerIds);
  let wins = 0;
  let goals = 0;
  let assists = 0;
  let cleanSheets = 0;
  let goalsConceded = 0;
  let sentOffs = 0;

  for (const stat of stats) {
    if (!squadSet.has(stat.playerId)) continue;
    const player = getSquadPlayer(stat.playerId);
    if (!player || !stat.played) continue;
    if (stat.teamWon) wins++;
    goals += stat.goals;
    assists += stat.assists;
    if (stat.cleanSheet && (player.position === 'GK' || player.position === 'DEF')) cleanSheets++;
    if (player.position === 'GK' || player.position === 'DEF') goalsConceded += stat.goalsConceded;
    if (stat.sentOff) sentOffs++;
  }

  return {
    wins,
    goals,
    assists,
    cleanSheets,
    goalsConceded,
    sentOffs,
    total: calculateSquadPoints(squadPlayerIds, stats),
  };
}
