import { acceptInviteOnJoin, recordReferral } from './friends.js';
import { joinLeagueByCode } from './leagues.js';

export function processStartParamForUser(userId: number, startParam: string) {
  if (!startParam) return;
  acceptInviteOnJoin(userId);
  try {
    if (startParam.startsWith('ref_')) {
      const referrerId = parseInt(startParam.slice(4), 10);
      if (!Number.isNaN(referrerId) && referrerId > 0) {
        recordReferral(referrerId, userId);
      }
    } else if (startParam.startsWith('league_')) {
      const code = startParam.slice(7).slice(0, 16);
      if (code) joinLeagueByCode(userId, code);
    }
  } catch {
    /* ignore */
  }
}
