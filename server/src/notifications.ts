import { db } from './db.js';
import { getLeaderboardSnapshot } from './ranking.js';
import { stagesSqlIn } from './match-stages.js';
import {
  sendEveningReminderMessage,
  sendDailyDigestMessage,
  type EveningReminderLine,
  type DigestMatchLine,
} from './telegram-send.js';
import {
  getMskDateKey,
  getDigestWindow,
  formatMskTime,
  kickoffDaySuffix,
} from './notification-time.js';

function wasSent(userId: number, matchId: number, type: string): boolean {
  return !!db.prepare(`
    SELECT 1 FROM notification_log WHERE user_id = ? AND match_id = ? AND type = ?
  `).get(userId, matchId, type);
}

function markSent(userId: number, matchId: number, type: string) {
  db.prepare(`
    INSERT OR IGNORE INTO notification_log (user_id, match_id, type) VALUES (?, ?, ?)
  `).run(userId, matchId, type);
}

/** 18:00 МСК — матчи без прогноза в ближайшие 24 часа. */
export async function sendEveningReminders(): Promise<number> {
  const todayKey = getMskDateKey();
  const nowIso = new Date().toISOString();
  const windowEndIso = new Date(Date.now() + 24 * 60 * 60_000).toISOString();

  const matches = db.prepare(`
    SELECT m.id, m.kickoff, ht.name as home_name, at.name as away_name
    FROM matches m
    JOIN teams ht ON ht.id = m.home_team_id
    JOIN teams at ON at.id = m.away_team_id
    WHERE m.status = 'scheduled'
      AND m.kickoff > ?
      AND m.kickoff <= ?
      AND m.stage IN (${stagesSqlIn()})
    ORDER BY m.kickoff ASC
  `).all(nowIso, windowEndIso) as Array<{
    id: number;
    kickoff: string;
    home_name: string;
    away_name: string;
  }>;

  if (matches.length === 0) return 0;

  const allUsers = db.prepare('SELECT id FROM users').all() as Array<{ id: number }>;
  const hasPrediction = db.prepare(`
    SELECT 1 FROM predictions WHERE user_id = ? AND match_id = ?
  `);

  let sent = 0;
  for (const u of allUsers) {
    if (wasSent(u.id, 0, `evening_reminder_${todayKey}`)) continue;

    const lines: EveningReminderLine[] = [];
    for (const m of matches) {
      if (hasPrediction.get(u.id, m.id)) continue;
      lines.push({
        kickoffTime: formatMskTime(m.kickoff),
        matchLabel: `${m.home_name} — ${m.away_name}`,
        daySuffix: kickoffDaySuffix(m.kickoff, todayKey),
      });
    }

    if (lines.length === 0) continue;

    const ok = await sendEveningReminderMessage(u.id, lines);
    if (ok) {
      markSent(u.id, 0, `evening_reminder_${todayKey}`);
      sent++;
    }
  }
  return sent;
}

/** 10:00 МСК — итоги за окно [вчера 10:00 … сегодня 10:00). */
export async function sendDailyDigests(): Promise<number> {
  const todayKey = getMskDateKey();
  const { startIso, endIso, startLabel, endLabel } = getDigestWindow(todayKey);

  const finishedMatchIds = db.prepare(`
    SELECT m.id
    FROM matches m
    WHERE m.status = 'finished'
      AND m.kickoff >= ?
      AND m.kickoff < ?
      AND m.stage IN (${stagesSqlIn()})
  `).all(startIso, endIso) as Array<{ id: number }>;

  if (finishedMatchIds.length === 0) return 0;

  const userIds = db.prepare(`
    SELECT DISTINCT p.user_id
    FROM predictions p
    WHERE p.match_id IN (${finishedMatchIds.map(m => m.id).join(', ')})
      AND p.points IS NOT NULL
  `).all() as Array<{ user_id: number }>;

  if (userIds.length === 0) return 0;

  const { rankByUserId, totalPointsByUserId, ranked } = getLeaderboardSnapshot('total');
  const fallbackRank = ranked.length + 1;

  const userRows = db.prepare(`
    SELECT p.points,
           p.home_score as pred_home, p.away_score as pred_away,
           ht.name as home_name, at.name as away_name,
           m.home_score, m.away_score
    FROM predictions p
    JOIN matches m ON m.id = p.match_id
    JOIN teams ht ON ht.id = m.home_team_id
    JOIN teams at ON at.id = m.away_team_id
    WHERE p.user_id = ?
      AND m.status = 'finished'
      AND m.kickoff >= ?
      AND m.kickoff < ?
      AND p.points IS NOT NULL
    ORDER BY m.kickoff ASC
  `);

  let sent = 0;
  for (const { user_id: userId } of userIds) {
    if (wasSent(userId, 0, `digest_${todayKey}`)) continue;

    const rows = userRows.all(userId, startIso, endIso) as Array<{
      points: number;
      pred_home: number;
      pred_away: number;
      home_name: string;
      away_name: string;
      home_score: number;
      away_score: number;
    }>;

    if (rows.length === 0) continue;

    const matches: DigestMatchLine[] = rows.map(r => ({
      matchLabel: `${r.home_name} — ${r.away_name}`,
      score: `${r.home_score}:${r.away_score}`,
      predHome: r.pred_home,
      predAway: r.pred_away,
      points: r.points,
    }));

    const dayPoints = rows.reduce((sum, r) => sum + r.points, 0);
    const total = totalPointsByUserId.get(userId) ?? 0;
    const rank = rankByUserId.get(userId) ?? fallbackRank;

    const ok = await sendDailyDigestMessage(
      userId,
      startLabel,
      endLabel,
      matches,
      dayPoints,
      total,
      rank
    );
    if (ok) {
      markSent(userId, 0, `digest_${todayKey}`);
      sent++;
    }
  }
  return sent;
}
