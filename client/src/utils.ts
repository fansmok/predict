const MSK = 'Europe/Moscow';

/** Аватар через сервер (Telegram Bot API + photo_url из БД). */
export function userAvatarUrl(userId: number, photoUrl?: string | null): string {
  const base = `/api/users/${userId}/avatar`;
  if (photoUrl) {
    const tail = photoUrl.slice(-24);
    let hash = 0;
    for (let i = 0; i < tail.length; i++) hash = (hash * 31 + tail.charCodeAt(i)) | 0;
    return `${base}?v=${Math.abs(hash)}`;
  }
  return base;
}
export const WC_OPENING_KICKOFF = '2026-06-11T22:00:00+03:00';
const TOURNAMENT_START = new Date(WC_OPENING_KICKOFF);

const MONTHS_SHORT = ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЙ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК'];

export function formatDate(iso: string): string {
  return formatMatchDayHeader(iso).label;
}

export function formatMatchDayHeader(iso: string): {
  dayNum: string;
  monthShort: string;
  weekday: string;
  label: string;
  dayIndex: number;
} {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat('ru-RU', {
    timeZone: MSK,
    day: 'numeric',
    month: 'numeric',
    weekday: 'long',
  }).formatToParts(d);

  const day = parts.find(p => p.type === 'day')?.value ?? '1';
  const month = parseInt(parts.find(p => p.type === 'month')?.value ?? '6', 10);
  const weekdayRaw = parts.find(p => p.type === 'weekday')?.value ?? '';

  const weekday = weekdayRaw.charAt(0).toUpperCase() + weekdayRaw.slice(1);
  const monthShort = MONTHS_SHORT[month - 1] ?? 'ИЮН';

  const dayStart = new Date(iso);
  dayStart.setHours(0, 0, 0, 0);
  const tourStart = new Date(TOURNAMENT_START);
  tourStart.setHours(0, 0, 0, 0);
  const dayIndex = Math.max(1, Math.floor((dayStart.getTime() - tourStart.getTime()) / 86400000) + 1);

  const label =
    dayStart.getTime() < tourStart.getTime()
      ? 'Товарищеские матчи'
      : dayIndex === 1
        ? 'Открытие ЧМ-2026'
        : `${weekday} · Игровой день`;

  return { dayNum: day, monthShort, weekday, label, dayIndex: dayIndex > 0 && dayIndex < 30 ? dayIndex : 0 };
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: MSK });
}

/** «11 июня, среда» */
export function formatMatchDayTitle(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: MSK });
  const weekday = d.toLocaleDateString('ru-RU', { weekday: 'long', timeZone: MSK });
  return `${date}, ${weekday}`;
}

/** «11 июня, среда · 22:00» */
export function formatMatchKickoffLine(iso: string): string {
  return `${formatMatchDayTitle(iso)} · ${formatTime(iso)}`;
}

export const CONSENSUS_MIN_PREDICTIONS = 1;

export function hasPublicConsensus(
  consensus: { total: number } | null | undefined
): consensus is { total: number; home: number; draw: number; away: number } {
  return (consensus?.total ?? 0) >= CONSENSUS_MIN_PREDICTIONS;
}

export function groupMatchesByDateSorted<T extends { kickoff: string; gameDay?: string; id?: number }>(
  matches: T[],
  order: 'asc' | 'desc' = 'asc'
): MatchDayGroup<T>[] {
  const sorted = sortMatchesByKickoff(matches, order);
  return [...groupMatchesByDate(sorted).entries()].map(([gameDay, dayMatches]) => ({
    key: gameDay,
    dayMatches,
  }));
}

export function stageLabel(stage: string, group?: string | null): string {
  const labels: Record<string, string> = {
    group: group ? `Группа ${group}` : 'Групповой этап',
    r32: '1/16 финала',
    r16: '1/8 финала',
    qf: '1/4 финала',
    sf: '1/2 финала',
    final: 'Финал',
    third: 'За 3-е место',
  };
  const base = labels[stage] ?? stage;
  if (stage !== 'group' && group) {
    return `${base} · ${group}`;
  }
  return base;
}

export function getInitials(firstName: string, lastName?: string | null): string {
  const f = firstName?.[0] ?? '';
  const l = lastName?.[0] ?? '';
  return (f + l).toUpperCase() || '?';
}

export function displayName(firstName: string, lastName?: string | null): string {
  if (firstName && lastName) return `${firstName} ${lastName}`;
  if (firstName) return firstName;
  return 'Игрок';
}

export function sortMatchesByKickoff<T extends { kickoff: string; id?: number }>(
  matches: T[],
  order: 'asc' | 'desc' = 'asc'
): T[] {
  const dir = order === 'asc' ? 1 : -1;
  return [...matches].sort((a, b) => {
    const diff = new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
    if (diff !== 0) return diff * dir;
    return ((a.id ?? 0) - (b.id ?? 0)) * dir;
  });
}

export type MatchDayGroup<T> = {
  key: string;
  dayMatches: T[];
};

export function groupAllTabMatchesByDate<
  T extends { kickoff: string; gameDay?: string; status: string; id?: number },
>(matches: T[]): MatchDayGroup<T>[] {
  const groups: MatchDayGroup<T>[] = [];

  for (const [gameDay, dayMatches] of groupMatchesByDate(
    sortMatchesByKickoff(
      matches.filter(m => m.status !== 'finished'),
      'asc'
    )
  ).entries()) {
    groups.push({ key: `upcoming-${gameDay}`, dayMatches });
  }

  for (const [gameDay, dayMatches] of groupMatchesByDate(
    sortMatchesByKickoff(
      matches.filter(m => m.status === 'finished'),
      'desc'
    )
  ).entries()) {
    groups.push({ key: `finished-${gameDay}`, dayMatches });
  }

  return groups;
}

export function groupMatchesByDate<T extends { kickoff: string; gameDay?: string }>(matches: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const m of matches) {
    const key = m.gameDay ?? new Date(m.kickoff).toLocaleDateString('en-CA', { timeZone: MSK });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  return map;
}

export function countPendingPredictions(matches: import('./types').Match[]): number {
  return matches.filter(m => m.canPredict && !m.prediction).length;
}

export function countPendingPredictionsOnDay(
  matches: import('./types').Match[],
  gameDay: string
): number {
  return matches.filter(
    m => m.canPredict && !m.prediction && m.gameDay === gameDay
  ).length;
}

/** Авто-×2: последний матч игрового дня без прогноза, бонус дня ещё не занят другим матчем. */
export function shouldAutoDoublePoints(
  match: import('./types').Match,
  matches: import('./types').Match[],
  doublePicks: Record<string, number>
): boolean {
  if (match.prediction) return false;
  if (countPendingPredictionsOnDay(matches, match.gameDay) !== 1) return false;
  return doublePicks?.[match.gameDay] == null;
}

export function lastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1] ?? fullName;
}

export function pointsColor(points: number | null): string {
  if (points === null) return 'var(--text-muted)';
  if (points >= 10) return 'var(--gold)';
  if (points >= 5) return 'var(--gold)';
  if (points >= 3) return 'var(--accent)';
  if (points >= 2) return 'var(--blue)';
  return 'var(--text-muted)';
}

export function isTournamentComplete(data: import('./types').TournamentData): boolean {
  const { winner, second, third, topScorer } = data.picks;
  return !!(winner && second && third && topScorer);
}

import { getTelegramInitData } from './telegram-init';

const START_PARAM_STORAGE_KEY = 'liga_start_param';

export function getStartParam(): string {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    const unsafe = tg.initDataUnsafe as { start_param?: string } | undefined;
    if (unsafe?.start_param?.trim()) return unsafe.start_param.trim();

    if (tg.initData) {
      const fromInit = new URLSearchParams(tg.initData).get('start_param');
      if (fromInit?.trim()) return fromInit.trim();
    }
  }

  const initData = getTelegramInitData();
  if (initData) {
    const fromCached = new URLSearchParams(initData).get('start_param');
    if (fromCached?.trim()) return fromCached.trim();
  }

  const fromUrlParams = (params: URLSearchParams): string =>
    params.get('tgWebAppStartParam')?.trim() ||
    params.get('startapp')?.trim() ||
    '';

  try {
    const fromUrl = fromUrlParams(new URL(window.location.href).searchParams);
    if (fromUrl) return fromUrl;
  } catch {
    /* ignore */
  }

  try {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return '';

    const hashParams = new URLSearchParams(hash);
    const fromHash = fromUrlParams(hashParams);
    if (fromHash) return fromHash;

    const tgWebAppData = hashParams.get('tgWebAppData');
    if (tgWebAppData) {
      const decoded = decodeURIComponent(tgWebAppData);
      const sp = new URLSearchParams(decoded).get('start_param');
      if (sp?.trim()) return sp.trim();
    }
  } catch {
    /* ignore */
  }

  return '';
}

/** Читает start_param и сохраняет в sessionStorage (Telegram иногда отдаёт его только в URL). */
export function captureStartParam(): string {
  const fresh = getStartParam();
  if (fresh) {
    try {
      sessionStorage.setItem(START_PARAM_STORAGE_KEY, fresh);
    } catch {
      /* ignore */
    }
    return fresh;
  }
  try {
    return sessionStorage.getItem(START_PARAM_STORAGE_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

export function clearCapturedStartParam(): void {
  try {
    sessionStorage.removeItem(START_PARAM_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function parseLeagueStartParam(startParam: string): { code: string; inviterId?: number } | null {
  if (!startParam.startsWith('league_')) return null;
  const payload = startParam.slice(7).trim();
  if (!payload) return null;

  const match = payload.match(/^([A-F0-9]{8})(?:_(\d+))?$/i);
  if (match) {
    const inviterId = match[2] ? parseInt(match[2], 10) : undefined;
    return {
      code: match[1].toUpperCase(),
      inviterId: inviterId && inviterId > 0 ? inviterId : undefined,
    };
  }

  const legacyCode = payload.split('_')[0]?.toUpperCase() ?? '';
  if (legacyCode.length >= 4) return { code: legacyCode.slice(0, 16) };
  return null;
}

export function shareTelegramLink(link: string, text: string) {
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
  const tg = window.Telegram?.WebApp;
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(shareUrl);
  } else {
    window.open(shareUrl, '_blank');
  }
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallback below */
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export interface WcCountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function isWcStarted(now = Date.now()): boolean {
  return now >= TOURNAMENT_START.getTime();
}

export function hasWorldCupMatchesStarted(
  matches?: Array<{ status: string }>
): boolean {
  return matches?.some(m => m.status === 'live' || m.status === 'finished') ?? false;
}

export function isTournamentPicksLocked(
  tournament: {
    locked: boolean;
    deadline: string;
  },
  matches?: Array<{ status: string }>
): boolean {
  if (tournament.locked) return true;
  if (isWcStarted()) return true;
  if (hasWorldCupMatchesStarted(matches)) return true;
  return false;
}

export function getWcCountdown(now = Date.now()): WcCountdownParts | null {
  const diff = TOURNAMENT_START.getTime() - now;
  if (diff <= 0) return null;

  const totalSec = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
  };
}

export function padCountdown(n: number): string {
  return String(n).padStart(2, '0');
}

/** Именительный падеж: 1 матч, 2 матча, 5 матчей, 21 матч */
export function ruPlural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(Math.trunc(n));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

/** Родительный после «для», «без», «из»: для 1 матча, для 5 матчей, для 61 матча */
export function ruPluralGenitive(n: number, singular: string, plural: string): string {
  const abs = Math.abs(Math.trunc(n));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return singular;
  return plural;
}

export function ruCount(n: number, one: string, few: string, many: string): string {
  return `${n} ${ruPlural(n, one, few, many)}`;
}

export function ruGenitiveCount(n: number, singular: string, plural: string): string {
  return `${n} ${ruPluralGenitive(n, singular, plural)}`;
}

export function formatMatches(n: number): string {
  return ruCount(n, 'матч', 'матча', 'матчей');
}

export function formatMatchesGenitive(n: number): string {
  return ruGenitiveCount(n, 'матча', 'матчей');
}

export function formatPredictions(n: number): string {
  return ruCount(n, 'прогноз', 'прогноза', 'прогнозов');
}

export function formatPeople(n: number): string {
  return ruCount(n, 'человек', 'человека', 'человек');
}

export function formatPredictionsGenitive(n: number): string {
  return ruGenitiveCount(n, 'прогноза', 'прогнозов');
}

export function formatPoints(n: number): string {
  return ruCount(n, 'очко', 'очка', 'очков');
}

/** CSS-класс для отрицательных очков (красный цвет). */
export function pointsToneClass(value: number): string {
  return value < 0 ? 'points-negative' : '';
}

export function formatPointsWord(n: number): string {
  return ruPlural(n, 'очко', 'очка', 'очков');
}

export function formatPointsGenitive(n: number): string {
  return ruGenitiveCount(n, 'очка', 'очков');
}

export function formatParticipants(n: number): string {
  return ruCount(n, 'участник', 'участника', 'участников');
}

export function formatLeagues(n: number): string {
  return ruCount(n, 'лига', 'лиги', 'лиг');
}

export function formatExactScores(n: number): string {
  return ruCount(n, 'точный', 'точных', 'точных');
}

export function formatFriends(n: number): string {
  return ruCount(n, 'друг', 'друга', 'друзей');
}

export function formatFriendsGenitive(n: number): string {
  return ruGenitiveCount(n, 'друга', 'друзей');
}

export function pendingMatchesPhrase(count: number): string {
  if (count <= 0) return '';
  return formatMatches(count);
}

/** «для N матчей» — родительный падеж */
export function pendingMatchesGenitivePhrase(count: number): string {
  if (count <= 0) return '';
  return formatMatchesGenitive(count);
}

export function pendingPredictionsPhrase(count: number): string {
  if (count <= 0) return '';
  return formatPredictions(count);
}

export function remainingPredictionsPhrase(count: number): string {
  if (count <= 0) return '';
  return `осталось ${formatPredictions(count)}`;
}

export function remainingFriendsWithPredictionPhrase(count: number): string {
  if (count <= 0) return '';
  return `ещё ${ruCount(count, 'друг', 'друга', 'друзей')} с прогнозом`;
}

export function pendingFriendsPredictionPhrase(count: number): string {
  if (count <= 0) return '';
  return `${formatFriends(count)} ${count === 1 ? 'ждёт' : 'ждут'} первого прогноза`;
}

export function formatPredictionStats(stats: {
  outcomeHits: number;
  differenceHits: number;
  exactScores: number;
  predictionsCount?: number;
}): string {
  const hasScored =
    (stats.predictionsCount ?? 0) > 0 ||
    stats.outcomeHits > 0 ||
    stats.differenceHits > 0 ||
    stats.exactScores > 0;

  if (!hasScored) return 'Нет прогнозов';

  const outcomes = `${stats.outcomeHits} ${ruPlural(stats.outcomeHits, 'исход', 'исхода', 'исходов')}`;
  const diffs = `${stats.differenceHits} ${ruPlural(stats.differenceHits, 'разница', 'разницы', 'разниц')}`;
  const exact = `${stats.exactScores} ${ruPlural(stats.exactScores, 'точный счёт', 'точных счёта', 'точных счетов')}`;

  return [`Угадал ${outcomes}`, diffs, exact].join(' · ');
}
