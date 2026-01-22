import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { RoundType } from '@/app/types/game';
import { motion } from 'motion/react';
import { Play, Clock, Target, Zap, Trophy, Lightbulb, SkipForward } from 'lucide-react';

interface RoundInstructionsProps {
  roundType: RoundType;
  isHost: boolean;
  onStart?: () => void;
  onSkip?: () => void;
}

const ROUND_INSTRUCTIONS: Record<RoundType, {
  title: string;
  icon: React.ReactNode;
  description: string;
  rules: string[];
}> = {
  'trivia-buzz': {
    title: 'Trivia Buzz',
    icon: <Zap className="h-12 w-12" />,
    description: 'Buzz in to answer trivia questions! Speed and accuracy are key.',
    rules: [
      'Host will read each question aloud',
      'Teams buzz in when they know the answer',
      'First team to buzz gets to answer',
      'Correct answer = +100 points',
      'Incorrect answer = -50 points and other team can steal',
      'Correct steal = +100 points, incorrect steal = -50 points'
    ]
  },
  'lightning': {
    title: 'Lightning Round',
    icon: <Zap className="h-12 w-12" />,
    description: '60 seconds of rapid-fire questions! Answer as many as possible.',
    rules: [
      'Each team plays individually for 60 seconds',
      'Host reads questions rapid-fire style',
      'Team shouts out answers immediately',
      'Correct answer = +50 points',
      'No penalties for wrong answers',
      'Skip if you don\'t know and move on'
    ]
  },
  'quick-build': {
    title: 'Quick Build',
    icon: <Target className="h-12 w-12" />,
    description: 'A physical building challenge using provided materials.',
    rules: [
      'Host will announce the building challenge',
      'Teams have limited time to build',
      'Use only the materials provided',
      'Host judges based on criteria announced',
      'Points awarded for completion, creativity, and stability'
    ]
  },
  'connect-4': {
    title: 'Connect 4',
    icon: <Target className="h-12 w-12" />,
    description: 'Strategic game with trivia questions to claim spots on the board.',
    rules: [
      'Teams take turns choosing a column category',
      'Answer trivia questions to claim squares',
      'Question difficulty increases with row height',
      'Bottom row = 25pts, Top row = 100pts',
      'Complete a full row or column = +150 bonus!',
      'Wrong answers = opponent can steal that square'
    ]
  },
  'guess-number': {
    title: 'Guess the Number',
    icon: <Lightbulb className="h-12 w-12" />,
    description: 'Make numerical estimations and get as close as possible!',
    rules: [
      'Host reads a question requiring a number answer',
      'All teams submit their guesses simultaneously',
      'Closest guess wins full points',
      'Points scale down based on distance from answer',
      'Ties split the points',
      'No calculators allowed!'
    ]
  },
  'blind-draw': {
    title: 'Blind Draw',
    icon: <Trophy className="h-12 w-12" />,
    description: 'One player draws while others guess what it is!',
    rules: [
      'One team member sees the word/phrase',
      'They draw it WITHOUT speaking or writing letters',
      'Their team has 60 seconds to guess',
      'No verbal clues, gestures, or symbols allowed',
      'Correct guess = points, based on time remaining',
      'Faster guesses = more points'
    ]
  }
};

export function RoundInstructions({ roundType, isHost, onStart, onSkip }: RoundInstructionsProps) {
  const instructions = ROUND_INSTRUCTIONS[roundType];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full"
      >
        <Card className="border-4 border-yellow-400 shadow-2xl">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex justify-center mb-4 text-yellow-500"
              >
                {instructions.icon}
              </motion.div>
              <motion.h1
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-5xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
              >
                {instructions.title}
              </motion.h1>
              <motion.p
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-xl text-gray-600"
              >
                {instructions.description}
              </motion.p>
            </div>

            {/* Rules */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mb-6"
            >
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Clock className="h-6 w-6 text-purple-600" />
                How to Play
              </h2>
              <ul className="space-y-3">
                {instructions.rules.map((rule, index) => (
                  <motion.li
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 pt-0.5">{rule}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="text-center"
            >
              {isHost ? (
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={onStart}
                    size="lg"
                    className="text-xl px-12 py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
                  >
                    <Play className="h-6 w-6 mr-3" />
                    Start Round
                  </Button>
                  <Button
                    onClick={onSkip}
                    size="lg"
                    variant="outline"
                    className="text-xl px-12 py-6 border-2 border-gray-400 hover:bg-gray-100"
                  >
                    <SkipForward className="h-6 w-6 mr-3" />
                    Skip Round
                  </Button>
                </div>
              ) : (
                <div className="text-xl text-gray-600 flex items-center justify-center gap-3">
                  <div className="animate-pulse flex gap-1">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  Waiting for host to start...
                </div>
              )}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}