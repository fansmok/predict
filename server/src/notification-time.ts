const MSK = 'Europe/Moscow';
const MSK_OFFSET = '+03:00';

/** Календарная дата по МСК (YYYY-MM-DD). */
export function getMskDateKey(d = new Date()): string {
  return d.toLocaleDateString('en-CA', { timeZone: MSK });
}

/** Момент «dateKey HH:MM» по МСК в unix ms. */
export function mskDateTimeMs(dateKey: string, hour: number, minute = 0): number {
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return new Date(`${dateKey}T${hh}:${mm}:00${MSK_OFFSET}`).getTime();
}

/** Окно суток для дайджеста: [вчера 10:00 … сегодня 10:00) МСК. */
export function getDigestWindow(todayKey = getMskDateKey()): {
  startIso: string;
  endIso: string;
  startLabel: string;
  endLabel: string;
} {
  const endMs = mskDateTimeMs(todayKey, 10);
  const startMs = endMs - 24 * 60 * 60_000;
  return {
    startIso: new Date(startMs).toISOString(),
    endIso: new Date(endMs).toISOString(),
    startLabel: formatMskDateTimeLabel(startMs),
    endLabel: formatMskDateTimeLabel(endMs),
  };
}

export function formatMskTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: MSK,
  });
}

export function formatMskDateTimeLabel(ms: number): string {
  const d = new Date(ms);
  const date = d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    timeZone: MSK,
  });
  const time = d.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: MSK,
  });
  return `${date}, ${time}`;
}

/** « (завтра)» если kickoff в другой календарный день МСК от referenceDateKey. */
export function kickoffDaySuffix(kickoff: string, referenceDateKey: string): string {
  const kickoffDateKey = getMskDateKey(new Date(kickoff));
  if (kickoffDateKey === referenceDateKey) return '';
  return ' (завтра)';
}
