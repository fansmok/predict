export interface Team {
  id: string;
  name: string;
  code: string;
}

export interface MatchSeed {
  id: number;
  homeTeamId: string;
  awayTeamId: string;
  kickoff: string;
  stage: string;
  group?: string;
  round?: number;
  externalFixtureId?: number;
}

export const TEAMS: Record<string, Team> = {
  mex: { id: 'mex', name: 'Мексика', code: 'mx' },
  rsa: { id: 'rsa', name: 'ЮАР', code: 'za' },
  kor: { id: 'kor', name: 'Южная Корея', code: 'kr' },
  cze: { id: 'cze', name: 'Чехия', code: 'cz' },
  can: { id: 'can', name: 'Канада', code: 'ca' },
  bih: { id: 'bih', name: 'Босния и Герцеговина', code: 'ba' },
  usa: { id: 'usa', name: 'США', code: 'us' },
  par: { id: 'par', name: 'Парагвай', code: 'py' },
  qat: { id: 'qat', name: 'Катар', code: 'qa' },
  sui: { id: 'sui', name: 'Швейцария', code: 'ch' },
  bra: { id: 'bra', name: 'Бразилия', code: 'br' },
  mar: { id: 'mar', name: 'Марокко', code: 'ma' },
  hai: { id: 'hai', name: 'Гаити', code: 'ht' },
  sco: { id: 'sco', name: 'Шотландия', code: 'gb-sct' },
  aus: { id: 'aus', name: 'Австралия', code: 'au' },
  tur: { id: 'tur', name: 'Турция', code: 'tr' },
  ger: { id: 'ger', name: 'Германия', code: 'de' },
  cuw: { id: 'cuw', name: 'Кюрасао', code: 'cw' },
  ned: { id: 'ned', name: 'Нидерланды', code: 'nl' },
  jpn: { id: 'jpn', name: 'Япония', code: 'jp' },
  civ: { id: 'civ', name: "Кот-д'Ивуар", code: 'ci' },
  ecu: { id: 'ecu', name: 'Эквадор', code: 'ec' },
  swe: { id: 'swe', name: 'Швеция', code: 'se' },
  tun: { id: 'tun', name: 'Тунис', code: 'tn' },
  esp: { id: 'esp', name: 'Испания', code: 'es' },
  cpv: { id: 'cpv', name: 'Кабо-Верде', code: 'cv' },
  bel: { id: 'bel', name: 'Бельгия', code: 'be' },
  egy: { id: 'egy', name: 'Египет', code: 'eg' },
  ksa: { id: 'ksa', name: 'Саудовская Аравия', code: 'sa' },
  uru: { id: 'uru', name: 'Уругвай', code: 'uy' },
  irn: { id: 'irn', name: 'Иран', code: 'ir' },
  nzl: { id: 'nzl', name: 'Новая Зеландия', code: 'nz' },
  fra: { id: 'fra', name: 'Франция', code: 'fr' },
  sen: { id: 'sen', name: 'Сенегал', code: 'sn' },
  irq: { id: 'irq', name: 'Ирак', code: 'iq' },
  nor: { id: 'nor', name: 'Норвегия', code: 'no' },
  arg: { id: 'arg', name: 'Аргентина', code: 'ar' },
  alg: { id: 'alg', name: 'Алжир', code: 'dz' },
  aut: { id: 'aut', name: 'Австрия', code: 'at' },
  jor: { id: 'jor', name: 'Иордания', code: 'jo' },
  por: { id: 'por', name: 'Португалия', code: 'pt' },
  cod: { id: 'cod', name: 'ДР Конго', code: 'cd' },
  eng: { id: 'eng', name: 'Англия', code: 'gb-eng' },
  cro: { id: 'cro', name: 'Хорватия', code: 'hr' },
  gha: { id: 'gha', name: 'Гана', code: 'gh' },
  pan: { id: 'pan', name: 'Панама', code: 'pa' },
  uzb: { id: 'uzb', name: 'Узбекистан', code: 'uz' },
  col: { id: 'col', name: 'Колумбия', code: 'co' },
  // Плей-офф: слоты до определения пар (обновляются админом / API)
  br_2a: { id: 'br_2a', name: '2-е место группы A', code: 'un' },
  br_2b: { id: 'br_2b', name: '2-е место группы B', code: 'un' },
  br_1c: { id: 'br_1c', name: '1-е место группы C', code: 'un' },
  br_2f: { id: 'br_2f', name: '2-е место группы F', code: 'un' },
  br_1e: { id: 'br_1e', name: '1-е место группы E', code: 'un' },
  br_3a: { id: 'br_3a', name: '3-е из групп A/B/C/D/F', code: 'un' },
  br_1f: { id: 'br_1f', name: '1-е место группы F', code: 'un' },
  br_2c: { id: 'br_2c', name: '2-е место группы C', code: 'un' },
  br_2e: { id: 'br_2e', name: '2-е место группы E', code: 'un' },
  br_2i: { id: 'br_2i', name: '2-е место группы I', code: 'un' },
  br_1i: { id: 'br_1i', name: '1-е место группы I', code: 'un' },
  br_3c: { id: 'br_3c', name: '3-е из групп C/D/F/G/H', code: 'un' },
  br_1a: { id: 'br_1a', name: '1-е место группы A', code: 'un' },
  br_3e: { id: 'br_3e', name: '3-е из групп C/E/F/H/I', code: 'un' },
  br_1l: { id: 'br_1l', name: '1-е место группы L', code: 'un' },
  br_3h: { id: 'br_3h', name: '3-е из групп E/H/I/J/K', code: 'un' },
  br_1g: { id: 'br_1g', name: '1-е место группы G', code: 'un' },
  br_3b: { id: 'br_3b', name: '3-е из групп A/E/H/I/J', code: 'un' },
  br_1d: { id: 'br_1d', name: '1-е место группы D', code: 'un' },
  br_3i: { id: 'br_3i', name: '3-е из групп B/E/F/I/J', code: 'un' },
  br_1h: { id: 'br_1h', name: '1-е место группы H', code: 'un' },
  br_2j: { id: 'br_2j', name: '2-е место группы J', code: 'un' },
  br_2k: { id: 'br_2k', name: '2-е место группы K', code: 'un' },
  br_2l: { id: 'br_2l', name: '2-е место группы L', code: 'un' },
  br_1b: { id: 'br_1b', name: '1-е место группы B', code: 'un' },
  br_3g: { id: 'br_3g', name: '3-е из групп E/F/G/I/J', code: 'un' },
  br_2d: { id: 'br_2d', name: '2-е место группы D', code: 'un' },
  br_2g: { id: 'br_2g', name: '2-е место группы G', code: 'un' },
  br_1j: { id: 'br_1j', name: '1-е место группы J', code: 'un' },
  br_2h: { id: 'br_2h', name: '2-е место группы H', code: 'un' },
  br_1k: { id: 'br_1k', name: '1-е место группы K', code: 'un' },
  br_3d: { id: 'br_3d', name: '3-е из групп D/E/I/J/L', code: 'un' },
  br_w_a03: { id: 'br_w_a03', name: 'Победитель A03', code: 'un' },
  br_w_a04: { id: 'br_w_a04', name: 'Победитель A04', code: 'un' },
  br_w_a01: { id: 'br_w_a01', name: 'Победитель A01', code: 'un' },
  br_w_a02: { id: 'br_w_a02', name: 'Победитель A02', code: 'un' },
  br_w_a09: { id: 'br_w_a09', name: 'Победитель A09', code: 'un' },
  br_w_a10: { id: 'br_w_a10', name: 'Победитель A10', code: 'un' },
  br_w_a11: { id: 'br_w_a11', name: 'Победитель A11', code: 'un' },
  br_w_a12: { id: 'br_w_a12', name: 'Победитель A12', code: 'un' },
  br_w_a05: { id: 'br_w_a05', name: 'Победитель A05', code: 'un' },
  br_w_a06: { id: 'br_w_a06', name: 'Победитель A06', code: 'un' },
  br_w_a07: { id: 'br_w_a07', name: 'Победитель A07', code: 'un' },
  br_w_a08: { id: 'br_w_a08', name: 'Победитель A08', code: 'un' },
  br_w_a13: { id: 'br_w_a13', name: 'Победитель A13', code: 'un' },
  br_w_a14: { id: 'br_w_a14', name: 'Победитель A14', code: 'un' },
  br_w_a15: { id: 'br_w_a15', name: 'Победитель A15', code: 'un' },
  br_w_a16: { id: 'br_w_a16', name: 'Победитель A16', code: 'un' },
  br_w_b01: { id: 'br_w_b01', name: 'Победитель B01', code: 'un' },
  br_w_b02: { id: 'br_w_b02', name: 'Победитель B02', code: 'un' },
  br_w_b03: { id: 'br_w_b03', name: 'Победитель B03', code: 'un' },
  br_w_b04: { id: 'br_w_b04', name: 'Победитель B04', code: 'un' },
  br_w_b05: { id: 'br_w_b05', name: 'Победитель B05', code: 'un' },
  br_w_b06: { id: 'br_w_b06', name: 'Победитель B06', code: 'un' },
  br_w_b07: { id: 'br_w_b07', name: 'Победитель B07', code: 'un' },
  br_w_b08: { id: 'br_w_b08', name: 'Победитель B08', code: 'un' },
  br_w_qf1: { id: 'br_w_qf1', name: 'Победитель QF1', code: 'un' },
  br_w_qf2: { id: 'br_w_qf2', name: 'Победитель QF2', code: 'un' },
  br_w_qf3: { id: 'br_w_qf3', name: 'Победитель QF3', code: 'un' },
  br_w_qf4: { id: 'br_w_qf4', name: 'Победитель QF4', code: 'un' },
  br_w_sf1: { id: 'br_w_sf1', name: 'Победитель SF1', code: 'un' },
  br_w_sf2: { id: 'br_w_sf2', name: 'Победитель SF2', code: 'un' },
  br_l_sf1: { id: 'br_l_sf1', name: 'Проигравший SF1', code: 'un' },
  br_l_sf2: { id: 'br_l_sf2', name: 'Проигравший SF2', code: 'un' },
};

// Время по Москве (UTC+3), данные с championat.com + пары с FotMob
export const MATCHES: MatchSeed[] = [
  // Группа A — Тур 1
  { id: 1, homeTeamId: 'mex', awayTeamId: 'rsa', kickoff: '2026-06-11T22:00:00+03:00', stage: 'group', group: 'A', round: 1 },
  { id: 2, homeTeamId: 'kor', awayTeamId: 'cze', kickoff: '2026-06-12T05:00:00+03:00', stage: 'group', group: 'A', round: 1 },
  // Группа B — Тур 1
  { id: 3, homeTeamId: 'can', awayTeamId: 'bih', kickoff: '2026-06-12T22:00:00+03:00', stage: 'group', group: 'B', round: 1 },
  { id: 4, homeTeamId: 'qat', awayTeamId: 'sui', kickoff: '2026-06-13T22:00:00+03:00', stage: 'group', group: 'B', round: 1 },
  // Группа C — Тур 1
  { id: 5, homeTeamId: 'bra', awayTeamId: 'mar', kickoff: '2026-06-14T01:00:00+03:00', stage: 'group', group: 'C', round: 1 },
  { id: 6, homeTeamId: 'hai', awayTeamId: 'sco', kickoff: '2026-06-14T04:00:00+03:00', stage: 'group', group: 'C', round: 1 },
  // Группа D — Тур 1
  { id: 7, homeTeamId: 'usa', awayTeamId: 'par', kickoff: '2026-06-13T04:00:00+03:00', stage: 'group', group: 'D', round: 1 },
  { id: 8, homeTeamId: 'aus', awayTeamId: 'tur', kickoff: '2026-06-14T07:00:00+03:00', stage: 'group', group: 'D', round: 1 },
  // Группа E — Тур 1
  { id: 9, homeTeamId: 'ger', awayTeamId: 'cuw', kickoff: '2026-06-14T20:00:00+03:00', stage: 'group', group: 'E', round: 1 },
  { id: 10, homeTeamId: 'civ', awayTeamId: 'ecu', kickoff: '2026-06-15T02:00:00+03:00', stage: 'group', group: 'E', round: 1 },
  // Группа F — Тур 1
  { id: 11, homeTeamId: 'ned', awayTeamId: 'jpn', kickoff: '2026-06-14T23:00:00+03:00', stage: 'group', group: 'F', round: 1 },
  { id: 12, homeTeamId: 'swe', awayTeamId: 'tun', kickoff: '2026-06-15T05:00:00+03:00', stage: 'group', group: 'F', round: 1 },
  // Группа G — Тур 1
  { id: 13, homeTeamId: 'bel', awayTeamId: 'egy', kickoff: '2026-06-15T22:00:00+03:00', stage: 'group', group: 'G', round: 1 },
  { id: 14, homeTeamId: 'irn', awayTeamId: 'nzl', kickoff: '2026-06-16T04:00:00+03:00', stage: 'group', group: 'G', round: 1 },
  // Группа H — Тур 1
  { id: 15, homeTeamId: 'esp', awayTeamId: 'cpv', kickoff: '2026-06-15T19:00:00+03:00', stage: 'group', group: 'H', round: 1 },
  { id: 16, homeTeamId: 'ksa', awayTeamId: 'uru', kickoff: '2026-06-16T01:00:00+03:00', stage: 'group', group: 'H', round: 1 },
  // Группа I — Тур 1
  { id: 17, homeTeamId: 'fra', awayTeamId: 'sen', kickoff: '2026-06-16T22:00:00+03:00', stage: 'group', group: 'I', round: 1 },
  { id: 18, homeTeamId: 'irq', awayTeamId: 'nor', kickoff: '2026-06-17T01:00:00+03:00', stage: 'group', group: 'I', round: 1 },
  // Группа J — Тур 1
  { id: 19, homeTeamId: 'arg', awayTeamId: 'alg', kickoff: '2026-06-17T04:00:00+03:00', stage: 'group', group: 'J', round: 1 },
  { id: 20, homeTeamId: 'aut', awayTeamId: 'jor', kickoff: '2026-06-17T07:00:00+03:00', stage: 'group', group: 'J', round: 1 },
  // Группа K — Тур 1
  { id: 21, homeTeamId: 'por', awayTeamId: 'cod', kickoff: '2026-06-17T20:00:00+03:00', stage: 'group', group: 'K', round: 1 },
  { id: 22, homeTeamId: 'uzb', awayTeamId: 'col', kickoff: '2026-06-18T05:00:00+03:00', stage: 'group', group: 'K', round: 1 },
  // Группа L — Тур 1
  { id: 23, homeTeamId: 'eng', awayTeamId: 'cro', kickoff: '2026-06-17T23:00:00+03:00', stage: 'group', group: 'L', round: 1 },
  { id: 24, homeTeamId: 'gha', awayTeamId: 'pan', kickoff: '2026-06-18T02:00:00+03:00', stage: 'group', group: 'L', round: 1 },

  // Группа A — Тур 2
  { id: 25, homeTeamId: 'cze', awayTeamId: 'rsa', kickoff: '2026-06-18T19:00:00+03:00', stage: 'group', group: 'A', round: 2 },
  { id: 26, homeTeamId: 'mex', awayTeamId: 'kor', kickoff: '2026-06-19T04:00:00+03:00', stage: 'group', group: 'A', round: 2 },
  // Группа B — Тур 2
  { id: 27, homeTeamId: 'sui', awayTeamId: 'bih', kickoff: '2026-06-18T22:00:00+03:00', stage: 'group', group: 'B', round: 2 },
  { id: 28, homeTeamId: 'can', awayTeamId: 'qat', kickoff: '2026-06-19T01:00:00+03:00', stage: 'group', group: 'B', round: 2 },
  // Группа C — Тур 2
  { id: 29, homeTeamId: 'sco', awayTeamId: 'mar', kickoff: '2026-06-20T01:00:00+03:00', stage: 'group', group: 'C', round: 2 },
  { id: 30, homeTeamId: 'bra', awayTeamId: 'hai', kickoff: '2026-06-20T03:30:00+03:00', stage: 'group', group: 'C', round: 2 },
  // Группа D — Тур 2
  { id: 31, homeTeamId: 'usa', awayTeamId: 'aus', kickoff: '2026-06-19T22:00:00+03:00', stage: 'group', group: 'D', round: 2 },
  { id: 32, homeTeamId: 'tur', awayTeamId: 'par', kickoff: '2026-06-20T06:00:00+03:00', stage: 'group', group: 'D', round: 2 },
  // Группа E — Тур 2
  { id: 33, homeTeamId: 'ger', awayTeamId: 'civ', kickoff: '2026-06-20T23:00:00+03:00', stage: 'group', group: 'E', round: 2 },
  { id: 34, homeTeamId: 'ecu', awayTeamId: 'cuw', kickoff: '2026-06-21T03:00:00+03:00', stage: 'group', group: 'E', round: 2 },
  // Группа F — Тур 2
  { id: 35, homeTeamId: 'ned', awayTeamId: 'swe', kickoff: '2026-06-20T20:00:00+03:00', stage: 'group', group: 'F', round: 2 },
  { id: 36, homeTeamId: 'tun', awayTeamId: 'jpn', kickoff: '2026-06-21T07:00:00+03:00', stage: 'group', group: 'F', round: 2 },
  // Группа G — Тур 2
  { id: 37, homeTeamId: 'bel', awayTeamId: 'irn', kickoff: '2026-06-21T22:00:00+03:00', stage: 'group', group: 'G', round: 2 },
  { id: 38, homeTeamId: 'nzl', awayTeamId: 'egy', kickoff: '2026-06-22T04:00:00+03:00', stage: 'group', group: 'G', round: 2 },
  // Группа H — Тур 2
  { id: 39, homeTeamId: 'esp', awayTeamId: 'ksa', kickoff: '2026-06-21T19:00:00+03:00', stage: 'group', group: 'H', round: 2 },
  { id: 40, homeTeamId: 'uru', awayTeamId: 'cpv', kickoff: '2026-06-22T01:00:00+03:00', stage: 'group', group: 'H', round: 2 },
  // Группа I — Тур 2
  { id: 41, homeTeamId: 'fra', awayTeamId: 'irq', kickoff: '2026-06-23T00:00:00+03:00', stage: 'group', group: 'I', round: 2 },
  { id: 42, homeTeamId: 'nor', awayTeamId: 'sen', kickoff: '2026-06-23T03:00:00+03:00', stage: 'group', group: 'I', round: 2 },
  // Группа J — Тур 2
  { id: 43, homeTeamId: 'arg', awayTeamId: 'aut', kickoff: '2026-06-22T20:00:00+03:00', stage: 'group', group: 'J', round: 2 },
  { id: 44, homeTeamId: 'jor', awayTeamId: 'alg', kickoff: '2026-06-23T06:00:00+03:00', stage: 'group', group: 'J', round: 2 },
  // Группа K — Тур 2
  { id: 45, homeTeamId: 'por', awayTeamId: 'uzb', kickoff: '2026-06-23T20:00:00+03:00', stage: 'group', group: 'K', round: 2 },
  { id: 46, homeTeamId: 'col', awayTeamId: 'cod', kickoff: '2026-06-24T05:00:00+03:00', stage: 'group', group: 'K', round: 2 },
  // Группа L — Тур 2
  { id: 47, homeTeamId: 'eng', awayTeamId: 'gha', kickoff: '2026-06-23T23:00:00+03:00', stage: 'group', group: 'L', round: 2 },
  { id: 48, homeTeamId: 'pan', awayTeamId: 'cro', kickoff: '2026-06-24T02:00:00+03:00', stage: 'group', group: 'L', round: 2 },

  // Группа A — Тур 3
  { id: 49, homeTeamId: 'cze', awayTeamId: 'mex', kickoff: '2026-06-25T04:00:00+03:00', stage: 'group', group: 'A', round: 3 },
  { id: 50, homeTeamId: 'rsa', awayTeamId: 'kor', kickoff: '2026-06-25T04:00:00+03:00', stage: 'group', group: 'A', round: 3 },
  // Группа B — Тур 3
  { id: 51, homeTeamId: 'sui', awayTeamId: 'can', kickoff: '2026-06-24T22:00:00+03:00', stage: 'group', group: 'B', round: 3 },
  { id: 52, homeTeamId: 'bih', awayTeamId: 'qat', kickoff: '2026-06-24T22:00:00+03:00', stage: 'group', group: 'B', round: 3 },
  // Группа C — Тур 3
  { id: 53, homeTeamId: 'sco', awayTeamId: 'bra', kickoff: '2026-06-25T01:00:00+03:00', stage: 'group', group: 'C', round: 3 },
  { id: 54, homeTeamId: 'mar', awayTeamId: 'hai', kickoff: '2026-06-25T01:00:00+03:00', stage: 'group', group: 'C', round: 3 },
  // Группа D — Тур 3
  { id: 55, homeTeamId: 'ecu', awayTeamId: 'ger', kickoff: '2026-06-25T23:00:00+03:00', stage: 'group', group: 'E', round: 3 },
  { id: 56, homeTeamId: 'cuw', awayTeamId: 'civ', kickoff: '2026-06-25T23:00:00+03:00', stage: 'group', group: 'E', round: 3 },
  // Группа E/F — Тур 3 (D)
  { id: 57, homeTeamId: 'tur', awayTeamId: 'usa', kickoff: '2026-06-26T05:00:00+03:00', stage: 'group', group: 'D', round: 3 },
  { id: 58, homeTeamId: 'par', awayTeamId: 'aus', kickoff: '2026-06-26T05:00:00+03:00', stage: 'group', group: 'D', round: 3 },
  // Группа F — Тур 3
  { id: 59, homeTeamId: 'tun', awayTeamId: 'ned', kickoff: '2026-06-26T02:00:00+03:00', stage: 'group', group: 'F', round: 3 },
  { id: 60, homeTeamId: 'jpn', awayTeamId: 'swe', kickoff: '2026-06-26T02:00:00+03:00', stage: 'group', group: 'F', round: 3 },
  // Группа G — Тур 3
  { id: 61, homeTeamId: 'nzl', awayTeamId: 'bel', kickoff: '2026-06-27T06:00:00+03:00', stage: 'group', group: 'G', round: 3 },
  { id: 62, homeTeamId: 'egy', awayTeamId: 'irn', kickoff: '2026-06-27T06:00:00+03:00', stage: 'group', group: 'G', round: 3 },
  // Группа H — Тур 3
  { id: 63, homeTeamId: 'uru', awayTeamId: 'esp', kickoff: '2026-06-27T03:00:00+03:00', stage: 'group', group: 'H', round: 3 },
  { id: 64, homeTeamId: 'cpv', awayTeamId: 'ksa', kickoff: '2026-06-27T03:00:00+03:00', stage: 'group', group: 'H', round: 3 },
  // Группа I — Тур 3
  { id: 65, homeTeamId: 'nor', awayTeamId: 'fra', kickoff: '2026-06-26T22:00:00+03:00', stage: 'group', group: 'I', round: 3 },
  { id: 66, homeTeamId: 'sen', awayTeamId: 'irq', kickoff: '2026-06-26T22:00:00+03:00', stage: 'group', group: 'I', round: 3 },
  // Группа J — Тур 3
  { id: 67, homeTeamId: 'jor', awayTeamId: 'arg', kickoff: '2026-06-28T05:00:00+03:00', stage: 'group', group: 'J', round: 3 },
  { id: 68, homeTeamId: 'alg', awayTeamId: 'aut', kickoff: '2026-06-28T05:00:00+03:00', stage: 'group', group: 'J', round: 3 },
  // Группа K — Тур 3
  { id: 69, homeTeamId: 'col', awayTeamId: 'por', kickoff: '2026-06-28T02:30:00+03:00', stage: 'group', group: 'K', round: 3 },
  { id: 70, homeTeamId: 'cod', awayTeamId: 'uzb', kickoff: '2026-06-28T02:30:00+03:00', stage: 'group', group: 'K', round: 3 },
  // Группа L — Тур 3
  { id: 71, homeTeamId: 'pan', awayTeamId: 'eng', kickoff: '2026-06-28T00:00:00+03:00', stage: 'group', group: 'L', round: 3 },
  { id: 72, homeTeamId: 'cro', awayTeamId: 'gha', kickoff: '2026-06-28T00:00:00+03:00', stage: 'group', group: 'L', round: 3 },

  // Плей-офф — 1/16 финала (пары после группового этапа)
  { id: 73, homeTeamId: 'rsa', awayTeamId: 'can', kickoff: '2026-06-28T22:00:00+03:00', stage: 'r32', group: 'A03', round: 1 },
  { id: 74, homeTeamId: 'bra', awayTeamId: 'jpn', kickoff: '2026-06-29T20:00:00+03:00', stage: 'r32', group: 'A09', round: 1 },
  { id: 75, homeTeamId: 'ger', awayTeamId: 'par', kickoff: '2026-06-29T23:30:00+03:00', stage: 'r32', group: 'A01', round: 1 },
  { id: 76, homeTeamId: 'ned', awayTeamId: 'mar', kickoff: '2026-06-30T04:00:00+03:00', stage: 'r32', group: 'A04', round: 1 },
  { id: 77, homeTeamId: 'civ', awayTeamId: 'nor', kickoff: '2026-06-30T20:00:00+03:00', stage: 'r32', group: 'A10', round: 1 },
  { id: 78, homeTeamId: 'fra', awayTeamId: 'swe', kickoff: '2026-07-01T00:00:00+03:00', stage: 'r32', group: 'A02', round: 1 },
  { id: 79, homeTeamId: 'mex', awayTeamId: 'ecu', kickoff: '2026-07-01T04:00:00+03:00', stage: 'r32', group: 'A11', round: 1 },
  { id: 80, homeTeamId: 'eng', awayTeamId: 'cod', kickoff: '2026-07-01T19:00:00+03:00', stage: 'r32', group: 'A12', round: 1 },
  { id: 81, homeTeamId: 'bel', awayTeamId: 'sen', kickoff: '2026-07-01T23:00:00+03:00', stage: 'r32', group: 'A08', round: 1 },
  { id: 82, homeTeamId: 'usa', awayTeamId: 'bih', kickoff: '2026-07-02T03:00:00+03:00', stage: 'r32', group: 'A07', round: 1 },
  { id: 83, homeTeamId: 'esp', awayTeamId: 'aut', kickoff: '2026-07-02T22:00:00+03:00', stage: 'r32', group: 'A06', round: 1 },
  { id: 84, homeTeamId: 'por', awayTeamId: 'cro', kickoff: '2026-07-03T02:00:00+03:00', stage: 'r32', group: 'A05', round: 1 },
  { id: 85, homeTeamId: 'sui', awayTeamId: 'alg', kickoff: '2026-07-03T06:00:00+03:00', stage: 'r32', group: 'A15', round: 1 },
  { id: 86, homeTeamId: 'aus', awayTeamId: 'egy', kickoff: '2026-07-03T21:00:00+03:00', stage: 'r32', group: 'A14', round: 1 },
  { id: 87, homeTeamId: 'arg', awayTeamId: 'cpv', kickoff: '2026-07-04T01:00:00+03:00', stage: 'r32', group: 'A13', round: 1 },
  { id: 88, homeTeamId: 'col', awayTeamId: 'gha', kickoff: '2026-07-04T04:30:00+03:00', stage: 'r32', group: 'A16', round: 1 },

  // 1/8 финала
  { id: 89, homeTeamId: 'br_w_a03', awayTeamId: 'br_w_a04', kickoff: '2026-07-04T20:00:00+03:00', stage: 'r16', group: 'B02', round: 1 },
  { id: 90, homeTeamId: 'br_w_a01', awayTeamId: 'br_w_a02', kickoff: '2026-07-05T00:00:00+03:00', stage: 'r16', group: 'B01', round: 1 },
  { id: 91, homeTeamId: 'br_w_a09', awayTeamId: 'br_w_a10', kickoff: '2026-07-05T23:00:00+03:00', stage: 'r16', group: 'B05', round: 1 },
  { id: 92, homeTeamId: 'br_w_a11', awayTeamId: 'br_w_a12', kickoff: '2026-07-06T03:00:00+03:00', stage: 'r16', group: 'B06', round: 1 },
  { id: 93, homeTeamId: 'br_w_a05', awayTeamId: 'br_w_a06', kickoff: '2026-07-06T22:00:00+03:00', stage: 'r16', group: 'B03', round: 1 },
  { id: 94, homeTeamId: 'br_w_a07', awayTeamId: 'br_w_a08', kickoff: '2026-07-07T03:00:00+03:00', stage: 'r16', group: 'B04', round: 1 },
  { id: 95, homeTeamId: 'br_w_a13', awayTeamId: 'br_w_a14', kickoff: '2026-07-07T19:00:00+03:00', stage: 'r16', group: 'B07', round: 1 },
  { id: 96, homeTeamId: 'br_w_a15', awayTeamId: 'br_w_a16', kickoff: '2026-07-07T23:00:00+03:00', stage: 'r16', group: 'B08', round: 1 },

  // 1/4 финала
  { id: 97, homeTeamId: 'br_w_b01', awayTeamId: 'br_w_b02', kickoff: '2026-07-09T23:00:00+03:00', stage: 'qf', group: 'QF1', round: 1 },
  { id: 98, homeTeamId: 'br_w_b03', awayTeamId: 'br_w_b04', kickoff: '2026-07-10T22:00:00+03:00', stage: 'qf', group: 'QF2', round: 1 },
  { id: 99, homeTeamId: 'br_w_b05', awayTeamId: 'br_w_b06', kickoff: '2026-07-12T00:00:00+03:00', stage: 'qf', group: 'QF3', round: 1 },
  { id: 100, homeTeamId: 'br_w_b07', awayTeamId: 'br_w_b08', kickoff: '2026-07-12T04:00:00+03:00', stage: 'qf', group: 'QF4', round: 1 },

  // 1/2 финала
  { id: 101, homeTeamId: 'br_w_qf1', awayTeamId: 'br_w_qf2', kickoff: '2026-07-14T22:00:00+03:00', stage: 'sf', group: 'SF1', round: 1 },
  { id: 102, homeTeamId: 'br_w_qf3', awayTeamId: 'br_w_qf4', kickoff: '2026-07-15T22:00:00+03:00', stage: 'sf', group: 'SF2', round: 1 },

  // Матч за 3-е место и финал
  { id: 103, homeTeamId: 'br_l_sf1', awayTeamId: 'br_l_sf2', kickoff: '2026-07-19T00:00:00+03:00', stage: 'third', group: 'F3', round: 1 },
  { id: 104, homeTeamId: 'br_w_sf1', awayTeamId: 'br_w_sf2', kickoff: '2026-07-19T22:00:00+03:00', stage: 'final', group: 'F1', round: 1 },
];

/** Сборная ЧМ (не слот плей-офф br_*). */
export function isParticipantTeamId(id: string): boolean {
  const team = TEAMS[id];
  return Boolean(team && !id.startsWith('br_'));
}

export function getParticipantTeams(): Team[] {
  return Object.values(TEAMS).filter(t => isParticipantTeamId(t.id));
}

export function getTeam(id: string): Team {
  return TEAMS[id] ?? { id, name: id, code: 'un' };
}

/** Код для flagcdn: ISO alpha-2 (de) или составной gb-eng / gb-sct. */
export function normalizeFlagCode(code: string): string {
  const trimmed = code.trim().toLowerCase();
  if (/^[a-z]{2}-[a-z]{3}$/.test(trimmed)) return trimmed;
  const alpha2 = trimmed.replace(/[^a-z]/gi, '').slice(0, 2);
  return alpha2 || 'un';
}

export function flagUrl(code: string): string {
  return `/api/flags/${normalizeFlagCode(code)}.png`;
}
