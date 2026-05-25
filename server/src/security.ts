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
