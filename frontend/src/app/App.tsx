import { useEffect, useMemo, useState } from 'react';
import { GameSetup } from '@/app/components/GameSetup';
import { GameController } from '@/app/components/GameController';
import { PlayerMode } from '@/app/components/PlayerMode';
import { QuestionReview } from '@/app/components/QuestionReview';
import { HostJoin } from '@/app/components/HostJoin';
import { Team, Difficulty, RoundType, RoundSettings } from '@/app/types/game';
import { GeneratedQuestions } from '@/app/utils/questionGenerator';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Users, Monitor } from 'lucide-react';
import { motion } from 'motion/react';
import { createGame, mapTeamDto, updateGameState } from '@/services/gameService';
import { generateQuestions } from '@/services/questionService';
import { useGameSync } from '@/hooks/useGameSync';
import { formatGameCode } from '@/app/utils/gameCode';

export default function App() {
  const [mode, setMode] = useState<'select' | 'host' | 'player'>('select');
  const [hostEntry, setHostEntry] = useState<'menu' | 'new' | 'join'>('menu');
  const [setupStep, setSetupStep] = useState<'config' | 'review' | 'game'>('config');
  const [setupMode, setSetupMode] = useState<'manual' | 'online'>('online');
  const [teams, setTeams] = useState<Team[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium-hard');
  const [selectedRounds, setSelectedRounds] = useState<RoundType[]>([]);
  const [roundSettings, setRoundSettings] = useState<RoundSettings>({});
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestions>({});
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [gameId, setGameId] = useState<string | null>(null);
  const [gameCode, setGameCode] = useState<string | null>(null);
  const { teams: syncedTeams, players: syncedPlayers, gameState } = useGameSync(gameId);
  const displayTeams = useMemo(
    () => (syncedTeams.length ? syncedTeams : teams),
    [syncedTeams, teams]
  );
  const joinedPlayers = useMemo(() => syncedPlayers, [syncedPlayers]);
  const expectedTeamCount = useMemo(
    () => (syncedTeams.length ? syncedTeams.length : teams.length),
    [syncedTeams, teams]
  );
  const joinedTeamCount = useMemo(
    () => new Set(joinedPlayers.map(player => player.team_id)).size,
    [joinedPlayers]
  );
  const allTeamsHavePlayers = useMemo(
    () => expectedTeamCount > 0 && joinedTeamCount >= expectedTeamCount,
    [expectedTeamCount, joinedTeamCount]
  );

  useEffect(() => {
    if (!gameId) return;
    const persistedQuestions = (gameState?.round_data as any)?.generated_questions;
    if (!persistedQuestions) return;
    if (Object.keys(generatedQuestions || {}).length > 0) return;
    setGeneratedQuestions(persistedQuestions);
  }, [gameId, gameState, generatedQuestions]);

  const handleCreateOnlineGame = async (
    newTeams: Team[],
    newDifficulty: Difficulty,
    rounds: RoundType[],
    hostPin: string
  ) => {
    const gameResponse = await createGame({
      teams: newTeams.map(team => ({ name: team.name, color: team.color })),
      difficulty: newDifficulty,
      rounds,
      host_pin: hostPin,
    });
    setTeams(gameResponse.teams.map(mapTeamDto));
    setGameId(gameResponse.game.id);
    setGameCode(gameResponse.game.code);
  };

  const handleStartSetup = async (
    newTeams: Team[],
    newDifficulty: Difficulty,
    rounds: RoundType[],
    settings: RoundSettings
  ) => {
    const manualPlayerCount = newTeams.reduce(
      (sum, team) => sum + team.players.filter(name => name.trim()).length,
      0
    );
    const computedPlayerCount =
      setupMode === 'manual'
        ? manualPlayerCount
        : joinedPlayers.length > 0
          ? joinedPlayers.length
          : newTeams.length;
    const settingsWithCounts: RoundSettings = {
      ...settings,
      blindDrawWordCount: computedPlayerCount > 0 ? computedPlayerCount * 2 : settings.blindDrawWordCount,
    };

    setTeams(newTeams);
    setDifficulty(newDifficulty);
    setSelectedRounds(rounds);
    setRoundSettings(settingsWithCounts);

    if (setupMode === 'online' && gameId) {
      updateGameState(gameId, {
        round_data: {
          game_setup: {
            rounds,
            round_settings: settingsWithCounts,
            difficulty: newDifficulty,
          },
        },
      }).catch(() => undefined);
    }

    setLoadingQuestions(true);
    try {
      const questions = await generateQuestions({ rounds, roundSettings: settingsWithCounts });
      setGeneratedQuestions(questions);
      setSetupStep('review');
      if (setupMode === 'online' && gameId) {
        await updateGameState(gameId, {
          round_data: {
            generated_questions: questions,
            game_setup: {
              rounds,
              round_settings: settingsWithCounts,
              difficulty: newDifficulty,
              setup_step: 'review',
            },
          },
        });
      }
    } catch (error) {
      console.error(error);
      alert('Failed to generate questions from the LLM. Check backend config and try again.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleConfirmQuestions = async (questions: GeneratedQuestions) => {
    setGeneratedQuestions(questions);
    try {
      if (setupMode === 'online' && !allTeamsHavePlayers) {
        alert('Each team must have at least one player before starting the game.');
        return;
      }
      if (gameId) {
        await updateGameState(gameId, {
          round_data: {
            generated_questions: questions,
            game_setup: {
              rounds: selectedRounds,
              round_settings: roundSettings,
              difficulty,
            },
          },
        });
      }
      setSetupStep('game');
    } catch (error) {
      console.error(error);
      alert('Failed to create game. Please check the backend and try again.');
    }
  };

  const handleBackToSetup = () => {
    setSetupStep('config');
  };

  const handleReset = () => {
    setSetupStep('config');
    setTeams([]);
    setSelectedRounds([]);
    setRoundSettings({});
    setGeneratedQuestions({});
    setGameId(null);
    setGameCode(null);
    setSetupMode('manual');
    setMode('select');
    setHostEntry('menu');
  };

  const handleLocalScoreUpdate = (teamId: string, points: number) => {
    setTeams(prev =>
      prev.map(team =>
        team.id === teamId ? { ...team, score: team.score + points } : team
      )
    );
  };

  useEffect(() => {
    if (!gameId || setupMode !== 'online') return;
    updateGameState(gameId, {
      round_data: {
        game_setup: {
          setup_step: setupStep,
        },
      },
    }).catch(() => undefined);
  }, [gameId, setupMode, setupStep]);

  // Mode selection screen
  if (mode === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-4xl w-full">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-4 flex items-center justify-center gap-3 whitespace-nowrap">
              <img
                src="/favicon.svg"
                alt="Teams icon"
                className="h-8 w-8 sm:h-12 sm:w-12"
              />
              <span>Game Show</span>
            </h1>
            <p className="text-2xl text-blue-100">Choose your mode</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setMode('host');
                setHostEntry('menu');
              }}
              className="bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-5 sm:p-8 hover:bg-white/20 transition-all group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-blue-500/30 transition-colors">
                  <Monitor className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-3">Host Mode</h2>
                <p className="text-blue-100 mb-3 sm:mb-4 text-sm sm:text-base">
                  Control the game, manage rounds, and display questions on the main screen
                </p>
                <div className="text-xs sm:text-sm text-blue-200 bg-blue-500/20 px-3 py-2 rounded-full">
                  For game host / presenter
                </div>
              </div>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('player')}
              className="bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-5 sm:p-8 hover:bg-white/20 transition-all group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-green-500/30 transition-colors">
                  <Users className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-3">Player Mode</h2>
                <p className="text-blue-100 mb-3 sm:mb-4 text-sm sm:text-base">
                  Join a game with a code, see questions, and buzz in to answer
                </p>
                <div className="text-xs sm:text-sm text-blue-200 bg-green-500/20 px-3 py-2 rounded-full">
                  For game participants
                </div>
              </div>
            </motion.button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center"
          >
            <p className="text-blue-200 text-sm">
              💡 <strong>Tip:</strong> Open Host Mode on the main screen and Player Mode on mobile devices
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Player mode
  if (mode === 'player') {
    return <PlayerMode />;
  }

  // Host mode
  if (mode === 'host' && hostEntry === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-4xl w-full">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6 sm:mb-12"
          >
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-3">Host Mode</h1>
            <p className="text-base sm:text-xl text-blue-100">Start a new game or rejoin with a code</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setHostEntry('new')}
              className="bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-5 sm:p-8 hover:bg-white/20 transition-all group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 sm:w-20 sm:h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-blue-500/30 transition-colors">
                  <Monitor className="h-7 w-7 sm:h-10 sm:w-10 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Start New Game</h2>
                <p className="text-blue-100 text-sm sm:text-base">
                  Create a new game and generate a code for players to join
                </p>
              </div>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setHostEntry('join')}
              className="bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-5 sm:p-8 hover:bg-white/20 transition-all group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 sm:w-20 sm:h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-green-500/30 transition-colors">
                  <Users className="h-7 w-7 sm:h-10 sm:w-10 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Rejoin Host</h2>
                <p className="text-blue-100 text-sm sm:text-base">
                  Resume hosting a live game by entering the game code
                </p>
              </div>
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'host' && hostEntry === 'join') {
    return (
      <HostJoin
        onBack={() => setHostEntry('menu')}
        onJoin={(payload) => {
          setSetupMode('online');
          setTeams(payload.teams);
          setSelectedRounds(payload.rounds);
          setRoundSettings(payload.roundSettings);
          if (payload.difficulty) {
            setDifficulty(payload.difficulty as Difficulty);
          }
          setGeneratedQuestions(payload.generatedQuestions);
          setGameId(payload.gameId);
          setGameCode(payload.gameCode);
          if (payload.setupStep) {
            setSetupStep(payload.setupStep);
          } else if (payload.status === 'in_progress' || payload.status === 'completed') {
            setSetupStep('game');
          } else if (Object.keys(payload.generatedQuestions || {}).length > 0) {
            setSetupStep('review');
          } else {
            setSetupStep('config');
          }
          setHostEntry('new');
        }}
      />
    );
  }

  if (loadingQuestions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full space-y-6">
          <div className="text-center text-white text-2xl font-bold">
            Generating questions...
          </div>
          {setupMode === 'online' && gameId && (
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardContent className="pt-6 space-y-4">
                <div className="text-center text-white text-lg font-semibold">
                  Live Lobby
                </div>
                {gameCode && (
                  <div className="text-center">
                    <div className="text-xs uppercase tracking-wide text-blue-200">Game Code</div>
                    <div className="text-2xl font-bold tracking-widest text-white">
                      {formatGameCode(gameCode)}
                    </div>
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  {displayTeams.map(team => {
                    const teamPlayers = syncedPlayers.filter(player => player.team_id === team.id);
                    return (
                      <div
                        key={team.id}
                        className="border rounded-lg p-4 text-white"
                        style={{ borderLeft: `4px solid ${team.color}` }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold">{team.name}</div>
                          <div className="text-xs text-blue-200">{teamPlayers.length} joined</div>
                        </div>
                        {teamPlayers.length === 0 ? (
                          <div className="text-sm text-blue-200">No players yet</div>
                        ) : (
                          <div className="space-y-1">
                            {teamPlayers.map(player => (
                              <div key={player.id} className="flex items-center justify-between text-sm">
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
          )}
        </div>
      </div>
    );
  }
  if (setupStep === 'config') {
    return (
      <GameSetup
        mode={setupMode}
        gameId={gameId}
        gameCode={gameCode}
        onModeChange={setSetupMode}
        onCreateOnlineGame={handleCreateOnlineGame}
        onStartGame={handleStartSetup}
      />
    );
  }

  if (setupStep === 'review') {
    return (
      <QuestionReview 
        questions={generatedQuestions} 
        rounds={selectedRounds}
        roundSettings={roundSettings}
        gameId={setupMode === 'online' ? gameId : null}
        gameCode={setupMode === 'online' ? gameCode : null}
        canStart={setupMode !== 'online' || allTeamsHavePlayers}
        startDisabledMessage="Each team needs at least one player before starting."
        onConfirm={handleConfirmQuestions} 
        onBack={handleBackToSetup} 
      />
    );
  }

  return (
    <GameController
      teams={teams}
      rounds={selectedRounds}
      difficulty={difficulty}
      roundSettings={roundSettings}
      generatedQuestions={generatedQuestions}
      gameId={gameId}
      gameCode={gameCode}
      onReset={handleReset}
      onUpdateLocalScore={handleLocalScoreUpdate}
    />
  );
}