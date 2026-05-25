import { TEAMS } from './matches.js';

export type FifaGroupId = 1 | 2 | 3 | 4;

export const MAX_PLAYERS_PER_FIFA_GROUP: Record<FifaGroupId, number> = {
  1: 3,
  2: 3,
  3: 3,
  4: 2,
};

export const FIFA_GROUP_META: Record<FifaGroupId, { label: string; subtitle: string }> = {
  1: { label: 'Элита', subtitle: 'ФИФА 1–12' },
  2: { label: 'Сильные претенденты', subtitle: 'ФИФА 13–24' },
  3: { label: 'Середина', subtitle: 'ФИФА 25–36' },
  4: { label: 'Аутсайдеры и дебютанты', subtitle: 'ФИФА 37–48' },
};

const TEAM_TO_FIFA_GROUP: Record<string, FifaGroupId> = {
  fra: 1, esp: 1, arg: 1, eng: 1, por: 1, bra: 1,
  ned: 1, mar: 1, bel: 1, ger: 1, cro: 1, col: 1,
  sen: 2, mex: 2, usa: 2, uru: 2, jpn: 2, sui: 2,
  irn: 2, tur: 2, ecu: 2, aut: 2, kor: 2, aus: 2,
  alg: 3, egy: 3, can: 3, nor: 3, pan: 3, civ: 3,
  swe: 3, par: 3, cze: 3, sco: 3, tun: 3, uzb: 3,
  cod: 4, qat: 4, irq: 4, rsa: 4, ksa: 4, jor: 4,
  bih: 4, cpv: 4, gha: 4, cuw: 4, hai: 4, nzl: 4,
};

export function getTeamFifaGroup(teamId: string): FifaGroupId | undefined {
  return TEAM_TO_FIFA_GROUP[teamId];
}

/** Порядок сборных по «элитности» (ФИФА-группа 1→4, внутри группы — рейтинг ЧМ). */
const TEAM_ELITE_SORT_ORDER: string[] = Object.keys(TEAM_TO_FIFA_GROUP);

export function compareTeamsByElite(aId: string, bId: string): number {
  const ia = TEAM_ELITE_SORT_ORDER.indexOf(aId);
  const ib = TEAM_ELITE_SORT_ORDER.indexOf(bId);
  if (ia >= 0 && ib >= 0) return ia - ib;
  if (ia >= 0) return -1;
  if (ib >= 0) return 1;
  const ga = getTeamFifaGroup(aId) ?? 99;
  const gb = getTeamFifaGroup(bId) ?? 99;
  if (ga !== gb) return ga - gb;
  const na = TEAMS[aId]?.name ?? aId;
  const nb = TEAMS[bId]?.name ?? bId;
  return na.localeCompare(nb, 'ru');
}

export function getMaxPlayersForFifaGroup(groupId: FifaGroupId): number {
  return MAX_PLAYERS_PER_FIFA_GROUP[groupId];
}

export function getFifaGroupLimitMessage(groupId: FifaGroupId): string {
  const meta = FIFA_GROUP_META[groupId];
  const max = getMaxPlayersForFifaGroup(groupId);
  if (groupId === 4) {
    return `Из группы «${meta.label}» (${meta.subtitle}) можно взять только ${max} игроков`;
  }
  return `Максимум ${max} игрока из группы «${meta.label}» (${meta.subtitle})`;
}

export function validateFifaGroupLimits(
  playerIds: string[],
  getPlayer: (id: string) => { teamId: string } | undefined
): string | null {
  const groupCounts: Partial<Record<FifaGroupId, number>> = {};

  for (const id of playerIds) {
    const player = getPlayer(id);
    if (!player) continue;
    const group = getTeamFifaGroup(player.teamId);
    if (!group) continue;

    groupCounts[group] = (groupCounts[group] ?? 0) + 1;
    if (groupCounts[group]! > getMaxPlayersForFifaGroup(group)) {
      return getFifaGroupLimitMessage(group);
    }
  }

  return null;
}

export function getFifaGroupRulesForClient() {
  return ([1, 2, 3, 4] as FifaGroupId[]).map(id => ({
    id,
    label: FIFA_GROUP_META[id].label,
    subtitle: FIFA_GROUP_META[id].subtitle,
    maxPlayers: MAX_PLAYERS_PER_FIFA_GROUP[id],
    teams: Object.entries(TEAM_TO_FIFA_GROUP)
      .filter(([, groupId]) => groupId === id)
      .map(([teamId]) => ({
        teamId,
        name: TEAMS[teamId]?.name ?? teamId,
        code: TEAMS[teamId]?.code ?? '',
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru')),
  }));
}
