const INIT_DATA_STORAGE_KEY = 'liga_tg_init_data';

export function isInitDataFresh(initData: string): boolean {
  if (!initData) return false;
  try {
    const authDate = parseInt(new URLSearchParams(initData).get('auth_date') ?? '0', 10);
    if (!Number.isFinite(authDate) || authDate <= 0) return false;
    return Math.floor(Date.now() / 1000) - authDate < 86_400;
  } catch {
    return false;
  }
}

/** initData из hash/query — Telegram передаёт при открытии Mini App. */
export function parseInitDataFromLocation(): string {
  try {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const fromHash = hashParams.get('tgWebAppData');
    if (fromHash) return fromHash;
  } catch {
    /* ignore */
  }

  try {
    const searchParams = new URLSearchParams(window.location.search);
    const fromSearch = searchParams.get('tgWebAppData');
    if (fromSearch) return fromSearch;
  } catch {
    /* ignore */
  }

  return '';
}

/** Кэш Telegram SDK: sessionStorage['__telegram__initParams']. */
export function parseInitDataFromTelegramStorage(): string {
  try {
    const raw = sessionStorage.getItem('__telegram__initParams');
    if (!raw) return '';
    const parsed = JSON.parse(raw) as { tgWebAppData?: string };
    const data = parsed?.tgWebAppData;
    return typeof data === 'string' ? data.trim() : '';
  } catch {
    return '';
  }
}

function cacheInitData(value: string): void {
  if (!value || !isInitDataFresh(value)) return;
  try {
    sessionStorage.setItem(INIT_DATA_STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
}

export function clearCachedInitData(): void {
  try {
    sessionStorage.removeItem(INIT_DATA_STORAGE_KEY);
    sessionStorage.removeItem('__telegram__initParams');
  } catch {
    /* ignore */
  }
}

/** Сохранить initData из URL как можно раньше (до загрузки SDK/бандла). */
export function primeInitDataFromUrl(): void {
  const fromUrl = parseInitDataFromLocation().trim();
  if (fromUrl && isInitDataFresh(fromUrl)) {
    cacheInitData(fromUrl);
  }
}

export function isMobileTelegramPlatform(): boolean {
  const platform = window.Telegram?.WebApp?.platform?.toLowerCase() ?? '';
  if (platform === 'ios' || platform === 'android') return true;
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

function readInitDataCandidates(): string[] {
  return [
    window.Telegram?.WebApp?.initData?.trim() ?? '',
    parseInitDataFromLocation().trim(),
    parseInitDataFromTelegramStorage(),
    (() => {
      try {
        return sessionStorage.getItem(INIT_DATA_STORAGE_KEY)?.trim() ?? '';
      } catch {
        return '';
      }
    })(),
  ];
}

/** Единый источник initData: SDK → URL → Telegram cache → свой cache (только свежие). */
export function getTelegramInitData(): string {
  for (const data of readInitDataCandidates()) {
    if (data && isInitDataFresh(data)) {
      cacheInitData(data);
      return data;
    }
  }
  return '';
}

/** Сброс кэша только при явной ошибке авторизации (не при каждом опросе). */
export function invalidateTelegramInitData(): void {
  clearCachedInitData();
}

/** Перечитать initData из SDK после загрузки (актуально при возврате из фона). */
export function syncInitDataFromSdk(): boolean {
  const fresh = window.Telegram?.WebApp?.initData?.trim() ?? '';
  if (fresh && isInitDataFresh(fresh)) {
    cacheInitData(fresh);
    return true;
  }
  return false;
}

export function hasTelegramInitData(): boolean {
  return getTelegramInitData().length > 0;
}

export async function waitForTelegramInitData(maxMs?: number): Promise<void> {
  const ms = maxMs ?? (isMobileTelegramPlatform() ? 30_000 : 8_000);
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    syncInitDataFromSdk();
    if (hasTelegramInitData()) return;
    await new Promise<void>(resolve => window.setTimeout(resolve, 100));
  }
}
