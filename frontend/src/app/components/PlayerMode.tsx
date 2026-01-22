import { useState } from 'react';
import { PlayerJoin } from '@/app/components/player/PlayerJoin';
import { PlayerView } from '@/app/components/player/PlayerView';

export function PlayerMode() {
  const [joined, setJoined] = useState(false);
  const [gameInfo, setGameInfo] = useState({
    gameId: '',
    gameCode: '',
    playerId: '',
    playerName: '',
    teamId: '',
    teamName: '',
    teamColor: '',
  });

  const handleJoin = (payload: {
    gameId: string;
    gameCode: string;
    playerId: string;
    playerName: string;
    teamId: string;
    teamName: string;
    teamColor: string;
  }) => {
    setGameInfo({
      gameId: payload.gameId,
      gameCode: payload.gameCode,
      playerId: payload.playerId,
      playerName: payload.playerName,
      teamId: payload.teamId,
      teamName: payload.teamName,
      teamColor: payload.teamColor,
    });
    setJoined(true);
  };

  if (!joined) {
    return <PlayerJoin onJoin={handleJoin} />;
  }

  return (
    <PlayerView
      gameCode={gameInfo.gameCode}
      gameId={gameInfo.gameId}
      playerId={gameInfo.playerId}
      playerName={gameInfo.playerName}
      teamId={gameInfo.teamId}
      teamName={gameInfo.teamName}
      teamColor={gameInfo.teamColor}
    />
  );
}
