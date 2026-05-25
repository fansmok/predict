import crypto from 'crypto';
import { db, DbUser } from './db.js';
import { buildLeagueInviteLink, sendLeagueInviteMessage } from './telegram-send.js';
import {
  getUserTotalPoints,
  buildLeaderboardEntriesForUsers,
  getTotalsForUserIds,
  assignLeaderRanksForKind,
  sliceRankedLeaderboard,
  type LeaderboardRankKind,
} from './ranking.js';
import { getPlatinumFlags } from './platinum.js';
import { withFavoriteTeams } from './favorite-team.js';
import {
  DEFAULT_LEAGUE_BG,
  DEFAULT_LEAGUE_EMOJI,
  normalizeLeagueBg,
  normalizeLeagueEmoji,
} from './data/league-emojis.js';
import { validateLeagueName } from './data/profanity.js';

export { getUserTotalPoints };

/** Максимум лиг, которые один пользователь может создать (владелец). */
export const MAX_OWNED_LEAGUES = 5;

/** Минимум участников, чтобы лига попала в публичный «Рейтинг лиг». */
export const MIN_LEAGUE_MEMBERS_FOR_RANKING = 3;

export function countOwnedLeagues(userId: number): number {
  const row = db.prepare(`SELECT COUNT(*) as c FROM leagues WHERE owner_id = ?`).get(userId) as {
    c: number;
  };
  return row.c;
}

export function canUserCreateLeague(userId: number): boolean {
  return countOwnedLeagues(userId) < MAX_OWNED_LEAGUES;
}

function generateInviteCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

export interface LeagueSummary {
  id: number;
  name: string;
  emoji: string;
  emojiBg: string;
  code?: string;
  ownerId: number;
  memberCount: number;
  isOwner: boolean;
  isMember: boolean;
  inviteLink?: string;
  avgPoints?: number;
  totalPoints?: number;
  rank?: number;
}

function sumMemberPoints(memberIds: number[]): { total: number; avg: number } {
  const totals = getTotalsForUserIds(memberIds);
  if (memberIds.length === 0) return { total: 0, avg: 0 };
  let total = 0;
  for (const id of memberIds) {
    total += totals.get(id)?.totalPoints ?? 0;
  }
  return {
    total,
    avg: Math.round((total / memberIds.length) * 10) / 10,
  };
}

function leagueWithStats(leagueId: number, userId: number): LeagueSummary | null {
  const summary = getLeagueSummary(leagueId, userId);
  if (!summary) return null;

  const members = db.prepare(`
    SELECT user_id FROM league_members WHERE league_id = ?
  `).all(leagueId) as Array<{ user_id: number }>;

  const memberIds = members.map(m => m.user_id);
  const { total, avg } = sumMemberPoints(memberIds);

  return { ...summary, avgPoints: avg, totalPoints: total };
}

/** Публичный рейтинг всех лиг (просмотр доступен всем). */
export function getLeaguesRanking(viewerUserId: number): LeagueSummary[] {
  const rows = db.prepare(`
    SELECT l.id FROM leagues l ORDER BY l.created_at DESC
  `).all() as Array<{ id: number }>;

  const leagues = rows
    .map(r => leagueWithStats(r.id, viewerUserId)!)
    .filter(l => l && l.memberCount >= MIN_LEAGUE_MEMBERS_FOR_RANKING);

  return leagues
    .sort((a, b) => (b.avgPoints ?? 0) - (a.avgPoints ?? 0) || (b.memberCount - a.memberCount))
    .map((l, i) => ({ ...l, rank: i + 1 }));
}

export function createLeague(
  userId: number,
  name: string,
  emoji?: string,
  emojiBg?: string
): LeagueSummary {
  const trimmed = name.trim().slice(0, 40);
  if (!trimmed) throw new Error('Укажите название лиги');
  const profanityError = validateLeagueName(trimmed);
  if (profanityError) throw new Error(profanityError);
  if (!canUserCreateLeague(userId)) {
    throw new Error(
      `Можно создать не больше ${MAX_OWNED_LEAGUES} лиг. Используйте уже созданные или вступите в чужую по ссылке.`
    );
  }
  const leagueEmoji = normalizeLeagueEmoji(emoji);
  const leagueBg = normalizeLeagueBg(emojiBg);

  let code = generateInviteCode();
  for (let i = 0; i < 5; i++) {
    const exists = db.prepare('SELECT 1 FROM leagues WHERE code = ?').get(code);
    if (!exists) break;
    code = generateInviteCode();
  }

  const result = db.prepare(`
    INSERT INTO leagues (name, code, owner_id, emoji, emoji_bg) VALUES (?, ?, ?, ?, ?)
  `).run(trimmed, code, userId, leagueEmoji, leagueBg);

  const leagueId = Number(result.lastInsertRowid);
  db.prepare(`
    INSERT OR IGNORE INTO league_members (league_id, user_id) VALUES (?, ?)
  `).run(leagueId, userId);

  return getLeagueSummary(leagueId, userId)!;
}

export function getLeagueSummary(leagueId: number, userId: number): LeagueSummary | null {
  const row = db.prepare(`
    SELECT l.id, l.name, l.code, l.owner_id, l.emoji, l.emoji_bg,
      (SELECT COUNT(*) FROM league_members lm WHERE lm.league_id = l.id) as member_count
    FROM leagues l
    WHERE l.id = ?
  `).get(leagueId) as {
    id: number;
    name: string;
    code: string;
    owner_id: number;
    emoji: string | null;
    emoji_bg: string | null;
    member_count: number;
  } | undefined;

  if (!row) return null;

  const isMember = isLeagueMember(leagueId, userId);
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji?.trim() || DEFAULT_LEAGUE_EMOJI,
    emojiBg: normalizeLeagueBg(row.emoji_bg ?? DEFAULT_LEAGUE_BG),
    ownerId: row.owner_id,
    memberCount: row.member_count,
    isOwner: row.owner_id === userId,
    isMember,
    ...(isMember
      ? { code: row.code, inviteLink: buildLeagueInviteLink(row.code, userId) }
      : {}),
  };
}

export function getUserLeagues(userId: number): LeagueSummary[] {
  const rows = db.prepare(`
    SELECT l.id FROM leagues l
    JOIN league_members lm ON lm.league_id = l.id
    WHERE lm.user_id = ?
    ORDER BY l.created_at DESC
  `).all(userId) as Array<{ id: number }>;

  return rows.map(r => getLeagueSummary(r.id, userId)!).filter(Boolean);
}

export function getLeaguesPayload(userId: number) {
  const leagues = getUserLeagues(userId).map(l => ({
    ...l,
    avgPoints: getLeagueAvgPoints(l.id),
  }));
  const ownedLeagueCount = countOwnedLeagues(userId);
  return {
    leagues,
    ownedLeagueCount,
    maxOwnedLeagues: MAX_OWNED_LEAGUES,
    canCreateLeague: ownedLeagueCount < MAX_OWNED_LEAGUES,
  };
}

export function joinLeagueByCode(userId: number, code: string): LeagueSummary {
  const normalized = code.trim().toUpperCase();
  const league = db.prepare('SELECT id FROM leagues WHERE code = ?').get(normalized) as { id: number } | undefined;
  if (!league) throw new Error('Лига не найдена');

  db.prepare(`
    INSERT OR IGNORE INTO league_members (league_id, user_id) VALUES (?, ?)
  `).run(league.id, userId);

  return getLeagueSummary(league.id, userId)!;
}

export function isLeagueMember(leagueId: number, userId: number): boolean {
  const row = db.prepare(`
    SELECT 1 FROM league_members WHERE league_id = ? AND user_id = ?
  `).get(leagueId, userId);
  return !!row;
}

export function removeLeagueMember(leagueId: number, actorId: number, targetUserId: number): void {
  const league = db.prepare('SELECT owner_id FROM leagues WHERE id = ?').get(leagueId) as
    | { owner_id: number }
    | undefined;
  if (!league) throw new Error('Лига не найдена');
  if (league.owner_id !== actorId) {
    throw new Error('Только создатель лиги может удалять участников');
  }
  if (targetUserId === league.owner_id) {
    throw new Error('Нельзя удалить создателя лиги');
  }
  if (!isLeagueMember(leagueId, targetUserId)) {
    throw new Error('Пользователь не состоит в лиге');
  }

  db.prepare('DELETE FROM league_members WHERE league_id = ? AND user_id = ?').run(leagueId, targetUserId);
}

export function getLeagueLeaderboard(
  leagueId: number,
  userId: number,
  limit = 50,
  kind: LeaderboardRankKind = 'total'
) {
  const leagueRow = db.prepare('SELECT id FROM leagues WHERE id = ?').get(leagueId);
  if (!leagueRow) throw new Error('Лига не найдена');

  const members = db.prepare(`
    SELECT u.id, u.first_name, u.last_name, u.username, u.photo_url
    FROM league_members lm
    JOIN users u ON u.id = lm.user_id
    WHERE lm.league_id = ?
  `).all(leagueId) as DbUser[];

  const ranked = assignLeaderRanksForKind(
    buildLeaderboardEntriesForUsers(
      members.map(u => ({
        id: u.id,
        firstName: u.first_name,
        lastName: u.last_name,
        username: u.username,
        photoUrl: u.photo_url,
      }))
    ),
    kind
  );

  const { leaders: top, myEntry, neighborhood: nbSlice } = sliceRankedLeaderboard(ranked, userId, limit);
  const platinumMap = getPlatinumFlags(top.map(l => l.id));

  const mapLeader = (l: (typeof ranked)[number], isPlatinum: boolean) => ({
    id: l.id,
    firstName: l.firstName,
    lastName: l.lastName,
    username: l.username,
    photoUrl: l.photoUrl,
    totalPoints: l.totalPoints,
    matchPoints: l.matchPoints,
    tournamentPoints: l.tournamentPoints,
    squadPoints: l.squadPoints,
    predictionsCount: l.predictionsCount,
    outcomeHits: l.outcomeHits,
    differenceHits: l.differenceHits,
    exactScores: l.exactScores,
    goodPredictions: l.goodPredictions,
    rank: l.rank,
    isPlatinum,
  });

  const leaders = withFavoriteTeams(top.map(l => mapLeader(l, platinumMap.get(l.id) ?? false)));

  const viewerIsMember = isLeagueMember(leagueId, userId);
  const myEntryResolved = viewerIsMember ? myEntry : null;

  let neighborhood: ReturnType<typeof mapLeader>[] | undefined;
  if (viewerIsMember && nbSlice.length > 0) {
    const nbPlatinum = getPlatinumFlags(nbSlice.map(l => l.id));
    neighborhood = withFavoriteTeams(nbSlice.map(l => mapLeader(l, nbPlatinum.get(l.id) ?? false)));
  }

  return {
    leaders,
    myRank: myEntryResolved
      ? {
          rank: myEntryResolved.rank,
          totalPoints: myEntryResolved.totalPoints,
          matchPoints: myEntryResolved.matchPoints,
          tournamentPoints: myEntryResolved.tournamentPoints,
          squadPoints: myEntryResolved.squadPoints,
          predictionsCount: myEntryResolved.predictionsCount,
          outcomeHits: myEntryResolved.outcomeHits,
          differenceHits: myEntryResolved.differenceHits,
          exactScores: myEntryResolved.exactScores,
          goodPredictions: myEntryResolved.goodPredictions,
        }
      : null,
    neighborhood,
  };
}

export function getLeagueAvgPoints(leagueId: number): number {
  const members = db.prepare(`
    SELECT user_id FROM league_members WHERE league_id = ?
  `).all(leagueId) as Array<{ user_id: number }>;
  return sumMemberPoints(members.map(m => m.user_id)).avg;
}

export async function inviteLeagueMembers(
  leagueId: number,
  inviterId: number,
  inviteeIds: number[],
  inviterName: string
): Promise<{ sent: number; failed: number; joined: number }> {
  const league = db.prepare('SELECT name, code, owner_id FROM leagues WHERE id = ?').get(leagueId) as
    | { name: string; code: string; owner_id: number }
    | undefined;
  if (!league) throw new Error('Лига не найдена');
  if (!isLeagueMember(leagueId, inviterId)) {
    throw new Error('Приглашать могут только участники лиги');
  }

  let sent = 0;
  let failed = 0;
  let joined = 0;

  for (const inviteeId of inviteeIds) {
    if (inviteeId === inviterId) continue;
    if (typeof inviteeId !== 'number' || inviteeId <= 0) continue;

    const exists = db.prepare('SELECT id FROM users WHERE id = ?').get(inviteeId);
    if (!exists) continue;

    if (isLeagueMember(leagueId, inviteeId)) {
      joined++;
      continue;
    }

    const ok = await sendLeagueInviteMessage(inviteeId, inviterName, league.name, league.code, inviterId);
    if (ok) sent++;
    else failed++;
  }

  return { sent, failed, joined };
}
