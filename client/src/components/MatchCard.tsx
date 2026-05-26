import { memo } from 'react';
import { Match } from '../types';
import { formatTime, formatMatchKickoffLine, hasPublicConsensus, stageLabel } from '../utils';
import { MatchConsensusBar } from './MatchConsensusBar';

interface Props {
  match: Match;
  onClick: () => void;
  onProfile?: () => void;
  /** Полная дата и время начала (для раздела «Прогнозы»). */
  showKickoffDate?: boolean;
}

function matchStatusLabel(match: Match, isFinished: boolean): string {
  if (isFinished) return 'Матч завершён';
  if (match.isLocked) return 'Матч идёт, приём прогнозов закрыт';
  return 'Открыт для прогноза';
}

export const MatchCard = memo(function MatchCard({ match, onClick, onProfile, showKickoffDate }: Props) {
  const hasPrediction = !!match.prediction;
  const isFinished = match.status === 'finished';
  const hasActual = match.homeScore !== null && match.awayScore !== null;

  const statusClass = isFinished ? 'finished' : match.isLocked ? 'locked' : 'open';
  const cardClass = [
    'match-card',
    hasPrediction ? 'predicted' : '',
    match.isLocked ? 'locked' : '',
    isFinished ? 'finished' : '',
    !match.canPredict ? 'no-predict' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const homeScore = hasPrediction ? match.prediction!.homeScore : '–';
  const awayScore = hasPrediction ? match.prediction!.awayScore : '–';

  const canOpenProfile = isFinished && !!onProfile;

  const ariaLabel = [
    `${match.homeTeam.name} — ${match.awayTeam.name}`,
    stageLabel(match.stage, match.group),
    showKickoffDate ? formatMatchKickoffLine(match.kickoff) : formatTime(match.kickoff),
    matchStatusLabel(match, isFinished),
    match.canPredict ? 'Сделать или изменить прогноз' : '',
    canOpenProfile ? 'Открыть профиль матча' : '',
  ]
    .filter(Boolean)
    .join('. ');

  const content = (
    <>
      <span className="sr-only">{matchStatusLabel(match, isFinished)}</span>
      <div className={`match-status ${statusClass}`} aria-hidden="true" />

      <div className="match-meta">
        <span className="match-stage">
          {stageLabel(match.stage, match.group)}
          {match.isDouble && <span className="double-badge">×2</span>}
        </span>
        <span className={`match-time${showKickoffDate ? ' match-time--full' : ''}`}>
          {showKickoffDate ? formatMatchKickoffLine(match.kickoff) : formatTime(match.kickoff)}
          {match.isLocked && !isFinished && <span className="live-label"> · LIVE</span>}
        </span>
      </div>

      <div className="match-teams">
        <div className="team home">
          <img className="team-flag" src={match.homeTeam.flag} alt="" aria-hidden="true" loading="lazy" />
          <span className="team-name">{match.homeTeam.name}</span>
        </div>

        <div className="match-center">
          {hasActual ? (
            <>
              <div className="score-display actual" aria-label={`Счёт ${match.homeScore}:${match.awayScore}`}>
                <span>{match.homeScore}</span>
                <span className="sep" aria-hidden="true">:</span>
                <span>{match.awayScore}</span>
              </div>
              {hasPrediction && (
                <span
                  className={`prediction-badge ${match.prediction!.points !== null && match.prediction!.points >= 5 ? 'exact' : match.prediction!.points !== null && match.prediction!.points > 0 ? 'has-points' : ''}`}
                >
                  Прогноз: {homeScore}:{awayScore}
                  {match.prediction!.points !== null && ` · +${match.prediction!.points}`}
                </span>
              )}
            </>
          ) : (
            <>
              <div className="score-display" aria-label={hasPrediction ? `Ваш прогноз ${homeScore}:${awayScore}` : 'Счёт не выбран'}>
                <span>{homeScore}</span>
                <span className="sep" aria-hidden="true">:</span>
                <span>{awayScore}</span>
              </div>
              {match.canPredict && !hasPrediction && (
                <span className="prediction-badge">Сделать прогноз</span>
              )}
              {hasPrediction && (
                <span className="prediction-badge has-points">Ваш прогноз</span>
              )}
              {match.isLocked && !hasPrediction && (
                <span className="prediction-badge locked-badge">Приём закрыт</span>
              )}
            </>
          )}
        </div>

        <div className="team away">
          <img className="team-flag" src={match.awayTeam.flag} alt="" aria-hidden="true" loading="lazy" />
          <span className="team-name">{match.awayTeam.name}</span>
        </div>
      </div>

      {hasPublicConsensus(match.consensus) && (
        <MatchConsensusBar
          consensus={match.consensus}
          homeTeamName={match.homeTeam.name}
          awayTeamName={match.awayTeam.name}
        />
      )}

      {canOpenProfile && (
        <span className="match-profile-hint" aria-hidden="true">Профиль матча →</span>
      )}
    </>
  );

  if (match.canPredict) {
    return (
      <button type="button" className={cardClass} onClick={onClick} aria-label={ariaLabel}>
        {content}
      </button>
    );
  }

  if (canOpenProfile) {
    return (
      <button
        type="button"
        className={`${cardClass} profile-open`}
        onClick={onProfile}
        aria-label={ariaLabel}
      >
        {content}
      </button>
    );
  }

  return (
    <article className={cardClass} aria-label={ariaLabel}>
      {content}
    </article>
  );
});
