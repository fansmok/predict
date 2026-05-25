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

export async function sendTelegramMessage(
  chatId: number,
  text: string,
  buttonText = '🏆 Открыть Лигу Прогнозов',
  buttonUrl = WEBAPP_URL
): Promise<boolean> {
  if (!BOT_TOKEN || BOT_TOKEN === 'your_telegram_bot_token') return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: buttonText, web_app: { url: buttonUrl } }]],
        },
      }),
    });
    const data = await res.json() as { ok: boolean };
    return data.ok;
  } catch {
    return false;
  }
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
