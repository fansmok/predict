import { useEffect, useMemo, useRef, useState, useId } from 'react';
import type { PublicUserProfile, SquadPlayerOption, TournamentOption, Match } from '../types';
import { api } from '../api';
import {
  displayName,
  formatPointsWord,
  pointsToneClass,
  groupMatchesByDate,
  isTournamentComplete,
} from '../utils';
import { ModalPortal } from './ModalPortal';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { UserAvatar } from './UserAvatar';
import { PlatinumName } from './PlatinumName';
import { MatchPredictionsBreakdown } from './MatchPredictionsBreakdown';
import { FantasyPitch } from './FantasyPitch';
import { SquadPointsBreakdown } from './SquadPointsBreakdown';
import { TournamentPicks } from './TournamentPicks';
import { TournamentTotals } from './TournamentTotals';
import { MatchCard } from './MatchCard';
import { DateHeader } from './DateHeader';
import { IconBall, IconSquad, IconTrophy } from './Icons';

interface Props {
  userId: number;
  myId?: number;
  tournamentTeams: TournamentOption[];
  tournamentPlayers: TournamentOption[];
  onClose: () => void;
}

type ProfileTab = 'tournament' | 'squad' | 'matches';

const SQUAD_SIZE = 11;

const TAB_META: Record<
  ProfileTab,
  { label: string; hint: string; Icon: typeof IconTrophy }
> = {
  tournament: {
    label: 'Турнир',
    hint: 'Победитель, призёры и бомбардир ЧМ-2026',
    Icon: IconTrophy,
  },
  squad: {
    label: 'Сборная',
    hint: 'Fantasy-команда из 11 игроков',
    Icon: IconSquad,
  },
  matches: {
    label: 'Матчи',
    hint: 'Прогнозы на групповой этап',
    Icon: IconBall,
  },
};

function buildSquadSlots(players: SquadPlayerOption[]): Array<SquadPlayerOption | null> {
  const slots: Array<SquadPlayerOption | null> = Array(SQUAD_SIZE).fill(null);
  for (const p of players) {
    const slot = p.slot ?? slots.findIndex(s => s === null);
    if (slot >= 0 && slot < SQUAD_SIZE) slots[slot] = p;
  }
  return slots;
}

function rankBadge(rank: number): string {
  if (rank === 1) return '🥇 1 место';
  if (rank <= 3) return `🏆 ${rank} место`;
  if (rank <= 10) return `⭐ ${rank} место`;
  return `#${rank}`;
}

function tournamentFilledCount(profile: PublicUserProfile): number {
  if (profile.tournament.picksHidden && profile.tournament.picksFilled != null) {
    return profile.tournament.picksFilled;
  }
  return [
    profile.tournament.picks.winner,
    profile.tournament.picks.second,
    profile.tournament.picks.third,
    profile.tournament.picks.topScorer,
  ].filter(Boolean).length;
}

function squadPlayerCount(profile: PublicUserProfile): number {
  if (profile.squad.squadHidden && profile.squad.squadPlayerCount != null) {
    return profile.squad.squadPlayerCount;
  }
  return profile.squad.players.length;
}

function tabBadge(tab: ProfileTab, profile: PublicUserProfile): string {
  if (tab === 'tournament') {
    const n = tournamentFilledCount(profile);
    return n > 0 ? `${n}/4` : '—';
  }
  if (tab === 'squad') {
    const n = squadPlayerCount(profile);
    return profile.squad.complete ? '11/11' : `${n}/11`;
  }
  if (tab === 'matches') {
    return profile.stats.totalPredictions > 0 ? String(profile.stats.totalPredictions) : '—';
  }
  return '—';
}

export function UserPublicProfileModal({
  userId,
  myId,
  tournamentTeams,
  tournamentPlayers,
  onClose,
}: Props) {
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<ProfileTab>('tournament');
  const dialogRef = useRef<HTMLDivElement>(null);
  const panelsRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const panelId = useId();

  useDialogA11y(true, onClose, dialogRef);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setTab('tournament');
    api
      .getUserProfile(userId)
      .then(data => {
        if (!cancelled) setProfile(data);
      })
      .catch(e => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Не удалось загрузить профиль');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (panelsRef.current) panelsRef.current.scrollTop = 0;
  }, [tab]);

  const groupedPredictions = useMemo(
    () => (profile ? groupMatchesByDate(profile.predictions) : new Map()),
    [profile]
  );

  const squadSlots = useMemo(
    () => (profile ? buildSquadSlots(profile.squad.players) : []),
    [profile]
  );

  const isMe = myId != null && profile?.user.id === myId;
  const tournamentResultsSettled = profile?.tournament.results !== null;
  const tournamentComplete = profile ? isTournamentComplete(profile.tournament) : false;
  const tournamentFilled = profile ? tournamentFilledCount(profile) : 0;

  const haptic = () => window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');

  return (
    <ModalPortal>
      <div className="user-profile-overlay" onClick={onClose} role="presentation">
        <div
          ref={dialogRef}
          className="user-profile-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={e => e.stopPropagation()}
        >
          <div className="user-profile-handle" aria-hidden="true" />
          <button type="button" className="user-profile-close" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>

          {loading && (
            <div className="user-profile-loading" role="status">
              Загрузка профиля...
            </div>
          )}

          {error && !loading && (
            <div className="user-profile-error" role="alert">
              {error}
            </div>
          )}

          {profile && !loading && (
            <>
              <header className="user-profile-header">
                <div className="user-profile-hero">
                  <UserAvatar
                    firstName={profile.user.firstName}
                    lastName={profile.user.lastName}
                    photoUrl={profile.user.photoUrl}
                    favoriteTeam={profile.user.favoriteTeam}
                    variant="profile"
                  />
                  <div className="user-profile-hero-main">
                    <p className="user-profile-kicker">Профиль игрока</p>
                    <h2 id={titleId} className="user-profile-name">
                      <PlatinumName platinum={profile.user.isPlatinum}>
                        {displayName(profile.user.firstName, profile.user.lastName)}
                      </PlatinumName>
                      {isMe && <span className="leader-you">вы</span>}
                    </h2>
                    {profile.user.favoriteTeam && (
                      <p className="user-profile-fav-team">
                        Болеет за {profile.user.favoriteTeam.name}
                      </p>
                    )}
                    <span className="profile-rank-badge user-profile-rank">
                      {rankBadge(profile.stats.rank)}
                    </span>
                  </div>
                  <div className="user-profile-score" aria-label={`${profile.stats.totalPoints} очков всего`}>
                    <span
                      className={`user-profile-score-value ${pointsToneClass(profile.stats.totalPoints)}`}
                    >
                      {profile.stats.totalPoints}
                    </span>
                    <span className="user-profile-score-label">
                      {formatPointsWord(profile.stats.totalPoints)}
                    </span>
                  </div>
                </div>
              </header>

              <nav className="user-profile-tabs" role="tablist" aria-label="Разделы профиля">
                {(Object.keys(TAB_META) as ProfileTab[]).map(key => {
                  const { label, Icon } = TAB_META[key];
                  const active = tab === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      id={`${panelId}-tab-${key}`}
                      aria-selected={active}
                      aria-controls={`${panelId}-panel-${key}`}
                      className={`user-profile-tab ${active ? 'active' : ''}`}
                      onClick={() => {
                        haptic();
                        setTab(key);
                      }}
                    >
                      <span className="user-profile-tab-badge" aria-hidden="true">
                        {tabBadge(key, profile)}
                      </span>
                      <Icon size={18} aria-hidden="true" />
                      <span className="user-profile-tab-label">{label}</span>
                    </button>
                  );
                })}
              </nav>

              <div ref={panelsRef} className="user-profile-panels">
                {tab === 'tournament' && (
                  <section
                    id={`${panelId}-panel-tournament`}
                    role="tabpanel"
                    aria-labelledby={`${panelId}-tab-tournament`}
                    className="user-profile-panel"
                  >
                    <p className="user-profile-panel-hint">{TAB_META.tournament.hint}</p>
                    <div className="profile-card-block user-profile-section">
                      <div className="profile-card-head">
                        <h3 className="profile-block-title">Прогнозы на турнир</h3>
                        {tournamentComplete && (
                          <span className="profile-chip profile-chip--done">заполнено</span>
                        )}
                        {!tournamentComplete && tournamentFilled > 0 && (
                          <span className="profile-chip">{tournamentFilled}/4</span>
                        )}
                      </div>
                      {!tournamentComplete && tournamentFilled === 0 && (
                        <p className="user-profile-empty">
                          Игрок ещё не заполнил прогнозы на итоги чемпионата
                        </p>
                      )}
                      {profile.tournament.picksHidden && tournamentFilled > 0 && (
                        <p className="user-profile-empty">
                          Прогнозы скрыты до начала чемпионата ({tournamentFilled}/4 заполнено)
                        </p>
                      )}
                      {tournamentFilled > 0 && !profile.tournament.picksHidden && (
                        <>
                          <TournamentPicks
                            data={profile.tournament}
                            teams={tournamentTeams}
                            players={tournamentPlayers}
                            embedded
                            hideHeader
                            readOnly
                            onSave={async () => {}}
                          />
                          <TournamentTotals
                            points={profile.tournament.points}
                            resultsSettled={tournamentResultsSettled}
                          />
                        </>
                      )}
                    </div>
                  </section>
                )}

                {tab === 'squad' && (
                  <section
                    id={`${panelId}-panel-squad`}
                    role="tabpanel"
                    aria-labelledby={`${panelId}-tab-squad`}
                    className="user-profile-panel"
                  >
                    <p className="user-profile-panel-hint">{TAB_META.squad.hint}</p>
                    <div className="profile-card-block user-profile-section">
                      <div className="profile-card-head">
                        <h3 className="profile-block-title">Fantasy-команда</h3>
                        {profile.squad.complete ? (
                          <span className="profile-chip profile-chip--done">собрана</span>
                        ) : (
                          <span className="profile-chip">{squadPlayerCount(profile)}/11</span>
                        )}
                      </div>
                      {profile.squad.squadHidden && squadPlayerCount(profile) > 0 && (
                        <p className="user-profile-empty">
                          Состав скрыт до начала чемпионата
                          {profile.squad.complete ? ' (собран)' : ` (${squadPlayerCount(profile)}/11)`}
                        </p>
                      )}
                      {!profile.squad.squadHidden && profile.squad.complete ? (
                        <>
                          <FantasyPitch
                            slots={squadSlots}
                            locked
                            readonly
                            onSlotClick={() => {}}
                          />
                          <SquadPointsBreakdown points={profile.squad.points} />
                        </>
                      ) : !profile.squad.squadHidden ? (
                        <p className="user-profile-empty">
                          {profile.squad.players.length > 0
                            ? `Собрано ${profile.squad.players.length} из 11 игроков — состав ещё не завершён`
                            : 'Игрок ещё не собрал fantasy-команду'}
                        </p>
                      ) : null}
                    </div>
                  </section>
                )}

                {tab === 'matches' && (
                  <section
                    id={`${panelId}-panel-matches`}
                    role="tabpanel"
                    aria-labelledby={`${panelId}-tab-matches`}
                    className="user-profile-panel"
                  >
                    <p className="user-profile-panel-hint">{TAB_META.matches.hint}</p>
                    <div className="profile-card-block user-profile-section">
                      <h3 className="profile-block-title">Прогнозы на матчи</h3>
                      <MatchPredictionsBreakdown stats={profile.stats} />
                      {profile.predictions.length > 0 ? (
                        <div className="user-profile-predictions">
                          {[...groupedPredictions.entries()].map(([, dayMatches]) => (
                            <div key={dayMatches[0].gameDay} className="date-group compact">
                              <DateHeader kickoff={dayMatches[0].kickoff} matchCount={dayMatches.length} />
                              {dayMatches.map((m: Match) => (
                                <MatchCard key={m.id} match={m} onClick={() => {}} />
                              ))}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="user-profile-empty">Пока нет прогнозов на матчи</p>
                      )}
                    </div>
                  </section>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
