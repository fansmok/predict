import { useEffect, useId, useRef, useState } from 'react';
import type { Match, MatchProfile, SquadPosition } from '../types';
import { api } from '../api';
import {
  displayName,
  formatPeople,
  formatPointsWord,
  formatPredictions,
  formatMatchKickoffLine,
  hasPublicConsensus,
  stageLabel,
} from '../utils';
import { ModalPortal } from './ModalPortal';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { MatchConsensusBar } from './MatchConsensusBar';
import { UserAvatar } from './UserAvatar';
import { IconBall, IconCheck, IconPass, IconRedCard, IconShield, IconTarget } from './Icons';
import { SheetModalCloseFooter } from './SheetModalCloseFooter';

function rankEmoji(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return String(rank);
}

interface Props {
  match: Match;
  onClose: () => void;
}

const POS_LABEL: Record<SquadPosition, string> = {
  GK: 'ВР',
  DEF: 'ЗЩ',
  MID: 'ПЗ',
  FWD: 'НП',
};

function LineupBlock({
  teamName,
  flag,
  players,
}: {
  teamName: string;
  flag: string;
  players: MatchProfile['lineups']['home'];
}) {
  return (
    <section className="match-profile-lineup">
      <h4 className="match-profile-lineup-title">
        <img src={flag} alt="" aria-hidden="true" loading="lazy" />
        <span>{teamName}</span>
      </h4>
      {players.length === 0 ? (
        <p className="match-profile-empty">Состав не заполнен</p>
      ) : (
        <ul className="match-profile-players">
          {players.map(p => (
            <li key={p.id} className="match-profile-player">
              <span className="match-profile-pos">{POS_LABEL[p.position as SquadPosition] ?? p.position}</span>
              <span className="match-profile-player-name">{p.name}</span>
              <span className="match-profile-player-stats">
                {p.goals > 0 && (
                  <span className="match-profile-stat goals" title={`${p.goals} гол(ов)`}>
                    <IconBall size={14} />
                    {p.goals > 1 ? p.goals : null}
                  </span>
                )}
                {p.assists > 0 && (
                  <span className="match-profile-stat assists" title={`${p.assists} ассист(ов)`}>
                    <IconPass size={14} />
                    {p.assists > 1 ? p.assists : null}
                  </span>
                )}
                {p.sentOff && (
                  <span className="match-profile-stat sent-off" title="Удаление">
                    <IconRedCard size={14} />
                  </span>
                )}
                {p.cleanSheet && (
                  <span className="match-profile-stat clean" title="Сухой матч">
                    <IconShield size={14} />
                  </span>
                )}
              </span>
              <span
                className={`match-profile-fantasy-pts ${
                  p.fantasyPoints > 0 ? 'positive' : p.fantasyPoints < 0 ? 'negative' : ''
                }`}
                title="Итог fantasy за матч"
              >
                {p.fantasyPoints > 0
                  ? `+${p.fantasyPoints}`
                  : p.fantasyPoints < 0
                    ? String(p.fantasyPoints)
                    : '0'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const HIT_CARDS = [
  { key: 'exact' as const, label: 'ТОЧНЫЙ СЧЁТ', Icon: IconCheck },
  { key: 'difference' as const, label: 'РАЗНИЦУ МЯЧЕЙ', Icon: IconTarget },
  { key: 'outcome' as const, label: 'ИСХОД', Icon: IconBall },
];

function PredictionHitsGrid({
  exactHits,
  differenceHits,
  outcomeHits,
  total,
}: {
  exactHits: number;
  differenceHits: number;
  outcomeHits: number;
  total: number;
}) {
  const counts = { exact: exactHits, difference: differenceHits, outcome: outcomeHits };

  return (
    <div className="match-profile-hits-wrap">
      <div className="match-profile-hits" role="list">
        {HIT_CARDS.map(({ key, label, Icon }) => {
          const count = counts[key];
          const share = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={key} className={`match-profile-hit-card ${key}`} role="listitem">
              <div className="match-profile-hit-icon" aria-hidden="true">
                <Icon size={14} />
              </div>
              <span className="match-profile-hit-prefix">Угадали</span>
              <span className="match-profile-hit-type">{label}</span>
              <span className="match-profile-hit-count">{formatPeople(count)}</span>
              {total > 0 ? (
                <div className="match-profile-hit-meter" aria-hidden="true">
                  <span className="match-profile-hit-meter-fill" style={{ width: `${share}%` }} />
                </div>
              ) : (
                <span className="match-profile-hit-meter match-profile-hit-meter--empty" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MatchProfileModal({ match, onClose }: Props) {
  const [profile, setProfile] = useState<MatchProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useDialogA11y(true, onClose, dialogRef);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .getMatchProfile(match.id)
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
  }, [match.id]);

  const m = profile?.match ?? match;
  const hasActual = profile != null;
  const hasScore = m.homeScore != null && m.awayScore != null;

  return (
    <ModalPortal>
      <div className="sheet-overlay-above-nav" onClick={onClose} role="presentation">
        <div
          ref={dialogRef}
          className="match-profile-modal sheet-modal-above-nav"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={e => e.stopPropagation()}
        >
          <button
            type="button"
            className="match-profile-handle sheet-modal-handle"
            onClick={onClose}
            aria-label="Свернуть"
          />
          <button type="button" className="match-profile-close sheet-modal-icon-close" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>

          <header className="match-profile-header">
            <span className="match-profile-label">Профиль матча</span>

            <div className="match-profile-scoreboard" id={titleId}>
              <p className="match-profile-board-meta">
                <span>{stageLabel(m.stage, m.group)}</span>
              </p>
              <p className="match-profile-board-datetime">{formatMatchKickoffLine(m.kickoff)}</p>

              <div
                className="match-profile-board-main"
                aria-label={`${m.homeTeam.name} ${hasScore ? `${m.homeScore}:${m.awayScore}` : ''} ${m.awayTeam.name}`}
              >
                <div className="match-profile-team home">
                  <img
                    className="match-profile-flag"
                    src={m.homeTeam.flag}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                  />
                  <span className="match-profile-team-name">{m.homeTeam.name}</span>
                </div>

                <div className="match-profile-board-center">
                  {hasScore ? (
                    <div className="match-profile-score">
                      <span>{m.homeScore}</span>
                      <span className="sep">:</span>
                      <span>{m.awayScore}</span>
                    </div>
                  ) : (
                    <span className="match-profile-score-pending">— : —</span>
                  )}
                </div>

                <div className="match-profile-team away">
                  <img
                    className="match-profile-flag"
                    src={m.awayTeam.flag}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                  />
                  <span className="match-profile-team-name">{m.awayTeam.name}</span>
                </div>
              </div>
            </div>

            {profile?.userPrediction && (
              <div className="match-profile-user-pred">
                Ваш прогноз: {profile.userPrediction.homeScore}:{profile.userPrediction.awayScore}
                {profile.userPrediction.points != null && (
                  <span className="match-profile-user-points"> · +{profile.userPrediction.points}</span>
                )}
              </div>
            )}
          </header>

          {loading && (
            <div className="match-profile-loading" role="status">
              Загрузка…
            </div>
          )}

          {error && !loading && (
            <div className="match-profile-error" role="alert">
              {error}
            </div>
          )}

          {profile && !error && (
            <div className="match-profile-scroll">
              <section className="match-profile-section">
                <h3 className="match-profile-section-title">Составы</h3>
                <div className="match-profile-lineups">
                  <LineupBlock
                    teamName={profile.match.homeTeam.name}
                    flag={profile.match.homeTeam.flag}
                    players={profile.lineups.home}
                  />
                  <LineupBlock
                    teamName={profile.match.awayTeam.name}
                    flag={profile.match.awayTeam.flag}
                    players={profile.lineups.away}
                  />
                </div>
              </section>

              <section className="match-profile-section">
                <h3 className="match-profile-section-title">Голы</h3>
                {profile.goals.length === 0 ? (
                  <p className="match-profile-empty match-profile-goals-empty">Голы не зафиксированы</p>
                ) : (
                  <ul className="match-profile-goals">
                    {profile.goals.map((g, i) => {
                      const team = g.side === 'home' ? profile.match.homeTeam : profile.match.awayTeam;
                      return (
                        <li key={`${g.side}-${i}`} className="match-profile-goal">
                          <span className="match-profile-goal-minute" aria-hidden="true">
                            <IconBall size={14} />
                          </span>
                          <img src={team.flag} alt="" aria-hidden="true" loading="lazy" />
                          <div className="match-profile-goal-main">
                            <span className="match-profile-goal-scorer">{g.scorerName}</span>
                            {g.assistName && (
                              <span className="match-profile-goal-assist">
                                <IconPass size={12} />
                                {g.assistName}
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {hasPublicConsensus(profile.predictions.consensus) && (
                <section className="match-profile-section">
                  <h3 className="match-profile-section-title">Мнение пользователей</h3>
                  <div className="modal-consensus match-profile-consensus">
                    <MatchConsensusBar
                      consensus={profile.predictions.consensus}
                      homeTeamName={profile.match.homeTeam.name}
                      awayTeamName={profile.match.awayTeam.name}
                    />
                  </div>
                </section>
              )}

              <section className="match-profile-section match-profile-predictions-section">
                <h3 className="match-profile-section-title">Статистика прогнозов</h3>

                <PredictionHitsGrid
                  exactHits={profile.predictions.exactHits}
                  differenceHits={profile.predictions.differenceHits}
                  outcomeHits={profile.predictions.outcomeHits}
                  total={profile.predictions.total}
                />

                {profile.predictions.topScores.length > 0 && (
                  <>
                    <h4 className="match-profile-subtitle">Популярные счета</h4>
                    <ul className="match-profile-top-scores">
                      {profile.predictions.topScores.map(s => (
                        <li
                          key={`${s.homeScore}-${s.awayScore}`}
                          className={`match-profile-top-score ${s.isExactResult ? 'exact' : ''}`}
                        >
                          <span className="score">
                            {s.homeScore}:{s.awayScore}
                            {s.isExactResult && <span className="exact-badge">✓</span>}
                          </span>
                          <span className="bar-wrap" aria-hidden="true">
                            <span className="bar" style={{ width: `${Math.max(s.percent, 4)}%` }} />
                          </span>
                          <span className="meta">
                            {formatPredictions(s.count)} · {s.percent}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {profile.predictions.total > 0 && (
                  <p className="match-profile-pred-total">
                    Всего {formatPredictions(profile.predictions.total)}
                  </p>
                )}
              </section>

              {profile.topUsers.length > 0 && (
                <section className="match-profile-section">
                  <h3 className="match-profile-section-title">Топ за матч</h3>
                  <p className="match-profile-top-hint">
                    Прогноз + fantasy за эту игру
                  </p>
                  <ol className="match-profile-top-users">
                    {profile.topUsers.map(u => (
                      <li key={u.id} className={`match-profile-top-user top${u.rank}`}>
                        <span className="match-profile-top-rank" aria-hidden="true">
                          {rankEmoji(u.rank)}
                        </span>
                        <UserAvatar
                          firstName={u.firstName}
                          lastName={u.lastName}
                          photoUrl={u.photoUrl}
                          variant="leader"
                          className="match-profile-top-avatar"
                        />
                        <div className="match-profile-top-info">
                          <span className="match-profile-top-name">
                            {displayName(u.firstName, u.lastName)}
                          </span>
                          <span className="match-profile-top-breakdown">
                            {[
                              u.predictionPoints > 0 ? `прогноз +${u.predictionPoints}` : null,
                              u.fantasyPoints > 0 ? `fantasy +${u.fantasyPoints}` : null,
                            ]
                              .filter(Boolean)
                              .join(' · ') || '—'}
                          </span>
                        </div>
                        <span className="match-profile-top-total">
                          +{u.totalPoints}
                          <span className="match-profile-top-total-label">{formatPointsWord(u.totalPoints)}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </div>
          )}

          {!loading && !profile && !error && hasActual && (
            <p className="match-profile-empty match-profile-empty--standalone">Профиль недоступен</p>
          )}

          <SheetModalCloseFooter onClose={onClose} />
        </div>
      </div>
    </ModalPortal>
  );
}
