import { useEffect, useMemo, useState } from 'react';
import { Team, Difficulty, Question } from '@/app/types/game';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { getRandomQuestion, triviaQuestions } from '@/app/data/questions';
import { Trophy, Check, X, SkipForward } from 'lucide-react';
import { motion } from 'motion/react';
import { updateGameState } from '@/services/gameService';
import { useGameSync } from '@/hooks/useGameSync';
import { GeneratedQuestions } from '@/app/utils/questionGenerator';

interface Connect4Props {
  teams: Team[];
  difficulty: Difficulty;
  onUpdateScore: (teamId: string, points: number) => void;
  onComplete: () => void;
  gameId?: string | null;
  questions?: GeneratedQuestions['connect4'];
}

interface BoardCell {
  answered: boolean;
  teamId: string | null;
  points: number;
}

const DEFAULT_CATEGORIES = ['Movies', 'Pop Culture', 'Current Events', 'Science & Tech'];
const POINT_VALUES = [25, 50, 75, 100];

export function Connect4({
  teams,
  difficulty,
  onUpdateScore,
  onComplete,
  gameId,
  questions,
}: Connect4Props) {
  const { gameState } = useGameSync(gameId);
  const [coinFlipDone, setCoinFlipDone] = useState(false);
  const [coinFlipWinner, setCoinFlipWinner] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<string | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<number | null>(null);
  const [showColumnChoice, setShowColumnChoice] = useState(false);
  const [stolenColumn, setStolenColumn] = useState<number | null>(null);
  const [board, setBoard] = useState<BoardCell[][]>(
    Array(4).fill(null).map(() =>
      Array(4).fill(null).map(() => ({
        answered: false,
        teamId: null,
        points: 0,
      }))
    )
  );
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [stealAvailable, setStealAvailable] = useState(false);
  const [incorrectTeam, setIncorrectTeam] = useState<string | null>(null);
  const [questionsAnsweredInColumn, setQuestionsAnsweredInColumn] = useState(0);
  const [originalTeamForColumn, setOriginalTeamForColumn] = useState<string | null>(null);
  const [isStealScenario, setIsStealScenario] = useState(false);
  const [continuedWithStolenColumn, setContinuedWithStolenColumn] = useState(false);
  const [teamBonusPoints, setTeamBonusPoints] = useState<Record<string, number>>({});

  const questionMap = useMemo(() => {
    const map = new Map<string, Question>();
    questions?.forEach(item => {
      map.set(`${item.row}-${item.column}`, item.question as Question);
    });
    return map;
  }, [questions]);

  const columnThemes = useMemo(() => {
    const themes: Array<string | null> = new Array(4).fill(null);
    questions?.forEach(item => {
      if (!themes[item.column]) {
        themes[item.column] = item.question.category || DEFAULT_CATEGORIES[item.column];
      }
    });
    return themes.map((theme, index) => theme || DEFAULT_CATEGORIES[index]);
  }, [questions]);

  useEffect(() => {
    if (!gameId) return;
    const boardPayload = board.map((row, rowIndex) =>
      row.map(cell => ({
        team: cell.teamId,
        points: cell.answered ? cell.points : POINT_VALUES[rowIndex],
      }))
    );
    const roundData = {
      ...(gameState?.round_data || {}),
      connect4: {
        question: currentQuestion?.text || null,
        selected_column: selectedColumn,
        selected_square: selectedCell,
        point_value: selectedCell ? POINT_VALUES[selectedCell.row] : null,
        board: boardPayload,
        column_themes: columnThemes,
        team_bonus_points: teamBonusPoints,
        team_score: board.flat().filter(c => c.teamId === currentTeam).length,
        opponent_score: board.flat().filter(c => c.teamId && c.teamId !== currentTeam).length,
        coin_flip_done: coinFlipDone,
        coin_flip_winner_team_id: coinFlipWinner,
        game_started: gameStarted,
      },
    };
    updateGameState(gameId, {
      current_turn_team_id: currentTeam,
      round_data: roundData,
    }).catch(() => undefined);
  }, [gameId, gameState, board, selectedCell, currentQuestion, currentTeam]);

  const handleCoinFlip = () => {
    const winner = teams[Math.floor(Math.random() * teams.length)];
    setCoinFlipWinner(winner.id);
    setCoinFlipDone(true);
  };

  const handleStartChoice = (goFirst: boolean) => {
    if (!coinFlipWinner) return;
    
    if (goFirst) {
      setCurrentTeam(coinFlipWinner);
    } else {
      const otherTeam = teams.find(t => t.id !== coinFlipWinner);
      setCurrentTeam(otherTeam?.id || teams[0].id);
    }
    setGameStarted(true);
  };

  const selectCell = (row: number, col: number) => {
    if (board[row][col].answered || currentQuestion) return;
    
    // If no column selected yet, they must choose a column first
    if (selectedColumn === null) return;
    
    // Can only select from the chosen column
    if (col !== selectedColumn) return;

    const category = columnThemes[col];
    const points = POINT_VALUES[row];

    const question =
      questionMap.get(`${row}-${col}`) || getRandomQuestion(triviaQuestions, difficulty);
    
    setSelectedCell({ row, col });
    setCurrentQuestion({
      ...question,
      category,
    });
    setShowAnswer(false);
  };
  
  const handleColumnSelect = (colIndex: number) => {
    // Check if column still has available squares
    const hasAvailableSquares = board.some(row => !row[colIndex].answered);
    if (!hasAvailableSquares) return;
    
    setSelectedColumn(colIndex);
    // Reset tracking when new column is selected
    setQuestionsAnsweredInColumn(0);
    setOriginalTeamForColumn(currentTeam);
    setIsStealScenario(false);
  };

  const handleCorrect = () => {
    if (!selectedCell || !currentQuestion || !currentTeam) return;

    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    newBoard[selectedCell.row][selectedCell.col] = {
      answered: true,
      teamId: currentTeam,
      points: POINT_VALUES[selectedCell.row],
    };

    onUpdateScore(currentTeam, POINT_VALUES[selectedCell.row]);
    setBoard(newBoard);
    
    // Check for row/column bonus
    checkForBonus(currentTeam, selectedCell.row, selectedCell.col, newBoard);
    
    // Increment questions answered in this column
    const newCount = questionsAnsweredInColumn + 1;
    setQuestionsAnsweredInColumn(newCount);

    // Check if board is complete
    const allAnswered = board.every(row => row.every(cell => cell.answered));
    if (allAnswered) {
      return;
    }

    // Check if current column is complete
    const columnComplete = selectedColumn !== null && newBoard.every(row => row[selectedColumn].answered);
    
    // Reset question state
    setSelectedCell(null);
    setCurrentQuestion(null);
    setShowAnswer(false);
    
    if (columnComplete) {
      // Column is complete
      if (continuedWithStolenColumn || (originalTeamForColumn && currentTeam !== originalTeamForColumn)) {
        // Team finished a stolen column - they get to pick a new category
        setSelectedColumn(null);
        setQuestionsAnsweredInColumn(0);
        setOriginalTeamForColumn(currentTeam); // They are now the "original" team for the next category
        setContinuedWithStolenColumn(false);
        setIsStealScenario(false);
        // Turn continues with current team
      } else if (currentTeam === originalTeamForColumn) {
        // Original team completed all 4 questions in their chosen column - switch turn
        switchTurn();
        setQuestionsAnsweredInColumn(0);
        setOriginalTeamForColumn(null);
        setIsStealScenario(false);
      } else {
        // If no original team tracked, default to switching turns
        switchTurn();
        setQuestionsAnsweredInColumn(0);
        setOriginalTeamForColumn(null);
        setIsStealScenario(false);
      }
    } else if (newCount >= 4) {
      // Team answered 4 questions but column isn't complete (some were stolen by other team)
      // Switch turn
      switchTurn();
      setQuestionsAnsweredInColumn(0);
      setOriginalTeamForColumn(null);
      setIsStealScenario(false);
      setContinuedWithStolenColumn(false);
    }
    // Otherwise, continue with same team selecting next question in the same column
  };

  const handleIncorrect = () => {
    if (!currentTeam) return;
    
    setIncorrectTeam(currentTeam);
    setStealAvailable(true);
    setIsStealScenario(true);
    setShowAnswer(false);
  };

  const handleSkip = () => {
    if (!stealAvailable) {
      // First team skipping - offer to opposing team
      setIncorrectTeam(currentTeam);
      setStealAvailable(true);
      setShowAnswer(false);
    } else {
      // Both teams skipped - mark with X and switch turn
      handleBothFailed();
    }
  };

  const handleStealCorrect = () => {
    if (!selectedCell || !currentQuestion) return;
    
    const stealingTeam = teams.find(t => t.id !== incorrectTeam);
    if (!stealingTeam) return;

    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    newBoard[selectedCell.row][selectedCell.col] = {
      answered: true,
      teamId: stealingTeam.id,
      points: POINT_VALUES[selectedCell.row],
    };

    onUpdateScore(stealingTeam.id, POINT_VALUES[selectedCell.row]);
    setBoard(newBoard);
    setStealAvailable(false);
    
    // Check for row/column bonus
    checkForBonus(stealingTeam.id, selectedCell.row, selectedCell.col, newBoard);
    
    // Stealing team keeps the turn
    setCurrentTeam(stealingTeam.id);
    
    // Check if the stolen column is now complete
    const columnComplete = newBoard.every(row => row[selectedCell.col].answered);
    
    // Reset question state
    setSelectedCell(null);
    setCurrentQuestion(null);
    setShowAnswer(false);
    
    if (columnComplete) {
      // Column is complete - automatically give them a new category choice
      setSelectedColumn(null);
      setShowColumnChoice(false);
      setStolenColumn(null);
      setQuestionsAnsweredInColumn(0);
      setOriginalTeamForColumn(stealingTeam.id);
      setIsStealScenario(false);
      setContinuedWithStolenColumn(false);
    } else {
      // Store the column they just stole from
      setStolenColumn(selectedCell.col);
      // Clear selected column and show them the choice
      setSelectedColumn(null);
      setShowColumnChoice(true);
    }
  };
  
  const handleContinueStolenColumn = () => {
    setSelectedColumn(stolenColumn);
    setShowColumnChoice(false);
    setStolenColumn(null);
    setSelectedCell(null);
    setCurrentQuestion(null);
    setShowAnswer(false);
    setContinuedWithStolenColumn(true);
  };
  
  const handlePickNewColumn = () => {
    setSelectedColumn(null);
    setShowColumnChoice(false);
    setStolenColumn(null);
    setSelectedCell(null);
    setCurrentQuestion(null);
    setShowAnswer(false);
  };
  
  const handleStealIncorrect = () => {
    if (!selectedCell) return;

    // Mark the cell with X (no one gets it)
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    newBoard[selectedCell.row][selectedCell.col] = {
      answered: true,
      teamId: null,
      points: 0,
    };

    setBoard(newBoard);
    setStealAvailable(false);
    
    // Reset question state
    setSelectedCell(null);
    setCurrentQuestion(null);
    setShowAnswer(false);
    
    // Turn goes back to the original team that selected the category
    if (originalTeamForColumn && originalTeamForColumn !== currentTeam) {
      setCurrentTeam(originalTeamForColumn);
      setSelectedColumn(null);
      setQuestionsAnsweredInColumn(0);
      setOriginalTeamForColumn(null);
      setIsStealScenario(false);
    } else {
      // If no original team tracked, just switch turn
      switchTurn();
    }
  };

  const handleBothFailed = () => {
    if (!selectedCell) return;

    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    newBoard[selectedCell.row][selectedCell.col] = {
      answered: true,
      teamId: null,
      points: 0,
    };

    setBoard(newBoard);
    setStealAvailable(false);
    
    // Reset question state
    setSelectedCell(null);
    setCurrentQuestion(null);
    setShowAnswer(false);
    
    // Switch turn to the other team
    switchTurn();
  };

  const switchTurn = () => {
    const currentIndex = teams.findIndex(t => t.id === currentTeam);
    const nextTeam = teams[(currentIndex + 1) % teams.length];
    setCurrentTeam(nextTeam.id);
    
    // Reset column selection for new team
    setSelectedColumn(null);
  };

  const checkForBonus = (teamId: string, row: number, col: number, board: BoardCell[][]) => {
    let bonusPoints = 0;
    
    // Check if the row is complete (all 4 cells in this row belong to this team)
    const rowComplete = board[row].every(cell => cell.teamId === teamId);
    if (rowComplete) {
      onUpdateScore(teamId, 150);
      bonusPoints += 150;
    }
    
    // Check if the column is complete (all 4 cells in this column belong to this team)
    const columnComplete = board.every(rowArr => rowArr[col].teamId === teamId);
    if (columnComplete) {
      onUpdateScore(teamId, 150);
      bonusPoints += 150;
    }
    
    // Track bonus points
    if (bonusPoints > 0) {
      setTeamBonusPoints(prev => ({
        ...prev,
        [teamId]: (prev[teamId] || 0) + bonusPoints
      }));
    }
    
    return bonusPoints > 0;
  };
  
  const handleNextQuestion = () => {
    setSelectedCell(null);
    setCurrentQuestion(null);
    setShowAnswer(false);

    // Check if board is complete
    const allAnswered = board.every(row => row.every(cell => cell.answered));
    if (allAnswered) {
      return; // Will show completion screen
    }

    // If it's the first turn, switch after one question
    if (gameStarted && !currentTeam) {
      switchTurn();
    }
    // Otherwise, only switch if they answered incorrectly/skipped (already handled)
  };

  const currentTeamData = teams.find(t => t.id === currentTeam);
  const coinFlipWinnerData = teams.find(t => t.id === coinFlipWinner);

  // Check if game is complete
  const allAnswered = board.every(row => row.every(cell => cell.answered));
  if (allAnswered && gameStarted) {
    const teamStats: { [key: string]: { squares: number; basePoints: number; bonusPoints: number } } = {};
    teams.forEach(t => teamStats[t.id] = { squares: 0, basePoints: 0, bonusPoints: 0 });
    
    board.forEach(row => {
      row.forEach(cell => {
        if (cell.teamId) {
          teamStats[cell.teamId].squares++;
          teamStats[cell.teamId].basePoints += cell.points;
        }
      });
    });
    
    // Add bonus points
    teams.forEach(team => {
      teamStats[team.id].bonusPoints = teamBonusPoints[team.id] || 0;
    });

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Trophy className="h-20 w-20 text-yellow-400 mb-6" />
        <h2 className="text-4xl font-bold text-white mb-6">Round Complete!</h2>
        <div className="space-y-4 mb-8 max-w-2xl w-full">
          {teams.map(team => {
            const stats = teamStats[team.id];
            const totalPoints = stats.basePoints + stats.bonusPoints;
            
            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-lg p-4"
                style={{ backgroundColor: `${team.color}40`, borderLeft: `4px solid ${team.color}` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                    <span className="text-2xl font-bold text-white">{team.name}</span>
                  </div>
                  <span className="text-3xl font-bold text-white">{totalPoints} pts</span>
                </div>
                <div className="ml-9 space-y-1">
                  <div className="flex justify-between text-blue-200">
                    <span>{stats.squares} squares claimed</span>
                    <span className="font-mono">{stats.basePoints} pts</span>
                  </div>
                  {stats.bonusPoints > 0 && (
                    <div className="flex justify-between text-yellow-300">
                      <span>🎉 Bonus (rows/columns)</span>
                      <span className="font-mono">+{stats.bonusPoints} pts</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
        <Button onClick={onComplete} size="lg">
          Next Round
        </Button>
      </div>
    );
  }

  // Coin flip screen
  if (!coinFlipDone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <h2 className="text-4xl font-bold text-white mb-4">🎯 Connect 4 Trivia</h2>
        <p className="text-xl text-blue-200 mb-4">Time for the coin flip!</p>
        <Button onClick={handleCoinFlip} size="lg" className="text-2xl px-12 py-8">
          Flip Coin
        </Button>
      </div>
    );
  }

  // Choice screen (winner chooses to go first or second)
  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <h2 className="text-4xl font-bold text-white mb-4">Coin Flip Winner!</h2>
        <div
          className="text-3xl font-bold px-8 py-4 rounded-full mb-4"
          style={{ backgroundColor: coinFlipWinnerData?.color }}
        >
          {coinFlipWinnerData?.name}
        </div>
        <p className="text-xl text-blue-200 mb-4">Choose to go first or second:</p>
        <div className="flex gap-4">
          <Button onClick={() => handleStartChoice(true)} size="lg" className="text-xl px-8 py-6">
            Go First
          </Button>
          <Button onClick={() => handleStartChoice(false)} size="lg" className="text-xl px-8 py-6">
            Go Second
          </Button>
        </div>
        <p className="text-sm text-blue-300 mt-4 max-w-md text-center">
          Note: Each turn, choose ONE theme and answer questions from that column only. Keep your turn until you answer incorrectly or skip.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">🎯 Connect 4 Trivia</h2>
        <p className="text-blue-200 mb-4">Answer questions to claim squares!</p>
        <div
          className="inline-block text-xl font-bold px-6 py-3 rounded-full"
          style={{ backgroundColor: currentTeamData?.color }}
        >
          {currentTeamData?.name}'s Turn
        </div>
      </div>

      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="pt-6">
          {/* Post-Steal Column Choice */}
          {showColumnChoice && stolenColumn !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 text-center"
            >
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-6">
                <p className="text-white font-bold text-xl mb-4">
                  🎉 Great steal, {currentTeamData?.name}!
                </p>
                <p className="text-blue-200 mb-6">
                  Would you like to continue with <strong>{columnThemes[stolenColumn]}</strong> or pick a new theme?
                </p>
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={handleContinueStolenColumn}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Continue with {columnThemes[stolenColumn]}
                  </Button>
                  <Button
                    onClick={handlePickNewColumn}
                    size="lg"
                    variant="outline"
                    className="border-white/30 bg-transparent text-white hover:bg-white/10"
                  >
                    Pick New Theme
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Column Selection */}
          {!currentQuestion && selectedColumn === null && !showColumnChoice && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <p className="text-center text-white font-bold mb-3">
                {currentTeamData?.name}, click a theme column below to start your turn:
              </p>
            </motion.div>
          )}
          
          {/* Selected theme indicator */}
          {selectedColumn !== null && !currentQuestion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 text-center"
            >
              <div className="inline-block bg-blue-600/50 px-6 py-2 rounded-lg">
                <span className="text-white font-bold">
                  Selected Theme: {columnThemes[selectedColumn]}
                </span>
              </div>
            </motion.div>
          )}
          
          {/* Category headers - CLICKABLE */}
          <div className="grid grid-cols-4 gap-1.5 mb-2 max-w-lg mx-auto">
            {columnThemes.map((category, idx) => {
              const hasAvailableSquares = board.some(row => !row[idx].answered);
              const isSelectable = selectedColumn === null && !currentQuestion && !showColumnChoice && hasAvailableSquares;
              
              return (
                <motion.button
                  key={idx}
                  onClick={() => {
                    if (isSelectable) {
                      setSelectedColumn(idx);
                    }
                  }}
                  disabled={!isSelectable}
                  whileHover={isSelectable ? { scale: 1.05, y: -2 } : {}}
                  whileTap={isSelectable ? { scale: 0.95 } : {}}
                  className={`text-center text-white font-bold text-xs py-2 rounded-t-lg transition-all ${
                    selectedColumn === idx
                      ? 'bg-yellow-500/70 ring-2 ring-yellow-400'
                      : isSelectable
                      ? 'bg-blue-600/70 hover:bg-blue-500/80 cursor-pointer'
                      : hasAvailableSquares
                      ? 'bg-blue-600/50'
                      : 'bg-gray-600/30 opacity-50'
                  }`}
                >
                  {category}
                  {!hasAvailableSquares && (
                    <div className="text-[8px] text-gray-400">Full</div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Game board */}
          <div className="grid grid-cols-4 gap-1.5 mb-6 max-w-lg mx-auto">
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const cellTeam = teams.find(t => t.id === cell.teamId);
                const isSelected =
                  selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                const isInSelectedColumn = selectedColumn === colIndex;
                const isSelectable = !cell.answered && isInSelectedColumn && !currentQuestion;
                const points = POINT_VALUES[rowIndex];

                return (
                  <motion.button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => selectCell(rowIndex, colIndex)}
                    className={`aspect-square rounded-lg border-2 transition-all flex flex-col items-center justify-center ${
                      isSelected
                        ? 'ring-4 ring-yellow-400'
                        : isSelectable
                        ? 'hover:border-yellow-400 hover:ring-2 hover:ring-yellow-400/50'
                        : 'hover:border-white/50'
                    }`}
                    style={{
                      backgroundColor: cell.answered
                        ? cell.teamId
                          ? cellTeam?.color
                          : 'rgba(100, 100, 100, 0.5)'
                        : isSelectable
                        ? 'rgba(255, 255, 0, 0.15)'
                        : 'rgba(255,255,255,0.1)',
                      borderColor: cell.answered
                        ? cell.teamId
                          ? cellTeam?.color
                          : 'rgba(150, 150, 150, 0.5)'
                        : isSelectable
                        ? 'rgba(255, 255, 0, 0.5)'
                        : 'rgba(255,255,255,0.2)',
                      opacity: selectedColumn !== null && !isInSelectedColumn && !cell.answered ? 0.4 : 1,
                    }}
                    whileHover={{ scale: cell.answered ? 1 : isSelectable ? 1.1 : 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={cell.answered || currentQuestion !== null || !isSelectable}
                  >
                    {!cell.answered && (
                      <span className="text-2xl font-bold text-white">{points}</span>
                    )}
                    {cell.answered && cell.teamId && (
                      <span className="text-lg font-bold text-white">{points}</span>
                    )}
                    {cell.answered && !cell.teamId && (
                      <X className="h-8 w-8 text-gray-400" />
                    )}
                  </motion.button>
                );
              })
            )}
          </div>

          {currentQuestion && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
                <div className="text-xs text-blue-300 mb-1 uppercase">
                  {currentQuestion.category} - {selectedCell && POINT_VALUES[selectedCell.row]} points
                </div>
                <div className="text-xl text-white mb-2">
                  {currentQuestion.text}
                </div>
                
                {/* Host Answer - Always Visible */}
                <div className="mt-3 pt-3 border-t border-blue-400/30">
                  <div className="text-sm text-blue-300">
                    <strong>Answer (Host Only):</strong> {currentQuestion.answer}
                  </div>
                </div>

                {showAnswer && (
                  <div className="mt-3 pt-3 border-t border-green-400/30">
                    <div className="text-sm text-green-300">
                      <strong>Answer:</strong> {currentQuestion.answer}
                    </div>
                  </div>
                )}
              </div>

              {!showAnswer && !stealAvailable && (
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={handleCorrect}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="mr-2 h-5 w-5" />
                    Correct (+{selectedCell && POINT_VALUES[selectedCell.row]})
                  </Button>
                  <Button
                    onClick={handleIncorrect}
                    size="lg"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <X className="mr-2 h-5 w-5" />
                    Incorrect
                  </Button>
                  <Button
                    onClick={handleSkip}
                    size="lg"
                    variant="outline"
                  >
                    <SkipForward className="mr-2 h-5 w-5" />
                    Skip
                  </Button>
                </div>
              )}

              {!showAnswer && stealAvailable && (
                <div className="space-y-4">
                  <p className="text-center text-yellow-400 font-bold text-xl">
                    Steal Opportunity for {teams.find(t => t.id !== incorrectTeam)?.name}!
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={handleStealCorrect}
                      size="lg"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="mr-2 h-5 w-5" />
                      Correct (+{selectedCell && POINT_VALUES[selectedCell.row]})
                    </Button>
                    <Button
                      onClick={handleStealIncorrect}
                      size="lg"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <X className="mr-2 h-5 w-5" />
                      Incorrect
                    </Button>
                    <Button
                      onClick={handleSkip}
                      size="lg"
                      variant="outline"
                    >
                      <SkipForward className="mr-2 h-5 w-5" />
                      Skip
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {!currentQuestion && (
            <div className="text-center text-white/70">
              Select a square to answer a question
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {teams.map(team => {
          const squaresClaimed = board.flat().filter(c => c.teamId === team.id).length;
          const totalPoints = board.flat()
            .filter(c => c.teamId === team.id)
            .reduce((sum, c) => sum + c.points, 0);
          
          return (
            <Card key={team.id} className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="pt-6">
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: `${team.color}30` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                    <span className="text-white font-bold">{team.name}</span>
                  </div>
                  <div className="text-sm text-blue-200">
                    {squaresClaimed} squares claimed
                  </div>
                  <div className="text-sm text-blue-200">
                    {totalPoints} points this round
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}