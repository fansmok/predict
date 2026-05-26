import { useEffect, useRef, useState } from 'react';
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

function markLoaded(img: HTMLImageElement | null, setLoaded: (v: boolean) => void): void {
  if (img?.complete && img.naturalWidth > 0) {
    setLoaded(true);
  }
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
  const imgRef = useRef<HTMLImageElement>(null);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [fallbackStep, setFallbackStep] = useState(0);

  const proxySrc = userId != null && userId > 0 ? userAvatarUrl(userId, photoUrl) : null;
  const sources = [proxySrc, photoUrl].filter((s): s is string => !!s);
  const imageSrc = sources[fallbackStep] ?? null;
  const eager = variant === 'profile';
  const fadePhoto = variant !== 'profile';

  useEffect(() => {
    setPhotoFailed(false);
    setPhotoLoaded(false);
    setFallbackStep(0);
  }, [userId, photoUrl]);

  useEffect(() => {
    markLoaded(imgRef.current, setPhotoLoaded);
  }, [imageSrc]);

  const showPhoto = !!imageSrc && !photoFailed;

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
    if (fallbackStep + 1 < sources.length) {
      setFallbackStep(fallbackStep + 1);
      setPhotoLoaded(false);
      return;
    }
    setPhotoFailed(true);
  };

  const imgClass = fadePhoto
    ? photoLoaded
      ? 'is-loaded'
      : ''
    : 'is-loaded';

  const content = (
    <>
      <div className="user-avatar-photo" aria-hidden="true">
        {!showPhoto && <span>{getInitials(firstName, lastName)}</span>}
        {showPhoto && (
          <img
            ref={imgRef}
            key={imageSrc}
            src={imageSrc}
            alt=""
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={eager ? 'high' : 'auto'}
            className={imgClass}
            onLoad={() => setPhotoLoaded(true)}
            onError={handleImageError}
          />
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
