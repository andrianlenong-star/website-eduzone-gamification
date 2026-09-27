export type QuestionType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching';

export type Jenjang = 'SD' | 'SMP' | 'SMA' | 'Kuliah / Umum';

export type MataPelajaran =
  | 'Matematika'
  | 'IPA / Sains'
  | 'Bahasa Indonesia'
  | 'Bahasa Inggris'
  | 'IPS & Sejarah'
  | 'Informatika & Logika'
  | 'Pengetahuan Umum';

export type Difficulty = 'Mudah' | 'Sedang' | 'Tantangan';

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  // Multiple Choice
  options?: string[];
  correctIndex?: number;
  // True / False
  isTrue?: boolean;
  // Fill in the Blank
  acceptableAnswers?: string[];
  // Matching
  matchingPairs?: MatchingPair[];
  // Universal answer representation (for display & grading)
  correctAnswer: string;
  // Learning elements
  explanation: string; // Pembahasan detail
  hint: string; // Petunjuk
  anagramWord?: string; // For Word Maze mode
  imageUrl?: string;
  subject?: MataPelajaran;
  grade?: Jenjang;
  targetClass?: string;
  difficulty?: Difficulty;
}

export interface QuizSet {
  id: string;
  title: string;
  description: string;
  category: MataPelajaran;
  grade: Jenjang;
  targetClass?: string;
  difficulty: Difficulty;
  icon: string;
  color: string;
  questions: Question[];
  playCount: number;
  isCustom?: boolean;
  createdAt?: string;
}

export type GameMode =
  | 'kuis-kilat'
  | 'labirin-kata'
  | 'kartu-cocok'
  | 'roda-putar'
  | 'duel-teman'
  | 'cetak-lks';

export interface PlayerStats {
  gamesPlayed: number;
  correctAnswers: number;
  totalScore: number;
  streakHigh: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface PlayerProfile {
  name: string;
  avatar: string;
  xp: number;
  level: number;
  coins: number;
  stats: PlayerStats;
  badges: Badge[];
}

export interface AnswerRecord {
  questionId: string;
  question: Question;
  userAnswer: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  pointsEarned: number;
}
