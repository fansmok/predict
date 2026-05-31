import { Router, Request, Response, NextFunction } from 'express';
import {
  registerTelegramUser,
  getBotUserStats,
  getBotTodayMatches,
  getBotTopLeaders,
  broadcastAnnouncement,
  getAllRegisteredUserIds,
  getLeagueInvitePreview,
} from './bot-api.js';
import { isAdminUser, logAdminAction } from './admins.js';
import {
  createBotApiIpAllowlistMiddleware,
  createRateLimiter,
  getBotApiSecret,
  isDevAuthEnabled,
  isProduction,
  isValidBotApiSecret,
  safeSecretEqual,
} from './security.js';

const router = Router();

function parseTelegramId(raw: unknown): number | null {
  const id = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return id;
}

function isBotApiSecretAccepted(secret: string): boolean {
  if (!secret) return false;
  if (isProduction()) return isValidBotApiSecret(secret);
  if (secret === 'your_bot_api_secret') return isDevAuthEnabled();
  return secret.length > 0;
}

function botAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const secret = getBotApiSecret();
  const auth = req.headers.authorization ?? '';
  const provided = auth.startsWith('Bearer ') ? auth.slice(7) : '';

  if (!isBotApiSecretAccepted(secret) || !provided || !safeSecretEqual(secret, provided)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

const botIpAllowlist = createBotApiIpAllowlistMiddleware();
const botRegisterLimit = createRateLimiter({
  windowMs: 60_000,
  max: 60,
  message: 'Слишком много запросов регистрации',
});
const botAnnounceTargetsLimit = createRateLimiter({
  windowMs: 60_000,
  max: 10,
  message: 'Слишком много запросов списка рассылки',
});
const botAnnounceLimit = createRateLimiter({
  windowMs: 60_000,
  max: 5,
  message: 'Слишком много запросов рассылки',
});

router.use(botIpAllowlist);
router.use(botAuthMiddleware);

router.post('/register', botRegisterLimit, (req, res) => {
  const id = parseTelegramId(req.body?.id);
  const first_name = typeof req.body?.first_name === 'string' ? req.body.first_name.trim().slice(0, 64) : '';
  if (id == null || !first_name) {
    return res.status(400).json({ error: 'Invalid user data' });
  }

  const user = registerTelegramUser({
    id,
    first_name,
    last_name: typeof req.body.last_name === 'string' ? req.body.last_name.slice(0, 64) : undefined,
    username: typeof req.body.username === 'string' ? req.body.username.slice(0, 32) : undefined,
    startParam: typeof req.body.startParam === 'string' ? req.body.startParam.slice(0, 256) : undefined,
  });

  res.json({ success: true, userId: user.id });
});

router.get('/stats/:telegramId', (req, res) => {
  const telegramId = parseTelegramId(req.params.telegramId);
  if (telegramId == null) return res.status(400).json({ error: 'Invalid id' });

  const stats = getBotUserStats(telegramId);
  if (!stats) return res.json({ registered: false });
  res.json({ registered: true, stats });
});

router.get('/today/:telegramId', (req, res) => {
  const telegramId = parseTelegramId(req.params.telegramId);
  if (telegramId == null) return res.status(400).json({ error: 'Invalid id' });

  res.json({ matches: getBotTodayMatches(telegramId) });
});

router.get('/leaders', (req, res) => {
  const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '5'), 10) || 5, 1), 20);
  res.json({ leaders: getBotTopLeaders(limit) });
});

router.get('/league-invite', (req, res) => {
  const startParam = typeof req.query.startParam === 'string' ? req.query.startParam.slice(0, 256) : '';
  if (!startParam) return res.status(400).json({ error: 'startParam required' });

  const preview = getLeagueInvitePreview(startParam);
  if (!preview) return res.status(404).json({ error: 'League not found' });
  res.json(preview);
});

router.get('/announce-targets', botAnnounceTargetsLimit, (req, res) => {
  const adminId = parseTelegramId(req.query.adminId);
  if (adminId == null || !isAdminUser(adminId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json({ userIds: getAllRegisteredUserIds() });
});

router.post('/announce', botAnnounceLimit, async (req, res) => {
  const adminId = parseTelegramId(req.body?.adminId);
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';

  if (adminId == null || !isAdminUser(adminId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (!text) {
    return res.status(400).json({ error: 'Text required' });
  }
  if (text.length > 4000) {
    return res.status(400).json({ error: 'Text too long' });
  }

  logAdminAction(adminId, 'announce', { length: text.length });
  const result = await broadcastAnnouncement(text);
  res.json({ success: true, ...result });
});

export default router;
