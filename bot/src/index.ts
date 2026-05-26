import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Bot, InlineKeyboard } from 'grammy';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const token = process.env.BOT_TOKEN;
const webAppUrlEnv = process.env.WEBAPP_URL ?? 'http://localhost:5173';
const serverUrl = process.env.SERVER_URL ?? 'http://127.0.0.1:3001';

if (!token || token === 'your_telegram_bot_token') {
  console.log('⚠️  BOT_TOKEN не задан. Бот не запущен.');
  console.log('   Создайте бота через @BotFather и добавьте токен в .env');
  process.exit(0);
}

const bot = new Bot(token);

async function apiCall<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${serverUrl}/api/bot${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options?.headers ?? {}),
      },
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch (e) {
    console.error('API call failed:', path, e);
    return null;
  }
}

async function registerUser(
  from: { id: number; first_name: string; last_name?: string; username?: string },
  startParam?: string
) {
  await apiCall('/register', {
    method: 'POST',
    body: JSON.stringify({
      id: from.id,
      first_name: from.first_name,
      last_name: from.last_name ?? null,
      username: from.username ?? null,
      startParam: startParam || undefined,
    }),
  });
}

function webAppUrl(startParam?: string): string {
  if (!startParam) return webAppUrlEnv;
  const url = new URL(webAppUrlEnv);
  url.searchParams.set('tgWebAppStartParam', startParam);
  return url.toString();
}

function canUseWebAppButton(url: string): boolean {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

function appKeyboard(startParam?: string) {
  const url = webAppUrl(startParam);
  if (canUseWebAppButton(url)) {
    return new InlineKeyboard().webApp('🏆 Открыть Лигу Прогнозов', url);
  }

  const botUsername = (process.env.BOT_USERNAME ?? 'predictliga_bot').replace(/^@/, '');
  const shortName = process.env.WEBAPP_SHORT_NAME ?? 'predictliga';
  const miniAppLink = startParam
    ? `https://t.me/${botUsername}/${shortName}?startapp=${encodeURIComponent(startParam)}`
    : `https://t.me/${botUsername}/${shortName}`;
  return new InlineKeyboard().url('🏆 Открыть Лигу Прогнозов', miniAppLink);
}

const HELP_TEXT =
  `*Лига Прогнозов — ЧМ-2026*\n\n` +
  `*Команды:*\n` +
  `/start — открыть приложение\n` +
  `/stats — ваши очки и место\n` +
  `/today — матчи сегодня\n` +
  `/rank — топ-5 игроков\n` +
  `/help — эта справка\n\n` +
  `*Система очков:*\n` +
  `🎯 Точный счёт — *5* (×2 бонус удваивает)\n` +
  `📊 Разница мячей — *3*\n` +
  `✅ Исход — *2*\n` +
  `🏆 Fantasy-команда — *+1* за событие\n` +
  `🌍 Турнирные picks — до *80* очков\n\n` +
  `Прогноз закрывается при старте матча.`;

bot.command('start', async ctx => {
  const payload = ctx.match?.trim() ?? '';
  const from = ctx.from!;

  await registerUser(from, payload || undefined);

  if (payload.startsWith('ref_')) {
    await ctx.reply(
      `⚽ *Лига Прогнозов — ЧМ-2026*\n\n` +
        `Вас пригласили в игру! Делайте прогнозы, собирайте fantasy-команду и соревнуйтесь с друзьями.\n\n` +
        `Нажмите кнопку ниже, чтобы начать!`,
      { parse_mode: 'Markdown', reply_markup: appKeyboard(payload) }
    );
    return;
  }

  if (payload.startsWith('league_')) {
    await ctx.reply(
      `🏆 *Приватная лига*\n\n` +
        `Вас пригласили в закрытую лигу прогнозистов!\n` +
        `Рейтинг виден только участникам лиги.\n\n` +
        `Откройте приложение, чтобы вступить.`,
      { parse_mode: 'Markdown', reply_markup: appKeyboard(payload) }
    );
    return;
  }

  await ctx.reply(
    `⚽ *Лига Прогнозов — ЧМ-2026*\n\n` +
      `Добро пожаловать, ${from.first_name}! Делайте прогнозы на матчи Чемпионата мира.\n\n` +
      `Используйте /stats и /today прямо в боте.\n\n` +
      `Нажмите кнопку ниже, чтобы открыть приложение!`,
    { parse_mode: 'Markdown', reply_markup: appKeyboard() }
  );
});

bot.command('help', async ctx => {
  await registerUser(ctx.from!);
  await ctx.reply(HELP_TEXT, { parse_mode: 'Markdown', reply_markup: appKeyboard() });
});

bot.command('stats', async ctx => {
  const from = ctx.from!;
  await registerUser(from);

  const data = await apiCall<{ registered: boolean; stats?: {
    firstName: string;
    totalPoints: number;
    matchPoints: number;
    tournamentPoints: number;
    squadPoints: number;
    rank: number;
    predictionsCount: number;
    exactScores: number;
  } }>(`/stats/${from.id}`);

  if (!data?.registered || !data.stats) {
    await ctx.reply(
      'Вы ещё не в игре. Откройте приложение и сделайте первый прогноз!',
      { reply_markup: appKeyboard() }
    );
    return;
  }

  const s = data.stats;
  await ctx.reply(
    `📊 *Ваша статистика*\n\n` +
      `🏅 Место: *#${s.rank}*\n` +
      `⭐ Очки: *${s.totalPoints}*\n\n` +
      `⚽ Матчи: ${s.matchPoints}\n` +
      `🌍 Турнир: ${s.tournamentPoints}\n` +
      `👥 Fantasy: ${s.squadPoints}\n\n` +
      `📝 Прогнозов: ${s.predictionsCount} · Точных: ${s.exactScores}`,
    { parse_mode: 'Markdown', reply_markup: appKeyboard() }
  );
});

bot.command('today', async ctx => {
  const from = ctx.from!;
  await registerUser(from);

  const data = await apiCall<{ matches: Array<{
    time: string;
    homeTeam: string;
    awayTeam: string;
    status: string;
    score: string | null;
    hasPrediction: boolean;
    prediction: string | null;
    points: number | null;
  }> }>(`/today/${from.id}`);

  const matches = data?.matches ?? [];

  if (matches.length === 0) {
    await ctx.reply('📅 Сегодня матчей нет.', { reply_markup: appKeyboard() });
    return;
  }

  const lines = matches.map(m => {
    const pred = m.hasPrediction
      ? m.status === 'finished'
        ? ` · ${m.prediction} → +${m.points ?? 0}`
        : ` · прогноз ${m.prediction}`
      : ' · ⚠️ нет прогноза';
    const score = m.score ? ` (${m.score})` : '';
    return `${m.time} ${m.homeTeam} — ${m.awayTeam}${score}${pred}`;
  });

  await ctx.reply(
    `📅 *Матчи сегодня*\n\n${lines.join('\n')}`,
    { parse_mode: 'Markdown', reply_markup: appKeyboard() }
  );
});

bot.command('rank', async ctx => {
  await registerUser(ctx.from!);

  const data = await apiCall<{ leaders: Array<{ rank: number; name: string; totalPoints: number }> }>(
    '/leaders?limit=5'
  );

  const leaders = data?.leaders ?? [];
  if (leaders.length === 0) {
    await ctx.reply('Рейтинг пока пуст.', { reply_markup: appKeyboard() });
    return;
  }

  const medals = ['🥇', '🥈', '🥉', '4.', '5.'];
  const lines = leaders.map(l => `${medals[l.rank - 1] ?? `${l.rank}.`} ${l.name} — *${l.totalPoints}*`);

  await ctx.reply(
    `🏆 *Топ-5 игроков*\n\n${lines.join('\n')}`,
    { parse_mode: 'Markdown', reply_markup: appKeyboard() }
  );
});

bot.on('message:text', async ctx => {
  if (ctx.message.text.startsWith('/')) return;
  await registerUser(ctx.from!);
  await ctx.reply('Используйте /start или /help', { reply_markup: appKeyboard() });
});

bot.catch(err => {
  console.error('Bot error:', err);
});

async function setCommands() {
  await bot.api.setMyCommands([
    { command: 'start', description: 'Открыть приложение' },
    { command: 'stats', description: 'Мои очки и место' },
    { command: 'today', description: 'Матчи сегодня' },
    { command: 'rank', description: 'Топ-5 игроков' },
    { command: 'help', description: 'Справка и правила' },
  ]);
}

console.log('🤖 Telegram bot starting...');
void setCommands();
bot.start({
  onStart: botInfo => console.log(`Bot @${botInfo.username} is running → server ${serverUrl}`),
});
