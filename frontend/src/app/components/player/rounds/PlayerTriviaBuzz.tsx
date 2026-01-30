import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Zap, Trophy, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PlayerTriviaBuzzProps {
  question: string | null;
  category?: string;
  points?: number;
  canBuzz: boolean;
  buzzedTeam: string | null;
  buzzedPlayerName?: string | null;
  incorrectTeamId?: string | null;
  teamId: string;
  teamColor: string;
  timeRemaining?: number;
  answer?: string;
  showAnswer?: boolean;
  onBuzz?: () => Promise<boolean> | boolean;
}

export function PlayerTriviaBuzz({
  question,
  category,
  points,
  canBuzz,
  buzzedTeam,
  buzzedPlayerName,
  incorrectTeamId,
  teamId,
  teamColor,
  timeRemaining,
  answer,
  showAnswer,
  onBuzz,
}: PlayerTriviaBuzzProps) {
  const [buzzed, setBuzzed] = useState(false);
  const [buzzSubmitting, setBuzzSubmitting] = useState(false);
  const [buzzRejected, setBuzzRejected] = useState(false);

  useEffect(() => {
    // Reset local buzz state for a new question or when buzzing re-opens
    if (!buzzedTeam || (canBuzz && buzzedTeam !== teamId)) {
      setBuzzed(false);
    }
  }, [question, canBuzz, buzzedTeam, teamId]);

  const handleBuzz = async () => {
    if (!canAttemptBuzz || buzzed || buzzSubmitting) return;
    if (!onBuzz) return;
    setBuzzSubmitting(true);
    setBuzzRejected(false);
    try {
      const accepted = await onBuzz();
      if (accepted) {
        setBuzzed(true);
      } else {
        setBuzzRejected(true);
        setTimeout(() => setBuzzRejected(false), 1500);
      }
    } finally {
      setBuzzSubmitting(false);
    }
  };

  const canAttemptBuzz = canBuzz && (!incorrectTeamId || incorrectTeamId !== teamId);
  const showBuzzButton = canAttemptBuzz && (buzzedTeam !== teamId || !buzzedTeam);

  return (
    <div className={`space-y-4 ${showBuzzButton ? 'pb-28 sm:pb-0' : ''}`}>
      {/* Question Card */}
      {question && (
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            {category && (
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-blue-300 uppercase font-bold">
                  {category}
                </div>
                {points && (
                  <div className="flex items-center gap-2 text-yellow-400 font-bold">
                    <Trophy className="h-4 w-4" />
                    {points} pts
                  </div>
                )}
              </div>
            )}
            <div className="text-2xl text-white font-medium leading-relaxed">
              {question}
            </div>
            {timeRemaining !== undefined && (
              <div className="mt-4 flex items-center justify-center">
                <div className="flex items-center gap-3 rounded-full bg-blue-500/20 px-5 py-2 border border-blue-400/40">
                  <Clock className="h-5 w-5 text-blue-200" />
                  <span className="text-2xl font-bold text-white">
                    {timeRemaining}s
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Buzz Status */}
      <AnimatePresence>
        {buzzedTeam && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Card className="bg-yellow-500/20 backdrop-blur-xl border-yellow-500/50">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  <p className="text-white font-bold">
                    {buzzedPlayerName
                      ? `${buzzedPlayerName} buzzed in!`
                      : buzzedTeam === teamId
                      ? 'You buzzed in!'
                      : 'Other team buzzed in!'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buzz Button */}
      {showBuzzButton && (
        <motion.div
          whileHover={{ scale: canBuzz && !buzzed && !buzzSubmitting ? 1.02 : 1 }}
          whileTap={{ scale: canBuzz && !buzzed && !buzzSubmitting ? 0.98 : 1 }}
          className="fixed bottom-0 left-0 right-0 z-20 sm:static"
        >
          <div className="px-4 pb-4 pt-3 sm:px-0 sm:pb-0 sm:pt-0 bg-gradient-to-t from-indigo-900/95 via-indigo-900/80 to-transparent sm:bg-transparent">
            <Button
              onClick={handleBuzz}
              disabled={!canBuzz || buzzed || buzzSubmitting}
              size="lg"
              className="w-full h-20 text-2xl font-bold"
              style={{
                backgroundColor: buzzed ? '#10B981' : teamColor,
                opacity: buzzed ? 0.7 : 1,
              }}
            >
              {buzzed ? (
                <>
                  <Trophy className="mr-3 h-8 w-8" />
                  Buzzed In!
                </>
              ) : (
                <>
                  <Zap className="mr-3 h-8 w-8" />
                  BUZZ IN!
                </>
              )}
            </Button>
          </div>
        </motion.div>
      )}

      {incorrectTeamId && !showAnswer && (
        <p className="text-center text-yellow-300 text-sm font-medium">
          {incorrectTeamId === teamId
            ? 'Incorrect! Opponents can steal.'
            : 'Steal opportunity! Buzz in now.'}
        </p>
      )}
      {showAnswer && buzzedTeam && incorrectTeamId === buzzedTeam && (
        <p className="text-center text-red-300 text-sm font-medium">
          {buzzedPlayerName
            ? `${buzzedPlayerName} answered incorrectly.`
            : buzzedTeam === teamId
            ? 'Your team answered incorrectly.'
            : 'Other team answered incorrectly.'}
        </p>
      )}
      {showAnswer && buzzedTeam && incorrectTeamId !== buzzedTeam && (
        <p className="text-center text-green-300 text-sm font-medium">
          {buzzedPlayerName
            ? `${buzzedPlayerName} answered correctly!`
            : buzzedTeam === teamId
            ? 'Your team answered correctly!'
            : 'Other team answered correctly!'}
        </p>
      )}
      {!buzzed && canAttemptBuzz && !buzzedTeam && !incorrectTeamId && (
        <p className="text-center text-blue-200 text-sm">
          Tap to buzz in when you know the answer
        </p>
      )}
      {buzzRejected && (
        <p className="text-center text-red-300 text-sm font-medium">
          Too late!
        </p>
      )}

      {/* Answer Display */}
      {showAnswer && answer && (
        <Card className="bg-green-500/20 backdrop-blur-xl border-green-500/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-center gap-2">
              <Trophy className="h-5 w-5 text-green-400" />
              <p className="text-white font-bold">Answer: {answer}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}