import { useState, useMemo, useEffect, useRef, useId } from 'react';
import { TournamentData, TournamentOption, TournamentPickField } from '../types';
import { IconCrown, IconMedal, IconBoot, IconChevronDown, IconCheck } from './Icons';
import { ModalPortal } from './ModalPortal';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { isTournamentPicksLocked, WC_OPENING_KICKOFF } from '../utils';

interface Props {
  data: TournamentData;
  teams: TournamentOption[];
  players: TournamentOption[];
  matches?: Array<{ status: string }>;
  embedded?: boolean;
  hideHeader?: boolean;
  readOnly?: boolean;
  onSave: (picks: {
    winnerTeamId?: string;
    secondTeamId?: string;
    thirdTeamId?: string;
    topScorerPlayerId?: string;
  }) => Promise<void>;
}

const FIELDS: {
  key: TournamentPickField;
  label: string;
  points: number;
  icon: typeof IconCrown;
  color: string;
  type: 'team' | 'player';
}[] = [
  { key: 'winner', label: 'Победитель', points: 30, icon: IconCrown, color: 'gold', type: 'team' },
  { key: 'second', label: '2-е место', points: 20, icon: IconMedal, color: 'silver', type: 'team' },
  { key: 'third', label: '3-е место', points: 10, icon: IconMedal, color: 'bronze', type: 'team' },
  { key: 'topScorer', label: 'Бомбардир', points: 20, icon: IconBoot, color: 'accent', type: 'player' },
];

export function TournamentPicks({ data, teams, players, matches, embedded, hideHeader, readOnly, onSave }: Props) {
  const [expanded, setExpanded] = useState<TournamentPickField | null>(null);
  const [draft, setDraft] = useState({
    winner: data.picks.winner?.id ?? '',
    second: data.picks.second?.id ?? '',
    third: data.picks.third?.id ?? '',
    topScorer: data.picks.topScorer?.id ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [, refreshLock] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const searchId = useId();

  const locked = readOnly || isTournamentPicksLocked(data, matches);

  useEffect(() => {
    if (locked) {
      setExpanded(null);
      return;
    }
    const deadlineMs = data.deadline
      ? new Date(data.deadline).getTime()
      : new Date(WC_OPENING_KICKOFF).getTime();
    const msUntil = deadlineMs - Date.now();
    if (msUntil <= 0) return;
    const timer = window.setTimeout(() => refreshLock(n => n + 1), msUntil + 250);
    return () => window.clearTimeout(timer);
  }, [locked, data.deadline]);

  const pickerOpen = expanded !== null && !locked;
  useDialogA11y(pickerOpen, () => setExpanded(null), dialogRef);

  useEffect(() => {
    setDraft({
      winner: data.picks.winner?.id ?? '',
      second: data.picks.second?.id ?? '',
      third: data.picks.third?.id ?? '',
      topScorer: data.picks.topScorer?.id ?? '',
    });
  }, [data.picks.winner?.id, data.picks.second?.id, data.picks.third?.id, data.picks.topScorer?.id]);

  const filledCount = [draft.winner, draft.second, draft.third, draft.topScorer].filter(Boolean).length;
  const resultsSettled = data.results !== null;

  const options = useMemo(() => {
    const list = expanded === 'topScorer' ? players : teams;
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(o => o.name.toLowerCase().includes(q) || o.teamName?.toLowerCase().includes(q));
  }, [expanded, teams, players, search]);

  const pickValue = (key: TournamentPickField) => {
    const id = draft[key === 'topScorer' ? 'topScorer' : key];
    if (!id) return null;
    if (key === 'topScorer') return players.find(p => p.id === id) ?? data.picks.topScorer;
    return teams.find(t => t.id === id) ?? data.picks[key];
  };

  const handleSelect = async (key: TournamentPickField, id: string) => {
    if (locked) return;

    const next = { ...draft };
    if (key === 'winner') {
      next.winner = id;
      if (next.second === id) next.second = '';
      if (next.third === id) next.third = '';
    } else if (key === 'second') {
      next.second = id;
      if (next.third === id) next.third = '';
    } else if (key === 'third') {
      next.third = id;
    } else {
      next.topScorer = id;
    }

    setDraft(next);
    setExpanded(null);
    setSearch('');

    setSaving(true);
    try {
      await onSave({
        winnerTeamId: next.winner || undefined,
        secondTeamId: next.second || undefined,
        thirdTeamId: next.third || undefined,
        topScorerPlayerId: next.topScorer || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const blockedTeamIds = (field: TournamentPickField): Set<string> => {
    if (field === 'winner') return new Set();
    if (field === 'second') return new Set([draft.winner].filter(Boolean));
    if (field === 'third') return new Set([draft.winner, draft.second].filter(Boolean));
    return new Set();
  };

  const expandedLabel = FIELDS.find(f => f.key === expanded)?.label ?? '';

  return (
    <section className={`tournament-section ${embedded ? 'embedded' : ''}`} aria-label="Прогнозы на турнир">
      {!hideHeader && (
      <div className="tournament-header">
        <div>
          <h2 className="tournament-title">
            {embedded ? 'Чемпионат мира' : 'Прогнозы на турнир'}
          </h2>
          <p className="tournament-subtitle">
            {locked ? 'Приём закрыт — турнир уже начался' : embedded ? 'Победитель · призёры · бомбардир · до 80 ОЧКИ' : 'До старта ЧМ-2026 · до 80 ОЧКИ'}
          </p>
        </div>
        <div className="tournament-progress" aria-label={`Заполнено ${filledCount} из 4`}>
          <span className="tournament-progress-value">{filledCount}/4</span>
        </div>
      </div>
      )}

      <div className="tournament-grid">
        {FIELDS.map(({ key, label, points, icon: Icon, color }) => {
          const selected = pickValue(key);
          const ptsKey = key === 'topScorer' ? 'topScorer' : key;
          const scoredPts = data.points[ptsKey];

          return (
            <button
              key={key}
              type="button"
              className={`tournament-pick-card ${color} ${selected ? 'filled' : ''} ${locked ? 'locked' : ''}`}
              onClick={() => !locked && setExpanded(expanded === key ? null : key)}
              disabled={locked}
              aria-expanded={expanded === key}
              aria-haspopup="dialog"
              aria-label={`${label}${selected ? `: ${selected.name}` : ', не выбрано'}`}
            >
              <div className="tournament-pick-icon" aria-hidden="true">
                <Icon size={18} />
              </div>
              <div className="tournament-pick-info">
                <span className="tournament-pick-label">{label}</span>
                <span className="tournament-pick-value">
                  {selected ? (
                    key === 'topScorer' ? (
                      selected.name
                    ) : (
                      <span className="tournament-team-mini">
                        {'flag' in selected && selected.flag && (
                          <img src={selected.flag as string} alt="" aria-hidden="true" />
                        )}
                        {selected.name}
                      </span>
                    )
                  ) : (
                    'Выбрать'
                  )}
                </span>
              </div>
              <div className="tournament-pick-meta">
                {resultsSettled ? (
                  <>
                    <span className={`tournament-pick-pts ${(scoredPts ?? 0) > 0 ? 'scored' : 'zero'}`}>
                      +{scoredPts ?? 0}
                    </span>
                    {(scoredPts ?? 0) > 0 && (
                      <IconCheck size={12} className="tournament-check" aria-hidden="true" />
                    )}
                  </>
                ) : (
                  <span className="tournament-pick-pts potential">+{points}</span>
                )}
                {!locked && <IconChevronDown size={14} aria-hidden="true" />}
              </div>
            </button>
          );
        })}
      </div>

      {pickerOpen && (
        <ModalPortal>
          <div className="tournament-picker-overlay" onClick={() => setExpanded(null)} role="presentation">
            <div
              ref={dialogRef}
              className="tournament-picker"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onClick={e => e.stopPropagation()}
            >
              <div className="tournament-picker-handle" aria-hidden="true" />
              <h3 id={titleId}>{expandedLabel}</h3>
              <label htmlFor={searchId} className="sr-only">
                Поиск {expanded === 'topScorer' ? 'игрока' : 'сборной'}
              </label>
              <input
                id={searchId}
                type="search"
                className="tournament-search"
                placeholder="Поиск..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoComplete="off"
              />
              <div className="tournament-options" role="listbox" aria-label={expandedLabel}>
                {options.map(opt => {
                  const fieldKey = expanded === 'topScorer' ? 'topScorer' : expanded;
                  const isSelected =
                    fieldKey === 'topScorer'
                      ? draft.topScorer === opt.id
                      : draft[fieldKey as 'winner' | 'second' | 'third'] === opt.id;
                  const disabled =
                    expanded !== 'topScorer' &&
                    expanded !== 'winner' &&
                    blockedTeamIds(expanded).has(opt.id) &&
                    !isSelected;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`tournament-option ${isSelected ? 'selected' : ''}`}
                      disabled={disabled}
                      onClick={() => handleSelect(expanded!, opt.id)}
                    >
                      {opt.flag && <img src={opt.flag} alt="" aria-hidden="true" className="tournament-option-flag" />}
                      <span className="tournament-option-name">{opt.name}</span>
                      {opt.teamName && <span className="tournament-option-team">{opt.teamName}</span>}
                    </button>
                  );
                })}
              </div>
              {saving && (
                <div className="tournament-saving" role="status" aria-live="polite">
                  Сохранение...
                </div>
              )}
            </div>
          </div>
        </ModalPortal>
      )}
    </section>
  );
}
