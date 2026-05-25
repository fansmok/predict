import { db } from './db.js';
import { rankedStagesSqlIn } from './match-stages.js';
import {
  applyMatchResult,
  applyMatchResultFull,
  type GoalEventInput,
} from './admin.js';
import { SQUAD_PLAYERS } from './data/squad-players.js';
import { resolveApiTeamId } from './data/team-api-codes.js';
import {
  fetchFixtureById,
  fetchFixtureEvents,
  fetchFixtureLineups,
  fetchFixturePlayers,
  fetchFixturesByDate,
  isFixtureFinished,
  isFixtureLive,
  isFootballApiConfigured,
  type ApiFixture,
  type ApiFixtureEvent,
  type ApiFixturePlayerRow,
} from './football-api.js';

const MSK = 'Europe/Moscow';

export interface SyncMatchSuccess {
  ok: true;
  matchId: number;
  mode: 'full' | 'score-only';
  homeScore: number;
  awayScore: number;
  predictions: number;
  squadStats?: number;
  warnings: string[];
}

export interface SyncMatchFailure {
  ok: false;
  matchId: number;
  error: string;
}

export type SyncMatchResult = SyncMatchSuccess | SyncMatchFailure;

export interface SyncBatchResult {
  configured: boolean;
  processed: number;
  updated: number;
  skipped: number;
  errors: string[];
  details: SyncMatchResult[];
}

function normalizePersonName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function lastToken(name: string): string {
  const parts = normalizePersonName(name).split(' ').filter(Boolean);
  return parts[parts.length - 1] ?? '';
}

export function resolveSquadPlayerId(playerName: string, teamId: string): string | null {
  if (!playerName.trim()) return null;
  const norm = normalizePersonName(playerName);
  const last = lastToken(playerName);

  const pool = SQUAD_PLAYERS.filter(p => p.teamId === teamId);
  for (const p of pool) {
    if (normalizePersonName(p.name) === norm) return p.id;
  }
  if (last.length >= 3) {
    const hits = pool.filter(p => lastToken(p.name) === last);
    if (hits.length === 1) return hits[0].id;
  }
  return null;
}

function fixtureDateMsk(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: MSK });
}

function getMatchRow(matchId: number) {
  return db.prepare(`
    SELECT id, home_team_id, away_team_id, kickoff, status, external_fixture_id, stage
    FROM matches WHERE id = ? AND stage IN (${rankedStagesSqlIn()})
  `).get(matchId) as {
    id: number;
    home_team_id: string;
    away_team_id: string;
    kickoff: string;
    status: string;
    external_fixture_id: number | null;
    stage: string;
  } | undefined;
}

function setExternalFixtureId(matchId: number, fixtureId: number): void {
  db.prepare(`UPDATE matches SET external_fixture_id = ? WHERE id = ?`).run(fixtureId, matchId);
}

function markMatchLive(matchId: number): void {
  db.prepare(`UPDATE matches SET status = 'live' WHERE id = ? AND status = 'scheduled'`).run(matchId);
}

function parseFinishedScore(fixture: ApiFixture): { home: number; away: number } | null {
  const home = fixture.goals.home ?? fixture.score.fulltime.home;
  const away = fixture.goals.away ?? fixture.score.fulltime.away;
  if (home == null || away == null) return null;
  if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || home > 15 || away < 0 || away > 15) {
    return null;
  }
  return { home, away };
}

function findFixtureForMatch(
  match: { home_team_id: string; away_team_id: string; kickoff: string },
  fixtures: ApiFixture[]
): ApiFixture | null {
  const day = fixtureDateMsk(match.kickoff);
  const kickoffMs = new Date(match.kickoff).getTime();

  let best: { fixture: ApiFixture; diff: number } | null = null;

  for (const f of fixtures) {
    if (fixtureDateMsk(f.fixture.date) !== day) continue;
    const homeId = resolveApiTeamId(f.teams.home);
    const awayId = resolveApiTeamId(f.teams.away);
    if (homeId !== match.home_team_id || awayId !== match.away_team_id) continue;

    const diff = Math.abs(new Date(f.fixture.date).getTime() - kickoffMs);
    if (!best || diff < best.diff) best = { fixture: f, diff };
  }

  return best?.fixture ?? null;
}

async function resolveFixtureForMatch(matchId: number): Promise<ApiFixture | null> {
  const match = getMatchRow(matchId);
  if (!match) return null;

  if (match.external_fixture_id) {
    const byId = await fetchFixtureById(match.external_fixture_id);
    if (byId) return byId;
  }

  const day = fixtureDateMsk(match.kickoff);
  const fixtures = await fetchFixturesByDate(day);
  const found = findFixtureForMatch(match, fixtures);
  if (found) {
    setExternalFixtureId(matchId, found.fixture.id);
    return found;
  }

  return null;
}

function countOwnGoalsForTeam(
  events: ApiFixtureEvent[],
  benefitingSide: 'home' | 'away',
  homeTeamId: string,
  awayTeamId: string
): number {
  let count = 0;
  for (const ev of events) {
    if (ev.type !== 'Goal' || ev.detail !== 'Own Goal') continue;
    const evTeamId = resolveApiTeamId(ev.team);
    if (benefitingSide === 'home' && evTeamId === awayTeamId) count++;
    if (benefitingSide === 'away' && evTeamId === homeTeamId) count++;
  }
  return count;
}

function buildGoalsFromEvents(
  events: ApiFixtureEvent[],
  side: 'home' | 'away',
  homeTeamId: string,
  awayTeamId: string,
  warnings: string[]
): GoalEventInput[] {
  const goals: GoalEventInput[] = [];
  const ourTeamId = side === 'home' ? homeTeamId : awayTeamId;

  for (const ev of events) {
    if (ev.type !== 'Goal') continue;
    if (ev.detail === 'Missed Penalty') continue;

    const evTeamId = resolveApiTeamId(ev.team);
    const isHomeSide = evTeamId === homeTeamId;
    if (side === 'home' && !isHomeSide) continue;
    if (side === 'away' && isHomeSide) continue;

    if (ev.detail === 'Own Goal') {
      warnings.push(`Автогол не учтён в fantasy: ${ev.player.name ?? '?'}`);
      continue;
    }

    const scorerName = ev.player.name ?? '';
    const scorerId = resolveSquadPlayerId(scorerName, ourTeamId);
    if (!scorerId) {
      warnings.push(`Не найден бомбардир: ${scorerName} (${ourTeamId})`);
      continue;
    }

    let assistId: string | null = null;
    if (ev.assist.name) {
      assistId = resolveSquadPlayerId(ev.assist.name, ourTeamId);
      if (!assistId) warnings.push(`Не найден ассистент: ${ev.assist.name}`);
    }

    goals.push({ scorerId, assistId });
  }

  return goals;
}

function playerMinutesPlayed(row: ApiFixturePlayerRow): number {
  const mins = row.statistics?.[0]?.games?.minutes;
  return typeof mins === 'number' && mins >= 0 ? mins : 0;
}

/** Игрок участвовал, если сыграл ≥ 1 минуту (данные /fixtures/players). */
function buildPlayedFromPlayerStats(
  playerTeams: Awaited<ReturnType<typeof fetchFixturePlayers>>,
  warnings: string[]
): Set<string> {
  const played = new Set<string>();

  for (const teamBlock of playerTeams) {
    const teamId = resolveApiTeamId(teamBlock.team);
    if (!teamId) continue;

    for (const row of teamBlock.players) {
      if (playerMinutesPlayed(row) < 1) continue;

      const id = resolveSquadPlayerId(row.player.name, teamId);
      if (id) played.add(id);
      else warnings.push(`Игрок не в каталоге: ${row.player.name} (${teamId})`);
    }
  }

  if (played.size === 0) {
    warnings.push('Нет игроков с ≥1 минутой в статистике матча');
  }

  return played;
}

/** Запасной вариант, если статистика игроков недоступна: стартовый состав + замены из events. */
function buildPlayedFromLineupsAndEvents(
  lineups: Awaited<ReturnType<typeof fetchFixtureLineups>>,
  events: ApiFixtureEvent[],
  warnings: string[]
): Set<string> {
  const played = new Set<string>();

  for (const lineup of lineups) {
    const teamId = resolveApiTeamId(lineup.team);
    if (!teamId) continue;

    for (const row of lineup.startXI) {
      const id = resolveSquadPlayerId(row.player.name, teamId);
      if (id) played.add(id);
      else if (row.player.name) {
        warnings.push(`Игрок не в каталоге: ${row.player.name} (${teamId})`);
      }
    }
  }

  for (const ev of events) {
    if (ev.type !== 'subst') continue;
    const teamId = resolveApiTeamId(ev.team);
    if (!teamId) continue;

    for (const name of [ev.player.name, ev.assist.name]) {
      if (!name) continue;
      const id = resolveSquadPlayerId(name, teamId);
      if (id) played.add(id);
    }
  }

  if (played.size === 0) {
    warnings.push('Состав не сопоставлен (fallback)');
  }

  return played;
}

function buildSentOffFromEvents(events: ApiFixtureEvent[], warnings: string[]): string[] {
  const sentOff: string[] = [];

  for (const ev of events) {
    if (ev.type !== 'Card') continue;
    if (ev.detail !== 'Red Card' && ev.detail !== 'Second Yellow card') continue;

    const teamId = resolveApiTeamId(ev.team);
    if (!teamId) continue;
    const playerName = ev.player.name ?? '';
    const playerId = resolveSquadPlayerId(playerName, teamId);
    if (playerId) sentOff.push(playerId);
    else warnings.push(`Удаление не сопоставлено: ${playerName}`);
  }

  return sentOff;
}

export async function syncMatchFromApi(matchId: number, force = false): Promise<SyncMatchResult> {
  if (!isFootballApiConfigured()) {
    return { ok: false, matchId, error: 'FOOTBALL_API_KEY не настроен' };
  }

  const match = getMatchRow(matchId);
  if (!match) return { ok: false, matchId, error: 'Матч не найден' };

  if (match.status === 'finished' && !force) {
    return { ok: false, matchId, error: 'Матч уже завершён' };
  }

  const fixture = await resolveFixtureForMatch(matchId);
  if (!fixture) {
    return { ok: false, matchId, error: 'Матч не найден во внешнем API' };
  }

  const status = fixture.fixture.status.short;
  if (isFixtureLive(status)) {
    markMatchLive(matchId);
    return { ok: false, matchId, error: 'Матч ещё идёт' };
  }

  if (!isFixtureFinished(status)) {
    return { ok: false, matchId, error: `Статус API: ${status}` };
  }

  const score = parseFinishedScore(fixture);
  if (!score) {
    return { ok: false, matchId, error: 'Нет итогового счёта в API' };
  }

  const warnings: string[] = [];
  const events = await fetchFixtureEvents(fixture.fixture.id);
  const playerTeams = await fetchFixturePlayers(fixture.fixture.id);

  let playedIds = buildPlayedFromPlayerStats(playerTeams, warnings);
  if (playedIds.size === 0) {
    const lineups = await fetchFixtureLineups(fixture.fixture.id);
    if (lineups.length > 0) {
      warnings.push('Fallback: стартовые + вышедшие на замену (минуты из API недоступны)');
      playedIds = buildPlayedFromLineupsAndEvents(lineups, events, warnings);
    }
  }

  const homeGoals = buildGoalsFromEvents(events, 'home', match.home_team_id, match.away_team_id, warnings);
  const awayGoals = buildGoalsFromEvents(events, 'away', match.home_team_id, match.away_team_id, warnings);
  const sentOffIds = buildSentOffFromEvents(events, warnings);

  const homeOwnGoals = countOwnGoalsForTeam(events, 'home', match.home_team_id, match.away_team_id);
  const awayOwnGoals = countOwnGoalsForTeam(events, 'away', match.home_team_id, match.away_team_id);

  const goalsMatchScore =
    homeGoals.length + homeOwnGoals === score.home &&
    awayGoals.length + awayOwnGoals === score.away &&
    playedIds.size > 0;

  if (homeOwnGoals + awayOwnGoals > 0) {
    warnings.push(`Учтены автоголы: хозяева +${homeOwnGoals}, гости +${awayOwnGoals}`);
  }

  if (goalsMatchScore) {
    const full = applyMatchResultFull(
      matchId,
      score.home,
      score.away,
      homeGoals,
      awayGoals,
      [...playedIds],
      sentOffIds
    );
    if (typeof full !== 'string') {
      return {
        ok: true,
        matchId,
        mode: 'full',
        homeScore: score.home,
        awayScore: score.away,
        predictions: full.predictions,
        squadStats: full.squadStats,
        warnings,
      };
    }
    warnings.push(full);
  }

  warnings.push('Fantasy неполный — начислены только очки за прогнозы');
  const predictions = applyMatchResult(matchId, score.home, score.away);

  return {
    ok: true,
    matchId,
    mode: 'score-only',
    homeScore: score.home,
    awayScore: score.away,
    predictions,
    warnings,
  };
}

export async function syncPendingMatchesFromApi(): Promise<SyncBatchResult> {
  if (!isFootballApiConfigured()) {
    return { configured: false, processed: 0, updated: 0, skipped: 0, errors: [], details: [] };
  }

  const rows = db.prepare(`
    SELECT id FROM matches
    WHERE stage IN (${rankedStagesSqlIn()}) AND status != 'finished'
    ORDER BY kickoff ASC
  `).all() as Array<{ id: number }>;

  const details: SyncMatchResult[] = [];
  const errors: string[] = [];
  let updated = 0;
  let skipped = 0;

  for (const { id } of rows) {
    try {
      const result = await syncMatchFromApi(id);
      details.push(result);
      if (result.ok) updated++;
      else skipped++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка синхронизации';
      errors.push(`#${id}: ${msg}`);
      details.push({ ok: false, matchId: id, error: msg });
      skipped++;
    }
  }

  return { configured: true, processed: rows.length, updated, skipped, errors, details };
}

export function getFootballSyncStatus() {
  const pending = db.prepare(`
    SELECT COUNT(*) as c FROM matches
    WHERE stage IN (${rankedStagesSqlIn()}) AND status != 'finished'
  `).get() as { c: number };

  return {
    configured: isFootballApiConfigured(),
    pendingMatches: pending.c,
    leagueId: process.env.FOOTBALL_API_LEAGUE_ID ?? '1',
    season: process.env.FOOTBALL_API_SEASON ?? '2026',
  };
}

function fixtureKickoffMskIso(iso: string): string {
  const msk = new Date(iso).toLocaleString('sv-SE', { timeZone: 'Europe/Moscow' });
  return `${msk.replace(' ', 'T')}+03:00`;
}

export interface LinkMatchApiSuccess {
  ok: true;
  matchId: number;
  fixtureId: number;
  homeTeamId: string;
  awayTeamId: string;
  kickoff: string;
  league: string;
  apiStatus: string;
}

export interface LinkMatchApiFailure {
  ok: false;
  error: string;
}

export type LinkMatchApiResult = LinkMatchApiSuccess | LinkMatchApiFailure;

export async function linkMatchToApiFixture(matchId: number, fixtureId: number): Promise<LinkMatchApiResult> {
  if (!isFootballApiConfigured()) {
    return { ok: false, error: 'FOOTBALL_API_KEY не настроен' };
  }
  if (!Number.isInteger(fixtureId) || fixtureId <= 0) {
    return { ok: false, error: 'Некорректный fixture ID' };
  }

  const match = getMatchRow(matchId);
  if (!match) return { ok: false, error: 'Матч не найден' };

  const fixture = await fetchFixtureById(fixtureId);
  if (!fixture) return { ok: false, error: 'Fixture не найден в API' };

  const homeTeamId = resolveApiTeamId(fixture.teams.home);
  const awayTeamId = resolveApiTeamId(fixture.teams.away);
  if (!homeTeamId || !awayTeamId) {
    return {
      ok: false,
      error: `Команды не в турнире: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
    };
  }

  const kickoff = fixtureKickoffMskIso(fixture.fixture.date);
  const league = fixture.league?.name ?? 'API';

  db.prepare(`
    UPDATE matches SET
      home_team_id = ?, away_team_id = ?, kickoff = ?,
      external_fixture_id = ?, status = 'scheduled',
      home_score = NULL, away_score = NULL
    WHERE id = ?
  `).run(homeTeamId, awayTeamId, kickoff, fixtureId, matchId);

  db.prepare(`UPDATE predictions SET points = NULL WHERE match_id = ?`).run(matchId);
  db.prepare(`DELETE FROM player_match_stats WHERE match_id = ?`).run(matchId);
  db.prepare(`UPDATE matches SET fantasy_events = NULL WHERE id = ?`).run(matchId);

  return {
    ok: true,
    matchId,
    fixtureId,
    homeTeamId,
    awayTeamId,
    kickoff,
    league,
    apiStatus: fixture.fixture.status.short,
  };
}

export function unlinkMatchFromApi(matchId: number): boolean {
  const row = getMatchRow(matchId);
  if (!row) return false;
  db.prepare(`UPDATE matches SET external_fixture_id = NULL WHERE id = ?`).run(matchId);
  return true;
}
