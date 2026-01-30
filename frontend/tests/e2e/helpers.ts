import { request } from '@playwright/test';

const apiBaseUrl = process.env.E2E_API_URL || 'http://localhost:8000';

export interface CreatedGame {
  gameId: string;
  gameCode: string;
  teams: Array<{ id: string; name: string; color: string }>;
}

export interface TriviaGameSetup extends CreatedGame {
  hostPin: string;
  questions: Array<{ text: string; answer: string }>;
}

export interface LightningGameSetup extends CreatedGame {
  hostPin: string;
  questions: Array<{ text: string; answer: string }>;
}

export async function createGame(): Promise<CreatedGame> {
  const context = await request.newContext({ baseURL: apiBaseUrl });
  const response = await context.post('/api/games', {
    data: {
      teams: [
        { name: 'Team Alpha', color: '#3b82f6' },
        { name: 'Team Beta', color: '#ef4444' },
      ],
      difficulty: 'medium',
      rounds: ['trivia-buzz'],
      host_pin: '1234',
    },
  });

  if (!response.ok()) {
    const body = await response.text();
    await context.dispose();
    throw new Error(`Failed to create game: ${response.status()} ${body}`);
  }

  const json = (await response.json()) as {
    game: { id: string; code: string };
    teams: Array<{ id: string; name: string; color: string }>;
  };

  await context.dispose();
  return {
    gameId: json.game.id,
    gameCode: json.game.code,
    teams: json.teams,
  };
}

export async function createTriviaGame(): Promise<TriviaGameSetup> {
  const hostPin = '1234';
  const questions = [
    { text: 'What is 2 + 2?', answer: '4' },
    { text: 'What is the capital of France?', answer: 'Paris' },
    { text: 'What year did World War II end?', answer: '1945' },
    { text: 'What is the largest planet in our solar system?', answer: 'Jupiter' },
    { text: 'Who painted the Mona Lisa?', answer: 'Leonardo da Vinci' },
    { text: 'What is the smallest prime number?', answer: '2' },
    { text: 'What is the chemical symbol for gold?', answer: 'Au' },
    { text: 'How many continents are there?', answer: '7' },
    { text: 'What is the speed of light in km/s?', answer: '299,792' },
    { text: 'Who wrote Romeo and Juliet?', answer: 'William Shakespeare' },
  ];
  
  const context = await request.newContext({ baseURL: apiBaseUrl });

  const createResponse = await context.post('/api/games', {
    data: {
      teams: [
        { name: 'Team Alpha', color: '#3b82f6' },
        { name: 'Team Beta', color: '#ef4444' },
      ],
      difficulty: 'medium',
      rounds: ['trivia-buzz'],
      host_pin: hostPin,
    },
  });

  if (!createResponse.ok()) {
    const body = await createResponse.text();
    await context.dispose();
    throw new Error(`Failed to create game: ${createResponse.status()} ${body}`);
  }

  const created = (await createResponse.json()) as {
    game: { id: string; code: string };
    teams: Array<{ id: string; name: string; color: string }>;
  };

  await context.patch(`/api/games/${created.game.id}`, {
    data: {
      status: 'in_progress',
      current_round: 0,
      current_round_type: 'trivia-buzz',
      difficulty: 'medium',
    },
  });

  await context.patch(`/api/games/${created.game.id}/state`, {
    data: {
      round_data: {
        game_setup: {
          rounds: ['trivia-buzz'],
          round_settings: {
            triviaBuzzQuestions: 10,
            triviaBuzzDifficulty: 'medium',
          },
          difficulty: 'medium',
          setup_step: 'game',
        },
        generated_questions: {
          triviaBuzz: questions.map((q, idx) => ({
            id: `tb-${idx + 1}`,
            text: q.text,
            answer: q.answer,
            difficulty: 'medium',
            category: 'General',
          })),
        },
      },
    },
  });

  await context.dispose();
  return {
    gameId: created.game.id,
    gameCode: created.game.code,
    teams: created.teams,
    hostPin,
    questions,
  };
}

export async function createLightningGame(): Promise<LightningGameSetup> {
  const hostPin = '1234';
  const questions = [
    { text: 'Name a color in the rainbow', answer: 'Red' },
    { text: 'Name a planet in our solar system', answer: 'Earth' },
    { text: 'Name a day of the week', answer: 'Monday' },
    { text: 'Name a month of the year', answer: 'January' },
    { text: 'Name a type of fruit', answer: 'Apple' },
    { text: 'Name a musical instrument', answer: 'Guitar' },
    { text: 'Name a country in Europe', answer: 'France' },
    { text: 'Name an ocean', answer: 'Pacific' },
    { text: 'Name a mammal', answer: 'Dog' },
    { text: 'Name a vegetable', answer: 'Carrot' },
  ];
  
  const context = await request.newContext({ baseURL: apiBaseUrl });

  const createResponse = await context.post('/api/games', {
    data: {
      teams: [
        { name: 'Team Alpha', color: '#3b82f6' },
        { name: 'Team Beta', color: '#ef4444' },
      ],
      difficulty: 'medium',
      rounds: ['lightning'],
      host_pin: hostPin,
    },
  });

  if (!createResponse.ok()) {
    const body = await createResponse.text();
    await context.dispose();
    throw new Error(`Failed to create game: ${createResponse.status()} ${body}`);
  }

  const created = (await createResponse.json()) as {
    game: { id: string; code: string };
    teams: Array<{ id: string; name: string; color: string }>;
  };

  await context.patch(`/api/games/${created.game.id}`, {
    data: {
      status: 'in_progress',
      current_round: 0,
      current_round_type: 'lightning',
      difficulty: 'medium',
    },
  });

  await context.patch(`/api/games/${created.game.id}/state`, {
    data: {
      round_data: {
        game_setup: {
          rounds: ['lightning'],
          round_settings: {
            lightningQuestions: 10,
            lightningTime: 10,
            lightningSeconds: 10,
          },
          difficulty: 'medium',
          setup_step: 'game',
        },
        generated_questions: {
          lightning: questions.map((q, idx) => ({
            id: `lt-${idx + 1}`,
            text: q.text,
            answer: q.answer,
            difficulty: 'medium',
            category: 'General',
          })),
        },
        lightning: {
          time_per_team: 10,
          questions_per_team: 10,
        },
      },
    },
  });

  await context.dispose();
  return {
    gameId: created.game.id,
    gameCode: created.game.code,
    teams: created.teams,
    hostPin,
    questions,
  };
}
