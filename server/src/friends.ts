import { db, DbUser } from './db.js';
import { getUserTotalPoints } from './leagues.js';
import { sendBotInviteMessage } from './telegram-send.js';
import { getPlatinumFlags } from './platinum.js';
import { withFavoriteTeams } from './favorite-team.js';

export interface FriendUser {
  id: number;
  firstName: string;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
  status?: 'friend' | 'invited' | 'referral';
  totalPoints?: number;
  joinedAt?: string;
  isPlatinum?: boolean;
}

function toFriendUser(
  u: DbUser,
  status: FriendUser['status'],
  joinedAt?: string
): FriendUser {
  return {
    id: u.id,
    firstName: u.first_name,
    lastName: u.last_name,
    username: u.username,
    photoUrl: u.photo_url,
    status,
    totalPoints: getUserTotalPoints(u.id),
    joinedAt,
  };
}

export function recordReferral(referrerId: number, referredId: number): boolean {
  if (referrerId === referredId) return false;
  if (referrerId <= 0 || referredId <= 0) return false;

  const referrer = db.prepare('SELECT id FROM users WHERE id = ?').get(referrerId);
  if (!referrer) return false;

  const result = db.prepare(`
    INSERT OR IGNORE INTO user_referrals (referrer_id, referred_id) VALUES (?, ?)
  `).run(referrerId, referredId);
  return result.changes > 0;
}

type FriendRow = DbUser & { joined_at: string };

export function getFriends(userId: number): FriendUser[] {
  const referrals = db.prepare(`
    SELECT u.id, u.first_name, u.last_name, u.username, u.photo_url, r.created_at as joined_at
    FROM user_referrals r
    JOIN users u ON u.id = r.referred_id
    WHERE r.referrer_id = ?
    ORDER BY r.created_at DESC
  `).all(userId) as FriendRow[];

  const invited = db.prepare(`
    SELECT u.id, u.first_name, u.last_name, u.username, u.photo_url, fi.updated_at as joined_at
    FROM friend_invites fi
    JOIN users u ON u.id = fi.invitee_id
    WHERE fi.inviter_id = ? AND fi.status = 'accepted'
    ORDER BY fi.updated_at DESC
  `).all(userId) as FriendRow[];

  const map = new Map<number, FriendUser>();
  for (const row of referrals) {
    if (row.id === userId) continue;
    map.set(row.id, toFriendUser(row, 'referral', row.joined_at));
  }
  for (const row of invited) {
    if (row.id === userId || map.has(row.id)) continue;
    map.set(row.id, toFriendUser(row, 'friend', row.joined_at));
  }

  const platinumFlags = getPlatinumFlags([...map.keys()]);

  return withFavoriteTeams(
    [...map.values()]
      .sort((a, b) => (b.totalPoints ?? 0) - (a.totalPoints ?? 0))
      .map(f => ({ ...f, isPlatinum: platinumFlags.get(f.id) ?? false }))
  );
}

export function getPendingInvites(userId: number): FriendUser[] {
  const rows = db.prepare(`
    SELECT u.id, u.first_name, u.last_name, u.username, u.photo_url
    FROM friend_invites fi
    JOIN users u ON u.id = fi.invitee_id
    WHERE fi.inviter_id = ? AND fi.status = 'pending'
    ORDER BY fi.created_at DESC
  `).all(userId) as DbUser[];

  return withFavoriteTeams(
    rows.map(u => ({
      id: u.id,
      firstName: u.first_name,
      lastName: u.last_name,
      username: u.username,
      photoUrl: u.photo_url,
      status: 'invited' as const,
    }))
  );
}

export function searchUsers(query: string, currentUserId: number, limit = 20): FriendUser[] {
  const q = query.trim().toLowerCase().slice(0, 32);
  if (q.length < 2) return [];

  const safeLimit = Math.min(Math.max(limit, 1), 20);

  const rows = db.prepare(`
    SELECT id, first_name, last_name, username, photo_url FROM users
    WHERE id != ?
      AND (
        LOWER(username) LIKE ? OR
        LOWER(first_name) LIKE ? OR
        LOWER(last_name) LIKE ? OR
        LOWER(first_name || ' ' || COALESCE(last_name, '')) LIKE ?
      )
    ORDER BY username IS NOT NULL DESC, first_name ASC
    LIMIT ?
  `).all(currentUserId, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, safeLimit) as DbUser[];

  return withFavoriteTeams(
    rows.map(u => ({
      id: u.id,
      firstName: u.first_name,
      lastName: u.last_name,
      username: u.username,
      photoUrl: u.photo_url,
    }))
  );
}

export async function sendFriendInvites(
  inviterId: number,
  inviteeIds: number[],
  inviterName: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const inviteeId of inviteeIds) {
    if (inviteeId === inviterId) continue;
    if (typeof inviteeId !== 'number' || inviteeId <= 0) continue;

    const exists = db.prepare('SELECT id FROM users WHERE id = ?').get(inviteeId);
    if (!exists) continue;

    db.prepare(`
      INSERT INTO friend_invites (inviter_id, invitee_id, status)
      VALUES (?, ?, 'pending')
      ON CONFLICT(inviter_id, invitee_id) DO UPDATE SET
        status = 'pending',
        updated_at = datetime('now')
    `).run(inviterId, inviteeId);

    const ok = await sendBotInviteMessage(inviteeId, inviterId, inviterName);
    if (ok) sent++;
    else failed++;
  }

  return { sent, failed };
}

export function acceptInviteOnJoin(inviteeId: number) {
  db.prepare(`
    UPDATE friend_invites SET status = 'accepted', updated_at = datetime('now')
    WHERE invitee_id = ? AND status = 'pending'
  `).run(inviteeId);
}
