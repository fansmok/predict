import { db } from './db.js';
import { recordReferral } from './friends.js';

export function parseLeagueStartParam(startParam: string): { code: string; inviterId?: number } | null {
  if (!startParam.startsWith('league_')) return null;
  const payload = startParam.slice(7).trim();
  if (!payload) return null;

  const match = payload.match(/^([A-F0-9]{8})(?:_(\d+))?$/i);
  if (match) {
    const inviterId = match[2] ? parseInt(match[2], 10) : undefined;
    return {
      code: match[1].toUpperCase(),
      inviterId: inviterId && inviterId > 0 ? inviterId : undefined,
    };
  }

  const legacyCode = payload.split('_')[0]?.toUpperCase() ?? '';
  if (legacyCode.length >= 4) return { code: legacyCode.slice(0, 16) };
  return null;
}

export function buildLeagueStartParam(code: string, inviterId?: number): string {
  const normalized = code.trim().toUpperCase();
  if (inviterId && inviterId > 0) return `league_${normalized}_${inviterId}`;
  return `league_${normalized}`;
}

function isLeagueMember(leagueId: number, userId: number): boolean {
  return !!db.prepare(`
    SELECT 1 FROM league_members WHERE league_id = ? AND user_id = ?
  `).get(leagueId, userId);
}

export function recordLeagueJoinReferral(
  leagueId: number,
  inviterId: number | undefined,
  ownerId: number,
  memberId: number
): void {
  if (memberId === ownerId) return;

  let referrerId = ownerId;
  if (inviterId && inviterId > 0 && inviterId !== memberId) {
    const inviterExists = db.prepare('SELECT id FROM users WHERE id = ?').get(inviterId);
    if (inviterExists && isLeagueMember(leagueId, inviterId)) {
      referrerId = inviterId;
    }
  }

  recordReferral(referrerId, memberId);
}

export function markStartParamProcessed(userId: number, startParam: string): void {
  db.prepare(`
    INSERT OR IGNORE INTO user_start_params (user_id, start_param) VALUES (?, ?)
  `).run(userId, startParam);
}

export function wasStartParamProcessed(userId: number, startParam: string): boolean {
  return !!db.prepare(`
    SELECT 1 FROM user_start_params WHERE user_id = ? AND start_param = ?
  `).get(userId, startParam);
}
