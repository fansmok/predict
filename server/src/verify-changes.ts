/**
 * Post-change verification script — exercises new bot/admin/config flows.
 * Run: npm run verify --workspace=server
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, db } from './db.js';
import { applyMatchResult, resetMatch } from './admin.js';
import { registerTelegramUser, getBotUserStats, getBotTodayMatches, getBotTopLeaders } from './bot-api.js';
import { processStartParamForUser } from './bot-start.js';
import { applyLeagueInvite, parseLeagueStartParam } from './invite-links.js';
import { buildTelegramMiniAppLink, webAppUrl } from './telegram-send.js';
import { createLeague, joinLeagueByCode } from './leagues.js';
import { resolveTournamentPickFields } from './tournament.js';
import { isAdminUser, resetAdminIdsCache } from './admins.js';
import { deleteLeagueByAdmin, deleteUserByAdmin } from './admin-moderation.js';
import { parseMatchesGroupFilter, parseLeagueCode, parseUserIdList, isAllowedPhotoUrl, sanitizePhotoUrl, isValidBotApiSecret, safeSecretEqual } from './security.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const bugs: string[] = [];

function assert(cond: boolean, msg: string) {
  if (!cond) bugs.push(msg);
}

function cleanupTestUsers(...ids: number[]) {
  if (ids.length === 0) return;
  const ph = ids.map(() => '?').join(', ');
  db.prepare(`DELETE FROM notification_log WHERE user_id IN (${ph})`).run(...ids);
  db.prepare(`DELETE FROM predictions WHERE user_id IN (${ph})`).run(...ids);
  db.prepare(`DELETE FROM user_referrals WHERE referrer_id IN (${ph}) OR referred_id IN (${ph})`).run(...ids, ...ids);
  db.prepare(`DELETE FROM friend_invites WHERE inviter_id IN (${ph}) OR invitee_id IN (${ph})`).run(...ids, ...ids);
  db.prepare(`DELETE FROM users WHERE id IN (${ph})`).run(...ids);
}

async function main() {
  initDatabase();
  console.log('=== Verify post-change flows ===\n');

  // H1: admin allowlist
  resetAdminIdsCache();
  process.env.ADMIN_USER_IDS = '999001';
  assert(isAdminUser(999001), '999001 should be admin when listed in ADMIN_USER_IDS');
  assert(!isAdminUser(999002), '999002 should not be admin');
  assert(!isAdminUser(0), 'invalid id should not be admin');
  assert(parseMatchesGroupFilter('A') === 'A', 'group A should parse');
  assert(parseMatchesGroupFilter('DROP') === undefined, 'invalid group should be rejected');
  assert(parseLeagueCode('ABCD1234') === 'ABCD1234', 'league code should parse');
  assert(parseLeagueCode('bad-code!') === null, 'invalid league code rejected');
  assert(parseUserIdList([1, 2, 2, -1, 1.5]).length === 2, 'user id list deduped and validated');

  assert(isAllowedPhotoUrl('https://t.me/i/userpic/320/abc.jpg'), 'telegram photo url allowed');
  assert(!isAllowedPhotoUrl('http://127.0.0.1/avatar.jpg'), 'localhost photo url rejected');
  assert(!isAllowedPhotoUrl('https://evil.example/avatar.jpg'), 'external photo url rejected');
  assert(sanitizePhotoUrl('https://t.me/i/userpic/320/abc.jpg') !== undefined, 'sanitize keeps valid url');
  assert(sanitizePhotoUrl('https://evil.example/x') === undefined, 'sanitize drops invalid url');

  assert(isValidBotApiSecret('a'.repeat(32)), '32-char bot api secret valid');
  assert(!isValidBotApiSecret('your_bot_api_secret'), 'placeholder bot api secret invalid');
  assert(!isValidBotApiSecret('short'), 'short bot api secret invalid');
  assert(safeSecretEqual('abc', 'abc'), 'safeSecretEqual matches');
  assert(!safeSecretEqual('abc', 'abd'), 'safeSecretEqual rejects mismatch');

  // H2: bot register + stats
  const testId = 999001;
  const refId = 999002;
  cleanupTestUsers(testId, testId + 1, refId);
  const user = registerTelegramUser({
    id: testId,
    first_name: 'VerifyBot',
    username: 'verifybot',
  });
  assert(user.id === testId, `registerTelegramUser id mismatch: ${user.id} !== ${testId}`);

  const statsBefore = getBotUserStats(testId);
  assert(statsBefore !== null, 'getBotUserStats should find registered user');
  assert(statsBefore!.totalPoints === 0, 'new user should have 0 points');

  // H4: bootstrap startParam ref
  registerTelegramUser({ id: refId, first_name: 'Referrer' });
  db.prepare('INSERT OR IGNORE INTO friend_invites (inviter_id, invitee_id, status) VALUES (?, ?, ?)').run(
    refId,
    testId,
    'pending'
  );
  processStartParamForUser(testId, `ref_${refId}`);
  const referral = db.prepare('SELECT 1 FROM user_referrals WHERE referrer_id = ? AND referred_id = ?').get(refId, testId);
  assert(!!referral, 'processStartParamForUser should record referral');

  // League invite: inviter id in start_param
  const inviterId = refId;
  const inviteeId = testId + 2;
  cleanupTestUsers(inviteeId);
  db.prepare('INSERT OR IGNORE INTO users (id, first_name) VALUES (?, ?)').run(inviteeId, 'Invitee');

  const league = createLeague(inviterId, 'Verify League');
  const startParam = `league_${league.code}_${inviterId}`;
  assert(parseLeagueStartParam(startParam)?.inviterId === inviterId, 'parseLeagueStartParam inviterId');
  assert(parseLeagueStartParam(startParam)?.code === league.code, 'parseLeagueStartParam code');

  applyLeagueInvite(inviteeId, startParam);
  assert(joinLeagueByCode(inviteeId, league.code!).isMember, 'invitee should be league member');
  const leagueReferral = db.prepare(
    'SELECT 1 FROM user_referrals WHERE referrer_id = ? AND referred_id = ?'
  ).get(inviterId, inviteeId);
  assert(!!leagueReferral, 'league invite should record referral to inviter');

  processStartParamForUser(inviteeId, startParam);
  const memberCount = db.prepare(
    'SELECT COUNT(*) as c FROM league_members WHERE league_id = ?'
  ).get(league.id) as { c: number };
  assert(memberCount.c >= 2, 'league should have inviter and invitee');

  const appLink = webAppUrl(startParam);
  assert(appLink.includes('tgWebAppStartParam='), 'webAppUrl must use tgWebAppStartParam');

  const publicLink = buildTelegramMiniAppLink(startParam);
  assert(publicLink.includes('?start='), 'invite link should use bot /start');

  db.prepare('DELETE FROM league_members WHERE league_id = ?').run(league.id);
  db.prepare('DELETE FROM leagues WHERE id = ?').run(league.id);
  cleanupTestUsers(inviteeId);

  // today matches (empty until June 2026 — expected)
  getBotTodayMatches(testId);

  // H3: admin match result on unfinished match
  let unfinished = db.prepare(`
    SELECT id FROM matches WHERE status != 'finished' ORDER BY id LIMIT 1
  `).get() as { id: number } | undefined;

  if (!unfinished) {
    const resetOk = resetMatch(1);
    if (resetOk) unfinished = { id: 1 };
  }

  if (unfinished) {
    const mid = unfinished.id;
    applyMatchResult(mid, 2, 1);
    const after = db.prepare('SELECT status, home_score, away_score FROM matches WHERE id = ?').get(mid) as {
      status: string;
      home_score: number;
      away_score: number;
    };
    assert(after.status === 'finished', 'applyMatchResult should set status finished');
    assert(after.home_score === 2 && after.away_score === 1, 'applyMatchResult score mismatch');

    resetMatch(mid);
    const reset = db.prepare('SELECT status FROM matches WHERE id = ?').get(mid) as { status: string };
    assert(reset.status !== 'finished', 'resetMatch should un-finish match');
  } else {
    bugs.push('No unfinished match found for admin test');
  }

  // leaders
  const leaders = getBotTopLeaders(5);
  assert(leaders.every((l, i) => l.rank === i + 1), 'leader ranks should be sequential');

  // Tournament partial update preserves untouched fields
  const merged = resolveTournamentPickFields(
    { winner_team_id: 'arg', second_team_id: 'fra', third_team_id: 'bra', top_scorer_player_id: 'mbappe' },
    { winnerTeamId: 'esp' }
  );
  assert(merged.winnerTeamId === 'esp', 'winner should update');
  assert(merged.secondTeamId === 'fra', 'second should be preserved on partial update');
  assert(merged.thirdTeamId === 'bra', 'third should be preserved on partial update');
  assert(merged.topScorerPlayerId === 'mbappe', 'scorer should be preserved on partial update');

  // H4: admin moderation — only ADMIN_USER_IDS
  const adminId = 999001;
  const victimId = 999881;
  const outsiderId = 999882;
  registerTelegramUser({ id: victimId, first_name: 'Victim' });
  registerTelegramUser({ id: outsiderId, first_name: 'Outsider' });
  const modLeague = createLeague(victimId, 'ModTest League');

  try {
    deleteLeagueByAdmin(outsiderId, modLeague.id);
    bugs.push('deleteLeagueByAdmin: outsider should be rejected');
  } catch (e) {
    assert(
      e instanceof Error && e.message.includes('прав'),
      'deleteLeagueByAdmin outsider should get forbidden'
    );
  }

  const delLeague = deleteLeagueByAdmin(adminId, modLeague.id);
  assert(delLeague.deleted, 'admin should delete league');
  assert(
    !db.prepare('SELECT 1 FROM leagues WHERE id = ?').get(modLeague.id),
    'league row should be gone'
  );

  try {
    deleteUserByAdmin(adminId, adminId);
    bugs.push('deleteUserByAdmin: self-delete should fail');
  } catch (e) {
    assert(e instanceof Error && e.message.includes('свой'), 'self-delete rejected');
  }

  try {
    deleteUserByAdmin(outsiderId, victimId);
    bugs.push('deleteUserByAdmin: outsider should fail');
  } catch (e) {
    assert(e instanceof Error && e.message.includes('прав'), 'outsider delete rejected');
  }

  deleteUserByAdmin(adminId, victimId);
  assert(!db.prepare('SELECT 1 FROM users WHERE id = ?').get(victimId), 'victim user deleted');

  cleanupTestUsers(testId, testId + 1, refId, outsiderId);

  console.log(`Bugs found: ${bugs.length}`);
  if (bugs.length) {
    bugs.forEach(b => console.log('  ✗', b));
    process.exit(1);
  }
  console.log('All checks passed.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
