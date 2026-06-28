import { db } from './db.js';
import { MATCHES, TEAMS } from './data/matches.js';

const KNOCKOUT_STAGES = new Set(['r32', 'r16', 'qf', 'sf']);

/** Слот победителя матча: A03 → br_w_a03, QF1 → br_w_qf1, SF1 → br_w_sf1 */
export function winnerSlotForGroup(groupName: string | null): string | null {
  if (!groupName) return null;
  const slot = `br_w_${groupName.toLowerCase()}`;
  return slot in TEAMS ? slot : null;
}

/** Слот проигравшего полуфинала: SF1 → br_l_sf1 (матч за 3-е место). */
export function loserSlotForGroup(groupName: string | null, stage: string): string | null {
  if (stage !== 'sf' || !groupName) return null;
  const slot = `br_l_${groupName.toLowerCase()}`;
  return slot in TEAMS ? slot : null;
}

function replaceSlotInScheduledMatches(slotTeamId: string, actualTeamId: string): number {
  if (slotTeamId === actualTeamId) return 0;
  const home = db
    .prepare(`UPDATE matches SET home_team_id = ? WHERE home_team_id = ? AND status = 'scheduled'`)
    .run(actualTeamId, slotTeamId);
  const away = db
    .prepare(`UPDATE matches SET away_team_id = ? WHERE away_team_id = ? AND status = 'scheduled'`)
    .run(actualTeamId, slotTeamId);
  return home.changes + away.changes;
}

/**
 * После фиксации счёта плей-офф: подставляет победителя (и проигравшего полуфинала)
 * в scheduled-матчи следующих раундов вместо br_w_* / br_l_* слотов.
 */
export function advanceBracketAfterResult(matchId: number, homeScore: number, awayScore: number): number {
  if (homeScore === awayScore) return 0;

  const row = db
    .prepare(`SELECT group_name, stage, home_team_id, away_team_id FROM matches WHERE id = ?`)
    .get(matchId) as
    | { group_name: string | null; stage: string; home_team_id: string; away_team_id: string }
    | undefined;

  if (!row || !KNOCKOUT_STAGES.has(row.stage)) return 0;

  const winner = homeScore > awayScore ? row.home_team_id : row.away_team_id;
  const loser = homeScore > awayScore ? row.away_team_id : row.home_team_id;

  const winnerSlot = winnerSlotForGroup(row.group_name);
  if (!winnerSlot) return 0;

  let changes = replaceSlotInScheduledMatches(winnerSlot, winner);

  const loserSlot = loserSlotForGroup(row.group_name, row.stage);
  if (loserSlot) {
    changes += replaceSlotInScheduledMatches(loserSlot, loser);
  }

  return changes;
}

/** Сбрасывает пары 1/8+ к br_* слотам из MATCHES (только scheduled). */
export function resetPlayoffSlotsToSeed(): number {
  let changes = 0;
  for (const m of MATCHES) {
    if (!['r16', 'qf', 'sf', 'third', 'final'].includes(m.stage)) continue;
    const row = db.prepare(`SELECT status, home_team_id, away_team_id FROM matches WHERE id = ?`).get(m.id) as
      | { status: string; home_team_id: string; away_team_id: string }
      | undefined;
    if (!row || row.status !== 'scheduled') continue;
    if (row.home_team_id === m.homeTeamId && row.away_team_id === m.awayTeamId) continue;
    const r = db
      .prepare(`UPDATE matches SET home_team_id = ?, away_team_id = ? WHERE id = ? AND status = 'scheduled'`)
      .run(m.homeTeamId, m.awayTeamId, m.id);
    changes += r.changes;
  }
  return changes;
}

/** Пересобирает сетку по всем завершённым матчам плей-офф (после деплоя или сброса). */
export function reconcileBracketFromFinished(): number {
  resetPlayoffSlotsToSeed();
  let total = 0;
  const finished = db
    .prepare(`
    SELECT id, home_score, away_score
    FROM matches
    WHERE status = 'finished'
      AND stage IN ('r32', 'r16', 'qf', 'sf')
      AND home_score IS NOT NULL AND away_score IS NOT NULL
    ORDER BY kickoff ASC, id ASC
  `)
    .all() as Array<{ id: number; home_score: number; away_score: number }>;

  for (const m of finished) {
    total += advanceBracketAfterResult(m.id, m.home_score, m.away_score);
  }
  return total;
}
