import { PlatinumProgress } from '../types';
import { remainingFriendsWithPredictionPhrase, pendingFriendsPredictionPhrase } from '../utils';

interface Props {
  progress: PlatinumProgress;
}

export function FriendsPlatinumBar({ progress }: Props) {
  const steps = Array.from({ length: progress.required }, (_, i) => i < progress.current);

  if (progress.isPlatinum) {
    return (
      <div className="platinum-promo unlocked">
        <div className="platinum-promo-shine" aria-hidden="true" />
        <div className="platinum-promo-icon" aria-hidden="true">◆</div>
        <div className="platinum-promo-body">
          <div className="platinum-promo-head">
            <strong>Платина активна</strong>
            <span className="platinum-promo-badge">◆ VIP</span>
          </div>
          <span className="platinum-promo-desc">
            Ваш ник выделен платиновым цветом во всех рейтингах
          </span>
          <div className="platinum-promo-steps complete" aria-hidden="true">
            {steps.map((filled, i) => (
              <span key={i} className={`platinum-promo-step ${filled ? 'filled' : ''}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const pct = Math.round((progress.current / progress.required) * 100);

  return (
    <div className="platinum-promo">
      <div className="platinum-promo-shine" aria-hidden="true" />
      <div className="platinum-promo-icon" aria-hidden="true">◆</div>
      <div className="platinum-promo-body">
        <div className="platinum-promo-head">
          <div className="platinum-promo-title-wrap">
            <span className="platinum-promo-eyebrow">Пригласи 5 друзей с прогнозом</span>
            <strong className="platinum-promo-title">Получи ПЛАТИНУ</strong>
          </div>
          <div className="platinum-promo-counter" aria-label={`${progress.current} из ${progress.required}`}>
            <span className="platinum-promo-counter-current">{progress.current}</span>
            <span className="platinum-promo-counter-sep">/</span>
            <span className="platinum-promo-counter-total">{progress.required}</span>
          </div>
        </div>

        <span className="platinum-promo-desc">
          Считаются друзья по ссылке, которые сделали хотя бы один прогноз на матч
        </span>

        <div
          className="platinum-promo-steps"
          role="progressbar"
          aria-valuenow={progress.current}
          aria-valuemin={0}
          aria-valuemax={progress.required}
        >
          {steps.map((filled, i) => (
            <span key={i} className={`platinum-promo-step ${filled ? 'filled' : ''}`} />
          ))}
        </div>

        <div className="platinum-promo-track">
          <div className="platinum-promo-track-fill" style={{ width: `${pct}%` }} />
        </div>

        <div className="platinum-promo-footer">
          <span className="platinum-promo-remaining">{remainingFriendsWithPredictionPhrase(progress.remaining)}</span>
          {progress.pending != null && progress.pending > 0 && (
            <span className="platinum-promo-pending">{pendingFriendsPredictionPhrase(progress.pending)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
