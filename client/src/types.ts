export interface Team {
  id: string;
  name: string;
  code: string;
  flag: string;
}

export interface Prediction {
  homeScore: number;
  awayScore: number;
  points: number | null;
}

export interface MatchConsensus {
  home: number;
  draw: number;
  away: number;
  total: number;
}

export interface Match {
  id: number;
  kickoff: string;
  stage: string;
  group: string | null;
  round: number | null;
  status: string;
  gameDay: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: Team;
  awayTeam: Team;
  isLocked: boolean;
  canPredict: boolean;
  isDouble: boolean;
  doublePickMatchId: number | null;
  prediction: Prediction | null;
  consensus: MatchConsensus;
  externalFixtureId?: number | null;
}

export interface MatchProfilePlayer {
  id: string;
  name: string;
  position: string;
  goals: number;
  assists: number;
  sentOff: boolean;
  teamWon: boolean;
  cleanSheet: boolean;
  goalsConceded: number;
  played: boolean;
  fantasyPoints: number;
}

export interface MatchProfileTopUser {
  rank: number;
  id: number;
  firstName: string;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
  predictionPoints: number;
  fantasyPoints: number;
  totalPoints: number;
}

export interface MatchProfileGoal {
  side: 'home' | 'away';
  scorerName: string;
  assistName: string | null;
}

export interface MatchProfileScoreStat {
  homeScore: number;
  awayScore: number;
  count: number;
  percent: number;
  isExactResult: boolean;
}

export interface MatchProfile {
  match: {
    id: number;
    kickoff: string;
    stage: string;
    group: string | null;
    homeScore: number;
    awayScore: number;
    homeTeam: Team;
    awayTeam: Team;
  };
  goals: MatchProfileGoal[];
  lineups: {
    home: MatchProfilePlayer[];
    away: MatchProfilePlayer[];
  };
  predictions: {
    total: number;
    scored: number;
    consensus: MatchConsensus;
    exactHits: number;
    outcomeHits: number;
    differenceHits: number;
    topScores: MatchProfileScoreStat[];
  };
  topUsers: MatchProfileTopUser[];
  userPrediction: {
    homeScore: number;
    awayScore: number;
    points: number | null;
  } | null;
}

export interface UserStats {
  totalPoints: number;
  matchPoints: number;
  tournamentPoints: number;
  squadPoints: number;
  totalPredictions: number;
  scoredPredictions: number;
  exactScores: number;
  outcomeHits: number;
  differenceHits: number;
  goodPredictions: number;
  predictionBreakdown: {
    outcomeCount: number;
    outcomePoints: number;
    differenceCount: number;
    differencePoints: number;
    exactCount: number;
    exactPoints: number;
  };
  rank: number;
  /** Сервер знает, что состав сохранён (даже если очков ещё 0). */
  hasSquad?: boolean;
  /** Сервер знает, что прогнозы на турнир сохранены. */
  hasTournamentPicks?: boolean;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string | null;
  username: string | null;
  photo_url: string | null;
  isPlatinum?: boolean;
  isAdmin?: boolean;
  favoriteTeam?: Team | null;
}

export interface Leader {
  rank: number;
  id: number;
  firstName: string;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
  favoriteTeam?: Team | null;
  totalPoints: number;
  matchPoints: number;
  tournamentPoints: number;
  squadPoints: number;
  predictionsCount: number;
  outcomeHits: number;
  differenceHits: number;
  exactScores: number;
  goodPredictions: number;
  isPlatinum?: boolean;
}

export interface LeaderboardMyRank {
  rank: number;
  totalPoints: number;
  matchPoints: number;
  tournamentPoints: number;
  squadPoints: number;
  predictionsCount: number;
  outcomeHits: number;
  differenceHits: number;
  exactScores: number;
  goodPredictions: number;
}

export interface LeaderboardResponse {
  leaders: Leader[];
  myRank: LeaderboardMyRank;
  neighborhood?: Leader[];
}

export interface PlatinumProgress {
  current: number;
  required: number;
  isPlatinum: boolean;
  remaining: number;
  pending?: number;
}

export interface Rule {
  points: number;
  label: string;
  description: string;
  /** double — бонус ×2; penalty — штраф fantasy-команды */
  kind?: 'double' | 'penalty';
}

export type Tab = 'matches' | 'squad' | 'predictions' | 'friends' | 'leaderboard' | 'profile';

export type TournamentPickField = 'winner' | 'second' | 'third' | 'topScorer';

export interface TournamentOption {
  id: string;
  name: string;
  code?: string;
  flag?: string | null;
  teamId?: string;
  teamName?: string | null;
}

export interface TournamentData {
  locked: boolean;
  deadline: string;
  picks: {
    winner: TournamentOption | null;
    second: TournamentOption | null;
    third: TournamentOption | null;
    topScorer: TournamentOption | null;
  };
  points: {
    winner: number | null;
    second: number | null;
    third: number | null;
    topScorer: number | null;
    total: number;
  };
  results: {
    winner: TournamentOption | null;
    second: TournamentOption | null;
    third: TournamentOption | null;
    topScorer: TournamentOption | null;
  } | null;
  picksHidden?: boolean;
  picksFilled?: number;
}

export type SquadPosition = 'GK' | 'DEF' | 'MID' | 'FWD';

export type FifaGroupId = 1 | 2 | 3 | 4;

export interface FifaGroupRule {
  id: FifaGroupId;
  label: string;
  subtitle: string;
  maxPlayers: number;
  teams: Array<{ teamId: string; name: string; code: string }>;
}

export interface SquadData {
  locked: boolean;
  tournamentStarted?: boolean;
  lateSquadDeadline?: string;
  lateSquadWindowClosed?: boolean;
  deadline: string;
  formation?: string;
  slotPositions?: SquadPosition[];
  size: number;
  maxPerTeam: number;
  groupRules?: FifaGroupRule[];
  complete: boolean;
  squadConfirmedAt?: string | null;
  lateSquad?: boolean;
  players: SquadPlayerOption[];
  points: SquadPlayerPoints;
  scoring?: typeof import('./squadScoring').SQUAD_SCORING;
  squadHidden?: boolean;
  squadPlayerCount?: number;
}

export interface SquadPlayerPoints {
  wins: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  total: number;
  goalsConceded?: number;
  sentOffs?: number;
}

export interface SquadPlayerOption {
  id: string;
  name: string;
  position: SquadPosition;
  slot?: number;
  teamId: string;
  teamName: string;
  flag: string;
  fifaGroup?: FifaGroupId;
  points?: SquadPlayerPoints;
}

export interface GlobalSquadPlayerRank extends SquadPlayerOption {
  pickedCount: number;
}

export interface GlobalSquadPlayerRanking {
  top: GlobalSquadPlayerRank[];
  losers: GlobalSquadPlayerRank[];
}

export interface PublicUserProfile {
  user: {
    id: number;
    firstName: string;
    lastName: string | null;
    photoUrl: string | null;
    favoriteTeam?: Team | null;
    isPlatinum?: boolean;
  };
  stats: UserStats;
  squad: SquadData;
  tournament: TournamentData;
  predictions: Match[];
}

export interface FriendUser {
  id: number;
  firstName: string;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
  favoriteTeam?: Team | null;
  status?: 'friend' | 'invited' | 'referral' | 'league';
  totalPoints?: number;
  joinedAt?: string;
  isPlatinum?: boolean;
}

export interface FriendsData {
  friends: FriendUser[];
  pending: FriendUser[];
  inviteLink: string;
  platinum: PlatinumProgress;
}

export interface LeagueSummary {
  id: number;
  name: string;
  emoji: string;
  emojiBg: string;
  code?: string;
  ownerId: number;
  memberCount: number;
  isOwner: boolean;
  isMember: boolean;
  inviteLink?: string;
  avgPoints?: number;
  totalPoints?: number;
  rank?: number;
}
