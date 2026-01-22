import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { GeneratedQuestions } from '@/app/utils/questionGenerator';
import { Difficulty, RoundType, RoundSettings } from '@/app/types/game';
import { RefreshCw, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { regenerateQuestion } from '@/services/questionService';
import { formatGameCode } from '@/app/utils/gameCode';
import { useGameSync } from '@/hooks/useGameSync';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';

interface QuestionReviewProps {
  questions: GeneratedQuestions;
  rounds: RoundType[];
  roundSettings: RoundSettings;
  gameId?: string | null;
  gameCode?: string | null;
  canStart?: boolean;
  startDisabledMessage?: string;
  onConfirm: (questions: GeneratedQuestions) => void;
  onBack: () => void;
}

export function QuestionReview({ 
  questions: initialQuestions, 
  rounds, 
  roundSettings, 
  gameId,
  gameCode,
  canStart = true,
  startDisabledMessage,
  onConfirm,
  onBack 
}: QuestionReviewProps) {
  const [questions, setQuestions] = useState<GeneratedQuestions>(initialQuestions);
  const [expandedRounds, setExpandedRounds] = useState<Set<RoundType>>(new Set(['trivia-buzz']));
  const [regeneratingIndex, setRegeneratingIndex] = useState<{ round: RoundType; index: number } | null>(null);
  const { teams: syncedTeams, players: syncedPlayers } = useGameSync(gameId || null);
  const joinedTeamCount = new Set(syncedPlayers.map(player => player.team_id)).size;
  const lobbyReady = syncedTeams.length > 0 && joinedTeamCount >= syncedTeams.length;
  const effectiveCanStart = gameId ? lobbyReady : canStart;
  const effectiveDisabledMessage = gameId
    ? 'Each team needs at least one player before starting.'
    : startDisabledMessage;

  console.log('QuestionReview - questions:', questions);
  console.log('QuestionReview - rounds:', rounds);
  console.log('QuestionReview - roundSettings:', roundSettings);

  const toggleRound = (round: RoundType) => {
    const newExpanded = new Set(expandedRounds);
    if (newExpanded.has(round)) {
      newExpanded.delete(round);
    } else {
      newExpanded.add(round);
    }
    setExpandedRounds(newExpanded);
  };

  const handleRegenerate = async (roundType: RoundType, index: number, difficultyOverride?: Difficulty) => {
    setRegeneratingIndex({ round: roundType, index });

    try {
      if (roundType === 'trivia-buzz' && questions.triviaBuzz) {
        const current = questions.triviaBuzz[index];
        const response = await regenerateQuestion({
          round_type: roundType,
          difficulty: difficultyOverride || current.difficulty,
          category: current.category || null,
        });
        if (response.question) {
          const updated = { ...questions };
          updated.triviaBuzz = [...questions.triviaBuzz];
          updated.triviaBuzz[index] = response.question as any;
          setQuestions(updated);
        }
      }

      if (roundType === 'lightning' && questions.lightning) {
        const current = questions.lightning[index];
        const response = await regenerateQuestion({
          round_type: roundType,
          difficulty: difficultyOverride || current.difficulty,
          category: current.category || null,
        });
        if (response.question) {
          const updated = { ...questions };
          updated.lightning = [...questions.lightning];
          updated.lightning[index] = response.question as any;
          setQuestions(updated);
        }
      }

      if (roundType === 'guess-number' && questions.guessNumber) {
        const response = await regenerateQuestion({ round_type: roundType });
        if (response.guess_number) {
          const updated = { ...questions };
          updated.guessNumber = [...questions.guessNumber];
          updated.guessNumber[index] = response.guess_number;
          setQuestions(updated);
        }
      }

      if (roundType === 'connect-4' && questions.connect4) {
        const current = questions.connect4[index];
        const response = await regenerateQuestion({
          round_type: roundType,
          difficulty: difficultyOverride || current.question.difficulty,
          category: current.question.category || null,
          column: current.column,
          row: current.row,
        });
        if (response.connect4) {
          const updated = { ...questions };
          updated.connect4 = [...questions.connect4];
          updated.connect4[index] = response.connect4 as any;
          setQuestions(updated);
        }
      }

      if (roundType === 'blind-draw' && questions.blindDraw) {
        const response = await regenerateQuestion({
          round_type: roundType,
          difficulty: roundSettings.blindDrawDifficulty || 'medium-hard',
        });
        if (response.word) {
          const updated = { ...questions };
          updated.blindDraw = [...questions.blindDraw];
          updated.blindDraw[index] = response.word;
          setQuestions(updated);
        }
      }
    } catch (error) {
      console.error(error);
      alert('Failed to regenerate question. Check backend config and try again.');
    } finally {
      setRegeneratingIndex(null);
    }
  };

  const getRoundTitle = (roundType: RoundType): string => {
    const titles: Record<RoundType, string> = {
      'trivia-buzz': '⚡ Trivia Buzz',
      'lightning': '⚡ Lightning Round',
      'quick-build': '🏗️ Quick Build',
      'connect-4': '🎯 Connect 4',
      'guess-number': '🔢 Guess the Number',
      'blind-draw': '🎨 Blind Draw',
    };
    return titles[roundType];
  };

  const getQuestionCount = (roundType: RoundType): number => {
    switch (roundType) {
      case 'trivia-buzz':
        return questions.triviaBuzz?.length || 0;
      case 'lightning':
        return questions.lightning?.length || 0;
      case 'guess-number':
        return questions.guessNumber?.length || 0;
      case 'connect-4':
        return questions.connect4?.length || 0;
      case 'blind-draw':
        return questions.blindDraw?.length || 0;
      default:
        return 0;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">Review Questions</h1>
          <p className="text-blue-200">Review and regenerate any questions you don't like</p>
        </div>

        {gameId && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Live Lobby</CardTitle>
              <CardDescription>Players joining the game</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {gameCode && (
                <div className="text-center">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Game Code</div>
                  <div className="text-2xl font-bold tracking-widest">
                    {formatGameCode(gameCode)}
                  </div>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                {syncedTeams.map(team => {
                  const teamPlayers = syncedPlayers.filter(player => player.team_id === team.id);
                  return (
                    <div
                      key={team.id}
                      className="border rounded-lg p-4"
                      style={{ borderLeft: `4px solid ${team.color}` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">{team.name}</div>
                        <div className="text-xs text-gray-500">{teamPlayers.length} joined</div>
                      </div>
                      {teamPlayers.length === 0 ? (
                        <div className="text-sm text-gray-400">No players yet</div>
                      ) : (
                        <div className="space-y-1">
                          {teamPlayers.map(player => (
                            <div key={player.id} className="flex items-center justify-between text-sm">
                              <span>{player.name}</span>
                              <span className={player.connected ? 'text-green-600' : 'text-gray-400'}>
                                {player.connected ? 'Online' : 'Left'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4 mb-6">
          {/* Trivia Buzz */}
          {rounds.includes('trivia-buzz') && questions.triviaBuzz && (
            <Card>
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleRound('trivia-buzz')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {expandedRounds.has('trivia-buzz') ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      {getRoundTitle('trivia-buzz')}
                    </CardTitle>
                    <CardDescription>{getQuestionCount('trivia-buzz')} questions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <AnimatePresence>
                {expandedRounds.has('trivia-buzz') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardContent className="space-y-3 pt-0">
                      {questions.triviaBuzz.map((q, index) => (
                        <div 
                          key={q.id} 
                          className={`border rounded-lg p-4 ${
                            regeneratingIndex?.round === 'trivia-buzz' && regeneratingIndex?.index === index
                              ? 'bg-blue-50 border-blue-300'
                              : 'bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-sm text-gray-600">Q{index + 1}</span>
                                <Select
                                  value={q.difficulty}
                                  onValueChange={(value) => handleRegenerate('trivia-buzz', index, value as Difficulty)}
                                  disabled={regeneratingIndex !== null}
                                >
                                  <SelectTrigger className="h-7 text-xs w-28">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="medium-hard">Mid-Hard</SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <p className="font-medium mb-1">{q.text}</p>
                              <p className="text-sm text-green-600">✓ Answer: {q.answer}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRegenerate('trivia-buzz', index)}
                              disabled={regeneratingIndex !== null}
                            >
                              <RefreshCw className={`h-4 w-4 ${regeneratingIndex?.round === 'trivia-buzz' && regeneratingIndex?.index === index ? 'animate-spin' : ''}`} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )}

          {/* Lightning Round */}
          {rounds.includes('lightning') && questions.lightning && (
            <Card>
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleRound('lightning')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {expandedRounds.has('lightning') ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      {getRoundTitle('lightning')}
                    </CardTitle>
                    <CardDescription>{getQuestionCount('lightning')} questions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <AnimatePresence>
                {expandedRounds.has('lightning') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardContent className="space-y-3 pt-0">
                      {questions.lightning.map((q, index) => (
                        <div 
                          key={q.id} 
                          className={`border rounded-lg p-4 ${
                            regeneratingIndex?.round === 'lightning' && regeneratingIndex?.index === index
                              ? 'bg-blue-50 border-blue-300'
                              : 'bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-sm text-gray-600">Q{index + 1}</span>
                                <Select
                                  value={q.difficulty}
                                  onValueChange={(value) => handleRegenerate('lightning', index, value as Difficulty)}
                                  disabled={regeneratingIndex !== null}
                                >
                                  <SelectTrigger className="h-7 text-xs w-28">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="medium-hard">Mid-Hard</SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <p className="font-medium mb-1">{q.text}</p>
                              <p className="text-sm text-green-600">✓ Answer: {q.answer}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRegenerate('lightning', index)}
                              disabled={regeneratingIndex !== null}
                            >
                              <RefreshCw className={`h-4 w-4 ${regeneratingIndex?.round === 'lightning' && regeneratingIndex?.index === index ? 'animate-spin' : ''}`} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )}

          {/* Guess the Number */}
          {rounds.includes('guess-number') && questions.guessNumber && (
            <Card>
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleRound('guess-number')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {expandedRounds.has('guess-number') ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      {getRoundTitle('guess-number')}
                    </CardTitle>
                    <CardDescription>{getQuestionCount('guess-number')} questions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <AnimatePresence>
                {expandedRounds.has('guess-number') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardContent className="space-y-3 pt-0">
                      {questions.guessNumber.map((q, index) => (
                        <div 
                          key={index} 
                          className={`border rounded-lg p-4 ${
                            regeneratingIndex?.round === 'guess-number' && regeneratingIndex?.index === index
                              ? 'bg-blue-50 border-blue-300'
                              : 'bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-sm text-gray-600">Q{index + 1}</span>
                              </div>
                              <p className="font-medium mb-1">{q.question}</p>
                              <p className="text-sm text-green-600">✓ Answer: {q.answer}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRegenerate('guess-number', index)}
                              disabled={regeneratingIndex !== null}
                            >
                              <RefreshCw className={`h-4 w-4 ${regeneratingIndex?.round === 'guess-number' && regeneratingIndex?.index === index ? 'animate-spin' : ''}`} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )}

          {/* Connect 4 */}
          {rounds.includes('connect-4') && questions.connect4 && (
            <Card>
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleRound('connect-4')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {expandedRounds.has('connect-4') ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      {getRoundTitle('connect-4')}
                    </CardTitle>
                    <CardDescription>{getQuestionCount('connect-4')} questions (4 columns × 4 rows)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <AnimatePresence>
                {expandedRounds.has('connect-4') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardContent className="space-y-3 pt-0">
                      {questions.connect4.map((item, index) => {
                        const rowPoints = (item.row + 1) * 100; // Row 0 = 100, Row 1 = 200, etc.
                        const rowLabel = ['Bottom Row', '2nd Row', '3rd Row', 'Top Row'][item.row];
                        const columnTheme = roundSettings.connect4Themes?.[item.column] || 'general';
                        return (
                          <div 
                            key={item.question.id} 
                            className={`border rounded-lg p-4 ${
                              regeneratingIndex?.round === 'connect-4' && regeneratingIndex?.index === index
                                ? 'bg-blue-50 border-blue-300'
                                : 'bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-semibold text-sm text-gray-600">
                                    Column {item.column + 1} ({columnTheme}), {rowLabel}
                                  </span>
                                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-semibold">{rowPoints} pts</span>
                                <Select
                                  value={item.question.difficulty}
                                  onValueChange={(value) => handleRegenerate('connect-4', index, value as Difficulty)}
                                  disabled={regeneratingIndex !== null}
                                >
                                  <SelectTrigger className="h-7 text-xs w-28">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="medium-hard">Mid-Hard</SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                  </SelectContent>
                                </Select>
                                </div>
                                <p className="font-medium mb-1">{item.question.text}</p>
                                <p className="text-sm text-green-600">✓ Answer: {item.question.answer}</p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRegenerate('connect-4', index)}
                                disabled={regeneratingIndex !== null}
                              >
                                <RefreshCw className={`h-4 w-4 ${regeneratingIndex?.round === 'connect-4' && regeneratingIndex?.index === index ? 'animate-spin' : ''}`} />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )}

          {/* Blind Draw */}
          {rounds.includes('blind-draw') && questions.blindDraw && (
            <Card>
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleRound('blind-draw')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {expandedRounds.has('blind-draw') ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      {getRoundTitle('blind-draw')}
                    </CardTitle>
                    <CardDescription>{getQuestionCount('blind-draw')} words to draw</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <AnimatePresence>
                {expandedRounds.has('blind-draw') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardContent className="space-y-3 pt-0">
                      {questions.blindDraw.map((word, index) => (
                        <div 
                          key={index} 
                          className={`border rounded-lg p-4 ${
                            regeneratingIndex?.round === 'blind-draw' && regeneratingIndex?.index === index
                              ? 'bg-blue-50 border-blue-300'
                              : 'bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-sm text-gray-600">Round {index + 1}</span>
                              </div>
                              <p className="font-medium text-lg">{word}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRegenerate('blind-draw', index)}
                              disabled={regeneratingIndex !== null}
                            >
                              <RefreshCw className={`h-4 w-4 ${regeneratingIndex?.round === 'blind-draw' && regeneratingIndex?.index === index ? 'animate-spin' : ''}`} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )}

          {/* Quick Build - No questions */}
          {rounds.includes('quick-build') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🏗️ Quick Build
                </CardTitle>
                <CardDescription>Physical challenge - no questions to review</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        <div className="flex gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={onBack}
            className="flex-1 bg-white"
          >
            Back to Setup
          </Button>
          <div className="flex-1 space-y-2">
            <Button
              onClick={() => onConfirm(questions)}
              size="lg"
              disabled={!effectiveCanStart}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-60"
            >
              <Check className="h-5 w-5 mr-2" />
              Start Game
            </Button>
            {!effectiveCanStart && effectiveDisabledMessage && (
              <p className="text-xs text-blue-200 text-center">{effectiveDisabledMessage}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}