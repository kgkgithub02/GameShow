import { Card, CardContent } from '@/app/components/ui/card';
import { Trophy, Target, AlertCircle, X } from 'lucide-react';
import { motion } from 'motion/react';

interface PlayerConnect4Props {
  question: string | null;
  selectedSquare: { row: number; col: number } | null;
  selectedColumn?: number | null;
  pointValue: number | null;
  yourTurn: boolean;
  teamId: string;
  teamColor: string;
  board: Array<Array<{ team: string | null; points: number }>>;
  categories?: string[] | null;
  teamColors?: Record<string, string>;
  teams?: Array<{ id: string; name: string; color: string }>;
  bonusPoints?: Record<string, number>;
  teamScore: number;
  opponentScore: number;
  answer?: string;
  showAnswer?: boolean;
  coinFlipDone?: boolean;
  coinFlipWinnerName?: string | null;
  coinFlipWinnerTeamId?: string | null;
  gameStarted?: boolean;
}

export function PlayerConnect4({
  question,
  selectedSquare,
  selectedColumn,
  pointValue,
  yourTurn,
  teamId,
  teamColor,
  board,
  categories,
  teamColors,
  teams = [],
  bonusPoints = {},
  teamScore,
  opponentScore,
  answer,
  showAnswer,
  coinFlipDone = false,
  coinFlipWinnerName,
  coinFlipWinnerTeamId,
  gameStarted = false,
}: PlayerConnect4Props) {
  const DEFAULT_CATEGORIES = ['Movies', 'Pop Culture', 'Current Events', 'Science & Tech'];
  const columnThemes =
    categories && categories.length === 4 ? categories : DEFAULT_CATEGORIES;
  const winnerColor = coinFlipWinnerTeamId ? teamColors?.[coinFlipWinnerTeamId] : undefined;
  const isWinner = !!coinFlipWinnerTeamId && coinFlipWinnerTeamId === teamId;

  const allAnswered = board.length
    ? board.every(row =>
        row.every(cell => cell.team !== null || cell.points === 0)
      )
    : false;

  if (allAnswered && gameStarted && teams.length > 0) {
    const teamStats = teams.map(team => {
      const claimed = board.flat().filter(cell => cell.team === team.id).length;
      const basePoints = board.flat().filter(cell => cell.team === team.id).reduce((sum, cell) => sum + (cell.points || 0), 0);
      const bonus = bonusPoints[team.id] || 0;
      return {
        id: team.id,
        name: team.name,
        color: team.color,
        claimed,
        basePoints,
        totalPoints: basePoints + bonus,
        bonus,
      };
    }).sort((a, b) => b.totalPoints - a.totalPoints);

    return (
      <div className="space-y-6">
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6 text-center">
            <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-3" />
            <h2 className="text-3xl font-bold text-white mb-2">Round Complete!</h2>
            {teamStats[0] && (
              <div
                className="inline-block text-xl font-bold px-6 py-2 rounded-full"
                style={{ backgroundColor: teamStats[0].color }}
              >
                {teamStats[0].name} leads
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          {teamStats.map(team => (
            <Card key={team.id} className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                    <div className="text-white font-bold">{team.name}</div>
                  </div>
                  <div className="text-white font-bold text-lg">{team.totalPoints} pts</div>
                </div>
                <div className="text-sm text-blue-200 flex items-center justify-between">
                  <span>{team.claimed} squares claimed</span>
                  <span>{team.basePoints} pts</span>
                </div>
                {team.bonus > 0 && (
                  <div className="text-sm text-yellow-300 flex items-center justify-between">
                    <span>Bonus</span>
                    <span>+{team.bonus} pts</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!coinFlipDone && (
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-4 pb-4 text-center">
            <div className="text-4xl mb-2">🪙</div>
            <h3 className="text-xl font-bold text-white mb-1">Coin Flip</h3>
            <p className="text-blue-200 text-sm">Host will toss a coin to pick the starting team.</p>
          </CardContent>
        </Card>
      )}
      {coinFlipDone && !gameStarted && (
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6 pb-6 text-center">
            <div className="text-4xl mb-3">{isWinner ? '🎉' : '😕'}</div>
            <h3 className="text-2xl font-bold text-white mb-3">Coin Flip Winner</h3>
            <div
              className="inline-flex items-center justify-center px-6 py-3 rounded-full text-white text-xl font-bold"
              style={{
                backgroundColor: winnerColor || 'rgba(59, 130, 246, 0.6)',
                border: '2px solid rgba(255,255,255,0.3)',
              }}
            >
              {coinFlipWinnerName || 'Winner Selected'}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Score Display */}
      {coinFlipDone && gameStarted && (
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-around">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{teamScore}</div>
                <div className="text-xs text-blue-200">Your Squares</div>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{opponentScore}</div>
                <div className="text-xs text-blue-200">Opponent</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Player Board Display (match host styling, no controls) */}
      {coinFlipDone && gameStarted && (
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-white">Game Board</h3>
              <p className="text-xs text-blue-200">Watch the main screen for full view</p>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mb-2 max-w-lg mx-auto">
              {columnThemes.map((category, idx) => {
                const hasAvailableSquares = board.length
                  ? board.some(row => {
                      const cell = row[idx];
                      if (!cell) return false;
                      const isAnswered = cell.team !== null || cell.points === 0;
                      return !isAnswered;
                    })
                  : true;
                return (
                  <div
                    key={category}
                    className={`text-center text-white font-bold text-xs py-2 rounded-t-lg transition-all ${
                      selectedColumn === idx
                        ? 'bg-yellow-500/70 ring-2 ring-yellow-400'
                        : hasAvailableSquares
                        ? 'bg-blue-600/50'
                        : 'bg-gray-600/30 opacity-50'
                    }`}
                  >
                    {category}
                    {!hasAvailableSquares && (
                      <div className="text-[8px] text-gray-400">Full</div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-4 gap-1.5 max-w-lg mx-auto">
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const isSelected =
                    selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex;
                  const isSelectedColumn =
                    selectedColumn !== undefined &&
                    selectedColumn !== null &&
                    selectedColumn === colIndex;
                  const isAnswered = cell.team !== null || cell.points === 0;
                  const cellTeamColor = cell.team ? teamColors?.[cell.team] : undefined;
                  const showColumnHighlight = isSelectedColumn && !question && !isAnswered;

                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`aspect-square rounded-lg border-2 transition-all flex flex-col items-center justify-center ${
                        isSelected
                          ? 'ring-4 ring-yellow-400'
                          : showColumnHighlight
                          ? 'ring-2 ring-yellow-400/60'
                          : ''
                      }`}
                      style={{
                        backgroundColor: isAnswered
                          ? cell.team
                            ? cellTeamColor || '#3B82F6'
                            : 'rgba(100, 100, 100, 0.5)'
                          : showColumnHighlight
                          ? 'rgba(255, 255, 0, 0.15)'
                          : 'rgba(255,255,255,0.1)',
                        borderColor: isAnswered
                          ? cell.team
                            ? cellTeamColor || '#3B82F6'
                            : 'rgba(150, 150, 150, 0.5)'
                          : showColumnHighlight
                          ? 'rgba(255, 255, 0, 0.5)'
                          : 'rgba(255,255,255,0.2)',
                        opacity:
                          selectedColumn !== null && !isSelectedColumn && !isAnswered ? 0.4 : 1,
                      }}
                    >
                      {!isAnswered && (
                        <span className="text-2xl font-bold text-white">{cell.points}</span>
                      )}
                      {isAnswered && cell.team && (
                        <span className="text-lg font-bold text-white">{cell.points}</span>
                      )}
                      {isAnswered && !cell.team && (
                        <X className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Question */}
      {question && yourTurn && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border-white/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-300" />
                  <span className="text-sm text-blue-300 font-bold">YOUR TURN</span>
                </div>
                {pointValue && (
                  <div className="flex items-center gap-2 text-yellow-400 font-bold">
                    <Trophy className="h-4 w-4" />
                    {pointValue} pts
                  </div>
                )}
              </div>
              <div className="text-xl text-white font-medium leading-relaxed">
                {question}
              </div>
            </CardContent>
          </Card>
        </motion.div>
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

      {/* Turn Indicator */}
      {coinFlipDone && gameStarted && (
        yourTurn ? (
          <Card className="bg-green-500/20 backdrop-blur-xl border-green-500/50">
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <div className="text-4xl mb-2">✅</div>
                <h3 className="text-xl font-bold text-white mb-1">Your Team's Turn!</h3>
                <p className="text-green-200 text-sm">
                  Select the available category
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <div className="text-4xl mb-2">⏳</div>
                <h3 className="text-xl font-bold text-white mb-1">Other Team's Turn</h3>
                <p className="text-blue-200 text-sm">
                  Watch the main screen - you may get a steal opportunity!
                </p>
              </div>
            </CardContent>
          </Card>
        )
      )}

      {/* Game Rules Reminder */}
      <Card className="bg-white/5 backdrop-blur-xl border-white/10">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm text-white">
              <p className="font-bold text-blue-300">How to Play:</p>
              <ul className="space-y-1 text-blue-100">
                <li>• Answer correctly to claim the square</li>
                <li>• Wrong answer? Other team can steal!</li>
                <li>• Higher point squares = harder questions</li>
                <li>• Get 4 in a row for bonus points!</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}