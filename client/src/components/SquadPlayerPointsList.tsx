import { useEffect, useState } from 'react';
import { GlobalSquadPlayerRanking, SquadPlayerOption, SquadPosition } from '../types';
import { IconBall, IconGoalConceded, IconGlove, IconPass, IconRedCard, IconTrophy } from './Icons';
import { formatPoints, ruCount, ruPlural } from '../utils';
import { api } from '../api';

interface Props {
  players: SquadPlayerOption[];
}

type PointsTab = 'my' | 'global';

const POS_LABEL: Record<SquadPosition, string> = {
  GK: 'ВР',
  DEF: 'ЗЩ',
  MID: 'ПЗ',
  FWD: 'НП',
};

function PlayerBreakdown({ points }: { points: NonNullable<SquadPlayerOption['points']> }) {
  const items: Array<{ key: string; Icon: typeof IconTrophy; tone: string; text: string }> = [];

  if (points.wins > 0) {
    items.push({
      key: 'w',
      Icon: IconTrophy,
      tone: 'gold',
      text: ruCount(points.wins, 'победа', 'победы', 'побед'),
    });
  }
  if (points.goals > 0) {
    items.push({
      key: 'g',
      Icon: IconBall,
      tone: 'accent',
      text: ruCount(points.goals, 'гол', 'гола', 'голов'),
    });
  }
  if (points.assists > 0) {
    items.push({
      key: 'a',
      Icon: IconPass,
      tone: 'blue',
      text: ruCount(points.assists, 'передача', 'передачи', 'передач'),
    });
  }
  if (points.cleanSheets > 0) {
    items.push({
      key: 'c',
      Icon: IconGlove,
      tone: 'blue',
      text: ruCount(points.cleanSheets, 'сухой матч', 'сухих матча', 'сухих матчей'),
    });
  }
  if ((points.goalsConceded ?? 0) > 0) {
    items.push({
      key: 'gc',
      Icon: IconGoalConceded,
      tone: 'red',
      text: ruCount(points.goalsConceded ?? 0, 'пропущенный гол', 'пропущенных гола', 'пропущенных голов'),
    });
  }
  if ((points.sentOffs ?? 0) > 0) {
    items.push({
      key: 'so',
      Icon: IconRedCard,
      tone: 'red',
      text: ruCount(points.sentOffs ?? 0, 'удаление', 'удаления', 'удалений'),
    });
  }

  if (items.length === 0) {
    return <span className="squad-player-pts-none">{formatPoints(0)}</span>;
  }

  return (
    <div className="squad-player-pts-events">
      {items.map(({ key, Icon, tone, text }) => (
        <span key={key} className={`squad-player-pts-event ${tone}`}>
          <Icon size={12} />
          <span>{text}</span>
        </span>
      ))}
    </div>
  );
}

function PlayerPointsRow({
  player,
  rank,
  pickedCount,
  highlightInMySquad,
  loserRank,
}: {
  player: SquadPlayerOption;
  rank?: number;
  pickedCount?: number;
  highlightInMySquad?: boolean;
  loserRank?: number;
}) {
  const pts = player.points?.total ?? 0;
  const isTop = rank === 1 && pts > 0;
  const isWorstLoser = loserRank === 1 && pts < 0;

  return (
    <div
      className={`squad-player-points-row ${pts > 0 ? 'scoring' : pts < 0 ? 'penalty' : ''} ${isTop ? 'top' : ''} ${isWorstLoser ? 'worst-loser' : ''} ${highlightInMySquad ? 'in-my-squad' : ''}`}
    >
      {rank != null && (
        <span className={`squad-player-points-rank ${rank <= 3 ? `rank-${rank}` : ''}`} aria-hidden="true">
          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
        </span>
      )}
      {loserRank != null && (
        <span className="squad-player-points-rank loser" aria-hidden="true">
          {loserRank === 1 ? '💀' : loserRank}
        </span>
      )}
      <img className="squad-player-points-flag" src={player.flag} alt="" aria-hidden="true" />
      <div className="squad-player-points-info">
        <div className="squad-player-points-name-row">
          <span className="squad-player-points-name">{player.name}</span>
          <span className={`squad-pos-badge pos-${player.position.toLowerCase()}`}>
            {POS_LABEL[player.position]}
          </span>
          {highlightInMySquad && <span className="squad-player-in-squad">в составе</span>}
        </div>
        <span className="squad-player-points-team">{player.teamName}</span>
        {pickedCount != null && pickedCount > 0 && (
          <span className="squad-player-picked-meta">
            в {pickedCount} {ruPlural(pickedCount, 'составе', 'составах', 'составах')}
          </span>
        )}
        {player.points && <PlayerBreakdown points={player.points} />}
      </div>
      <div className={`squad-player-points-total ${pts > 0 ? 'active' : pts < 0 ? 'penalty' : ''}`}>
        {pts > 0 ? `+${pts}` : pts}
      </div>
    </div>
  );
}

function GlobalRankingPanel({
  ranking,
  myIds,
}: {
  ranking: GlobalSquadPlayerRanking;
  myIds: Set<string>;
}) {
  const { top, losers } = ranking;
  const isEmpty = top.length === 0 && losers.length === 0;

  if (isEmpty) {
    return <p className="squad-player-points-status">Пока нет статистики по игрокам</p>;
  }

  return (
    <>
      {top.length > 0 && (
        <div className="squad-player-points-block">
          <h4 className="squad-player-points-subhead">Топ-20</h4>
          <div className="squad-player-points-list nested">
            {top.map((player, idx) => (
              <PlayerPointsRow
                key={player.id}
                player={player}
                rank={idx + 1}
                pickedCount={player.pickedCount}
                highlightInMySquad={myIds.has(player.id)}
              />
            ))}
          </div>
        </div>
      )}
      {losers.length > 0 && (
        <div className="squad-player-points-block losers">
          <h4 className="squad-player-points-subhead">Главные неудачники</h4>
          <div className="squad-player-points-list nested">
            {losers.map((player, idx) => (
              <PlayerPointsRow
                key={player.id}
                player={player}
                loserRank={idx + 1}
                pickedCount={player.pickedCount}
                highlightInMySquad={myIds.has(player.id)}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export function SquadPlayerPointsList({ players }: Props) {
  const [tab, setTab] = useState<PointsTab>('my');
  const [globalRanking, setGlobalRanking] = useState<GlobalSquadPlayerRanking | null>(null);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const mySorted = [...players].sort((a, b) => (b.points?.total ?? 0) - (a.points?.total ?? 0));
  const myIds = new Set(players.map(p => p.id));

  useEffect(() => {
    if (tab !== 'global' || globalRanking != null || globalLoading) return;
    setGlobalLoading(true);
    setGlobalError('');
    api
      .getSquadGlobalRanking()
      .then(setGlobalRanking)
      .catch(e => setGlobalError(e instanceof Error ? e.message : 'Не удалось загрузить рейтинг'))
      .finally(() => setGlobalLoading(false));
  }, [tab, globalRanking, globalLoading]);

  if (mySorted.length === 0 && tab === 'my') return null;

  return (
    <section className="squad-player-points" aria-label="Очки игроков">
      <div className="squad-player-points-head">
        <h3>Кто сколько принёс</h3>
        <span className="squad-player-points-hint">гол +2 · победа +1 · штрафы −1/−2</span>
      </div>

      <div className="squad-player-points-tabs" role="tablist" aria-label="Рейтинг игроков">
        <button
          type="button"
          role="tab"
          className={`squad-player-points-tab ${tab === 'my' ? 'active' : ''}`}
          aria-selected={tab === 'my'}
          onClick={() => setTab('my')}
        >
          Мой состав
        </button>
        <button
          type="button"
          role="tab"
          className={`squad-player-points-tab ${tab === 'global' ? 'active' : ''}`}
          aria-selected={tab === 'global'}
          onClick={() => setTab('global')}
        >
          Рейтинг футболистов
        </button>
      </div>

      {tab === 'my' && (
        <div className="squad-player-points-list" role="tabpanel">
          {mySorted.map((player, idx) => (
            <PlayerPointsRow
              key={player.id}
              player={player}
              rank={idx + 1}
            />
          ))}
        </div>
      )}

      {tab === 'global' && (
        <div className="squad-player-points-list" role="tabpanel">
          {globalLoading && (
            <p className="squad-player-points-status" role="status">
              Загрузка рейтинга…
            </p>
          )}
          {globalError && !globalLoading && (
            <p className="squad-player-points-status error" role="alert">
              {globalError}
            </p>
          )}
          {!globalLoading && !globalError && globalRanking && (
            <GlobalRankingPanel ranking={globalRanking} myIds={myIds} />
          )}
        </div>
      )}
    </section>
  );
}
