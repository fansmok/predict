import { IconTrophy } from './Icons';

interface Props {
  onClick: () => void;
  /** Крупнее и ярче — акцент на создании */
  featured?: boolean;
  disabled?: boolean;
  ownedCount?: number;
  maxOwned?: number;
}

export function CreateLeaguePromo({
  onClick,
  featured = false,
  disabled = false,
  ownedCount = 0,
  maxOwned = 5,
}: Props) {
  if (disabled) {
    return (
      <div className="create-league-promo create-league-promo--disabled" role="status">
        <div className="create-league-promo-body">
          <strong>Лимит лиг ({ownedCount}/{maxOwned})</strong>
          <span className="create-league-promo-desc">
            Вы создали максимум лиг. Вступайте в чужие по ссылке или используйте уже созданные.
          </span>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`create-league-promo ${featured ? 'featured' : ''}`}
      onClick={onClick}
    >
      <div className="create-league-promo-shine" aria-hidden="true" />
      <div className="create-league-promo-icon" aria-hidden="true">
        <IconTrophy size={20} />
      </div>
      <div className="create-league-promo-body">
        <div className="create-league-promo-head">
          <strong>Создать свою лигу прогнозов</strong>
          <span className="create-league-promo-badge">Бесплатно</span>
        </div>
        <span className="create-league-promo-desc">
          Приватный рейтинг для друзей · приглашение по ссылке
        </span>
      </div>
      <div className="create-league-promo-cta" aria-hidden="true">
        <span className="create-league-promo-cta-label">Создать</span>
        <span className="create-league-promo-cta-arrow">→</span>
      </div>
    </button>
  );
}
