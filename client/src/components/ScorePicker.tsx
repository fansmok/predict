import { useState, useRef, useId } from 'react';
import { Match } from '../types';
import { formatTime, hasPublicConsensus, stageLabel, shouldAutoDoublePoints } from '../utils';
import { ModalPortal } from './ModalPortal';
import { MatchConsensusBar } from './MatchConsensusBar';
import { useDialogA11y } from '../hooks/useDialogA11y';

interface Props {
  match: Match;
  matches: Match[];
  doublePicks: Record<string, number>;
  onSave: (homeScore: number, awayScore: number, useDouble?: boolean) => Promise<void>;
  onClose: () => void;
}

export function ScorePicker({ match, matches, doublePicks, onSave, onClose }: Props) {
  const autoDouble = shouldAutoDoublePoints(match, matches, doublePicks);
  const [home, setHome] = useState(match.prediction?.homeScore ?? 0);
  const [away, setAway] = useState(match.prediction?.awayScore ?? 0);
  const [useDouble, setUseDouble] = useState(match.isDouble || autoDouble);
  const [doubleTouched, setDoubleTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useDialogA11y(true, onClose, dialogRef);

  const otherDoubleMatchId = (doublePicks ?? {})[match.gameDay];
  const doubleTakenByOther = otherDoubleMatchId != null && otherDoubleMatchId !== match.id;

  const adjust = (side: 'home' | 'away', delta: number) => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    if (side === 'home') setHome(v => Math.max(0, Math.min(15, v + delta)));
    else setAway(v => Math.max(0, Math.min(15, v + delta)));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const applyDouble = doubleTouched
        ? useDouble
        : useDouble || (autoDouble && !doubleTakenByOther);
      await onSave(home, away, applyDouble);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения');
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error');
    } finally {
      setSaving(false);
    }
  };

  const homeName = match.homeTeam.name;
  const awayName = match.awayTeam.name;

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={onClose} role="presentation">
        <div
          ref={dialogRef}
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={e => e.stopPropagation()}
        >
          <div className="modal-handle" aria-hidden="true" />

          <div className="modal-header">
            <div className="stage">{stageLabel(match.stage, match.group)}</div>
            <div className="teams-title" id={titleId}>
              {homeName} — {awayName}
            </div>
            <div className="kickoff">{formatTime(match.kickoff)}</div>
          </div>

          {hasPublicConsensus(match.consensus) && (
            <div className="modal-consensus">
              <MatchConsensusBar
                consensus={match.consensus}
                homeTeamName={homeName}
                awayTeamName={awayName}
              />
            </div>
          )}

          <div className="score-picker">
            <div className="score-column">
              <div className="team-info">
                <img src={match.homeTeam.flag} alt="" aria-hidden="true" />
                <span>{homeName}</span>
              </div>
              <div className="score-controls">
                <button
                  type="button"
                  className="score-btn"
                  onClick={() => adjust('home', 1)}
                  aria-label={`Увеличить счёт: ${homeName}`}
                >
                  +
                </button>
                <div className="score-value" aria-live="polite" aria-atomic="true">
                  {home}
                </div>
                <button
                  type="button"
                  className="score-btn"
                  onClick={() => adjust('home', -1)}
                  aria-label={`Уменьшить счёт: ${homeName}`}
                >
                  −
                </button>
              </div>
            </div>

            <div className="score-separator" aria-hidden="true">:</div>

            <div className="score-column">
              <div className="team-info">
                <img src={match.awayTeam.flag} alt="" aria-hidden="true" />
                <span>{awayName}</span>
              </div>
              <div className="score-controls">
                <button
                  type="button"
                  className="score-btn"
                  onClick={() => adjust('away', 1)}
                  aria-label={`Увеличить счёт: ${awayName}`}
                >
                  +
                </button>
                <div className="score-value" aria-live="polite" aria-atomic="true">
                  {away}
                </div>
                <button
                  type="button"
                  className="score-btn"
                  onClick={() => adjust('away', -1)}
                  aria-label={`Уменьшить счёт: ${awayName}`}
                >
                  −
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            className={`double-toggle ${useDouble ? 'active' : ''} ${doubleTakenByOther ? 'disabled' : ''}`}
            onClick={() => {
              if (doubleTakenByOther) return;
              setDoubleTouched(true);
              setUseDouble(v => !v);
              window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
            }}
            disabled={doubleTakenByOther}
            aria-pressed={useDouble}
          >
            <span className="double-icon" aria-hidden="true">×2</span>
            <span className="double-text">
              {useDouble
                ? autoDouble && !match.isDouble && !doubleTouched
                  ? 'Удвоение включено — последний матч дня без прогноза'
                  : 'Удвоение очков включено'
                : doubleTakenByOther
                  ? '×2 уже выбран на другой матч этого дня'
                  : 'Удвоить очки за этот матч'}
            </span>
          </button>

          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}

          <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Сохранение...' : match.prediction ? 'Обновить прогноз' : 'Сохранить прогноз'}
          </button>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Отмена
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}
