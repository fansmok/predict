/**
 * FIFA/Coca-Cola Men's World Ranking (апрель 2025).
 * Используется как последний тай-брейк (критерий 7) в групповых таблицах.
 * Меньшее значение = выше в рейтинге.
 */
export const FIFA_WORLD_RANKING: Record<string, number> = {
  arg: 1,
  fra: 2,
  esp: 3,
  eng: 4,
  bra: 5,
  bel: 6,
  por: 7,
  ned: 8,
  col: 10,
  cro: 11,
  ger: 12,
  uru: 13,
  mar: 14,
  usa: 15,
  jpn: 16,
  mex: 17,
  sui: 18,
  sen: 19,
  irn: 20,
  aut: 22,
  kor: 23,
  can: 24,
  ecu: 26,
  swe: 27,
  aus: 28,
  tur: 38,
  alg: 39,
  civ: 40,
  cze: 41,
  qat: 44,
  nor: 47,
  tun: 48,
  sco: 49,
  par: 55,
  irq: 56,
  ksa: 57,
  rsa: 58,
  uzb: 59,
  cod: 61,
  jor: 65,
  cpv: 69,
  gha: 72,
  bih: 75,
  egy: 33,
  pan: 41,
  hai: 87,
  cuw: 88,
  nzl: 105,
};

export function getFifaWorldRank(teamId: string): number {
  return FIFA_WORLD_RANKING[teamId] ?? 999;
}
