import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { RoundType } from '@/app/types/game';
import { motion } from 'motion/react';
import { Play, Clock, Target, Zap, Trophy, Lightbulb, SkipForward, Theater } from 'lucide-react';

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
  },
  'dump-charades': {
    title: 'Dump Charades',
    icon: <Theater className="h-12 w-12" />,
    description: 'One player acts out the word without speaking!',
    rules: [
      'One team member sees the secret word',
      'They act it out without speaking',
      'No props, letters, or lip syncing',
      'Their team has limited time to guess',
      'Correct guess = +200 points',
      'Incorrect guess = 0 points'
    ]
  }
};

export function RoundInstructions({ roundType, isHost, onStart, onSkip }: RoundInstructionsProps) {
  const instructions = ROUND_INSTRUCTIONS[roundType];
  const containerPadding = isHost ? 'p-4 sm:p-8' : 'p-1 sm:p-2 pb-0 sm:pb-0';
  const cardPadding = isHost
    ? 'p-4 sm:p-8'
    : 'px-2 pt-2 pb-1 sm:px-4 sm:pt-3 sm:pb-2';
  const headerSpacing = isHost ? 'mb-4 sm:mb-8' : 'mb-2 sm:mb-2';
  const rulesSpacing = isHost ? 'mb-4 sm:mb-6' : 'mb-1 sm:mb-2';

  const containerHeight = isHost ? 'min-h-screen' : 'h-full';

  return (
    <div className={`${containerHeight} bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 ${containerPadding} ${isHost ? 'flex items-center justify-center' : 'flex items-start justify-center'}`}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`max-w-4xl w-full ${isHost ? '' : 'pt-1'}`}
      >
        <Card className="border-4 border-yellow-400 shadow-2xl">
          <CardContent className={cardPadding}>
            {/* Header */}
            <div className={`${isHost ? 'text-center' : 'text-left'} ${headerSpacing}`}>
              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={`${isHost ? 'flex justify-center' : 'flex justify-start'} mb-3 sm:mb-4 text-yellow-500`}
              >
                <div className={`flex items-center gap-3 ${isHost ? 'justify-center' : 'justify-start'}`}>
                  <span className="text-2xl sm:text-5xl">{instructions.icon}</span>
                  <motion.h1
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className={`${isHost ? 'text-3xl sm:text-5xl' : 'text-xl sm:text-4xl'} font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent`}
                  >
                    {instructions.title}
                  </motion.h1>
                </div>
              </motion.div>
              <motion.p
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className={`${isHost ? 'text-base sm:text-xl' : 'text-sm sm:text-base'} text-gray-600`}
              >
                {instructions.description}
              </motion.p>
            </div>

            {/* Rules */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className={rulesSpacing}
            >
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                How to Play
              </h2>
              <ul className="space-y-2 sm:space-y-3">
                {instructions.rules.map((rule, index) => (
                  <motion.li
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">
                      {index + 1}
                    </span>
                    <span className={`${isHost ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'} text-gray-700 pt-0.5`}>{rule}</span>
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
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <Button
                    onClick={onStart}
                    size="lg"
                    className="text-base sm:text-xl px-6 sm:px-12 py-4 sm:py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
                  >
                    <Play className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
                    Start Round
                  </Button>
                  <Button
                    onClick={onSkip}
                    size="lg"
                    variant="outline"
                    className="text-base sm:text-xl px-6 sm:px-12 py-4 sm:py-6 border-2 border-gray-400 hover:bg-gray-100"
                  >
                    <SkipForward className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
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