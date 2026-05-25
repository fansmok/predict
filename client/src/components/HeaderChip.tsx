import { useEffect, useState } from 'react';
import { UserStats } from '../types';
import { getWcCountdown, padCountdown, formatPointsWord, pointsToneClass } from '../utils';

interface Props {
  stats: UserStats | null;
}

export function HeaderChip({ stats }: Props) {
  const [countdown, setCountdown] = useState(getWcCountdown);

  useEffect(() => {
    const tick = () => setCountdown(getWcCountdown());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!countdown && !stats) return null;

  const time = countdown
    ? `${padCountdown(countdown.hours)}:${padCountdown(countdown.minutes)}:${padCountdown(countdown.seconds)}`
    : '';

  return (
    <div className="header-chip">
      {countdown && (
        <span className="header-chip-countdown" aria-live="polite">
          <span className="header-chip-label">до ЧМ</span>
          {countdown.days > 0 && (
            <span className="header-chip-days">{countdown.days}д</span>
          )}
          <span className="header-chip-time">{time}</span>
        </span>
      )}
      {countdown && stats && <span className="header-chip-divider" aria-hidden="true" />}
      {stats && (
        <span className="header-chip-stats">
          <span className={`header-chip-points ${pointsToneClass(stats.totalPoints)}`}>
            {stats.totalPoints}
          </span>
          <span className="header-chip-label">{formatPointsWord(stats.totalPoints)}</span>
          <span className="header-chip-rank">#{stats.rank}</span>
        </span>
      )}
    </div>
  );
}
