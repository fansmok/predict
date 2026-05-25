import { acceptInviteOnJoin, recordReferral } from './friends.js';
import { joinLeagueByCode } from './leagues.js';
import {
  markStartParamProcessed,
  parseLeagueStartParam,
  recordLeagueJoinReferral,
  wasStartParamProcessed,
} from './invite-links.js';

export function processStartParamForUser(userId: number, startParam: string) {
  const param = startParam.trim().slice(0, 256);
  if (!param || wasStartParamProcessed(userId, param)) return;

  acceptInviteOnJoin(userId);
  try {
    if (param.startsWith('ref_')) {
      const referrerId = parseInt(param.slice(4), 10);
      if (!Number.isNaN(referrerId) && referrerId > 0) {
        recordReferral(referrerId, userId);
      }
      markStartParamProcessed(userId, param);
      return;
    }

    if (param.startsWith('league_')) {
      const parsed = parseLeagueStartParam(param);
      if (!parsed?.code) return;

      const league = joinLeagueByCode(userId, parsed.code);
      recordLeagueJoinReferral(league.id, parsed.inviterId, league.ownerId, userId);
      markStartParamProcessed(userId, param);
    }
  } catch (e) {
    console.warn('[startParam]', userId, param, e instanceof Error ? e.message : e);
  }
}
