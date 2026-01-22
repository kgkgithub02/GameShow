import { apiRequest } from './apiClient';

export async function sendBuzz(
  gameId: string,
  teamId: string,
  playerId?: string,
  playerName?: string,
  questionText?: string
) {
  return apiRequest<{ success: boolean; message?: string }>(`/api/games/${gameId}/buzz`, {
    method: 'POST',
    body: {
      team_id: teamId,
      player_id: playerId,
      player_name: playerName,
      question_text: questionText,
    },
  });
}

export async function resetBuzz(gameId: string) {
  return apiRequest(`/api/games/${gameId}/buzz/reset`, { method: 'POST' });
}

export async function enableBuzzing(gameId: string) {
  return apiRequest(`/api/games/${gameId}/buzz/enable`, { method: 'POST' });
}

export async function disableBuzzing(gameId: string) {
  return apiRequest(`/api/games/${gameId}/buzz/disable`, { method: 'POST' });
}
