import { useEffect, useMemo, useRef, useState } from 'react';
import { Team, GuessNumberState } from '@/app/types/game';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Timer } from '@/app/components/Timer';
import { getRandomGuessQuestion } from '@/app/data/questions';
import { Target, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import { updateGameState } from '@/services/gameService';
import { useGameSync } from '@/hooks/useGameSync';

interface GuessNumberProps {
  teams: Team[];
  onUpdateScore: (teamId: string, points: number) => void;
  onComplete: () => void;
  gameId?: string | null;
  questions?: Array<{ question: string; answer: number }>;
  durationSeconds?: number;
}

export function GuessNumber({
  teams,
  onUpdateScore,
  onComplete,
  gameId,
  questions,
  durationSeconds,
}: GuessNumberProps) {
  const { gameState } = useGameSync(gameId);
  const roundSeconds = Math.max(durationSeconds || 30, 1);
  const [state, setState] = useState<GuessNumberState>({
    question: null,
    correctAnswer: null,
    isActive: false,
    timeRemaining: roundSeconds,
  });
  const [revealed, setRevealed] = useState(false);
  const [manualWinnerTeamId, setManualWinnerTeamId] = useState<string | null>(null);
  const [results, setResults] = useState<
    Array<{
      teamId: string;
      teamName: string;
      closestGuess: number;
      difference: number;
      playerName: string;
      winnerPlayers: Array<{ playerName: string; guess: number }>;
    }>
  >([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [questionId, setQuestionId] = useState(0);
  const questionIdRef = useRef(0);
  const totalQuestions = questions && questions.length ? questions.length : 10;

  const currentPlayerGuesses = useMemo(() => {
    const roundData = (gameState?.round_data as any) || {};
    const guesses = roundData.guess_number?.player_guesses || {};
    const drafts = roundData.guess_number?.player_drafts || {};
    if (revealed) {
      return guesses?.[questionId] || {};
    }
    if (guesses?.[questionId] && Object.keys(guesses[questionId]).length > 0) {
      return guesses[questionId];
    }
    return drafts?.[questionId] || {};
  }, [gameState, questionId]);

  const guessesByTeam = useMemo(() => {
    const grouped: Record<string, Array<{ playerName: string; guess: number }>> = {};
    teams.forEach(team => {
      grouped[team.id] = [];
    });
    Object.values(currentPlayerGuesses).forEach((entry: any) => {
      if (!entry || !entry.team_id) return;
      const guessValue = Number(entry.guess);
      if (Number.isNaN(guessValue)) return;
      if (!grouped[entry.team_id]) grouped[entry.team_id] = [];
      grouped[entry.team_id].push({ playerName: entry.player_name || 'Player', guess: guessValue });
    });
    return grouped;
  }, [currentPlayerGuesses, teams]);

  useEffect(() => {
    if (!gameId) return;
    const isTie = revealed && results.length >= 2 && results[0].difference === results[1].difference;
    const roundData = {
      ...(gameState?.round_data || {}),
      guess_number: {
        prompt: state.question,
        range: null,
        question_index: questionsAsked + 1,
        total_questions: totalQuestions,
        question_id: questionId,
        revealed,
        correct_answer: revealed ? state.correctAnswer : null,
        team_results: revealed ? results.map(result => ({
          team_id: result.teamId,
          closest_guess: result.closestGuess,
          difference: result.difference,
          player_name: result.playerName,
          winner_players: result.winnerPlayers,
        })) : [],
        winner_team_id: revealed && !isTie ? results[0]?.teamId || null : null,
        tie: isTie,
        time_remaining: state.timeRemaining,
        total_time: roundSeconds,
      },
    };
    updateGameState(gameId, {
      round_data: roundData,
    }).catch(() => undefined);
  }, [gameId, gameState, state.question, state.correctAnswer, state.timeRemaining, roundSeconds, questionId, revealed, results]);

  useEffect(() => {
    if (!state.isActive) return;
    const interval = window.setInterval(() => {
      setState(prev => {
        if (!prev.isActive) return prev;
        const next = Math.max(prev.timeRemaining - 1, 0);
        return next === 0 ? { ...prev, timeRemaining: 0, isActive: false } : { ...prev, timeRemaining: next };
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [state.isActive]);

  const startRound = () => {
    const nextQuestion =
      questions && questions.length
        ? questions[questionIndex % questions.length]
        : getRandomGuessQuestion();
    questionIdRef.current += 1;
    setQuestionId(questionIdRef.current);
    setState({
      question: nextQuestion.question,
      correctAnswer: nextQuestion.answer,
      isActive: true,
      timeRemaining: roundSeconds,
    });
    setRevealed(false);
    setResults([]);
    setManualWinnerTeamId(null);
    setQuestionIndex(prev => prev + 1);
  };

  const handleTimeUp = () => {
    setState(prev => ({
      ...prev,
      isActive: false,
      timeRemaining: 0,
    }));
  };

  const revealAnswer = () => {
    if (!state.correctAnswer) return;

    const calculated = teams.map(team => {
      const guesses = guessesByTeam[team.id] || [];
      if (!guesses.length) return null;
      const scored = guesses.map(entry => ({
        playerName: entry.playerName,
        guess: entry.guess,
        difference: Math.abs(state.correctAnswer! - entry.guess),
      }));
      scored.sort((a, b) => a.difference - b.difference);
      const best = scored[0];
      if (!best) return null;
      const winnerPlayers = scored
        .filter(item => item.difference === best.difference)
        .map(item => ({ playerName: item.playerName, guess: item.guess }));
      return {
        teamId: team.id,
        teamName: team.name,
        closestGuess: best.guess,
        difference: best.difference,
        playerName: best.playerName,
        winnerPlayers,
      };
    }).filter(Boolean) as Array<{
      teamId: string;
      teamName: string;
      closestGuess: number;
      difference: number;
      playerName: string;
      winnerPlayers: Array<{ playerName: string; guess: number }>;
    }>;

    calculated.sort((a, b) => a.difference - b.difference);

    setResults(calculated);
    setRevealed(true);
    setQuestionsAsked(prev => prev + 1);

    const isTie = calculated.length >= 2 && calculated[0].difference === calculated[1].difference;
    if (calculated.length >= 1 && !isTie && gameId) {
      onUpdateScore(calculated[0].teamId, 200);
    }
  };

  useEffect(() => {
    if (!revealed && state.timeRemaining === 0) {
      revealAnswer();
    }
  }, [revealed, state.timeRemaining, revealAnswer]);

  useEffect(() => {
    startRound();
  }, []);

  const handleManualWinnerSelect = (teamId: string) => {
    if (manualWinnerTeamId) return;
    setManualWinnerTeamId(teamId);
    onUpdateScore(teamId, 200);
    setState(prev => ({
      ...prev,
      isActive: false,
      timeRemaining: 0,
    }));
    setRevealed(true);
    setQuestionsAsked(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">🎯 Guess the Number</h2>
        <p className="text-blue-200">
          Question {Math.min(questionsAsked + 1, totalQuestions)} of {totalQuestions}
        </p>
      </div>

      {state.question && !revealed && (
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="pt-6">
              <Target className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <div className="text-2xl text-white text-center mb-6">
                {state.question}
              </div>

              {/* Host Answer - Always Visible */}
              <div className="bg-blue-500/20 border-2 border-blue-400 rounded-lg p-4 mb-6">
                <p className="text-white text-center text-lg font-semibold">
                  {state.correctAnswer?.toLocaleString()}
                </p>
              </div>

              {state.isActive && (
                <div className="flex justify-center mb-6">
                  <Timer
                    seconds={roundSeconds}
                    value={state.timeRemaining}
                    onComplete={handleTimeUp}
                    running={true}
                    size="md"
                  />
                </div>
              )}

              <div className="space-y-4">
                {teams.map(team => {
                  const teamGuesses = guessesByTeam[team.id] || [];
                  return (
                    <div
                      key={team.id}
                      className="flex items-center gap-4 p-4 rounded-lg"
                      style={{ backgroundColor: `${team.color}20`, borderLeft: `4px solid ${team.color}` }}
                    >
                      <div className="flex-1">
                        <div className="text-white font-medium mb-1">{team.name}</div>
                        <div className="text-blue-200 text-sm">
                          {teamGuesses.length === 0
                            ? 'No guesses yet'
                            : `${teamGuesses.length} guess${teamGuesses.length === 1 ? '' : 'es'} submitted`}
                        </div>
                        {teamGuesses.length > 0 && (
                          <div className="mt-2 text-white/80 text-sm space-y-1">
                            {teamGuesses.map((guess, index) => (
                              <div key={`${guess.playerName}-${index}`}>
                                {guess.playerName}: {guess.guess}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {!gameId && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-white mb-3 text-center">Pick a Winner (Manual)</h3>
                  <div className="flex flex-wrap justify-center gap-3">
                    {teams.map(team => (
                      <Button
                        key={team.id}
                        onClick={() => handleManualWinnerSelect(team.id)}
                        size="lg"
                        disabled={!!manualWinnerTeamId}
                        className="text-white"
                        style={{ backgroundColor: team.color }}
                      >
                        Award 200 to {team.name}
                      </Button>
                    ))}
                  </div>
                  {manualWinnerTeamId && (
                    <p className="text-center text-green-300 mt-3">
                      Winner selected.
                    </p>
                  )}
                </div>
              )}

              {!revealed && !state.isActive && (
                <div className="mt-6 text-center text-blue-200">
                  Time is up! Calculating closest guesses…
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {revealed && state.correctAnswer && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-3xl mx-auto space-y-6"
        >
          <Card className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border-green-500/50">
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <div className="text-lg text-green-300 mb-2">Correct Answer</div>
                <div className="text-6xl font-bold text-white">
                  {state.correctAnswer.toLocaleString()}
                </div>
              </div>
              {results.length > 0 && (
                <div className="text-center text-white">
                  {manualWinnerTeamId ? (
                    <div className="text-green-300 font-semibold">
                      Winner: {teams.find(team => team.id === manualWinnerTeamId)?.name}
                    </div>
                  ) : results.length >= 2 && results[0].difference === results[1].difference ? (
                    <div className="text-yellow-300 font-semibold">It's a tie!</div>
                  ) : (
                    <div className="text-green-300 font-semibold">
                      Winner: {results[0].teamName}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {!gameId && (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold text-white mb-4 text-center">Pick a Winner</h3>
                <div className="flex flex-wrap justify-center gap-3">
                  {teams.map(team => (
                    <Button
                      key={team.id}
                      onClick={() => handleManualWinnerSelect(team.id)}
                      size="lg"
                      disabled={!!manualWinnerTeamId}
                      className="text-white"
                      style={{ backgroundColor: team.color }}
                    >
                      Award 200 to {team.name}
                    </Button>
                  ))}
                </div>
                {manualWinnerTeamId && (
                  <p className="text-center text-green-300 mt-4">
                    Winner selected.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="pt-6">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">Results</h3>
              <div className="space-y-3">
                {results.map((result, index) => {
                  const team = teams.find(t => t.id === result.teamId);
                  const isTie = results.length >= 2 && results[0].difference === results[1].difference;
                  const points = manualWinnerTeamId
                    ? result.teamId === manualWinnerTeamId
                      ? 200
                      : 0
                    : !isTie && index === 0
                      ? 200
                      : 0;
                  
                  return (
                    <motion.div
                      key={result.teamId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.2 }}
                      className="flex items-center gap-4 p-4 rounded-lg"
                      style={{ backgroundColor: `${team?.color}20`, borderLeft: `4px solid ${team?.color}` }}
                    >
                      <div className="text-3xl font-bold text-white/50 w-12">
                        #{index + 1}
                      </div>
                      {(isTie || index === 0) && <Trophy className="h-6 w-6 text-yellow-400" />}
                      <div className="flex-1">
                        <div className="text-white font-bold text-lg">{team?.name}</div>
                        {result.winnerPlayers.length > 1 ? (
                          <div className="text-white/70 text-sm">
                            Closest guesses:{' '}
                            {result.winnerPlayers.map(player =>
                              `${player.playerName} (${player.guess.toLocaleString()})`
                            ).join(', ')}{' '}
                            (off by {result.difference.toLocaleString()})
                          </div>
                        ) : (
                          <div className="text-white/70 text-sm">
                            Closest guess: {result.closestGuess.toLocaleString()} by {result.playerName}{' '}
                            (off by {result.difference.toLocaleString()})
                          </div>
                        )}
                      </div>
                      {points > 0 && (
                        <div className="text-2xl font-bold text-green-400">
                          +{points}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-8 flex justify-center">
                {questionsAsked < totalQuestions ? (
                  <Button onClick={startRound} size="lg">
                    Next Question
                  </Button>
                ) : (
                  <Button onClick={onComplete} size="lg">
                    Next Round
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}