import { memo } from 'react';
import type { Match } from '../types';
import type { MatchDayGroup } from '../utils';
import { MatchCard } from './MatchCard';
import { DateHeader } from './DateHeader';
import { IconBall } from './Icons';

interface Props {
  dateGroups: MatchDayGroup<Match>[];
  doublePicks: Record<string, number>;
  emptyMessage: string;
  onSelectMatch: (match: Match) => void;
  onOpenProfile: (match: Match) => void;
}

export const MatchesDateList = memo(function MatchesDateList({
  dateGroups,
  doublePicks,
  emptyMessage,
  onSelectMatch,
  onOpenProfile,
}: Props) {
  if (dateGroups.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">
          <IconBall size={48} />
        </div>
        <h3>Нет матчей</h3>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {dateGroups.map(({ key, dayMatches }) => (
        <div key={key} className="date-group">
          <DateHeader
            kickoff={dayMatches[0].kickoff}
            matchCount={dayMatches.length}
            hasDouble={!!doublePicks[dayMatches[0].gameDay]}
          />
          {dayMatches.map(m => (
            <MatchCard
              key={m.id}
              match={m}
              onClick={() => onSelectMatch(m)}
              onProfile={m.status === 'finished' ? () => onOpenProfile(m) : undefined}
            />
          ))}
        </div>
      ))}
    </>
  );
});
