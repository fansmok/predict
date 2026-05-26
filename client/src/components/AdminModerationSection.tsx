import { useState } from 'react';
import { api } from '../api';

interface Props {
  onChanged: () => Promise<void>;
}

export function AdminModerationSection({ onChanged }: Props) {
  const [leagueId, setLeagueId] = useState('');
  const [userId, setUserId] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const handleDeleteLeague = async () => {
    const id = parseInt(leagueId.trim(), 10);
    if (!Number.isInteger(id) || id <= 0) {
      setMessage({ ok: false, text: 'Укажите корректный ID лиги' });
      return;
    }
    if (!window.confirm(`Удалить лигу #${id}? Это действие необратимо.`)) return;

    setBusy(true);
    setMessage(null);
    try {
      const res = await api.adminDeleteLeague(id);
      setMessage({ ok: true, text: `Лига «${res.name}» удалена` });
      setLeagueId('');
      await onChanged();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : 'Ошибка удаления лиги' });
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteUser = async () => {
    const id = parseInt(userId.trim(), 10);
    if (!Number.isInteger(id) || id <= 0) {
      setMessage({ ok: false, text: 'Укажите корректный Telegram ID пользователя' });
      return;
    }
    if (!window.confirm(`Удалить пользователя #${id} и все его данные? Это необратимо.`)) return;

    setBusy(true);
    setMessage(null);
    try {
      await api.adminDeleteUser(id);
      setMessage({ ok: true, text: `Пользователь #${id} удалён` });
      setUserId('');
      await onChanged();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : 'Ошибка удаления пользователя' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="admin-section admin-moderation">
      <h3 className="admin-section-title">Модерация</h3>
      <p className="admin-section-hint">
        Только администраторы приложения (ADMIN_USER_IDS). Обычные пользователи и владельцы лиг не могут
        удалять чужие лиги или аккаунты.
      </p>

      {message && (
        <div className={`admin-message ${message.ok ? 'ok' : 'err'}`} role={message.ok ? 'status' : 'alert'}>
          {message.text}
        </div>
      )}

      <div className="admin-moderation-block">
        <h4>Удалить лигу</h4>
        <div className="admin-moderation-row">
          <input
            className="admin-api-link-input"
            type="number"
            inputMode="numeric"
            placeholder="ID лиги"
            value={leagueId}
            onChange={e => setLeagueId(e.target.value)}
            disabled={busy}
          />
          <button type="button" className="admin-btn" disabled={busy} onClick={() => void handleDeleteLeague()}>
            Удалить лигу
          </button>
        </div>
      </div>

      <div className="admin-moderation-block">
        <h4>Удалить пользователя</h4>
        <div className="admin-moderation-row">
          <input
            className="admin-api-link-input"
            type="number"
            inputMode="numeric"
            placeholder="Telegram user ID"
            value={userId}
            onChange={e => setUserId(e.target.value)}
            disabled={busy}
          />
          <button type="button" className="admin-btn" disabled={busy} onClick={() => void handleDeleteUser()}>
            Удалить пользователя
          </button>
        </div>
      </div>
    </section>
  );
}
