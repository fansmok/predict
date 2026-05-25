import type { CSSProperties } from 'react';
import { Match } from '../types';
import { WcGroup, WC_GROUP_STYLES, groupTabLabel } from '../wc-groups';
import { computeGroupStandings } from '../utils/groupStandings';

interface Props {
  group: WcGroup;
  matches: Match[];
}

export function GroupStandingsTable({ group, matches }: Props) {
  const groupMatches = matches.filter(m => m.group === group);
  const standings = computeGroupStandings(groupMatches);
  const style = WC_GROUP_STYLES[group];
  const hasResults = standings.some(r => r.played > 0);

  return (
    <section
      className="group-standings"
      style={{ '--group-color': style.text, '--group-bg': style.bg, '--group-border': style.border } as CSSProperties}
      aria-label={`Таблица ${groupTabLabel(group)}`}
    >
      <div className="group-standings-head">
        <span className="group-standings-badge">{group}</span>
        <div className="group-standings-title-wrap">
          <h3 className="group-standings-title">{groupTabLabel(group)}</h3>
          <p className="group-standings-hint">
            1–2 место — в 1/8 финала · 3-е — претендует в плей-оф (лучшие 8 среди третьих)
          </p>
        </div>
      </div>

      <div className="group-standings-table-wrap">
        <table className="group-standings-table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Сборная</th>
              <th scope="col" title="Игры">И</th>
              <th scope="col" title="Победы">В</th>
              <th scope="col" title="Ничьи">Н</th>
              <th scope="col" title="Поражения">П</th>
              <th scope="col" title="Мячи">М</th>
              <th scope="col" title="Разница">±</th>
              <th scope="col" title="Очки">О</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, idx) => {
              const rowClass =
                idx < 2 ? 'qualified' : idx === 2 ? 'third-place' : '';
              return (
              <tr key={row.team.id} className={rowClass}>
                <td className="col-rank">{idx + 1}</td>
                <td className="col-team">
                  <img src={row.team.flag} alt="" aria-hidden="true" className="group-standings-flag" />
                  <span className="group-standings-team-name">{row.team.name}</span>
                </td>
                <td>{row.played}</td>
                <td>{row.won}</td>
                <td>{row.drawn}</td>
                <td>{row.lost}</td>
                <td className="col-goals">{row.goalsFor}:{row.goalsAgainst}</td>
                <td className={row.goalDiff > 0 ? 'positive' : row.goalDiff < 0 ? 'negative' : ''}>
                  {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                </td>
                <td className="col-pts">{row.points}</td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!hasResults && (
        <p className="group-standings-empty">Матчи группы ещё не сыграны — таблица обновится после результатов</p>
      )}

      <div className="group-standings-legend" aria-hidden="true">
        <span className="legend-item qualified"><span className="legend-dot" />1–2 · 1/8</span>
        <span className="legend-item third-place"><span className="legend-dot" />3 · плей-оф</span>
      </div>
    </section>
  );
}
