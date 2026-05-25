import { acceptInviteOnJoin, recordReferral } from './friends.js';
import {
  applyLeagueInvite,
  markStartParamProcessed,
  parseLeagueStartParam,
  wasStartParamProcessed,
} from './invite-links.js';

export function processStartParamForUser(userId: number, startParam: string) {
  const param = startParam.trim().slice(0, 256);
  if (!param) return;

  acceptInviteOnJoin(userId);

  if (param.startsWith('league_')) {
    if (!parseLeagueStartParam(param)) return;
    try {
      applyLeagueInvite(userId, param);
      markStartParamProcessed(userId, param);
    } catch (e) {
      console.warn('[startParam league]', userId, param, e instanceof Error ? e.message : e);
    }
    return;
  }

  if (wasStartParamProcessed(userId, param)) return;

  try {
    if (param.startsWith('ref_')) {
      const referrerId = parseInt(param.slice(4), 10);
      if (!Number.isNaN(referrerId) && referrerId > 0) {
        recordReferral(referrerId, userId);
      }
      markStartParamProcessed(userId, param);
    }
  } catch (e) {
    console.warn('[startParam]', userId, param, e instanceof Error ? e.message : e);
  }
}
