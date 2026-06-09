import { clearCachedInitData, getTelegramInitData } from './telegram-init';
import { captureStartParam } from './utils';

export { hasTelegramInitData, waitForTelegramInitData } from './telegram-init';

const API_BASE = '/api';
const REQUEST_TIMEOUT_MS = 15_000;
const PING_TIMEOUT_MS = 8_000;

export function networkErrorMessage(reason?: unknown): string {
  if (reason instanceof DOMException && reason.name === 'AbortError') {
    return 'Сервер не отвечает. Проверьте интернет и откройте приложение заново.';
  }
  if (reason instanceof TypeError) {
    return 'Нет связи с сервером. Подождите несколько секунд и попробуйте снова.';
  }
  return 'Не удаётся подключиться к серверу. Откройте приложение заново из бота.';
}

async function pingOnce(): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}/config`, { signal: controller.signal, cache: 'no-store' });
    return res.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

/** Проверка сети без авторизации (несколько попыток — VPN иногда медленный). */
export async function pingServer(attempts = 3): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    if (await pingOnce()) return true;
    if (i < attempts - 1) {
      await new Promise<void>(resolve => window.setTimeout(resolve, 700));
    }
  }
  return false;
}

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const initData = getTelegramInitData();
  if (initData) {
    headers['X-Telegram-Init-Data'] = initData;
  }

  const startParam = captureStartParam();
  if (startParam) {
    headers['X-Telegram-Start-Param'] = startParam;
  }

  return headers;
}

async function request<T>(path: string, options?: RequestInit, attempt = 0): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      cache: 'no-store',
      headers: { ...getHeaders(), ...options?.headers },
    });
  } catch (e) {
    const retryable =
      attempt < 2 && (e instanceof TypeError || (e instanceof DOMException && e.name === 'AbortError'));
    if (retryable) {
      window.clearTimeout(timeoutId);
      await new Promise<void>(resolve => window.setTimeout(resolve, 800));
      return request<T>(path, options, attempt + 1);
    }
    throw new Error(networkErrorMessage(e));
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    const message = err.error || `HTTP ${res.status}`;
    if (res.status === 401 || message === 'Invalid Telegram auth' || message === 'Unauthorized') {
      clearCachedInitData();
      throw new Error(
        'Сессия устарела. Полностью закройте Mini App (смахните вниз) и откройте снова из @predictliga_bot.'
      );
    }
    throw new Error(message);
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error('Сервер вернул некорректный ответ. Перезапустите backend (npm run dev:server)');
  }

  return res.json();
}

export const api = {
  getMe: () => request<{ user: import('./types').User; stats: import('./types').UserStats }>('/auth/me'),
  checkAdmin: () => request<{ isAdmin: boolean }>('/auth/admin-check'),
  getUserProfile: (userId: number) =>
    request<import('./types').PublicUserProfile>(`/users/${userId}/profile`),
  saveFavoriteTeam: (teamId: string) =>
    request<{ favoriteTeam: import('./types').Team | null }>('/profile/favorite-team', {
      method: 'POST',
      body: JSON.stringify({ teamId }),
    }),
  getMatches: (group?: string) =>
    request<{ matches: import('./types').Match[]; doublePicks: Record<string, number> }>(
      `/matches${group && group !== 'all' ? `?group=${group}` : ''}`
    ),
  getMatch: (id: number) => request<{ match: import('./types').Match }>(`/matches/${id}`),
  getMatchProfile: (id: number) => request<import('./types').MatchProfile>(`/matches/${id}/profile`),
  savePrediction: (matchId: number, homeScore: number, awayScore: number, useDouble?: boolean) =>
    request<{ success: boolean }>('/predictions', {
      method: 'POST',
      body: JSON.stringify({ matchId, homeScore, awayScore, useDouble }),
    }),
  setDoublePick: (matchId: number) =>
    request<{ success: boolean }>('/double-picks', {
      method: 'POST',
      body: JSON.stringify({ matchId }),
    }),
  getLeaderboard: (kind: import('./leaderboard-rank').PlayersRankKind = 'total') =>
    request<import('./types').LeaderboardResponse>(
      `/leaderboard?kind=${encodeURIComponent(kind)}`
    ),
  getRules: () => request<{ rules: import('./types').Rule[] }>('/rules'),
  getTournamentOptions: () =>
    request<{ teams: import('./types').TournamentOption[]; players: import('./types').TournamentOption[] }>(
      '/tournament/options'
    ),
  getTournamentPicks: () => request<import('./types').TournamentData>('/tournament/picks'),
  saveTournamentPicks: (picks: {
    winnerTeamId?: string;
    secondTeamId?: string;
    thirdTeamId?: string;
    topScorerPlayerId?: string;
  }) =>
    request<import('./types').TournamentData>('/tournament/picks', {
      method: 'POST',
      body: JSON.stringify(picks),
    }),
  getSquadOptions: () =>
    request<{ players: import('./types').SquadPlayerOption[]; size: number }>('/squad/options'),
  getSquad: () => request<import('./types').SquadData>('/squad'),
  getSquadGlobalRanking: () =>
    request<import('./types').GlobalSquadPlayerRanking>('/squad/global-ranking'),
  saveSquad: (playerIds: string[]) =>
    request<import('./types').SquadData>('/squad', {
      method: 'POST',
      body: JSON.stringify({ playerIds }),
    }),
  bootstrap: () =>
    request<{ success: boolean }>('/bootstrap', {
      method: 'POST',
      body: JSON.stringify({ startParam: captureStartParam() || undefined }),
    }),
  applyInvite: (startParam: string) =>
    request<{ ok: boolean; type: string; league?: import('./types').LeagueSummary }>('/invites/apply', {
      method: 'POST',
      body: JSON.stringify({ startParam }),
    }),
  getFriends: () => request<import('./types').FriendsData>('/friends'),
  searchFriends: (q: string) =>
    request<{ users: import('./types').FriendUser[] }>(`/friends/search?q=${encodeURIComponent(q)}`),
  inviteFriends: (userIds: number[]) =>
    request<{ sent: number; failed: number }>('/friends/invite', {
      method: 'POST',
      body: JSON.stringify({ userIds }),
    }),
  getLeagues: () =>
    request<{
      leagues: import('./types').LeagueSummary[];
      ownedLeagueCount: number;
      maxOwnedLeagues: number;
      canCreateLeague: boolean;
    }>('/leagues'),
  createLeague: (name: string, emoji?: string, emojiBg?: string) =>
    request<{ league: import('./types').LeagueSummary; inviteLink: string }>('/leagues', {
      method: 'POST',
      body: JSON.stringify({ name, emoji, emojiBg }),
    }),
  joinLeague: (code: string) =>
    request<{ league: import('./types').LeagueSummary }>('/leagues/join', {
      method: 'POST',
      body: JSON.stringify({ code, startParam: captureStartParam() || undefined }),
    }),
  getLeagueLeaderboard: (
    leagueId: number,
    kind: import('./leaderboard-rank').PlayersRankKind = 'total'
  ) =>
    request<{
      league: import('./types').LeagueSummary;
      leaders: import('./types').Leader[];
      myRank: import('./types').LeaderboardMyRank | null;
      neighborhood?: import('./types').Leader[];
    }>(`/leagues/${leagueId}/leaderboard?kind=${encodeURIComponent(kind)}`),
  getLeaguesRanking: () =>
    request<{ leagues: import('./types').LeagueSummary[] }>('/leagues/ranking'),
  removeLeagueMember: (leagueId: number, userId: number) =>
    request<{ ok: boolean }>(`/leagues/${leagueId}/members/${userId}`, { method: 'DELETE' }),
  getConfig: () =>
    request<{ tournamentDeadline: string }>('/config'),
  inviteLeagueMembers: (leagueId: number, userIds: number[]) =>
    request<{ sent: number; failed: number }>(`/leagues/${leagueId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ userIds }),
    }),
  adminMatchResult: (
    matchId: number,
    homeScore: number,
    awayScore: number,
    fantasy?: {
      homeGoals: Array<{ scorerId: string; assistId?: string | null }>;
      awayGoals: Array<{ scorerId: string; assistId?: string | null }>;
      playedPlayerIds: string[];
      sentOffPlayerIds?: string[];
    }
  ) =>
    request<{ success: boolean; updated?: number; squadStats?: number }>('/admin/match-result', {
      method: 'POST',
      body: JSON.stringify({
        matchId,
        homeScore,
        awayScore,
        ...(fantasy ?? {}),
      }),
    }),
  adminMatchStart: (matchId: number) =>
    request<{ success: boolean }>('/admin/match-start', {
      method: 'POST',
      body: JSON.stringify({ matchId }),
    }),
  adminMatchReset: (matchId: number) =>
    request<{ success: boolean }>('/admin/match-reset', {
      method: 'POST',
      body: JSON.stringify({ matchId }),
    }),
  adminMatchFantasy: (matchId: number) =>
    request<{
      homeScore: number;
      awayScore: number;
      homeGoals: Array<{ scorerId: string; assistId?: string | null }>;
      awayGoals: Array<{ scorerId: string; assistId?: string | null }>;
      playedPlayerIds: string[];
      sentOffPlayerIds: string[];
      statsCount: number;
    }>(`/admin/match-fantasy/${matchId}`),
  adminSyncStatus: () =>
    request<{
      configured: boolean;
      pendingMatches: number;
      leagueId: string;
      season: string;
    }>('/admin/sync-status'),
  adminSyncAll: () =>
    request<{
      configured: boolean;
      processed: number;
      updated: number;
      skipped: number;
      errors: string[];
    }>('/admin/sync-results', { method: 'POST' }),
  adminSyncMatch: (matchId: number, force = false) =>
    request<{
      ok: boolean;
      matchId: number;
      mode?: 'full' | 'score-only';
      homeScore?: number;
      awayScore?: number;
      predictions?: number;
      squadStats?: number;
      warnings?: string[];
      error?: string;
    }>(`/admin/sync-match/${matchId}`, {
      method: 'POST',
      body: JSON.stringify(force ? { force: true } : {}),
    }),
  adminMatchApiLink: (matchId: number, fixtureId: number) =>
    request<{
      ok: true;
      matchId: number;
      fixtureId: number;
      homeTeamId: string;
      awayTeamId: string;
      kickoff: string;
      league: string;
      apiStatus: string;
    }>('/admin/match-api-link', {
      method: 'POST',
      body: JSON.stringify({ matchId, fixtureId }),
    }),
  adminMatchApiUnlink: (matchId: number) =>
    request<{ success: boolean; cleared: boolean }>('/admin/match-api-link', {
      method: 'POST',
      body: JSON.stringify({ matchId, clear: true }),
    }),
  adminGetTournamentResults: () =>
    request<{
      settled: boolean;
      settledAt: string | null;
      results: {
        winnerTeamId: string | null;
        secondTeamId: string | null;
        thirdTeamId: string | null;
        topScorerPlayerId: string | null;
      } | null;
      picksCount: number;
      points: { winner: number; second: number; third: number; topScorer: number };
    }>('/admin/tournament-results'),
  adminSetTournamentResults: (body: {
    winnerTeamId: string;
    secondTeamId: string;
    thirdTeamId: string;
    topScorerPlayerId: string;
  }) =>
    request<{ success: boolean; updated: number }>('/admin/tournament-results', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  adminDeleteLeague: (leagueId: number) =>
    request<{ ok: boolean; deleted: true; name: string }>(`/admin/leagues/${leagueId}`, {
      method: 'DELETE',
    }),
  adminDeleteUser: (userId: number) =>
    request<{ ok: boolean }>(`/admin/users/${userId}`, { method: 'DELETE' }),
};

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: Record<string, unknown>;
        platform?: string;
        ready: () => void;
        expand: () => void;
        close: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        MainButton: {
          text: string;
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
        };
        openTelegramLink: (url: string) => void;
        themeParams: Record<string, string>;
        onEvent?: (event: string, handler: () => void) => void;
      };
    };
  }
}
