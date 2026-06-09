import './load-env.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db.js';
import routes from './routes.js';
import { startCronJobs } from './cron.js';
import { warnIfNoAdminsConfigured, getAdminCount } from './admins.js';
import {
  assertSafeProductionConfig,
  createRateLimiter,
  isProduction,
  secureApiHeaders,
} from './security.js';
import { getBotUsername, initBotUsername } from './bot-config.js';
import { recalculateAllFinishedMatchPoints } from './admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

assertSafeProductionConfig();

const PORT = parseInt(process.env.PORT ?? '3001', 10);

initDatabase();
warnIfNoAdminsConfigured();

const recalced = recalculateAllFinishedMatchPoints();
if (recalced > 0) {
  console.log(`[scoring] Пересчитаны очки прогнозов: ${recalced} записей`);
}

const app = express();

if (isProduction()) {
  app.set('trust proxy', 1);
}

const webappOrigin = process.env.WEBAPP_URL ?? 'http://localhost:5173';
app.use(cors({
  origin(origin, callback) {
    // Нет Origin — прямой заход в браузере, curl, health-check
    if (!origin) return callback(null, true);
    if (origin === webappOrigin) return callback(null, true);
    // Тот же домен по http или https (до/после certbot)
    try {
      if (new URL(origin).hostname === new URL(webappOrigin).hostname) {
        if (isProduction() && webappOrigin.startsWith('https://') && origin.startsWith('http://')) {
          return callback(new Error('Not allowed by CORS'));
        }
        return callback(null, true);
      }
    } catch {
      /* ignore */
    }
    if (process.env.DEV_MODE === 'true' && !isProduction() && /^http:\/\/localhost(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));

app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Некорректный JSON' });
    return;
  }
  next(err);
});

app.use('/api', secureApiHeaders);

const apiRateLimit = createRateLimiter({ windowMs: 60_000, max: 180 });
const strictRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 40,
  message: 'Слишком много запросов к этому действию',
});

app.use('/api', apiRateLimit);
app.use('/api/predictions', strictRateLimit);
app.use('/api/double-picks', strictRateLimit);
app.use('/api/friends/search', strictRateLimit);
app.use('/api/friends/invite', strictRateLimit);
app.use('/api/leagues/join', strictRateLimit);
app.use('/api/leagues/:id/invite', strictRateLimit);
app.use('/api/admin', strictRateLimit);

const botApiRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 120,
  message: 'Слишком много запросов к bot API',
});
app.use('/api/bot', botApiRateLimit);

app.use('/api', routes);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  console.error('[API Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');

function setStaticCacheHeaders(res: express.Response, filePath: string): void {
  const normalized = filePath.replace(/\\/g, '/');
  if (normalized.endsWith('/index.html')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return;
  }
  if (normalized.includes('/assets/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return;
  }
  if (normalized.endsWith('/telegram-web-app.js')) {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
}

app.use(
  express.static(clientDist, {
    index: false,
    setHeaders: setStaticCacheHeaders,
  })
);

app.get('*', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(clientDist, 'index.html'), err => {
    if (err) res.status(404).json({ message: 'Frontend not built. Run npm run dev:client' });
  });
});

async function startServer() {
  await initBotUsername();
  if (isProduction() && getBotUsername() === 'your_bot') {
    console.error('[security] FATAL: не удалось определить BOT_USERNAME — задайте в .env');
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Dev mode: ${process.env.DEV_MODE === 'true' ? 'ON' : 'OFF'}`);
    console.log(`Admins configured: ${getAdminCount()}`);
    if (getBotUsername() !== 'your_bot') {
      console.log(`Invite links: t.me/${getBotUsername()}`);
    }
    startCronJobs();
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Порт ${PORT} уже занят. Остановите предыдущий процесс:`);
      console.error(`   lsof -ti :${PORT} | xargs kill -9`);
      console.error(`   или: npm run dev — только один экземпляр сервера\n`);
      process.exit(1);
    }
    throw err;
  });
}

startServer().catch(err => {
  console.error('[startup]', err);
  process.exit(1);
});
