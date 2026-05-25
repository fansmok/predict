import { FifaGroupId } from './types';

export const GROUP_TONE: Record<FifaGroupId, string> = {
  1: 'gold',
  2: 'accent',
  3: 'blue',
  4: 'muted',
};

export const GROUP_SHORT: Record<FifaGroupId, string> = {
  1: 'Элита',
  2: 'Сильные',
  3: 'Середина',
  4: 'Аутсайдеры',
};

export const GROUP_LEGEND: Array<{ id: FifaGroupId; label: string }> = [
  { id: 1, label: 'Элита' },
  { id: 2, label: 'Сильные' },
  { id: 3, label: 'Середина' },
  { id: 4, label: 'Аутсайдеры' },
];

export function groupClass(groupId?: FifaGroupId): string {
  return groupId ? `g${groupId}` : '';
}
