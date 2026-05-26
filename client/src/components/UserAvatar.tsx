import { useEffect, useState } from 'react';
import type { Team } from '../types';
import { getInitials, userAvatarUrl } from '../utils';

type Variant = 'leader' | 'friend' | 'profile';

const LEGACY_CLASS: Record<Variant, string> = {
  leader: 'leader-avatar',
  friend: 'friend-avatar',
  profile: 'profile-avatar-lg',
};

interface Props {
  userId?: number;
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
  userId,
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
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [useLegacyUrl, setUseLegacyUrl] = useState(false);

  const proxySrc = userId != null && userId > 0 ? userAvatarUrl(userId) : null;
  const imageSrc = useLegacyUrl ? photoUrl : proxySrc ?? photoUrl ?? null;

  useEffect(() => {
    setPhotoFailed(false);
    setPhotoLoaded(false);
    setUseLegacyUrl(false);
  }, [userId, photoUrl]);

  const showPhoto = !!imageSrc && !photoFailed;
  const eager = variant === 'profile';

  const rootClass = [
    'user-avatar',
    `user-avatar--${variant}`,
    LEGACY_CLASS[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const flagLabel = favoriteTeam ? `Сборная: ${favoriteTeam.name}` : undefined;

  const handleImageError = () => {
    if (!useLegacyUrl && photoUrl && proxySrc && imageSrc === proxySrc) {
      setUseLegacyUrl(true);
      setPhotoLoaded(false);
      return;
    }
    setPhotoFailed(true);
  };

  const content = (
    <>
      <div className="user-avatar-photo" aria-hidden="true">
        {showPhoto ? (
          <img
            key={imageSrc}
            src={imageSrc}
            alt=""
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={eager ? 'high' : 'auto'}
            className={photoLoaded ? 'is-loaded' : ''}
            onLoad={() => setPhotoLoaded(true)}
            onError={handleImageError}
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
