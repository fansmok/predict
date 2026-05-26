import { useState, useEffect, useMemo, useRef, useId, useCallback } from 'react';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { Leader, LeagueSummary, LeaderboardMyRank, UserStats } from '../types';
import {
  displayName,
  formatPredictionStats,
  formatParticipants,
  formatPoints,
  formatPointsWord,
  pointsToneClass,
} from '../utils';
import {
  type PlayersRankKind,
  RANK_KIND_LABELS,
  leaderPointsForKind,
  myPointsForKind,
  prepareLeadersForRankKind,
} from '../leaderboard-rank';
import { api } from '../api';
import { IconTrophy, IconFriends, IconSquad } from '../components/Icons';
import { InviteLinkActions } from '../components/InviteLinkActions';
import { LeagueEmoji } from '../components/LeagueEmoji';
import { ModalPortal } from '../components/ModalPortal';
import { CreateLeaguePromo } from '../components/CreateLeaguePromo';
import { CreateLeagueModal } from '../components/CreateLeagueModal';
import { PlatinumName } from '../components/PlatinumName';
import { LeaderPointsStrip } from '../components/LeaderPointsStrip';
import { UserAvatar } from '../components/UserAvatar';
import { AdminIdBadge } from '../components/AdminIdBadge';

type LbMode = 'players' | 'leagues' | 'myLeagues';

interface Props {
  globalLeaders: Leader[];
  myId: number;
  myRank: number;
  myPoints: number;
  stats: UserStats;
  leagues: LeagueSummary[];
  canCreateLeague: boolean;
  ownedLeagueCount: number;
  maxOwnedLeagues: number;
  onLeaguesChange: () => Promise<void>;
  leagueToOpenId?: number | null;
  onLeagueOpened?: () => void;
  /** Увеличивается при повторном нажатии «Рейтинг» в нижнем меню — выход на главный экран. */
  leaderboardResetKey?: number;
  isActive?: boolean;
  refreshKey?: number;
  onViewUser: (userId: number) => void;
  isAdmin?: boolean;
}

function rankEmoji(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return String(rank);
}

function normalizeLeader(leader: Leader): Leader {
  return {
    ...leader,
    matchPoints: leader.matchPoints ?? 0,
    tournamentPoints: leader.tournamentPoints ?? 0,
    squadPoints: leader.squadPoints ?? 0,
    outcomeHits: leader.outcomeHits ?? 0,
    differenceHits: leader.differenceHits ?? 0,
  };
}

function LeaderList({
  leaders,
  myId,
  maxPoints,
  rankKind,
  onViewUser,
  leagueOwnerId,
  onRequestRemove,
  isAdmin,
}: {
  leaders: Leader[];
  myId: number;
  maxPoints: number;
  rankKind: PlayersRankKind;
  onViewUser: (userId: number) => void;
  leagueOwnerId?: number;
  onRequestRemove?: (leader: Leader) => void;
  isAdmin?: boolean;
}) {
  const list = [...leaders].sort((a, b) => a.rank - b.rank);

  if (list.length === 0) {
    return (
      <div className="empty-state compact">
        <p>Нет участников с очками</p>
      </div>
    );
  }

  return (
    <div className="lb-table">
      <div className="lb-table-head">
        <span>#</span>
        <span>Игрок</span>
        <span>Очки</span>
      </div>
      <div className="lb-list">
        {list.map(leader => {
          const pts = leaderPointsForKind(leader, rankKind);
          const pct = maxPoints > 0 ? (pts / maxPoints) * 100 : 0;
          const isMe = leader.id === myId;
          const topClass = leader.rank === 1 ? 'top1' : leader.rank === 2 ? 'top2' : leader.rank === 3 ? 'top3' : '';
          const canRemove =
            onRequestRemove != null &&
            leagueOwnerId != null &&
            leader.id !== leagueOwnerId;

          const cardBody = (
            <>
              <div className={`leader-rank ${leader.rank <= 3 ? `top${leader.rank}` : ''}`}>
                {leader.rank <= 3 ? rankEmoji(leader.rank) : leader.rank}
              </div>
              <UserAvatar
                userId={leader.id}
                firstName={leader.firstName}
                lastName={leader.lastName}
                photoUrl={leader.photoUrl}
                favoriteTeam={leader.favoriteTeam}
                variant="leader"
              />
              <div className="leader-info">
                <div className="leader-name">
                  <PlatinumName platinum={leader.isPlatinum}>
                    {displayName(leader.firstName, leader.lastName)}
                  </PlatinumName>
                  {isMe && <span className="leader-you">вы</span>}
                </div>
                {isAdmin && <AdminIdBadge id={leader.id} label="User" className="admin-id-badge--inline" />}
                {rankKind === 'total' ? (
                  <>
                    <div className="leader-meta">{formatPredictionStats(leader)}</div>
                    <LeaderPointsStrip
                      matchPoints={leader.matchPoints}
                      tournamentPoints={leader.tournamentPoints}
                      squadPoints={leader.squadPoints}
                      compact
                    />
                  </>
                ) : rankKind === 'predictions' ? (
                  <div className="leader-meta">Очки за прогнозы на матчи</div>
                ) : (
                  <div className="leader-meta">Очки fantasy-сборной</div>
                )}
                <div className="leader-progress">
                  <div className="leader-progress-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="leader-points-wrap">
                <div className={`leader-points ${pointsToneClass(pts)}`}>{pts}</div>
                <span className={`leader-points-label ${pointsToneClass(pts)}`}>
                  {formatPointsWord(pts)}
                </span>
              </div>
            </>
          );

          if (canRemove) {
            return (
              <div
                key={leader.id}
                className={`leader-card ${topClass} ${isMe ? 'is-me' : ''} has-remove`}
              >
                <button
                  type="button"
                  className="leader-card-main"
                  onClick={() => {
                    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
                    onViewUser(leader.id);
                  }}
                  aria-label={`Профиль: ${displayName(leader.firstName, leader.lastName)}`}
                >
                  {cardBody}
                </button>
                <button
                  type="button"
                  className="lb-member-remove"
                  aria-label={`Удалить ${displayName(leader.firstName, leader.lastName)} из лиги`}
                  onClick={() => onRequestRemove(leader)}
                >
                  ×
                </button>
              </div>
            );
          }

          return (
            <div
              key={leader.id}
              className={`leader-card ${topClass} ${isMe ? 'is-me' : ''}`}
            >
              <button
                type="button"
                className="leader-card-main"
                onClick={() => {
                  window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
                  onViewUser(leader.id);
                }}
                aria-label={`Профиль: ${displayName(leader.firstName, leader.lastName)}`}
              >
                {cardBody}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RankKindSwitch({
  value,
  onChange,
  compact = false,
}: {
  value: PlayersRankKind;
  onChange: (k: PlayersRankKind) => void;
  compact?: boolean;
}) {
  const items: PlayersRankKind[] = ['total', 'predictions', 'fantasy'];

  return (
    <div
      className={`lb-rank-kind-switch${compact ? ' lb-rank-kind-switch--compact' : ''}`}
      role="tablist"
      aria-label="Тип рейтинга"
    >
      {items.map(key => (
        <button
          key={key}
          type="button"
          role="tab"
          className={`lb-rank-kind-btn${value === key ? ' active' : ''}`}
          aria-selected={value === key}
          onClick={() => onChange(key)}
        >
          <span className="lb-rank-kind-label">{RANK_KIND_LABELS[key]}</span>
        </button>
      ))}
    </div>
  );
}

function leagueAvgLabel(avg: number | null | undefined): string | null {
  if (avg == null) return null;
  const sign = avg < 0 ? '−' : '';
  return `среднее ${sign}${Math.abs(avg)} ${formatPointsWord(Math.abs(avg))}`;
}

const RANK_KIND_DESC: Record<PlayersRankKind, string> = {
  total: 'Сумма очков: прогнозы на матчи, итоги ЧМ и fantasy-сборная.',
  predictions: 'Только очки за прогнозы на матчи.',
  fantasy: 'Только очки за игроков в вашей fantasy-сборной.',
};

function LeagueDrillHero({
  league,
  myLeagueRank,
  isAdmin,
}: {
  league: LeagueSummary;
  myLeagueRank?: number;
  isAdmin?: boolean;
}) {
  return (
    <div className="lb-drill-hero">
      <div className="lb-drill-hero-glow" aria-hidden="true" />
      <div className="lb-drill-hero-inner">
        <div className="lb-drill-hero-top">
          <div className="lb-drill-hero-icon" aria-hidden="true">
            <LeagueEmoji emoji={league.emoji} bgColor={league.emojiBg} size="lg" />
          </div>
          {myLeagueRank != null && myLeagueRank > 0 && (
            <span className="lb-drill-hero-place">Ваше место · #{myLeagueRank}</span>
          )}
        </div>
        <h2 className="lb-drill-hero-title">{league.name}</h2>
        {isAdmin && <AdminIdBadge id={league.id} label="Лига" />}
        <p className="lb-drill-hero-meta">
          {formatParticipants(league.memberCount)}
          {leagueAvgLabel(league.avgPoints) && <> · {leagueAvgLabel(league.avgPoints)}</>}
        </p>
        {league.inviteLink && (
          <InviteLinkActions
            link={league.inviteLink}
            shareText={`Вступай в лигу «${league.name}»!`}
            shareLabel="Пригласить в лигу"
            variant="hero"
          />
        )}
      </div>
    </div>
  );
}

function RemoveMemberConfirmModal({
  leader,
  removing,
  error,
  onCancel,
  onConfirm,
}: {
  leader: Leader;
  removing: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const close = useCallback(() => {
    if (!removing) onCancel();
  }, [removing, onCancel]);

  useDialogA11y(true, close, dialogRef);

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={close} role="presentation">
        <div
          ref={dialogRef}
          className="modal-sheet lb-remove-member-modal"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={e => e.stopPropagation()}
        >
          <div className="modal-handle" aria-hidden="true" />
          <h3 id={titleId}>Удалить участника?</h3>
          <p className="modal-desc">
            Вы уверены, что хотите удалить{' '}
            <strong>{displayName(leader.firstName, leader.lastName)}</strong> из лиги? Это действие нельзя отменить.
          </p>
          {error && (
            <div className="modal-error" role="alert">
              {error}
            </div>
          )}
          <button type="button" className="modal-submit danger" onClick={onConfirm} disabled={removing}>
            {removing ? 'Удаление...' : 'Удалить участника'}
          </button>
          <button type="button" className="btn-secondary" onClick={close} disabled={removing}>
            Отмена
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}

function LeagueBrowseList({
  leagues,
  onOpen,
  isAdmin,
}: {
  leagues: LeagueSummary[];
  onOpen: (id: number) => void;
  isAdmin?: boolean;
}) {
  return (
    <ul className="lb-league-browse-list">
      {leagues.map(league => (
        <li key={league.id}>
          <button type="button" className="lb-league-browse-card" onClick={() => onOpen(league.id)}>
            <LeagueEmoji emoji={league.emoji} bgColor={league.emojiBg} size="md" className="lb-league-browse-emoji" />
            <div className="lb-league-browse-main">
              <span className="lb-league-browse-name">{league.name}</span>
              <span className="lb-league-browse-meta">
                {formatParticipants(league.memberCount)}
                {leagueAvgLabel(league.avgPoints) && <> · {leagueAvgLabel(league.avgPoints)}</>}
                {isAdmin && <> · </>}
                {isAdmin && <AdminIdBadge id={league.id} label="Лига" className="admin-id-badge--inline" />}
              </span>
            </div>
            <span className="lb-league-browse-action" aria-hidden="true">
              Открыть <span className="lb-league-browse-arrow">→</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function LeagueRankingList({
  leagues,
  onOpen,
  isAdmin,
}: {
  leagues: LeagueSummary[];
  onOpen: (id: number) => void;
  isAdmin?: boolean;
}) {
  if (leagues.length === 0) {
    return (
      <div className="lb-leagues-empty">
        <p className="lb-leagues-empty-hint">
          Пока нет лиг в рейтинге. В списке только лиги от 3 участников — соберите друзей или создайте
          свою.
        </p>
      </div>
    );
  }

  return (
    <div className="lb-league-ranking">
      {leagues.map(league => (
        <button
          key={league.id}
          type="button"
          className="lb-league-rank-card lb-league-rank-card--drill"
          onClick={() => onOpen(league.id)}
        >
          <div className={`lb-league-rank-num ${(league.rank ?? 0) <= 3 ? `top${league.rank}` : ''}`}>
            {league.rank === 1 ? '🥇' : league.rank === 2 ? '🥈' : league.rank === 3 ? '🥉' : league.rank}
          </div>
          <LeagueEmoji emoji={league.emoji} bgColor={league.emojiBg} size="md" className="lb-league-rank-emoji" />
          <div className="lb-league-rank-info">
            <span className="lb-league-rank-name">{league.name}</span>
            <span className="lb-league-rank-meta">
              {formatParticipants(league.memberCount)} · {formatPoints(league.totalPoints ?? 0)} всего
              {isAdmin && <> · </>}
              {isAdmin && <AdminIdBadge id={league.id} label="Лига" className="admin-id-badge--inline" />}
            </span>
          </div>
          <div className="lb-league-rank-tail">
            <div className="lb-league-rank-avg">
              <span className="lb-league-rank-avg-value">{league.avgPoints ?? 0}</span>
              <span className="lb-league-rank-avg-label">среднее</span>
            </div>
            <span className="lb-league-rank-open">Открыть →</span>
          </div>
        </button>
      ))}
    </div>
  );
}

export function LeaderboardPage({
  globalLeaders: initialLeaders,
  myId,
  myRank: initialRank,
  myPoints: initialPoints,
  stats,
  leagues,
  canCreateLeague,
  ownedLeagueCount,
  maxOwnedLeagues,
  onLeaguesChange,
  leagueToOpenId = null,
  onLeagueOpened,
  leaderboardResetKey = 0,
  isActive = true,
  refreshKey = 0,
  onViewUser,
  isAdmin = false,
}: Props) {
  const [mode, setMode] = useState<LbMode>('players');
  const [rankKind, setRankKind] = useState<PlayersRankKind>('total');
  const [leagueDrillId, setLeagueDrillId] = useState<number | null>(null);

  const [globalLeaders, setGlobalLeaders] = useState(initialLeaders);
  const [leagueLeaders, setLeagueLeaders] = useState<Leader[]>([]);
  const [activeLeague, setActiveLeague] = useState<LeagueSummary | null>(null);
  const [leaguesRanking, setLeaguesRanking] = useState<LeagueSummary[]>([]);
  const [neighborhood, setNeighborhood] = useState<Leader[]>([]);
  const [myRankDetail, setMyRankDetail] = useState<LeaderboardMyRank | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createdLink, setCreatedLink] = useState('');
  const [loadingLeague, setLoadingLeague] = useState(false);
  const [leagueLoadError, setLeagueLoadError] = useState('');
  const [removeTarget, setRemoveTarget] = useState<Leader | null>(null);
  const [removingMember, setRemovingMember] = useState(false);
  const [removeError, setRemoveError] = useState('');

  useEffect(() => {
    setGlobalLeaders(initialLeaders);
  }, [initialLeaders]);

  const refreshGlobal = useCallback(() => {
    if (mode !== 'players' || leagueDrillId != null) return;
    api.getLeaderboard(rankKind)
      .then(res => {
        setGlobalLeaders(res.leaders);
        setNeighborhood(res.neighborhood ?? []);
        setMyRankDetail(res.myRank);
      })
      .catch(() => {});
  }, [mode, leagueDrillId, rankKind]);

  useEffect(() => {
    refreshGlobal();
  }, [refreshGlobal]);

  useEffect(() => {
    if (mode === 'leagues') {
      api.getLeaguesRanking().then(r => setLeaguesRanking(r.leagues)).catch(() => {});
    }
  }, [mode, leagues]);

  useEffect(() => {
    if (leagueDrillId == null) {
      setLeagueLeaders([]);
      setActiveLeague(null);
      setLeagueLoadError('');
      return;
    }

    setLoadingLeague(true);
    setLeagueLoadError('');
    api.getLeagueLeaderboard(leagueDrillId, rankKind)
      .then(res => {
        setLeagueLeaders(res.leaders.map(normalizeLeader));
        setActiveLeague(res.league);
        setNeighborhood(res.neighborhood ?? []);
        setMyRankDetail(res.myRank);
      })
      .catch(e => {
        setLeagueLoadError(e instanceof Error ? e.message : 'Не удалось открыть лигу');
        setLeagueLeaders([]);
        setActiveLeague(
          leagues.find(l => l.id === leagueDrillId) ??
            leaguesRanking.find(l => l.id === leagueDrillId) ??
            null
        );
      })
      .finally(() => setLoadingLeague(false));
  }, [leagueDrillId, leagues, rankKind]);

  const openLeagueDrill = (id: number) => {
    setLeagueDrillId(id);
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
  };

  useEffect(() => {
    if (leagueToOpenId == null) return;
    setMode('myLeagues');
    setLeagueDrillId(leagueToOpenId);
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    onLeagueOpened?.();
  }, [leagueToOpenId, onLeagueOpened]);

  useEffect(() => {
    if (leaderboardResetKey < 1) return;
    setLeagueDrillId(null);
    setLeagueLoadError('');
    setMode('players');
  }, [leaderboardResetKey]);

  const closeLeagueDrill = () => {
    setLeagueDrillId(null);
    setLeagueLoadError('');
    if (mode === 'players') {
      api.getLeaderboard(rankKind)
        .then(res => {
          setGlobalLeaders(res.leaders);
          setNeighborhood(res.neighborhood ?? []);
          setMyRankDetail(res.myRank);
        })
        .catch(() => {});
    }
  };

  const reloadLeagueDrill = useCallback(async () => {
    if (leagueDrillId == null) return;
    const res = await api.getLeagueLeaderboard(leagueDrillId, rankKind);
    setLeagueLeaders(res.leaders.map(normalizeLeader));
    setActiveLeague(res.league);
    setNeighborhood(res.neighborhood ?? []);
    setMyRankDetail(res.myRank);
  }, [leagueDrillId, rankKind]);

  useEffect(() => {
    if (!isActive) return;
    refreshGlobal();
    if (leagueDrillId != null) reloadLeagueDrill().catch(() => {});
  }, [isActive, refreshKey, refreshGlobal, leagueDrillId, reloadLeagueDrill]);

  useEffect(() => {
    if (!isActive) return;
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      refreshGlobal();
      if (leagueDrillId != null) reloadLeagueDrill().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [isActive, refreshGlobal, leagueDrillId, reloadLeagueDrill]);

  const handleLeagueCreated = useCallback(
    async (leagueId: number, inviteLink: string) => {
      setCreatedLink(inviteLink);
      await onLeaguesChange();
      setMode('myLeagues');
      openLeagueDrill(leagueId);
      setShowCreate(false);
    },
    [onLeaguesChange]
  );

  const handleConfirmRemoveMember = async () => {
    if (!removeTarget || leagueDrillId == null) return;
    setRemovingMember(true);
    setRemoveError('');
    try {
      await api.removeLeagueMember(leagueDrillId, removeTarget.id);
      setRemoveTarget(null);
      await reloadLeagueDrill();
      await onLeaguesChange();
    } catch (e) {
      setRemoveError(e instanceof Error ? e.message : 'Не удалось удалить участника');
    } finally {
      setRemovingMember(false);
    }
  };

  const rawLeaders = leagueDrillId != null ? leagueLeaders : globalLeaders;
  const displayLeaders = useMemo(
    () => prepareLeadersForRankKind(rawLeaders.map(normalizeLeader)),
    [rawLeaders]
  );
  const displayNeighborhood = useMemo(
    () => prepareLeadersForRankKind(neighborhood.map(normalizeLeader)),
    [neighborhood]
  );

  const myBreakdown = myRankDetail ?? {
    rank: initialRank,
    totalPoints: initialPoints,
    matchPoints: stats.matchPoints,
    tournamentPoints: stats.tournamentPoints,
    squadPoints: stats.squadPoints,
    predictionsCount: stats.totalPredictions,
    outcomeHits: stats.outcomeHits ?? 0,
    differenceHits: stats.differenceHits ?? 0,
    exactScores: stats.exactScores,
    goodPredictions: stats.goodPredictions ?? 0,
  };

  const myEntry =
    displayLeaders.find(l => l.id === myId) ?? displayNeighborhood.find(l => l.id === myId);
  const myRank = myBreakdown.rank;
  const myDisplayPoints = myEntry
    ? leaderPointsForKind(myEntry, rankKind)
    : myPointsForKind(myBreakdown, rankKind);

  const maxPoints =
    displayLeaders.length > 0 ? leaderPointsForKind(displayLeaders[0], rankKind) : Math.max(myDisplayPoints, 1);

  const leaderTopPoints =
    displayLeaders.length > 0 ? leaderPointsForKind(displayLeaders[0], rankKind) : myDisplayPoints;
  const gapToFirst = myRank > 1 ? Math.max(0, leaderTopPoints - myDisplayPoints) : 0;
  const showNeighborhood =
    displayNeighborhood.length > 0 && !displayLeaders.some(l => l.id === myId);
  const neighborhoodLabel =
    leagueDrillId != null ? 'Ваше место в лиге' : 'Ваше место в рейтинге';

  const hasMemberLeagues = leagues.length > 0;

  const isLeagueMemberView = activeLeague?.isMember === true;
  const isLeagueOwner = activeLeague?.isOwner === true && isLeagueMemberView;
  const leagueOwnerId = activeLeague?.ownerId;

  const renderLeaderboardBody = () => {
    if (leagueDrillId != null && loadingLeague) {
      return (
        <div className="loading-inline" role="status" aria-live="polite">
          <div className="spinner small" aria-hidden="true" />
          <span className="sr-only">Загрузка рейтинга лиги</span>
        </div>
      );
    }

    if (leagueDrillId != null && leagueLoadError) {
      return (
        <div className="empty-state compact">
          <p>{leagueLoadError}</p>
        </div>
      );
    }

    if (displayLeaders.length === 0) {
      return (
        <div className="empty-state">
          <div className="icon"><IconTrophy size={48} /></div>
          <h3>Рейтинг пуст</h3>
          <p>Сделайте прогноз, чтобы попасть в таблицу</p>
        </div>
      );
    }

    return (
      <>
        <LeaderList
          leaders={displayLeaders}
          myId={myId}
          maxPoints={maxPoints}
          rankKind={rankKind}
          onViewUser={onViewUser}
          isAdmin={isAdmin}
          leagueOwnerId={leagueDrillId != null && isLeagueOwner ? leagueOwnerId : undefined}
          onRequestRemove={
            leagueDrillId != null && isLeagueOwner
              ? leader => {
                  setRemoveError('');
                  setRemoveTarget(leader);
                }
              : undefined
          }
        />
        {showNeighborhood && (
          <div className="lb-neighborhood">
            <div className="lb-neighborhood-label">{neighborhoodLabel}</div>
            <LeaderList
              leaders={displayNeighborhood}
              myId={myId}
              maxPoints={maxPoints}
              rankKind={rankKind}
              onViewUser={onViewUser}
              isAdmin={isAdmin}
              leagueOwnerId={isLeagueOwner ? leagueOwnerId : undefined}
              onRequestRemove={
                isLeagueOwner
                  ? leader => {
                      setRemoveError('');
                      setRemoveTarget(leader);
                    }
                  : undefined
              }
            />
          </div>
        )}
      </>
    );
  };

  const myCard = (
    <div className="lb-my-card">
      <div className="lb-my-rank-wrap">
        <span className="lb-my-rank-label">Место</span>
        <span className="lb-my-rank">#{myRank}</span>
      </div>
      <div className="lb-my-info">
        <span className="lb-my-label">{RANK_KIND_LABELS[rankKind]}</span>
        {rankKind === 'total' && (
          <span className="lb-my-meta">{formatPredictionStats(myBreakdown)}</span>
        )}
        {rankKind === 'total' && (
          <LeaderPointsStrip
            matchPoints={myBreakdown.matchPoints}
            tournamentPoints={myBreakdown.tournamentPoints}
            squadPoints={myBreakdown.squadPoints}
          />
        )}
        {myRank > 1 && gapToFirst > 0 && (
          <span className="lb-my-gap">−{gapToFirst} до #1</span>
        )}
        {myRank === 1 && displayLeaders.length > 0 && (
          <span className="lb-my-gap leader">Вы лидируете</span>
        )}
      </div>
      <div className="lb-my-pts-wrap">
        <span className={`lb-my-pts ${pointsToneClass(myDisplayPoints)}`}>{myDisplayPoints}</span>
        <span className={`lb-my-pts-label ${pointsToneClass(myDisplayPoints)}`}>
          {formatPointsWord(myDisplayPoints)}
        </span>
      </div>
    </div>
  );

  const drillLeague =
    leagueDrillId != null
      ? activeLeague ??
        leagues.find(l => l.id === leagueDrillId) ??
        leaguesRanking.find(l => l.id === leagueDrillId) ??
        null
      : null;
  const myLeagueRankInDrill = isLeagueMemberView ? myEntry?.rank : undefined;

  return (
    <>
      <div className="leaderboard-page">
      {leagueDrillId != null ? (
        <div className="lb-drill">
          <button type="button" className="lb-drill-back" onClick={closeLeagueDrill}>
            ← Назад
          </button>

          {drillLeague && (
            <LeagueDrillHero
              league={{
                ...drillLeague,
                emoji: activeLeague?.emoji ?? drillLeague.emoji,
                inviteLink: activeLeague?.inviteLink ?? createdLink ?? drillLeague.inviteLink,
                avgPoints: activeLeague?.avgPoints ?? drillLeague.avgPoints,
                memberCount: activeLeague?.memberCount ?? drillLeague.memberCount,
              }}
              myLeagueRank={myLeagueRankInDrill}
              isAdmin={isAdmin}
            />
          )}

          <RankKindSwitch value={rankKind} onChange={setRankKind} compact />
          <p className="lb-scope-desc">{RANK_KIND_DESC[rankKind]}</p>
          {renderLeaderboardBody()}
        </div>
      ) : (
        <>
          <CreateLeaguePromo
            featured={canCreateLeague}
            disabled={!canCreateLeague}
            ownedCount={ownedLeagueCount}
            maxOwned={maxOwnedLeagues}
            onClick={() => {
              if (canCreateLeague) setShowCreate(true);
            }}
          />

      <div className="lb-mode-switch lb-mode-switch--triple" role="tablist" aria-label="Раздел рейтинга">
        <button
          type="button"
          role="tab"
          className={`lb-mode-btn ${mode === 'players' ? 'active' : ''}`}
          aria-selected={mode === 'players'}
          onClick={() => setMode('players')}
        >
          <IconTrophy size={15} aria-hidden="true" />
          <span>Игроки</span>
        </button>
        <button
          type="button"
          role="tab"
          className={`lb-mode-btn ${mode === 'leagues' ? 'active' : ''}`}
          aria-selected={mode === 'leagues'}
          onClick={() => setMode('leagues')}
        >
          <IconSquad size={15} aria-hidden="true" />
          <span>Рейтинг лиг</span>
        </button>
        <button
          type="button"
          role="tab"
          className={`lb-mode-btn ${mode === 'myLeagues' ? 'active' : ''}`}
          aria-selected={mode === 'myLeagues'}
          onClick={() => setMode('myLeagues')}
        >
          <IconFriends size={15} aria-hidden="true" />
          <span>Ваши лиги{leagues.length > 0 ? ` (${leagues.length})` : ''}</span>
        </button>
      </div>

      {mode === 'players' && (
        <>
          <RankKindSwitch value={rankKind} onChange={setRankKind} compact />
          <p className="lb-scope-desc">{RANK_KIND_DESC[rankKind]}</p>
          {myCard}
          {renderLeaderboardBody()}
        </>
      )}

      {mode === 'leagues' && (
        <>
          <div className="lb-leagues-intro">
            <p>
              Лиги от <strong>3 участников</strong> — по среднему количеству очков на человека. Рейтинг
              лиги можно посмотреть; вступить — только по приглашению.
            </p>
          </div>
          <LeagueRankingList leagues={leaguesRanking} onOpen={openLeagueDrill} isAdmin={isAdmin} />
        </>
      )}

      {mode === 'myLeagues' && (
        <>
          {!hasMemberLeagues ? (
            <p className="lb-leagues-empty-hint lb-leagues-empty-hint--padded">
              Вступите в лигу друга по ссылке-приглашению — она появится здесь
            </p>
          ) : (
            <LeagueBrowseList leagues={leagues} onOpen={openLeagueDrill} isAdmin={isAdmin} />
          )}
        </>
      )}
        </>
      )}
      </div>

      <CreateLeagueModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleLeagueCreated}
      />

      {removeTarget && (
        <RemoveMemberConfirmModal
          leader={removeTarget}
          removing={removingMember}
          error={removeError}
          onCancel={() => {
            if (!removingMember) {
              setRemoveTarget(null);
              setRemoveError('');
            }
          }}
          onConfirm={handleConfirmRemoveMember}
        />
      )}
    </>
  );
}
