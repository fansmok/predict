export const SQUAD_SCORING = {
  win: 1,
  goal: 2,
  assist: 1,
  cleanSheet: 2,
  goalConceded: -1,
  sentOff: -2,
} as const;

export type SquadScoringKey = keyof typeof SQUAD_SCORING;

export function squadCategoryPoints(key: SquadScoringKey, count: number): number {
  return SQUAD_SCORING[key] * count;
}

export function formatSquadPoints(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}
