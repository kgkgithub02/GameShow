import { apiRequest } from './apiClient';
import { Difficulty, RoundType, Team } from '@/app/types/game';

export interface GameCreatePayload {
  teams: Array<{ name: string; color: string }>;
  difficulty: Difficulty;
  rounds: RoundType[];
  host_pin?: string;
}

export interface GameDto {
  id: string;
  code: string;
  status: string;
  current_round: number;
  current_round_type: string | null;
  difficulty: string | null;
}

export interface TeamDto {
  id: string;
  name: string;
  color: string;
  score: number;
  players: string[];
}

export interface PlayerStatusDto {
  id: string;
  name: string;
  team_id: string;
  game_id: string;
  connected: boolean;
}

export interface GameWithTeamsDto {
  game: GameDto;
  teams: TeamDto[];
}

export interface GameStateDto {
  game_id: string;
  current_question: string | null;
  current_category: string | null;
  current_points: number | null;
  time_remaining: number | null;
  can_buzz: boolean;
  buzzed_team_id: string | null;
  current_turn_team_id: string | null;
  round_data: Record<string, unknown> | null;
  updated_at?: string | null;
}

export interface GameStateUpdatePayload {
  current_question?: string | null;
  current_category?: string | null;
  current_points?: number | null;
  time_remaining?: number | null;
  can_buzz?: boolean | null;
  buzzed_team_id?: string | null;
  current_turn_team_id?: string | null;
  round_data?: Record<string, unknown> | null;
}

export interface GameUpdatePayload {
  status?: string | null;
  current_round?: number | null;
  current_round_type?: string | null;
  difficulty?: string | null;
}

export async function createGame(payload: GameCreatePayload): Promise<GameWithTeamsDto> {
  return apiRequest<GameWithTeamsDto>('/api/games', {
    method: 'POST',
    body: payload,
  });
}

export async function getHostGameByCode(code: string, hostPin: string): Promise<GameWithTeamsDto> {
  return apiRequest<GameWithTeamsDto>(`/api/games/code/${code}/host`, {
    method: 'POST',
    body: { host_pin: hostPin },
  });
}

export async function getGameByCode(code: string): Promise<GameWithTeamsDto> {
  return apiRequest<GameWithTeamsDto>(`/api/games/code/${code}`);
}

export async function getGame(gameId: string): Promise<GameWithTeamsDto> {
  return apiRequest<GameWithTeamsDto>(`/api/games/${gameId}`);
}

export async function updateGame(gameId: string, updates: GameUpdatePayload): Promise<GameDto> {
  return apiRequest<GameDto>(`/api/games/${gameId}`, {
    method: 'PATCH',
    body: updates,
  });
}

export async function joinGame(code: string, playerName: string, teamId: string) {
  return apiRequest<{ id: string; name: string; team_id: string; game_id: string; connected: boolean }>(
    `/api/games/${code}/join`,
    {
      method: 'POST',
      body: { player_name: playerName, team_id: teamId },
    }
  );
}

export async function getGameState(gameId: string): Promise<GameStateDto> {
  return apiRequest<GameStateDto>(`/api/games/${gameId}/state`);
}

export async function getPlayersForGame(gameId: string): Promise<PlayerStatusDto[]> {
  return apiRequest<PlayerStatusDto[]>(`/api/games/${gameId}/players`);
}

export async function disconnectPlayer(playerId: string): Promise<PlayerStatusDto> {
  return apiRequest<PlayerStatusDto>(`/api/players/${playerId}/disconnect`, {
    method: 'POST',
  });
}

export async function updateGameState(
  gameId: string,
  updates: GameStateUpdatePayload
): Promise<GameStateDto> {
  return apiRequest<GameStateDto>(`/api/games/${gameId}/state`, {
    method: 'PATCH',
    body: updates,
  });
}

export async function updateTeamScore(teamId: string, points: number): Promise<TeamDto> {
  return apiRequest<TeamDto>(`/api/teams/${teamId}/score`, {
    method: 'POST',
    body: { points },
  });
}

export function mapTeamDto(team: TeamDto): Team {
  return {
    id: team.id,
    name: team.name,
    color: team.color,
    score: team.score,
    players: team.players || [],
  };
}
