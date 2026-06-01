import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Bot, InlineKeyboard } from 'grammy';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const token = process.env.BOT_TOKEN;
const apiSecret = process.env.BOT_API_SECRET;
const webAppUrlEnv = process.env.WEBAPP_URL ?? 'http://localhost:5173';
const serverUrl = process.env.SERVER_URL ?? 'http://127.0.0.1:3001';
const isProduction = process.env.NODE_ENV === 'production';

if (!token || token === 'your_telegram_bot_token') {
  console.log('⚠️  BOT_TOKEN не задан. Бот не запущен.');
  console.log('   Создайте бота через @BotFather и добавьте токен в .env');
  process.exit(0);
}

if (!apiSecret || apiSecret === 'your_bot_api_secret') {
  console.log('⚠️  BOT_API_SECRET не задан. Бот не запущен.');
  console.log('   Сгенерируйте: openssl rand -hex 32');
  console.log('   Добавьте в .env → BOT_API_SECRET=...');
  process.exit(0);
}

if (isProduction && apiSecret.length < 32) {
  console.error('[security] FATAL: BOT_API_SECRET должен быть мин. 32 символа в production');
  process.exit(1);
}

if (isProduction && apiSecret === token) {
  console.error('[security] FATAL: BOT_API_SECRET не должен совпадать с BOT_TOKEN');
  process.exit(1);
}

if (isProduction && !serverUrl.startsWith('https://') && !serverUrl.startsWith('http://127.0.0.1')) {
  console.warn('[security] Рекомендуется SERVER_URL=http://127.0.0.1:3001 для bot→server на том же хосте');
}

const bot = new Bot(token);

async function apiCall<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${serverUrl}/api/bot${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiSecret}`,
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

function loadAdminIds(): Set<number> {
  const ids = new Set<number>();
  for (const part of (process.env.ADMIN_USER_IDS ?? '').split(/[,;\s]+/)) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const id = Number(trimmed);
    if (Number.isSafeInteger(id) && id > 0) ids.add(id);
  }
  return ids;
}

const adminIds = loadAdminIds();

function isAdmin(userId: number): boolean {
  return adminIds.has(userId);
}

const pendingAnnounces = new Map<string, { adminId: number; text: string }>();

function stashAnnounce(adminId: number, text: string): string {
  const id = crypto.randomBytes(6).toString('hex');
  pendingAnnounces.set(id, { adminId, text });
  setTimeout(() => pendingAnnounces.delete(id), 10 * 60_000);
  return id;
}

function escapeMarkdown(text: string): string {
  return text.replace(/([_*\[`])/g, '\\$1');
}

function buildLeagueInviteReply(inviterName: string, leagueName: string): string {
  return (
    `🏆 *Приватная лига*\n\n` +
    `*${escapeMarkdown(inviterName)}* приглашает вас в лигу *«${escapeMarkdown(leagueName)}»*.\n\n` +
    `Рейтинг виден только участникам лиги.\n\n` +
    `Откройте приложение, чтобы вступить.`
  );
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

async function safeReply(
  ctx: { reply: (text: string, opts?: object) => Promise<unknown> },
  text: string,
  opts?: object
) {
  try {
    await ctx.reply(text, opts);
  } catch (e) {
    console.error('[reply] Markdown failed, plain text:', e);
    const plain = text.replace(/\\([_*\[`])/g, '$1').replace(/\*/g, '');
    await ctx.reply(plain, { reply_markup: (opts as { reply_markup?: unknown })?.reply_markup });
  }
}

bot.command('start', async ctx => {
  const payload = ctx.match?.trim() ?? '';
  const from = ctx.from!;

  try {
    await registerUser(from, payload || undefined);

    if (payload.startsWith('ref_')) {
      await safeReply(
        ctx,
        `⚽ *Лига Прогнозов — ЧМ-2026*\n\n` +
          `Вас пригласили в игру! Делайте прогнозы, собирайте fantasy-команду и соревнуйтесь с друзьями.\n\n` +
          `Нажмите кнопку ниже, чтобы начать!`,
        { parse_mode: 'Markdown', reply_markup: appKeyboard(payload) }
      );
      return;
    }

    if (payload.startsWith('league_')) {
      const preview = await apiCall<{ leagueName: string; inviterName: string }>(
        `/league-invite?startParam=${encodeURIComponent(payload)}`
      );
      const inviteText = preview
        ? buildLeagueInviteReply(preview.inviterName, preview.leagueName)
        : `🏆 *Приватная лига*\n\n` +
          `Вас приглашают в закрытую лигу прогнозистов!\n` +
          `Рейтинг виден только участникам лиги.\n\n` +
          `Откройте приложение, чтобы вступить.`;

      await safeReply(ctx, inviteText, {
        parse_mode: 'Markdown',
        reply_markup: appKeyboard(payload),
      });
      return;
    }

    await safeReply(
      ctx,
      `⚽ *Лига Прогнозов — ЧМ-2026*\n\n` +
        `${escapeMarkdown(from.first_name)}, добро пожаловать!\n\n` +
        `Делайте прогнозы на матчи, собирайте fantasy-команду и соревнуйтесь с друзьями — в общем рейтинге или в своих приватных лигах.\n\n` +
        `Откройте приложение — матчи, рейтинг и ваша команда в одном месте.`,
      { parse_mode: 'Markdown', reply_markup: appKeyboard() }
    );
  } catch (e) {
    console.error('[start] handler failed:', e);
    try {
      await ctx.reply('⚽ Лига Прогнозов — нажмите кнопку ниже, чтобы открыть приложение.', {
        reply_markup: appKeyboard(payload || undefined),
      });
    } catch (e2) {
      console.error('[start] fallback failed:', e2);
    }
  }
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
    return `${m.time} ${escapeMarkdown(m.homeTeam)} — ${escapeMarkdown(m.awayTeam)}${score}${pred}`;
  });

  await ctx.reply(
    `📅 *Матчи сегодня*\n\n${lines.join('\n')}`,
    { parse_mode: 'Markdown', reply_markup: appKeyboard() }
  );
});

bot.command('announce', async ctx => {
  const from = ctx.from!;
  if (!isAdmin(from.id)) {
    await ctx.reply('Эта команда только для администраторов.');
    return;
  }

  const text = (ctx.match ?? '').trim();
  if (!text) {
    await ctx.reply(
      '📢 *Рассылка объявления*\n\n' +
        'Использование:\n' +
        '`/announce Текст сообщения для всех игроков`\n\n' +
        'Сообщение уйдёт всем, кто хотя бы раз запускал бота. Лимит — 4000 символов.',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  if (text.length > 4000) {
    await ctx.reply('Слишком длинный текст (максимум 4000 символов).');
    return;
  }

  const stashId = stashAnnounce(from.id, text);
  await ctx.reply(
    `📢 Превью объявления:\n\n${text}\n\nОтправить всем зарегистрированным пользователям?`,
    {
      reply_markup: new InlineKeyboard()
        .text('✅ Отправить', `announce_ok:${stashId}`)
        .text('❌ Отмена', 'announce_cancel'),
    }
  );
});

bot.callbackQuery(/^announce_ok:(.+)$/, async ctx => {
  const from = ctx.from;
  if (!from || !isAdmin(from.id)) {
    await ctx.answerCallbackQuery({ text: 'Нет доступа' });
    return;
  }

  const pending = pendingAnnounces.get(ctx.match![1]);
  pendingAnnounces.delete(ctx.match![1]);

  if (!pending || pending.adminId !== from.id) {
    await ctx.answerCallbackQuery({ text: 'Сессия истекла, повторите /announce' });
    return;
  }

  const text = pending.text;

  await ctx.answerCallbackQuery({ text: 'Рассылка началась…' });
  await ctx.editMessageText('⏳ Рассылка… Это может занять минуту.');

  const targets = await apiCall<{ userIds: number[] }>(
    `/announce-targets?adminId=${from.id}`
  );

  if (!targets) {
    await ctx.editMessageText('❌ Не удалось получить список пользователей (ошибка сервера).');
    return;
  }

  const body = `📢 Объявление\n\n${text}`;
  let sent = 0;
  let failed = 0;
  let sampleError = '';

  for (let i = 0; i < targets.userIds.length; i++) {
    const userId = targets.userIds[i];
    try {
      await bot.api.sendMessage(userId, body, {
        reply_markup: appKeyboard(),
      });
      sent++;
    } catch (e) {
      failed++;
      if (!sampleError && e && typeof e === 'object' && 'description' in e) {
        sampleError = String((e as { description: string }).description);
      }
    }
    if (i < targets.userIds.length - 1) {
      await new Promise(r => setTimeout(r, 50));
    }
  }

  let report =
    `✅ *Рассылка завершена*\n\n` +
    `Всего в базе: *${targets.userIds.length}*\n` +
    `Доставлено: *${sent}*\n` +
    `Не доставлено: *${failed}*`;

  if (failed > 0) {
    report +=
      `\n\n_Частая причина: человек заходил только через приложение и не нажимал /start в боте._`;
    if (sampleError) {
      report += `\n\nПример ошибки: \`${sampleError.replace(/`/g, "'")}\``;
    }
  }

  await ctx.editMessageText(report, { parse_mode: 'Markdown' });
});

bot.callbackQuery('announce_cancel', async ctx => {
  if (!ctx.from || !isAdmin(ctx.from.id)) {
    await ctx.answerCallbackQuery({ text: 'Нет доступа' });
    return;
  }
  await ctx.answerCallbackQuery({ text: 'Отменено' });
  await ctx.editMessageText('Рассылка отменена.');
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
  const lines = leaders.map(l => `${medals[l.rank - 1] ?? `${l.rank}.`} ${escapeMarkdown(l.name)} — *${l.totalPoints}*`);

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
  try {
    await bot.api.setMyCommands([
      { command: 'start', description: 'Открыть приложение' },
      { command: 'stats', description: 'Мои очки и место' },
      { command: 'today', description: 'Матчи сегодня' },
      { command: 'rank', description: 'Топ-5 игроков' },
      { command: 'help', description: 'Справка и правила' },
    ]);
  } catch (e) {
    console.warn('[startup] setMyCommands пропущен (сеть/Telegram):', e);
  }
}

async function verifyServerLink(): Promise<void> {
  try {
    const res = await fetch(`${serverUrl}/api/config`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      console.warn(`[startup] Server ${serverUrl} returned ${res.status}`);
      return;
    }
    const probe = await apiCall<{ leaders: unknown[] }>('/leaders?limit=1');
    if (probe === null) {
      console.error(
        '[startup] /api/bot недоступен — проверьте BOT_API_SECRET на сервере и в боте (должны совпадать)'
      );
    } else {
      console.log('[startup] Связь с API сервера OK');
    }
  } catch (e) {
    console.error('[startup] Не удалось достучаться до сервера:', serverUrl, e);
  }
}

console.log('🤖 Telegram bot starting...');
bot.start({
  onStart: botInfo => {
    console.log(`Bot @${botInfo.username} is running → server ${serverUrl}`);
    console.log(`WEBAPP_URL=${webAppUrlEnv}`);
    void setCommands();
    void verifyServerLink();
  },
});
