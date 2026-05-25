import { useMemo, useRef, useState, useId } from 'react';
import type { Team, TournamentOption } from '../types';
import { ModalPortal } from './ModalPortal';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { IconCheck } from './Icons';

interface Props {
  open: boolean;
  teams: TournamentOption[];
  selected?: Team | null;
  saving?: boolean;
  onClose: () => void;
  onSelect: (teamId: string) => void;
}

export function FavoriteTeamBanner({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="favorite-team-banner" onClick={onClick}>
      <span className="favorite-team-banner-icon" aria-hidden="true">🏳️</span>
      <span className="favorite-team-banner-text">
        <strong>Укажите, за какую сборную болеете</strong>
        <span>Флаг появится на вашем аватаре — его увидят все</span>
      </span>
      <span className="favorite-team-banner-arrow" aria-hidden="true">→</span>
    </button>
  );
}

export function FavoriteTeamPicker({ open, teams, selected, saving, onClose, onSelect }: Props) {
  const [search, setSearch] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const searchId = useId();

  useDialogA11y(open, onClose, dialogRef);

  const options = useMemo(() => {
    if (!search.trim()) return teams;
    const q = search.toLowerCase();
    return teams.filter(t => t.name.toLowerCase().includes(q));
  }, [teams, search]);

  if (!open) return null;

  return (
    <ModalPortal>
      <div className="tournament-picker-overlay" onClick={onClose} role="presentation">
        <div
          ref={dialogRef}
          className="tournament-picker"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={e => e.stopPropagation()}
        >
          <div className="tournament-picker-handle" aria-hidden="true" />
          <h3 id={titleId}>За какую сборную болеете?</h3>
          <label htmlFor={searchId} className="sr-only">Поиск сборной</label>
          <input
            id={searchId}
            type="search"
            className="tournament-search"
            placeholder="Поиск сборной..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoComplete="off"
          />
          <div className="tournament-options" role="listbox" aria-label="Сборные">
            {options.map(team => {
              const isSelected = selected?.id === team.id;
              return (
                <button
                  key={team.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`tournament-option ${isSelected ? 'selected' : ''}`}
                  disabled={saving}
                  onClick={() => onSelect(team.id)}
                >
                  {team.flag && (
                    <img src={team.flag} alt="" aria-hidden="true" className="tournament-option-flag" />
                  )}
                  <span className="tournament-option-name">{team.name}</span>
                  {isSelected && <IconCheck size={16} aria-hidden="true" />}
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
  );
}
