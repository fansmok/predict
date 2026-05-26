import { useEffect, useMemo, useState } from 'react';
import { Match, SquadPlayerOption, TournamentOption } from '../types';
import { api } from '../api';
import { POS_GROUPS, sortPlayersByPosition } from '../adminUtils';
import { AdminTournamentSection } from '../components/AdminTournamentSection';
import { AdminModerationSection } from '../components/AdminModerationSection';

interface Props {
  matches: Match[];
  squadPlayers: SquadPlayerOption[];
  tournamentTeams: TournamentOption[];
  tournamentPlayers: TournamentOption[];
  onRefresh: () => Promise<void>;
}

type AdminSection = 'matches' | 'tournament' | 'moderation';

interface GoalRow {
  scorerId: string;
  assistId: string;
}

interface MatchDraft {
  home: string;
  away: string;
  homeGoals: GoalRow[];
  awayGoals: GoalRow[];
  playedIds: Set<string>;
  sentOffIds: Set<string>;
}

const POS_LABEL: Record<string, string> = {
  GK: 'ВР',
  DEF: 'ЗЩ',
  MID: 'ПЗ',
  FWD: 'НАП',
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Ожидается',
  live: 'Идёт',
  finished: 'Завершён',
};

function emptyGoals(count: number): GoalRow[] {
  return Array.from({ length: count }, () => ({ scorerId: '', assistId: '' }));
}

function parseScoreInput(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 0 || n > 15) return null;
  return n;
}

function formatKickoff(kickoff: string): string {
  return new Date(kickoff).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  });
}

function PlayerSelect({
  players,
  value,
  onChange,
  placeholder,
  allowEmpty,
}: {
  players: SquadPlayerOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  allowEmpty?: boolean;
}) {
  return (
    <select
      className="admin-select"
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      {(allowEmpty || !value) && <option value="">{placeholder}</option>}
      {players.map(p => (
        <option key={p.id} value={p.id}>
          {POS_LABEL[p.position] ?? p.position} · {p.name}
        </option>
      ))}
    </select>
  );
}

function TeamParticipationBlock({
  teamName,
  players,
  draft,
  onDraftChange,
}: {
  teamName: string;
  players: SquadPlayerOption[];
  draft: MatchDraft;
  onDraftChange: (d: MatchDraft) => void;
}) {
  const sorted = useMemo(() => sortPlayersByPosition(players), [players]);

  const togglePlayed = (id: string) => {
    const playedIds = new Set(draft.playedIds);
    const sentOffIds = new Set(draft.sentOffIds);
    if (playedIds.has(id)) {
      playedIds.delete(id);
      sentOffIds.delete(id);
    } else {
      playedIds.add(id);
    }
    onDraftChange({ ...draft, playedIds, sentOffIds });
  };

  const toggleSentOff = (id: string) => {
    const sentOffIds = new Set(draft.sentOffIds);
    const playedIds = new Set(draft.playedIds);
    if (sentOffIds.has(id)) sentOffIds.delete(id);
    else {
      sentOffIds.add(id);
      playedIds.add(id);
    }
    onDraftChange({ ...draft, playedIds, sentOffIds });
  };

  return (
    <div className="admin-played-block">
      <h4>{teamName}</h4>
      {POS_GROUPS.map(pos => {
        const group = sorted.filter(p => p.position === pos);
        if (group.length === 0) return null;
        return (
          <div key={pos} className="admin-pos-group">
            <div className="admin-pos-label">{POS_LABEL[pos] ?? pos}</div>
            <div className="admin-played-grid">
              {group.map(p => {
                const played = draft.playedIds.has(p.id);
                const sentOff = draft.sentOffIds.has(p.id);
                return (
                  <div key={p.id} className={`admin-player-row ${played ? 'on' : ''}`}>
                    <label className={`admin-played-check ${played ? 'on' : ''}`}>
                      <input
                        type="checkbox"
                        checked={played}
                        onChange={() => togglePlayed(p.id)}
                      />
                      <span className="admin-played-pos">{POS_LABEL[p.position]}</span>
                      <span>{p.name}</span>
                    </label>
                    {played && (
                      <button
                        type="button"
                        className={`admin-red-card-btn ${sentOff ? 'on' : ''}`}
                        aria-pressed={sentOff}
                        title="Красная карточка (−2)"
                        onClick={() => toggleSentOff(p.id)}
                      >
                        🟥
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MatchEditor({
  match,
  draft,
  squadPlayers,
  loading,
  onDraftChange,
  onSave,
  onStart,
  onReset,
  onSync,
  apiConfigured,
}: {
  match: Match;
  draft: MatchDraft;
  squadPlayers: SquadPlayerOption[];
  loading: boolean;
  onDraftChange: (d: MatchDraft) => void;
  onSave: () => void;
  onStart: () => void;
  onReset: () => void;
  onSync: () => void;
  apiConfigured: boolean;
}) {
  const isFinished = match.status === 'finished';
  const homePlayers = useMemo(
    () => sortPlayersByPosition(squadPlayers.filter(p => p.teamId === match.homeTeam.id)),
    [squadPlayers, match.homeTeam.id]
  );
  const awayPlayers = useMemo(
    () => sortPlayersByPosition(squadPlayers.filter(p => p.teamId === match.awayTeam.id)),
    [squadPlayers, match.awayTeam.id]
  );

  const [editOpen, setEditOpen] = useState(!isFinished);
  const [statsCount, setStatsCount] = useState<number | null>(null);

  useEffect(() => {
    setEditOpen(!isFinished);
    setStatsCount(null);
  }, [match.id, isFinished]);

  useEffect(() => {
    if (!isFinished || editOpen) return;
    void api.adminMatchFantasy(match.id)
      .then(data => setStatsCount(data.statsCount))
      .catch(() => setStatsCount(null));
  }, [match.id, isFinished, editOpen]);

  const loadForEdit = async () => {
    try {
      const data = await api.adminMatchFantasy(match.id);
      onDraftChange({
        home: String(data.homeScore),
        away: String(data.awayScore),
        homeGoals:
          data.homeGoals.length > 0
            ? data.homeGoals.map(g => ({ scorerId: g.scorerId, assistId: g.assistId ?? '' }))
            : emptyGoals(data.homeScore),
        awayGoals:
          data.awayGoals.length > 0
            ? data.awayGoals.map(g => ({ scorerId: g.scorerId, assistId: g.assistId ?? '' }))
            : emptyGoals(data.awayScore),
        playedIds: new Set(data.playedPlayerIds),
        sentOffIds: new Set(data.sentOffPlayerIds),
      });
      setStatsCount(data.statsCount);
      setEditOpen(true);
    } catch (e) {
      onDraftChange({
        home: match.homeScore != null ? String(match.homeScore) : '',
        away: match.awayScore != null ? String(match.awayScore) : '',
        homeGoals: emptyGoals(match.homeScore ?? 0),
        awayGoals: emptyGoals(match.awayScore ?? 0),
        playedIds: new Set(),
        sentOffIds: new Set(),
      });
      setEditOpen(true);
    }
  };

  const homeScore = parseScoreInput(draft.home);
  const awayScore = parseScoreInput(draft.away);
  const scoresValid = homeScore != null && awayScore != null;

  const setScore = (side: 'home' | 'away', val: string) => {
    const next = { ...draft, [side]: val } as MatchDraft;
    const h = parseScoreInput(side === 'home' ? val : draft.home) ?? 0;
    const a = parseScoreInput(side === 'away' ? val : draft.away) ?? 0;
    next.homeGoals = emptyGoals(h).map((row, i) => draft.homeGoals[i] ?? row);
    next.awayGoals = emptyGoals(a).map((row, i) => draft.awayGoals[i] ?? row);
    onDraftChange(next);
  };

  const updateGoal = (side: 'homeGoals' | 'awayGoals', idx: number, field: keyof GoalRow, val: string) => {
    const rows = [...draft[side]];
    rows[idx] = { ...rows[idx], [field]: val };
    const playedIds = new Set(draft.playedIds);
    if (val && (field === 'scorerId' || field === 'assistId')) playedIds.add(val);
    onDraftChange({ ...draft, [side]: rows, playedIds });
  };

  return (
    <div className={`admin-card ${isFinished ? 'finished' : ''}`}>
      <div className="admin-card-head">
        <div className="admin-card-meta">
          <span className="admin-match-id">#{match.id}</span>
          {match.group && <span className="admin-tag">Гр. {match.group}</span>}
          <span className={`admin-status ${match.status}`}>{STATUS_LABEL[match.status] ?? match.status}</span>
        </div>
        <div className="admin-card-teams">
          <img src={match.homeTeam.flag} alt="" aria-hidden="true" className="admin-flag" />
          <span>{match.homeTeam.name}</span>
          <span className="admin-vs">vs</span>
          <span>{match.awayTeam.name}</span>
          <img src={match.awayTeam.flag} alt="" aria-hidden="true" className="admin-flag" />
        </div>
        <div className="admin-card-time">{formatKickoff(match.kickoff)}</div>
        {isFinished && match.homeScore != null && (
          <div className="admin-card-result">
            Итог: {match.homeScore}:{match.awayScore}
          </div>
        )}
      </div>

      {isFinished && !editOpen && (
        <div className="admin-finished-summary">
          <p>
            Результат сохранён.
            {statsCount != null && statsCount > 0
              ? ` Fantasy: ${statsCount} игрок(ов) с начислением.`
              : ' Fantasy-статистика не записана — используйте «Подтянуть из API» или редактирование.'}
          </p>
          <div className="admin-card-actions">
            <button type="button" className="admin-btn primary" disabled={loading} onClick={() => void loadForEdit()}>
              Редактировать состав и события
            </button>
            {apiConfigured && (
              <button type="button" className="admin-btn" disabled={loading} onClick={onSync}>
                Подтянуть из API
              </button>
            )}
            <button type="button" className="admin-btn" disabled={loading} onClick={onReset}>
              Сбросить матч
            </button>
          </div>
        </div>
      )}

      {(!isFinished || editOpen) && (
        <div className="admin-card-body">
          <div className="admin-step">
            <div className="admin-step-title">
              <span className="admin-step-num">1</span>
              Счёт матча
            </div>
            <p className="admin-step-hint">
              После сохранения прогнозистам начислятся очки. Итоги — в Telegram-дайджесте в 10:00 МСК.
            </p>
            <div className="admin-score-row">
              <div className="admin-score-team">
                <span>{match.homeTeam.name}</span>
                <input
                  type="number"
                  min={0}
                  max={15}
                  className="admin-score-input-lg"
                  value={draft.home}
                  onChange={e => setScore('home', e.target.value)}
                  aria-label={`Голы: ${match.homeTeam.name}`}
                />
              </div>
              <span className="admin-score-sep">:</span>
              <div className="admin-score-team">
                <span>{match.awayTeam.name}</span>
                <input
                  type="number"
                  min={0}
                  max={15}
                  className="admin-score-input-lg"
                  value={draft.away}
                  onChange={e => setScore('away', e.target.value)}
                  aria-label={`Голы: ${match.awayTeam.name}`}
                />
              </div>
            </div>
          </div>

          {scoresValid && (
            <div className="admin-step">
              <div className="admin-step-title">
                <span className="admin-step-num">2</span>
                Участники матча (Fantasy)
              </div>
              <p className="admin-step-hint">
                Отметьте всех, кто выходил на поле (≥1 мин). <strong>Победа +1</strong> — всем отмеченным из
                победившей сборной. <strong>ВР/ЗЩ:</strong> сухой матч +2 или −1 за каждый пропущенный.
                Красная карточка — кнопка 🟥 у отмеченного игрока (−2). API подтягивает это автоматически.
              </p>
              <TeamParticipationBlock
                teamName={match.homeTeam.name}
                players={homePlayers}
                draft={draft}
                onDraftChange={onDraftChange}
              />
              <TeamParticipationBlock
                teamName={match.awayTeam.name}
                players={awayPlayers}
                draft={draft}
                onDraftChange={onDraftChange}
              />
              {draft.playedIds.size === 0 && (
                <p className="admin-step-warn">Никто не отмечен — очки за победу и участие не начислятся.</p>
              )}
            </div>
          )}

          {scoresValid && (homeScore ?? 0) + (awayScore ?? 0) > 0 && (
            <div className="admin-step">
              <div className="admin-step-title">
                <span className="admin-step-num">3</span>
                Голы и передачи
              </div>
              <p className="admin-step-hint">
                Для каждого гола — автор (+2) и передача (+1, необязательно). Авторы и ассистенты автоматически
                попадают в участники.
              </p>

              {(homeScore ?? 0) > 0 && (
                <div className="admin-goals-block">
                  <h4>{match.homeTeam.name} — {homeScore} гол(ов)</h4>
                  {draft.homeGoals.map((g, i) => (
                    <div key={i} className="admin-goal-row">
                      <span className="admin-goal-num">{i + 1}.</span>
                      <PlayerSelect
                        players={homePlayers}
                        value={g.scorerId}
                        onChange={id => updateGoal('homeGoals', i, 'scorerId', id)}
                        placeholder="Кто забил"
                      />
                      <PlayerSelect
                        players={homePlayers}
                        value={g.assistId}
                        onChange={id => updateGoal('homeGoals', i, 'assistId', id)}
                        placeholder="Пас (необяз.)"
                        allowEmpty
                      />
                    </div>
                  ))}
                </div>
              )}

              {(awayScore ?? 0) > 0 && (
                <div className="admin-goals-block">
                  <h4>{match.awayTeam.name} — {awayScore} гол(ов)</h4>
                  {draft.awayGoals.map((g, i) => (
                    <div key={i} className="admin-goal-row">
                      <span className="admin-goal-num">{i + 1}.</span>
                      <PlayerSelect
                        players={awayPlayers}
                        value={g.scorerId}
                        onChange={id => updateGoal('awayGoals', i, 'scorerId', id)}
                        placeholder="Кто забил"
                      />
                      <PlayerSelect
                        players={awayPlayers}
                        value={g.assistId}
                        onChange={id => updateGoal('awayGoals', i, 'assistId', id)}
                        placeholder="Пас (необяз.)"
                        allowEmpty
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="admin-card-actions">
            <button
              type="button"
              className="admin-btn primary lg"
              disabled={loading}
              onClick={onSave}
            >
              {isFinished ? 'Пересохранить результат' : 'Сохранить результат'}
            </button>
            {apiConfigured && (
              <button type="button" className="admin-btn" disabled={loading} onClick={onSync}>
                Подтянуть из API
              </button>
            )}
            {!isFinished && (
              <button type="button" className="admin-btn" disabled={loading} onClick={onStart}>
                Начать матч (Live)
              </button>
            )}
            {isFinished && editOpen && (
              <button type="button" className="admin-btn" disabled={loading} onClick={() => setEditOpen(false)}>
                Отмена
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

function defaultDraft(): MatchDraft {
  return { home: '', away: '', homeGoals: [], awayGoals: [], playedIds: new Set(), sentOffIds: new Set() };
}

export function AdminPage({ matches, squadPlayers, tournamentTeams, tournamentPlayers, onRefresh }: Props) {
  const [section, setSection] = useState<AdminSection>('matches');
  const [drafts, setDrafts] = useState<Record<number, MatchDraft>>({});
  const [loading, setLoading] = useState<number | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    configured: boolean;
    pendingMatches: number;
    leagueId: string;
    season: string;
  } | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [filter, setFilter] = useState<'upcoming' | 'finished' | 'all'>('upcoming');

  const refreshSyncStatus = async () => {
    try {
      const status = await api.adminSyncStatus();
      setSyncStatus(status);
    } catch {
      setSyncStatus(null);
    }
  };

  useEffect(() => {
    void refreshSyncStatus();
  }, []);

  const getDraft = (matchId: number) => drafts[matchId] ?? defaultDraft();

  const setDraft = (matchId: number, d: MatchDraft) => {
    setDrafts(prev => ({ ...prev, [matchId]: d }));
  };

  const handleSave = async (match: Match) => {
    const draft = getDraft(match.id);
    const home = parseScoreInput(draft.home);
    const away = parseScoreInput(draft.away);

    if (home == null || away == null) {
      setMessage({ text: 'Введите корректный счёт (0–15)', ok: false });
      return;
    }

    for (let i = 0; i < draft.homeGoals.length; i++) {
      if (!draft.homeGoals[i].scorerId) {
        setMessage({ text: `${match.homeTeam.name}: укажите автора гола #${i + 1}`, ok: false });
        return;
      }
    }
    for (let i = 0; i < draft.awayGoals.length; i++) {
      if (!draft.awayGoals[i].scorerId) {
        setMessage({ text: `${match.awayTeam.name}: укажите автора гола #${i + 1}`, ok: false });
        return;
      }
    }

    setLoading(match.id);
    setMessage(null);
    try {
      const res = await api.adminMatchResult(match.id, home, away, {
        homeGoals: draft.homeGoals.map(g => ({
          scorerId: g.scorerId,
          assistId: g.assistId || null,
        })),
        awayGoals: draft.awayGoals.map(g => ({
          scorerId: g.scorerId,
          assistId: g.assistId || null,
        })),
        playedPlayerIds: [...draft.playedIds],
        sentOffPlayerIds: [...draft.sentOffIds],
      });
      setMessage({
        text: `Матч #${match.id}: ${home}:${away} — прогнозы: ${res.updated ?? 0}, fantasy-строк: ${res.squadStats ?? 0}`,
        ok: true,
      });
      setDrafts(prev => {
        const next = { ...prev };
        delete next[match.id];
        return next;
      });
      await onRefresh();
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : 'Ошибка', ok: false });
    } finally {
      setLoading(null);
    }
  };

  const handleStart = async (matchId: number) => {
    setLoading(matchId);
    try {
      await api.adminMatchStart(matchId);
      setMessage({ text: `Матч #${matchId} переведён в Live — прогнозы закрыты`, ok: true });
      await onRefresh();
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : 'Ошибка', ok: false });
    } finally {
      setLoading(null);
    }
  };

  const handleReset = async (matchId: number) => {
    setLoading(matchId);
    try {
      await api.adminMatchReset(matchId);
      setMessage({ text: `Матч #${matchId} сброшен (счёт, очки, fantasy-статистика)`, ok: true });
      await onRefresh();
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : 'Ошибка', ok: false });
    } finally {
      setLoading(null);
    }
  };

  const handleSyncMatch = async (matchId: number, force = false) => {
    setLoading(matchId);
    setMessage(null);
    try {
      const res = await api.adminSyncMatch(matchId, force);
      if (res.ok) {
        const warn = res.warnings?.length ? ` (${res.warnings.length} предупр.)` : '';
        setMessage({
          text: `API #${matchId}: ${res.homeScore}:${res.awayScore} — прогнозы: ${res.predictions ?? 0}, fantasy: ${res.squadStats ?? '—'}${warn}`,
          ok: true,
        });
        setDrafts(prev => {
          const next = { ...prev };
          delete next[matchId];
          return next;
        });
        await onRefresh();
        await refreshSyncStatus();
      } else {
        setMessage({ text: res.error ?? 'Синхронизация не удалась', ok: false });
      }
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : 'Ошибка', ok: false });
    } finally {
      setLoading(null);
    }
  };

  const handleSyncAll = async () => {
    setSyncLoading(true);
    setMessage(null);
    try {
      const res = await api.adminSyncAll();
      if (!res.configured) {
        setMessage({ text: 'FOOTBALL_API_KEY не настроен на сервере', ok: false });
        return;
      }
      const errPart = res.errors.length ? `; ошибок: ${res.errors.length}` : '';
      setMessage({
        text: `Синхронизация: обновлено ${res.updated} из ${res.processed}${errPart}`,
        ok: res.updated > 0 || res.errors.length === 0,
      });
      await onRefresh();
      await refreshSyncStatus();
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : 'Ошибка', ok: false });
    } finally {
      setSyncLoading(false);
    }
  };

  const apiConfigured = syncStatus?.configured ?? false;

  const filteredMatches = useMemo(() => {
    const list = [...matches].sort((a, b) => a.id - b.id);
    if (filter === 'upcoming') return list.filter(m => m.status !== 'finished');
    if (filter === 'finished') return list.filter(m => m.status === 'finished').reverse();
    return list;
  }, [matches, filter]);

  const renderMatchEditor = (m: Match) => (
    <MatchEditor
      key={m.id}
      match={m}
      draft={getDraft(m.id)}
      squadPlayers={squadPlayers}
      loading={loading === m.id}
      onDraftChange={d => setDraft(m.id, d)}
      onSave={() => handleSave(m)}
      onStart={() => handleStart(m.id)}
      onReset={() => handleReset(m.id)}
      onSync={() => void handleSyncMatch(m.id, m.status === 'finished')}
      apiConfigured={apiConfigured}
    />
  );

  return (
    <div className="admin-page">
      <div className="admin-hero">
        <h2>Admin — ЧМ-2026</h2>
        <p>
          {section === 'matches'
            ? 'Результаты матчей и fantasy. API подтягивает счёт автоматически.'
            : section === 'tournament'
              ? 'Итоги чемпионата для прогнозов на турнир и начисления очков.'
              : 'Удаление лиг и пользователей — только для администраторов приложения.'}
        </p>
      </div>

      <div className="admin-filters admin-section-tabs">
        <button
          type="button"
          className={`admin-filter-btn ${section === 'matches' ? 'active' : ''}`}
          aria-pressed={section === 'matches'}
          onClick={() => setSection('matches')}
        >
          Матчи
        </button>
        <button
          type="button"
          className={`admin-filter-btn ${section === 'tournament' ? 'active' : ''}`}
          aria-pressed={section === 'tournament'}
          onClick={() => setSection('tournament')}
        >
          Прогнозы на турнир
        </button>
        <button
          type="button"
          className={`admin-filter-btn ${section === 'moderation' ? 'active' : ''}`}
          aria-pressed={section === 'moderation'}
          onClick={() => setSection('moderation')}
        >
          Модерация
        </button>
      </div>

      {section === 'moderation' ? (
        <AdminModerationSection onChanged={onRefresh} />
      ) : section === 'tournament' ? (
        <section className="admin-section">
          <h3 className="admin-section-title">Итоги турнира</h3>
          {message && message.text && (
            <div className={`admin-message ${message.ok ? 'ok' : 'err'}`} role={message.ok ? 'status' : 'alert'}>
              {message.text}
            </div>
          )}
          <AdminTournamentSection
            teams={tournamentTeams}
            players={tournamentPlayers}
            onSettled={onRefresh}
            onMessage={setMessage}
          />
        </section>
      ) : (
        <>
      {syncStatus && (
        <div className="admin-sync-bar">
          <div className="admin-sync-info">
            <span className={`admin-sync-dot ${syncStatus.configured ? 'on' : ''}`} />
            {syncStatus.configured
              ? `API подключён · лига ${syncStatus.leagueId}, сезон ${syncStatus.season} · ожидают: ${syncStatus.pendingMatches}`
              : 'API не настроен — только ручной ввод (FOOTBALL_API_KEY)'}
          </div>
          {syncStatus.configured && (
            <button
              type="button"
              className="admin-btn primary"
              disabled={syncLoading || syncStatus.pendingMatches === 0}
              onClick={() => void handleSyncAll()}
            >
              {syncLoading ? 'Синхронизация…' : 'Синхронизировать все'}
            </button>
          )}
        </div>
      )}

      <div className="admin-rules">
        <div className="admin-rule"><strong>1.</strong> Live — закрывает прогнозы</div>
        <div className="admin-rule"><strong>2.</strong> Счёт — очки прогнозистам (5 / 3 / 2, ×2)</div>
        <div className="admin-rule"><strong>3.</strong> Fantasy: победа +1, гол +2, пас +1, сухой +2, пропущ. −1, 🟥 −2</div>
        <div className="admin-rule"><strong>4.</strong> Участники — кто выходил на поле (API или вручную)</div>
      </div>

      {message && (
        <div className={`admin-message ${message.ok ? 'ok' : 'err'}`} role={message.ok ? 'status' : 'alert'}>
          {message.text}
        </div>
      )}

      <div className="admin-filters">
        {(['upcoming', 'finished', 'all'] as const).map(f => (
          <button
            key={f}
            type="button"
            className={`admin-filter-btn ${filter === f ? 'active' : ''}`}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {f === 'upcoming' ? 'Предстоящие' : f === 'finished' ? 'Завершённые' : 'Все'}
          </button>
        ))}
      </div>

      <section className="admin-section">
        <h3 className="admin-section-title">Матчи чемпионата</h3>
        <div className="admin-card-list">
          {filteredMatches.length === 0 && (
            <p className="admin-empty">Нет матчей в этой категории.</p>
          )}
          {filteredMatches.map(renderMatchEditor)}
        </div>
      </section>
        </>
      )}
    </div>
  );
}
