import type { ReactNode } from 'react';
import { IconBall, IconSquad, IconTrophy } from './Icons';
import { pointsToneClass } from '../utils';

interface Props {
  matchPoints: number;
  tournamentPoints: number;
  squadPoints: number;
  compact?: boolean;
}

function PtsChip({
  value,
  className,
  title,
  icon,
}: {
  value: number;
  className: string;
  title: string;
  icon: ReactNode;
}) {
  if (value === 0) return null;
  return (
    <span className={`lb-pts-chip ${className} ${pointsToneClass(value)}`} title={title}>
      {icon}
      {value}
    </span>
  );
}

export function LeaderPointsStrip({ matchPoints, tournamentPoints, squadPoints, compact }: Props) {
  if (matchPoints === 0 && tournamentPoints === 0 && squadPoints === 0) return null;

  const iconSize = compact ? 10 : 12;

  return (
    <div className={`lb-points-strip ${compact ? 'compact' : ''}`} aria-label="Очки по категориям">
      <PtsChip
        value={matchPoints}
        className="match"
        title="Матчи"
        icon={<IconBall size={iconSize} aria-hidden="true" />}
      />
      <PtsChip
        value={tournamentPoints}
        className="tour"
        title="Турнир"
        icon={<IconTrophy size={iconSize} aria-hidden="true" />}
      />
      <PtsChip
        value={squadPoints}
        className="squad"
        title="Команда"
        icon={<IconSquad size={iconSize} aria-hidden="true" />}
      />
    </div>
  );
}
