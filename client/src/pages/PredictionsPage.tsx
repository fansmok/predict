import { useEffect, useMemo, useState } from 'react';
import { Match } from '../types';
import { MatchCard } from '../components/MatchCard';
import { ScorePicker } from '../components/ScorePicker';
import { formatMatches, groupMatchesByDateSorted, formatMatchDayTitle } from '../utils';
import { IconTarget } from '../components/Icons';

interface Props {
  tabActive?: boolean;
  matches: Match[];
  doublePicks: Record<string, number>;
  onSavePrediction: (matchId: number, home: number, away: number, useDouble?: boolean) => Promise<void>;
}

function PredictionsMatchSection({
  title,
  hint,
  matchGroups,
  doublePicks,
  onSelectMatch,
}: {
  title: string;
  hint?: string;
  matchGroups: ReturnType<typeof groupMatchesByDateSorted<Match>>;
  doublePicks: Record<string, number>;
  onSelectMatch: (match: Match) => void;
}) {
  if (matchGroups.length === 0) return null;

  return (
    <section className="predictions-block">
      <div className="predictions-block-head">
        <h3 className="predictions-block-title">{title}</h3>
        {hint && <p className="predictions-block-hint">{hint}</p>}
      </div>
      {matchGroups.map(({ key, dayMatches }) => (
        <div key={key} className="date-group">
          <p className="date-divider">
            {formatMatchDayTitle(dayMatches[0].kickoff)}
            {doublePicks[dayMatches[0].gameDay] && (
              <span className="date-divider-double"> · ×2</span>
            )}
            <span className="date-divider-count"> · {formatMatches(dayMatches.length)}</span>
          </p>
          {dayMatches.map(m => (
            <MatchCard
              key={m.id}
              match={m}
              showKickoffDate
              onClick={() => onSelectMatch(m)}
            />
          ))}
        </div>
      ))}
    </section>
  );
}

export function PredictionsPage({
  tabActive = true,
  matches,
  doublePicks,
  onSavePrediction,
}: Props) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  useEffect(() => {
    if (!tabActive) setSelectedMatch(null);
  }, [tabActive]);

  const { pending, editable } = useMemo(() => {
    const open = matches.filter(m => m.canPredict);
    return {
      pending: open.filter(m => !m.prediction),
      editable: open.filter(m => !!m.prediction),
    };
  }, [matches]);

  const pendingGroups = useMemo(() => groupMatchesByDateSorted(pending, 'asc'), [pending]);
  const editableGroups = useMemo(() => groupMatchesByDateSorted(editable, 'asc'), [editable]);

  const isEmpty = pending.length === 0 && editable.length === 0;

  return (
    <>
      <div className="predictions-summary">
        <div className="summary-chip highlight">
          <div className="value">{pending.length}</div>
          <div className="label">Нужен прогноз</div>
        </div>
        <div className="summary-chip">
          <div className="value">{editable.length}</div>
          <div className="label">Можно изменить</div>
        </div>
      </div>

      <div className="predictions-section-label">
        <IconTarget size={16} aria-hidden="true" />
        <span className="predictions-section-title">Прогнозы на матчи</span>
        {pending.length > 0 && (
          <span className="predictions-section-badge pending">{formatMatches(pending.length)} ждут</span>
        )}
      </div>

      {isEmpty ? (
        <div className="empty-state compact">
          <p>Нет открытых матчей для прогноза — загляните в «МАТЧ ЦЕНТР»</p>
        </div>
      ) : (
        <>
          <PredictionsMatchSection
            title="Нужен прогноз"
            hint="Матчи без вашего счёта — сделайте прогноз до начала"
            matchGroups={pendingGroups}
            doublePicks={doublePicks}
            onSelectMatch={setSelectedMatch}
          />
          <PredictionsMatchSection
            title="Можно изменить"
            hint="Прогноз уже есть — можно обновить до старта матча"
            matchGroups={editableGroups}
            doublePicks={doublePicks}
            onSelectMatch={setSelectedMatch}
          />
        </>
      )}

      {selectedMatch && (
        <ScorePicker
          match={selectedMatch}
          matches={matches}
          doublePicks={doublePicks}
          onSave={(h, a, useDouble) => onSavePrediction(selectedMatch.id, h, a, useDouble)}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </>
  );
}
