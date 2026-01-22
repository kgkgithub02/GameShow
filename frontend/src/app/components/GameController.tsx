import { RoundInstructions } from '@/app/components/RoundInstructions';
import { TriviaBuzz } from '@/app/components/rounds/TriviaBuzz';
import { LightningRound } from '@/app/components/rounds/LightningRound';
import { QuickBuild } from '@/app/components/rounds/QuickBuild';
import { Connect4 } from '@/app/components/rounds/Connect4';
import { GuessNumber } from '@/app/components/rounds/GuessNumber';
import { BlindDraw } from '@/app/components/rounds/BlindDraw';
import { Scoreboard } from '@/app/components/Scoreboard';
import { HostGameCode } from '@/app/components/player/HostGameCode';
import { Team, Difficulty, RoundType, RoundSettings } from '@/app/types/game';
import { GeneratedQuestions } from '@/app/utils/questionGenerator';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { SkipForward, RotateCcw, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameSync } from '@/hooks/useGameSync';
import { updateGame, updateGameState, updateTeamScore } from '@/services/gameService';

interface GameControllerProps {
  teams: Team[];
  rounds: RoundType[];
  difficulty: Difficulty;
  roundSettings: RoundSettings;
  generatedQuestions: GeneratedQuestions;
  gameId: string | null;
  gameCode: string | null;
  onReset: () => void;
}

const ROUND_NAMES: Record<RoundType, string> = {
  'trivia-buzz': 'Trivia Buzz',
  'lightning': 'Lightning Round',
  'quick-build': 'Quick Build',
  'connect-4': 'Connect 4',
  'guess-number': 'Guess the Number',
  'blind-draw': 'Blind Draw',
};

export function GameController({
  teams: initialTeams,
  rounds,
  difficulty,
  roundSettings,
  generatedQuestions,
  gameId,
  gameCode,
  onReset,
}: GameControllerProps) {
  const { teams: syncedTeams, gameState, game } = useGameSync(gameId);
  const teams = useMemo(() => (syncedTeams.length ? syncedTeams : initialTeams), [syncedTeams, initialTeams]);
  const persistedQuestions = (gameState?.round_data as any)?.generated_questions as GeneratedQuestions | undefined;
  const hasLocalQuestions = useMemo(
    () => Object.keys(generatedQuestions || {}).length > 0,
    [generatedQuestions]
  );
  const effectiveQuestions = hasLocalQuestions ? generatedQuestions : persistedQuestions || {};
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true); // Start with instructions
  const [gameComplete, setGameComplete] = useState(false);
  const [showTransition, setShowTransition] = useState(false);

  const updateScore = (teamId: string, points: number) => {
    if (!gameId) return;
    updateTeamScore(teamId, points).catch(() => undefined);
  };

  const nextRound = () => {
    if (currentRoundIndex < rounds.length - 1) {
      setShowTransition(true);
      setTimeout(() => {
        setCurrentRoundIndex(prev => prev + 1);
        setShowInstructions(true); // Show instructions for next round
        setShowTransition(false);
      }, 2000);
    } else {
      setGameComplete(true);
    }
  };

  const skipRound = () => {
    if (currentRoundIndex < rounds.length - 1) {
      setCurrentRoundIndex(prev => prev + 1);
      setShowInstructions(true); // Show instructions for next round
    } else {
      setGameComplete(true);
    }
  };

  const handleStartRound = () => {
    setShowInstructions(false);
  };
  
  const handleSkipRound = () => {
    handleCompleteRound();
  };

  const handleCompleteRound = () => {
    if (currentRoundIndex < rounds.length - 1) {
      setCurrentRoundIndex(prev => prev + 1);
      setShowInstructions(true); // Show instructions for next round
    } else {
      setGameComplete(true);
    }
  };

  const currentRound = rounds[currentRoundIndex];
  const winner = [...teams].sort((a, b) => b.score - a.score)[0];

  useEffect(() => {
    if (!game) return;
    if (typeof game.current_round === 'number' && game.current_round !== currentRoundIndex) {
      setCurrentRoundIndex(game.current_round);
    }
    if (game.status === 'completed') {
      setGameComplete(true);
    }
    const showRules = (gameState?.round_data as any)?.show_rules;
    if (typeof showRules === 'boolean') {
      setShowInstructions(showRules);
    }
  }, [game, gameState, currentRoundIndex]);

  useEffect(() => {
    if (!gameId || !currentRound) return;
    updateGame(gameId, {
      status: gameComplete ? 'completed' : 'in_progress',
      current_round: currentRoundIndex,
      current_round_type: currentRound,
    }).catch(() => undefined);
  }, [gameId, currentRound, currentRoundIndex, gameComplete]);

  useEffect(() => {
    if (!gameId) return;
    const nextRoundType = rounds[currentRoundIndex + 1];
    const nextRoundName = nextRoundType ? ROUND_NAMES[nextRoundType] : null;
    const roundData = {
      ...(gameState?.round_data || {}),
      show_rules: showInstructions,
      show_transition: showTransition,
      next_round_name: showTransition ? nextRoundName : null,
    };
    updateGameState(gameId, {
      round_data: roundData,
    }).catch(() => undefined);
  }, [gameId, showInstructions, showTransition, rounds, currentRoundIndex, gameState]);

  // Show instructions before starting each round
  if (showInstructions) {
    return <RoundInstructions roundType={currentRound} isHost={true} onStart={handleStartRound} onSkip={handleSkipRound} />;
  }

  if (gameComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-4xl mx-auto text-center"
        >
          <Trophy className="h-32 w-32 text-yellow-400 mx-auto mb-8 animate-bounce" />
          <h1 className="text-6xl font-bold text-white mb-4">Game Complete!</h1>
          
          <div
            className="text-5xl font-bold px-12 py-6 rounded-2xl mb-8 inline-block"
            style={{ backgroundColor: winner.color }}
          >
            🎉 {winner.name} Wins! 🎉
          </div>

          <div className="mb-12">
            <Scoreboard teams={teams} />
          </div>

          <div className="flex gap-4 justify-center">
            <Button onClick={onReset} size="lg" className="bg-white text-purple-900 hover:bg-gray-100">
              <RotateCcw className="mr-2 h-5 w-5" />
              New Game
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      {/* Floating Game Code */}
      <HostGameCode gameCode={gameCode || '------'} onSkipRound={skipRound} onReset={onReset} />
      
      <div className="max-w-7xl mx-auto">
        {/* Header with Scoreboard */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white">Game Show</h1>
              <p className="text-blue-200">
                Round {currentRoundIndex + 1} of {rounds.length} • {ROUND_NAMES[currentRound]}
              </p>
            </div>
          </div>
          <Scoreboard teams={teams} compact />
        </div>

        {/* Round Progress */}
        <div className="mb-8">
          <div className="flex gap-2 justify-center">
            {rounds.map((round, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index < currentRoundIndex
                    ? 'bg-green-500 w-12'
                    : index === currentRoundIndex
                    ? 'bg-blue-500 w-16'
                    : 'bg-white/20 w-12'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Round Transition */}
        <AnimatePresence mode="wait">
          {showTransition ? (
            <motion.div
              key="transition"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <div className="text-6xl font-bold text-white mb-4">
                {ROUND_NAMES[rounds[currentRoundIndex + 1]]}
              </div>
              <div className="text-2xl text-blue-200">Get ready!</div>
            </motion.div>
          ) : (
            <motion.div
              key={currentRound}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {currentRound === 'trivia-buzz' && (
                <TriviaBuzz
                  teams={teams}
                  difficulty={difficulty}
                  onUpdateScore={updateScore}
                  onComplete={nextRound}
                  gameId={gameId}
                  questions={effectiveQuestions.triviaBuzz}
                />
              )}
              {currentRound === 'lightning' && (
                <LightningRound
                  teams={teams}
                  difficulty={difficulty}
                  onUpdateScore={updateScore}
                  onComplete={nextRound}
                  gameId={gameId}
                  questions={effectiveQuestions.lightning}
                  durationSeconds={roundSettings.lightningSeconds}
                />
              )}
              {currentRound === 'quick-build' && (
                <QuickBuild
                  teams={teams}
                  onUpdateScore={updateScore}
                  onComplete={nextRound}
                  gameId={gameId}
                  durationSeconds={roundSettings.quickBuildSeconds}
                />
              )}
              {currentRound === 'connect-4' && (
                <Connect4
                  teams={teams}
                  difficulty={difficulty}
                  onUpdateScore={updateScore}
                  onComplete={nextRound}
                  gameId={gameId}
                  questions={effectiveQuestions.connect4}
                />
              )}
              {currentRound === 'guess-number' && (
                <GuessNumber
                  teams={teams}
                  onUpdateScore={updateScore}
                  onComplete={nextRound}
                  gameId={gameId}
                  questions={effectiveQuestions.guessNumber}
                  durationSeconds={roundSettings.guessNumberSeconds}
                />
              )}
              {currentRound === 'blind-draw' && (
                <BlindDraw
                  teams={teams}
                  difficulty={difficulty}
                  onUpdateScore={updateScore}
                  onComplete={nextRound}
                  gameId={gameId}
                  words={effectiveQuestions.blindDraw}
                  durationSeconds={roundSettings.blindDrawSeconds}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}