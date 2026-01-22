import { useState, useEffect, useRef } from 'react';
import { Team, LightningState, Difficulty, Question } from '@/app/types/game';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Timer } from '@/app/components/Timer';
import { getRandomQuestion, lightningQuestions } from '@/app/data/questions';
import { Zap, Check, X, SkipForward } from 'lucide-react';
import { motion } from 'motion/react';
import { updateGameState } from '@/services/gameService';
import { useGameSync } from '@/hooks/useGameSync';

interface LightningRoundProps {
  teams: Team[];
  difficulty: Difficulty;
  onUpdateScore: (teamId: string, points: number) => void;
  onComplete: () => void;
  gameId?: string | null;
  questions?: Question[];
  durationSeconds?: number;
}

export function LightningRound({
  teams,
  difficulty,
  onUpdateScore,
  onComplete,
  gameId,
  questions,
  durationSeconds,
}: LightningRoundProps) {
  const { gameState } = useGameSync(gameId);
  const roundSeconds = Math.max(durationSeconds || 60, 1);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [state, setState] = useState<LightningState>({
    currentTeam: teams[0].id,
    questionsAnswered: 0,
    timeRemaining: roundSeconds,
    currentQuestion: null,
    isActive: false,
    questionIndex: 0,
  });
  const [teamScores, setTeamScores] = useState<Record<string, number>>({});
  const [allTeamsComplete, setAllTeamsComplete] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const totalQuestions = 10;
  const [questionQueue, setQuestionQueue] = useState<Question[]>([]);
  const autoAdvanceRef = useRef(false);

  useEffect(() => {
    if (
      !state.isActive &&
      state.questionsAnswered === 0 &&
      state.timeRemaining > 0 &&
      state.timeRemaining !== roundSeconds
    ) {
      setState(prev => ({ ...prev, timeRemaining: roundSeconds }));
    }
  }, [roundSeconds, state.isActive, state.questionsAnswered, state.timeRemaining]);

  useEffect(() => {
    if (!state.isActive) return;
    const interval = window.setInterval(() => {
      setState(prev => {
        if (!prev.isActive) return prev;
        const next = Math.max(prev.timeRemaining - 1, 0);
        return next === 0
          ? { ...prev, timeRemaining: 0, isActive: false, currentQuestion: null }
          : { ...prev, timeRemaining: next };
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [state.isActive]);

  const buildQuestionQueue = (teamIndex: number) => {
    if (questions && questions.length) {
      const start = teamIndex * totalQuestions;
      const slice = questions.slice(start, start + totalQuestions);
      if (slice.length === totalQuestions) {
        return slice;
      }
    }
    return Array.from({ length: totalQuestions }, () => getRandomQuestion(lightningQuestions));
  };

  const loadQuestionFromQueue = (queue: Question[]) => {
    const nextQuestion = queue[0] || null;
    setState(prev => ({
      ...prev,
      currentQuestion: nextQuestion,
      questionIndex: prev.questionIndex + 1,
    }));
  };

  const startRound = () => {
    autoAdvanceRef.current = false;
    const queue = buildQuestionQueue(currentTeamIndex);
    setQuestionQueue(queue);
    setState(prev => ({
      ...prev,
      isActive: true,
      timeRemaining: roundSeconds,
      questionsAnswered: 0,
    }));
    setCorrectCount(0);
    setIncorrectCount(0);
    loadQuestionFromQueue(queue);
  };

  const handleCorrect = () => {
    if (!state.currentQuestion) return;
    
    const points = 50;
    onUpdateScore(state.currentTeam, points);
    setTeamScores(prev => ({
      ...prev,
      [state.currentTeam]: (prev[state.currentTeam] || 0) + points,
    }));
    setCorrectCount(prev => prev + 1);

    const nextCount = state.questionsAnswered + 1;
    setState(prev => ({
      ...prev,
      questionsAnswered: nextCount,
    }));

    const nextQueue = questionQueue.slice(1);
    setQuestionQueue(nextQueue);
    if (nextCount < totalQuestions) {
      loadQuestionFromQueue(nextQueue);
    } else {
      handleTimeUp();
    }
  };

  const handleIncorrect = () => {
    setIncorrectCount(prev => prev + 1);
    const nextCount = state.questionsAnswered + 1;
    setState(prev => ({
      ...prev,
      questionsAnswered: nextCount,
    }));

    const nextQueue = questionQueue.slice(1);
    setQuestionQueue(nextQueue);
    if (nextCount < totalQuestions) {
      loadQuestionFromQueue(nextQueue);
    } else {
      handleTimeUp();
    }
  };

  const handlePass = () => {
    if (questionQueue.length > 1) {
      const nextQueue = [...questionQueue.slice(1), questionQueue[0]];
      setQuestionQueue(nextQueue);
      loadQuestionFromQueue(nextQueue);
    }
  };

  const handleTimeUp = () => {
    setState(prev => ({
      ...prev,
      isActive: false,
    }));
  };

  const nextTeam = () => {
    if (currentTeamIndex < teams.length - 1) {
      const nextIndex = currentTeamIndex + 1;
      autoAdvanceRef.current = false;
      setCurrentTeamIndex(nextIndex);
      setState({
        currentTeam: teams[nextIndex].id,
        questionsAnswered: 0,
        timeRemaining: roundSeconds,
        currentQuestion: null,
        isActive: false,
        questionIndex: 0,
      });
      setCorrectCount(0);
      setIncorrectCount(0);
      setQuestionQueue([]);
    } else {
      setAllTeamsComplete(true);
    }
  };

  useEffect(() => {
    const roundEnded = state.timeRemaining === 0 || state.questionsAnswered >= totalQuestions;
    if (state.isActive || !roundEnded || allTeamsComplete) return;
    if (autoAdvanceRef.current) return;
    autoAdvanceRef.current = true;
    const timer = window.setTimeout(() => {
      nextTeam();
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [state.isActive, state.timeRemaining, state.questionsAnswered, allTeamsComplete, totalQuestions]);

  useEffect(() => {
    if (!allTeamsComplete) return;
    const timer = window.setTimeout(() => {
      onComplete();
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [allTeamsComplete, onComplete]);

  const currentTeam = teams.find(t => t.id === state.currentTeam);

  useEffect(() => {
    if (!gameId) return;
    const roundComplete =
      !state.isActive && (state.questionsAnswered >= totalQuestions || state.timeRemaining === 0);
    const questionNumber = roundComplete
      ? totalQuestions
      : Math.min(state.questionsAnswered + 1, totalQuestions);
    const roundData = {
      ...(gameState?.round_data || {}),
      lightning: {
        question: roundComplete ? null : state.currentQuestion?.text || null,
        question_number: questionNumber,
        total_questions: totalQuestions,
        time_remaining: state.timeRemaining,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
        points_this_round: correctCount * 50,
        round_complete: roundComplete,
      },
    };
    updateGameState(gameId, {
      current_turn_team_id: state.currentTeam || null,
      round_data: roundData,
    }).catch(() => undefined);
  }, [
    gameId,
    gameState,
    state.currentQuestion,
    state.questionsAnswered,
    state.currentTeam,
    state.isActive,
    state.timeRemaining,
    correctCount,
    incorrectCount,
    questionQueue,
  ]);

  if (allTeamsComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-4xl font-bold text-white mb-8">Lightning Round Complete!</h2>
        <div className="grid gap-4 mb-8">
          {teams.map(team => (
            <div
              key={team.id}
              className="bg-white/10 backdrop-blur-sm rounded-lg px-8 py-4 flex items-center justify-between gap-8"
              style={{ borderLeft: `4px solid ${team.color}` }}
            >
              <span className="text-2xl text-white font-bold">{team.name}</span>
              <span className="text-3xl text-white font-bold">
                {teamScores[team.id] || 0} points
              </span>
            </div>
          ))}
        </div>
        <Button onClick={onComplete} size="lg">
          Next Round
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">⚡ Lightning Round</h2>
        <p className="text-blue-200">Answer as many questions as possible in {roundSeconds} seconds!</p>
        <div className="mt-4">
          <div
            className="inline-block text-2xl font-bold px-6 py-3 rounded-full"
            style={{ backgroundColor: currentTeam?.color }}
          >
            {currentTeam?.name}'s Turn
          </div>
        </div>
      </div>

      {!state.isActive && !state.currentQuestion && (
        <div className="flex flex-col items-center gap-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 max-w-md">
            <CardContent className="pt-6 text-center">
              <Zap className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
              <p className="text-white text-lg mb-4">
                Get ready! You have {roundSeconds} seconds to answer up to 10 questions.
              </p>
              <p className="text-blue-200">
                Each correct answer is worth 50 points.
              </p>
            </CardContent>
          </Card>
          <Button onClick={startRound} size="lg" className="bg-yellow-500 hover:bg-yellow-600">
            <Zap className="mr-2 h-5 w-5" />
            Start Lightning Round
          </Button>
        </div>
      )}

      {state.isActive && state.currentQuestion && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="pt-6">
                <motion.div
                  key={state.questionIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xl sm:text-2xl lg:text-3xl text-white text-center mb-6 sm:mb-8 min-h-[80px] sm:min-h-[100px] lg:min-h-[120px] flex items-center justify-center px-2"
                >
                  {state.currentQuestion.text}
                </motion.div>

                {/* Host Answer - Always Visible */}
                <div className="bg-blue-500/20 border-2 border-blue-400 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                  <p className="text-white text-center text-sm sm:text-base break-words">
                    <span className="break-words">{state.currentQuestion.answer}</span>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <Button
                    onClick={handleCorrect}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-lg sm:text-xl h-14 sm:h-16 px-6 sm:px-8 w-full sm:w-auto"
                  >
                    <Check className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                    Correct
                  </Button>
                  <Button
                    onClick={handleIncorrect}
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-lg sm:text-xl h-14 sm:h-16 px-6 sm:px-8 w-full sm:w-auto"
                  >
                    <X className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                    Wrong
                  </Button>
                  <Button
                    onClick={handlePass}
                    size="lg"
                    variant="outline"
                    className="text-lg sm:text-xl h-14 sm:h-16 px-6 sm:px-8 w-full sm:w-auto"
                  >
                    <SkipForward className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                    Pass
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="pt-6 flex flex-col items-center">
                <Timer
                  seconds={roundSeconds}
                  value={state.timeRemaining}
                  onComplete={handleTimeUp}
                  running={state.isActive}
                  size="lg"
                />
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
                    {state.questionsAnswered}
                  </div>
                  <div className="text-blue-200">Questions Answered</div>
                  <div className="text-sm text-white/50 mt-2">Max: 10</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-6">
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl font-bold text-green-400 mb-1">
                      {correctCount}
                    </div>
                    <div className="text-xs text-green-200">Correct</div>
                  </div>
                  <div className="w-px h-10 bg-white/20" />
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl font-bold text-red-400 mb-1">
                      {incorrectCount}
                    </div>
                    <div className="text-xs text-red-200">Incorrect</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-bold text-yellow-400 mb-2">
                    {teamScores[state.currentTeam] || 0}
                  </div>
                  <div className="text-blue-200">Points This Round</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {!state.isActive && state.currentQuestion && (
        <div className="flex flex-col items-center gap-6">
          <h3 className="text-2xl font-bold text-white">Time's Up!</h3>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="pt-6 text-center">
              <div className="text-4xl font-bold text-white mb-2">
                {teamScores[state.currentTeam] || 0} points
              </div>
              <div className="text-blue-200">
                {state.questionsAnswered} questions answered
              </div>
            </CardContent>
          </Card>
          <Button onClick={nextTeam} size="lg">
            {currentTeamIndex < teams.length - 1 ? 'Next Team' : 'Complete Round'}
          </Button>
        </div>
      )}
    </div>
  );
}