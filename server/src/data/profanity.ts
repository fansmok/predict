/**
 * Фильтр нецензурной лексики в названиях лиг (RU + обходы латиницей/цифрами).
 * Список корней — при появлении в нормализованной строке название отклоняется.
 */

const BANNED_ROOTS: readonly string[] = [
  'хуй',
  'хуя',
  'хуе',
  'хую',
  'хуи',
  'хуё',
  'хуяр',
  'хуес',
  'хуйн',
  'охуе',
  'охуи',
  'нахуй',
  'нахуя',
  'похуй',
  'похуя',
  'пизд',
  'пздц',
  'пезд',
  'ебан',
  'ебат',
  'ебал',
  'ебло',
  'ебли',
  'ебут',
  'ебаш',
  'ебля',
  'ебуч',
  'ёбан',
  'ёбну',
  'уеб',
  'уёб',
  'выеб',
  'вьеб',
  'бляд',
  'блят',
  'блеад',
  'пидор',
  'пидар',
  'пидр',
  'педик',
  'педри',
  'педоф',
  'шлюх',
  'шлюш',
  'мудак',
  'мудил',
  'мудо',
  'манд',
  'долбо',
  'долбое',
  'дроч',
  'залуп',
  'гондон',
  'гандон',
  'сучк',
  'сучар',
  'сучон',
  'гавн',
  'говн',
  'срать',
  'сран',
  'срат',
  'жоп',
  'задниц',
];

const LATIN_TO_CYRILLIC: Record<string, string> = {
  a: 'а',
  b: 'в',
  c: 'с',
  d: 'д',
  e: 'е',
  f: 'ф',
  g: 'г',
  h: 'н',
  i: 'и',
  j: 'й',
  k: 'к',
  l: 'л',
  m: 'м',
  n: 'н',
  o: 'о',
  p: 'п',
  q: 'к',
  r: 'р',
  s: 'с',
  t: 'т',
  u: 'у',
  v: 'в',
  w: 'в',
  x: 'х',
  y: 'у',
  z: 'з',
};

/** Схлопывает повторяющиеся символы: «хуууй» → «хуй». */
function collapseRepeats(s: string): string {
  let out = '';
  let prev = '';
  for (const ch of s) {
    if (ch !== prev) out += ch;
    prev = ch;
  }
  return out;
}

/** Нормализация для поиска запрещённых корней. */
export function normalizeForProfanityCheck(input: string): string {
  let s = input.toLowerCase().trim();
  s = s.replace(/ё/g, 'е');
  s = s.replace(/[@]/g, 'а');
  s = s.replace(/0/g, 'о');
  s = s.replace(/1/g, 'и');
  s = s.replace(/3/g, 'з');
  s = s.replace(/4/g, 'ч');
  s = s.replace(/6/g, 'б');
  s = s.replace(/7/g, 'т');
  s = s.replace(/9/g, 'д');
  s = s.replace(/\$/g, 'с');

  let mapped = '';
  for (const ch of s) {
    if (ch >= 'а' && ch <= 'я') {
      mapped += ch;
      continue;
    }
    if (ch >= 'a' && ch <= 'z') {
      mapped += LATIN_TO_CYRILLIC[ch] ?? ch;
      continue;
    }
  }

  return collapseRepeats(mapped);
}

export const LEAGUE_NAME_PROFANITY_ERROR =
  'Название содержит недопустимые слова. Выберите другое.';

/** null — название допустимо; иначе текст ошибки для пользователя. */
export function validateLeagueName(name: string): string | null {
  const compact = normalizeForProfanityCheck(name);
  if (!compact) return null;

  for (const root of BANNED_ROOTS) {
    if (compact.includes(root)) {
      return LEAGUE_NAME_PROFANITY_ERROR;
    }
  }

  return null;
}
