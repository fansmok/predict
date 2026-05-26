import { db } from './db.js';

const BOT_TOKEN = process.env.BOT_TOKEN ?? '';
const HIT_TTL_MS = 6 * 60 * 60 * 1000;
const MISS_TTL_MS = 15 * 60 * 1000;

type CacheHit = { kind: 'hit'; buffer: Buffer; contentType: string; at: number };
type CacheMiss = { kind: 'miss'; at: number };

const cache = new Map<number, CacheHit | CacheMiss>();

async function tgGet<T>(method: string, params: Record<string, string | number>): Promise<T | null> {
  if (!BOT_TOKEN || BOT_TOKEN === 'your_telegram_bot_token') return null;

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) qs.set(k, String(v));

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}?${qs}`);
    const data = (await res.json()) as { ok: boolean; result?: T };
    return data.ok ? (data.result ?? null) : null;
  } catch (e) {
    console.warn(`[telegram-avatar] ${method} failed:`, e instanceof Error ? e.message : e);
    return null;
  }
}

async function fetchRemotePhoto(
  photoUrl: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const res = await fetch(photoUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type')?.split(';')[0]?.trim() || '';
    if (contentType && !contentType.startsWith('image/')) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 64) return null;
    return { buffer, contentType: contentType || 'image/jpeg' };
  } catch {
    return null;
  }
}

function getStoredPhotoUrl(userId: number): string | null {
  const row = db.prepare('SELECT photo_url FROM users WHERE id = ?').get(userId) as
    | { photo_url: string | null }
    | undefined;
  const url = row?.photo_url?.trim();
  return url || null;
}

async function tryStoredPhotoUrl(userId: number): Promise<{ buffer: Buffer; contentType: string } | null> {
  const photoUrl = getStoredPhotoUrl(userId);
  if (!photoUrl) return null;
  return fetchRemotePhoto(photoUrl);
}

export async function getUserAvatarBytes(
  userId: number
): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!Number.isSafeInteger(userId) || userId <= 0) return null;

  const now = Date.now();
  const cached = cache.get(userId);
  if (cached) {
    if (cached.kind === 'hit' && now - cached.at < HIT_TTL_MS) {
      return { buffer: cached.buffer, contentType: cached.contentType };
    }
    if (cached.kind === 'miss' && now - cached.at < MISS_TTL_MS) return null;
  }

  const photos = await tgGet<{ photos: Array<Array<{ file_id: string }>> }>('getUserProfilePhotos', {
    user_id: userId,
    limit: 1,
  });

  const sizes = photos?.photos?.[0];
  const fileId = sizes?.[sizes.length - 1]?.file_id;
  if (!fileId) {
    const stored = await tryStoredPhotoUrl(userId);
    if (stored) {
      cache.set(userId, { kind: 'hit', ...stored, at: now });
      return stored;
    }
    cache.set(userId, { kind: 'miss', at: now });
    return null;
  }

  const file = await tgGet<{ file_path: string }>('getFile', { file_id: fileId });
  if (!file?.file_path) {
    const stored = await tryStoredPhotoUrl(userId);
    if (stored) {
      cache.set(userId, { kind: 'hit', ...stored, at: now });
      return stored;
    }
    cache.set(userId, { kind: 'miss', at: now });
    return null;
  }

  try {
    const fileRes = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`);
    if (!fileRes.ok) {
      const stored = await tryStoredPhotoUrl(userId);
      if (stored) {
        cache.set(userId, { kind: 'hit', ...stored, at: now });
        return stored;
      }
      cache.set(userId, { kind: 'miss', at: now });
      return null;
    }

    const buffer = Buffer.from(await fileRes.arrayBuffer());
    const contentType = fileRes.headers.get('content-type')?.split(';')[0]?.trim() || 'image/jpeg';
    cache.set(userId, { kind: 'hit', buffer, contentType, at: now });
    return { buffer, contentType };
  } catch (e) {
    console.warn(`[telegram-avatar] download ${userId}:`, e instanceof Error ? e.message : e);
    const stored = await tryStoredPhotoUrl(userId);
    if (stored) {
      cache.set(userId, { kind: 'hit', ...stored, at: now });
      return stored;
    }
    cache.set(userId, { kind: 'miss', at: now });
    return null;
  }
}

/** Сброс кэша — для тестов. */
export function clearAvatarCache(): void {
  cache.clear();
}
