import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

import type { MatchConsensus } from './match-stats.js';

const EMPTY_CONSENSUS: MatchConsensus = { home: 0, draw: 0, away: 0, total: 0 };

export function emptyConsensus(): MatchConsensus {
  return { ...EMPTY_CONSENSUS };
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isDevAuthEnabled(): boolean {
  return process.env.DEV_MODE === 'true' && !isProduction();
}

const BOT_API_SECRET_PLACEHOLDER = 'your_bot_api_secret';

export function safeSecretEqual(expected: string, provided: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function getBotApiSecret(): string {
  return process.env.BOT_API_SECRET ?? '';
}

export function isValidBotApiSecret(secret: string): boolean {
  return secret.length >= 32 && secret !== BOT_API_SECRET_PLACEHOLDER;
}

function normalizeClientIp(ip: string): string {
  const trimmed = ip.trim();
  if (trimmed.startsWith('::ffff:')) return trimmed.slice(7);
  return trimmed;
}

function loadBotApiAllowedIps(): ReadonlySet<string> | null {
  const raw = process.env.BOT_API_ALLOWED_IPS ?? '';
  if (!raw.trim()) return null;

  const ids = new Set<string>();
  for (const part of raw.split(/[,;\s]+/)) {
    const trimmed = normalizeClientIp(part.trim());
    if (trimmed) ids.add(trimmed);
  }
  return ids;
}

/** Ограничение /api/bot по IP. В dev без BOT_API_ALLOWED_IPS — пропускает всех. */
export function createBotApiIpAllowlistMiddleware() {
  const allowed = loadBotApiAllowedIps();

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!allowed) {
      next();
      return;
    }

    const ip = normalizeClientIp(req.ip ?? req.socket.remoteAddress ?? '');
    if (allowed.has(ip)) {
      next();
      return;
    }

    console.warn(`[bot-api] blocked request from IP ${ip}`);
    res.status(403).json({ error: 'Forbidden' });
  };
}

/** Запрет опасной конфигурации при старте. */
export function assertSafeProductionConfig(): void {
  if (isProduction() && process.env.DEV_MODE === 'true') {
    console.error('[security] FATAL: DEV_MODE=true запрещён при NODE_ENV=production');
    process.exit(1);
  }

  const token = process.env.BOT_TOKEN ?? '';
  if (isProduction() && (!token || token === 'your_telegram_bot_token')) {
    console.error('[security] FATAL: задайте реальный BOT_TOKEN в production');
    process.exit(1);
  }

  const apiSecret = getBotApiSecret();
  if (isProduction() && !isValidBotApiSecret(apiSecret)) {
    console.error('[security] FATAL: задайте BOT_API_SECRET (мин. 32 символа) в production');
    process.exit(1);
  }

  if (isProduction() && apiSecret && token && apiSecret === token) {
    console.error('[security] FATAL: BOT_API_SECRET не должен совпадать с BOT_TOKEN');
    process.exit(1);
  }

  const allowedIps = loadBotApiAllowedIps();
  if (isProduction() && (!allowedIps || allowedIps.size === 0)) {
    console.error(
      '[security] FATAL: задайте BOT_API_ALLOWED_IPS в production (например 127.0.0.1,::1 для bot на том же сервере)'
    );
    process.exit(1);
  }

  const webapp = process.env.WEBAPP_URL ?? '';
  if (isProduction() && !webapp.startsWith('https://')) {
    console.error('[security] FATAL: WEBAPP_URL должен быть https:// в production');
    process.exit(1);
  }
}

export function secureApiHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (isProduction()) {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'self' https://web.telegram.org https://telegram.org"
    );
  }
  next();
}

type RateBucket = { count: number; resetAt: number };

function pruneRateBuckets(buckets: Map<string, RateBucket>, now: number): void {
  if (buckets.size < 4000) return;
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
}) {
  const buckets = new Map<string, RateBucket>();
  const { windowMs, max, message = 'Слишком много запросов, попробуйте позже' } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    pruneRateBuckets(buckets, now);

    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const authUser = (req as Request & { user?: { id: number } }).user;
    const userPart = typeof authUser?.id === 'number' ? `:u${authUser.id}` : '';
    const key = `${ip}:${req.method}:${req.path}${userPart}`;

    let bucket = buckets.get(key);
    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    if (bucket.count > max) {
      res.status(429).json({ error: message });
      return;
    }

    next();
  };
}

const VALID_GROUP = /^[A-H]$/i;

export function parseMatchesGroupFilter(raw: unknown): string | undefined {
  if (raw == null || raw === '') return undefined;
  if (typeof raw !== 'string') return undefined;
  if (raw === 'all') return undefined;
  if (!VALID_GROUP.test(raw)) return undefined;
  return raw.toUpperCase();
}

export function parseSearchQuery(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().slice(0, 32);
}

export function parseUserIdList(raw: unknown, max = 20): number[] {
  if (!Array.isArray(raw)) return [];
  const ids: number[] = [];
  for (const item of raw) {
    if (typeof item !== 'number' || !Number.isSafeInteger(item) || item <= 0) continue;
    if (!ids.includes(item)) ids.push(item);
    if (ids.length >= max) break;
  }
  return ids;
}

export function parseLeagueCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const code = raw.trim().toUpperCase();
  if (!/^[A-F0-9]{8}$/.test(code)) return null;
  return code;
}

const ALLOWED_PHOTO_HOSTS = new Set(['t.me', 'telegram.org', 'api.telegram.org']);

/** Разрешены только HTTPS-URL аватаров с доменов Telegram CDN. */
export function isAllowedPhotoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (ALLOWED_PHOTO_HOSTS.has(host)) return true;
    return host.endsWith('.telegram.org') || host.endsWith('.t.me');
  } catch {
    return false;
  }
}

export function sanitizePhotoUrl(url: string | undefined | null): string | undefined {
  if (url == null || typeof url !== 'string') return undefined;
  const trimmed = url.trim().slice(0, 512);
  if (!trimmed || !isAllowedPhotoUrl(trimmed)) return undefined;
  return trimmed;
}

/** Rate limit по user id — применять после authMiddleware. */
export function createUserRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
}) {
  const buckets = new Map<string, RateBucket>();
  const { windowMs, max, message = 'Слишком много запросов, попробуйте позже' } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const userId = (req as Request & { user?: { id: number } }).user?.id;
    if (userId == null) {
      next();
      return;
    }

    const now = Date.now();
    pruneRateBuckets(buckets, now);

    const key = `u${userId}:${req.method}:${req.path}`;
    let bucket = buckets.get(key);
    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    if (bucket.count > max) {
      res.status(429).json({ error: message });
      return;
    }

    next();
  };
}
