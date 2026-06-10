import { useState, useMemo, useEffect } from 'react';
import { SquadData, SquadPlayerOption, SquadPosition, FifaGroupId } from '../types';
import { FantasyPitch } from '../components/FantasyPitch';
import { PlayerPickerSheet } from '../components/PlayerPickerSheet';
import { SquadGroupRules } from '../components/SquadGroupRules';
import { SquadScoringPanel } from '../components/SquadScoringPanel';
import { SquadPointsBreakdown } from '../components/SquadPointsBreakdown';
import { SquadPlayerPointsList } from '../components/SquadPlayerPointsList';
import { buildRandomSquad } from '../utils/randomSquad';
import { formatPointsWord } from '../utils';

const SQUAD_SIZE = 11;
const SLOT_POSITIONS: SquadPosition[] = [
  'GK', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'FWD', 'FWD', 'FWD',
];

const DEFAULT_SLOTS: Array<SquadPlayerOption | null> = Array(SQUAD_SIZE).fill(null);

interface Props {
  data: SquadData;
  options: SquadPlayerOption[];
  optionsError?: string;
  onSave: (playerIds: string[]) => Promise<void>;
}

function buildSlotsFromData(
  data: SquadData,
  options: SquadPlayerOption[]
): Array<SquadPlayerOption | null> {
  const slots = [...DEFAULT_SLOTS];
  for (const p of data.players) {
    const slot = p.slot ?? slots.findIndex(s => s === null);
    if (slot >= 0 && slot < SQUAD_SIZE) {
      slots[slot] = options.find(o => o.id === p.id) ?? p;
    }
  }
  return slots;
}

export function SquadPage({ data, options, optionsError, onSave }: Props) {
  const [slots, setSlots] = useState<Array<SquadPlayerOption | null>>(() =>
    buildSlotsFromData(data, options)
  );
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const slotPositions = data.slotPositions ?? SLOT_POSITIONS;

  useEffect(() => {
    setSlots(buildSlotsFromData(data, options));
  }, [data.complete, data.players, data.locked, options]);

  const filledCount = slots.filter(Boolean).length;

  const teamCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of slots) {
      if (p) counts[p.teamId] = (counts[p.teamId] ?? 0) + 1;
    }
    return counts;
  }, [slots]);

  const groupCounts = useMemo(() => {
    const counts: Partial<Record<FifaGroupId, number>> = {};
    for (const p of slots) {
      if (p?.fifaGroup) counts[p.fifaGroup] = (counts[p.fifaGroup] ?? 0) + 1;
    }
    return counts;
  }, [slots]);

  const maxPerGroup = useMemo(() => {
    const map: Partial<Record<FifaGroupId, number>> = { 1: 3, 2: 3, 3: 3, 4: 2 };
    for (const rule of data.groupRules ?? []) {
      map[rule.id] = rule.maxPlayers;
    }
    return map;
  }, [data.groupRules]);

  const groupRules = data.groupRules ?? [];

  const selectedIds = useMemo(
    () => new Set(slots.filter(Boolean).map(p => p!.id)),
    [slots]
  );

  const activePosition: SquadPosition =
    activeSlot !== null ? slotPositions[activeSlot] : 'MID';

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  };

  const handleSelect = (playerId: string) => {
    if (activeSlot === null) return;
    const player = options.find(p => p.id === playerId);
    if (!player) return;

    setSlots(prev => {
      const next = [...prev];
      const existingIdx = next.findIndex(s => s?.id === playerId);
      if (existingIdx >= 0) next[existingIdx] = null;
      next[activeSlot] = player;
      return next;
    });
  };

  const handleRandom = () => {
    if (options.length === 0) {
      showToast('Список игроков недоступен');
      return;
    }
    const random = buildRandomSquad(options, slotPositions, data.maxPerTeam, maxPerGroup);
    if (!random) {
      showToast('Не удалось собрать состав — попробуйте ещё раз');
      return;
    }
    setSlots(random);
    setActiveSlot(null);
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
  };

  const handleSave = async () => {
    const ids = slots.map(s => s?.id ?? null);
    if (ids.some(id => !id)) return;
    setSaving(true);
    try {
      await onSave(ids as string[]);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Не удалось сохранить состав';
      showToast(message);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmClick = () => {
    if (!canSave || saving) return;
    handleSave();
  };

  const savedKey = data.players
    .map(p => `${p.slot ?? 0}:${p.id}`)
    .sort()
    .join(',');
  const currentKey = slots
    .map((s, i) => (s ? `${i}:${s.id}` : ''))
    .filter(Boolean)
    .sort()
    .join(',');
  const isComplete = filledCount === SQUAD_SIZE;
  const canSave = !data.locked && isComplete && (savedKey !== currentKey || !data.complete);
  const squadSavedComplete = data.complete && isComplete && savedKey === currentKey;
  const showRandomDice = !data.locked && !data.squadConfirmedAt;
  const isLateFill = Boolean(data.tournamentStarted && !data.locked && !data.complete);

  return (
    <div className="squad-page fantasy page-stack">
      <div className="squad-top-bar">
        <div className="squad-top-left">
          <span className="squad-top-title">Fantasy ЧМ-2026</span>
          <span className="squad-top-sub">
            {filledCount}/{SQUAD_SIZE} · до 2 из сборной · до 3 из категории FIFA
          </span>
        </div>
        <div className="squad-points-badge">
          <span className="squad-points-value">{data.points.total}</span>
          <span className="squad-points-label">{formatPointsWord(data.points.total)}</span>
        </div>
      </div>

      {optionsError && (
        <div className="error-banner" role="alert">{optionsError}</div>
      )}

      <FantasyPitch
        slots={slots}
        locked={data.locked}
        onSlotClick={slot => !data.locked && setActiveSlot(slot)}
        showRandomDice={showRandomDice}
        onRandom={handleRandom}
      />

      {!data.locked && !data.tournamentStarted && (
        <p className="squad-hint">Нажмите на позицию → выберите сборную → выберите игрока</p>
      )}

      {isLateFill && (
        <p className="squad-hint squad-hint--late">
          Турнир уже начался — соберите состав один раз до 24 июня 20:00 МСК. После сохранения изменить его нельзя.
        </p>
      )}

      {data.locked && data.complete && (
        <p className="squad-hint squad-hint--locked">
          Состав зафиксирован — редактирование доступно только до старта ЧМ
        </p>
      )}

      {data.locked && data.players.length === 0 && data.lateSquadWindowClosed && (
        <div className="empty-state">Приём составов закрыт — собрать команду можно было до 24 июня 20:00 МСК</div>
      )}

      {data.locked && data.players.length === 0 && !data.lateSquadWindowClosed && (
        <div className="empty-state">Состав не собран</div>
      )}

      {groupRules.length > 0 && !squadSavedComplete && (
        <SquadGroupRules
          rules={groupRules}
          slots={slots}
          maxPerTeam={data.maxPerTeam}
          locked={data.locked}
        />
      )}

      <SquadScoringPanel lateSquad={data.lateSquad} />

      {data.players.length > 0 && (
        <div className="squad-summary-card">
          <SquadPointsBreakdown points={data.points} />
        </div>
      )}

      {data.players.length > 0 && (
        <SquadPlayerPointsList players={data.players} />
      )}

      {canSave && (
        <div className="squad-save-bar">
          <button
            type="button"
            className="squad-save-btn"
            onClick={handleConfirmClick}
            disabled={saving}
          >
            {saving ? 'Сохранение...' : 'Подтвердить состав'}
          </button>
        </div>
      )}

      {toast && (
        <div className="squad-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}

      <PlayerPickerSheet
        open={activeSlot !== null && !data.locked}
        slot={activeSlot ?? 0}
        position={activePosition}
        options={options}
        selectedIds={selectedIds}
        teamCounts={teamCounts}
        groupCounts={groupCounts}
        maxPerTeam={data.maxPerTeam}
        maxPerGroup={maxPerGroup}
        currentPlayerId={activeSlot !== null ? slots[activeSlot]?.id : null}
        onSelect={handleSelect}
        onClear={() => {
          if (activeSlot === null) return;
          setSlots(prev => {
            const next = [...prev];
            next[activeSlot] = null;
            return next;
          });
        }}
        onClose={() => setActiveSlot(null)}
      />
    </div>
  );
}
