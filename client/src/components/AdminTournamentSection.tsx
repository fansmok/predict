import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { TournamentOption } from '../types';

interface Props {
  teams: TournamentOption[];
  players: TournamentOption[];
  onSettled: () => Promise<void>;
  onMessage: (msg: { text: string; ok: boolean }) => void;
}

const PLACE_LABELS = [
  { key: 'winnerTeamId' as const, label: 'Победитель', points: 30 },
  { key: 'secondTeamId' as const, label: '2-е место', points: 20 },
  { key: 'thirdTeamId' as const, label: '3-е место', points: 10 },
];

export function AdminTournamentSection({ teams, players, onSettled, onMessage }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settled, setSettled] = useState(false);
  const [settledAt, setSettledAt] = useState<string | null>(null);
  const [picksCount, setPicksCount] = useState(0);
  const [form, setForm] = useState({
    winnerTeamId: '',
    secondTeamId: '',
    thirdTeamId: '',
    topScorerPlayerId: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.adminGetTournamentResults();
      setSettled(data.settled);
      setSettledAt(data.settledAt);
      setPicksCount(data.picksCount);
      const r = data.results;
      setForm({
        winnerTeamId: r?.winnerTeamId ?? '',
        secondTeamId: r?.secondTeamId ?? '',
        thirdTeamId: r?.thirdTeamId ?? '',
        topScorerPlayerId: r?.topScorerPlayerId ?? '',
      });
    } catch (e) {
      onMessage({ text: e instanceof Error ? e.message : 'Не удалось загрузить итоги', ok: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const teamById = useMemo(() => new Map(teams.map(t => [t.id, t])), [teams]);
  const playerById = useMemo(() => new Map(players.map(p => [p.id, p])), [players]);

  const handleSubmit = async () => {
    const { winnerTeamId, secondTeamId, thirdTeamId, topScorerPlayerId } = form;
    if (!winnerTeamId || !secondTeamId || !thirdTeamId || !topScorerPlayerId) {
      onMessage({ text: 'Заполните все четыре поля', ok: false });
      return;
    }
    const uniqueTeams = new Set([winnerTeamId, secondTeamId, thirdTeamId]);
    if (uniqueTeams.size !== 3) {
      onMessage({ text: 'Команды на 1–3 место должны быть разными', ok: false });
      return;
    }

    const confirmText = settled
      ? 'Пересчитать очки по новым итогам турнира? Текущие начисления будут заменены.'
      : 'Зафиксировать итоги и начислить очки всем участникам?';
    if (!window.confirm(confirmText)) return;

    setSaving(true);
    try {
      const res = await api.adminSetTournamentResults({
        winnerTeamId,
        secondTeamId,
        thirdTeamId,
        topScorerPlayerId,
      });
      onMessage({
        text: `Итоги сохранены — обновлено прогнозов: ${res.updated}`,
        ok: true,
      });
      await load();
      await onSettled();
    } catch (e) {
      onMessage({ text: e instanceof Error ? e.message : 'Ошибка сохранения', ok: false });
    } finally {
      setSaving(false);
    }
  };

  const formatSettledAt = (iso: string) =>
    new Date(iso).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Moscow',
    });

  if (loading) {
    return <p className="admin-empty">Загрузка итогов турнира…</p>;
  }

  return (
    <div className="admin-tournament">
      <div className="admin-tournament-intro">
        <p>
          После окончания чемпионата укажите победителя, призёров и бомбардира. Очки начислятся
          автоматически: 30 / 20 / 10 / 20.
        </p>
        <p className="admin-tournament-meta">
          Прогнозов на турнир в базе: <strong>{picksCount}</strong>
          {settled && settledAt && (
            <>
              {' '}
              · зафиксировано {formatSettledAt(settledAt)}
            </>
          )}
        </p>
      </div>

      {settled && (
        <div className="admin-message ok" role="status">
          Итоги уже зафиксированы. Можно изменить поля и пересохранить — очки пересчитаются.
        </div>
      )}

      <div className="admin-tournament-form">
        {PLACE_LABELS.map(({ key, label, points }) => (
          <label key={key} className="admin-tournament-field">
            <span className="admin-tournament-label">
              {label} <span className="admin-tournament-pts">+{points}</span>
            </span>
            <select
              className="admin-select"
              value={form[key]}
              onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
            >
              <option value="">Выберите сборную</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        ))}

        <label className="admin-tournament-field">
          <span className="admin-tournament-label">
            Бомбардир <span className="admin-tournament-pts">+20</span>
          </span>
          <select
            className="admin-select"
            value={form.topScorerPlayerId}
            onChange={e => setForm(prev => ({ ...prev, topScorerPlayerId: e.target.value }))}
          >
            <option value="">Выберите игрока</option>
            {players.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.teamName ? ` · ${p.teamName}` : ''}
              </option>
            ))}
          </select>
        </label>
      </div>

      {(form.winnerTeamId || form.topScorerPlayerId) && (
        <div className="admin-tournament-preview">
          <h4>Предпросмотр</h4>
          <ul>
            {PLACE_LABELS.map(({ key, label }) => {
              const t = teamById.get(form[key]);
              return (
                <li key={key}>
                  {label}: {t?.name ?? '—'}
                </li>
              );
            })}
            <li>
              Бомбардир: {playerById.get(form.topScorerPlayerId)?.name ?? '—'}
            </li>
          </ul>
        </div>
      )}

      <div className="admin-card-actions">
        <button
          type="button"
          className="admin-btn primary lg"
          disabled={saving}
          onClick={() => void handleSubmit()}
        >
          {saving ? 'Сохранение…' : settled ? 'Пересохранить итоги' : 'Зафиксировать итоги'}
        </button>
      </div>
    </div>
  );
}
