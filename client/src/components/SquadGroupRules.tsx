import { useMemo, useState } from 'react';
import { FifaGroupId, FifaGroupRule, SquadPlayerOption } from '../types';
import { GROUP_LEGEND, GROUP_TONE, groupClass } from '../fifa-groups';

function countGroup(slots: Array<SquadPlayerOption | null>, groupId: FifaGroupId): number {
  return slots.filter(p => p?.fifaGroup === groupId).length;
}

interface Props {
  rules: FifaGroupRule[];
  slots: Array<SquadPlayerOption | null>;
  maxPerTeam: number;
  locked?: boolean;
}

export function SquadGroupRules({ rules, slots, maxPerTeam, locked = false }: Props) {
  const [expandedId, setExpandedId] = useState<FifaGroupId | null>(null);

  const sortedRules = useMemo(() => {
    return [...rules].sort((a, b) => {
      const aFull = countGroup(slots, a.id) >= a.maxPlayers;
      const bFull = countGroup(slots, b.id) >= b.maxPlayers;
      if (aFull !== bFull) return aFull ? 1 : -1;
      return a.id - b.id;
    });
  }, [rules, slots]);

  if (rules.length === 0) return null;

  return (
    <section className="squad-groups-panel" aria-label="Правила набора состава">
      <div className="squad-groups-head">
        <span className="squad-groups-title">Правила набора</span>
      </div>

      <ul className="squad-groups-rules-list">
        <li>
          <strong>Главное правило:</strong> очки и штрафы начисляются только если игрок принял участие в
          матче.
        </li>
        <li>Соберите 11 игроков из разных сборных; редактировать команду можно только до старта ЧМ.</li>
        <li>В fantasy-команду можно взять до {maxPerTeam} игроков из одной сборной.</li>
        <li>
          До 3 игроков из каждой категории сборной (категория определяется рейтингом FIFA); в категории 4 —
          не более 2.
        </li>
      </ul>

      <div className="squad-groups-legend" aria-label="Цвета групп">
        {GROUP_LEGEND.map(({ id, label }) => (
          <span key={id} className={`squad-groups-legend-item ${GROUP_TONE[id]}`}>
            <span className="squad-groups-legend-dot" aria-hidden="true" />
            {label}
          </span>
        ))}
      </div>

      <div className="squad-groups-grid">
        {sortedRules.map(rule => {
          const count = countGroup(slots, rule.id);
          const atLimit = count >= rule.maxPlayers;
          const tone = GROUP_TONE[rule.id];
          const pct = Math.min(100, (count / rule.maxPlayers) * 100);
          const expanded = expandedId === rule.id;

          return (
            <div
              key={rule.id}
              className={`squad-group-card ${tone} ${atLimit ? 'at-limit' : ''}`}
            >
              <button
                type="button"
                className="squad-group-card-head"
                onClick={() => setExpandedId(expanded ? null : rule.id)}
                aria-expanded={expanded}
              >
                <div className="squad-group-card-meta">
                  <span className="squad-group-badge">Г{rule.id}</span>
                  <div className="squad-group-text">
                    <span className="squad-group-label">{rule.label}</span>
                    <span className="squad-group-sub">{rule.subtitle}</span>
                  </div>
                </div>
                <div className="squad-group-counter">
                  <span className={`squad-group-count ${atLimit ? 'full' : ''}`}>
                    {count}/{rule.maxPlayers}
                  </span>
                  <span className="squad-group-expand" aria-hidden="true">
                    {expanded ? '▲' : '▼'}
                  </span>
                </div>
              </button>

              <div className="squad-group-bar" aria-hidden="true">
                <div
                  className={`squad-group-bar-fill ${tone}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {atLimit && !locked && (
                <p className="squad-group-limit-hint">Лимит группы исчерпан</p>
              )}

              {expanded && (
                <div className="squad-group-teams">
                  <p className="squad-group-teams-hint">
                    Сборные группы {rule.id}
                    {rule.id === 4 ? ' · максимум 2 игрока' : ' · максимум 3 игрока'}
                  </p>
                  <div className="squad-group-team-chips">
                    {rule.teams.map(t => {
                      const picked = slots.some(p => p?.teamId === t.teamId);
                      return (
                        <span
                          key={t.teamId}
                          className={`squad-group-team-chip ${groupClass(rule.id)} ${picked ? 'picked' : ''}`}
                        >
                          {t.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
