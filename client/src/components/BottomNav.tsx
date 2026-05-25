import { Tab } from '../types';
import { remainingPredictionsPhrase } from '../utils';
import { IconBall, IconSquad, IconTarget, IconTrophy, IconUser, IconFriends } from './Icons';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
  pendingPredictions?: number;
}

const tabs: { id: Tab; Icon: typeof IconBall; label: string; compact?: boolean; badge?: boolean }[] = [
  { id: 'matches', Icon: IconBall, label: 'МАТЧ\nЦЕНТР', compact: true },
  { id: 'squad', Icon: IconSquad, label: 'Команда' },
  { id: 'predictions', Icon: IconTarget, label: 'Прогнозы', badge: true },
  { id: 'friends', Icon: IconFriends, label: 'Друзья' },
  { id: 'leaderboard', Icon: IconTrophy, label: 'Рейтинг' },
  { id: 'profile', Icon: IconUser, label: 'Профиль' },
];

export function BottomNav({ active, onChange, pendingPredictions = 0 }: Props) {
  return (
    <nav className="bottom-nav" aria-label="Основная навигация">
      {tabs.map(({ id, Icon, label, compact, badge }) => {
        const showBadge = badge && pendingPredictions > 0;
        const badgeLabel = showBadge
          ? `${label.replace('\n', ' ')}: ${remainingPredictionsPhrase(pendingPredictions)}`
          : label.replace('\n', ' ');
        return (
        <button
          key={id}
          type="button"
          className={`nav-item ${active === id ? 'active' : ''} ${compact ? 'compact' : ''} ${showBadge ? 'has-reminder' : ''}`}
          aria-label={badgeLabel}
          aria-current={active === id ? 'page' : undefined}
          onClick={() => {
            window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
            onChange(id);
          }}
        >
          <span className="icon" aria-hidden="true">
            <Icon size={22} />
            {showBadge && (
              <span className="nav-badge">
                {pendingPredictions > 99 ? '99+' : pendingPredictions}
              </span>
            )}
          </span>
          <span className="label">{label.split('\n').map((line, i) => (
            <span key={i}>{line}{i < label.split('\n').length - 1 && <br />}</span>
          ))}</span>
        </button>
        );
      })}
    </nav>
  );
}
