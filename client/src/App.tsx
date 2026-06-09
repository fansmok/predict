import { useState, useMemo, useCallback, useEffect, useRef, startTransition } from 'react';
import { api, hasTelegramInitData, networkErrorMessage, pingServer, waitForTelegramInitData } from './api';
import { Match, User, UserStats, Leader, Rule, Tab, TournamentData, TournamentOption, SquadData, SquadPlayerOption, LeagueSummary } from './types';
import { BottomNav } from './components/BottomNav';
import { MatchesPage } from './pages/MatchesPage';
import { SquadPage } from './pages/SquadPage';
import { PredictionsPage } from './pages/PredictionsPage';
import { FriendsPage } from './pages/FriendsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { UserPublicProfileModal } from './components/UserPublicProfileModal';
import { CreateLeagueModal } from './components/CreateLeagueModal';
import { RulesPage } from './pages/RulesPage';
import { HeaderChip } from './components/HeaderChip';
import { TabPanel } from './components/TabPanel';
import {
  isTournamentComplete,
  countPendingPredictions,
  isTournamentPicksLocked,
  WC_OPENING_KICKOFF,
  captureStartParam,
  clearCapturedStartParam,
  parseLeagueStartParam,
} from './utils';
import wcLogo from './assets/wc-2026.jpg';

const TAB_TITLES: Record<Tab, string> = {
  matches: 'МАТЧ ЦЕНТР',
  squad: 'Собрать команду',
  predictions: 'Мои прогнозы',
  friends: 'Друзья',
  leaderboard: 'Таблица лидеров',
  profile: 'Мой профиль',
};

const EMPTY_SQUAD: SquadData = {
  locked: false,
  deadline: '',
  size: 11,
  maxPerTeam: 2,
  complete: false,
  players: [],
  points: { wins: 0, goals: 0, assists: 0, cleanSheets: 0, goalsConceded: 0, sentOffs: 0, total: 0 },
};

const EMPTY_TOURNAMENT: TournamentData = {
  locked: false,
  deadline: '',
  picks: { winner: null, second: null, third: null, topScorer: null },
  points: { winner: null, second: null, third: null, topScorer: null, total: 0 },
  results: null,
};

export default function App() {
  const [tab, setTab] = useState<Tab>('matches');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [doublePicks, setDoublePicks] = useState<Record<string, number>>({});
  const [tournament, setTournament] = useState<TournamentData>(EMPTY_TOURNAMENT);
  const [tournamentTeams, setTournamentTeams] = useState<TournamentOption[]>([]);
  const [tournamentPlayers, setTournamentPlayers] = useState<TournamentOption[]>([]);
  const [squad, setSquad] = useState<SquadData>(EMPTY_SQUAD);
  const [squadOptions, setSquadOptions] = useState<SquadPlayerOption[]>([]);
  const [squadOptionsError, setSquadOptionsError] = useState('');
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [leagues, setLeagues] = useState<LeagueSummary[]>([]);
  const [canCreateLeague, setCanCreateLeague] = useState(true);
  const [ownedLeagueCount, setOwnedLeagueCount] = useState(0);
  const [maxOwnedLeagues, setMaxOwnedLeagues] = useState(5);
  const [rules, setRules] = useState<Rule[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [viewUserId, setViewUserId] = useState<number | null>(null);
  const [showCreateLeague, setShowCreateLeague] = useState(false);
  const [leagueToOpenId, setLeagueToOpenId] = useState<number | null>(null);
  const [leaderboardResetKey, setLeaderboardResetKey] = useState(0);
  const [inviteBanner, setInviteBanner] = useState('');
  const [socialRefreshKey, setSocialRefreshKey] = useState(0);
  const contentRef = useRef<HTMLElement>(null);
  /** Вкладки, уже отрисованные хотя бы раз — не размонтируем при переключении. */
  const [mountedTabs, setMountedTabs] = useState<Set<Tab>>(() => new Set(['matches']));

  const loadSquadOptions = useCallback(async () => {
    try {
      const res = await api.getSquadOptions();
      setSquadOptions(res.players ?? []);
      setSquadOptionsError(
        res.players?.length ? '' : 'Каталог игроков пуст — перезапустите сервер'
      );
    } catch (e) {
      setSquadOptionsError(
        e instanceof Error ? e.message : 'Не удалось загрузить игроков'
      );
    }
  }, []);

  const loadSecondaryData = useCallback(async () => {
    const results = await Promise.allSettled([
      api.checkAdmin(),
      api.getLeaderboard(),
      api.getRules(),
      api.getTournamentPicks(),
      api.getTournamentOptions(),
      api.getSquad(),
      api.getLeagues(),
    ]);

    const [adminR, leadersR, rulesR, tourR, tourOptR, squadR, leaguesR] = results;

    if (adminR.status === 'fulfilled') setIsAdmin(adminR.value.isAdmin);
    if (leadersR.status === 'fulfilled') setLeaders(leadersR.value.leaders);
    if (rulesR.status === 'fulfilled') setRules(rulesR.value.rules);
    if (tourR.status === 'fulfilled') setTournament(tourR.value);
    if (tourOptR.status === 'fulfilled') {
      setTournamentTeams(tourOptR.value.teams);
      setTournamentPlayers(tourOptR.value.players);
    }
    if (squadR.status === 'fulfilled') setSquad(squadR.value);
    if (leaguesR.status === 'fulfilled') {
      setLeagues(leaguesR.value.leagues);
      setCanCreateLeague(leaguesR.value.canCreateLeague);
      setOwnedLeagueCount(leaguesR.value.ownedLeagueCount);
      setMaxOwnedLeagues(leaguesR.value.maxOwnedLeagues);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setError('');

      const reachable = await pingServer();
      if (!reachable) {
        setError(networkErrorMessage());
        return;
      }

      await waitForTelegramInitData();
      if (!hasTelegramInitData()) {
        setError(
          'Нет авторизации Telegram. Закройте приложение и откройте снова из @predictliga_bot.' +
            ' Если включён VPN — отключите или смените сервер.'
        );
        return;
      }

      const [meR, matchesR] = await Promise.allSettled([api.getMe(), api.getMatches()]);

      if (meR.status === 'fulfilled') {
        setUser(meR.value.user);
        setStats(meR.value.stats);
      }
      if (matchesR.status === 'fulfilled') {
        setMatches(matchesR.value.matches);
        setDoublePicks(matchesR.value.doublePicks ?? {});
      }

      if (meR.status === 'rejected' && matchesR.status === 'rejected') {
        const reason =
          meR.reason instanceof Error ? meR.reason.message : 'Не удалось загрузить данные';
        setError(reason);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : networkErrorMessage(e));
    } finally {
      setLoading(false);
    }

    void loadSecondaryData();
    void loadSquadOptions();
  }, [loadSecondaryData, loadSquadOptions]);

  const refreshMatchesAndMe = useCallback(async () => {
    const [matchesR, meR] = await Promise.allSettled([api.getMatches(), api.getMe()]);
    if (matchesR.status === 'fulfilled') {
      setMatches(matchesR.value.matches);
      setDoublePicks(matchesR.value.doublePicks ?? {});
    }
    if (meR.status === 'fulfilled') {
      setUser(meR.value.user);
      setStats(meR.value.stats);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await waitForTelegramInitData();
      api.bootstrap().catch(() => {});
      await loadData();
    })();
  }, [loadData]);

  useEffect(() => {
    const watchdog = window.setTimeout(() => {
      setLoading(prev => {
        if (prev) {
          setError(
            current =>
              current ||
              `Долгая загрузка — проверьте интернет и откройте приложение заново из Telegram.${' Если включён VPN — отключите его или выберите сервер в России/СНГ.'}`
          );
          return false;
        }
        return prev;
      });
    }, 18_000);
    return () => window.clearTimeout(watchdog);
  }, []);

  useEffect(() => {
    if (!inviteBanner) return;
    const timer = window.setTimeout(() => setInviteBanner(''), 5_000);
    return () => window.clearTimeout(timer);
  }, [inviteBanner]);

  useEffect(() => {
    if (loading) return;

    let cancelled = false;
    let timer: number | undefined;

    const tryInvite = async (attempt: number) => {
      window.Telegram?.WebApp?.ready();
      const startParam = captureStartParam();
      if (!startParam || cancelled) {
        if (!startParam && attempt < 24 && !cancelled) {
          timer = window.setTimeout(() => void tryInvite(attempt + 1), 400);
        }
        return;
      }

      try {
        await api.bootstrap();
        const result = await api.applyInvite(startParam);
        if (cancelled) return;

        if (result.type === 'league' && result.league) {
          clearCapturedStartParam();
          setLeagueToOpenId(result.league.id);
          setTab('leaderboard');
          setLeaderboardResetKey(k => k + 1);
          setMountedTabs(prev => {
            const next = new Set(prev);
            next.add('leaderboard');
            return next;
          });
          setInviteBanner(`Вы вступили в лигу «${result.league.name}»`);
          setSocialRefreshKey(k => k + 1);
          window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');

          const leaguesRes = await api.getLeagues();
          if (!cancelled) {
            setLeagues(leaguesRes.leagues);
            setCanCreateLeague(leaguesRes.canCreateLeague);
            setOwnedLeagueCount(leaguesRes.ownedLeagueCount);
            setMaxOwnedLeagues(leaguesRes.maxOwnedLeagues);
          }
        } else if (parseLeagueStartParam(startParam)) {
          setInviteBanner('Приглашение принято. Откройте вкладку «Рейтинг».');
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Не удалось принять приглашение';
        if (attempt < 3 && !cancelled) {
          timer = window.setTimeout(() => void tryInvite(attempt + 1), 600);
          return;
        }
        if (parseLeagueStartParam(startParam)) {
          setInviteBanner(msg);
        }
      }
    };

    void tryInvite(0);

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [loading]);

  useEffect(() => {
    if (loading || tab !== 'leaderboard') return;
    api
      .getLeagues()
      .then(res => {
        setLeagues(res.leagues);
        setCanCreateLeague(res.canCreateLeague);
        setOwnedLeagueCount(res.ownedLeagueCount);
        setMaxOwnedLeagues(res.maxOwnedLeagues);
      })
      .catch(() => {});
  }, [loading, tab]);

  useEffect(() => {
    if (loading) return;
    setMountedTabs(prev => {
      const next = new Set(prev);
      next.add('matches');
      next.add('predictions');
      return next.size === prev.size && prev.has('matches') && prev.has('predictions') ? prev : next;
    });
  }, [loading]);

  useEffect(() => {
    setMountedTabs(prev => {
      if (prev.has(tab)) return prev;
      const next = new Set(prev);
      next.add(tab);
      return next;
    });
  }, [tab]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    el.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [tab]);

  const handleTabChange = useCallback((next: Tab) => {
    setShowRules(false);
    setShowAdmin(false);
    setViewUserId(null);
    if (next === 'leaderboard') {
      setLeaderboardResetKey(k => k + 1);
    }
    startTransition(() => setTab(next));
  }, []);

  useEffect(() => {
    if (showAdmin && !isAdmin) setShowAdmin(false);
  }, [showAdmin, isAdmin]);

  useEffect(() => {
    if (tournament.locked || isTournamentPicksLocked(tournament, matches)) return;
    const deadlineMs = tournament.deadline
      ? new Date(tournament.deadline).getTime()
      : new Date(WC_OPENING_KICKOFF).getTime();
    const msUntil = deadlineMs - Date.now();
    if (msUntil <= 0) {
      api.getTournamentPicks().then(setTournament).catch(() => {});
      return;
    }
    const timer = window.setTimeout(() => {
      api.getTournamentPicks().then(setTournament).catch(() => {});
    }, msUntil + 250);
    return () => window.clearTimeout(timer);
  }, [tournament.deadline, tournament.locked, matches]);

  const handleSavePrediction = async (
    matchId: number,
    homeScore: number,
    awayScore: number,
    useDouble?: boolean
  ) => {
    await api.savePrediction(matchId, homeScore, awayScore, useDouble);
    await refreshMatchesAndMe();
  };

  const handleSaveTournament = async (picks: {
    winnerTeamId?: string;
    secondTeamId?: string;
    thirdTeamId?: string;
    topScorerPlayerId?: string;
  }) => {
    if (isTournamentPicksLocked(tournament, matches)) return;
    const data = await api.saveTournamentPicks(picks);
    setTournament(data);
    await loadData();
  };

  const handleSaveFavoriteTeam = async (teamId: string) => {
    const res = await api.saveFavoriteTeam(teamId);
    setUser(u => (u ? { ...u, favoriteTeam: res.favoriteTeam } : u));
    return res.favoriteTeam;
  };

  const handleSaveSquad = async (playerIds: string[]) => {
    const data = await api.saveSquad(playerIds);
    setSquad(data);
    await loadData();
  };

  const tournamentComplete = isTournamentComplete(tournament);
  const tournamentLocked = isTournamentPicksLocked(tournament, matches);
  const showTournamentOnMatches = !tournamentComplete && !tournamentLocked;
  const pendingPredictions = useMemo(() => countPendingPredictions(matches), [matches]);
  const hasLeagueMembership = leagues.some(l => l.isMember);
  /** Матч-центр: плашка до вступления в любую лигу (после блока «Собрать команду»). */
  const showMatchCenterLeaguePromo = !hasLeagueMembership;

  const refreshLeagues = useCallback(async () => {
    const res = await api.getLeagues();
    setLeagues(res.leagues);
    setCanCreateLeague(res.canCreateLeague);
    setOwnedLeagueCount(res.ownedLeagueCount);
    setMaxOwnedLeagues(res.maxOwnedLeagues);
  }, []);

  const clearLeagueToOpen = useCallback(() => setLeagueToOpenId(null), []);

  const handleLeagueCreatedFromApp = useCallback(
    async (leagueId: number) => {
      await refreshLeagues();
      setShowCreateLeague(false);
      setMountedTabs(prev => {
        const next = new Set(prev);
        next.add('leaderboard');
        return next;
      });
      startTransition(() => setTab('leaderboard'));
      setLeagueToOpenId(leagueId);
    },
    [refreshLeagues]
  );

  if (loading) {
    return (
      <div className="app">
        <div className="loading" role="status" aria-live="polite">
          <div className="spinner" aria-hidden="true" />
          <span>Загрузка...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <div className="logo">
            <div className="logo-icon">
              <img src={wcLogo} alt="ЧМ-2026" className="logo-wc" />
            </div>
            <div className="logo-text">
              <h1>Лига Прогнозов</h1>
              <span>ЧМ-2026 · США · Мексика · Канада</span>
            </div>
          </div>
          <div className="header-actions">
            {!showAdmin && !showRules && isAdmin && (
              <button
                type="button"
                className="header-admin-btn"
                onClick={() => {
                  window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
                  setShowAdmin(true);
                }}
              >
                Admin
              </button>
            )}
            {!showAdmin && !showRules && (
              <button
                type="button"
                className="header-rules-btn"
                onClick={() => {
                  window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
                  setShowRules(true);
                }}
              >
                Правила
              </button>
            )}
          </div>
        </div>
        <div className="header-meta">
          <div className="header-subtitle">
            {showRules ? 'ПРАВИЛА' : showAdmin ? 'Admin' : TAB_TITLES[tab]}
          </div>
          <HeaderChip stats={stats} />
        </div>
      </header>

      {error && <div className="error-banner" role="alert">{error}</div>}
      {inviteBanner && (
        <div className="error-banner" style={{ background: 'var(--accent)', color: '#fff' }} role="status">
          {inviteBanner}
        </div>
      )}

      <main
        ref={contentRef}
        className="content"
        aria-label={showRules ? 'Правила' : showAdmin ? 'Администрирование' : TAB_TITLES[tab]}
      >
        {showAdmin && isAdmin ? (
          <AdminPage
            matches={matches}
            squadPlayers={squadOptions}
            tournamentTeams={tournamentTeams}
            tournamentPlayers={tournamentPlayers}
            onRefresh={loadData}
          />
        ) : (
          <>
            {/* Вкладки не размонтируем при правилах — быстрый возврат без повторной загрузки */}
            <div className="content-tabs" hidden={showRules}>
        {mountedTabs.has('matches') && (
          <TabPanel tab="matches" activeTab={tab}>
            <MatchesPage
              tabActive={tab === 'matches'}
              matches={matches}
              doublePicks={doublePicks}
              tournament={tournament}
              tournamentTeams={tournamentTeams}
              tournamentPlayers={tournamentPlayers}
              squadComplete={squad.complete}
              pendingPredictions={pendingPredictions}
              showTournamentPicks={showTournamentOnMatches}
              showLeaguePromo={showMatchCenterLeaguePromo}
              canCreateLeague={canCreateLeague}
              ownedLeagueCount={ownedLeagueCount}
              maxOwnedLeagues={maxOwnedLeagues}
              onOpenCreateLeague={() => setShowCreateLeague(true)}
              onSavePrediction={handleSavePrediction}
              onSaveTournament={handleSaveTournament}
              onGoToSquad={() => setTab('squad')}
              onGoToPredictions={() => setTab('predictions')}
            />
          </TabPanel>
        )}
        {mountedTabs.has('squad') && (
          <TabPanel tab="squad" activeTab={tab}>
            <SquadPage
              data={squad}
              options={squadOptions}
              optionsError={squadOptionsError}
              onSave={handleSaveSquad}
            />
          </TabPanel>
        )}
        {mountedTabs.has('predictions') && (
          <TabPanel tab="predictions" activeTab={tab}>
            <PredictionsPage
              tabActive={tab === 'predictions'}
              matches={matches}
              doublePicks={doublePicks}
              onSavePrediction={handleSavePrediction}
            />
          </TabPanel>
        )}
        {mountedTabs.has('friends') && user && (
          <TabPanel tab="friends" activeTab={tab}>
            <FriendsPage
              myId={user.id}
              isAdmin={isAdmin}
              isActive={tab === 'friends'}
              refreshKey={socialRefreshKey}
              onGoToLeaderboard={() => setTab('leaderboard')}
              onViewUser={setViewUserId}
            />
          </TabPanel>
        )}
        {mountedTabs.has('leaderboard') && user && stats && (
          <TabPanel tab="leaderboard" activeTab={tab}>
            <LeaderboardPage
              globalLeaders={leaders}
              myId={user.id}
              isAdmin={isAdmin}
              myRank={stats.rank}
              myPoints={stats.totalPoints}
              stats={stats}
              leagues={leagues}
              canCreateLeague={canCreateLeague}
              ownedLeagueCount={ownedLeagueCount}
              maxOwnedLeagues={maxOwnedLeagues}
              isActive={tab === 'leaderboard'}
              refreshKey={socialRefreshKey}
              onLeaguesChange={async () => {
                const res = await api.getLeagues();
                setLeagues(res.leagues);
                setCanCreateLeague(res.canCreateLeague);
                setOwnedLeagueCount(res.ownedLeagueCount);
                setMaxOwnedLeagues(res.maxOwnedLeagues);
                await loadData();
              }}
              leagueToOpenId={leagueToOpenId}
              onLeagueOpened={clearLeagueToOpen}
              leaderboardResetKey={leaderboardResetKey}
              onViewUser={setViewUserId}
            />
          </TabPanel>
        )}
        {mountedTabs.has('profile') && user && stats && (
          <TabPanel tab="profile" activeTab={tab}>
            <ProfilePage
              user={user}
              stats={stats}
              isAdmin={isAdmin}
              tournament={tournament}
              tournamentTeams={tournamentTeams}
              tournamentPlayers={tournamentPlayers}
              matches={matches}
              squad={squad}
              leagues={leagues}
              onOpenAdmin={isAdmin ? () => setShowAdmin(true) : undefined}
              onSaveTournament={handleSaveTournament}
              onSaveFavoriteTeam={handleSaveFavoriteTeam}
            />
          </TabPanel>
        )}
            </div>

            {showRules && (
              <RulesPage
                rules={rules}
                onBack={() => startTransition(() => setShowRules(false))}
              />
            )}
          </>
        )}
      </main>

      {showAdmin && (
        <button type="button" className="admin-back-btn" onClick={() => setShowAdmin(false)}>
          ← Назад
        </button>
      )}

      {!showAdmin && (
        <BottomNav
          active={tab}
          onChange={handleTabChange}
          pendingPredictions={pendingPredictions}
        />
      )}

      {viewUserId != null && (
        <UserPublicProfileModal
          userId={viewUserId}
          myId={user?.id}
          isAdmin={isAdmin}
          tournamentTeams={tournamentTeams}
          tournamentPlayers={tournamentPlayers}
          onClose={() => setViewUserId(null)}
        />
      )}

      <CreateLeagueModal
        open={showCreateLeague}
        onClose={() => setShowCreateLeague(false)}
        onCreated={async leagueId => {
          await handleLeagueCreatedFromApp(leagueId);
        }}
      />
    </div>
  );
}
