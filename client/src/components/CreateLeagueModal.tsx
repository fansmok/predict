import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { api } from '../api';
import {
  LEAGUE_BG_OPTIONS,
  LEAGUE_EMOJI_OPTIONS,
  pickRandomLeagueAppearance,
} from '../data/league-emojis';
import { validateLeagueName } from '../data/profanity';
import { LeagueEmoji } from './LeagueEmoji';
import { ModalPortal } from './ModalPortal';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (leagueId: number, inviteLink: string) => void | Promise<void>;
}

export function CreateLeagueModal({ open, onClose, onCreated }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const inputId = useId();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(() => pickRandomLeagueAppearance().emoji);
  const [emojiBg, setEmojiBg] = useState(() => pickRandomLeagueAppearance().bg);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleClose = useCallback(() => {
    if (creating) return;
    onClose();
  }, [creating, onClose]);

  useDialogA11y(open, handleClose, dialogRef);

  useEffect(() => {
    if (!open) return;
    const random = pickRandomLeagueAppearance();
    setName('');
    setEmoji(random.emoji);
    setEmojiBg(random.bg);
    setError('');
    setCreating(false);
  }, [open]);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed || creating) return;
    const profanityError = validateLeagueName(trimmed);
    if (profanityError) {
      setError(profanityError);
      return;
    }
    setCreating(true);
    setError('');
    try {
      const res = await api.createLeague(trimmed, emoji, emojiBg);
      await onCreated(res.league.id, res.inviteLink);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать лигу');
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={handleClose} role="presentation">
        <div
          ref={dialogRef}
          className="modal-sheet lb-create-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={e => e.stopPropagation()}
        >
          <div className="modal-handle" aria-hidden="true" />
          <button
            type="button"
            className="user-profile-close"
            onClick={handleClose}
            disabled={creating}
            aria-label="Закрыть"
          >
            ×
          </button>
          <div className="lb-create-modal-preview" aria-hidden="true">
            <LeagueEmoji emoji={emoji} bgColor={emojiBg} size="lg" />
          </div>
          <h3 id={titleId}>Новая лига</h3>
          <p className="modal-desc">
            Выберите логотип, фон и название. Пригласите друзей по ссылке.
          </p>

          <p className="lb-create-emoji-label">Логотип лиги</p>
          <div className="lb-create-emoji-grid" role="listbox" aria-label="Логотип лиги">
            {LEAGUE_EMOJI_OPTIONS.map(e => (
              <button
                key={e}
                type="button"
                role="option"
                className={`lb-create-emoji-btn${emoji === e ? ' active' : ''}`}
                aria-selected={emoji === e}
                aria-label={`Логотип ${e}`}
                disabled={creating}
                onClick={() => setEmoji(e)}
              >
                {e}
              </button>
            ))}
          </div>

          <p className="lb-create-emoji-label">Фон логотипа</p>
          <div className="lb-create-bg-grid" role="listbox" aria-label="Фон логотипа">
            {LEAGUE_BG_OPTIONS.map(opt => (
              <button
                key={opt.id}
                type="button"
                role="option"
                className={`lb-create-bg-btn${emojiBg === opt.color ? ' active' : ''}`}
                style={{ background: opt.color }}
                aria-selected={emojiBg === opt.color}
                aria-label={`Фон ${opt.id}`}
                disabled={creating}
                onClick={() => setEmojiBg(opt.color)}
              />
            ))}
          </div>

          <label htmlFor={inputId} className="sr-only">
            Название лиги
          </label>
          <input
            id={inputId}
            className="modal-input"
            placeholder="Название лиги"
            value={name}
            maxLength={40}
            onChange={e => setName(e.target.value)}
            autoComplete="off"
            disabled={creating}
          />
          {error && (
            <div className="modal-error" role="alert">
              {error}
            </div>
          )}
          <button
            type="button"
            className="modal-submit"
            onClick={handleCreate}
            disabled={creating || !name.trim()}
          >
            {creating ? 'Создание...' : 'Создать лигу'}
          </button>
          <button type="button" className="btn-secondary" onClick={handleClose} disabled={creating}>
            Отмена
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}
