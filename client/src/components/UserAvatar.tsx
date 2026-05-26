import { useEffect, useState } from 'react';
import type { Team } from '../types';
import { getInitials } from '../utils';

type Variant = 'leader' | 'friend' | 'profile';

const LEGACY_CLASS: Record<Variant, string> = {
  leader: 'leader-avatar',
  friend: 'friend-avatar',
  profile: 'profile-avatar-lg',
};

interface Props {
  firstName: string;
  lastName?: string | null;
  photoUrl?: string | null;
  favoriteTeam?: Team | null;
  variant?: Variant;
  className?: string;
  onClick?: () => void;
  title?: string;
}

export function UserAvatar({
  firstName,
  lastName,
  photoUrl,
  favoriteTeam,
  variant = 'leader',
  className = '',
  onClick,
  title,
}: Props) {
  const [photoFailed, setPhotoFailed] = useState(false);

  useEffect(() => {
    setPhotoFailed(false);
  }, [photoUrl]);

  const showPhoto = !!photoUrl && !photoFailed;

  const rootClass = [
    'user-avatar',
    `user-avatar--${variant}`,
    LEGACY_CLASS[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const flagLabel = favoriteTeam ? `Сборная: ${favoriteTeam.name}` : undefined;

  const content = (
    <>
      <div className="user-avatar-photo" aria-hidden="true">
        {showPhoto ? (
          <img
            key={photoUrl}
            src={photoUrl}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setPhotoFailed(true)}
          />
        ) : (
          <span>{getInitials(firstName, lastName)}</span>
        )}
      </div>
      {favoriteTeam?.flag && (
        <img
          src={favoriteTeam.flag}
          alt=""
          className="user-avatar-flag"
          title={flagLabel}
          aria-hidden="true"
        />
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={`${rootClass} user-avatar-btn`}
        onClick={onClick}
        title={title ?? flagLabel}
        aria-label={title ?? (favoriteTeam ? `Болею за ${favoriteTeam.name}` : 'Аватар')}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={rootClass} title={title ?? flagLabel}>
      {content}
    </div>
  );
}
