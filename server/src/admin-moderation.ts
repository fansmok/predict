import { db } from './db.js';
import { deleteUser } from './db-migrate.js';
import { isAdminUser } from './admins.js';
import { invalidateLeaderboardCache } from './ranking.js';
import { clearAvatarCache } from './telegram-avatar.js';

function assertAppAdmin(actorId: number): void {
  if (!isAdminUser(actorId)) {
    throw new Error('Недостаточно прав');
  }
}

export function deleteLeagueByAdmin(actorId: number, leagueId: number): { deleted: true; name: string } {
  assertAppAdmin(actorId);

  if (!Number.isSafeInteger(leagueId) || leagueId <= 0) {
    throw new Error('Некорректный id лиги');
  }

  const league = db.prepare('SELECT id, name FROM leagues WHERE id = ?').get(leagueId) as
    | { id: number; name: string }
    | undefined;
  if (!league) throw new Error('Лига не найдена');

  db.prepare('DELETE FROM leagues WHERE id = ?').run(leagueId);
  invalidateLeaderboardCache();

  return { deleted: true, name: league.name };
}

export function deleteUserByAdmin(actorId: number, targetUserId: number): { deleted: true } {
  assertAppAdmin(actorId);

  if (!Number.isSafeInteger(targetUserId) || targetUserId <= 0) {
    throw new Error('Некорректный id пользователя');
  }

  if (targetUserId === actorId) {
    throw new Error('Нельзя удалить свой аккаунт');
  }

  if (isAdminUser(targetUserId)) {
    throw new Error('Нельзя удалить другого администратора');
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(targetUserId) as { id: number } | undefined;
  if (!user) throw new Error('Пользователь не найден');

  const ok = deleteUser(targetUserId);
  if (!ok) throw new Error('Не удалось удалить пользователя');

  clearAvatarCache();
  invalidateLeaderboardCache();

  return { deleted: true };
}
