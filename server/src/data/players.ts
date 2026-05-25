import { TEAMS } from './matches.js';

export interface Player {
  id: string;
  name: string;
  teamId: string;
}

/** Фиксированный список бомбардиров для «Прогнозов на турнир» */
export const PLAYERS: Player[] = [
  { id: 'mbappe', name: 'Kylian Mbappe', teamId: 'fra' },
  { id: 'kane', name: 'Harry Kane', teamId: 'eng' },
  { id: 'haaland', name: 'Erling Haaland', teamId: 'nor' },
  { id: 'oyarzabal', name: 'Mikel Oyarzabal', teamId: 'esp' },
  { id: 'messi', name: 'Lionel Messi', teamId: 'arg' },
  { id: 'ronaldo', name: 'Cristiano Ronaldo', teamId: 'por' },
  { id: 'yamal', name: 'Lamine Yamal', teamId: 'esp' },
  { id: 'dembele', name: 'Ousmane Dembele', teamId: 'fra' },
  { id: 'raphinha', name: 'Raphinha', teamId: 'bra' },
  { id: 'alvarez', name: 'Julian Alvarez', teamId: 'arg' },
  { id: 'vinicius', name: 'Vinicius Junior', teamId: 'bra' },
  { id: 'igor_thiago', name: 'Igor Thiago', teamId: 'bra' },
  { id: 'lautaro', name: 'Lautaro Martinez', teamId: 'arg' },
  { id: 'olise', name: 'Michael Olise', teamId: 'fra' },
  { id: 'ferran_torres', name: 'Ferran Torres', teamId: 'esp' },
  { id: 'bruno_fernandes', name: 'Bruno Fernandes', teamId: 'por' },
  { id: 'undav', name: 'Deniz Undav', teamId: 'ger' },
  { id: 'gyokeres', name: 'Viktor Gyökeres', teamId: 'swe' },
  { id: 'valverde', name: 'Federico Valverde', teamId: 'uru' },
  { id: 'gakpo', name: 'Cody Gakpo', teamId: 'ned' },
  { id: 'leao', name: 'Rafael Leao', teamId: 'por' },
  { id: 'diaz', name: 'Luis Diaz', teamId: 'col' },
  { id: 'saka', name: 'Bukayo Saka', teamId: 'eng' },
  { id: 'bellingham', name: 'Jude Bellingham', teamId: 'eng' },
  { id: 'thuram', name: 'Marcus Thuram', teamId: 'fra' },
  { id: 'olmo', name: 'Dani Olmo', teamId: 'esp' },
  { id: 'diallo', name: 'Amad Diallo', teamId: 'civ' },
  { id: 'mane', name: 'Sadio Mane', teamId: 'sen' },
  { id: 'luis_javier_suarez', name: 'Luis Javier Suárez', teamId: 'col' },
  { id: 'mctominay', name: 'Scott McTominay', teamId: 'sco' },
  { id: 'depay', name: 'Depay Memphis', teamId: 'ned' },
  { id: 'son', name: 'Heung-Min Son', teamId: 'kor' },
  { id: 'doue', name: 'Desire Doue', teamId: 'fra' },
  { id: 'semenyo', name: 'Antoine Semenyo', teamId: 'gha' },
  { id: 'salah', name: 'Mohamed Salah', teamId: 'egy' },
  { id: 'pedri', name: 'Pedri', teamId: 'esp' },
  { id: 'barcola', name: 'Bradley Barcola', teamId: 'fra' },
  { id: 'okafor', name: 'Noah Okafor', teamId: 'sui' },
  { id: 'perisic', name: 'Ivan Perišić', teamId: 'cro' },
  { id: 'kramaric', name: 'Andrej Kramarić', teamId: 'cro' },
  { id: 'beljo', name: 'Dion Beljo', teamId: 'cro' },
  { id: 'rodrygo', name: 'Rodrygo', teamId: 'bra' },
  { id: 'dzeko', name: 'Edin Džeko', teamId: 'bih' },
  { id: 'gnabry', name: 'Serge Gnabry', teamId: 'ger' },
  { id: 'other', name: 'Кто то другой', teamId: 'other' },
].filter(p => p.teamId === 'other' || p.teamId in TEAMS);

export function getPlayer(id: string): Player | undefined {
  return PLAYERS.find(p => p.id === id);
}

export const TOURNAMENT_DEADLINE = '2026-06-11T22:00:00+03:00';

/** Опоздавшие могут собрать состав до 24 июня 20:00 (МСК). */
export const LATE_SQUAD_DEADLINE = '2026-06-24T20:00:00+03:00';

export const TOURNAMENT_POINTS = {
  winner: 30,
  second: 20,
  third: 10,
  topScorer: 20,
} as const;
