import { Question, Difficulty } from '@/app/types/game';

export const triviaQuestions: Question[] = [
  // Easy
  { id: 'q1', text: 'What is the capital of France?', answer: 'Paris', difficulty: 'easy' },
  { id: 'q2', text: 'How many continents are there?', answer: '7', difficulty: 'easy' },
  { id: 'q3', text: 'What color is a ruby?', answer: 'Red', difficulty: 'easy' },
  { id: 'q4', text: 'What is 10 + 15?', answer: '25', difficulty: 'easy' },
  { id: 'q5', text: 'What animal says "meow"?', answer: 'Cat', difficulty: 'easy' },
  { id: 'q51', text: 'How many days in a week?', answer: '7', difficulty: 'easy' },
  { id: 'q52', text: 'What color are bananas?', answer: 'Yellow', difficulty: 'easy' },
  { id: 'q53', text: 'What is 2 + 2?', answer: '4', difficulty: 'easy' },
  { id: 'q54', text: 'What animal says "moo"?', answer: 'Cow', difficulty: 'easy' },
  { id: 'q55', text: 'What shape is a ball?', answer: 'Sphere/Circle', difficulty: 'easy' },
  
  // Medium
  { id: 'q6', text: 'Who painted the Mona Lisa?', answer: 'Leonardo da Vinci', difficulty: 'medium' },
  { id: 'q7', text: 'What is the largest planet in our solar system?', answer: 'Jupiter', difficulty: 'medium' },
  { id: 'q8', text: 'In which year did World War II end?', answer: '1945', difficulty: 'medium' },
  { id: 'q9', text: 'What is the chemical symbol for gold?', answer: 'Au', difficulty: 'medium' },
  { id: 'q10', text: 'How many strings does a standard guitar have?', answer: '6', difficulty: 'medium' },
  { id: 'q56', text: 'Who wrote Romeo and Juliet?', answer: 'William Shakespeare', difficulty: 'medium' },
  { id: 'q57', text: 'What is the capital of Italy?', answer: 'Rome', difficulty: 'medium' },
  { id: 'q58', text: 'How many sides does an octagon have?', answer: '8', difficulty: 'medium' },
  { id: 'q59', text: 'What is the freezing point of water in Celsius?', answer: '0', difficulty: 'medium' },
  { id: 'q60', text: 'What is the largest ocean on Earth?', answer: 'Pacific Ocean', difficulty: 'medium' },
  
  // Medium-Hard
  { id: 'q11', text: 'What is the smallest country in the world?', answer: 'Vatican City', difficulty: 'medium-hard' },
  { id: 'q12', text: 'Who wrote "To Kill a Mockingbird"?', answer: 'Harper Lee', difficulty: 'medium-hard' },
  { id: 'q13', text: 'What is the speed of light in meters per second?', answer: '299,792,458', difficulty: 'medium-hard' },
  { id: 'q14', text: 'In what year was the first iPhone released?', answer: '2007', difficulty: 'medium-hard' },
  { id: 'q15', text: 'What is the capital of Australia?', answer: 'Canberra', difficulty: 'medium-hard' },
  { id: 'q61', text: 'What is the currency of Switzerland?', answer: 'Swiss Franc', difficulty: 'medium-hard' },
  { id: 'q62', text: 'Who invented the telephone?', answer: 'Alexander Graham Bell', difficulty: 'medium-hard' },
  { id: 'q63', text: 'What is the smallest bone in the human body?', answer: 'Stapes (in the ear)', difficulty: 'medium-hard' },
  { id: 'q64', text: 'In what year did the Titanic sink?', answer: '1912', difficulty: 'medium-hard' },
  { id: 'q65', text: 'What is the largest desert in the world?', answer: 'Antarctic Desert', difficulty: 'medium-hard' },
  { id: 'q66', text: 'Who painted "The Starry Night"?', answer: 'Vincent van Gogh', difficulty: 'medium-hard' },
  { id: 'q67', text: 'What is the most spoken language in the world?', answer: 'Mandarin Chinese', difficulty: 'medium-hard' },
  { id: 'q68', text: 'How many hearts does an octopus have?', answer: '3', difficulty: 'medium-hard' },
  { id: 'q69', text: 'What year did World War I begin?', answer: '1914', difficulty: 'medium-hard' },
  { id: 'q70', text: 'What is the chemical symbol for silver?', answer: 'Ag', difficulty: 'medium-hard' },
  
  // Hard
  { id: 'q16', text: 'What is the only mammal capable of true flight?', answer: 'Bat', difficulty: 'hard' },
  { id: 'q17', text: 'Who was the first person to walk on the moon?', answer: 'Neil Armstrong', difficulty: 'hard' },
  { id: 'q18', text: 'What is the rarest blood type?', answer: 'AB negative', difficulty: 'hard' },
  { id: 'q19', text: 'In which year did the Berlin Wall fall?', answer: '1989', difficulty: 'hard' },
  { id: 'q20', text: 'What is the longest river in the world?', answer: 'Nile', difficulty: 'hard' },
  { id: 'q71', text: 'What is the atomic number of carbon?', answer: '6', difficulty: 'hard' },
  { id: 'q72', text: 'Who discovered penicillin?', answer: 'Alexander Fleming', difficulty: 'hard' },
  { id: 'q73', text: 'What is the smallest prime number greater than 10?', answer: '11', difficulty: 'hard' },
  { id: 'q74', text: 'In what year was the Magna Carta signed?', answer: '1215', difficulty: 'hard' },
  { id: 'q75', text: 'What is the boiling point of water at sea level in Fahrenheit?', answer: '212°F', difficulty: 'hard' },
];

export const lightningQuestions: Question[] = [
  { id: 'l1', text: 'Name a primary color', answer: 'Red/Blue/Yellow', difficulty: 'easy' },
  { id: 'l2', text: 'What is 5 x 5?', answer: '25', difficulty: 'easy' },
  { id: 'l3', text: 'Name a day of the week', answer: 'Any day', difficulty: 'easy' },
  { id: 'l4', text: 'What comes after Thursday?', answer: 'Friday', difficulty: 'easy' },
  { id: 'l5', text: 'How many legs does a spider have?', answer: '8', difficulty: 'easy' },
  { id: 'l6', text: 'What is ice made of?', answer: 'Water', difficulty: 'easy' },
  { id: 'l7', text: 'Name a fruit that is yellow', answer: 'Banana/Lemon', difficulty: 'easy' },
  { id: 'l8', text: 'What is 100 - 50?', answer: '50', difficulty: 'easy' },
  { id: 'l9', text: 'Name a season', answer: 'Spring/Summer/Fall/Winter', difficulty: 'easy' },
  { id: 'l10', text: 'What do bees make?', answer: 'Honey', difficulty: 'easy' },
  { id: 'l11', text: 'How many hours in a day?', answer: '24', difficulty: 'easy' },
  { id: 'l12', text: 'Name an ocean', answer: 'Pacific/Atlantic/Indian/Arctic/Southern', difficulty: 'easy' },
  { id: 'l13', text: 'What color is the sky?', answer: 'Blue', difficulty: 'easy' },
  { id: 'l14', text: 'How many months in a year?', answer: '12', difficulty: 'easy' },
  { id: 'l15', text: 'Name a musical instrument', answer: 'Any instrument', difficulty: 'easy' },
  
  // Medium
  { id: 'l16', text: 'Name the capital of Germany', answer: 'Berlin', difficulty: 'medium' },
  { id: 'l17', text: 'What is 12 x 8?', answer: '96', difficulty: 'medium' },
  { id: 'l18', text: 'Name a Shakespeare play', answer: 'Romeo and Juliet/Hamlet/etc', difficulty: 'medium' },
  { id: 'l19', text: 'How many sides does a hexagon have?', answer: '6', difficulty: 'medium' },
  { id: 'l20', text: 'What element has the symbol O?', answer: 'Oxygen', difficulty: 'medium' },
  { id: 'l21', text: 'Name a planet with rings', answer: 'Saturn/Jupiter/Uranus/Neptune', difficulty: 'medium' },
  { id: 'l22', text: 'What year did Columbus sail to America?', answer: '1492', difficulty: 'medium' },
  { id: 'l23', text: 'How many strings on a violin?', answer: '4', difficulty: 'medium' },
  { id: 'l24', text: 'Name a precious metal', answer: 'Gold/Silver/Platinum', difficulty: 'medium' },
  { id: 'l25', text: 'What is the square root of 64?', answer: '8', difficulty: 'medium' },
  
  // Medium-Hard
  { id: 'l26', text: 'Name the currency of Japan', answer: 'Yen', difficulty: 'medium-hard' },
  { id: 'l27', text: 'What is the capital of Brazil?', answer: 'Brasília', difficulty: 'medium-hard' },
  { id: 'l28', text: 'How many bones in the human skull?', answer: '22', difficulty: 'medium-hard' },
  { id: 'l29', text: 'Name a programming language', answer: 'Python/Java/C++/JavaScript/etc', difficulty: 'medium-hard' },
  { id: 'l30', text: 'What does CPU stand for?', answer: 'Central Processing Unit', difficulty: 'medium-hard' },
  { id: 'l31', text: 'Name the smallest prime number', answer: '2', difficulty: 'medium-hard' },
  { id: 'l32', text: 'What is the speed of sound in km/h?', answer: '1,235 km/h (approx)', difficulty: 'medium-hard' },
  { id: 'l33', text: 'Name a Nobel Prize category', answer: 'Physics/Chemistry/Medicine/Literature/Peace/Economics', difficulty: 'medium-hard' },
  { id: 'l34', text: 'What year was Google founded?', answer: '1998', difficulty: 'medium-hard' },
  { id: 'l35', text: 'How many time zones in Russia?', answer: '11', difficulty: 'medium-hard' },
  
  // Hard
  { id: 'l36', text: 'What is the chemical formula for methane?', answer: 'CH4', difficulty: 'hard' },
  { id: 'l37', text: 'Name the first artificial satellite', answer: 'Sputnik 1', difficulty: 'hard' },
  { id: 'l38', text: 'What is the Planck constant value?', answer: '6.626 x 10^-34 J·s', difficulty: 'hard' },
  { id: 'l39', text: 'Who painted "The Night Watch"?', answer: 'Rembrandt', difficulty: 'hard' },
  { id: 'l40', text: 'What is the atomic number of uranium?', answer: '92', difficulty: 'hard' },
];

export const guessNumberQuestions = [
  { question: 'How many states are in the USA?', answer: 50 },
  { question: 'How many keys are on a standard piano?', answer: 88 },
  { question: 'What year was the United Nations founded?', answer: 1945 },
  { question: 'How many bones are in the adult human body?', answer: 206 },
  { question: 'What is the height of Mount Everest in meters?', answer: 8849 },
  { question: 'How many elements are in the periodic table?', answer: 118 },
  { question: 'What year did the Titanic sink?', answer: 1912 },
  { question: 'How many planets are in our solar system?', answer: 8 },
];

export const blindDrawWords = {
  easy: ['house', 'car', 'tree', 'sun', 'cat', 'dog', 'flower', 'star', 'boat', 'fish'],
  medium: ['rainbow', 'bicycle', 'telescope', 'snowman', 'butterfly', 'volcano', 'lighthouse', 'pyramid'],
  hard: ['graduation', 'celebration', 'confusion', 'excitement', 'imagination', 'discovery', 'transformation'],
};

export function getRandomQuestion(pool: Question[], difficulty?: Difficulty): Question {
  const filtered = difficulty 
    ? pool.filter(q => q.difficulty === difficulty)
    : pool;
  
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export function getRandomGuessQuestion() {
  return guessNumberQuestions[Math.floor(Math.random() * guessNumberQuestions.length)];
}

export function getRandomDrawWord(difficulty: Difficulty = 'medium-hard'): string {
  const words = difficulty === 'easy' 
    ? blindDrawWords.easy 
    : difficulty === 'hard'
    ? blindDrawWords.hard
    : blindDrawWords.medium;
  
  return words[Math.floor(Math.random() * words.length)];
}