import { SquadPlayerOption, SquadPosition } from '../types';
import { lastName } from '../utils';
import { IconDice } from './Icons';

/** Координаты слотов на поле (%, сверху вниз — атака) */
export const PITCH_SLOTS: Array<{ slot: number; x: number; y: number; position: SquadPosition }> = [
  { slot: 8, x: 18, y: 14, position: 'FWD' },
  { slot: 9, x: 50, y: 10, position: 'FWD' },
  { slot: 10, x: 82, y: 14, position: 'FWD' },
  { slot: 5, x: 22, y: 38, position: 'MID' },
  { slot: 6, x: 50, y: 42, position: 'MID' },
  { slot: 7, x: 78, y: 38, position: 'MID' },
  { slot: 1, x: 12, y: 62, position: 'DEF' },
  { slot: 2, x: 35, y: 66, position: 'DEF' },
  { slot: 3, x: 65, y: 66, position: 'DEF' },
  { slot: 4, x: 88, y: 62, position: 'DEF' },
  { slot: 0, x: 50, y: 86, position: 'GK' },
];

const POS_LABEL: Record<SquadPosition, string> = {
  GK: 'ВР',
  DEF: 'ЗЩ',
  MID: 'ПЗ',
  FWD: 'НП',
};

interface Props {
  slots: Array<SquadPlayerOption | null>;
  locked: boolean;
  readonly?: boolean;
  onSlotClick: (slot: number) => void;
  showRandomDice?: boolean;
  onRandom?: () => void;
}

export function FantasyPitch({ slots, locked, readonly, onSlotClick, showRandomDice, onRandom }: Props) {
  const viewOnly = readonly || locked;
  return (
    <div className="fantasy-pitch-wrap">
      <div className="fantasy-pitch-header">
        <span className="fantasy-formation">4 — 3 — 3</span>
        <span className="fantasy-pitch-label">{readonly ? 'Состав' : 'Ваш состав'}</span>
      </div>
      <div className="fantasy-pitch">
        <svg className="pitch-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <rect x="2" y="2" width="96" height="96" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.4" />
          <line x1="2" y1="50" x2="98" y2="50" stroke="rgba(255,255,255,0.35)" strokeWidth="0.35" />
          <circle cx="50" cy="50" r="10" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.35" />
          <circle cx="50" cy="50" r="0.8" fill="rgba(255,255,255,0.5)" />
          <rect x="22" y="2" width="56" height="16" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.35" />
          <rect x="22" y="82" width="56" height="16" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.35" />
          <rect x="34" y="2" width="32" height="6" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.3" />
          <rect x="34" y="92" width="32" height="6" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.3" />
        </svg>

        {PITCH_SLOTS.map(({ slot, x, y, position }) => {
          const player = slots[slot];
          if (readonly && !player) return null;

          const slotClass = `pitch-slot ${player ? 'filled' : 'empty'} ${player?.fifaGroup ? `g${player.fifaGroup}` : ''} ${viewOnly ? 'locked' : ''}`;
          const slotStyle = { left: `${x}%`, top: `${y}%` };
          const slotContent = player ? (
            <>
              <span className="pitch-slot-avatar">
                <img src={player.flag} alt="" aria-hidden="true" className="pitch-slot-flag" />
              </span>
              <span className="pitch-slot-name">{lastName(player.name)}</span>
            </>
          ) : (
            <>
              <span className="pitch-slot-plus">+</span>
              <span className="pitch-slot-pos">{POS_LABEL[position]}</span>
            </>
          );

          if (readonly) {
            return (
              <div
                key={slot}
                className={`${slotClass} readonly`}
                style={slotStyle}
                aria-label={player ? `${player.name}, ${POS_LABEL[position]}` : undefined}
              >
                {slotContent}
              </div>
            );
          }

          return (
            <button
              key={slot}
              type="button"
              className={slotClass}
              style={slotStyle}
              onClick={() => onSlotClick(slot)}
              disabled={viewOnly && !player}
              aria-label={
                player
                  ? `${player.name}, ${POS_LABEL[position]}`
                  : `Добавить игрока: ${POS_LABEL[position]}`
              }
            >
              {slotContent}
            </button>
          );
        })}
        {showRandomDice && onRandom && !readonly && (
          <div className="pitch-random-wrap">
            <button
              type="button"
              className="pitch-random-dice"
              onClick={onRandom}
              aria-label="Случайный состав — собрать команду автоматически"
            >
              <IconDice size={20} />
            </button>
            <span className="pitch-random-label">случайный состав</span>
          </div>
        )}
      </div>
    </div>
  );
}
