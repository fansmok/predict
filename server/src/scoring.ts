export function calculatePoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
  isDouble = false
): number {
  let base = 0;

  if (predictedHome === actualHome && predictedAway === actualAway) {
    base = 5;
  } else {
    const predDiff = predictedHome - predictedAway;
    const actualDiff = actualHome - actualAway;

    if (predDiff === actualDiff) {
      base = 3;
    } else {
      const predOutcome = predDiff === 0 ? 'draw' : predDiff > 0 ? 'home' : 'away';
      const actualOutcome = actualDiff === 0 ? 'draw' : actualDiff > 0 ? 'home' : 'away';
      if (predOutcome === actualOutcome) base = 2;
    }
  }

  if (base > 0 && isDouble) return base * 2;
  return base;
}

export function getOutcomeLabel(home: number, away: number): string {
  if (home > away) return 'П1';
  if (home < away) return 'П2';
  return 'X';
}
