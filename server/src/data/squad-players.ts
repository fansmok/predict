import { TEAM_ROSTERS } from './squad-rosters.js';
import { TEAMS } from './matches.js';

export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface SquadPlayer {
  id: string;
  name: string;
  teamId: string;
  position: PlayerPosition;
}

export const SQUAD_SIZE = 11;
export const MAX_PLAYERS_PER_TEAM = 2;
export const FORMATION = '4-3-3';

export const SLOT_POSITIONS: PlayerPosition[] = [
  'GK',
  'DEF', 'DEF', 'DEF', 'DEF',
  'MID', 'MID', 'MID',
  'FWD', 'FWD', 'FWD',
];

function slug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40);
}

function buildPlayers(): SquadPlayer[] {
  const players: SquadPlayer[] = [];
  const seen = new Set<string>();

  for (const [teamId, roster] of Object.entries(TEAM_ROSTERS)) {
    if (!TEAMS[teamId]) continue;

    const add = (name: string, position: PlayerPosition) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const id = `sq_${teamId}_${slug(trimmed)}`;
      if (seen.has(id)) return;
      seen.add(id);
      players.push({ id, name: trimmed, teamId, position });
    };

    for (const n of roster.gk) add(n, 'GK');
    for (const n of roster.def) add(n, 'DEF');
    for (const n of roster.mid) add(n, 'MID');
    for (const n of roster.fwd) add(n, 'FWD');
  }

  return players.sort((a, b) => a.name.localeCompare(b.name));
}

export const SQUAD_PLAYERS: SquadPlayer[] = buildPlayers();

export function getSquadPlayer(id: string): SquadPlayer | undefined {
  return SQUAD_PLAYERS.find(p => p.id === id);
}

export const SQUAD_SCORING = {
  win: 1,
  goal: 2,
  assist: 1,
  cleanSheet: 2,
  goalConceded: -1,
  sentOff: -2,
} as const;

export const POSITION_ORDER: Record<PlayerPosition, number> = {
  GK: 0,
  DEF: 1,
  MID: 2,
  FWD: 3,
};

export function compareByPositionThenName(
  a: { position: PlayerPosition; name: string },
  b: { position: PlayerPosition; name: string }
): number {
  return (
    POSITION_ORDER[a.position] - POSITION_ORDER[b.position] ||
    a.name.localeCompare(b.name, 'ru')
  );
}

export function getRequiredPosition(slot: number): PlayerPosition {
  return SLOT_POSITIONS[slot] ?? 'MID';
}
