/**
 * Проверка автопереноса победителей в сетке плей-офф.
 * Run: npm run verify:bracket --workspace=server
 */
import { initDatabase, db } from './db.js';
import { applyMatchResult, resetMatch } from './admin.js';
import {
  advanceBracketAfterResult,
  reconcileBracketFromFinished,
  winnerSlotForGroup,
  loserSlotForGroup,
} from './bracket-advance.js';
import { isPredictableStage } from './match-stages.js';

const bugs: string[] = [];

function assert(cond: boolean, msg: string) {
  if (!cond) bugs.push(msg);
}

function getMatchTeams(matchId: number) {
  return db
    .prepare(`SELECT home_team_id, away_team_id, status FROM matches WHERE id = ?`)
    .get(matchId) as { home_team_id: string; away_team_id: string; status: string } | undefined;
}

function main() {
  initDatabase();
  console.log('=== Проверка сетки плей-офф ===\n');

  assert(isPredictableStage('r32'), 'r32 должен быть доступен для прогнозов');
  assert(isPredictableStage('r16'), 'r16 должен быть доступен для прогнозов');
  assert(isPredictableStage('final'), 'final должен быть доступен для прогнозов');
  assert(!isPredictableStage('friendly'), 'friendly не прогнозируется');

  assert(winnerSlotForGroup('A03') === 'br_w_a03', 'A03 → br_w_a03');
  assert(winnerSlotForGroup('B01') === 'br_w_b01', 'B01 → br_w_b01');
  assert(winnerSlotForGroup('QF1') === 'br_w_qf1', 'QF1 → br_w_qf1');
  assert(loserSlotForGroup('SF1', 'sf') === 'br_l_sf1', 'SF1 loser → br_l_sf1');
  assert(loserSlotForGroup('SF1', 'r16') === null, 'loser slot только для sf');

  const r32 = getMatchTeams(73);
  assert(r32?.home_team_id === 'rsa' && r32?.away_team_id === 'can', 'A03: ЮАР — Канада');

  // A03: rsa побеждает → br_w_a03 в 1/8 (матч 89, home)
  resetMatch(73);
  resetMatch(89);
  applyMatchResult(73, 2, 1);
  const r16 = getMatchTeams(89);
  assert(r16?.home_team_id === 'rsa', 'победитель A03 (rsa) → home матча B02');
  assert(r16?.away_team_id === 'br_w_a04', 'второй слот B02 пока placeholder');

  // Полная пересборка
  resetMatch(73);
  reconcileBracketFromFinished();
  const r16After = getMatchTeams(89);
  assert(r16After?.home_team_id === 'br_w_a03', 'после сброса A03 — снова placeholder');

  applyMatchResult(73, 0, 1);
  advanceBracketAfterResult(73, 0, 1);
  const r16Can = getMatchTeams(89);
  assert(r16Can?.home_team_id === 'can', 'победитель A03 (can) → home матча B02');

  // Ничья не продвигает
  resetMatch(73);
  resetMatch(89);
  const beforeDraw = getMatchTeams(89)?.home_team_id;
  advanceBracketAfterResult(73, 1, 1);
  const afterDraw = getMatchTeams(89)?.home_team_id;
  assert(beforeDraw === afterDraw, 'ничья не меняет следующий раунд');

  console.log('\n=== Итог ===');
  if (bugs.length === 0) {
    console.log('OK: все проверки сетки пройдены');
    process.exit(0);
  }
  console.log(`FAIL: ${bugs.length} проблем`);
  for (const b of bugs) console.log('  -', b);
  process.exit(1);
}

main();
