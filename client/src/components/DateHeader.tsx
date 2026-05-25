import { formatMatchDayHeader, formatMatches } from '../utils';

interface Props {
  kickoff: string;
  matchCount?: number;
  hasDouble?: boolean;
}

export function DateHeader({ kickoff, matchCount, hasDouble }: Props) {
  const { dayNum, monthShort, weekday, label, dayIndex } = formatMatchDayHeader(kickoff);

  return (
    <div className="date-header">
      <div className="date-header-left">
        <div className="date-badge">
          <span className="date-badge-day">{dayNum}</span>
          <span className="date-badge-month">{monthShort}</span>
        </div>
        <div className="date-header-text">
          <span className="date-weekday">{weekday}</span>
          <span className="date-label">{label}</span>
        </div>
      </div>
      <div className="date-header-right">
        {matchCount !== undefined && (
          <span className="date-match-count">{formatMatches(matchCount)}</span>
        )}
        {dayIndex > 0 && <span className="date-tour-day">День {dayIndex}</span>}
        {hasDouble && <span className="date-double-tag">×2</span>}
      </div>
    </div>
  );
}
