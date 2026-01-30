import { useState, useEffect } from 'react';
import { Team, TriviaBuzzState, Difficulty, Question } from '@/app/types/game';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Timer } from '@/app/components/Timer';
import { getRandomQuestion, triviaQuestions } from '@/app/data/questions';
import { Zap, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { updateGameState } from '@/services/gameService';
import { useGameSync } from '@/hooks/useGameSync';

interface TriviaBuzzProps {
  teams: Team[];
  difficulty: Difficulty;
  onUpdateScore: (teamId: string, points: number) => void;
  onComplete: () => void;
  gameId?: string | null;
  questions?: Question[];
}

export function TriviaBuzz({
  teams,
  difficulty,
  onUpdateScore,
  onComplete,
  gameId,
  questions,
}: TriviaBuzzProps) {
  const { gameState, players } = useGameSync(gameId);
  const [state, setState] = useState<TriviaBuzzState>({
    currentQuestion: null,
    buzzedTeam: null,
    buzzLockoutUntil: null,
    questionActive: false,
    stealAvailable: false,
    answerTimer: null,
  });
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [incorrectTeam, setIncorrectTeam] = useState<string | null>(null);
  const totalQuestions = questions && questions.length ? questions.length : 10;

  const loadNextQuestion = (indexOverride?: number) => {
    const nextIndex = indexOverride ?? questionsAsked;
    const nextQuestion =
      questions && questions.length > nextIndex
        ? questions[nextIndex]
        : getRandomQuestion(triviaQuestions, difficulty);
    setState({
      currentQuestion: nextQuestion,
      buzzedTeam: null,
      buzzLockoutUntil: null,
      questionActive: true,
      stealAvailable: false,
      answerTimer: null,
    });
    setShowAnswer(false);
    setIncorrectTeam(null);
    if (gameId) {
      const roundData = {
        ...(gameState?.round_data || {}),
        trivia: {
          answer: nextQuestion.answer,
          show_answer: false,
          buzzed_player_id: null,
          buzzed_player_name: null,
          incorrect_team_id: null,
        },
      };
      updateGameState(gameId, {
        current_question: nextQuestion.text,
        current_category: nextQuestion.category || null,
        current_points: 100,
        can_buzz: true,
        buzzed_team_id: null,
        time_remaining: null,
        round_data: roundData,
      }).catch(() => undefined);
    }
  };

  const handleBuzz = (teamId: string) => {
    if (!state.questionActive || state.buzzedTeam) return;
    if (state.buzzLockoutUntil && Date.now() < state.buzzLockoutUntil) return;

    setState(prev => ({
      ...prev,
      buzzedTeam: teamId,
      answerTimer: 5,
    }));
    if (gameId) {
      const roundData = {
        ...(gameState?.round_data || {}),
        trivia: {
          ...(gameState?.round_data as any)?.trivia,
          buzzed_player_id: null,
          buzzed_player_name: null,
          incorrect_team_id: null,
        },
      };
      updateGameState(gameId, {
        can_buzz: false,
        buzzed_team_id: teamId,
        time_remaining: 5,
        round_data: roundData,
      }).catch(() => undefined);
    }
  };

  const handleCorrect = () => {
    if (!state.buzzedTeam) return;
    
    onUpdateScore(state.buzzedTeam, 100);
    setShowAnswer(true);
    setState(prev => ({
      ...prev,
      questionActive: false,
      answerTimer: null,
    }));
    setQuestionsAsked(prev => prev + 1);
    if (gameId) {
      const roundData = {
        ...(gameState?.round_data || {}),
        trivia: {
          answer: state.currentQuestion?.answer,
          show_answer: true,
          incorrect_team_id: null,
        },
      };
      updateGameState(gameId, {
        can_buzz: false,
        time_remaining: null,
        round_data: roundData,
      }).catch(() => undefined);
    }
  };

  const handleIncorrect = () => {
    if (!state.buzzedTeam) return;
    
    onUpdateScore(state.buzzedTeam, -50);
    setIncorrectTeam(state.buzzedTeam);
    
    // Enable steal opportunity
    setState(prev => ({
      ...prev,
      stealAvailable: true,
      buzzedTeam: null,
      buzzLockoutUntil: Date.now() + 2000, // 2 second lockout
      answerTimer: null,
    }));
    if (gameId) {
      const roundData = {
        ...(gameState?.round_data || {}),
        trivia: {
          ...(gameState?.round_data as any)?.trivia,
          incorrect_team_id: state.buzzedTeam,
        },
      };
      updateGameState(gameId, {
        can_buzz: true,
        buzzed_team_id: null,
        time_remaining: null,
        round_data: roundData,
      }).catch(() => undefined);
    }
  };

  const handleSteal = (teamId: string) => {
    if (!state.stealAvailable) return;
    if (!incorrectTeam || teamId === incorrectTeam) return;
    
    setState(prev => ({
      ...prev,
      buzzedTeam: teamId,
      stealAvailable: false,
      answerTimer: 5,
    }));
    if (gameId) {
      const roundData = {
        ...(gameState?.round_data || {}),
        trivia: {
          ...(gameState?.round_data as any)?.trivia,
          incorrect_team_id: null,
          show_answer: false,
        },
      };
      updateGameState(gameId, {
        can_buzz: false,
        buzzed_team_id: teamId,
        time_remaining: 5,
        round_data: roundData,
      }).catch(() => undefined);
    }
  };

  const handleStealCorrect = () => {
    if (!state.buzzedTeam) return;
    
    onUpdateScore(state.buzzedTeam, 100);
    setShowAnswer(true);
    setState(prev => ({
      ...prev,
      questionActive: false,
      answerTimer: null,
    }));
    setQuestionsAsked(prev => prev + 1);
    if (gameId) {
      const roundData = {
        ...(gameState?.round_data || {}),
        trivia: {
          answer: state.currentQuestion?.answer,
          show_answer: true,
          incorrect_team_id: null,
        },
      };
      updateGameState(gameId, {
        can_buzz: false,
        time_remaining: null,
        round_data: roundData,
      }).catch(() => undefined);
    }
  };

  const handleStealIncorrect = () => {
    if (!state.buzzedTeam) return;
    
    // Penalty for incorrect steal
    onUpdateScore(state.buzzedTeam, -50);
    setShowAnswer(true);
    setState(prev => ({
      ...prev,
      questionActive: false,
      stealAvailable: false,
      answerTimer: null,
    }));
    setQuestionsAsked(prev => prev + 1);
    if (gameId) {
      const roundData = {
        ...(gameState?.round_data || {}),
        trivia: {
          answer: state.currentQuestion?.answer,
          show_answer: true,
          incorrect_team_id: state.buzzedTeam,
        },
      };
      updateGameState(gameId, {
        can_buzz: false,
        time_remaining: null,
        round_data: roundData,
      }).catch(() => undefined);
    }
  };

  const handleSkip = () => {
    const nextIndex = questionsAsked + 1;
    setQuestionsAsked(nextIndex);
    loadNextQuestion(nextIndex);
  };

  useEffect(() => {
    if (state.answerTimer === null || state.answerTimer === 0) return;
    const interval = window.setInterval(() => {
      setState(prev => {
        if (prev.answerTimer === null || prev.answerTimer === 0) return prev;
        const next = Math.max(prev.answerTimer - 1, 0);
        return { ...prev, answerTimer: next };
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [state.answerTimer]);

  useEffect(() => {
    if (!gameId) return;
    updateGameState(gameId, {
      time_remaining: state.answerTimer ?? null,
      round_data: {
        trivia: {
          answer_timer: state.answerTimer ?? null,
        },
      },
    }).catch(() => undefined);
  }, [gameId, state.answerTimer]);

  useEffect(() => {
    loadNextQuestion();
  }, []);

  useEffect(() => {
    if (!gameState) return;
    if (
      gameState.current_question &&
      state.currentQuestion?.text &&
      gameState.current_question !== state.currentQuestion.text
    ) {
      return;
    }
    if (gameState.buzzed_team_id && gameState.buzzed_team_id !== state.buzzedTeam) {
      setState(prev => ({
        ...prev,
        buzzedTeam: gameState.buzzed_team_id,
        answerTimer: 5,
      }));
    }
  }, [gameState, state.buzzedTeam, state.currentQuestion]);

  const buzzedPlayerId = (gameState?.round_data as any)?.trivia?.buzzed_player_id || null;
  const teamPlayers = state.buzzedTeam
    ? players.filter(player => player.team_id === state.buzzedTeam && player.connected)
    : [];
  const buzzedPlayerName =
    (gameState?.round_data as any)?.trivia?.buzzed_player_name ||
    players.find(player => player.id === buzzedPlayerId)?.name ||
    (teamPlayers.length === 1 ? teamPlayers[0].name : null) ||
    null;
  const buzzedTeamData = teams.find(t => t.id === state.buzzedTeam);
  const stealTeam = teams.find(t => t.id !== incorrectTeam);

  if (questionsAsked >= totalQuestions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-4xl font-bold text-white mb-4">Round Complete!</h2>
        <p className="text-xl text-blue-200 mb-8">{totalQuestions} trivia questions answered</p>
        <Button onClick={onComplete} size="lg">
          Next Round
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Trivia Buzz</h2>
        <p className="text-blue-200 text-sm sm:text-base">Question {questionsAsked + 1} of {totalQuestions}</p>
      </div>

      {state.currentQuestion && (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="pt-6">
            <div className="text-2xl text-white text-center mb-6 min-h-[100px] flex items-center justify-center">
              {state.currentQuestion.text}
            </div>

            {/* Host Answer - Always Visible */}
            <div className="bg-blue-500/20 border-2 border-blue-400 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <p className="text-white text-center text-base sm:text-lg font-semibold">
                {state.currentQuestion.answer}
              </p>
            </div>

            <AnimatePresence>
              {state.buzzedTeam && state.answerTimer && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center gap-4 mb-6"
                >
                  <div
                    className="text-xl font-bold px-6 py-3 rounded-full"
                    style={{ backgroundColor: buzzedTeamData?.color }}
                  >
                    {buzzedTeamData?.name}
                    {buzzedPlayerName ? ` (${buzzedPlayerName})` : ''} buzzed in!
                  </div>
                  <Timer seconds={state.answerTimer} size="sm" running={true} />
                </motion.div>
              )}
            </AnimatePresence>

            {!state.buzzedTeam && !state.stealAvailable && state.questionActive && (
              <div className="space-y-4">
                {gameId && (
                  <p className="text-center text-blue-200 text-sm">
                    Waiting for players to buzz
                  </p>
                )}
                {!gameId && (
                  <div className="grid grid-cols-2 gap-4">
                    {teams.map(team => (
                      <Button
                        key={team.id}
                        onClick={() => handleBuzz(team.id)}
                        size="lg"
                        style={{ backgroundColor: team.color }}
                        className="h-20 text-sm sm:text-xl"
                      >
                        <span className="flex flex-col items-center justify-center w-full leading-tight">
                          <span className="text-center">{team.name}</span>
                          <span className="flex items-center gap-1 text-[10px] sm:text-base uppercase tracking-wide">
                            <Zap className="h-3.5 w-3.5 sm:h-5 sm:w-5 shrink-0" />
                            Buzz
                          </span>
                        </span>
                      </Button>
                    ))}
                  </div>
                )}
                <Button
                  onClick={handleSkip}
                  size="lg"
                  variant="outline"
                  className="w-full"
                >
                  Skip Question
                </Button>
              </div>
            )}

            {state.buzzedTeam && !state.stealAvailable && !showAnswer && (
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={handleCorrect}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="mr-2 h-5 w-5" />
                  Correct (+100)
                </Button>
                <Button
                  onClick={handleIncorrect}
                  size="lg"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <X className="mr-2 h-5 w-5" />
                  Incorrect (-50)
                </Button>
              </div>
            )}

            {state.stealAvailable && (
              <div className="space-y-4">
                <p className="text-center text-yellow-400 font-bold text-xl">
                  Steal Opportunity for {stealTeam?.name}!
                </p>
                {!state.buzzedTeam && (
                  <div className="flex gap-4 justify-center">
                    {gameId && (
                      <p className="text-center text-blue-200 text-sm self-center">
                        Waiting for players to buzz
                      </p>
                    )}
                    {!gameId && (
                      <Button
                        onClick={() => handleSteal(stealTeam!.id)}
                        size="lg"
                        style={{ backgroundColor: stealTeam?.color }}
                        className="h-16"
                      >
                        {stealTeam?.name} Steal
                      </Button>
                    )}
                    <Button
                      onClick={handleSkip}
                      size="lg"
                      variant="outline"
                      className="h-16"
                    >
                      Skip Question
                    </Button>
                  </div>
                )}
                {state.buzzedTeam && (
                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={handleStealCorrect}
                      size="lg"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="mr-2 h-5 w-5" />
                      Correct (+100)
                    </Button>
                    <Button
                      onClick={handleStealIncorrect}
                      size="lg"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <X className="mr-2 h-5 w-5" />
                      Incorrect (-50)
                    </Button>
                  </div>
                )}
              </div>
            )}

            {showAnswer && (
              <div className="flex justify-center mt-4">
                <Button onClick={loadNextQuestion} size="lg">
                  Next Question
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}