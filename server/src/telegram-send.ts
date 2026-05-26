import { formatMatches, formatPoints, formatPointsWord } from './plural.js';
import { getBotUsername, getWebAppShortName } from './bot-config.js';
import { buildLeagueStartParam } from './invite-links.js';

const BOT_TOKEN = process.env.BOT_TOKEN ?? '';
const WEBAPP_URL = process.env.WEBAPP_URL ?? 'http://localhost:5173';

/** URL мини-приложения с start_param (Telegram читает tgWebAppStartParam). */
export function webAppUrl(startParam?: string): string {
  if (!startParam) return WEBAPP_URL;
  const url = new URL(WEBAPP_URL);
  url.searchParams.set('tgWebAppStartParam', startParam);
  return url.toString();
}

/** Ссылка через /start бота — надёжнее direct startapp (сначала join на сервере, потом кнопка в приложение). */
export function buildBotStartLink(startParam: string): string {
  const bot = getBotUsername();
  return `https://t.me/${bot}?start=${encodeURIComponent(startParam)}`;
}

/** Прямой запуск Mini App (запасной вариант). */
export function buildDirectMiniAppLink(startParam: string): string {
  const bot = getBotUsername();
  const shortName = getWebAppShortName();
  if (shortName) {
    return `https://t.me/${bot}/${shortName}?startapp=${encodeURIComponent(startParam)}`;
  }
  return buildBotStartLink(startParam);
}

/** Публичная ссылка-приглашение (используем /start бота). */
export function buildTelegramMiniAppLink(startParam: string): string {
  return buildBotStartLink(startParam);
}

export function buildAppInviteLink(referrerId: number): string {
  return buildTelegramMiniAppLink(`ref_${referrerId}`);
}

export function buildLeagueInviteLink(code: string, inviterId?: number): string {
  return buildTelegramMiniAppLink(buildLeagueStartParam(code, inviterId));
}

export type TelegramSendResult = { ok: true } | { ok: false; error: string };

function canUseWebAppButton(url: string): boolean {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

function buildOpenAppLink(startParam?: string): string {
  const bot = getBotUsername();
  const shortName = getWebAppShortName();
  if (shortName && startParam) {
    return `https://t.me/${bot}/${shortName}?startapp=${encodeURIComponent(startParam)}`;
  }
  if (shortName) return `https://t.me/${bot}/${shortName}`;
  return `https://t.me/${bot}`;
}

function buildReplyMarkup(
  buttonText: string,
  buttonUrl: string
): { inline_keyboard: Array<Array<{ text: string; web_app?: { url: string }; url?: string }>> } | undefined {
  if (canUseWebAppButton(buttonUrl)) {
    return { inline_keyboard: [[{ text: buttonText, web_app: { url: buttonUrl } }]] };
  }
  return { inline_keyboard: [[{ text: buttonText, url: buildOpenAppLink() }]] };
}

async function callSendMessage(
  chatId: number,
  text: string,
  replyMarkup?: ReturnType<typeof buildReplyMarkup>
): Promise<TelegramSendResult> {
  if (!BOT_TOKEN || BOT_TOKEN === 'your_telegram_bot_token') {
    return { ok: false, error: 'BOT_TOKEN не задан на сервере' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      }),
    });
    const data = (await res.json()) as { ok: boolean; description?: string };
    if (data.ok) return { ok: true };
    const error = data.description ?? `HTTP ${res.status}`;
    console.error(`[telegram] sendMessage ${chatId}: ${error}`);
    return { ok: false, error };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'network error';
    console.error(`[telegram] sendMessage ${chatId}:`, error);
    return { ok: false, error };
  }
}

export async function sendTelegramMessage(
  chatId: number,
  text: string,
  buttonText = '🏆 Открыть Лигу Прогнозов',
  buttonUrl = WEBAPP_URL
): Promise<boolean> {
  const markup = buildReplyMarkup(buttonText, buttonUrl);
  let result = await callSendMessage(chatId, text, markup);

  if (!result.ok && markup?.inline_keyboard[0]?.[0]?.web_app) {
    result = await callSendMessage(chatId, text, {
      inline_keyboard: [[{ text: buttonText, url: buildOpenAppLink() }]],
    });
  }

  if (!result.ok && markup) {
    result = await callSendMessage(chatId, text);
  }

  return result.ok;
}

function buildInviteText(inviterName: string): string {
  return (
    `⚽ <b>${escapeHtml(inviterName)}</b> приглашает вас в Лигу Прогнозов — ЧМ-2026!\n\n` +
    `Делайте прогнозы на матчи, собирайте fantasy-команду и соревнуйтесь с друзьями.`
  );
}

export async function sendBotInviteMessage(inviteeId: number, inviterId: number, inviterName: string): Promise<boolean> {
  return sendTelegramMessage(inviteeId, buildInviteText(inviterName), '🏆 Принять приглашение', webAppUrl(`ref_${inviterId}`));
}

export async function sendLeagueInviteMessage(
  inviteeId: number,
  inviterName: string,
  _leagueName: string,
  code: string,
  inviterId: number
): Promise<boolean> {
  return sendTelegramMessage(
    inviteeId,
    buildInviteText(inviterName),
    'Вступить в лигу',
    webAppUrl(buildLeagueStartParam(code, inviterId))
  );
}

export interface EveningReminderLine {
  kickoffTime: string;
  matchLabel: string;
  daySuffix: string;
}

export async function sendEveningReminderMessage(
  userId: number,
  lines: EveningReminderLine[]
): Promise<boolean> {
  const list = lines
    .map(l => `${escapeHtml(l.kickoffTime)} · ${escapeHtml(l.matchLabel)}${escapeHtml(l.daySuffix)}`)
    .join('\n');

  const text =
    `📋 <b>Не забудьте прогнозы</b>\n\n` +
    `${formatMatches(lines.length)} без прогноза:\n\n` +
    `${list}\n\n` +
    `Сделайте прогнозы до стартового свистка!`;

  return sendTelegramMessage(userId, text, '📝 Сделать прогноз');
}

export interface DigestMatchLine {
  matchLabel: string;
  score: string;
  predHome: number;
  predAway: number;
  points: number;
}

export async function sendAnnouncementMessage(userId: number, text: string): Promise<boolean> {
  const body = `📢 <b>Объявление</b>\n\n${escapeHtml(text)}`;
  return sendTelegramMessage(userId, body, '🏆 Открыть приложение');
}

export async function sendDailyDigestMessage(
  userId: number,
  periodStartLabel: string,
  periodEndLabel: string,
  matches: DigestMatchLine[],
  dayPoints: number,
  totalPoints: number,
  rank: number
): Promise<boolean> {
  const matchBlocks = matches
    .map(m => {
      const ptsSign = m.points > 0 ? `+${m.points}` : `${m.points}`;
      return (
        `${escapeHtml(m.matchLabel)}\n` +
        `Счёт: ${escapeHtml(m.score)} · Ваш прогноз ${m.predHome}:${m.predAway} · ` +
        `<b>${ptsSign} ${formatPointsWord(m.points)}</b>`
      );
    })
    .join('\n\n');

  const daySign = dayPoints > 0 ? `+${dayPoints}` : `${dayPoints}`;

  const text =
    `☀️ <b>Итоги за сутки</b>\n` +
    `${escapeHtml(periodStartLabel)} — ${escapeHtml(periodEndLabel)} (МСК)\n\n` +
    `${matchBlocks}\n\n` +
    `📊 За сутки: <b>${daySign} ${formatPointsWord(dayPoints)}</b> · ` +
    `Всего: <b>${formatPoints(totalPoints)}</b> · Место: <b>#${rank}</b>`;

  return sendTelegramMessage(userId, text, '🏆 Открыть приложение');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
