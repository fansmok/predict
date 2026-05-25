/** Все стадии ЧМ: рейтинг, fantasy, админка, синк API. */
export const TOURNAMENT_STAGES = ['group', 'r32', 'r16', 'qf', 'sf', 'third', 'final'] as const;
export type TournamentStage = (typeof TOURNAMENT_STAGES)[number];

/**
 * Плей-офф в UI прогнозов. Включить, когда известны пары (поставить true).
 */
export const PLAYOFF_PREDICTIONS_ENABLED = false;

/** Стадии, на которые пользователь может ставить прогноз в приложении. */
export const PREDICTION_STAGES = (
  PLAYOFF_PREDICTIONS_ENABLED
    ? TOURNAMENT_STAGES
    : (['group'] as const)
) as readonly TournamentStage[];

export type PredictableStage = (typeof PREDICTION_STAGES)[number];

/** Стадии с очками в глобальном рейтинге. */
export const RANKED_STAGES = TOURNAMENT_STAGES;

/** @deprecated Используйте isPredictableStage / RANKED_STAGES */
export const RANKED_MATCH_STAGE = 'group';

/** @deprecated Используйте PREDICTION_STAGES */
export const PREDICTABLE_STAGES = PREDICTION_STAGES;

export function isPredictableStage(stage: string): stage is PredictableStage {
  return (PREDICTION_STAGES as readonly string[]).includes(stage);
}

export function isRankedStage(stage: string): boolean {
  return (RANKED_STAGES as readonly string[]).includes(stage);
}

/** SQL IN (...) для списка матчей в API прогнозов. */
export function stagesSqlIn(): string {
  return PREDICTION_STAGES.map(s => `'${s}'`).join(', ');
}

/** SQL IN (...) для рейтинга, fantasy, админки. */
export function rankedStagesSqlIn(): string {
  return RANKED_STAGES.map(s => `'${s}'`).join(', ');
}
