import { useState, useMemo, useCallback, useEffect, startTransition } from 'react';
import { Match, TournamentData, TournamentOption } from '../types';
import { ScorePicker } from '../components/ScorePicker';
import { TournamentPicks } from '../components/TournamentPicks';
import {
  groupMatchesByDate,
  sortMatchesByKickoff,
  groupAllTabMatchesByDate,
  type MatchDayGroup,
} from '../utils';
import { IconSquad } from '../components/Icons';
import { GroupFilterTabs, isGroupTab, FINISHED_TAB } from '../components/GroupFilterTabs';
import { GroupStandingsTable } from '../components/GroupStandingsTable';
import { PendingPredictionsBanner } from '../components/PendingPredictionsBanner';
import { CreateLeaguePromo } from '../components/CreateLeaguePromo';
import { MatchProfileModal } from '../components/MatchProfileModal';
import { MatchesDateList } from '../components/MatchesDateList';
import { MatchFilterPanel } from '../components/MatchFilterPanel';
import { WC_GROUPS } from '../wc-groups';

interface Props {
  matches: Match[];
  doublePicks: Record<string, number>;
  tournament: TournamentData;
  tournamentTeams: TournamentOption[];
  tournamentPlayers: TournamentOption[];
  squadComplete: boolean;
  pendingPredictions: number;
  showTournamentPicks: boolean;
  showLeaguePromo?: boolean;
  canCreateLeague?: boolean;
  ownedLeagueCount?: number;
  maxOwnedLeagues?: number;
  onOpenCreateLeague?: () => void;
  onSavePrediction: (matchId: number, home: number, away: number, useDouble?: boolean) => Promise<void>;
  onSaveTournament: (picks: {
    winnerTeamId?: string;
    secondTeamId?: string;
    thirdTeamId?: string;
    topScorerPlayerId?: string;
  }) => Promise<void>;
  onGoToSquad?: () => void;
  onGoToPredictions?: () => void;
}

function buildDateGroups(list: Match[]): MatchDayGroup<Match>[] {
  return [...groupMatchesByDate(list).entries()].map(([gameDay, dayMatches]) => ({
    key: gameDay,
    dayMatches,
  }));
}

export function MatchesPage({
  matches,
  doublePicks,
  tournament,
  tournamentTeams,
  tournamentPlayers,
  onSavePrediction,
  onSaveTournament,
  onGoToSquad,
  onGoToPredictions,
  squadComplete,
  pendingPredictions,
  showTournamentPicks,
  showLeaguePromo = false,
  canCreateLeague = true,
  ownedLeagueCount = 0,
  maxOwnedLeagues = 5,
  onOpenCreateLeague,
}: Props) {
  const [group, setGroup] = useState('all');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [profileMatch, setProfileMatch] = useState<Match | null>(null);
  const [mountedFilters, setMountedFilters] = useState<Set<string>>(() => new Set(['all', FINISHED_TAB]));

  const allDateGroups = useMemo(() => groupAllTabMatchesByDate(matches), [matches]);

  const finishedDateGroups = useMemo(
    () =>
      buildDateGroups(
        sortMatchesByKickoff(
          matches.filter(m => m.status === 'finished'),
          'desc'
        )
      ),
    [matches]
  );

  const groupDateGroupsMap = useMemo(() => {
    const map = new Map<string, MatchDayGroup<Match>[]>();
    for (const g of WC_GROUPS) {
      map.set(g, buildDateGroups(matches.filter(m => m.group === g)));
    }
    return map;
  }, [matches]);

  useEffect(() => {
    setMountedFilters(prev => {
      if (prev.has(group)) return prev;
      const next = new Set(prev);
      next.add(group);
      return next;
    });
  }, [group]);

  const setGroupFilter = useCallback((next: string) => {
    startTransition(() => setGroup(next));
  }, []);

  const handleSelectMatch = useCallback((match: Match) => {
    if (!match.canPredict) return;
    setSelectedMatch(match);
  }, []);

  const handleOpenProfile = useCallback((match: Match) => {
    setProfileMatch(match);
  }, []);

  return (
    <>
      <div className="page-stack">
        {pendingPredictions > 0 && onGoToPredictions && (
          <PendingPredictionsBanner count={pendingPredictions} onClick={onGoToPredictions} />
        )}

        {onGoToSquad && !squadComplete && (
          <button type="button" className="squad-cta squad-cta-pulse" onClick={onGoToSquad}>
            <span className="squad-cta-icon">
              <IconSquad size={24} />
            </span>
            <span className="squad-cta-text">
              <strong>Собрать команду</strong>
              <span>11 игроков на поле · схема 4-3-3</span>
            </span>
            <span className="squad-cta-arrow">→</span>
          </button>
        )}

        {showLeaguePromo && onOpenCreateLeague && (
          <CreateLeaguePromo
            featured
            disabled={!canCreateLeague}
            ownedCount={ownedLeagueCount}
            maxOwned={maxOwnedLeagues}
            onClick={() => {
              if (canCreateLeague) onOpenCreateLeague();
            }}
          />
        )}

        {showTournamentPicks && (
          <TournamentPicks
            data={tournament}
            teams={tournamentTeams}
            players={tournamentPlayers}
            matches={matches}
            onSave={onSaveTournament}
          />
        )}

        <GroupFilterTabs active={group} onChange={setGroupFilter} />

        {isGroupTab(group) && <GroupStandingsTable group={group} matches={matches} />}

        <div className="matches-filter-views">
          {mountedFilters.has('all') && (
            <MatchFilterPanel active={group === 'all'}>
              <MatchesDateList
                dateGroups={allDateGroups}
                doublePicks={doublePicks}
                emptyMessage="Нет матчей"
                onSelectMatch={handleSelectMatch}
                onOpenProfile={handleOpenProfile}
              />
            </MatchFilterPanel>
          )}

          {mountedFilters.has(FINISHED_TAB) && (
            <MatchFilterPanel active={group === FINISHED_TAB}>
              <MatchesDateList
                dateGroups={finishedDateGroups}
                doublePicks={doublePicks}
                emptyMessage="Пока нет завершённых матчей"
                onSelectMatch={handleSelectMatch}
                onOpenProfile={handleOpenProfile}
              />
            </MatchFilterPanel>
          )}

          {WC_GROUPS.map(g => {
            if (!mountedFilters.has(g)) return null;
            return (
              <MatchFilterPanel key={g} active={group === g}>
                <MatchesDateList
                  dateGroups={groupDateGroupsMap.get(g) ?? []}
                  doublePicks={doublePicks}
                  emptyMessage="Выберите другую группу"
                  onSelectMatch={handleSelectMatch}
                  onOpenProfile={handleOpenProfile}
                />
              </MatchFilterPanel>
            );
          })}
        </div>
      </div>

      {selectedMatch && (
        <ScorePicker
          match={selectedMatch}
          matches={matches}
          doublePicks={doublePicks}
          onSave={(h, a, useDouble) => onSavePrediction(selectedMatch.id, h, a, useDouble)}
          onClose={() => setSelectedMatch(null)}
        />
      )}

      {profileMatch && (
        <MatchProfileModal match={profileMatch} onClose={() => setProfileMatch(null)} />
      )}
    </>
  );
}
