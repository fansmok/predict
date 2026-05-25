export function ruPlural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(Math.trunc(n));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

export function ruPluralGenitive(n: number, singular: string, plural: string): string {
  const abs = Math.abs(Math.trunc(n));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return singular;
  return plural;
}

export function ruCount(n: number, one: string, few: string, many: string): string {
  return `${n} ${ruPlural(n, one, few, many)}`;
}

export function ruGenitiveCount(n: number, singular: string, plural: string): string {
  return `${n} ${ruPluralGenitive(n, singular, plural)}`;
}

export function formatMatches(n: number): string {
  return ruCount(n, 'матч', 'матча', 'матчей');
}

export function formatMatchesGenitive(n: number): string {
  return ruGenitiveCount(n, 'матча', 'матчей');
}

export function formatPoints(n: number): string {
  return ruCount(n, 'очко', 'очка', 'очков');
}

/** Только слово: «очко» / «очка» / «очков» */
export function formatPointsWord(n: number): string {
  return ruPlural(n, 'очко', 'очка', 'очков');
}
