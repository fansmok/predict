/**
 * Проверка правил начисления очков (прогнозы + fantasy).
 * Run: npm run verify:scoring --workspace=server
 */
import { calculatePoints } from './scoring.js';
import {
  buildSquadStatsFromEvents,
  applyMatchResultFull,
  resetMatch,
} from './admin.js';
import { calculatePlayerMatchPoints } from './squad-scoring.js';
import { initDatabase, db } from './db.js';
import { SQUAD_PLAYERS } from './data/squad-players.js';

const bugs: string[] = [];

function assert(cond: boolean, msg: string) {
  if (!cond) bugs.push(msg);
}

function main() {
  console.log('=== Проверка начисления очков ===\n');

  // --- Прогнозы ---
  assert(calculatePoints(2, 1, 2, 1) === 5, 'точный счёт = 5');
  assert(calculatePoints(2, 1, 2, 1, true) === 10, 'точный счёт ×2 = 10');
  assert(calculatePoints(3, 1, 2, 0) === 3, 'верная разница = 3');
  assert(calculatePoints(3, 1, 2, 0, true) === 6, 'верная разница ×2 = 6');
  assert(calculatePoints(2, 2, 1, 1) === 3, 'ничья с верной разницей = 3');
  assert(calculatePoints(2, 0, 1, 0) === 2, 'верный исход П1 = 2');
  assert(calculatePoints(0, 2, 0, 1) === 2, 'верный исход П2 = 2');
  assert(calculatePoints(1, 1, 2, 2) === 3, 'ничья 1:1 при 2:2 = верная разница (0) = 3');
  assert(calculatePoints(2, 0, 0, 2) === 0, 'промах = 0');

  // --- Fantasy за матч ---
  assert(
    calculatePlayerMatchPoints('MID', {
      played: true,
      teamWon: true,
      goals: 1,
      assists: 1,
      cleanSheet: false,
      goalsConceded: 0,
      sentOff: false,
    }) === 4,
    'MID: победа +1, гол +2, пас +1 = 4'
  );

  assert(
    calculatePlayerMatchPoints('DEF', {
      played: true,
      teamWon: false,
      goals: 0,
      assists: 0,
      cleanSheet: true,
      goalsConceded: 0,
      sentOff: false,
    }) === 2,
    'DEF: сухой матч +2'
  );

  assert(
    calculatePlayerMatchPoints('GK', {
      played: true,
      teamWon: false,
      goals: 0,
      assists: 0,
      cleanSheet: false,
      goalsConceded: 2,
      sentOff: false,
    }) === -2,
    'GK: 2 пропущенных = −2'
  );

  assert(
    calculatePlayerMatchPoints('FWD', {
      played: false,
      teamWon: true,
      goals: 2,
      assists: 0,
      cleanSheet: false,
      goalsConceded: 0,
      sentOff: false,
    }) === 0,
    'не играл = 0 очков даже с голами в stats'
  );

  assert(
    calculatePlayerMatchPoints('MID', {
      played: true,
      teamWon: true,
      goals: 0,
      assists: 0,
      cleanSheet: false,
      goalsConceded: 0,
      sentOff: true,
    }) === -1,
    'победа +1 и удаление −2 = −1'
  );

  // --- buildSquadStatsFromEvents ---
  initDatabase();
  const mex = SQUAD_PLAYERS.filter(p => p.teamId === 'mex');
  const rsa = SQUAD_PLAYERS.filter(p => p.teamId === 'rsa');

  if (mex.length >= 2 && rsa.length >= 1) {
    const scorer = mex.find(p => p.position === 'FWD') ?? mex[0];
    const defender = mex.find(p => p.position === 'DEF') ?? mex[0];
    const gk = mex.find(p => p.position === 'GK') ?? mex[0];
    const rsaGk = rsa.find(p => p.position === 'GK') ?? rsa[0];

    const built = buildSquadStatsFromEvents(
      'mex',
      'rsa',
      1,
      0,
      [{ scorerId: scorer.id, assistId: null }],
      [],
      [scorer.id, defender.id, gk.id, rsaGk.id],
      []
    );

    assert(typeof built !== 'string', 'buildSquadStatsFromEvents: валидные данные');

    if (typeof built !== 'string') {
      const scorerStat = built.find(s => s.playerId === scorer.id);
      const defStat = built.find(s => s.playerId === defender.id);
      assert(scorerStat?.teamWon === true, 'автор гола: teamWon');
      assert(scorerStat?.goals === 1, 'автор гола: goals=1');
      assert(defStat?.cleanSheet === true, 'DEF при 1:0: cleanSheet');
      assert(defStat?.goalsConceded === 0, 'DEF при 1:0: goalsConceded=0');
      assert(
        calculatePlayerMatchPoints('FWD', {
          played: true,
          teamWon: scorerStat!.teamWon!,
          goals: scorerStat!.goals!,
          assists: 0,
          cleanSheet: false,
          goalsConceded: 0,
          sentOff: false,
        }) === 3,
        'FWD автор гола при победе = 3 (1+2)'
      );
      assert(
        calculatePlayerMatchPoints('DEF', {
          played: true,
          teamWon: defStat!.teamWon!,
          goals: 0,
          assists: 0,
          cleanSheet: defStat!.cleanSheet!,
          goalsConceded: defStat!.goalsConceded!,
          sentOff: false,
        }) === 3,
        'DEF победа+сухой = 3 (1+2)'
      );
    }

    const noPlayed = buildSquadStatsFromEvents(
      'mex',
      'rsa',
      1,
      0,
      [{ scorerId: scorer.id }],
      [],
      [],
      []
    );
    if (typeof noPlayed !== 'string') {
      assert(noPlayed.some(s => s.playerId === scorer.id), 'автор гола авто в played');
    }
  } else {
    bugs.push('Нет игроков mex/rsa для теста buildSquadStatsFromEvents');
  }

  // --- Интеграция: applyMatchResultFull на групповом матче ---
  const groupMatch = db.prepare(`
    SELECT id FROM matches WHERE stage = 'group' LIMIT 1
  `).get() as { id: number } | undefined;

  if (groupMatch && mex.length >= 2 && rsa.length >= 1) {
    resetMatch(groupMatch.id);
    const scorer = mex.find(p => p.position === 'FWD') ?? mex[0];
    const mid = mex.find(p => p.position === 'MID') ?? mex[1];
    const def = mex.find(p => p.position === 'DEF') ?? mex[0];
    const gk = mex.find(p => p.position === 'GK') ?? mex[0];
    const rsaPlayer = rsa[0];

    const result = applyMatchResultFull(
      groupMatch.id,
      2,
      1,
      [
        { scorerId: scorer.id, assistId: mid.id },
        { scorerId: scorer.id, assistId: null },
      ],
      [{ scorerId: rsaPlayer.id, assistId: null }],
      [scorer.id, mid.id, def.id, gk.id, rsaPlayer.id],
      []
    );

    assert(typeof result !== 'string', 'applyMatchResultFull на group match');

    if (typeof result !== 'string') {
      const statsCount = db.prepare(`
        SELECT COUNT(*) as c FROM player_match_stats WHERE match_id = ?
      `).get(groupMatch.id) as { c: number };
      assert(statsCount.c >= 4, 'fantasy stats записаны для участников');
      resetMatch(groupMatch.id);
    }
  }

  console.log(`Ошибок: ${bugs.length}`);
  if (bugs.length) {
    bugs.forEach(b => console.log('  ✗', b));
    process.exit(1);
  }
  console.log('Все проверки начисления очков пройдены.');
}

main();
