import { MatchConsensus } from '../types';
import { formatPredictions, hasPublicConsensus } from '../utils';

interface Props {
  consensus: MatchConsensus;
  homeTeamName: string;
  awayTeamName: string;
}

function leaderKey(home: number, draw: number, away: number): 'home' | 'draw' | 'away' {
  if (home >= draw && home >= away) return 'home';
  if (draw >= home && draw >= away) return 'draw';
  return 'away';
}

export function MatchConsensusBar({ consensus, homeTeamName, awayTeamName }: Props) {
  if (!hasPublicConsensus(consensus)) return null;
  const { home, draw, away, total } = consensus;

  const leader = leaderKey(home, draw, away);
  const ariaLabel = `Мнение пользователей: победа ${homeTeamName} ${home}%, ничья ${draw}%, победа ${awayTeamName} ${away}%, ${formatPredictions(total)}`;

  return (
    <div className="match-consensus" role="group" aria-label={ariaLabel}>
      <div className="consensus-header">
        <span className="consensus-title">МНЕНИЕ ПОЛЬЗОВАТЕЛЕЙ</span>
        <span className="consensus-count">{formatPredictions(total)}</span>
      </div>

      <div className="consensus-bar" aria-hidden="true">
        {home > 0 && <span className="seg home" style={{ flex: home }} title={`П1 — ${home}%`} />}
        {draw > 0 && <span className="seg draw" style={{ flex: draw }} title={`Ничья — ${draw}%`} />}
        {away > 0 && <span className="seg away" style={{ flex: away }} title={`П2 — ${away}%`} />}
      </div>

      <div className="consensus-grid" aria-hidden="true">
        <div className={`consensus-cell home ${leader === 'home' ? 'leader' : ''}`}>
          <span className="consensus-pct">{home}%</span>
          <span className="consensus-outcome">П1</span>
        </div>
        <div className={`consensus-cell draw ${leader === 'draw' ? 'leader' : ''}`}>
          <span className="consensus-pct">{draw}%</span>
          <span className="consensus-outcome">X</span>
        </div>
        <div className={`consensus-cell away ${leader === 'away' ? 'leader' : ''}`}>
          <span className="consensus-pct">{away}%</span>
          <span className="consensus-outcome">П2</span>
        </div>
      </div>
    </div>
  );
}
