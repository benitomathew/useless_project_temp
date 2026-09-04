export type GameId = 'jackfruit' | 'hole' | 'peruvellam';

export interface GameInfo {
  id: GameId;
  titleMalayalam: string;
  titleEnglish: string;
  transliteration: string;
  literalMeaning: string;
  gameGenre: string;
  emoji: string;
  themeColor: string;
  accentColor: string;
  badgeBg: string;
  shortInstruction: string;
  description: string;
  funnyQuotes: {
    win: string[];
    lose: string[];
  };
}

export interface GameResult {
  gameId: GameId;
  won: boolean;
  score: number;
  highScore: number;
  stats?: Record<string, string | number>;
  reactionMalayalam: string;
  reactionEnglish: string;
}

export interface HighScoreRecord {
  [gameId: string]: number;
}
