import { db } from './db.js';
import { getTeam, flagUrl, TEAMS } from './data/matches.js';

export interface FavoriteTeamDto {
  id: string;
  name: string;
  code: string;
  flag: string;
}

export function enrichFavoriteTeam(teamId: string | null | undefined): FavoriteTeamDto | null {
  if (!teamId || !TEAMS[teamId]) return null;
  const t = getTeam(teamId);
  return { id: t.id, name: t.name, code: t.code, flag: flagUrl(t.code) };
}

export function getUserFavoriteTeamId(userId: number): string | null {
  const row = db.prepare(`SELECT favorite_team_id FROM users WHERE id = ?`).get(userId) as
    | { favorite_team_id: string | null }
    | undefined;
  return row?.favorite_team_id ?? null;
}

export function getFavoriteTeamsMap(userIds: number[]): Map<number, FavoriteTeamDto | null> {
  const unique = [...new Set(userIds)];
  const map = new Map<number, FavoriteTeamDto | null>();
  if (unique.length === 0) return map;

  const placeholders = unique.map(() => '?').join(',');
  const rows = db
    .prepare(`SELECT id, favorite_team_id FROM users WHERE id IN (${placeholders})`)
    .all(...unique) as Array<{ id: number; favorite_team_id: string | null }>;

  for (const row of rows) {
    map.set(row.id, enrichFavoriteTeam(row.favorite_team_id));
  }
  for (const id of unique) {
    if (!map.has(id)) map.set(id, null);
  }
  return map;
}

export function withFavoriteTeams<T extends { id: number }>(
  items: T[]
): Array<T & { favoriteTeam: FavoriteTeamDto | null }> {
  const favMap = getFavoriteTeamsMap(items.map(i => i.id));
  return items.map(item => ({ ...item, favoriteTeam: favMap.get(item.id) ?? null }));
}
