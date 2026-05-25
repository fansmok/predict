import { useState, useEffect, useCallback, useMemo } from 'react';
import { FriendsData, FriendUser } from '../types';
import { api } from '../api';
import { displayName, formatPointsWord, ruPlural, pointsToneClass } from '../utils';
import { InviteLinkActions } from '../components/InviteLinkActions';
import { UserAvatar } from '../components/UserAvatar';
import { IconFriends } from '../components/Icons';
import { CreateLeaguePromo } from '../components/CreateLeaguePromo';
import { FriendsPlatinumBar } from '../components/FriendsPlatinumBar';
import { PlatinumName } from '../components/PlatinumName';

interface Props {
  myId: number;
  isActive?: boolean;
  onGoToLeaderboard: () => void;
  onViewUser: (userId: number) => void;
}

function joinStatusLabel(status?: FriendUser['status']): string {
  switch (status) {
    case 'referral':
      return 'Вступил по ссылке';
    case 'friend':
      return 'Принял приглашение';
    case 'league':
      return 'Вступил в лигу';
    case 'invited':
      return 'Приглашение отправлено';
    default:
      return '';
  }
}

function formatJoinedAt(iso?: string): string | null {
  if (!iso) return null;
  const date = new Date(iso.includes('T') ? iso : `${iso.replace(' ', 'T')}Z`);
  if (Number.isNaN(date.getTime())) return null;

  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'сегодня';
  if (diffDays === 1) return 'вчера';
  if (diffDays < 7) return `${diffDays} дн. назад`;
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export function FriendsPage({ isActive = true, onGoToLeaderboard, onViewUser }: Props) {
  const [data, setData] = useState<FriendsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.getFriends();
      setData(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;
    load();
  }, [isActive, load]);

  useEffect(() => {
    if (!isActive) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [isActive, load]);

  const joined = data?.friends ?? [];
  const pending = data?.pending ?? [];

  const stats = useMemo(() => {
    const totalPoints = joined.reduce((sum, f) => sum + (f.totalPoints ?? 0), 0);
    return { totalPoints };
  }, [joined]);

  const platinumProgress = useMemo(
    () =>
      data?.platinum ?? {
        current: 0,
        required: 5,
        isPlatinum: false,
        remaining: 5,
        pending: 0,
      },
    [data?.platinum]
  );

  if (loading) {
    return (
      <div className="loading-inline" role="status" aria-live="polite">
        <div className="spinner small" aria-hidden="true" />
        <span className="sr-only">Загрузка друзей</span>
      </div>
    );
  }

  return (
    <div className="friends-page page-stack">
      <div className="friends-hero">
        <div className="friends-hero-icon">
          <IconFriends size={28} />
        </div>
        <div>
          <h2>Друзья</h2>
          <p>Приглашайте друзей и соревнуйтесь в прогнозах</p>
        </div>
      </div>

      {joined.length > 0 && (
        <div className="friends-stats">
          <div className="friends-stat">
            <span className="friends-stat-value">{joined.length}</span>
            <span className="friends-stat-label">
              {ruPlural(joined.length, 'друг вступил', 'друга вступило', 'друзей вступило')}
            </span>
          </div>
          <div className="friends-stat-divider" />
          <div className="friends-stat">
            <span className={`friends-stat-value ${pointsToneClass(stats.totalPoints)}`}>
              {stats.totalPoints}
            </span>
            <span className="friends-stat-label">ОЧКИ у друзей</span>
          </div>
        </div>
      )}

      <CreateLeaguePromo featured onClick={onGoToLeaderboard} />

      <FriendsPlatinumBar progress={platinumProgress} />

      <div className="friends-actions">
        {data?.inviteLink && (
          <InviteLinkActions
            link={data.inviteLink}
            shareText="Присоединяйся к Лиге Прогнозов — ЧМ-2026!"
            shareLabel="Поделиться"
          />
        )}
      </div>

      {joined.length > 0 && (
        <section className="friends-section">
          <h3>Вступили · {joined.length}</h3>
          <div className="friends-list">
            {joined.map(user => (
              <FriendRow key={user.id} user={user} showPoints showJoinInfo onViewUser={onViewUser} />
            ))}
          </div>
        </section>
      )}

      {pending.length > 0 && (
        <section className="friends-section">
          <h3>Ожидают ответ · {pending.length}</h3>
          <div className="friends-list">
            {pending.map(user => (
              <FriendRow key={user.id} user={user} showJoinInfo onViewUser={onViewUser} />
            ))}
          </div>
        </section>
      )}

      {joined.length === 0 && pending.length === 0 && (
        <div className="empty-state compact">
          <div className="icon"><IconFriends size={40} /></div>
          <h3>Пока никого нет</h3>
          <p>Поделитесь ссылкой-приглашением или пригласите друзей в лигу. Когда они вступят — здесь появятся их очки.</p>
        </div>
      )}
    </div>
  );
}

function FriendRow({
  user,
  showPoints,
  showJoinInfo,
  onViewUser,
}: {
  user: FriendUser;
  showPoints?: boolean;
  showJoinInfo?: boolean;
  onViewUser?: (userId: number) => void;
}) {
  const joinedLabel = showJoinInfo ? joinStatusLabel(user.status) : '';
  const joinedWhen = showJoinInfo ? formatJoinedAt(user.joinedAt) : null;

  const name = displayName(user.firstName, user.lastName);

  return (
    <button type="button" className="friend-row" onClick={() => onViewUser?.(user.id)}>
      <button
        type="button"
        className="friend-avatar-btn"
        onClick={e => {
          e.stopPropagation();
          onViewUser?.(user.id);
        }}
        aria-label={`Профиль: ${name}`}
      >
        <UserAvatar
          firstName={user.firstName}
          lastName={user.lastName}
          photoUrl={user.photoUrl}
          favoriteTeam={user.favoriteTeam}
          variant="friend"
        />
      </button>
      <div className="friend-info">
        <PlatinumName platinum={user.isPlatinum} className="friend-name">
          {name}
        </PlatinumName>
        {joinedLabel ? (
          <span className="friend-meta">
            {joinedLabel}
            {joinedWhen && user.status !== 'invited' ? ` · ${joinedWhen}` : ''}
          </span>
        ) : null}
      </div>
      {showPoints && (
        <div className="friend-points">
          <span className={`friend-points-value ${pointsToneClass(user.totalPoints ?? 0)}`}>
            {user.totalPoints ?? 0}
          </span>
          <span className={`friend-points-label ${pointsToneClass(user.totalPoints ?? 0)}`}>
            {formatPointsWord(user.totalPoints ?? 0)}
          </span>
        </div>
      )}
      {!showPoints && user.status === 'invited' && (
        <span className="friend-badge pending">ожидает</span>
      )}
    </button>
  );
}
