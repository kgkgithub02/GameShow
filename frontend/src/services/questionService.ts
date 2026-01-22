import { apiRequest } from './apiClient';
import { GeneratedQuestions } from '@/app/utils/questionGenerator';
import { RoundType } from '@/app/types/game';

export interface GenerateQuestionsPayload {
  rounds: RoundType[];
  roundSettings: Record<string, unknown>;
}

export interface RegenerateQuestionPayload {
  round_type: RoundType;
  difficulty?: string;
  category?: string | null;
  column?: number;
  row?: number;
}

export interface RegenerateQuestionResponse {
  round_type: RoundType;
  question?: {
    id: string;
    text: string;
    answer: string;
    difficulty: string;
    category?: string | null;
  };
  guess_number?: { question: string; answer: number };
  connect4?: {
    column: number;
    row: number;
    question: {
      id: string;
      text: string;
      answer: string;
      difficulty: string;
      category?: string | null;
    };
  };
  word?: string;
}

export async function generateQuestions(payload: GenerateQuestionsPayload): Promise<GeneratedQuestions> {
  return apiRequest<GeneratedQuestions>('/api/questions/generate', {
    method: 'POST',
    body: payload,
  });
}

export async function regenerateQuestion(
  payload: RegenerateQuestionPayload
): Promise<RegenerateQuestionResponse> {
  return apiRequest<RegenerateQuestionResponse>('/api/questions/regenerate', {
    method: 'POST',
    body: payload,
  });
}
