import { isPredictableStage } from './match-stages.js';

export function getGameDay(kickoff: string): string {
  return new Date(kickoff).toLocaleDateString('en-CA', { timeZone: 'Europe/Moscow' });
}

/** Границы kickoff (ISO) для календарного дня по Москве — для фильтра в SQL. */
export function getGameDayKickoffBounds(gameDay: string): { start: string; end: string } {
  return {
    start: `${gameDay}T00:00:00+03:00`,
    end: `${gameDay}T23:59:59.999+03:00`,
  };
}

export function isMatchLocked(kickoff: string, status: string): boolean {
  if (status === 'live' || status === 'finished') return true;
  return new Date(kickoff) <= new Date();
}

export function canPredictMatch(stage: string, kickoff: string, status: string): boolean {
  return isPredictableStage(stage) && !isMatchLocked(kickoff, status);
}

export interface MatchPredictionState {
  id: number;
  stage: string;
  kickoff: string;
  status: string;
  hasPrediction: boolean;
}

/** ×2 автоматически: последний матч игрового дня без прогноза, бонус дня ещё не занят. */
export function shouldAutoDoublePick(
  matchId: number,
  dayMatches: MatchPredictionState[],
  doublePickMatchId: number | null | undefined
): boolean {
  if (doublePickMatchId != null && doublePickMatchId !== matchId) return false;
  const pending = dayMatches.filter(
    m =>
      isPredictableStage(m.stage) &&
      canPredictMatch(m.stage, m.kickoff, m.status) &&
      !m.hasPrediction
  ).length;
  return pending === 1;
}
