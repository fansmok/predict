import { useState } from 'react';
import { User, UserStats, TournamentData, SquadData, LeagueSummary, TournamentOption, Match, Team } from '../types';
import { displayName, isTournamentComplete, isTournamentPicksLocked, formatPoints, formatLeagues, formatExactScores, formatPointsWord, pointsToneClass } from '../utils';
import { IconBall, IconSquad, IconTrophy } from '../components/Icons';
import { SquadPointsBreakdown } from '../components/SquadPointsBreakdown';
import { MatchPredictionsBreakdown } from '../components/MatchPredictionsBreakdown';
import { TournamentTotals } from '../components/TournamentTotals';
import { PlatinumName } from '../components/PlatinumName';
import { TournamentPicks } from '../components/TournamentPicks';
import { UserAvatar } from '../components/UserAvatar';
import { AdminIdBadge } from '../components/AdminIdBadge';
import { FavoriteTeamBanner, FavoriteTeamPicker } from '../components/FavoriteTeamPicker';

interface Props {
  user: User;
  stats: UserStats;
  tournament: TournamentData;
  tournamentTeams: TournamentOption[];
  tournamentPlayers: TournamentOption[];
  matches: Match[];
  squad: SquadData;
  leagues: LeagueSummary[];
  onOpenAdmin?: () => void;
  onSaveTournament: (picks: {
    winnerTeamId?: string;
    secondTeamId?: string;
    thirdTeamId?: string;
    topScorerPlayerId?: string;
  }) => Promise<void>;
  onSaveFavoriteTeam: (teamId: string) => Promise<Team | null>;
}

function rankBadge(rank: number): string {
  if (rank === 1) return '🥇 Лидер';
  if (rank <= 3) return '🏆 Топ-3';
  if (rank <= 10) return '⭐ Топ-10';
  return `#${rank}`;
}

export function ProfilePage({
  user,
  stats,
  tournament,
  tournamentTeams,
  tournamentPlayers,
  matches,
  squad,
  leagues,
  onOpenAdmin,
  onSaveTournament,
  onSaveFavoriteTeam,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [savingTeam, setSavingTeam] = useState(false);
  const tournamentLocked = isTournamentPicksLocked(tournament, matches);
  const tournamentComplete = isTournamentComplete(tournament);
  const tournamentResultsSettled = tournament.results !== null;
  const totalBreakdown = stats.matchPoints + stats.tournamentPoints + stats.squadPoints;
  const breakdown = [
    { label: 'Прогнозы', value: stats.matchPoints, color: 'accent', Icon: IconBall },
    { label: 'Fantasy-команда', value: stats.squadPoints, color: 'blue', Icon: IconSquad },
    { label: 'Турнир', value: stats.tournamentPoints, color: 'gold', Icon: IconTrophy },
  ];
  const maxBreakdown = Math.max(...breakdown.map(b => b.value), 1);

  const tournamentFilled = [
    tournament.picks.winner,
    tournament.picks.second,
    tournament.picks.third,
    tournament.picks.topScorer,
  ].filter(Boolean).length;

  const badges = [
    squad.complete && { label: 'Состав собран', tone: 'accent' },
    isTournamentComplete(tournament) && { label: 'Прогнозы на ЧМ', tone: 'gold' },
    stats.exactScores >= 3 && { label: formatExactScores(stats.exactScores), tone: 'blue' },
    user.isPlatinum && { label: '◆ Платина', tone: 'platinum' },
    leagues.length > 0 && { label: formatLeagues(leagues.length), tone: 'purple' },
  ].filter(Boolean) as Array<{ label: string; tone: string }>;

  const openTeamPicker = () => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    setPickerOpen(true);
  };

  const handleSelectTeam = async (teamId: string) => {
    setSavingTeam(true);
    try {
      await onSaveFavoriteTeam(teamId);
      setPickerOpen(false);
    } finally {
      setSavingTeam(false);
    }
  };

  return (
    <div className="profile-section">
      <div className="profile-hero">
        <div className="profile-hero-bg" />
        <div className="profile-hero-content">
          <UserAvatar
            userId={user.id}
            firstName={user.first_name}
            lastName={user.last_name}
            photoUrl={user.photo_url}
            favoriteTeam={user.favoriteTeam}
            variant="profile"
            onClick={openTeamPicker}
            title={user.favoriteTeam ? `Болею за ${user.favoriteTeam.name}` : 'Выбрать сборную'}
          />
          <div className="profile-hero-info">
            <span className="profile-rank-badge">{rankBadge(stats.rank)}</span>
            <h2 className="profile-name-lg">
              <PlatinumName platinum={user.isPlatinum}>
                {displayName(user.first_name, user.last_name)}
              </PlatinumName>
            </h2>
            {user.isAdmin && <AdminIdBadge id={user.id} label="User" />}
          </div>
          <div className="profile-hero-points">
            <span className={`profile-hero-points-value ${pointsToneClass(stats.totalPoints)}`}>
              {stats.totalPoints}
            </span>
            <span className={`profile-hero-points-label ${pointsToneClass(stats.totalPoints)}`}>
              {formatPointsWord(stats.totalPoints)}
            </span>
          </div>
        </div>
      </div>

      {onOpenAdmin && (
        <button type="button" className="profile-admin-btn" onClick={onOpenAdmin}>
          ⚙️ Admin — ввод результатов матчей
        </button>
      )}

      {!user.favoriteTeam && (
        <FavoriteTeamBanner onClick={openTeamPicker} />
      )}

      <FavoriteTeamPicker
        open={pickerOpen}
        teams={tournamentTeams}
        selected={user.favoriteTeam}
        saving={savingTeam}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectTeam}
      />

      {badges.length > 0 && (
        <div className="profile-badges">
          {badges.map(b => (
            <span key={b.label} className={`profile-badge ${b.tone}`}>{b.label}</span>
          ))}
        </div>
      )}

      <section className="profile-card-block">
        <h3 className="profile-block-title">Откуда очки</h3>
        <div className="profile-breakdown-list">
          {breakdown.map(({ label, value, color, Icon }) => (
            <div key={label} className="profile-breakdown-row">
              <div className={`profile-breakdown-icon ${color}`}>
                <Icon size={16} />
              </div>
              <div className="profile-breakdown-bar-wrap">
                <div className="profile-breakdown-labels">
                  <span>{label}</span>
                  <span className={pointsToneClass(value)}>{formatPoints(value)}</span>
                </div>
                <div className="profile-breakdown-track">
                  <div
                    className={`profile-breakdown-fill ${color}`}
                    style={{ width: `${totalBreakdown ? (value / maxBreakdown) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="profile-card-block">
        <div className="profile-card-head">
          <h3 className="profile-block-title">Прогнозы на турнир</h3>
          <span className="profile-chip" aria-label={`Заполнено ${tournamentFilled} из 4`}>
            {tournamentFilled}/4
          </span>
          {tournamentLocked && <span className="profile-chip profile-chip--locked">закрыто</span>}
          {!tournamentLocked && tournamentComplete && (
            <span className="profile-chip profile-chip--done">заполнено</span>
          )}
        </div>
        {!tournamentLocked && !tournamentComplete && (
          <p className="profile-card-sub">Победитель · призёры · бомбардир · 80 очков</p>
        )}
        {tournamentLocked && !tournamentResultsSettled && (
          <p className="profile-card-sub profile-card-sub--muted">
            Приём закрыт · очки начислятся после финала турнира
          </p>
        )}
        {tournamentLocked && tournamentResultsSettled && (
          <p className="profile-card-sub profile-card-sub--muted">Итоги турнира подведены</p>
        )}
        <TournamentPicks
          data={tournament}
          teams={tournamentTeams}
          players={tournamentPlayers}
          matches={matches}
          embedded
          hideHeader
          onSave={onSaveTournament}
        />
        <TournamentTotals points={tournament.points} resultsSettled={tournamentResultsSettled} />
      </section>

      {squad.complete && (
        <section className="profile-card-block">
          <h3 className="profile-block-title">Fantasy-команда</h3>
          <SquadPointsBreakdown points={squad.points} />
        </section>
      )}

      <section className="profile-card-block">
        <h3 className="profile-block-title">Мои прогнозы</h3>
        <MatchPredictionsBreakdown stats={stats} />
      </section>
    </div>
  );
}
