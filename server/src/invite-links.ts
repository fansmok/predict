import { db } from './db.js';
import { recordReferral } from './friends.js';
import { joinLeagueByCode, type LeagueSummary } from './leagues.js';

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

export function recordLeagueJoinReferral(
  leagueId: number,
  inviterId: number | undefined,
  ownerId: number,
  memberId: number
): void {
  void leagueId;
  if (memberId === inviterId) return;

  let referrerId = ownerId;
  if (inviterId && inviterId > 0 && inviterId !== memberId) {
    const inviter = db.prepare('SELECT id FROM users WHERE id = ?').get(inviterId);
    if (inviter) referrerId = inviterId;
  }

  if (referrerId !== memberId) {
    recordReferral(referrerId, memberId);
  }
}

/** Вступление в лигу по start_param — идемпотентно, можно вызывать повторно. */
export function applyLeagueInvite(userId: number, startParam: string): LeagueSummary {
  const parsed = parseLeagueStartParam(startParam);
  if (!parsed?.code) throw new Error('Некорректная ссылка лиги');

  const league = joinLeagueByCode(userId, parsed.code);
  recordLeagueJoinReferral(league.id, parsed.inviterId, league.ownerId, userId);
  return league;
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
