import { useState, useEffect, useCallback, useMemo } from 'react';
import { FriendsData, FriendUser } from '../types';
import { api } from '../api';
import { displayName, shareTelegramLink, formatPointsWord, ruPlural, pointsToneClass } from '../utils';
import { UserAvatar } from '../components/UserAvatar';
import { IconFriends, IconLink, IconCheck } from '../components/Icons';
import { CreateLeaguePromo } from '../components/CreateLeaguePromo';
import { FriendsPlatinumBar } from '../components/FriendsPlatinumBar';
import { PlatinumName } from '../components/PlatinumName';

interface Props {
  myId: number;
  onGoToLeaderboard: () => void;
  onViewUser: (userId: number) => void;
}

function joinStatusLabel(status?: FriendUser['status']): string {
  switch (status) {
    case 'referral':
      return 'Вступил по ссылке';
    case 'friend':
      return 'Принял приглашение';
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

export function FriendsPage({ myId, onGoToLeaderboard, onViewUser }: Props) {
  const [data, setData] = useState<FriendsData | null>(null);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<FriendUser[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.getFriends();
      setData(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (search.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.searchFriends(search);
        const existing = new Set([
          ...(data?.friends.map(f => f.id) ?? []),
          ...(data?.pending.map(f => f.id) ?? []),
          myId,
        ]);
        setResults(res.users.filter(u => !existing.has(u.id)));
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, data, myId]);

  const joined = data?.friends ?? [];
  const pending = data?.pending ?? [];

  const stats = useMemo(() => {
    const totalPoints = joined.reduce((sum, f) => sum + (f.totalPoints ?? 0), 0);
    const byLink = joined.filter(f => f.status === 'referral').length;
    const byInvite = joined.filter(f => f.status === 'friend').length;
    return { totalPoints, byLink, byInvite };
  }, [joined]);

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleInviteSelected = async () => {
    if (selected.size === 0) return;
    setInviting(true);
    setMessage('');
    try {
      const result = await api.inviteFriends([...selected]);
      setMessage(
        result.sent > 0
          ? `Приглашения отправлены: ${result.sent}${result.failed ? ` · не доставлено: ${result.failed}` : ''}`
          : 'Не удалось отправить — пользователи должны сначала запустить бота'
      );
      setSelected(new Set());
      setSearch('');
      setResults([]);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setInviting(false);
    }
  };

  const handleShareLink = () => {
    if (!data?.inviteLink) return;
    shareTelegramLink(
      data.inviteLink,
      'Присоединяйся к Лиге Прогнозов — ЧМ-2026!'
    );
  };

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
          {(stats.byLink > 0 || stats.byInvite > 0) && (
            <>
              <div className="friends-stat-divider" />
              <div className="friends-stat friends-stat-meta">
                {stats.byLink > 0 && <span>{stats.byLink} по ссылке</span>}
                {stats.byLink > 0 && stats.byInvite > 0 && <span> · </span>}
                {stats.byInvite > 0 && <span>{stats.byInvite} по приглашению</span>}
              </div>
            </>
          )}
        </div>
      )}

      <CreateLeaguePromo featured onClick={onGoToLeaderboard} />

      <FriendsPlatinumBar progress={platinumProgress} />

      <div className="friends-actions">
        <button type="button" className="friends-share-btn" onClick={handleShareLink}>
          <IconLink size={18} />
          Поделиться ссылкой
        </button>
      </div>

      <div className="friends-search-block">
        <label htmlFor="friends-search-input" className="sr-only">
          Поиск пользователей по имени или username
        </label>
        <input
          id="friends-search-input"
          type="search"
          className="friends-search"
          placeholder="Найти по @username или имени..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoComplete="off"
        />
        {searching && <span className="friends-search-hint">Поиск...</span>}
      </div>

      {results.length > 0 && (
        <section className="friends-section">
          <h3>Найденные пользователи</h3>
          <div className="friends-list">
            {results.map(user => (
              <FriendRow
                key={user.id}
                user={user}
                selectable
                selected={selected.has(user.id)}
                onToggle={() => toggleSelect(user.id)}
                onViewUser={onViewUser}
              />
            ))}
          </div>
        </section>
      )}

      {selected.size > 0 && (
        <div className="friends-invite-bar">
          <button
            type="button"
            className="friends-invite-btn"
            onClick={handleInviteSelected}
            disabled={inviting}
          >
            {inviting ? 'Отправка...' : `Пригласить (${selected.size})`}
          </button>
        </div>
      )}

      {message && <div className="friends-message">{message}</div>}

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

      {joined.length === 0 && pending.length === 0 && !search && (
        <div className="empty-state compact">
          <div className="icon"><IconFriends size={40} /></div>
          <h3>Пока никого нет</h3>
          <p>Найдите друзей по username или поделитесь ссылкой-приглашением. Когда они вступят — здесь появятся их очки.</p>
        </div>
      )}
    </div>
  );
}

function FriendRow({
  user,
  selectable,
  selected,
  onToggle,
  showPoints,
  showJoinInfo,
  onViewUser,
}: {
  user: FriendUser;
  selectable?: boolean;
  selected?: boolean;
  onToggle?: () => void;
  showPoints?: boolean;
  showJoinInfo?: boolean;
  onViewUser?: (userId: number) => void;
}) {
  const joinedLabel = showJoinInfo ? joinStatusLabel(user.status) : '';
  const joinedWhen = showJoinInfo ? formatJoinedAt(user.joinedAt) : null;

  const name = displayName(user.firstName, user.lastName);

  const content = (
    <>
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
      {selectable && (
        <span className={`friend-check ${selected ? 'on' : ''}`}>
          {selected && <IconCheck size={14} />}
        </span>
      )}
    </>
  );

  if (selectable) {
    return (
      <button
        type="button"
        className={`friend-row ${selected ? 'selected' : ''}`}
        onClick={onToggle}
        aria-pressed={selected}
        aria-label={`${name}${selected ? ', выбран' : ', не выбран'}`}
      >
        {content}
      </button>
    );
  }

  return (
    <button type="button" className="friend-row" onClick={() => onViewUser?.(user.id)}>
      {content}
    </button>
  );
}
