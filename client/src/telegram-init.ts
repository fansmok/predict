const INIT_DATA_STORAGE_KEY = 'liga_tg_init_data';

/** initData из hash/query — работает даже если telegram.org заблокирован (VPN). */
export function parseInitDataFromLocation(): string {
  try {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const fromHash = hashParams.get('tgWebAppData');
    if (fromHash) return decodeURIComponent(fromHash);
  } catch {
    /* ignore */
  }

  try {
    const searchParams = new URLSearchParams(window.location.search);
    const fromSearch = searchParams.get('tgWebAppData');
    if (fromSearch) return decodeURIComponent(fromSearch);
  } catch {
    /* ignore */
  }

  return '';
}

function cacheInitData(value: string): void {
  if (!value) return;
  try {
    sessionStorage.setItem(INIT_DATA_STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
}

/** Единый источник initData: SDK → URL → sessionStorage. */
export function getTelegramInitData(): string {
  const fromSdk = window.Telegram?.WebApp?.initData?.trim();
  if (fromSdk) {
    cacheInitData(fromSdk);
    return fromSdk;
  }

  const fromUrl = parseInitDataFromLocation().trim();
  if (fromUrl) {
    cacheInitData(fromUrl);
    return fromUrl;
  }

  try {
    return sessionStorage.getItem(INIT_DATA_STORAGE_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

export function hasTelegramInitData(): boolean {
  return getTelegramInitData().length > 0;
}

export async function waitForTelegramInitData(maxMs = 5000): Promise<void> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    if (hasTelegramInitData()) return;
    await new Promise<void>(resolve => window.setTimeout(resolve, 50));
  }
}
