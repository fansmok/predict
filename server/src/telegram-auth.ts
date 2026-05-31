import crypto from 'crypto';
import { sanitizePhotoUrl } from './security.js';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

function clipString(value: unknown, maxLen: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLen);
}

function parseTelegramUser(raw: unknown): TelegramUser | null {
  if (!raw || typeof raw !== 'object') return null;
  const u = raw as Record<string, unknown>;
  const id = typeof u.id === 'number' ? u.id : Number(u.id);
  if (!Number.isSafeInteger(id) || id <= 0) return null;

  const firstName = clipString(u.first_name, 64);
  if (!firstName) return null;

  const lastName = clipString(u.last_name, 64);
  const username = clipString(u.username, 32);
  const photoUrl = sanitizePhotoUrl(clipString(u.photo_url, 512));

  return {
    id,
    first_name: firstName,
    ...(lastName ? { last_name: lastName } : {}),
    ...(username ? { username } : {}),
    ...(photoUrl ? { photo_url: photoUrl } : {}),
  };
}

export function validateTelegramInitData(
  initData: string,
  botToken: string
): TelegramUser | null {
  if (!initData || !botToken || botToken === 'your_telegram_bot_token') return null;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash || !/^[a-f0-9]{64}$/i.test(hash)) return null;

  params.delete('hash');
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  const hashBuf = Buffer.from(hash, 'hex');
  const calcBuf = Buffer.from(calculatedHash, 'hex');
  if (hashBuf.length !== calcBuf.length || !crypto.timingSafeEqual(hashBuf, calcBuf)) {
    return null;
  }

  const authDate = parseInt(params.get('auth_date') ?? '0', 10);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(authDate) || authDate <= 0 || now - authDate > 86400) return null;

  const userStr = params.get('user');
  if (!userStr || userStr.length > 4096) return null;

  try {
    return parseTelegramUser(JSON.parse(userStr));
  } catch {
    return null;
  }
}

export function createDevUser(): TelegramUser {
  return {
    id: 999999,
    first_name: 'Тестовый',
    last_name: 'Пользователь',
    username: 'test_user',
  };
}

export type { TelegramUser };
