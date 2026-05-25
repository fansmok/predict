const BOT_TOKEN = process.env.BOT_TOKEN ?? '';
const ENV_USERNAME = (process.env.BOT_USERNAME ?? '').replace(/^@/, '');

let resolvedUsername = ENV_USERNAME;

export function getBotUsername(): string {
  return resolvedUsername || 'your_bot';
}

/** Подтягивает @username бота из BOT_USERNAME или Telegram getMe. */
export async function initBotUsername(): Promise<string> {
  if (ENV_USERNAME) {
    resolvedUsername = ENV_USERNAME;
    return resolvedUsername;
  }

  if (!BOT_TOKEN || BOT_TOKEN === 'your_telegram_bot_token') {
    return getBotUsername();
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
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
