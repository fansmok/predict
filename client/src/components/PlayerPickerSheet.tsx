import { useMemo, useState, useEffect, useRef, useId } from 'react';
import { FifaGroupId, SquadPlayerOption, SquadPosition } from '../types';
import { GROUP_SHORT, groupClass } from '../fifa-groups';
import { IconCheck } from './Icons';
import { ModalPortal } from './ModalPortal';
import { useDialogA11y } from '../hooks/useDialogA11y';

const POS_LABEL: Record<SquadPosition, string> = {
  GK: 'Вратарь',
  DEF: 'Защитник',
  MID: 'Полузащитник',
  FWD: 'Нападающий',
};

const TEAM_LIMIT_HINT = 'Максимум 2 игрока из одной сборной';

function groupLimitHint(groupId: FifaGroupId, max: number): string {
  if (groupId === 4) {
    return `Из группы «Аутсайдеры» можно взять только ${max} игроков`;
  }
  return `Максимум ${max} игрока из группы «${GROUP_SHORT[groupId]}»`;
}

type Step = 'teams' | 'players';

interface TeamOption {
  id: string;
  name: string;
  flag: string;
  fifaGroup?: FifaGroupId;
  available: boolean;
  atTeamLimit: boolean;
  atGroupLimit: boolean;
  pickedFromTeam: number;
}

interface Props {
  open: boolean;
  slot: number;
  position: SquadPosition;
  options: SquadPlayerOption[];
  selectedIds: Set<string>;
  teamCounts: Record<string, number>;
  groupCounts: Partial<Record<FifaGroupId, number>>;
  maxPerTeam: number;
  maxPerGroup: Partial<Record<FifaGroupId, number>>;
  currentPlayerId?: string | null;
  onSelect: (playerId: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export function PlayerPickerSheet({
  open,
  slot,
  position,
  options,
  selectedIds,
  teamCounts,
  groupCounts,
  maxPerTeam,
  maxPerGroup,
  currentPlayerId,
  onSelect,
  onClear,
  onClose,
}: Props) {
  const [step, setStep] = useState<Step>('teams');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [limitHint, setLimitHint] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const teamSearchId = useId();
  const playerSearchId = useId();

  useDialogA11y(open, onClose, dialogRef);

  useEffect(() => {
    if (open) {
      setStep('teams');
      setSelectedTeamId(null);
      setSearch('');
      setLimitHint('');
      document.body.classList.add('picker-open');
      return () => document.body.classList.remove('picker-open');
    }
  }, [open, slot, position]);

  const currentPlayer = useMemo(
    () => (currentPlayerId ? options.find(o => o.id === currentPlayerId) : undefined),
    [currentPlayerId, options]
  );

  const canAddFromTeam = (teamId: string) => {
    const count = teamCounts[teamId] ?? 0;
    if (count < maxPerTeam) return true;
    return currentPlayer?.teamId === teamId;
  };

  const canAddFromGroup = (groupId?: FifaGroupId) => {
    if (!groupId) return true;
    const max = maxPerGroup[groupId] ?? 3;
    const count = groupCounts[groupId] ?? 0;
    if (count < max) return true;
    return currentPlayer?.fifaGroup === groupId;
  };

  const getBlockReason = (teamId: string, groupId?: FifaGroupId): string | null => {
    if (!canAddFromTeam(teamId)) return TEAM_LIMIT_HINT;
    if (groupId && !canAddFromGroup(groupId)) {
      return groupLimitHint(groupId, maxPerGroup[groupId] ?? 3);
    }
    return null;
  };

  const showLimitHint = (reason: string) => setLimitHint(reason);

  const teams = useMemo((): TeamOption[] => {
    const byTeam = new Map<string, { name: string; flag: string; fifaGroup?: FifaGroupId; players: SquadPlayerOption[] }>();
    for (const p of options.filter(o => o.position === position)) {
      const cur = byTeam.get(p.teamId);
      if (cur) cur.players.push(p);
      else byTeam.set(p.teamId, { name: p.teamName, flag: p.flag, fifaGroup: p.fifaGroup, players: [p] });
    }
    return [...byTeam.entries()]
      .map(([id, t]) => {
        const pickedFromTeam = teamCounts[id] ?? 0;
        const atTeamLimit = !canAddFromTeam(id);
        const atGroupLimit = !canAddFromGroup(t.fifaGroup);
        const blocked = atTeamLimit || atGroupLimit;
        const hasAvailable = t.players.some(p => selectedIds.has(p.id) || !blocked);
        return {
          id,
          name: t.name,
          flag: t.flag,
          fifaGroup: t.fifaGroup,
          available: hasAvailable,
          atTeamLimit,
          atGroupLimit,
          pickedFromTeam,
        };
      })
      .sort((a, b) => {
        const ga = a.fifaGroup ?? 99;
        const gb = b.fifaGroup ?? 99;
        if (ga !== gb) return ga - gb;
        if (a.available !== b.available) return a.available ? -1 : 1;
        return a.name.localeCompare(b.name, 'ru');
      });
  }, [options, position, teamCounts, groupCounts, maxPerTeam, maxPerGroup, selectedIds, currentPlayer]);

  const teamSections = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q ? teams.filter(t => t.name.toLowerCase().includes(q)) : teams;

    const isSectionExhausted = (groupId: FifaGroupId, sectionTeams: TeamOption[]) => {
      const max = maxPerGroup[groupId] ?? 3;
      if ((groupCounts[groupId] ?? 0) >= max) return true;
      return sectionTeams.length > 0 && sectionTeams.every(t => !t.available);
    };

    const sortTeams = (a: TeamOption, b: TeamOption) => {
      const aBlocked = !a.available || a.atTeamLimit || a.atGroupLimit;
      const bBlocked = !b.available || b.atTeamLimit || b.atGroupLimit;
      if (aBlocked !== bBlocked) return aBlocked ? 1 : -1;
      return a.name.localeCompare(b.name, 'ru');
    };

    return ([1, 2, 3, 4] as FifaGroupId[])
      .map(groupId => ({
        groupId,
        label: GROUP_SHORT[groupId],
        teams: filtered.filter(t => t.fifaGroup === groupId).sort(sortTeams),
      }))
      .filter(s => s.teams.length > 0)
      .sort((a, b) => {
        const aEx = isSectionExhausted(a.groupId, a.teams);
        const bEx = isSectionExhausted(b.groupId, b.teams);
        if (aEx !== bEx) return aEx ? 1 : -1;
        return a.groupId - b.groupId;
      });
  }, [teams, search, groupCounts, maxPerGroup]);

  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  const players = useMemo(() => {
    if (!selectedTeamId) return [];
    let list = options.filter(p => p.position === position && p.teamId === selectedTeamId);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [options, position, selectedTeamId, search]);

  if (!open) return null;

  const canPick = (p: SquadPlayerOption) => {
    if (selectedIds.has(p.id)) return true;
    return canAddFromTeam(p.teamId) && canAddFromGroup(p.fifaGroup);
  };

  const teamBlockReason =
    selectedTeamId && selectedTeam
      ? getBlockReason(selectedTeamId, selectedTeam.fifaGroup)
      : null;

  const dialogTitle =
    step === 'teams'
      ? `Сборная · ${POS_LABEL[position]}`
      : selectedTeam?.name ?? 'Игроки';

  return (
    <ModalPortal>
      <div className="picker-overlay" onClick={onClose} role="presentation">
        <div
          ref={dialogRef}
          className="picker-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={e => e.stopPropagation()}
        >
          <div className="picker-handle" aria-hidden="true" />
          <div className="picker-header">
            <div className="picker-header-left">
              {step === 'players' && (
                <button
                  type="button"
                  className="picker-back"
                  onClick={() => { setStep('teams'); setSelectedTeamId(null); setSearch(''); setLimitHint(''); }}
                  aria-label="Назад к выбору сборной"
                >
                  ←
                </button>
              )}
              <h3 id={titleId}>{dialogTitle}</h3>
            </div>
            <button type="button" className="picker-close" onClick={onClose} aria-label="Закрыть">
              ×
            </button>
          </div>

          {limitHint && (
            <div className="picker-limit-hint" role="status">
              {limitHint}
            </div>
          )}

          {step === 'teams' && (
            <div className="picker-body">
              <p className="picker-rules-note">
                До 2 из сборной · до 3 из группы 1–3 · из группы 4 — только 2
              </p>
              <label htmlFor={teamSearchId} className="sr-only">
                Поиск сборной
              </label>
              <input
                id={teamSearchId}
                type="search"
                className="picker-search"
                placeholder="Поиск сборной..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoComplete="off"
              />
              {currentPlayerId && (
                <button type="button" className="picker-clear-btn" onClick={() => { onClear(); onClose(); }}>
                  Убрать игрока с позиции
                </button>
              )}
              <div className="picker-team-sections" role="listbox" aria-label="Сборные">
                {teamSections.length === 0 && (
                  <div className="picker-empty">Нет доступных сборных для этой позиции</div>
                )}
                {teamSections.map(section => (
                  <section key={section.groupId} className={`picker-team-section ${groupClass(section.groupId)}`}>
                    <h4 className="picker-team-section-title">{section.label}</h4>
                    <div className="picker-team-grid">
                      {section.teams.map(t => {
                        const blockReason = getBlockReason(t.id, t.fifaGroup);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            role="option"
                            className={`picker-team-card ${groupClass(t.fifaGroup)} ${!t.available ? 'disabled' : ''}`}
                            aria-label={t.name}
                            onClick={() => {
                              if (!t.available && blockReason) {
                                showLimitHint(blockReason);
                                return;
                              }
                              if (!t.available) return;
                              setLimitHint('');
                              setSelectedTeamId(t.id);
                              setStep('players');
                              setSearch('');
                            }}
                          >
                            {t.pickedFromTeam > 0 && (
                              <span className={`picker-team-count ${t.atTeamLimit ? 'full' : ''}`}>
                                {t.pickedFromTeam}/{maxPerTeam}
                              </span>
                            )}
                            <img src={t.flag} alt="" aria-hidden="true" className="picker-team-card-flag" />
                            <span className="picker-team-card-name">{t.name}</span>
                            <span className={`picker-group-badge ${groupClass(t.fifaGroup)}`}>
                              {GROUP_SHORT[t.fifaGroup!]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          )}

          {step === 'players' && (
            <div className="picker-body">
              {teamBlockReason && (
                <div className="picker-limit-hint static" role="note">
                  {teamBlockReason}
                </div>
              )}
              <label htmlFor={playerSearchId} className="sr-only">
                Поиск игрока
              </label>
              <input
                id={playerSearchId}
                type="search"
                className="picker-search"
                placeholder="Поиск игрока..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoComplete="off"
              />
              <div className="picker-list" role="listbox" aria-label="Игроки">
                {players.map(p => {
                  const picked = selectedIds.has(p.id);
                  const disabled = !canPick(p);
                  const blockReason = getBlockReason(p.teamId, p.fifaGroup);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="option"
                      aria-selected={picked}
                      className={`picker-row ${groupClass(p.fifaGroup)} ${picked ? 'picked' : ''} ${disabled ? 'disabled' : ''}`}
                      onClick={() => {
                        if (disabled && !picked && blockReason) {
                          showLimitHint(blockReason);
                          return;
                        }
                        setLimitHint('');
                        onSelect(p.id);
                        onClose();
                      }}
                    >
                      <img src={p.flag} alt="" aria-hidden="true" className="picker-flag" />
                      <div className="picker-info">
                        <span className="picker-name">{p.name}</span>
                      </div>
                      {picked && <span className="picker-check" aria-hidden="true"><IconCheck size={16} /></span>}
                    </button>
                  );
                })}
                {players.length === 0 && (
                  <div className="picker-empty">Игроки не найдены</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
