import { sendEveningReminders, sendDailyDigests } from './notifications.js';
import { isFootballApiConfigured } from './football-api.js';
import { syncPendingMatchesFromApi } from './football-sync.js';

const FOOTBALL_SYNC_INTERVAL_MS = 10 * 60_000;
const DIGEST_HOUR_MSK = 10;
const EVENING_REMINDER_HOUR_MSK = 18;

let lastDigestDate = '';
let lastEveningReminderDate = '';

export function startCronJobs() {
  if (process.env.DISABLE_CRON === 'true') {
    console.log('Cron jobs disabled (DISABLE_CRON=true)');
    return;
  }

  setInterval(async () => {
    try {
      const nowMsk = new Date().toLocaleString('en-US', {
        timeZone: 'Europe/Moscow',
        hour: 'numeric',
        hour12: false,
      });
      const hour = parseInt(nowMsk, 10);
      const todayKey = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Moscow' });

      if (hour === DIGEST_HOUR_MSK && lastDigestDate !== todayKey) {
        lastDigestDate = todayKey;
        const n = await sendDailyDigests();
        console.log(`[cron] Daily digests sent: ${n}`);
      }

      if (hour === EVENING_REMINDER_HOUR_MSK && lastEveningReminderDate !== todayKey) {
        lastEveningReminderDate = todayKey;
        const n = await sendEveningReminders();
        console.log(`[cron] Evening reminders sent: ${n}`);
      }
    } catch (e) {
      console.error('[cron] Notification error:', e);
    }
  }, 60_000);

  if (process.env.FOOTBALL_SYNC_ENABLED === 'true' && isFootballApiConfigured()) {
    setInterval(async () => {
      try {
        const result = await syncPendingMatchesFromApi();
        if (result.updated > 0) {
          console.log(`[cron] Football sync: ${result.updated}/${result.processed} matches updated`);
        }
      } catch (e) {
        console.error('[cron] Football sync error:', e);
      }
    }, FOOTBALL_SYNC_INTERVAL_MS);
    console.log('Football API sync enabled (every 10m)');
  }

  console.log('Cron jobs started (digest 10:00 MSK, evening reminder 18:00 MSK)');
}
