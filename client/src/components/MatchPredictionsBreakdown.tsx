import { IconBall, IconTarget } from './Icons';
import type { UserStats } from '../types';
import { formatPoints, ruPlural } from '../utils';

interface Props {
  stats: UserStats;
}

const ROWS = [
  {
    key: 'exact' as const,
    Icon: IconBall,
    tone: 'gold',
    label: 'Точный счёт',
    unit: 'счёт',
    unitFew: 'счёта',
    unitMany: 'счетов',
    pointLabel: '5 или 10 очков',
  },
  {
    key: 'difference' as const,
    Icon: IconTarget,
    tone: 'accent',
    label: 'Разница мячей',
    unit: 'разница',
    unitFew: 'разницы',
    unitMany: 'разниц',
    pointLabel: '3 или 6 очков',
  },
  {
    key: 'outcome' as const,
    Icon: IconTarget,
    tone: 'blue',
    label: 'Исход матча',
    unit: 'исход',
    unitFew: 'исхода',
    unitMany: 'исходов',
    pointLabel: '2 или 4 очка',
  },
];

export function MatchPredictionsBreakdown({ stats }: Props) {
  const b = stats.predictionBreakdown;
  const rowData = {
    exact: { count: b.exactCount, points: b.exactPoints },
    difference: { count: b.differenceCount, points: b.differencePoints },
    outcome: { count: b.outcomeCount, points: b.outcomePoints },
  };

  const activeRows = ROWS.filter(r => rowData[r.key].count > 0);
  const hasAny = stats.totalPredictions > 0;
  const hasScored = stats.scoredPredictions > 0;

  return (
    <div className="fantasy-breakdown predictions-breakdown">
      <div className="fantasy-breakdown-header">
        <div className="fantasy-breakdown-icon">
          <IconBall size={22} />
        </div>
        <div className="fantasy-breakdown-total-wrap">
          <span className="fantasy-breakdown-total">{stats.matchPoints}</span>
          <span className="fantasy-breakdown-total-label">ОЧКИ за матчи</span>
        </div>
      </div>

      {hasAny && (
        <p className="predictions-breakdown-meta">
          {stats.totalPredictions}{' '}
          {ruPlural(stats.totalPredictions, 'прогноз', 'прогноза', 'прогнозов')}
          {stats.goodPredictions > 0 && (
            <>
              {' · '}
              угадал {stats.goodPredictions}
            </>
          )}
        </p>
      )}

      {activeRows.length > 0 ? (
        <div className="fantasy-breakdown-rows">
          {activeRows.map(({ key, Icon, tone, label, unit, unitFew, unitMany, pointLabel }) => {
            const { count, points } = rowData[key];
            return (
              <div key={key} className={`fantasy-breakdown-row ${tone}`}>
                <div className={`fantasy-breakdown-row-icon ${tone}`}>
                  <Icon size={16} />
                </div>
                <div className="fantasy-breakdown-row-text">
                  <span className="fantasy-breakdown-row-label">{label}</span>
                  <span className="fantasy-breakdown-row-formula">
                    {count} {ruPlural(count, unit, unitFew, unitMany)} · {pointLabel}
                  </span>
                </div>
                <span className={`fantasy-breakdown-row-pts ${tone}`}>{formatPoints(points)}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="fantasy-breakdown-empty">
          {hasAny
            ? 'Очки появятся после завершения матчей с вашими прогнозами.'
            : 'Сделайте прогнозы на матчи — здесь появится детальная статистика.'}
        </p>
      )}

      {hasScored && (
        <div className="fantasy-breakdown-sum">
          <span>Итого</span>
          <span>{formatPoints(stats.matchPoints)}</span>
        </div>
      )}
    </div>
  );
}
