import { db, upsertUser } from './db.js';
import { getTeam } from './data/matches.js';
import {
  buildRankedLeaderboardByKind,
  computeRank,
  getMatchPoints,
  getTournamentRow,
  getTotalsForUserIds,
} from './ranking.js';
import { getUserTournamentPoints } from './tournament.js';
import { getUserSquadPoints } from './squad.js';
import { processStartParamForUser } from './bot-start.js';
import { parseLeagueStartParam } from './invite-links.js';
import { sendAnnouncementMessage } from './telegram-send.js';

const ANNOUNCE_DELAY_MS = 50;
const ANNOUNCE_MAX_LENGTH = 4000;

export function registerTelegramUser(body: {
  id: number;
  first_name: string;
  last_name?: string | null;
  username?: string | null;
  photo_url?: string | null;
  startParam?: string;
}) {
  const user = upsertUser({
    id: body.id,
    first_name: body.first_name,
    last_name: body.last_name ?? undefined,
    username: body.username ?? undefined,
    photo_url: body.photo_url ?? undefined,
  });

  if (body.startParam) {
    processStartParamForUser(user.id, body.startParam);
  }

  return user;
}

export function getBotUserStats(telegramId: number) {
  const user = db.prepare('SELECT id, first_name FROM users WHERE id = ?').get(telegramId) as
    | { id: number; first_name: string }
    | undefined;

  if (!user) return null;

  const totals = getTotalsForUserIds([user.id]).get(user.id);
  const rank = computeRank(user.id);
  const predictions = db.prepare(`
    SELECT COUNT(*) as total,
      COUNT(CASE WHEN points = 5 OR points = 10 THEN 1 END) as exact
    FROM predictions WHERE user_id = ?
  `).get(user.id) as { total: number; exact: number };

  return {
    firstName: user.first_name,
    totalPoints: totals?.totalPoints ?? getMatchPoints(user.id) + getUserTournamentPoints(getTournamentRow(user.id)) + getUserSquadPoints(user.id),
    matchPoints: totals?.matchPoints ?? getMatchPoints(user.id),
    tournamentPoints: totals?.tournamentPoints ?? getUserTournamentPoints(getTournamentRow(user.id)),
    squadPoints: totals?.squadPoints ?? getUserSquadPoints(user.id),
    rank,
    predictionsCount: predictions.total,
    exactScores: predictions.exact,
  };
}

export function getBotTodayMatches(telegramId: number) {
  const todayKey = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Moscow' });
  const todayStart = `${todayKey}T00:00:00+03:00`;
  const todayEnd = `${todayKey}T23:59:59+03:00`;

  const rows = db.prepare(`
    SELECT m.id, m.kickoff, m.status, m.home_team_id, m.away_team_id,
      m.home_score, m.away_score,
      p.home_score as pred_home, p.away_score as pred_away, p.points as pred_points
    FROM matches m
    LEFT JOIN predictions p ON p.match_id = m.id AND p.user_id = ?
    WHERE m.kickoff >= ? AND m.kickoff <= ?
    ORDER BY m.kickoff ASC
  `).all(telegramId, todayStart, todayEnd) as Array<{
    id: number;
    kickoff: string;
    status: string;
    home_team_id: string;
    away_team_id: string;
    home_score: number | null;
    away_score: number | null;
    pred_home: number | null;
    pred_away: number | null;
    pred_points: number | null;
  }>;

  return rows.map(m => {
    const home = getTeam(m.home_team_id);
    const away = getTeam(m.away_team_id);
    const time = new Date(m.kickoff).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Moscow',
    });
    return {
      id: m.id,
      time,
      status: m.status,
      homeTeam: home.name,
      awayTeam: away.name,
      score: m.home_score != null ? `${m.home_score}:${m.away_score}` : null,
      hasPrediction: m.pred_home != null,
      prediction: m.pred_home != null ? `${m.pred_home}:${m.pred_away}` : null,
      points: m.pred_points,
    };
  });
}

export function getBotTopLeaders(limit = 5) {
  const ranked = buildRankedLeaderboardByKind('total');
  return ranked.slice(0, limit).map(entry => ({
    id: entry.id,
    name: entry.firstName + (entry.lastName ? ` ${entry.lastName[0]}.` : ''),
    totalPoints: entry.totalPoints,
    rank: entry.rank,
  }));
}

function formatDisplayName(user: { first_name: string; last_name: string | null }): string {
  return user.first_name + (user.last_name ? ` ${user.last_name[0]}.` : '');
}

export function getLeagueInvitePreview(startParam: string): {
  leagueName: string;
  inviterName: string;
} | null {
  const parsed = parseLeagueStartParam(startParam);
  if (!parsed?.code) return null;

  const league = db
    .prepare('SELECT name, owner_id FROM leagues WHERE UPPER(code) = ?')
    .get(parsed.code) as { name: string; owner_id: number } | undefined;
  if (!league) return null;

  const inviterId = parsed.inviterId ?? league.owner_id;
  const user = db
    .prepare('SELECT first_name, last_name FROM users WHERE id = ?')
    .get(inviterId) as { first_name: string; last_name: string | null } | undefined;

  return {
    leagueName: league.name,
    inviterName: user ? formatDisplayName(user) : 'Участник лиги',
  };
}

export function getAllRegisteredUserIds(): number[] {
  return (db.prepare('SELECT id FROM users ORDER BY id').all() as Array<{ id: number }>).map(u => u.id);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function broadcastAnnouncement(text: string): Promise<{
  sent: number;
  failed: number;
  total: number;
  sampleError?: string;
}> {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > ANNOUNCE_MAX_LENGTH) {
    return { sent: 0, failed: 0, total: 0 };
  }

  const userIds = getAllRegisteredUserIds();
  let sent = 0;
  let failed = 0;
  let sampleError: string | undefined;

  for (let i = 0; i < userIds.length; i++) {
    const ok = await sendAnnouncementMessage(userIds[i], trimmed);
    if (ok) sent++;
    else {
      failed++;
      if (!sampleError) {
        sampleError = 'не удалось доставить (часто: пользователь не нажимал /start в боте)';
      }
    }

    if (i < userIds.length - 1) {
      await sleep(ANNOUNCE_DELAY_MS);
    }
  }

  return { sent, failed, total: userIds.length, sampleError: failed > 0 ? sampleError : undefined };
}
