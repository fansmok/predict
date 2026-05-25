import { FifaGroupId, SquadPlayerOption, SquadPosition } from '../types';

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function tryBuildRandomSquad(
  options: SquadPlayerOption[],
  slotPositions: SquadPosition[],
  maxPerTeam: number,
  maxPerGroup: Partial<Record<FifaGroupId, number>>
): Array<SquadPlayerOption | null> | null {
  const teamCounts: Record<string, number> = {};
  const groupCounts: Partial<Record<FifaGroupId, number>> = {};
  const used = new Set<string>();
  const slots: Array<SquadPlayerOption | null> = Array(slotPositions.length).fill(null);

  const order = slotPositions.map((_, i) => i);
  shuffle(order);

  for (const slotIdx of order) {
    const pos = slotPositions[slotIdx];
    const candidates = options.filter(p => {
      if (p.position !== pos || used.has(p.id)) return false;
      if ((teamCounts[p.teamId] ?? 0) >= maxPerTeam) return false;
      if (p.fifaGroup) {
        const max = maxPerGroup[p.fifaGroup] ?? 3;
        if ((groupCounts[p.fifaGroup] ?? 0) >= max) return false;
      }
      return true;
    });

    if (candidates.length === 0) return null;

    const player = candidates[Math.floor(Math.random() * candidates.length)];
    slots[slotIdx] = player;
    used.add(player.id);
    teamCounts[player.teamId] = (teamCounts[player.teamId] ?? 0) + 1;
    if (player.fifaGroup) {
      groupCounts[player.fifaGroup] = (groupCounts[player.fifaGroup] ?? 0) + 1;
    }
  }

  return slots;
}

export function buildRandomSquad(
  options: SquadPlayerOption[],
  slotPositions: SquadPosition[],
  maxPerTeam: number,
  maxPerGroup: Partial<Record<FifaGroupId, number>>
): Array<SquadPlayerOption | null> | null {
  for (let attempt = 0; attempt < 300; attempt++) {
    const result = tryBuildRandomSquad(options, slotPositions, maxPerTeam, maxPerGroup);
    if (result && result.every(Boolean)) return result;
  }
  return null;
}
