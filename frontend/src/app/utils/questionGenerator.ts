import { Question, Difficulty, RoundType, RoundSettings } from '@/app/types/game';
import { triviaQuestions, lightningQuestions, guessNumberQuestions, blindDrawWords } from '@/app/data/questions';

export interface GeneratedQuestions {
  triviaBuzz?: Question[];
  lightning?: Question[];
  guessNumber?: Array<{ question: string; answer: number }>;
  connect4?: Array<{ column: number; row: number; question: Question }>;
  blindDraw?: string[];
}

function getRandomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomQuestions(pool: Question[], count: number, difficulty: Difficulty): Question[] {
  const filtered = pool.filter(q => q.difficulty === difficulty);
  const selected: Question[] = [];
  
  for (let i = 0; i < count; i++) {
    const question = getRandomFromArray(filtered);
    selected.push({ ...question, id: `${question.id}-${i}` });
  }
  
  return selected;
}

export function generateAllQuestions(
  rounds: RoundType[],
  roundSettings: RoundSettings
): GeneratedQuestions {
  const generated: GeneratedQuestions = {};

  // Trivia Buzz
  if (rounds.includes('trivia-buzz')) {
    const count = roundSettings.triviaBuzzQuestions || 10;
    const difficulty = roundSettings.triviaBuzzDifficulty || 'medium-hard';
    generated.triviaBuzz = getRandomQuestions(triviaQuestions, count, difficulty);
  }

  // Lightning Round
  if (rounds.includes('lightning')) {
    const difficulty = roundSettings.lightningDifficulty || 'medium-hard';
    // Lightning round doesn't have a count setting, using 20 questions
    generated.lightning = getRandomQuestions(lightningQuestions, 20, difficulty);
  }

  // Guess the Number
  if (rounds.includes('guess-number')) {
    const count = roundSettings.guessNumberQuestions || 10;
    generated.guessNumber = [];
    for (let i = 0; i < count; i++) {
      const q = getRandomFromArray(guessNumberQuestions);
      generated.guessNumber.push({ ...q });
    }
  }

  // Connect 4
  if (rounds.includes('connect-4')) {
    // Use row-based difficulty
    const rowDifficulties: Difficulty[] = ['easy', 'medium', 'medium-hard', 'hard'];
    
    // Generate questions for 4 columns x 4 rows = 16 questions
    generated.connect4 = [];
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        const difficulty = rowDifficulties[row];
        const filteredQuestions = triviaQuestions.filter(q => q.difficulty === difficulty);
        const question = getRandomFromArray(filteredQuestions);
        generated.connect4.push({
          column: col,
          row: row,
          question: { ...question, id: `c4-${col}-${row}` }
        });
      }
    }
  }

  // Blind Draw
  if (rounds.includes('blind-draw')) {
    const difficulty = roundSettings.blindDrawDifficulty || 'medium-hard';
    const wordPool = difficulty === 'easy' 
      ? blindDrawWords.easy 
      : difficulty === 'hard'
      ? blindDrawWords.hard
      : blindDrawWords.medium;
    
    generated.blindDraw = [];
    for (let i = 0; i < 5; i++) {
      generated.blindDraw.push(getRandomFromArray(wordPool));
    }
  }

  return generated;
}

export function regenerateQuestion(
  roundType: RoundType,
  questionIndex: number,
  currentQuestions: GeneratedQuestions,
  roundSettings: RoundSettings
): GeneratedQuestions {
  const updated = { ...currentQuestions };

  switch (roundType) {
    case 'trivia-buzz':
      if (updated.triviaBuzz) {
        const difficulty = roundSettings.triviaBuzzDifficulty || 'medium-hard';
        const newQuestion = getRandomFromArray(triviaQuestions.filter(q => q.difficulty === difficulty));
        updated.triviaBuzz[questionIndex] = { ...newQuestion, id: `${newQuestion.id}-${questionIndex}-regen` };
      }
      break;

    case 'lightning':
      if (updated.lightning) {
        const difficulty = roundSettings.lightningDifficulty || 'medium-hard';
        const newQuestion = getRandomFromArray(lightningQuestions.filter(q => q.difficulty === difficulty));
        updated.lightning[questionIndex] = { ...newQuestion, id: `${newQuestion.id}-${questionIndex}-regen` };
      }
      break;

    case 'guess-number':
      if (updated.guessNumber) {
        const newQuestion = getRandomFromArray(guessNumberQuestions);
        updated.guessNumber[questionIndex] = { ...newQuestion };
      }
      break;

    case 'connect-4':
      if (updated.connect4) {
        // Use row-based difficulty
        const rowDifficulties: Difficulty[] = ['easy', 'medium', 'medium-hard', 'hard'];
        const column = updated.connect4[questionIndex].column;
        const row = updated.connect4[questionIndex].row;
        const difficulty = rowDifficulties[row];
        const newQuestion = getRandomFromArray(triviaQuestions.filter(q => q.difficulty === difficulty));
        updated.connect4[questionIndex] = {
          column,
          row,
          question: { ...newQuestion, id: `c4-${column}-${row}-regen` }
        };
      }
      break;

    case 'blind-draw':
      if (updated.blindDraw) {
        const difficulty = roundSettings.blindDrawDifficulty || 'medium-hard';
        const wordPool = difficulty === 'easy' 
          ? blindDrawWords.easy 
          : difficulty === 'hard'
          ? blindDrawWords.hard
          : blindDrawWords.medium;
        updated.blindDraw[questionIndex] = getRandomFromArray(wordPool);
      }
      break;
  }

  return updated;
}