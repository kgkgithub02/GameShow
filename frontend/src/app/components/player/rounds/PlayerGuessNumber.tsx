import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Target, Trophy } from 'lucide-react';

interface PlayerGuessNumberProps {
  prompt: string;
  timeRemaining?: number;
  questionId: number;
  questionIndex: number;
  totalQuestions: number;
  submittedGuess?: number | null;
  canSubmit: boolean;
  onDraftGuess: (guess: number) => void;
  onSubmitGuess: (guess: number) => void;
  revealed: boolean;
  correctAnswer?: number | null;
  winnerTeamName?: string | null;
  isTie?: boolean;
  teamResults?: Array<{
    teamId: string;
    teamName: string;
    teamColor: string;
    closestGuess: number;
    difference: number;
    playerName: string;
    winnerPlayers: Array<{ playerName: string; guess: number }>;
  }>;
}

export function PlayerGuessNumber({
  prompt,
  timeRemaining,
  questionId,
  questionIndex,
  totalQuestions,
  submittedGuess,
  canSubmit,
  onDraftGuess,
  onSubmitGuess,
  revealed,
  correctAnswer,
  winnerTeamName,
  isTie = false,
  teamResults = [],
}: PlayerGuessNumberProps) {
  const [guessValue, setGuessValue] = useState('');
  const submittedQuestionRef = useRef<number | null>(null);
  const draftTimerRef = useRef<number | null>(null);
  const lastDraftRef = useRef<string | null>(null);

  useEffect(() => {
    setGuessValue('');
    submittedQuestionRef.current = null;
    lastDraftRef.current = null;
    if (draftTimerRef.current) {
      window.clearTimeout(draftTimerRef.current);
      draftTimerRef.current = null;
    }
  }, [questionId]);

  const hasSubmitted = submittedGuess !== undefined && submittedGuess !== null;

  useEffect(() => {
    if (submittedGuess === undefined || submittedGuess === null) return;
    const nextValue = String(submittedGuess);
    if (guessValue !== nextValue) {
      setGuessValue(nextValue);
    }
  }, [submittedGuess, guessValue]);

  useEffect(() => {
    if (!canSubmit) return;
    if (guessValue.trim() === '') return;
    if (lastDraftRef.current === guessValue) return;

    if (draftTimerRef.current) {
      window.clearTimeout(draftTimerRef.current);
      draftTimerRef.current = null;
    }

    draftTimerRef.current = window.setTimeout(() => {
      const parsed = Number(guessValue);
      if (Number.isNaN(parsed)) return;
      lastDraftRef.current = guessValue;
      onDraftGuess(parsed);
    }, 300);

    return () => {
      if (draftTimerRef.current) {
        window.clearTimeout(draftTimerRef.current);
        draftTimerRef.current = null;
      }
    };
  }, [guessValue, canSubmit, onDraftGuess]);

  useEffect(() => {
    if (timeRemaining === undefined && !revealed) return;
    if (timeRemaining !== undefined && timeRemaining > 0) return;
    if (submittedQuestionRef.current === questionId) return;
    if (guessValue.trim() === '') {
      submittedQuestionRef.current = questionId;
      return;
    }
    const parsed = Number(guessValue);
    if (Number.isNaN(parsed)) {
      submittedQuestionRef.current = questionId;
      return;
    }
    submittedQuestionRef.current = questionId;
    onSubmitGuess(parsed);
  }, [timeRemaining, revealed, questionId, guessValue, onSubmitGuess]);

  return (
    <div className="space-y-4">
      {/* Timer Display */}
      {timeRemaining !== undefined && (
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="inline-block px-4 py-2 bg-white/10 rounded-lg">
                <div className="text-sm text-blue-200">Time Remaining</div>
                <div className="text-2xl font-bold text-white">{timeRemaining}s</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prompt */}
      <Card className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-xl border-white/30">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-3">
            <Target className="h-6 w-6 text-purple-300" />
            <h3 className="text-lg font-bold text-white">What number is this?</h3>
          </div>
          <div className="text-sm text-blue-200 mb-2">
            Question {questionIndex} of {totalQuestions}
          </div>
          <div className="text-xl text-white leading-relaxed">
            {prompt}
          </div>
        </CardContent>
      </Card>

      {!revealed && (
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-4 pb-4">
            <div className="text-sm text-blue-200 mb-2">Your Guess</div>
            <div className="flex gap-3">
              <Input
                type="number"
                value={guessValue}
                onChange={(event) => setGuessValue(event.target.value)}
                placeholder="Enter your number"
                className="bg-white/10 border-white/20 text-white text-lg placeholder:text-white/70"
                disabled={!canSubmit}
              />
            </div>
            {hasSubmitted && (
              <div className="mt-3 text-sm text-green-300">
                Submitted after time expired.
              </div>
            )}
            {canSubmit && (
              <div className="mt-3 text-sm text-blue-200">
                You can change your guess until time expires.
              </div>
            )}
            {!canSubmit && !hasSubmitted && (
              <div className="mt-3 text-sm text-blue-200">
                Waiting for the next question.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {revealed && (
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              <div className="text-sm text-blue-200">Correct Answer</div>
              <div className="text-4xl font-bold text-white">
                {correctAnswer?.toLocaleString() ?? '—'}
              </div>
            </div>
            {isTie && (
              <div className="text-center text-yellow-300 font-semibold mb-4">
                It's a tie!
              </div>
            )}
            {!isTie && winnerTeamName && (
              <div className="text-center text-green-300 font-semibold mb-4">
                {winnerTeamName} wins this question!
              </div>
            )}
            <div className="space-y-2">
              {teamResults.map((result, index) => (
                <div
                  key={result.teamId}
                  className="flex items-center justify-between rounded-lg p-3"
                  style={{ backgroundColor: `${result.teamColor}20` }}
                >
                  <div>
                    <div className="text-white font-bold">{result.teamName}</div>
                    <div className="text-xs text-blue-200">
                      {result.winnerPlayers && result.winnerPlayers.length > 1
                        ? `Closest: ${result.winnerPlayers
                            .map(player => `${player.playerName} (${player.guess})`)
                            .join(', ')} (off by ${result.difference})`
                        : `Closest: ${result.closestGuess} by ${result.playerName} (off by ${result.difference})`}
                    </div>
                  </div>
                  {(isTie || index === 0) && <Trophy className="h-5 w-5 text-yellow-400" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
