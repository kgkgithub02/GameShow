import { Card, CardContent } from '@/app/components/ui/card';
import { Clock, Hammer, Trophy } from 'lucide-react';
import { motion } from 'motion/react';

interface PlayerQuickBuildProps {
  challenge: string;
  timeRemaining: number;
  totalTime: number;
  phase: 'building' | 'judging' | 'complete';
  teamColor: string;
  winnerName?: string | null;
  isTie?: boolean;
}

export function PlayerQuickBuild({
  challenge,
  timeRemaining,
  totalTime,
  phase,
  teamColor,
  winnerName,
  isTie,
}: PlayerQuickBuildProps) {
  return (
    <div className="space-y-4">
      {/* Timer */}
      {phase === 'building' && (
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${teamColor}40` }}
                >
                  <Clock className="h-10 w-10 text-white" />
                </div>
                <div>
                  <div className="text-5xl font-bold text-white">{timeRemaining}s</div>
                  <div className="text-sm text-blue-200">Time Left</div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full"
                style={{ backgroundColor: teamColor }}
                initial={{ width: '100%' }}
                animate={{ width: `${(timeRemaining / totalTime) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Challenge Card */}
      <Card className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-xl border-white/30">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <Hammer className="h-8 w-8 text-orange-400" />
            <h3 className="text-2xl font-bold text-white">Your Challenge</h3>
          </div>
          <div className="text-xl text-white leading-relaxed">
            {challenge}
          </div>
        </CardContent>
      </Card>

      {/* Phase Indicator */}
      {phase === 'building' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-blue-500/20 backdrop-blur-xl border-blue-500/50">
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <div className="text-6xl mb-3">🏗️</div>
                <h3 className="text-2xl font-bold text-white mb-2">Build Time!</h3>
                <p className="text-blue-200">
                  Work with your team to complete the challenge
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {phase === 'judging' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-yellow-500/20 backdrop-blur-xl border-yellow-500/50">
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <div className="text-6xl mb-3">👨‍⚖️</div>
                <h3 className="text-2xl font-bold text-white mb-2">Judging in Progress</h3>
                <p className="text-yellow-200">
                  The host is evaluating all team submissions...
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {phase === 'complete' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="bg-green-500/20 backdrop-blur-xl border-green-500/50">
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-white mb-2">Challenge Complete!</h3>
                <p className="text-green-200">
                  {isTie
                    ? 'It’s a tie! Each team earns +150 points.'
                    : winnerName
                    ? `${winnerName} wins! +300 points.`
                    : 'Results are in.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Instructions */}
      <Card className="bg-white/5 backdrop-blur-xl border-white/10">
        <CardContent className="pt-4 pb-4">
          <h4 className="text-sm font-bold text-blue-300 uppercase mb-2">Tips</h4>
          <ul className="space-y-2 text-sm text-white">
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>This is a physical in-person challenge</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Use materials provided by your host</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Communicate with your team members</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Complete before time runs out!</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
