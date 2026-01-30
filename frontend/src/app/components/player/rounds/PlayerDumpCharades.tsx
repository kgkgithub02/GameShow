import { Card, CardContent } from '@/app/components/ui/card';
import { Clock, Eye, EyeOff, Theater } from 'lucide-react';
import { motion } from 'motion/react';

interface PlayerDumpCharadesProps {
  word: string | null;
  isActor: boolean;
  isGuessingTeam?: boolean;
  timeRemaining: number;
  isActive: boolean;
  phase: 'prep' | 'acting' | 'judging' | 'complete';
  result?: 'guessed' | 'missed' | null;
}

export function PlayerDumpCharades({
  word,
  isActor,
  isGuessingTeam = false,
  timeRemaining,
  isActive,
  phase,
  result,
}: PlayerDumpCharadesProps) {
  const roleLabel = isActor ? 'You are Acting' : isGuessingTeam ? 'You are Guessing' : 'You are Watching';

  return (
    <div className="space-y-4">
      {phase === 'prep' && (
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6 pb-6">
            <div className="text-center space-y-3">
              <p className="text-lg font-bold text-white">How to Play: Dump Charades</p>
              <p className="text-blue-200 text-sm">
                The host is setting up the round. Get ready!
              </p>
              <div className="text-sm text-blue-100">
                One player acts out the word without speaking while the team guesses.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {phase === 'acting' && (
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-white" />
                <div>
                  <div className="text-3xl font-bold text-white">{timeRemaining}s</div>
                  <div className="text-xs text-blue-200">Remaining</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-300 uppercase font-bold">{roleLabel}</div>
                {isActor && word && (
                  <div className="text-xs text-blue-200 mt-1">Don’t say the word out loud!</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isActor && word && phase === 'acting' && isActive && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-xl border-yellow-500/50">
            <CardContent className="pt-6 pb-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Eye className="h-5 w-5 text-yellow-400" />
                  <span className="text-sm text-yellow-300 uppercase font-bold">Your Secret Word</span>
                </div>
                <div className="text-4xl font-bold text-white mb-2">{word}</div>
                <p className="text-yellow-200 text-sm">Act it out—no words, letters, or sounds!</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {!isActor && phase === 'acting' && (
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6 pb-6 text-center">
            <EyeOff className="h-10 w-10 mx-auto mb-2 text-white/60" />
            <p className="text-white font-semibold">Actor is performing…</p>
            <p className="text-blue-200 text-sm">
              {isGuessingTeam ? 'Guess with your team!' : 'Watch the performance.'}
            </p>
          </CardContent>
        </Card>
      )}

      {phase === 'judging' && (
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6 pb-6 text-center">
            <Theater className="h-10 w-10 mx-auto mb-2 text-purple-300" />
            <p className="text-white font-semibold">Waiting for host decision…</p>
          </CardContent>
        </Card>
      )}

      {phase === 'complete' && (
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6 pb-6 text-center space-y-2">
            <p className="text-lg font-semibold text-white">Turn Complete</p>
            <p className="text-white">
              {result === 'guessed' ? '✅ Correct! +200 points' : 'No points awarded'}
            </p>
            {word && (
              <p className="text-blue-200 text-sm">
                Word: <span className="font-semibold text-white">{word}</span>
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
