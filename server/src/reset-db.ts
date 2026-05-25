import { db } from './db.js';
import { MATCHES } from './data/matches.js';

function resetDatabase() {
  db.exec(`
    DELETE FROM player_match_stats;
    DELETE FROM tournament_results;
    DELETE FROM users;
  `);

  const resetMatch = db.prepare(`
    UPDATE matches
    SET home_score = NULL, away_score = NULL, status = 'scheduled', kickoff = ?
    WHERE id = ?
  `);

  for (const m of MATCHES) {
    resetMatch.run(m.kickoff, m.id);
  }

  console.log('✓ База сброшена: пользователи, прогнозы, составы, статистика');
  console.log('✓ Матчи возвращены в статус scheduled — набор состава открыт');
}

resetDatabase();
