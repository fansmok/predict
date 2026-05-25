import type { Request, Response, NextFunction } from 'express';

let adminIdsCache: ReadonlySet<number> | null = null;

/** Сброс кэша — только для тестов. */
export function resetAdminIdsCache(): void {
  adminIdsCache = null;
}

function loadAdminUserIds(): ReadonlySet<number> {
  if (adminIdsCache) return adminIdsCache;

  const ids = new Set<number>();
  const raw = process.env.ADMIN_USER_IDS ?? '';

  for (const part of raw.split(/[,;\s]+/)) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const id = Number(trimmed);
    if (!Number.isSafeInteger(id) || id <= 0) {
      console.warn(`[admins] Пропущен некорректный ID в ADMIN_USER_IDS: "${trimmed}"`);
      continue;
    }
    ids.add(id);
  }

  adminIdsCache = ids;
  return ids;
}

export function isAdminUser(userId: number): boolean {
  if (!Number.isSafeInteger(userId) || userId <= 0) return false;
  return loadAdminUserIds().has(userId);
}

export function warnIfNoAdminsConfigured(): void {
  if (loadAdminUserIds().size === 0) {
    console.warn('[admins] ADMIN_USER_IDS пуст — админ-API недоступен ни для кого');
  }
}

export function getAdminCount(): number {
  return loadAdminUserIds().size;
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  const userId = req.user?.id;
  if (userId == null || !isAdminUser(userId)) {
    res.status(403).json({ error: 'Недостаточно прав' });
    return;
  }
  next();
}

export function logAdminAction(userId: number, action: string, meta?: Record<string, unknown>): void {
  const suffix = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  console.warn(`[admin] userId=${userId} ${action}${suffix}`);
}
