import { pendingMatchesGenitivePhrase } from '../utils';
import { IconTarget } from './Icons';

interface Props {
  count: number;
  onClick: () => void;
}

export function PendingPredictionsBanner({ count, onClick }: Props) {
  if (count <= 0) return null;

  const matchesLabel = pendingMatchesGenitivePhrase(count);

  return (
    <button
      type="button"
      className="pending-predictions-banner"
      onClick={() => {
        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
        onClick();
      }}
      aria-label={`Выберите счёт для ${matchesLabel}. Нажмите, чтобы перейти к матчам`}
    >
      <span className="pending-predictions-glow" aria-hidden="true" />
      <span className="pending-predictions-icon" aria-hidden="true">
        <IconTarget size={22} />
      </span>
      <div className="pending-predictions-text">
        <strong>Выберите счёт для {matchesLabel}</strong>
        <span>Нажмите — откроем матчи, на которые ещё можно ставить</span>
      </div>
      <span className="pending-predictions-action" aria-hidden="true">
        <span className="pending-predictions-count">{count > 99 ? '99+' : count}</span>
        <span className="pending-predictions-arrow">→</span>
      </span>
    </button>
  );
}
