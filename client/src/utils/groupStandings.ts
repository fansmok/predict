import { Match, Team } from '../types';
import { getFifaWorldRank } from '../data/fifa-rankings';

export interface GroupStandingRow {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

interface MiniLeagueStats {
  points: number;
  goalDiff: number;
  goalsFor: number;
}

function getGroupTeams(groupMatches: Match[]): Team[] {
  const byId = new Map<string, Team>();
  for (const m of groupMatches) {
    byId.set(m.homeTeam.id, m.homeTeam);
    byId.set(m.awayTeam.id, m.awayTeam);
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
}

function computeMiniLeagueStats(teamIds: Set<string>, matches: Match[]): Map<string, MiniLeagueStats> {
  const stats = new Map<string, MiniLeagueStats>();
  for (const id of teamIds) {
    stats.set(id, { points: 0, goalDiff: 0, goalsFor: 0 });
  }

  for (const m of matches) {
    if (m.status !== 'finished' || m.homeScore === null || m.awayScore === null) continue;
    if (!teamIds.has(m.homeTeam.id) || !teamIds.has(m.awayTeam.id)) continue;

    const home = stats.get(m.homeTeam.id)!;
    const away = stats.get(m.awayTeam.id)!;

    home.goalsFor += m.homeScore;
    home.goalDiff += m.homeScore - m.awayScore;
    away.goalsFor += m.awayScore;
    away.goalDiff += m.awayScore - m.homeScore;

    if (m.homeScore > m.awayScore) {
      home.points += 3;
    } else if (m.homeScore < m.awayScore) {
      away.points += 3;
    } else {
      home.points += 1;
      away.points += 1;
    }
  }

  return stats;
}

function miniStatsKey(stats: MiniLeagueStats): string {
  return `${stats.points}:${stats.goalDiff}:${stats.goalsFor}`;
}

function compareMiniLeague(a: MiniLeagueStats, b: MiniLeagueStats): number {
  return b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor;
}

/** Критерии 4–7: общая разница, голы, fair play (нет данных), рейтинг FIFA. */
function compareGlobalTiebreakers(a: GroupStandingRow, b: GroupStandingRow): number {
  return (
    b.goalDiff - a.goalDiff ||
    b.goalsFor - a.goalsFor ||
    getFifaWorldRank(a.team.id) - getFifaWorldRank(b.team.id) ||
    a.team.name.localeCompare(b.team.name, 'ru')
  );
}

/**
 * Разрешает ничью между 3+ командами по правилам FIFA:
 * мини-турнир (критерии 1–3) с рекурсией, затем общие критерии 4–7.
 */
function resolveThreePlusTie(teams: GroupStandingRow[], matches: Match[]): GroupStandingRow[] {
  if (teams.length <= 1) return teams;

  const teamIds = new Set(teams.map(t => t.team.id));
  const mini = computeMiniLeagueStats(teamIds, matches);
  const miniKeys = new Set(teams.map(t => miniStatsKey(mini.get(t.team.id)!)));

  if (miniKeys.size === 1) {
    return [...teams].sort(compareGlobalTiebreakers);
  }

  const sorted = [...teams].sort(
    (a, b) => compareMiniLeague(mini.get(a.team.id)!, mini.get(b.team.id)!)
  );

  const groups: GroupStandingRow[][] = [];
  for (const team of sorted) {
    const key = miniStatsKey(mini.get(team.team.id)!);
    const last = groups[groups.length - 1];
    if (last && miniStatsKey(mini.get(last[0].team.id)!) === key) {
      last.push(team);
    } else {
      groups.push([team]);
    }
  }

  return groups.flatMap(group => {
    if (group.length >= 3) return resolveThreePlusTie(group, matches);
    if (group.length === 2) return [...group].sort(compareGlobalTiebreakers);
    return group;
  });
}

function resolveTiedTeams(teams: GroupStandingRow[], matches: Match[]): GroupStandingRow[] {
  if (teams.length <= 1) return teams;
  if (teams.length === 2) return [...teams].sort(compareGlobalTiebreakers);
  return resolveThreePlusTie(teams, matches);
}

function sortGroupStandings(rows: GroupStandingRow[], matches: Match[]): GroupStandingRow[] {
  const byPoints = [...rows].sort((a, b) => b.points - a.points);
  const result: GroupStandingRow[] = [];

  let i = 0;
  while (i < byPoints.length) {
    let j = i + 1;
    while (j < byPoints.length && byPoints[j].points === byPoints[i].points) j++;

    const tied = byPoints.slice(i, j);
    result.push(...resolveTiedTeams(tied, matches));
    i = j;
  }

  return result;
}

export function computeGroupStandings(groupMatches: Match[]): GroupStandingRow[] {
  const teams = getGroupTeams(groupMatches);
  const stats = new Map<string, Omit<GroupStandingRow, 'team' | 'goalDiff' | 'points'>>();

  for (const team of teams) {
    stats.set(team.id, {
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    });
  }

  for (const m of groupMatches) {
    if (m.status !== 'finished' || m.homeScore === null || m.awayScore === null) continue;

    const home = stats.get(m.homeTeam.id);
    const away = stats.get(m.awayTeam.id);
    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.goalsFor += m.homeScore;
    home.goalsAgainst += m.awayScore;
    away.goalsFor += m.awayScore;
    away.goalsAgainst += m.homeScore;

    if (m.homeScore > m.awayScore) {
      home.won++;
      away.lost++;
    } else if (m.homeScore < m.awayScore) {
      away.won++;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
    }
  }

  const rows = teams.map(team => {
    const row = stats.get(team.id)!;
    return {
      team,
      ...row,
      goalDiff: row.goalsFor - row.goalsAgainst,
      points: row.won * 3 + row.drawn,
    };
  });

  return sortGroupStandings(rows, groupMatches);
}

/**
 * Ранжирование команд, занявших 3-е места в группах (лучшие 8 идут в плей-оф).
 * Критерии: очки → разница → голы → fair play (нет данных) → рейтинг FIFA.
 */
export function computeThirdPlaceRanking(allMatches: Match[]): GroupStandingRow[] {
  const groups = new Set(
    allMatches.map(m => m.group).filter((g): g is string => g != null)
  );

  const thirdPlaceTeams: GroupStandingRow[] = [];
  for (const group of groups) {
    const standings = computeGroupStandings(allMatches.filter(m => m.group === group));
    if (standings.length >= 3) {
      thirdPlaceTeams.push(standings[2]);
    }
  }

  return [...thirdPlaceTeams].sort(compareGlobalTiebreakers);
}
