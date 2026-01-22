import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RoundType } from '@/app/types/game';
import { RoundInstructions } from '@/app/components/RoundInstructions';
import { PlayerTriviaBuzz } from './rounds/PlayerTriviaBuzz';
import { PlayerLightning } from './rounds/PlayerLightning';
import { PlayerQuickBuild } from './rounds/PlayerQuickBuild';
import { PlayerConnect4 } from './rounds/PlayerConnect4';
import { PlayerGuessNumber } from './rounds/PlayerGuessNumber';
import { PlayerBlindDraw } from './rounds/PlayerBlindDraw';
import { sendBuzz } from '@/services/buzzService';
import { useGameSync } from '@/hooks/useGameSync';
import { formatGameCode } from '@/app/utils/gameCode';
import { disconnectPlayer, updateGameState } from '@/services/gameService';
import { Scoreboard } from '@/app/components/Scoreboard';

interface PlayerViewProps {
  gameId: string;
  gameCode: string;
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  teamColor: string;
}

type RoundData = Record<string, any>;

export function PlayerView({ gameId, gameCode, playerId, playerName, teamId, teamName, teamColor }: PlayerViewProps) {
  const { game, teams, gameState, players, loading, error } = useGameSync(gameId, 1000);
  const [showRules, setShowRules] = useState(true);

  const roundType = game?.current_round_type || 'trivia-buzz';
  const gameComplete = game?.status === 'completed';
  const waitingForHost = game?.status === 'waiting';
  const roundNumber = (game?.current_round ?? 0) + 1;
  const roundData: RoundData = (gameState?.round_data as RoundData) || {};
  const roundNameMap: Record<RoundType, string> = {
    'trivia-buzz': 'Trivia Buzz',
    lightning: 'Lightning Round',
    'quick-build': 'Quick Build',
    'connect-4': 'Connect 4',
    'guess-number': 'Guess the Number',
    'blind-draw': 'Blind Draw',
  };
  const roundIconMap: Record<RoundType, string> = {
    'trivia-buzz': '⚡',
    lightning: '⚡',
    'quick-build': '🏗️',
    'connect-4': '🎯',
    'guess-number': '🔢',
    'blind-draw': '🎨',
  };
  const roundIconByName: Record<string, string> = {
    'Trivia Buzz': roundIconMap['trivia-buzz'],
    'Lightning Round': roundIconMap.lightning,
    'Quick Build': roundIconMap['quick-build'],
    'Connect 4': roundIconMap['connect-4'],
    'Guess the Number': roundIconMap['guess-number'],
    'Blind Draw': roundIconMap['blind-draw'],
  };
  const currentRoundName = roundNameMap[roundType as RoundType] || 'Trivia Buzz';
  const currentRoundIcon = roundIconMap[roundType as RoundType] || '🎮';

  const hasActiveRoundContent = Boolean(
    gameState?.current_question ||
      gameState?.can_buzz ||
      gameState?.buzzed_team_id ||
      roundData.lightning?.question ||
      roundData.quick_build?.phase ||
      roundData.connect4?.question ||
      roundData.guess_number?.prompt ||
      roundData.blind_draw?.phase
  );

  useEffect(() => {
    if (hasActiveRoundContent) {
      setShowRules(false);
      return;
    }

    if (typeof roundData.show_rules === 'boolean') {
      setShowRules(roundData.show_rules);
      return;
    }

    setShowRules(true);
  }, [
    roundType,
    roundNumber,
    roundData.show_rules,
    hasActiveRoundContent,
  ]);

  useEffect(() => {
    const handleLeave = () => {
      disconnectPlayer(playerId).catch(() => undefined);
    };
    window.addEventListener('beforeunload', handleLeave);
    return () => {
      window.removeEventListener('beforeunload', handleLeave);
      handleLeave();
    };
  }, [playerId]);

  // Map round names to RoundType
  const yourTurn = gameState?.current_turn_team_id === teamId;

  const renderRoundContent = () => {
    if (showRules && !hasActiveRoundContent) return null;

    switch (currentRoundName) {
      case 'Trivia Buzz':
        const buzzedPlayerId = (gameState?.round_data as any)?.trivia?.buzzed_player_id || null;
        const teamPlayers = gameState?.buzzed_team_id
          ? players.filter(player => player.team_id === gameState.buzzed_team_id && player.connected)
          : [];
        const buzzedPlayerName =
          (gameState?.round_data as any)?.trivia?.buzzed_player_name ||
          players.find(player => player.id === buzzedPlayerId)?.name ||
          (teamPlayers.length === 1 ? teamPlayers[0].name : null) ||
          null;
        return (
          <PlayerTriviaBuzz
            question={gameState?.current_question || null}
            category={gameState?.current_category || undefined}
            points={gameState?.current_points || undefined}
            canBuzz={!!gameState?.can_buzz}
            buzzedTeam={gameState?.buzzed_team_id || null}
            buzzedPlayerName={buzzedPlayerName}
            teamId={teamId}
            teamColor={teamColor}
            timeRemaining={gameState?.time_remaining || undefined}
            answer={roundData.trivia?.answer}
            showAnswer={roundData.trivia?.show_answer}
            onBuzz={async () => {
              await sendBuzz(
                gameId,
                teamId,
                playerId,
                playerName,
                gameState?.current_question || undefined
              );
              await updateGameState(gameId, {
                round_data: {
                  trivia: {
                    buzzed_player_id: playerId,
                    buzzed_player_name: playerName,
                  },
                },
              });
            }}
          />
        );
      
      case 'Lightning Round':
        return (
          <PlayerLightning
            question={roundData.lightning?.question || null}
            questionNumber={roundData.lightning?.question_number ?? 0}
            totalQuestions={roundData.lightning?.total_questions || 10}
            timeRemaining={roundData.lightning?.time_remaining ?? 60}
            yourTurn={yourTurn}
            teamColor={teamColor}
            correctCount={roundData.lightning?.correct_count}
            incorrectCount={roundData.lightning?.incorrect_count}
            roundComplete={roundData.lightning?.round_complete}
            pointsThisRound={roundData.lightning?.points_this_round}
          />
        );
      
      case 'Quick Build':
        const winnerTeamId = roundData.quick_build?.winner_team_id || null;
        const winnerTeamName = winnerTeamId
          ? teams.find(team => team.id === winnerTeamId)?.name || null
          : null;
        return (
          <PlayerQuickBuild
            challenge={roundData.quick_build?.challenge || 'Build the tallest tower'}
            timeRemaining={roundData.quick_build?.time_remaining || 180}
            totalTime={roundData.quick_build?.total_time || 180}
            phase={roundData.quick_build?.phase || 'building'}
            teamColor={teamColor}
            winnerName={winnerTeamName}
            isTie={!!roundData.quick_build?.tie}
          />
        );
      
      case 'Connect 4':
        const coinFlipWinnerId = roundData.connect4?.coin_flip_winner_team_id || null;
        const coinFlipWinnerName = coinFlipWinnerId
          ? teams.find(team => team.id === coinFlipWinnerId)?.name || null
          : null;
        return (
          <PlayerConnect4
            question={roundData.connect4?.question || null}
            selectedColumn={roundData.connect4?.selected_column ?? null}
            selectedSquare={roundData.connect4?.selected_square || null}
            pointValue={roundData.connect4?.point_value || null}
            yourTurn={yourTurn}
            teamId={teamId}
            teamColor={teamColor}
            board={roundData.connect4?.board || []}
            categories={roundData.connect4?.column_themes || null}
            teamColors={teams.reduce<Record<string, string>>((acc, team) => {
              acc[team.id] = team.color;
              return acc;
            }, {})}
            teams={teams.map(team => ({
              id: team.id,
              name: team.name,
              color: team.color,
            }))}
            bonusPoints={roundData.connect4?.team_bonus_points || {}}
            teamScore={roundData.connect4?.team_score || 0}
            opponentScore={roundData.connect4?.opponent_score || 0}
            coinFlipDone={!!roundData.connect4?.coin_flip_done}
            coinFlipWinnerName={coinFlipWinnerName}
            coinFlipWinnerTeamId={coinFlipWinnerId}
            gameStarted={!!roundData.connect4?.game_started}
          />
        );
      
      case 'Guess the Number': {
        const guessNumberData = roundData.guess_number || {};
        const questionId = guessNumberData.question_id ?? 0;
        const playerGuesses = guessNumberData.player_guesses?.[questionId] || {};
        const playerGuessEntry = playerGuesses[playerId];
        const submittedGuess = playerGuessEntry?.guess ?? null;
        const revealed = !!guessNumberData.revealed;
        const winnerTeamId = guessNumberData.winner_team_id || null;
        const winnerTeamName = winnerTeamId
          ? teams.find(team => team.id === winnerTeamId)?.name || null
          : null;
        const teamResults = (guessNumberData.team_results || []).map((result: any) => {
          const team = teams.find(t => t.id === result.team_id);
          return {
            teamId: result.team_id || team?.id || '',
            teamName: team?.name || 'Team',
            teamColor: team?.color || '#3B82F6',
            closestGuess: result.closest_guess ?? result.closestGuess ?? 0,
            difference: result.difference ?? 0,
            playerName: result.player_name || 'Player',
            winnerPlayers: Array.isArray(result.winner_players) ? result.winner_players : [],
          };
        });
        return (
          <PlayerGuessNumber
            prompt={guessNumberData.prompt || 'Guess the number'}
            timeRemaining={guessNumberData.time_remaining}
            questionId={questionId}
            questionIndex={guessNumberData.question_index ?? 1}
            totalQuestions={guessNumberData.total_questions ?? 1}
            submittedGuess={submittedGuess}
            canSubmit={!!guessNumberData.prompt && !revealed && (guessNumberData.time_remaining ?? 0) > 0}
            onDraftGuess={async (guess) => {
              await updateGameState(gameId, {
                round_data: {
                  guess_number: {
                    player_drafts: {
                      [questionId]: {
                        [playerId]: {
                          team_id: teamId,
                          player_name: playerName,
                          guess,
                        },
                      },
                    },
                  },
                },
              });
            }}
            onSubmitGuess={async (guess) => {
              await updateGameState(gameId, {
                round_data: {
                  guess_number: {
                    player_guesses: {
                      [questionId]: {
                        [playerId]: {
                          team_id: teamId,
                          player_name: playerName,
                          guess,
                        },
                      },
                    },
                  },
                },
              });
            }}
            revealed={revealed}
            correctAnswer={guessNumberData.correct_answer ?? null}
            winnerTeamName={winnerTeamName}
            isTie={!!guessNumberData.tie}
            teamResults={teamResults}
          />
        );
      }
      
      case 'Blind Draw':
        const drawerPlayerId = roundData.blind_draw?.drawer_player_id || null;
        const isDrawer = drawerPlayerId === playerId;
        const drawerTeamId = roundData.blind_draw?.drawer_team_id || null;
        const isGuessingTeam = drawerTeamId === teamId;
        return (
          <PlayerBlindDraw
            word={isDrawer ? roundData.blind_draw?.word : null}
            isDrawer={isDrawer}
            isGuessingTeam={isGuessingTeam}
            timeRemaining={roundData.blind_draw?.time_remaining ?? 60}
            teamColor={teamColor}
            phase={roundData.blind_draw?.phase || 'drawing'}
            result={roundData.blind_draw?.result || null}
          />
        );
      
      default:
        return (
          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardContent className="pt-6 pb-6">
              <p className="text-white text-center">Loading round...</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 flex flex-col">
      {/* Round Transition Overlay */}
      <AnimatePresence>
        {roundData.show_transition && roundData.next_round_name && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="text-center"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
                className="text-8xl mb-6"
              >
                {roundIconByName[roundData.next_round_name] || '🎮'}
              </motion.div>
              <h2 className="text-5xl font-bold text-white mb-4">
                {roundData.next_round_name || 'Next Round'}
              </h2>
              <p className="text-2xl text-blue-200">Get Ready!</p>
              <motion.div
                className="mt-8 flex gap-2 justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 bg-white rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div>
            <div className="text-xs text-blue-200">Team</div>
            <div className="text-lg font-bold text-white">{teamName}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-blue-200">Round {roundNumber}</div>
            <div className="text-lg font-bold text-white">{currentRoundIcon} {currentRoundName}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-blue-200">Player</div>
            <div className="text-lg font-bold text-white">{playerName}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-4">
          {teams.length > 0 && <Scoreboard teams={teams} compact />}
          <AnimatePresence mode="wait">
            {loading ? (
              <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                <CardContent className="pt-6 pb-6">
                  <p className="text-white text-center">Loading game...</p>
                </CardContent>
              </Card>
            ) : error ? (
              <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                <CardContent className="pt-6 pb-6">
                  <p className="text-red-200 text-center">{error}</p>
                </CardContent>
              </Card>
            ) : gameComplete ? (
              <motion.div
                key="game-complete"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                  <CardContent className="pt-6 pb-6 space-y-4">
                    <div className="text-center">
                      <h2 className="text-3xl font-bold text-white mb-2">Game Complete!</h2>
                      <p className="text-blue-200">Final scores</p>
                    </div>
                    {teams.length > 0 && <Scoreboard teams={teams} />}
                  </CardContent>
                </Card>
              </motion.div>
            ) : waitingForHost ? (
              <motion.div
                key="lobby"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                  <CardContent className="pt-6 pb-6 space-y-4">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-white mb-1">Lobby</h2>
                      <p className="text-blue-200 text-sm">Waiting for host to start the game</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      {teams.map(team => {
                        const teamPlayers = players.filter(player => player.team_id === team.id);
                        return (
                          <div
                            key={team.id}
                            className="border rounded-lg p-4"
                            style={{ borderLeft: `4px solid ${team.color}` }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-semibold text-white">{team.name}</div>
                              <div className="text-xs text-blue-200">{teamPlayers.length} joined</div>
                            </div>
                            {teamPlayers.length === 0 ? (
                              <div className="text-sm text-blue-200">No players yet</div>
                            ) : (
                              <div className="space-y-1">
                                {teamPlayers.map(player => (
                                  <div key={player.id} className="flex items-center justify-between text-sm text-white">
                                    <span>{player.name}</span>
                                    <span className={player.connected ? 'text-green-300' : 'text-blue-200'}>
                                      {player.connected ? 'Online' : 'Left'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : showRules && !hasActiveRoundContent ? (
              <motion.div
                key="rules"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <RoundInstructions roundType={roundType as RoundType} isHost={false} />
              </motion.div>
            ) : (
              <motion.div
                key="round-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {renderRoundContent()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info Button */}
          {!hasActiveRoundContent && (
            <Button
              onClick={() => setShowRules(!showRules)}
              variant="outline"
              className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              <Info className="mr-2 h-4 w-4" />
              {showRules ? 'Hide Rules' : 'Show Rules'}
            </Button>
          )}

        </div>
      </div>

      
    </div>
  );
}