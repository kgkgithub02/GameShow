import { useEffect, useMemo, useState } from 'react';
import { Team, BlindDrawState, Difficulty } from '@/app/types/game';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Timer } from '@/app/components/Timer';
import { getRandomDrawWord } from '@/app/data/questions';
import { Pencil, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import { updateGameState } from '@/services/gameService';
import { useGameSync } from '@/hooks/useGameSync';

interface BlindDrawProps {
  teams: Team[];
  difficulty: Difficulty;
  onUpdateScore: (teamId: string, points: number) => void;
  onComplete: () => void;
  gameId?: string | null;
  words?: string[];
  durationSeconds?: number;
}

export function BlindDraw({
  teams,
  difficulty,
  onUpdateScore,
  onComplete,
  gameId,
  words,
  durationSeconds,
}: BlindDrawProps) {
  const { gameState, players } = useGameSync(gameId);
  const roundSeconds = Math.max(durationSeconds || 60, 1);
  const [state, setState] = useState<BlindDrawState>({
    currentWord: null,
    drawingTeam: null,
    timeRemaining: roundSeconds,
    isActive: false,
    guessedCorrectly: false,
  });
  const [phase, setPhase] = useState<'prep' | 'drawing' | 'judging' | 'complete'>('prep');
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [result, setResult] = useState<'guessed' | 'missed' | null>(null);
  const [drawerPlayerId, setDrawerPlayerId] = useState<string | null>(null);

  useEffect(() => {
    if (!state.isActive) return;
    const interval = window.setInterval(() => {
      setState(prev => {
        if (!prev.isActive) return prev;
        const next = Math.max(prev.timeRemaining - 1, 0);
        return next === 0 ? { ...prev, timeRemaining: 0, isActive: false } : { ...prev, timeRemaining: next };
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [state.isActive]);

  useEffect(() => {
    if (!state.isActive && phase === 'drawing' && state.timeRemaining === 0) {
      setPhase('judging');
    }
  }, [state.isActive, state.timeRemaining, phase]);

  useEffect(() => {
    if (!gameId) return;
    const roundPhase = phase === 'prep' ? 'drawing' : phase;
    const roundData = {
      ...(gameState?.round_data || {}),
      blind_draw: {
        word: state.currentWord,
        drawer_team_id: state.drawingTeam,
        drawer_player_id: drawerPlayerId,
        time_remaining: state.timeRemaining,
        total_time: roundSeconds,
        phase: roundPhase,
        result: result,
      },
    };
    updateGameState(gameId, {
      current_turn_team_id: state.drawingTeam,
      round_data: roundData,
    }).catch(() => undefined);
  }, [gameId, gameState, state.currentWord, state.timeRemaining, state.isActive, state.guessedCorrectly, state.drawingTeam, drawerPlayerId, phase, result, roundSeconds]);

  const startDrawing = () => {
    const word =
      words && words.length
        ? words[wordIndex % words.length]
        : getRandomDrawWord(difficulty);
    setState({
      currentWord: word,
      drawingTeam: teams[currentTeamIndex].id,
      timeRemaining: roundSeconds,
      isActive: false,
      guessedCorrectly: false,
    });
    setPhase('drawing');
    setResult(null);
    setWordIndex(prev => prev + 1);
  };

  const startTimer = () => {
    setState(prev => ({ ...prev, isActive: true }));
  };

  const handleGuessed = () => {
    if (!state.drawingTeam) return;
    onUpdateScore(state.drawingTeam, 200);
    setResult('guessed');
    setState(prev => ({ ...prev, isActive: false }));
    setPhase('complete');
  };

  const handleMissed = () => {
    setResult('missed');
    setState(prev => ({ ...prev, isActive: false }));
    setPhase('complete');
  };

  const nextRound = () => {
    const nextIndex = (currentTeamIndex + 1) % teams.length;
    setCurrentTeamIndex(nextIndex);
    
    if (nextIndex === 0) {
      setRoundsCompleted(prev => prev + 1);
    }
    
    setState({
      currentWord: null,
      drawingTeam: null,
      timeRemaining: roundSeconds,
      isActive: false,
      guessedCorrectly: false,
    });
    setPhase('prep');
    setResult(null);
    setDrawerPlayerId(null);
  };

  const drawingTeam = teams.find(t => t.id === state.drawingTeam);
  const currentTeam = teams[currentTeamIndex];
  const teamPlayers = useMemo(
    () => players.filter(player => player.team_id === currentTeam?.id),
    [players, currentTeam]
  );

  if (roundsCompleted >= 2) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Trophy className="h-20 w-20 text-yellow-400 mb-6" />
        <h2 className="text-4xl font-bold text-white mb-4">Blind Draw Complete!</h2>
        <p className="text-xl text-blue-200 mb-8">All teams have drawn</p>
        <Button onClick={onComplete} size="lg">
          Next Round
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">🎨 Blind Draw</h2>
        <p className="text-blue-200">Draw while blindfolded - can your team guess?</p>
        {state.drawingTeam && (
          <div className="mt-4">
            <div
              className="inline-block text-xl font-bold px-6 py-3 rounded-full"
              style={{ backgroundColor: drawingTeam?.color }}
            >
              {drawingTeam?.name} is Drawing
            </div>
          </div>
        )}
      </div>

      {phase === 'prep' && (
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="pt-6">
              <Pencil className="h-16 w-16 text-purple-400 mx-auto mb-4" />
              <div className="text-center mb-6">
                <p className="text-white text-lg mb-2">
                  <strong>{currentTeam?.name}</strong> is up to draw
                </p>
                <p className="text-blue-200">
                  Select the player who will draw
                </p>
              </div>
              <div className="space-y-3 mb-6">
                {teamPlayers.length === 0 ? (
                  <div className="text-sm text-blue-200 text-center">
                    No connected players on {currentTeam?.name}.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {teamPlayers.map(player => (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => setDrawerPlayerId(player.id)}
                        className={`p-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                          drawerPlayerId === player.id
                            ? 'border-white ring-2 ring-white/40 text-white'
                            : 'border-white/30 text-blue-100'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span>{player.name}</span>
                          <span className={player.connected ? 'text-green-300' : 'text-blue-300'}>
                            {player.connected ? 'Online' : 'Left'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 mb-6">
                <h3 className="text-white font-bold mb-2">Instructions:</h3>
                <ul className="text-blue-200 space-y-1 text-sm">
                  <li>• Artist is blindfolded (use honor system)</li>
                  <li>• Team guesses aloud</li>
                  <li>• {roundSeconds} seconds to guess correctly</li>
                  <li>• Correct: +200 points</li>
                  <li>• Incorrect: 0 points</li>
                </ul>
              </div>
              <Button
                onClick={startDrawing}
                size="lg"
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
                disabled={!drawerPlayerId}
              >
                <Pencil className="mr-2 h-5 w-5" />
                Pick a Word
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {phase !== 'prep' && state.currentWord && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="pt-6 space-y-4">
                <div className="text-center space-y-3">
                  <div className="text-sm uppercase tracking-wide text-blue-200">Secret Word</div>
                  <div className="text-4xl font-bold text-white">{state.currentWord}</div>
                  <p className="text-blue-200">
                    Give this word to the drawing player.
                  </p>
                </div>
            {!state.isActive && phase === 'drawing' && (
                  <Button onClick={startTimer} size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                Start Drawing
                  </Button>
                )}
              </CardContent>
            </Card>

            {(phase === 'judging' || (phase === 'drawing' && state.isActive)) && (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="pt-6 space-y-4 text-center">
                  <div className="text-xl font-bold text-white">
                    Did the team guess the drawing?
                  </div>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={handleGuessed} size="lg" className="bg-green-600 hover:bg-green-700">
                      Guessed (+200)
                    </Button>
                    <Button onClick={handleMissed} size="lg" className="bg-red-600 hover:bg-red-700">
                      Not Guessed
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {phase === 'complete' && (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="pt-6 text-center space-y-4">
                  <div className="text-2xl font-bold text-white">
                    {result === 'guessed' ? '✓ Correct! +200 points' : 'No points awarded'}
                  </div>
                  <Button onClick={nextRound} size="lg" className="bg-blue-600 text-white hover:bg-blue-700">
                    Next Team
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            {phase === 'drawing' && state.isActive && (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="pt-6 flex flex-col items-center">
                  <Timer
                    seconds={roundSeconds}
                    value={state.timeRemaining}
                    running={state.isActive}
                    size="lg"
                  />
                </CardContent>
              </Card>
            )}

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="pt-6">
                <h3 className="text-white font-bold mb-4">Teams</h3>
                <div className="space-y-3">
                  {teams.map(team => (
                    <div
                      key={team.id}
                      className={`p-3 rounded-lg ${
                        team.id === state.drawingTeam ? 'ring-2 ring-white' : ''
                      }`}
                      style={{ backgroundColor: `${team.color}30` }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: team.color }}
                        />
                        <span className="text-white font-medium">{team.name}</span>
                      </div>
                      <div className="text-xs text-white/70 mt-1">
                        {team.id === state.drawingTeam ? '🎨 Drawing' : '🤔 Guessing'}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
