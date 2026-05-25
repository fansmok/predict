import { IconBall, IconGlove, IconGoalConceded, IconPass, IconRedCard, IconSquad, IconTrophy } from './Icons';
import type { SquadPlayerPoints } from '../types';
import { formatPoints, ruPlural, pointsToneClass } from '../utils';
import { SQUAD_SCORING, formatSquadPoints, squadCategoryPoints } from '../squadScoring';

interface Props {
  points: SquadPlayerPoints;
  variant?: 'profile' | 'inline';
}

const ROWS = [
  {
    key: 'wins' as const,
    scoringKey: 'win' as const,
    Icon: IconTrophy,
    tone: 'gold',
    label: 'Победы сборных',
    unit: 'победа',
    unitFew: 'победы',
    unitMany: 'побед',
  },
  {
    key: 'goals' as const,
    scoringKey: 'goal' as const,
    Icon: IconBall,
    tone: 'accent',
    label: 'Голы',
    unit: 'гол',
    unitFew: 'гола',
    unitMany: 'голов',
  },
  {
    key: 'assists' as const,
    scoringKey: 'assist' as const,
    Icon: IconPass,
    tone: 'blue',
    label: 'Голевые передачи',
    unit: 'передача',
    unitFew: 'передачи',
    unitMany: 'передач',
  },
  {
    key: 'cleanSheets' as const,
    scoringKey: 'cleanSheet' as const,
    Icon: IconGlove,
    tone: 'blue',
    label: 'Сухие матчи',
    unit: 'матч',
    unitFew: 'матча',
    unitMany: 'матчей',
  },
  {
    key: 'goalsConceded' as const,
    scoringKey: 'goalConceded' as const,
    Icon: IconGoalConceded,
    tone: 'red',
    label: 'Пропущенные голы',
    unit: 'гол',
    unitFew: 'гола',
    unitMany: 'голов',
  },
  {
    key: 'sentOffs' as const,
    scoringKey: 'sentOff' as const,
    Icon: IconRedCard,
    tone: 'red',
    label: 'Удаления',
    unit: 'удаление',
    unitFew: 'удаления',
    unitMany: 'удалений',
  },
];

export function SquadPointsBreakdown({ points, variant = 'profile' }: Props) {
  const activeRows = ROWS.filter(r => (points[r.key] ?? 0) > 0);

  if (variant === 'inline') {
    return (
      <div className="squad-pts-inline">
        {activeRows.map(({ key, Icon, tone }) => (
          <span key={key} className={`squad-pts-inline-chip ${tone}`}>
            <Icon size={13} /> {points[key]}
          </span>
        ))}
        {activeRows.length === 0 && (
          <span className="squad-pts-inline-empty">Пока {formatPoints(0)}</span>
        )}
      </div>
    );
  }

  return (
    <div className="fantasy-breakdown">
      <div className="fantasy-breakdown-header">
        <div className="fantasy-breakdown-icon">
          <IconSquad size={22} />
        </div>
        <div className="fantasy-breakdown-total-wrap">
          <span className={`fantasy-breakdown-total ${pointsToneClass(points.total)}`}>
            {points.total}
          </span>
          <span className="fantasy-breakdown-total-label">ОЧКИ за fantasy-команду</span>
        </div>
      </div>

      {activeRows.length > 0 ? (
        <div className="fantasy-breakdown-rows">
          {activeRows.map(({ key, scoringKey, Icon, tone, label, unit, unitFew, unitMany }) => {
            const count = points[key] ?? 0;
            const perEvent = SQUAD_SCORING[scoringKey];
            const pts = squadCategoryPoints(scoringKey, count);
            return (
              <div key={key} className={`fantasy-breakdown-row ${tone}`}>
                <div className={`fantasy-breakdown-row-icon ${tone}`}>
                  <Icon size={16} />
                </div>
                <div className="fantasy-breakdown-row-text">
                  <span className="fantasy-breakdown-row-label">{label}</span>
                  <span className="fantasy-breakdown-row-formula">
                    {count} {ruPlural(count, unit, unitFew, unitMany)} × {formatSquadPoints(perEvent)} очк.
                  </span>
                </div>
                <span className={`fantasy-breakdown-row-pts ${tone}`}>{formatSquadPoints(pts)}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="fantasy-breakdown-empty">
          Очки начисляются за победы, голы, передачи и сухие матчи; штрафы — за пропущенные голы и удаления.
        </p>
      )}

      {activeRows.length > 0 && (
        <div className="fantasy-breakdown-sum">
          <span>Итого</span>
          <span className={pointsToneClass(points.total)}>{formatPoints(points.total)}</span>
        </div>
      )}
    </div>
  );
}
