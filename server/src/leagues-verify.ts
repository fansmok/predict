/**
 * Проверка доступа к лигам.
 * Run: npm run verify:leagues --workspace=server
 */
import { initDatabase, db } from './db.js';
import {
  createLeague,
  joinLeagueByCode,
  getLeagueSummary,
  getLeagueLeaderboard,
  getLeaguesRanking,
  removeLeagueMember,
  inviteLeagueMembers,
  isLeagueMember,
} from './leagues.js';

const bugs: string[] = [];

function assert(cond: boolean, msg: string) {
  if (!cond) bugs.push(msg);
}

async function main() {
  console.log('=== Проверка лиг и доступа ===\n');
  initDatabase();

  db.prepare(`
    INSERT OR IGNORE INTO users (id, first_name, last_name, username)
    VALUES (9001, 'Owner', 'Test', 'owner_test'),
           (9002, 'Member', 'Test', 'member_test'),
           (9003, 'Outsider', 'Test', 'outsider_test')
  `).run();

  const ownerId = 9001;
  const memberId = 9002;
  const outsiderId = 9003;

  const league = createLeague(ownerId, `Audit ${Date.now()}`);
  const code = league.code;
  assert(!!code, 'создатель видит код лиги');
  assert(!!league.inviteLink, 'создатель видит inviteLink');
  assert(league.isMember === true, 'создатель — участник');

  const outsiderView = getLeagueSummary(league.id, outsiderId);
  assert(outsiderView != null, 'метаданные лиги доступны постороннему');
  assert(outsiderView?.isMember === false, 'посторонний не участник');
  assert(!outsiderView?.code, 'посторонний не видит code');
  assert(!outsiderView?.inviteLink, 'посторонний не видит inviteLink');

  const outsiderLb = getLeagueLeaderboard(league.id, outsiderId);
  assert(outsiderLb.leaders.length >= 1, 'посторонний видит рейтинг участников лиги');
  assert(outsiderLb.myRank == null, 'посторонний без myRank в лиге');

  const allRanking = getLeaguesRanking(outsiderId);
  assert(allRanking.some(l => l.id === league.id), 'публичный рейтинг лиг содержит новую лигу');

  joinLeagueByCode(memberId, code!);
  assert(isLeagueMember(league.id, memberId), 'вступление по коду');

  const memberView = getLeagueSummary(league.id, memberId);
  assert(!!memberView?.inviteLink, 'участник видит inviteLink');
  assert(memberView?.isMember === true, 'участник isMember');

  try {
    removeLeagueMember(league.id, memberId, ownerId);
    assert(false, 'участник не может удалять создателя');
  } catch (e) {
    assert(
      e instanceof Error && e.message.includes('создатель'),
      'removeLeagueMember: нельзя удалить создателя'
    );
  }

  try {
    removeLeagueMember(league.id, memberId, outsiderId);
    assert(false, 'участник не может удалять других');
  } catch (e) {
    assert(
      e instanceof Error && e.message.includes('создатель лиги'),
      'removeLeagueMember: только создатель удаляет'
    );
  }

  await inviteLeagueMembers(league.id, memberId, [outsiderId], 'Member');
  assert(!isLeagueMember(league.id, outsiderId), 'приглашение не добавляет без ссылки');

  joinLeagueByCode(outsiderId, code!);
  assert(isLeagueMember(league.id, outsiderId), 'вступление по ссылке');

  const outsiderAfterJoin = getLeagueSummary(league.id, outsiderId);
  assert(!!outsiderAfterJoin?.inviteLink, 'участник после вступления видит invite');

  db.prepare('DELETE FROM league_members WHERE league_id = ?').run(league.id);
  db.prepare('DELETE FROM leagues WHERE id = ?').run(league.id);

  console.log(`Ошибок: ${bugs.length}`);
  if (bugs.length) {
    bugs.forEach(b => console.log('  ✗', b));
    process.exit(1);
  }
  console.log('Все проверки лиг пройдены.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
