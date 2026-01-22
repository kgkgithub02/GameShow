import { Card, CardContent } from '@/app/components/ui/card';
import { Trophy, Clock, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface PlayerLightningProps {
  question: string | null;
  questionNumber: number;
  totalQuestions: number;
  timeRemaining: number;
  yourTurn: boolean;
  teamColor: string;
  correctCount?: number;
  incorrectCount?: number;
  roundComplete?: boolean;
  pointsThisRound?: number;
}

export function PlayerLightning({
  question,
  questionNumber,
  totalQuestions,
  timeRemaining,
  yourTurn,
  teamColor,
  correctCount = 0,
  incorrectCount = 0,
  roundComplete = false,
  pointsThisRound,
}: PlayerLightningProps) {
  const isComplete =
    roundComplete || timeRemaining === 0 || (!question && questionNumber >= totalQuestions);
  const showQuestionProgress = question && questionNumber > 0;
  const questionProgressText = showQuestionProgress
    ? `${questionNumber}/${totalQuestions}`
    : `${totalQuestions}`;

  return (
    <div className="space-y-4">
      {/* Timer and Progress */}
      {!isComplete && (
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="text-4xl font-bold text-white">{timeRemaining}s</div>
                  <div className="text-sm text-blue-200">Remaining</div>
                </div>
              </div>
              <div className="text-right">
              <div className="text-3xl font-bold text-white">
                {questionProgressText}
              </div>
              <div className="text-sm text-blue-200">Questions</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                initial={{ width: 0 }}
                animate={{ width: `${(timeRemaining / 60) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Score Card */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-around">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-white">{correctCount}</div>
                <div className="text-xs text-green-200">Correct</div>
              </div>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-red-400" />
              <div>
                <div className="text-2xl font-bold text-white">{incorrectCount}</div>
                <div className="text-xs text-red-200">Incorrect</div>
              </div>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-400" />
              <div>
                <div className="text-2xl font-bold text-white">{correctCount * 50}</div>
                <div className="text-xs text-yellow-200">Points</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Question */}
      {question && yourTurn && !isComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          key={question}
        >
          <Card className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-xl border-white/30">
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <div className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm text-white font-bold mb-3">
                  Question #{questionNumber}
                </div>
              </div>
              <div className="text-2xl text-white font-medium leading-relaxed text-center">
                {question}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Round Complete */}
      {isComplete && (
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6 pb-6 text-center">
            <div className="text-xl text-white font-bold mb-2">Round Complete!</div>
            <p className="text-blue-200 text-sm">
              Your team scored {pointsThisRound ?? correctCount * 50} points.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Waiting for Turn */}
      {!yourTurn && !isComplete && (
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6 pb-6">
            <div className="text-center">
              <div className="text-lg text-white font-medium mb-2">
                Other team is answering...
              </div>
              <p className="text-blue-200 text-sm">
                Watch the main screen and get ready for your turn!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instruction */}
      <div className="text-center">
        <p className="text-blue-200 text-sm">
          {yourTurn 
            ? '📢 Shout out your answers to the host!' 
            : '👀 Watch the other team compete'}
        </p>
      </div>
    </div>
  );
}
