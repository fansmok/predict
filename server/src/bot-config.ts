function envBotUsername(): string {
  return (process.env.BOT_USERNAME ?? '').replace(/^@/, '').trim();
}

let resolvedUsername = '';

export function getBotUsername(): string {
  return resolvedUsername || envBotUsername() || 'your_bot';
}

export function getWebAppShortName(): string {
  const explicit = (process.env.WEBAPP_SHORT_NAME ?? '').trim();
  if (explicit) return explicit;
  if (getBotUsername() === 'predictliga_bot') return 'predictliga';
  return '';
}

/** Подтягивает @username бота из BOT_USERNAME или Telegram getMe. */
export async function initBotUsername(): Promise<string> {
  const fromEnv = envBotUsername();
  if (fromEnv) {
    resolvedUsername = fromEnv;
    return resolvedUsername;
  }

  const botToken = process.env.BOT_TOKEN ?? '';
  if (!botToken || botToken === 'your_telegram_bot_token') {
    return getBotUsername();
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = (await res.json()) as { ok?: boolean; result?: { username?: string } };
    if (data.ok && data.result?.username) {
      resolvedUsername = data.result.username;
      console.log(`Bot username: @${resolvedUsername}`);
    }
  } catch (e) {
    console.warn('[bot-config] Не удалось получить username через getMe:', e);
  }

  if (!resolvedUsername) {
    console.warn(
      '[bot-config] BOT_USERNAME не задан — ссылки-приглашения будут некорректны. ' +
        'Добавьте BOT_USERNAME=predictliga_bot в .env'
    );
  }

  return getBotUsername();
}
