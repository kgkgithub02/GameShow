export type Difficulty = 'easy' | 'medium' | 'medium-hard' | 'hard';

export type RoundType = 
  | 'trivia-buzz' 
  | 'lightning' 
  | 'quick-build' 
  | 'connect-4' 
  | 'guess-number' 
  | 'blind-draw'
  | 'dump-charades';

export interface Team {
  id: string;
  name: string;
  color: string;
  score: number;
  players: string[];
}

export interface Question {
  id: string;
  text: string;
  answer: string;
  difficulty: Difficulty;
  category?: string;
}

export interface GameState {
  teams: Team[];
  currentRound: number;
  rounds: RoundType[];
  difficulty: Difficulty;
  gameStarted: boolean;
  gameEnded: boolean;
}

export interface TriviaBuzzState {
  currentQuestion: Question | null;
  buzzedTeam: string | null;
  buzzLockoutUntil: number | null;
  questionActive: boolean;
  stealAvailable: boolean;
  answerTimer: number | null;
}

export interface LightningState {
  currentTeam: string | null;
  questionsAnswered: number;
  timeRemaining: number;
  currentQuestion: Question | null;
  isActive: boolean;
}

export interface QuickBuildState {
  timeRemaining: number;
  isActive: boolean;
  buildingTeam: string | null;
  winCriteria: 'tallest' | 'most-blocks' | 'stability';
}

export interface Connect4State {
  board: (string | null)[][];
  currentTeam: string | null;
  selectedSquare: { row: number; col: number } | null;
  currentQuestion: Question | null;
  winner: string | null;
  stealAvailable: boolean;
}

export interface GuessNumberState {
  question: string | null;
  correctAnswer: number | null;
  isActive: boolean;
  timeRemaining: number;
}

export interface BlindDrawState {
  currentWord: string | null;
  drawingTeam: string | null;
  timeRemaining: number;
  isActive: boolean;
  guessedCorrectly: boolean;
}

export interface PowerUp {
  type: 'double-points' | 'block-steal' | 'extra-time';
  team: string;
  used: boolean;
}

export interface RoundSettings {
  triviaBuzzQuestions?: number;
  triviaBuzzDifficulty?: Difficulty;
  lightningSeconds?: number;
  lightningDifficulty?: Difficulty;
  quickBuildSeconds?: number;
  guessNumberSeconds?: number;
  guessNumberQuestions?: number;
  guessNumberDifficulty?: Difficulty;
  blindDrawSeconds?: number;
  blindDrawWordCount?: number;
  dumpCharadesSeconds?: number;
  connect4Themes?: [
    'general' | 'science' | 'history' | 'pop-culture' | 'sports' | 'geography',
    'general' | 'science' | 'history' | 'pop-culture' | 'sports' | 'geography',
    'general' | 'science' | 'history' | 'pop-culture' | 'sports' | 'geography',
    'general' | 'science' | 'history' | 'pop-culture' | 'sports' | 'geography'
  ];
  connect4Difficulty?: Difficulty;
  blindDrawDifficulty?: Difficulty;
  dumpCharadesDifficulty?: Difficulty;
  dumpCharadesCategory?: string;
}