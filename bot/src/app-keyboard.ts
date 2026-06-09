import type { Api, Context } from 'grammy';
import { InlineKeyboard } from 'grammy';

const BUTTON_TEXT = '🏆 Открыть Лигу Прогнозов';
const MENU_BUTTON_TEXT = '🏆 Открыть';

function botUsername(): string {
  return (process.env.BOT_USERNAME ?? 'predictliga_bot').replace(/^@/, '');
}

function miniAppShortName(): string {
  return process.env.WEBAPP_SHORT_NAME ?? 'predictliga';
}

export function webAppBaseUrl(): string {
  return process.env.WEBAPP_URL ?? 'http://localhost:5173';
}

/** HTTPS URL для inline web_app. */
export function buildDirectWebAppUrl(startParam?: string): string | null {
  const base = webAppBaseUrl();
  if (!base.startsWith('https://')) return null;
  if (!startParam) return base;
  const url = new URL(base);
  url.searchParams.set('tgWebAppStartParam', startParam);
  return url.toString();
}

/** Прямой запуск Mini App через short name (нужен /newapp в BotFather). */
export function buildMiniAppDeepLink(startParam?: string): string {
  const bot = botUsername();
  const shortName = miniAppShortName();
  return startParam
    ? `https://t.me/${bot}/${shortName}?startapp=${encodeURIComponent(startParam)}`
    : `https://t.me/${bot}/${shortName}`;
}

export function isButtonTypeInvalid(e: unknown): boolean {
  if (!e || typeof e !== 'object') return false;
  const desc =
    'description' in e
      ? String((e as { description: unknown }).description)
      : 'message' in e
        ? String((e as { message: unknown }).message)
        : '';
  return desc.includes('BUTTON_TYPE_INVALID');
}

function keyboardWebApp(url: string): InlineKeyboard {
  return new InlineKeyboard().webApp(BUTTON_TEXT, url);
}

function keyboardUrl(link: string): InlineKeyboard {
  return new InlineKeyboard().url(BUTTON_TEXT, link);
}

/**
 * web_app с predictapp.ru открывает Mini App из чата бота.
 * url на t.me/... из того же чата часто ничего не делает — только запасной вариант.
 */
export function appKeyboardCandidates(startParam?: string): InlineKeyboard[] {
  const candidates: InlineKeyboard[] = [];
  const plain = buildDirectWebAppUrl();
  const withParam = startParam ? buildDirectWebAppUrl(startParam) : null;

  if (plain) candidates.push(keyboardWebApp(plain));
  if (withParam && withParam !== plain) candidates.push(keyboardWebApp(withParam));
  candidates.push(keyboardUrl(buildMiniAppDeepLink(startParam)));

  return candidates;
}

type ReplyOpts = Record<string, unknown>;

async function sendWithKeyboardFallback(
  send: (text: string, opts?: ReplyOpts) => Promise<unknown>,
  text: string,
  baseOpts: ReplyOpts | undefined,
  startParam?: string
): Promise<void> {
  const candidates = appKeyboardCandidates(startParam);
  let lastError: unknown;

  for (let i = 0; i < candidates.length; i++) {
    try {
      await send(text, { ...baseOpts, reply_markup: candidates[i] });
      if (i > 0) {
        console.warn(`[keyboard] fallback #${i + 1}, startParam=${startParam ?? '(none)'}`);
      }
      return;
    } catch (e) {
      lastError = e;
      if (!isButtonTypeInvalid(e)) throw e;
    }
  }

  console.error('[keyboard] all button types failed:', lastError);
  const link = buildMiniAppDeepLink(startParam);
  await send(
    `${text}\n\n👉 Откройте приложение кнопкой «${MENU_BUTTON_TEXT}» слева от поля ввода или по ссылке:\n${link}`,
    { ...baseOpts, reply_markup: undefined }
  );
}

export async function replyWithAppKeyboard(
  ctx: Pick<Context, 'reply' | 'chat' | 'api'>,
  text: string,
  opts?: ReplyOpts,
  startParam?: string
): Promise<void> {
  await sendWithKeyboardFallback(
    (t, o) => ctx.reply(t, o),
    text,
    opts,
    startParam
  );
  await ensureChatMenuWebApp(ctx, startParam);
}

export async function sendMessageWithAppKeyboard(
  api: Api,
  chatId: number,
  text: string,
  startParam?: string
): Promise<void> {
  await sendWithKeyboardFallback(
    (t, o) => api.sendMessage(chatId, t, o),
    text,
    undefined,
    startParam
  );
}

/** Кнопка меню слева от поля ввода — работает даже когда inline-кнопка недоступна. */
export async function ensureChatMenuWebApp(
  ctx: Pick<Context, 'chat' | 'api'>,
  startParam?: string
): Promise<void> {
  const url = buildDirectWebAppUrl(startParam) ?? buildDirectWebAppUrl();
  if (!url || !ctx.chat) return;

  try {
    await ctx.api.setChatMenuButton({
      chat_id: ctx.chat.id,
      menu_button: {
        type: 'web_app',
        text: MENU_BUTTON_TEXT,
        web_app: { url },
      },
    });
  } catch (e) {
    console.warn('[menu] setChatMenuButton failed:', e);
  }
}

/** Дефолтная кнопка меню для всех новых чатов. */
export async function setDefaultMenuWebApp(api: Api): Promise<void> {
  const url = buildDirectWebAppUrl();
  if (!url) return;

  try {
    await api.setChatMenuButton({
      menu_button: {
        type: 'web_app',
        text: MENU_BUTTON_TEXT,
        web_app: { url },
      },
    });
    console.log(`[startup] Menu button → ${url}`);
  } catch (e) {
    console.warn('[startup] default setChatMenuButton failed:', e);
  }
}
