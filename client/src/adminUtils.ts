import { SquadPlayerOption } from './types';

export const POS_ORDER: Record<string, number> = {
  GK: 0,
  DEF: 1,
  MID: 2,
  FWD: 3,
};

export const POS_GROUPS = ['GK', 'DEF', 'MID', 'FWD'] as const;

export function sortPlayersByPosition(players: SquadPlayerOption[]): SquadPlayerOption[] {
  return [...players].sort((a, b) => {
    const pa = POS_ORDER[a.position] ?? 9;
    const pb = POS_ORDER[b.position] ?? 9;
    return pa - pb || a.name.localeCompare(b.name, 'ru');
  });
}
