const DEFAULT_BASE = 'https://v3.football.api-sports.io';

export interface FootballApiConfig {
  apiKey: string;
  leagueId: number;
  season: number;
  baseUrl: string;
}

export function getFootballApiConfig(): FootballApiConfig | null {
  const apiKey = process.env.FOOTBALL_API_KEY?.trim();
  if (!apiKey) return null;

  const leagueId = parseInt(process.env.FOOTBALL_API_LEAGUE_ID ?? '1', 10);
  const season = parseInt(process.env.FOOTBALL_API_SEASON ?? '2026', 10);
  if (!Number.isFinite(leagueId) || !Number.isFinite(season)) return null;

  return {
    apiKey,
    leagueId,
    season,
    baseUrl: (process.env.FOOTBALL_API_BASE_URL ?? DEFAULT_BASE).replace(/\/$/, ''),
  };
}

export function isFootballApiConfigured(): boolean {
  return getFootballApiConfig() != null;
}

interface ApiFixtureTeam {
  id: number;
  name: string;
  code?: string | null;
  winner?: boolean | null;
}

export interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    status: { short: string; long: string };
  };
  league: { id: number; season: number; round?: string; name?: string };
  teams: { home: ApiFixtureTeam; away: ApiFixtureTeam };
  goals: { home: number | null; away: number | null };
  score: {
    fulltime: { home: number | null; away: number | null };
  };
}

export interface ApiFixtureEvent {
  time: { elapsed: number | null; extra: number | null };
  team: { id: number; name: string };
  player: { id: number | null; name: string | null };
  assist: { id: number | null; name: string | null };
  type: string;
  detail: string;
  comments: string | null;
}

export interface ApiLineupPlayer {
  player: { id: number; name: string; number: number; pos: string | null; grid: string | null };
}

export interface ApiLineup {
  team: { id: number; name: string };
  formation: string | null;
  startXI: ApiLineupPlayer[];
  substitutes: ApiLineupPlayer[];
}

const FINISHED = new Set(['FT', 'AET', 'PEN']);
const LIVE = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT']);

export function isFixtureFinished(status: string): boolean {
  return FINISHED.has(status);
}

export function isFixtureLive(status: string): boolean {
  return LIVE.has(status);
}

async function apiGet<T>(path: string, params: Record<string, string | number>): Promise<T[]> {
  const cfg = getFootballApiConfig();
  if (!cfg) throw new Error('FOOTBALL_API_KEY не задан');

  const url = new URL(`${cfg.baseUrl}${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      'x-apisports-key': cfg.apiKey,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    throw new Error(`Football API HTTP ${res.status}`);
  }

  const json = (await res.json()) as { response?: T[]; errors?: Record<string, string> };
  if (json.errors && Object.keys(json.errors).length > 0) {
    const msg = Object.values(json.errors).join('; ');
    throw new Error(msg || 'Football API error');
  }

  return json.response ?? [];
}

export async function fetchFixturesByDate(date: string): Promise<ApiFixture[]> {
  const cfg = getFootballApiConfig();
  if (!cfg) return [];
  return apiGet<ApiFixture>('/fixtures', {
    league: cfg.leagueId,
    season: cfg.season,
    date,
  });
}

export async function fetchFixtureById(fixtureId: number): Promise<ApiFixture | null> {
  const rows = await apiGet<ApiFixture>('/fixtures', { id: fixtureId });
  return rows[0] ?? null;
}

export async function fetchFixtureEvents(fixtureId: number): Promise<ApiFixtureEvent[]> {
  return apiGet<ApiFixtureEvent>('/fixtures/events', { fixture: fixtureId });
}

export async function fetchFixtureLineups(fixtureId: number): Promise<ApiLineup[]> {
  return apiGet<ApiLineup>('/fixtures/lineups', { fixture: fixtureId });
}

export interface ApiFixturePlayerRow {
  player: { id: number; name: string; photo?: string };
  statistics: Array<{
    games: {
      minutes: number | null;
      substitute?: boolean;
    };
  }>;
}

export interface ApiFixturePlayersTeam {
  team: { id: number; name: string };
  players: ApiFixturePlayerRow[];
}

export async function fetchFixturePlayers(fixtureId: number): Promise<ApiFixturePlayersTeam[]> {
  return apiGet<ApiFixturePlayersTeam>('/fixtures/players', { fixture: fixtureId });
}
