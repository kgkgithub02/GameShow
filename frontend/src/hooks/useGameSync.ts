import { useEffect, useRef, useState } from 'react';
import {
  GameStateDto,
  GameWithTeamsDto,
  PlayerStatusDto,
  getGame,
  getGameState,
  getPlayersForGame,
} from '@/services/gameService';

interface UseGameSyncResult {
  game: GameWithTeamsDto['game'] | null;
  teams: GameWithTeamsDto['teams'];
  players: PlayerStatusDto[];
  gameState: GameStateDto | null;
  loading: boolean;
  error: string | null;
}

export function useGameSync(gameId: string | null, pollIntervalMs = 1500): UseGameSyncResult {
  const [game, setGame] = useState<GameWithTeamsDto['game'] | null>(null);
  const [teams, setTeams] = useState<GameWithTeamsDto['teams']>([]);
  const [players, setPlayers] = useState<PlayerStatusDto[]>([]);
  const [gameState, setGameState] = useState<GameStateDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!gameId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    let timer: number | null = null;

    const fetchAll = async () => {
      try {
        const [gameResponse, stateResponse, playersResponse] = await Promise.all([
          getGame(gameId),
          getGameState(gameId),
          getPlayersForGame(gameId),
        ]);
        if (!isMounted) return;
        setGame(gameResponse.game);
        setTeams(gameResponse.teams);
        setGameState(stateResponse);
        setPlayers(playersResponse);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to sync game');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAll();
    if (!wsConnected) {
      timer = window.setInterval(fetchAll, pollIntervalMs);
    }

    return () => {
      isMounted = false;
      if (timer) {
        window.clearInterval(timer);
      }
    };
  }, [gameId, pollIntervalMs, wsConnected]);

  useEffect(() => {
    if (!gameId) {
      return;
    }

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const wsBase = import.meta.env.VITE_WS_URL || apiBase.replace(/^http/, 'ws');
    const wsUrl = `${wsBase.replace(/\/$/, '')}/ws/games/${gameId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as {
          type: string;
          data: {
            game?: GameWithTeamsDto['game'];
            teams?: GameWithTeamsDto['teams'];
            players?: PlayerStatusDto[];
            game_state?: GameStateDto | null;
          };
        };
        if (message.type === 'snapshot') {
          if (message.data.game) setGame(message.data.game);
          if (message.data.teams) setTeams(message.data.teams);
          if (message.data.players) setPlayers(message.data.players);
          if (message.data.game_state !== undefined) setGameState(message.data.game_state);
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse live update');
      }
    };

    ws.onerror = () => {
      setWsConnected(false);
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [gameId]);

  return { game, teams, players, gameState, loading, error };
}
