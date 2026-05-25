import { db } from './db.js';

export const PLATINUM_REFERRALS_REQUIRED = 5;

const HAS_PREDICTION_SQL = `
  EXISTS (SELECT 1 FROM predictions p WHERE p.user_id = ur.referred_id)
`;

export function hasUserPrediction(userId: number): boolean {
  const row = db.prepare(`
    SELECT 1 FROM predictions WHERE user_id = ? LIMIT 1
  `).get(userId);
  return !!row;
}

export function countActiveReferrals(userId: number): number {
  const row = db.prepare(`
    SELECT COUNT(*) as c
    FROM user_referrals ur
    WHERE ur.referrer_id = ?
      AND (${HAS_PREDICTION_SQL})
  `).get(userId) as { c: number };
  return row.c;
}

export function countPendingReferrals(userId: number): number {
  const row = db.prepare(`
    SELECT COUNT(*) as c
    FROM user_referrals ur
    WHERE ur.referrer_id = ?
      AND NOT (${HAS_PREDICTION_SQL})
  `).get(userId) as { c: number };
  return row.c;
}

export function isUserPlatinum(userId: number): boolean {
  const row = db.prepare('SELECT is_platinum FROM users WHERE id = ?').get(userId) as
    | { is_platinum: number }
    | undefined;
  return !!row?.is_platinum;
}

/** Обновляет статус платины, если набрано достаточно рефералов с прогнозом. */
export function syncPlatinumStatus(userId: number): boolean {
  const count = countActiveReferrals(userId);
  const row = db.prepare('SELECT is_platinum FROM users WHERE id = ?').get(userId) as
    | { is_platinum: number }
    | undefined;
  if (!row) return false;

  if (count >= PLATINUM_REFERRALS_REQUIRED && !row.is_platinum) {
    db.prepare(`
      UPDATE users SET is_platinum = 1, platinum_at = datetime('now') WHERE id = ?
    `).run(userId);
    return true;
  }
  return !!row.is_platinum;
}

/** После первого прогноза приглашённого — пересчитать платину у рефереров. */
export function syncReferrersPlatinumStatus(referredUserId: number): void {
  if (!hasUserPrediction(referredUserId)) return;

  const referrers = db.prepare(`
    SELECT referrer_id FROM user_referrals WHERE referred_id = ?
  `).all(referredUserId) as Array<{ referrer_id: number }>;

  for (const { referrer_id } of referrers) {
    syncPlatinumStatus(referrer_id);
  }
}

export function getPlatinumProgress(userId: number) {
  syncPlatinumStatus(userId);
  const current = countActiveReferrals(userId);
  const pending = countPendingReferrals(userId);
  const isPlatinum = isUserPlatinum(userId);
  return {
    current: Math.min(current, PLATINUM_REFERRALS_REQUIRED),
    required: PLATINUM_REFERRALS_REQUIRED,
    isPlatinum,
    remaining: isPlatinum ? 0 : Math.max(0, PLATINUM_REFERRALS_REQUIRED - current),
    pending,
  };
}

export function getPlatinumFlags(userIds: number[]): Map<number, boolean> {
  const map = new Map<number, boolean>();
  if (userIds.length === 0) return map;

  const unique = [...new Set(userIds)];
  const placeholders = unique.map(() => '?').join(', ');
  const rows = db.prepare(`
    SELECT id, is_platinum FROM users WHERE id IN (${placeholders})
  `).all(...unique) as Array<{ id: number; is_platinum: number }>;

  for (const r of rows) {
    map.set(r.id, !!r.is_platinum);
  }
  return map;
}

export function backfillPlatinumStatuses() {
  const referrers = db.prepare(`
    SELECT referrer_id as id FROM user_referrals GROUP BY referrer_id
  `).all() as Array<{ id: number }>;

  for (const { id } of referrers) {
    syncPlatinumStatus(id);
  }
}
